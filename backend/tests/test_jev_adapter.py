import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

import pytest

from backend.services.jev import JevAdapter, JevConfig


QUESTIONS = {
    "route": {"type": "choice", "instructions": "Select a review route", "criteria": {"review": None, "hold": None}},
    "quality": {"type": "score", "instructions": "Rate source support", "criteria": ["unsupported", "supported"]},
    "supported": {"type": "noul", "instructions": "Does the source support the claim?"},
}


def response():
    return SimpleNamespace(model="jev-test", answers={
        "route": SimpleNamespace(type="choice", choice="review", confidence=0.8, probabilities={"review": 0.9, "hold": 0.1}),
        "quality": SimpleNamespace(type="score", score=0.8, confidence=0.7, probabilities={0: 0.2, 1: 0.8}),
        "supported": SimpleNamespace(type="noul", noul=0.9),
    })


def sdk(result=None, error=None):
    client = AsyncMock()
    client.__aenter__.return_value = client
    client.system_one = AsyncMock(return_value=result or response(), side_effect=error)
    return SimpleNamespace(AsyncTypeSafeClient=Mock(return_value=client), RetryPolicy=Mock()), client


def run(adapter, questions=QUESTIONS, state="A claim and its source"):
    return asyncio.run(adapter.evaluate(state=state, questions=questions))


def test_disabled_and_unconfigured_never_import_sdk():
    with patch("backend.services.jev.adapter.importlib.import_module") as loader:
        assert run(JevAdapter()).status == "disabled"
        assert run(JevAdapter(JevConfig(enabled=True))).status == "unconfigured"
        loader.assert_not_called()


def test_missing_sdk_is_explicit():
    with patch("backend.services.jev.adapter.importlib.import_module", side_effect=ImportError):
        assert run(JevAdapter(JevConfig(enabled=True, api_key="test"))).status == "unavailable"


def test_all_three_answers_and_exact_request_are_preserved():
    fake, client = sdk()
    with patch("backend.services.jev.adapter.importlib.import_module", return_value=fake):
        result = run(JevAdapter(JevConfig(enabled=True, api_key="test")))
    assert result.status == "ok"
    assert result.model == "jev-test"
    assert result.answers["quality"]["value"] == 0.8
    assert result.answers["route"]["value"] == "review"
    assert result.answers["supported"] == {"type": "noul", "value": 0.9}
    client.system_one.assert_awaited_once_with(state="A claim and its source", questions=QUESTIONS)
    assert fake.AsyncTypeSafeClient.call_args.kwargs["base_url"] == "https://api.typesafe.ai"
    client.__aexit__.assert_awaited_once()


@pytest.mark.parametrize("questions,state", [({}, "x"), (QUESTIONS, float("nan")), ({"x": {"type": "score", "instructions": "x", "criteria": ["one"]}}, "x"), ({"x": {"type": "noul", "instructions": ""}}, "x")])
def test_invalid_requests_do_not_load_sdk(questions, state):
    with patch("backend.services.jev.adapter.importlib.import_module") as loader:
        result = run(JevAdapter(JevConfig(enabled=True, api_key="test")), questions, state)
    assert result.status == "invalid-input"
    loader.assert_not_called()


@pytest.mark.parametrize("mutate", [
    lambda r: r.answers.pop("supported"),
    lambda r: setattr(r.answers["route"], "choice", "invented"),
    lambda r: setattr(r.answers["quality"], "score", 10),
    lambda r: setattr(r.answers["supported"], "noul", float("nan")),
    lambda r: setattr(r.answers["route"], "probabilities", {"review": 0.3}),
])
def test_invalid_provider_responses_return_no_partial_answers(mutate):
    raw = response()
    mutate(raw)
    fake, _ = sdk(raw)
    with patch("backend.services.jev.adapter.importlib.import_module", return_value=fake):
        result = run(JevAdapter(JevConfig(enabled=True, api_key="test")))
    assert result.status == "invalid-response"
    assert result.answers == {}


def test_timeout_cancels_request_and_closes_client():
    fake, client = sdk()
    async def slow(**kwargs):
        await asyncio.sleep(10)
    client.system_one.side_effect = slow
    with patch("backend.services.jev.adapter.importlib.import_module", return_value=fake):
        result = run(JevAdapter(JevConfig(enabled=True, api_key="test", timeout_seconds=0.01)))
    assert result.status == "timeout"
    client.__aexit__.assert_awaited_once()


def test_provider_errors_do_not_disclose_secrets():
    fake, _ = sdk(error=RuntimeError("secret request body and key"))
    with patch("backend.services.jev.adapter.importlib.import_module", return_value=fake):
        result = run(JevAdapter(JevConfig(enabled=True, api_key="test")))
    assert result.status == "provider-error"
    assert "secret" not in repr(result)
    assert "test-key" not in repr(JevConfig(api_key="test-key"))
