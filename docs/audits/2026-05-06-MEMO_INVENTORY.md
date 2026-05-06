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

Remaining implementation:

- Firestore-backed memo create/save/version APIs.
- Citation side panel and graph-node resolution.
- Server-side DOCX/PDF/Markdown exports with footnotes.
