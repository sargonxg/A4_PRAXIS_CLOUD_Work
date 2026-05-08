import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string): string {
  const full = join(root, path);
  if (!existsSync(full)) {
    failures.push(`${path} is missing`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function requireMarkers(path: string, markers: string[]) {
  const content = read(path);
  for (const marker of markers) {
    if (!content.includes(marker)) failures.push(`${path} missing marker: ${marker}`);
  }
}

requireMarkers('src/lib/context/prompt-health.ts', [
  'buildPromptHealthReport',
  'renderContextQualityBlock',
  '<context-quality',
  'forceRunRequired',
  'score < 30',
]);

requireMarkers('src/lib/api/with-calibration.ts', [
  'buildPromptHealthReport',
  'appendContextQualityBlock',
  'body.forceRun !== true',
  'context_too_thin',
  'reason: \'context-too-thin\'',
  'status: 422',
]);

requireMarkers('src/app/api/context/prompt-health/route.ts', [
  'buildContextSnapshot',
  'buildPromptHealthReport',
  'Cache-Control',
  'situationId',
  'toolId',
]);

requireMarkers('src/components/praxis/prompt-health-badge.tsx', [
  'PromptHealthBadge',
  '/api/context/prompt-health',
  'Prompt health',
]);

requireMarkers('src/components/praxis/ai-populate.tsx', [
  'PromptHealthBadge',
  'forceRun: options?.forceRun === true',
  'context-too-thin',
  'Run anyway with caveats',
]);

requireMarkers('src/components/dashboard/executive-intelligence-panel.tsx', [
  'PromptHealthBadge',
  'forceRun: options?.forceRun === true',
  'context-too-thin',
  'Run anyway with caveats',
]);

requireMarkers('docs/CONTEXT_INJECTION.md', [
  'audit:thin-case-handling',
  '<context-quality>',
  'HTTP 422',
]);

if (failures.length > 0) {
  console.error('[audit:thin-case-handling] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:thin-case-handling] ok (static-marker)');
