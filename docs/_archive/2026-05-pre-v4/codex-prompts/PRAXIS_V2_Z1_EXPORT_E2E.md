# Z1 — Briefing / Boardroom export E2E (deferrable)

## Goal

The export endpoints exist. Whether they actually produce a clean
file the user can hand to a director, today, is unverified. This
file is a smoke that fixes the rough edges.

**Run when**: after Sessions A-D, on a free evening. Not blocking.

## Files Codex must read first

- `src/app/api/exports/briefing/route.ts`
- `src/app/api/exports/boardroom/route.ts`
- `src/components/workbench/briefing-builder.tsx` (if exists)
- `src/lib/exports/*` (whatever generators exist)

## Tasks

### 1. Map the export surface

Codex produces a checklist of what should be in each export:

**Briefing**:
- Cover (title, author, date, classification)
- Executive summary (5 bullet points)
- Body sections (whatever chapters the user populated)
- Source references (numbered, traceable)
- Calibration footer (prompt-health score, ACO entity counts)

**Boardroom**:
- Title slide
- One slide per critical claim or hypothesis
- Maps / charts where applicable
- Q&A prep section
- Sources appendix

### 2. Fix the rough edges

For each item in the checklist, verify it appears in the produced
file. Common gaps:

- Missing fonts in PDF
- Markdown tables not rendering in DOCX
- Source links broken
- Calibration footer absent
- File size > 10MB without compression

### 3. Add export telemetry (if D0 shipped)

```typescript
emitTelemetry({
  event: 'export.briefing',
  uid, orgId, caseId,
  outcome: 'ok',
  latencyMs,
  details: { format: 'pdf', sizeBytes, sectionCount },
});
```

### 4. UI: clearer export button + progress

The user clicks "Export"; today the response is silent until the
file appears. Add:

- Button transitions to "Generating..." with a spinner
- Toast on success with download link
- Toast on failure with retry option

### 5. Audit: `audit:export-coverage`

Static-marker confirming the route handlers + telemetry calls.

## Acceptance criteria

1. Manual E2E: open a real case, export briefing, open the file,
   confirm all checklist items present.
2. Same for boardroom.
3. Export telemetry emits.
4. UI shows progress.
5. `audit:export-coverage` passes.

## Diagnostics

```bash
# After deploy: open a case, click Export Briefing.
# Open the resulting file in Word / Acrobat / Google Docs.
# Walk the checklist. Every item present?
```

## Commit

```
chore(Z1): briefing/boardroom export smoke + polish

Verifies end-to-end export works on a real case. Fixes rough edges
(missing fonts, broken markdown tables, source links, calibration
footer). Adds export telemetry events and progress UI.

audit:export-coverage protects the contract.

Refs: V2_WORK_PACK/Z1_EXPORT_E2E.md
```
