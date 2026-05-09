# PRAXIS v7 · INDEX

> **Path:** `docs/v7/INDEX.md`
> The single manifest. Every v7 doc and prompt lives in this repo. Codex
> reads this first to know where everything is and which prompt to run when.

---

## Contract docs (read these to know the rules)

| Path | Purpose | When to read |
|---|---|---|
| `AGENTS.md` (repo root) | The constitution. Session ritual, proactive freedoms, escalation triggers, self-review, communication style. | Every session, fully. |
| `docs/v7/STATUS.md` | Live ledger. Slice states, open questions, known issues. | Every session, first. |
| `docs/v7/SLICE_TEMPLATE.md` | Per-slice contract. Filled in for each slice. | When opening a new slice. |

## Vision briefs (read the one that owns the current slice)

| Path | Owns | When to read |
|---|---|---|
| `docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md` | Doctrine, the eight cores, the four surfaces, recategorization map, principles, glossary. | Anchor doc for everything. |
| `docs/v7/01_FRONTEND_AND_UX.md` | Landing, app shell, four surfaces, Ask PRAXIS, drag-and-drop, mobile, accessibility, slice plan. | Frontend slices. |
| `docs/v7/02_BACKEND_DATABASE_AND_DEPLOYMENT.md` | Postgres schema for cores, FastAPI routers, Cognee posture, deployment, observability. | Backend slices. |
| `docs/v7/03_CONTEXT_CORES_AND_DYNAMIC_ONTOLOGIES.md` | Eight core types, inheritance, sharing, dynamic ontology binding. | Cores work. |
| `docs/v7/04_ANALYST_SKILLS_POLICY_PRODUCT_AND_OUTPUTS.md` | Analyst Skills (renamed from Tools), routing layer, outputs, Policy Product. | Skills/outputs work. |

## Operational logs (Codex writes to these)

| Path | Purpose |
|---|---|
| `docs/v7/CURRENT_STATE.md` | Verified facts about the shipped repo. Produced once at bootstrap, updated by verify passes. |
| `docs/v7/OPEN_QUESTIONS.md` | Questions that need GC's decision before related slices proceed. |
| `docs/v7/DECISION_LOG.md` | Append-only record of decisions Codex made under AGENTS.md §2 freedoms. |
| `docs/v7/VERIFICATION_LOG.md` | Output of read-only verify passes. |
| `docs/v7/FIX_LOG.md` | Output of advance passes (verify-and-fix-and-ship). |
| `docs/v7/V7_EXECUTION_TODO.md` | Ranked execution queue derived from verification findings. |
| `docs/v7/SLICES/<NN>_<name>.md` | One file per slice, copied from `SLICE_TEMPLATE.md`. |
| `docs/adr/` | Existing ADR folder. Use for non-trivial design decisions. |

## Prompt library (paste-ready)

| Path | When to use | Run-mode |
|---|---|---|
| `docs/v7/prompts/BOOTSTRAP.md` | Once, the very first session. Sets up scaffolding, audits the repo against the briefs, proposes Slice 1, stops. | Read + write small, no feature code |
| `docs/v7/prompts/VERIFY.md` | Anytime a skeptic pass is wanted. Paste up to 5× to rotate through briefs. Read-only. | Read-only, opens issues |
| `docs/v7/prompts/ADVANCE.md` | Active forward motion. Paste 5× to verify-fix-or-ship one bounded step per paste. | Read + write, one PR per paste, 600 LOC max |
| `docs/v7/PROMPTS.md` | Three shorter prompts: Slice Kickoff (most common per-slice prompt), Resume Mid-Flight, Skeptical Review. | Mixed |

## Decision tree — which prompt right now?

```
Is this Codex's first session on v7? ────────────► BOOTSTRAP.md
                  │ no
                  ▼
Is the most recently shipped slice trustworthy?
(STATUS.md says shipped + audits green + flows actually work)
                  │ no                        │ yes
                  ▼                            ▼
              ADVANCE.md                Is there an in-progress slice?
              (paste 1–5×)                    │ yes               │ no
                                              ▼                    ▼
                                  PROMPTS.md → Resume    PROMPTS.md → Slice Kickoff
                                               Mid-Flight    on next proposed slice

Periodic ritual (weekly): VERIFY.md, paste 1× per session, up to 5 sessions.
```

## File-by-file ownership

Frontend changes touch: `src/app/`, `src/components/`, `src/chapters/`, `src/tabs/`, `src/lib/cores/types/`, `src/lib/ask/`. Owned by brief 01.

Backend changes touch: `backend/routers/`, `backend/services/`, `backend/migrations/versions/`, `backend/services/cores/`. Owned by briefs 02 + 03.

Skills changes touch: `skills/tools/<id>/manifest.json`, `skills/subagents/`. Owned by brief 04. **Audit-locked — see AGENTS.md §7.**

Deployment changes touch: `cloudbuild.yaml`, `cloudbuild.frontend.yaml`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `infrastructure/`. Owned by brief 02 §11.

Audit scripts: `scripts/audit-*.ts`, `scripts/audit-*.mjs`, `scripts/audit_*.py`. Every new contract gets an audit. **Never weakened — see AGENTS.md §3.**

## External anchors

- Repo: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`
- Production: `praxis.tacitus.me`
- GCP project: `praxisbytacitus` (region `us-central1`)
- Cloud Run: `praxis-frontend`, `praxis-backend`
- Auth: Firebase
- Primary KG: Postgres + pgvector
- User metadata: Firestore
- Models: Vertex AI / Gemini Enterprise (no direct OpenAI/Anthropic)

## Versioning of this index

Update this file in the same PR whenever any path changes. `audit:v7-index-current` (add it as part of slice 1 or 2) checks that every file referenced here exists.
