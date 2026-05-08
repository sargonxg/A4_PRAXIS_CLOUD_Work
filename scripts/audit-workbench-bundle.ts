import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, '.next/server/app/app/workbench/[caseId]/page_client-reference-manifest.js');
const budgetKb = Number(process.env.WORKBENCH_INITIAL_JS_BUDGET_KB ?? '520');
const failures: string[] = [];
const rendererPath = path.join(root, 'src/components/workbench/chapter-renderer.tsx');
const shellPath = path.join(root, 'src/components/workbench/chapter-shell.tsx');
const tabContentPath = path.join(root, 'src/components/workbench/workbench-tab-content.tsx');
const activeCasePath = path.join(root, 'src/components/workbench/workbench-active-case.tsx');
const skeletonPath = path.join(root, 'src/components/workbench/chapter-skeleton.tsx');

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

  console.log(`[audit:workbench-bundle] measured initial workbench client JS: ${gzipKb} KB gzip (budget ${budgetKb} KB)`);
}

if (!existsSync(skeletonPath)) {
  failures.push('missing ChapterSkeleton loading fallback');
}

if (existsSync(rendererPath)) {
  const renderer = readFileSync(rendererPath, 'utf8');
  for (const symbol of ['ResearchTab', 'MemoStudio', 'DraftTab', 'ACHIndex', 'ToolMarketplace', 'BoardroomIndex']) {
    if (!renderer.includes(`const ${symbol} = dynamic(`)) {
      failures.push(`chapter-renderer must dynamically import ${symbol}`);
    }
  }

  const defaultOpenMatch = renderer.match(/DEFAULT_OPEN_CHAPTERS:[^\n=]+=\s*\[([^\]]*)\]/);
  if (!defaultOpenMatch) {
    failures.push('chapter-renderer must declare DEFAULT_OPEN_CHAPTERS');
  } else if (defaultOpenMatch[1].includes("'tools'") || defaultOpenMatch[1].includes('"tools"')) {
    failures.push('DEFAULT_OPEN_CHAPTERS must not include tools');
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
} else {
  failures.push('missing chapter-renderer.tsx');
}

if (existsSync(tabContentPath)) {
  const tabs = readFileSync(tabContentPath, 'utf8');
  for (const symbol of ['ContextTab', 'LibraryTab', 'OntologySchemaViewer', 'WorkbenchGraphPanel']) {
    if (!tabs.includes(`const ${symbol} = dynamic(`)) {
      failures.push(`workbench-tab-content must dynamically import ${symbol}`);
    }
  }
} else {
  failures.push('missing workbench-tab-content.tsx');
}

if (existsSync(shellPath)) {
  const shell = readFileSync(shellPath, 'utf8');
  if (!shell.includes('{active ? (') || !shell.includes('{children}')) {
    failures.push('chapter-shell must only render children inside the active branch');
  }
} else {
  failures.push('missing chapter-shell.tsx');
}

if (existsSync(activeCasePath)) {
  const activeCase = readFileSync(activeCasePath, 'utf8');
  if (!activeCase.includes('{activeTab ? (') || !activeCase.includes('<WorkbenchTabContent activeTab={activeTab} />')) {
    failures.push('workbench-active-case must mount WorkbenchTabContent only when a tab is active');
  }
} else {
  failures.push('missing workbench-active-case.tsx');
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
