# PRAXIS MVP Packs A-D Completion Ledger

Date: 2026-05-12
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Baseline commits reviewed:

- `8dd480ab feat: consolidate PRAXIS writer tools and navigation`
- `2bc31230 feat(landing,ask): add response actions and tour`

This ledger records the repo-backed completion status of the four MVP prompt packs. It is intentionally blunt: shipped means code exists and validation passed; partial means a user-visible or architecture-relevant item still needs follow-up; retained means the literal prompt asked for deletion, but current dependencies make deletion unsafe.

## Pack A - Canonical Tiptap Write Surface

Status: substantially complete, with two follow-up polish items.

Shipped:

- `src/components/writer/PraxisWriter.tsx`
- `src/components/writer/extensions/citation-mark.ts`
- `src/components/writer/extensions/provenance-block.ts`
- `src/components/writer/extensions/slash-menu.ts`
- `src/components/writer/extensions/ask-praxis-command.ts`
- `src/components/writer/ui/SlashMenu.tsx`
- `src/components/writer/ui/CitationSidebar.tsx`
- `src/components/writer/ui/ProvenanceChip.tsx`
- `src/components/writer/ui/WriterToolbar.tsx`
- `src/components/writer/hooks/use-writer-autosave.ts`
- `src/components/writer/hooks/use-writer-context.ts`
- `src/app/api/ai/writer/ask/route.ts`

Evidence:

- `src/chapters/draft/DraftChapter.tsx` renders `PraxisWriter`.
- `src/chapters/memos/MemosChapter.tsx` renders `PraxisWriter`.
- `src/app/app/write/page.tsx` is the canonical Write entry.
- `rg "MemoStudio|BlockEditor|DraftCompanion|DraftingShell" src/` returns no matches.
- Tiptap imports are limited to `src/components/writer/` plus package metadata.
- Slash commands exist for the exact requested set: `/ask`, `/cite`, `/tighten`, `/soften`, `/steelman`, `/gap`, `/bluf`, `/actor`, `/claim`, `/timeline`, `/redact`, `/handover`.
- Writer autosave uses IndexedDB after 500ms and `/api/memos` after 3s.
- The writer route uses `withCalibration`, which includes auth, credit deduction, calibration, firewall, and tool-run lifecycle.

Follow-up items:

- `/timeline` currently inserts a chronology scaffold; it is not yet autopopulated from situation events.
- Export actions are present in the writer toolbar, but the prompt-level manual verification of DOCX/PDF/Markdown in a browser should be repeated before a live demo recording.

## Pack B - Attachable Tools and Canonical Tool Library

Status: complete for the user-facing MVP surface; one dependency-backed retention is documented.

Shipped:

- `src/lib/tools/contract.ts`
- `src/lib/tools/canonical.ts`
- `src/lib/tools/recommend.ts`
- `src/app/api/tools/recommend/route.ts`
- `src/app/app/tools/page.tsx`
- `scripts/generate-canonical-tool-docs.ts`
- `docs/tools/CANONICAL.md`
- `docs/tools/CONTRACT.md`

Evidence:

- `PRAXIS_CANONICAL_TOOLS` contains exactly twelve attachable tools.
- `/app/tools` defaults to suggested tools plus the canonical twelve.
- Archived tools remain reachable only through the archive path.
- `docs/tools/CANONICAL.md` is 1,116 words, below the 6,000-word cap.
- `npm run audit:tool-contracts` passed on 2026-05-12.
- `npm run audit:tool-marketplace` passed on 2026-05-12.

Intentional retention:

- `src/lib/constants/consolidated-tools.ts` was not moved to `src/lib/tools/_archive/` because current active modules still import it: `src/lib/product/context-core-map.ts`, `src/lib/dashboard/role-recommendations.ts`, `src/lib/tools/tool-navigation.ts`, `src/lib/tools/tool-path-taxonomy.ts`, `src/lib/constants/tool-groups.ts`, tests, and `scripts/audit-simplified-capability-ledger.ts`.
- Follow-up: migrate those dependencies to `src/lib/tools/canonical.ts` or a compatibility adapter, then move the old consolidated registry.

Notes:

- The historical prompt says 55 tools; the current marketplace audit reports 57 curated tools because later analytics/sanctions/network tools are registered. The visible default surface is still the canonical twelve.

## Pack C - Navigation Simplification

Status: complete.

Shipped:

- `src/lib/navigation/primary-nav.ts`
- Sidebar, mobile bottom nav, and breadcrumb roots use `Ask`, `Cores`, `Write`, `Tools`, `Settings`.
- `src/app/app/write/page.tsx`
- Header uses one `Ask PRAXIS or search...` command input instead of separate Ask and Search controls.
- Legacy public routes are removed or redirected by proxy.

Evidence:

- `src/components/app/app-sidebar.tsx` is 56 lines.
- `src/components/app/mobile-bottom-nav.tsx` is 64 lines.
- `rg "Manage cores|Manage Cores" src/` has no matches.
- `rg "routeLabels" src/components/app/header.tsx` has no matches.
- `npm run audit:mvp-route-shape` passed on 2026-05-12.
- `npm run smoke:core-flows` passed on 2026-05-12.

## Pack D - Landing CTAs and Ask Response Actions

Status: complete, with two pragmatic implementation notes.

Shipped:

- Landing CTA path: `Start your workspace` -> `/login`.
- Landing CTA path: `Try the live example` -> `/app/demo/syria-2024`.
- Landing CTA path: `See PRAXIS write a memo` -> `/app/demo/syria-2024/write?guided=1`.
- Landing caption: `30 seconds to a real memo with citations.`
- `src/app/tour/page.tsx`
- `src/components/assistant/response-actions.tsx`
- `src/lib/assistant/response-action-kinds.ts`
- Floating Ask and assistant message bubbles render response actions.
- `/api/ai/chat` persists inferred `availableActions` in the chat tool output.
- Compatibility routes exist for open questions and core attachments.

Evidence:

- `npm run smoke:core-flows` passed on 2026-05-12 after the smoke assertion was updated to the new CTA copy.
- `npm run audit:purpose-surface` passed on 2026-05-12.
- `npm run check-landing-bundle` passed on 2026-05-12.

Implementation notes:

- The `/tour` panels are static CSS poster panels rather than checked-in `.webp` binaries. This avoids synthetic binary assets while preserving the requested five-step tour structure.
- `Run deep research` currently reopens Ask PRAXIS with a deep-research prompt. A direct UI call into the server-side `runDeepResearch` extension can be added once the Ask tool-run dispatch API is exposed to the client.
- The legacy `/waitlist` route remains because it is still part of older production-readiness and login fallback posture, but active landing CTAs no longer route users to waitlist.

## Validation Snapshot

Commands passed on 2026-05-12:

- `npx tsc --noEmit`
- `npm run lint` with existing warnings only
- `npm run build`
- `npm run smoke:core-flows`
- `npm run audit:purpose-surface`
- `npm run audit:tool-contracts`
- `npm run audit:tool-marketplace`
- `npm run audit:mvp-route-shape`
- `npm run check-landing-bundle`
- `graphify update .`

## Remaining Work Queue

1. Migrate active references off `src/lib/constants/consolidated-tools.ts`, then move it to `src/lib/tools/_archive/`.
2. Autopopulate writer `/timeline` from situation events.
3. Add a direct client-safe action path for `runDeepResearch` instead of prompt-dispatching through Ask.
4. Record a browser demo QA pass covering slash menu, citation sidebar, reload from IndexedDB, and Markdown/DOCX/PDF export.
