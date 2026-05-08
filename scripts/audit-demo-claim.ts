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

requireIncludes('docs/codex-prompts/PRAXIS_V2_Z2_DEMO_TRANSITION.md', [
  'copy-from-demo',
  'audit:demo-claim',
  'Use this case',
]);

requireIncludes('src/components/demo/DemoClaimButton.tsx', [
  'Use this case in my own workspace',
  '/api/situations/copy-from-demo',
  '/login?next=',
  'addSituation',
]);

requireIncludes('src/app/demo/syria-2024/page.tsx', [
  'DemoClaimButton',
  'SYRIA_DEMO_CASE_ID',
]);

requireIncludes('src/app/api/situations/copy-from-demo/route.ts', [
  'GET = withAuth',
  'POST = withAuth',
  'createSituationAdmin',
  'SYRIA_DEMO_CANONICAL_GRAPH',
  "route: '/api/situations/copy-from-demo'",
  'source: \'demo-copy\'',
  '?source=demo',
]);

requireIncludes('src/components/workbench/workbench-active-case.tsx', [
  "searchParams.get('source') === 'demo'",
  'Demo case copied to your workspace',
]);

const pkg = read('package.json');
if (!pkg.includes('"audit:demo-claim"')) failures.push('package.json missing audit:demo-claim script');
if (!pkg.includes('npm run audit:demo-claim')) failures.push('audit:gate missing audit:demo-claim');

if (failures.length > 0) {
  console.error('Demo claim audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Demo claim audit passed: public demo copy CTA, authenticated clone route, seeded graph, telemetry, and workspace banner are enforced. (static-marker)');
