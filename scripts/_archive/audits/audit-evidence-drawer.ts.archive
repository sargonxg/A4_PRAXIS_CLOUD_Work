import { existsSync, readFileSync } from 'node:fs';

const failures: string[] = [];
const drawerPath = 'src/components/evidence/EvidenceDrawer.tsx';
const diffPath = 'src/components/evidence/RunDiff.tsx';
const marketplacePath = 'src/components/tools/ToolMarketplace.tsx';
const routePath = 'src/app/api/tools/marketplace/run/route.ts';
const packagePath = 'package.json';

function read(path: string) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

if (!existsSync(drawerPath)) failures.push('missing EvidenceDrawer component');
if (!existsSync(diffPath)) failures.push('missing RunDiff component');
if (!existsSync(marketplacePath)) failures.push('missing ToolMarketplace component');
if (!existsSync(routePath)) failures.push('missing marketplace run API route');

const drawer = read(drawerPath);
const diff = read(diffPath);
const marketplace = read(marketplacePath);
const route = read(routePath);
const pkg = JSON.parse(read(packagePath)) as { scripts?: Record<string, string> };

if (!drawer.includes('Claims and provenance')) failures.push('EvidenceDrawer must expose claim/provenance evidence');
if (!drawer.includes('Context snapshot')) failures.push('EvidenceDrawer must expose context snapshot evidence');
if (!drawer.includes('Handler posture')) failures.push('EvidenceDrawer must expose handler posture evidence');
if (!drawer.includes('Memo Studio handoff')) failures.push('EvidenceDrawer must expose memo handoff payloads for memo tools');
if (!drawer.includes('Open graph evidence')) failures.push('EvidenceDrawer must link graph provenance when available');
if (!diff.includes('changed lines')) failures.push('RunDiff must summarize changed lines');
if (!marketplace.includes('EvidenceDrawer')) failures.push('ToolMarketplace must render EvidenceDrawer');
if (!marketplace.includes('RunDiff')) failures.push('ToolMarketplace must render RunDiff');
if (!marketplace.includes('structuredOutput: payload.artifact.structuredOutput')) failures.push('ToolMarketplace must keep structured output from immediate runs');
if (!marketplace.includes('contextDump: payload.artifact.contextDump')) failures.push('ToolMarketplace must keep context dumps from immediate runs');
if (!marketplace.includes('artifactId=')) failures.push('ToolMarketplace must reload full persisted artifacts by id');
if (!route.includes("url.searchParams.get('artifactId')")) failures.push('GET marketplace run route must accept artifactId');
if (!route.includes("return NextResponse.json({ item: { id: doc.id, ...doc.data() } as ToolRunArtifactRecord })")) {
  failures.push('GET marketplace run route must return full artifact records for artifactId');
}
if (!pkg.scripts?.['audit:evidence-drawer']) failures.push('package.json missing audit:evidence-drawer script');
if (!pkg.scripts?.['audit:gate']?.includes('audit:evidence-drawer')) failures.push('audit:gate must include audit:evidence-drawer');

if (failures.length > 0) {
  console.error('Evidence drawer audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Evidence drawer audit passed: marketplace runs expose evidence, context, and comparison UI. (static-marker)');
