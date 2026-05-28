import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = join(root, rel);
  if (!existsSync(full)) {
    failures.push(`missing ${rel}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function requireIncludes(rel: string, markers: string[]): void {
  const source = read(rel);
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${rel} missing marker: ${marker}`);
  }
}

function requireExcludes(rel: string, markers: string[]): void {
  const source = read(rel);
  for (const marker of markers) {
    if (source.includes(marker)) failures.push(`${rel} still contains forbidden marker: ${marker}`);
  }
}

requireIncludes('src/components/ask/AskStreamPanel.tsx', [
  '/api/conversations/${encodeURIComponent(nextThreadId)}/turns',
  'currentPath: buildConversationPath(capsuleId, nextThreadId)',
  '<AskArtifactPreview',
]);

requireIncludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  '<AskArtifactPreview',
  'documentPackCandidate',
  'onRevise={(revisionPrompt) =>',
]);

requireIncludes('src/components/ask/AskArtifactPreview.tsx', [
  'data-testid="ask-artifact-preview"',
  'Draft document pack',
  'Save to Work',
  'Save as Output Capsule',
  'Attach answer to capsule',
  '/api/memos/from-ask-pack',
  '/api/output-capsules',
]);

requireExcludes('src/components/ask/AskStreamPanel.tsx', [
  "fetch('/api/ai/ask-praxis'",
  "window.location.assign('/app/write')",
]);

requireExcludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  "fetch('/api/ai/ask-praxis'",
  "window.location.assign('/app/write')",
]);

if (failures.length) {
  console.error('[audit:ask-same-window-contract] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:ask-same-window-contract] ok');
