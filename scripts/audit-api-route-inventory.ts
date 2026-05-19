import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type ApiRouteCategory = 'canonical' | 'compatibility' | 'admin/internal' | 'staged' | 'deletion-candidate';

export type ApiRouteInventoryEntry = {
  route: string;
  file: string;
  category: ApiRouteCategory;
  authPosture: string;
  calibrationStatus: string;
  callerEvidence: string[];
  recommendedAction: string;
};

const ROUTE_ROOT = path.join(process.cwd(), 'src', 'app', 'api');

export function buildApiRouteInventory(root = ROUTE_ROOT): ApiRouteInventoryEntry[] {
  return listRouteFiles(root).map((file) => {
    const source = readFileSync(file, 'utf8');
    const route = routePathForFile(file, root);
    const category = categorizeRoute(route, source);
    return {
      route,
      file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
      category,
      authPosture: authPostureFor(source),
      calibrationStatus: calibrationStatusFor(route, source),
      callerEvidence: callerEvidenceFor(route, source),
      recommendedAction: recommendedActionFor(category, route),
    };
  }).sort((a, b) => a.route.localeCompare(b.route));
}

export function formatApiRouteInventoryMarkdown(entries: ApiRouteInventoryEntry[]): string {
  const counts = entries.reduce<Record<ApiRouteCategory, number>>((acc, entry) => {
    acc[entry.category] = (acc[entry.category] ?? 0) + 1;
    return acc;
  }, {
    canonical: 0,
    compatibility: 0,
    'admin/internal': 0,
    staged: 0,
    'deletion-candidate': 0,
  });
  return [
    '# API Route Inventory',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total routes: ${entries.length}`,
    '',
    '| Category | Count |',
    '| --- | ---: |',
    ...Object.entries(counts).map(([category, count]) => `| ${category} | ${count} |`),
    '',
    '| Route | Category | Auth posture | Calibration | Caller evidence | Recommended action |',
    '| --- | --- | --- | --- | --- | --- |',
    ...entries.map((entry) => `| \`${entry.route}\` | ${entry.category} | ${entry.authPosture} | ${entry.calibrationStatus} | ${entry.callerEvidence.join('<br>')} | ${entry.recommendedAction} |`),
    '',
  ].join('\n');
}

export function writeApiRouteInventory(outFile = path.join(process.cwd(), 'docs', 'audits', '2026-05-19-api-route-inventory.md')) {
  const entries = buildApiRouteInventory();
  const outDir = path.dirname(outFile);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, formatApiRouteInventoryMarkdown(entries));
  writeFileSync(outFile.replace(/\.md$/, '.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), totalRoutes: entries.length, entries }, null, 2)}\n`);
  return entries;
}

function listRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listRouteFiles(full));
    if (entry.isFile() && entry.name === 'route.ts') out.push(full);
  }
  return out;
}

function routePathForFile(file: string, root: string): string {
  const rel = path.relative(root, file).replace(/\\/g, '/').replace(/\/route\.ts$/, '');
  return `/api/${rel}`.replace(/\/index$/, '');
}

function categorizeRoute(route: string, source: string): ApiRouteCategory {
  if (/\/(admin|debug|diagnostics|internal|worker)\b/.test(route) || source.includes('admin')) return 'admin/internal';
  if (/compat|legacy|redirect|deprecated|proxy/i.test(source) || /\/(legacy|proxy)\b/.test(route)) return 'compatibility';
  if (/TODO|staged|not implemented|planned/i.test(source)) return 'staged';
  if (/archive|obsolete|delete candidate/i.test(source)) return 'deletion-candidate';
  return 'canonical';
}

function authPostureFor(source: string): string {
  if (source.includes('withAdmin') || source.includes('requireAdmin')) return 'admin authenticated';
  if (source.includes('withAuth')) return 'user authenticated';
  if (source.includes('WORKER_DISPATCH') || source.includes('verifyWorker')) return 'worker authenticated';
  if (source.includes('NextResponse.json') && /health|public|shared/.test(source)) return 'public/sanitized';
  return 'public or route-local';
}

function calibrationStatusFor(route: string, source: string): string {
  if (!route.startsWith('/api/ai/')) return 'not AI route';
  if (source.includes('withCalibration')) return 'withCalibration';
  if (/health|debug|callback/.test(route)) return 'AI-adjacent exempt';
  return 'review required';
}

function callerEvidenceFor(route: string, source: string): string[] {
  const evidence = new Set<string>();
  if (source.includes('withAuth')) evidence.add('server auth boundary');
  if (source.includes('export const GET')) evidence.add('GET handler');
  if (source.includes('export const POST')) evidence.add('POST handler');
  if (source.includes('export const PATCH')) evidence.add('PATCH handler');
  if (source.includes('export const DELETE')) evidence.add('DELETE handler');
  if (route.includes('[runId]')) evidence.add('/agents/[runId] workspace/API family');
  if (route.includes('/context/capsules')) evidence.add('ContextCapsule cockpit/repository family');
  if (route.includes('/conversations')) evidence.add('Ask PRAXIS conversation flow');
  if (route.includes('/health')) evidence.add('runtime health diagnostics');
  return evidence.size ? [...evidence] : ['static route export'];
}

function recommendedActionFor(category: ApiRouteCategory, route: string): string {
  if (category === 'deletion-candidate') return 'Keep until rg, tests, route audit, and graph references prove zero active usage.';
  if (category === 'compatibility') return 'Keep as compatibility boundary; document caller before removal.';
  if (category === 'admin/internal') return 'Keep sanitized/admin-gated and exclude from normal-user UI.';
  if (category === 'staged') return 'Block launch claims until implemented or hidden.';
  if (route.startsWith('/api/ai/')) return 'Keep calibrated or document exemption.';
  return 'Keep canonical.';
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const entries = writeApiRouteInventory();
  console.log(`API route inventory generated for ${entries.length} routes.`);
}
