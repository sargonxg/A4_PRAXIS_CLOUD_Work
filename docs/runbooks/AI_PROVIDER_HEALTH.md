# AI Provider Health

## Signals
- `/api/health` reports `ai_provider: ok`.
- `npm run audit:ai-provider-isolation`, `npm run audit:ai-provider-vertex-default`, and `npm run audit:model-matrix-coverage` pass.
- Production model calls use Vertex-backed model ids from `src/lib/ai/MODEL_MATRIX.json`.

## Triage
1. Check `/api/health` and `/api/health/provider`.
2. Run `npm run audit:ai-provider-isolation`.
3. Confirm Cloud Run has `GOOGLE_VERTEX_PROJECT` and `AI_PROVIDER=vertex` or no conflicting provider override.

## Mitigation
- Roll back the latest provider-touching deploy if provider imports or model ids regressed.
- Restore Vertex env vars from the latest known-good Cloud Run revision.

## Escalation
Escalate to Giulio before adding any non-Vertex provider or changing production model posture.
