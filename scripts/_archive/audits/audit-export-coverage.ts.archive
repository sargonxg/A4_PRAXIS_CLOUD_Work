import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    failures.push(`missing ${rel}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function requireIncludes(rel: string, markers: string[]) {
  const text = read(rel);
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${rel} missing marker: ${marker}`);
  }
}

requireIncludes('docs/codex-prompts/PRAXIS_V2_Z1_EXPORT_E2E.md', [
  'audit:export-coverage',
  'Briefing',
  'Boardroom',
]);

requireIncludes('src/types/telemetry.ts', [
  'export.briefing',
  'export.boardroom',
]);

requireIncludes('src/app/api/export/route.ts', [
  'emitTelemetrySafe',
  "eventName: 'export.briefing'",
  "route: '/api/export'",
]);

requireIncludes('src/app/api/boardroom/deliberations/[deliberationId]/export/route.ts', [
  'emitTelemetrySafe',
  "eventName: 'export.boardroom'",
  "route: '/api/boardroom/deliberations/[deliberationId]/export'",
]);

requireIncludes('src/lib/services/export-engine.ts', [
  'BRIEFING NOTE',
  'Executive Summary',
  'Body Sections',
  'Source References',
  'Calibration Footer',
]);

requireIncludes('src/lib/boardroom/export.ts', [
  'Title Slide',
  'Critical Claims And Hypotheses',
  'Q&A Prep',
  'Sources Appendix',
  'maps/charts',
]);

requireIncludes('src/components/boardroom/BoardroomWorkspace.tsx', [
  'Preparing DOCX...',
  'Preparing Markdown...',
  'downloadExport',
]);

const pkg = read('package.json');
if (!pkg.includes('"audit:export-coverage"')) failures.push('package.json missing audit:export-coverage script');
if (!pkg.includes('npm run audit:export-coverage')) failures.push('audit:gate missing audit:export-coverage');

if (failures.length > 0) {
  console.error('Export coverage audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Export coverage audit passed: briefing/boardroom export structure, telemetry, UI progress, and Z1 prompt preservation are enforced. (static-marker)');
