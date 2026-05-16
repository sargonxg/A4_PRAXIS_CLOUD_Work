# Agent ownership map — Claude × Codex on PRAXIS

Both agents commit directly to `main`. This document is the contract that
prevents revert churn when both are active in the same repo.

> If you are unsure who owns a file, **read this before editing**.

---

## Hard rule

Each surface has a primary owner. The non-owner may **read** freely and may
**extend additively** (new files, new exports, new imports of an owner's
exports). The non-owner must **not** rename, move, or rewrite owner files.

When ownership is unclear, leave a `// OWNED BY: claude` or `// OWNED BY:
codex` comment at the top of the file and commit a one-line note here.

---

## Surface map

### Codex owns

| Path | Why |
|---|---|
| `src/components/praxis/tasklet-praxis-workbench.tsx` | Cockpit — the shared workbench rendered on landing and signed-in. |
| `src/app/(auth)/login/page.tsx` | Auth flow + pending-capsule UX. |
| `src/app/app/dashboard/page.tsx` | Signed-in cockpit page. |
| `src/app/app/layout.tsx` | App shell layout, sidebar mounting. |
| `src/components/app/app-shell.tsx` | App chrome. |
| `src/lib/output-capsules/**` | Output-capsule framework (types, templates, schemas, planner, quality, service). |
| `src/lib/product/policy-agents.ts` | Policy-agent registry. |
| `src/lib/product/context-capsules.ts` | Context-capsule templates + policy paths. |
| `src/lib/ai/MODEL_MATRIX.json` | Model routing matrix. |
| `src/lib/ai/providers.ts` | AI provider configuration. |
| `src/lib/ai/ask-runtime-catalog.ts` | Ask runtime registry. |
| `src/lib/genkit/**` | Genkit integration, MCP stubs. |
| `scripts/audit-public-surface.ts` | Public-surface guard. |
| `scripts/audit-tasklet-mvp-foundation.ts` | Tasklet MVP guard. |
| `scripts/audit-ask-cockpit-runtime.ts` | Ask cockpit guard. |
| `cloudbuild.yaml`, `cloudbuild.frontend.yaml` | Build pipelines. |

### Claude owns

| Path | Why |
|---|---|
| `src/app/globals.css` | Design tokens, capsule utilities, motion classes. **Extend, do not refactor.** |
| `src/components/ui/button.tsx` | Capsule button variants. New variants only via additive cases in `buttonVariants`. |
| `src/app/(landing)/layout.tsx` | Public navbar + paper-texture body. |
| `src/components/landing/core-capsule-hero.tsx` | Glass capsule under museum lighting. |
| `src/components/landing/capsule-anatomy-honeycomb.tsx` | 12-core honeycomb. |
| `src/components/landing/output-catalog-carousel.tsx` | Postcard carousel (reads Codex's `OUTPUT_CAPSULE_TEMPLATES`). |
| `src/components/landing/compose-capsules-demo.tsx` | Compose showcase. |
| `src/components/landing/persona-cards.tsx` | Persona section. |
| `src/components/landing/connector-strip.tsx` | Connector trust strip. |
| `src/components/cockpit/capsule-strip.tsx` | 12-dot strip for cockpit header. Slot via prop. |
| `src/lib/constants/capsule-cores.ts` | 12 canonical cores (key, label, description, color). Shared; extend by appending only. |
| `scripts/audit-design.mjs` | Visual identity audit. |
| `scripts/verify-design-shipped.mjs` | Post-deploy marker check. |
| `tests/e2e/mobile-landing.spec.ts` | Mobile parity tests. |
| `infrastructure/triggers/**` | Cloud Build trigger definitions. |
| `docs/contributing/DESIGN_SYSTEM.md` | Visual identity spec. |
| `docs/contributing/AGENT_OWNERSHIP_MAP.md` | This file. |

### Shared (either may extend)

| Path | Rule |
|---|---|
| `src/components/landing/phase8-wow-landing.tsx` | Codex owns the cockpit row inside this file; Claude owns the section list rendered below it. Additive only. |
| `package.json` `scripts` | Both may add scripts. Do not delete an owner's script. |
| `CHANGELOG.md` `[Unreleased]` | Both append bullets. |
| `docs/contributing/CODEX_ORCHESTRATION.md` | Codex authored; Claude appends a section. |

---

## Cross-references between agents

Claude's landing reads Codex's registry:
- `OutputCatalogCarousel` imports `OUTPUT_CAPSULE_TEMPLATES` from
  `src/lib/output-capsules/templates.ts`. **If Codex moves this file, the
  carousel breaks.** Codex: please leave a re-export shim in place.

Claude's cockpit strip exposes a prop slot:
- `CapsuleStrip` is designed to be passed into Codex's
  `TaskletPraxisWorkbench` via a `headerSlot` prop once Codex wires one.
  Until then, `CapsuleStrip` is exported and unused.

Claude's design tokens are used by Codex's components:
- `surface-glass`, `shadow-capsule`, `btn-capsule-*`, `section-rhythm`,
  `border-brushed-gold`. Codex may use freely; if a token is missing,
  request it in a `[design-token-request]` commit message.

---

## Deploy gate

Production deploys to `praxis.tacitus.me` are gated by `[deploy]` in the
commit message. See `infrastructure/triggers/README.md`. Routine commits
do not redeploy; agents land work continuously and the human (or an agent
on instruction) triggers production with one explicit `[deploy]` commit.

To verify a design shipped:

```bash
npm run verify:design
```

To run the design audit locally:

```bash
npm run audit:design           # warnings only (no-hex is advisory)
npm run audit:design:strict    # errors on raw hex literals too
```

---

## Recent history (manual log)

- 2026-05-15 — Claude landed design tokens + capsule buttons + navbar.
- 2026-05-15 — Codex landed output-capsule framework + Ask PRAXIS cockpit.
- 2026-05-16 — Codex aligned signed-in cockpit with public cockpit; renamed
  `ComposeCapsulesDemo` → `ComposeCapsulesShowcase`.
- 2026-05-16 — Claude rebuilt CoreCapsuleHero, added carousel + compose
  showcase, then anatomy + personas + connector strip + cockpit strip + this
  ownership map.
