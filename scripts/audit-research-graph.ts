import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

checkFile('src/lib/research-graph/index.ts', [
  'current_media_pulse',
  'wikidata_entity_grounding',
  'cross_source_context',
  'event_timeline_bigquery',
  'rejectRawResearchGraphQuery',
  'RESEARCH_GRAPH_USER_AGENT',
  'wikidataCache',
  'timeoutMs',
  'GDELT_BIGQUERY_ENABLED',
  'RESEARCH_GRAPH_MAX_BYTES_BILLED',
]);
checkFile('src/lib/ai/ask-praxis-tools.ts', [
  'researchGraphSearch',
  'runResearchGraphSearch',
  'researchGraphExtraEnabled',
]);
checkFile('src/app/api/ai/chat/route.ts', [
  'RESEARCH GRAPH:',
  'researchGraphReceipts',
  'What PRAXIS learned from Research graph',
]);
checkFile('src/lib/health/agentic-search-health.ts', [
  'research_graph_extra',
  'RESEARCH_GRAPH_ENABLED',
]);
checkFile('docs/COMPLIANCE.md', [
  'GDELT DOC/API',
  'Wikidata',
  'BigQuery',
  'Exa',
  'canonical PRAXIS graph',
]);

const researchGraphSource = read('src/lib/research-graph/index.ts');
if (/inputSchema:\s*z\.object\(\{\s*(sql|sparql)/i.test(researchGraphSource)) {
  failures.push('Research graph tool exposes raw SQL/SPARQL input.');
}
if (/SELECT\s+\*/i.test(researchGraphSource)) {
  failures.push('Research graph BigQuery template must not use select-star.');
}

console.log('audit:research-graph');
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('audit:research-graph OK');

function checkFile(relativePath: string, markers: string[]): void {
  const source = read(relativePath);
  if (!source) return;
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${relativePath} missing ${marker}`);
  }
}

function read(relativePath: string): string {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}
