"""Deterministic estimator for Pack 30 GLiNER recall savings.

This is intentionally dependency-free so CI can prove the accounting model
without downloading GLiNER. Live cost telemetry should compare the same fields.
"""
from __future__ import annotations

FULL_PROMPT_TOKENS = 12000
VERIFICATION_PROMPT_TOKENS = 2800
FULL_CALLS = 1
VERIFICATION_CALLS = 1


def estimate_reduction() -> float:
    full = FULL_PROMPT_TOKENS * FULL_CALLS
    verification = VERIFICATION_PROMPT_TOKENS * VERIFICATION_CALLS
    return 1 - (verification / full)


if __name__ == "__main__":
    reduction = estimate_reduction()
    print(f"GLiNER cost reduction estimate: {reduction:.1%}")
    print(f"full_prompt_tokens={FULL_PROMPT_TOKENS}")
    print(f"verification_prompt_tokens={VERIFICATION_PROMPT_TOKENS}")
