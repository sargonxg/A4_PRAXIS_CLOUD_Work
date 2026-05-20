import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const forbiddenExternalMarkers = [
  '@ai-sdk/',
  'genkit',
  'runAgent',
  'grounded',
  'google_search',
  'EXA_API_KEY',
  'fetch("https://',
  "fetch('https://",
];

checkFile('src/app/api/app/search/route.ts', ['withAuth', 'normalizeAppSearchQuery', 'searchApp']);
checkFile('src/lib/app-search/app-search.ts', [
  'AppSearchResultSchema',
  'normalizeCapsuleSearchResult',
  'normalizeKnowledgeDocumentSearchResult',
  'degradedLanes',
  'listRecentAgentRuns',
]);
checkFile('src/components/shared/global-search.tsx', [
  'fetchFederatedSearchData',
  'Actions',
  'Capsules',
  'Memos',
  'Documents & Sources',
  'Agent Runs',
]);
checkFile('src/lib/search/federated-app-search.ts', ['/api/app/search', 'Find missing sources']);
checkFile('tests/unit/app/api/app-search-route.test.ts', ['Invalid app search', 'isDemo: true']);
checkFile('tests/unit/lib/app-search.test.ts', ['degrades unavailable lanes', 'rejects invalid query params', 'normalizeCapsuleSearchResult']);

const service = readRequired('src/lib/app-search/app-search.ts');
for (const marker of forbiddenExternalMarkers) {
  if (service.includes(marker)) failures.push(`app-search service must not call external AI/web/grounded search marker: ${marker}`);
}

const globalSearch = readRequired('src/components/shared/global-search.tsx');
const federatedSearch = readRequired('src/lib/search/federated-app-search.ts');
if (!globalSearch.includes('fetchFederatedSearchData') || !federatedSearch.includes('/api/app/search')) {
  failures.push('GlobalSearch does not call the unified app-search API');
}

const route = readRequired('src/app/api/app/search/route.ts');
if (!route.includes('withAuth')) failures.push('/api/app/search is missing auth');
if (!service.includes('AppSearchResultSchema')) failures.push('App search result types are not normalized');
if (!service.includes('normalizeCapsuleSearchResult') || !service.includes('normalizeKnowledgeDocumentSearchResult')) {
  failures.push('Capsule/repository search uses a different result contract');
}

if (failures.length) {
  console.error('audit:app-search-contract failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:app-search-contract OK');

function checkFile(relativePath: string, markers: string[]): void {
  const source = readRequired(relativePath);
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${relativePath} missing ${marker}`);
  }
}

function readRequired(relativePath: string): string {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}
