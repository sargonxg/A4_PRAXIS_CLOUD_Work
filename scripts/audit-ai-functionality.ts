import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const warnings: string[] = [];

function read(path: string) {
  const full = join(root, path);
  if (!existsSync(full)) {
    failures.push(`${path} is missing`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function requireIncludes(path: string, markers: string[]) {
  const text = read(path);
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${path} missing marker: ${marker}`);
  }
}

requireIncludes('src/app/api/ai/chat/route.ts', [
  'buildTurnCapsule',
  'effectiveSituationId',
  'contextMode: \'praxis_lite\'',
  'retrievedDocumentIds',
  'retrievedSourceIds',
  'memoryPersistence',
  'isAskThreadSqlConfigured',
  'runAskTools',
  'toolInvocations',
  'persistAskThreadTurnSql',
]);

requireIncludes('src/app/api/ai/ask-praxis/route.ts', [
  'export { POST } from \'../chat/route\'',
]);

requireIncludes('src/lib/ai/ask-praxis-tools.ts', [
  'writeToTool',
  'groundedSearchFetch',
  'runDeepResearch',
  'proposeGraphDelta',
]);

requireIncludes('src/app/api/documents/upload/route.ts', [
  'PDFParse',
  'mammoth',
  'localKnowledgeAdapter.ingestDocument',
  'attachCapsuleRefs',
  'mirrorDocumentIngestionSql',
]);

requireIncludes('src/app/api/documents/[id]/route.ts', [
  'previewText',
  'sourceCore',
  'contextMode: \'praxis_lite\'',
  'getDocumentById',
]);

requireIncludes('src/app/api/context/capsules/route.ts', [
  'combineCapsules',
  'action: z.literal(\'combine\')',
]);

requireIncludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  'ContextCapsule Lite',
  '/api/context/capsules',
  'action: \'combine\'',
  'data-testid="praxis-main-composer"',
]);

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
if (!packageJson.scripts?.['audit:ai-functionality']?.includes('audit-ai-functionality.ts')) {
  failures.push('package.json must expose audit:ai-functionality');
}
if (!packageJson.scripts?.['audit:genkit-runtime']) {
  warnings.push('package.json has no audit:genkit-runtime script');
}

if (failures.length) {
  console.error('audit:ai-functionality failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:ai-functionality OK');
if (warnings.length) {
  for (const warning of warnings) console.warn(`warn: ${warning}`);
}
