"""Validated, disabled-by-default adapter for the official TypeSafe Python SDK."""

from __future__ import annotations

import asyncio
import importlib
import json
import math
from dataclasses import dataclass, field
from typing import Any, Literal


@dataclass(frozen=True)
class JevConfig:
    enabled: bool = False
    api_key: str = field(default="", repr=False)
    model: str = "jev-latest"
    timeout_seconds: float = 5.0

    def __post_init__(self) -> None:
        if type(self.enabled) is not bool or not isinstance(self.api_key, str):
            raise ValueError("Invalid JEV configuration")
        if not isinstance(self.model, str) or not self.model.strip():
            raise ValueError("A model or model alias is required")
        _number(self.timeout_seconds, 0.001, 30)


@dataclass(frozen=True)
class JevResult:
    status: Literal["disabled", "unconfigured", "unavailable", "invalid-input", "timeout", "provider-error", "invalid-response", "ok"]
    answers: dict[str, dict[str, Any]] = field(default_factory=dict)
    model: str | None = None
    advisory_only: bool = True
    contract_version: str = "jev-review.v1"


def _number(value: Any, lower: float = 0, upper: float = 1) -> float:
    if type(value) not in (float, int) or not math.isfinite(value) or not lower <= value <= upper:
        raise ValueError("Invalid numeric value")
    return float(value)


def _text(value: Any) -> None:
    if not isinstance(value, str) or not value.strip() or len(value) > 8000:
        raise ValueError("Expected bounded nonempty text")


def _request(state: Any, questions: Any) -> tuple[Any, dict]:
    if not isinstance(state, (str, dict, list)) or not isinstance(questions, dict) or not 1 <= len(questions) <= 32:
        raise ValueError("Invalid state or questions")
    # Snapshot caller-owned inputs before any await, reject non-JSON/NaN values,
    # and bound the entire request (including question descriptions).
    encoded = json.dumps({"state": state, "questions": questions}, allow_nan=False)
    if len(encoded.encode("utf-8")) > 64000:
        raise ValueError("Request too large")
    snapshot = json.loads(encoded)
    for name, question in snapshot["questions"].items():
        _text(name)
        if not isinstance(question, dict) or set(question) - {"type", "instructions", "criteria"}:
            raise ValueError("Invalid question")
        _text(question.get("instructions"))
        kind, criteria = question.get("type"), question.get("criteria")
        if kind == "choice":
            if not isinstance(criteria, dict) or not 1 <= len(criteria) <= 255:
                raise ValueError("Invalid choice criteria")
            for label, description in criteria.items():
                _text(label)
                if description is not None:
                    _text(description)
        elif kind == "score":
            if not isinstance(criteria, list) or not 2 <= len(criteria) <= 10:
                raise ValueError("Invalid score criteria")
            for description in criteria:
                _text(description)
        elif kind != "noul" or "criteria" in question:
            raise ValueError("Unsupported question")
    return snapshot["state"], snapshot["questions"]


def _answers(response: Any, questions: dict) -> JevResult:
    _text(response.model)
    if not isinstance(response.answers, dict) or set(response.answers) != set(questions):
        raise ValueError("Answer names do not match request")
    answers = {}
    for name, question in questions.items():
        raw, kind = response.answers[name], question["type"]
        if raw.type != kind:
            raise ValueError("Answer type does not match request")
        if kind == "noul":
            answers[name] = {"type": kind, "value": _number(raw.noul)}
            continue
        levels = set(question["criteria"]) if kind == "choice" else set(range(len(question["criteria"])))
        if not isinstance(raw.probabilities, dict) or set(raw.probabilities) != levels:
            raise ValueError("Probability keys do not match criteria")
        probabilities = {key: _number(value) for key, value in raw.probabilities.items()}
        if not math.isclose(sum(probabilities.values()), 1, abs_tol=0.001):
            raise ValueError("Probabilities must sum to one")
        if kind == "choice":
            if not isinstance(raw.choice, str) or raw.choice not in levels:
                raise ValueError("Unknown choice")
            value = raw.choice
        else:
            value = _number(raw.score, 0, len(levels) - 1)
        answers[name] = {"type": kind, "value": value, "confidence": _number(raw.confidence), "probabilities": probabilities}
    return JevResult(status="ok", answers=answers, model=response.model)


class JevAdapter:
    """No persistence or actions: callers decide how to display advisory results."""

    def __init__(self, config: JevConfig | None = None) -> None:
        self.config = config or JevConfig()

    async def evaluate(self, *, state: Any, questions: dict[str, dict[str, Any]]) -> JevResult:
        if not self.config.enabled:
            return JevResult(status="disabled")
        if not self.config.api_key.strip():
            return JevResult(status="unconfigured")
        try:
            state, questions = _request(state, questions)
        except (ValueError, TypeError, OverflowError, RecursionError):
            return JevResult(status="invalid-input")
        try:
            sdk = importlib.import_module("typesafe_sdk")
        except ImportError:
            return JevResult(status="unavailable")

        async def call() -> Any:
            async with sdk.AsyncTypeSafeClient(
                api_key=self.config.api_key,
                model=self.config.model,
                base_url="https://api.typesafe.ai",
                timeout=self.config.timeout_seconds,
                retry=sdk.RetryPolicy(max_retries=0),
            ) as client:
                return await client.system_one(state=state, questions=questions)

        try:
            response = await asyncio.wait_for(call(), timeout=self.config.timeout_seconds)
        except TimeoutError:
            return JevResult(status="timeout")
        except Exception:
            # SDK exceptions can contain user content or secrets. Never return them.
            return JevResult(status="provider-error")
        try:
            return _answers(response, questions)
        except (AttributeError, TypeError, ValueError, OverflowError):
            return JevResult(status="invalid-response")
