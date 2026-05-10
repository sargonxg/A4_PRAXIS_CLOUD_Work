# Memo Inventory

Date: 2026-05-06

Existing memo-shaped surfaces:

- `src/components/editor/work-product-editor.tsx` provides a TipTap drafting surface with provenance chips.
- `src/lib/firebase/work-products-service.ts` persists generic work products under `work_products`.
- `src/lib/services/export-engine.ts` exports situation reports, briefings, and dossiers to DOCX.
- AI routes such as `/api/ai/policy-memo` and `/api/work-products/export-docx` already produce memo-adjacent artifacts.

New Memo Studio foundation:

- `src/types/memo.ts` defines typed memo metadata, versions, blocks, templates, and citations.
- `src/lib/memo/templates/registry.ts` defines six launch templates.
- `src/components/memo/MemoStudio.tsx` renders the Workbench Memos tab.
- `src/lib/memo/export.ts` provides deterministic Markdown/plain-text export helpers and local version creation.
- `src/lib/firebase/memo-service.ts` persists owner/case/template-scoped memo drafts and immutable versions.
- `src/app/api/memos/route.ts` exposes authenticated memo load/save; demo mode stays local.
- The Memo Studio client now supports editable generated blocks, local and server-backed version history, and Markdown/DOCX/PDF draft export.

Remaining implementation:

- Citation side panel and graph-node resolution.
- Server-side DOCX/PDF/Markdown exports with footnotes.
