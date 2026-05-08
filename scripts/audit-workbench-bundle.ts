import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, '.next/server/app/app/workbench/[caseId]/page_client-reference-manifest.js');
const budgetKb = Number(process.env.WORKBENCH_INITIAL_JS_BUDGET_KB ?? '520');
const failures: string[] = [];

if (!existsSync(manifestPath)) {
  failures.push('missing .next workbench client-reference manifest; run npm run build before this audit');
} else {
  const manifest = readFileSync(manifestPath, 'utf8');
  const chunks = Array.from(new Set(manifest.match(/static\/chunks\/[^"']+?\.js/g) ?? []));
  const pageChunks = chunks.filter((chunk) => {
    const lower = chunk.toLowerCase();
    return !lower.includes('researchtab')
      && !lower.includes('memostudio')
      && !lower.includes('drafttab')
      && !lower.includes('achworkbench')
      && !lower.includes('toolmarketplace')
      && !lower.includes('boardroomworkspace')
      && !lower.includes('workbench-graph-panel')
      && !lower.includes('ontologyschemaviewer')
      && !lower.includes('librarytab')
      && !lower.includes('contexttab');
  });

  let gzipBytes = 0;
  for (const chunk of pageChunks) {
    const fullPath = path.join(root, '.next', chunk);
    if (!existsSync(fullPath)) continue;
    gzipBytes += gzipSync(readFileSync(fullPath)).length;
  }

  const gzipKb = Math.round((gzipBytes / 1024) * 10) / 10;
  if (gzipKb > budgetKb) {
    failures.push(`workbench initial client chunks are ${gzipKb} KB gzipped; budget is ${budgetKb} KB`);
  }

  const renderer = readFileSync(path.join(root, 'src/components/workbench/chapter-renderer.tsx'), 'utf8');
  for (const symbol of ['ResearchTab', 'MemoStudio', 'DraftTab', 'ACHIndex', 'ToolMarketplace', 'BoardroomIndex']) {
    if (!renderer.includes(`const ${symbol} = dynamic(`)) {
      failures.push(`chapter-renderer must dynamically import ${symbol}`);
    }
  }

  const tabs = readFileSync(path.join(root, 'src/components/workbench/workbench-tab-content.tsx'), 'utf8');
  for (const symbol of ['ContextTab', 'LibraryTab', 'OntologySchemaViewer', 'WorkbenchGraphPanel']) {
    if (!tabs.includes(`const ${symbol} = dynamic(`)) {
      failures.push(`workbench-tab-content must dynamically import ${symbol}`);
    }
  }

  const eagerForbidden = [
    '@/components/workbench/ResearchTab',
    '@/components/memo/MemoStudio',
    '@/components/workbench/draft/DraftTab',
    '@/components/sats/ACHWorkbench',
    '@/components/tools/ToolMarketplace',
    '@/components/boardroom/BoardroomWorkspace',
  ];
  for (const specifier of eagerForbidden) {
    const eagerImportPattern = new RegExp(`import\\s+[^;]+from\\s+['"]${escapeRegExp(specifier)}['"]`);
    if (eagerImportPattern.test(renderer)) {
      failures.push(`chapter-renderer still eagerly imports ${specifier}`);
    }
  }

  console.log(`[audit:workbench-bundle] measured initial workbench client JS: ${gzipKb} KB gzip (budget ${budgetKb} KB)`);
}

if (failures.length > 0) {
  console.error('[audit:workbench-bundle] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:workbench-bundle] ok');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
