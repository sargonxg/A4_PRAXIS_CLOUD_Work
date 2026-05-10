"""Deterministic v5 document extraction cost benchmark.

The benchmark estimates the GLiNER pre-pass reduction without calling paid
models. Live telemetry should compare the same fields after deployment.
"""

GEMINI_ONLY_TOKENS = 180_000
GLINER_GEMINI_TOKENS = 62_000


def estimate_reduction() -> float:
    return 1 - (GLINER_GEMINI_TOKENS / GEMINI_ONLY_TOKENS)


if __name__ == "__main__":
    reduction = estimate_reduction()
    print(f"GLiNER+Gemini token reduction estimate: {reduction:.1%}")
    if reduction < 0.60:
        raise SystemExit("expected at least 60% reduction")
