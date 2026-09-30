import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildApiRouteInventory, type ApiRouteInventoryEntry } from './audit-api-route-inventory';

export type CleanupDisposition =
  | 'keep'
  | 'compatibility'
  | 'archive candidate'
  | 'delete candidate'
  | 'do not touch';

export type DeepRouteMapEntry = ApiRouteInventoryEntry & {
  methods: string[];
  dataStores: string[];
  visibleCallerCount: number;
  serverCallerCount: number;
  testCallerCount: number;
  graphReferences: number;
  sourceCallers: string[];
  tests: string[];
  disposition: CleanupDisposition;
  deletionGate: string;
};

export type VisibleSurfaceEntry = {
  path: string;
  expected: boolean;
  evidence: string[];
  preserveReason: string;
};

export type ObsoleteCodeCandidate = {
  file: string;
  kind: 'component' | 'library' | 'script' | 'doc';
  references: number;
  markers: string[];
  disposition: CleanupDisposition;
  deletionGate: string;
};

export type AgenticRuntimeReadinessEntry = {
  area: string;
  routes: string[];
  status: 'pass' | 'warn' | 'blocked';
  evidence: string[];
  nextAction: string;
};

export type CleanupAudit = {
  generatedAt: string;
  totalRoutes: number;
  routeMap: DeepRouteMapEntry[];
  visibleSurfaces: VisibleSurfaceEntry[];
  obsoleteCandidates: ObsoleteCodeCandidate[];
  agenticRuntime: AgenticRuntimeReadinessEntry[];
  summary: Record<CleanupDisposition, number>;
};

const AUDIT_DATE = '2026-05-19';
const SOURCE_ROOTS = ['src', 'tests', 'scripts', 'docs'];
const VISIBLE_SURFACES = ['/', '/login', '/app', '/app/capsules', '/app/repository', '/app/settings', '/agents/[runId]'];
const RUNTIME_ROUTE_PREFIXES = [
  '/api/agents/runs',
  '/api/conversations',
  '/api/context',
  '/api/documents',
  '/api/knowledge',
  '/api/health',
  '/api/output-capsules',
  '/api/workspace',
  '/api/usage',
  '/api/auth',
  '/api/billing',
];

let graphTextCache: string | null = null;

export function buildCleanupAudit(): CleanupAudit {
  const files = listProjectFiles();
  const fileTexts = new Map(files.map((file) => [file, safeRead(file)]));
  const inventory = buildApiRouteInventory();
  graphTextCache ??= loadGraphText();
  const graphReferences = buildGraphReferenceCounts(inventory.map((route) => route.route), graphTextCache);
  const routeMap = inventory.map((route) => enrichRoute(route, fileTexts, graphReferences));
  const visibleSurfaces = buildVisibleSurfaces(fileTexts);
  const obsoleteCandidates = buildObsoleteCandidates(fileTexts);
  const agenticRuntime = buildAgenticRuntimeReadiness(routeMap, fileTexts);
  const summary = routeMap.reduce<Record<CleanupDisposition, number>>((acc, route) => {
    acc[route.disposition] = (acc[route.disposition] ?? 0) + 1;
    return acc;
  }, {
    keep: 0,
    compatibility: 0,
    'archive candidate': 0,
    'delete candidate': 0,
    'do not touch': 0,
  });

  return {
    generatedAt: new Date().toISOString(),
    totalRoutes: routeMap.length,
    routeMap,
    visibleSurfaces,
    obsoleteCandidates,
    agenticRuntime,
    summary,
  };
}

export function writeCleanupAudit(outDir = path.join(process.cwd(), 'docs', 'audits')): CleanupAudit {
  const audit = buildCleanupAudit();
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, `${AUDIT_DATE}-api-route-cleanup-map.md`), formatRouteMapMarkdown(audit));
  writeFileSync(path.join(outDir, `${AUDIT_DATE}-api-route-cleanup-map.json`), `${JSON.stringify(audit, null, 2)}\n`);
  writeFileSync(path.join(outDir, `${AUDIT_DATE}-visible-surface-preservation.md`), formatVisibleSurfaceMarkdown(audit.visibleSurfaces));
  writeFileSync(path.join(outDir, `${AUDIT_DATE}-obsolete-code-candidates.md`), formatObsoleteCandidatesMarkdown(audit.obsoleteCandidates));
  writeFileSync(path.join(outDir, `${AUDIT_DATE}-agentic-runtime-readiness.md`), formatAgenticRuntimeMarkdown(audit.agenticRuntime));
  return audit;
}

function enrichRoute(route: ApiRouteInventoryEntry, fileTexts: Map<string, string>, graphCounts: Map<string, number>): DeepRouteMapEntry {
  const routeSource = safeRead(route.file);
  const callers = findRouteCallers(route.route, route.file, fileTexts);
  const tests = callers.filter((caller) => caller.startsWith('tests/'));
  const visibleCallers = callers.filter((caller) => caller.startsWith('src/components/') || caller.startsWith('src/app/'));
  const serverCallers = callers.filter((caller) => caller.startsWith('src/') && !caller.startsWith('src/components/'));
  const graphReferences = graphCounts.get(route.route) ?? 0;
  const dataStores = inferDataStores(route.route, routeSource);
  const disposition = dispositionForRoute(route, callers, graphReferences);
  return {
    ...route,
    methods: methodsFor(routeSource),
    dataStores,
    visibleCallerCount: visibleCallers.length,
    serverCallerCount: serverCallers.length,
    testCallerCount: tests.length,
    graphReferences,
    sourceCallers: callers.slice(0, 12),
    tests: tests.slice(0, 12),
    disposition,
    deletionGate: deletionGateFor(disposition),
  };
}

function dispositionForRoute(route: ApiRouteInventoryEntry, callers: string[], graphReferences: number): CleanupDisposition {
  if (RUNTIME_ROUTE_PREFIXES.some((prefix) => route.route.startsWith(prefix))) return 'do not touch';
  if (route.category === 'admin/internal') return 'do not touch';
  if (route.category === 'compatibility') return 'compatibility';
  if (route.category === 'staged') return 'archive candidate';
  if (route.category === 'deletion-candidate' && callers.length === 0 && graphReferences === 0) return 'delete candidate';
  if (callers.length === 0 && graphReferences === 0 && route.route.startsWith('/api/ai/')) return 'archive candidate';
  return 'keep';
}

function deletionGateFor(disposition: CleanupDisposition): string {
  if (disposition === 'delete candidate') return 'Delete only after route inventory, rg, graphify references, tests, build, and audit:gate all stay green.';
  if (disposition === 'archive candidate') return 'Archive or hide first; delete in a later wave only after no caller/test/graph evidence remains.';
  if (disposition === 'compatibility') return 'Keep until replacement callers are proven and docs/tests stop referencing this route.';
  if (disposition === 'do not touch') return 'Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution.';
  return 'Keep as active or canonical route.';
}

function findRouteCallers(route: string, routeFile: string, fileTexts: Map<string, string>): string[] {
  const literals = routeLiterals(route);
  const callers: string[] = [];
  for (const [file, text] of fileTexts) {
    if (file === routeFile) continue;
    if (literals.some((literal) => text.includes(literal))) callers.push(file);
  }
  return callers.sort();
}

function routeLiterals(route: string): string[] {
  const literals = new Set<string>([route]);
  if (route.includes('[')) {
    const dynamicPrefix = route
      .replace(/\[\.{3}[^\]]+\]/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .replace(/\/+/g, '/');
    literals.add(dynamicPrefix.endsWith('/') ? dynamicPrefix : `${dynamicPrefix}/`);
  } else {
    literals.add(route.replace(/\/+/g, '/').replace(/\/$/, ''));
  }
  return [...literals].filter((value) => value.startsWith('/api/') && value.length > 5);
}

function methodsFor(source: string): string[] {
  return ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].filter((method) => source.includes(`export const ${method}`));
}

function inferDataStores(route: string, source: string): string[] {
  const stores = new Set<string>();
  if (/Firestore|getAdminDb|collection\(|firebase/i.test(source)) stores.add('Firestore/Firebase');
  if (/Cloud SQL|postgres|DATABASE_URL|sql|pgvector/i.test(source)) stores.add('Cloud SQL/Postgres');
  if (/Cloud Tasks|tasks|dispatch/i.test(source) || route.includes('/dispatch')) stores.add('Cloud Tasks');
  if (/Storage|bucket|upload|Cloud Storage/i.test(source) || route.includes('/documents')) stores.add('Cloud Storage/documents');
  if (/PubSub|pubsub|topic/i.test(source)) stores.add('Pub/Sub');
  if (/Secret|api-keys|billing|checkout|portal|webhook/i.test(source)) stores.add('Secrets/Billing');
  if (route.startsWith('/api/ai/')) stores.add('AI/model route');
  return stores.size ? [...stores] : ['none detected'];
}

function buildVisibleSurfaces(fileTexts: Map<string, string>): VisibleSurfaceEntry[] {
  return VISIBLE_SURFACES.map((surface) => {
    const evidence = surfacePathCandidates(surface)
      .filter((file) => fileTexts.has(file))
      .slice(0, 8);
    return {
      path: surface,
      expected: true,
      evidence,
      preserveReason: 'Canonical visible surface from current product spine; do not remove during cleanup.',
    };
  });
}

function surfacePathCandidates(surface: string): string[] {
  if (surface === '/') return ['src/app/(landing)/page.tsx', 'src/app/page.tsx', 'src/app/(marketing)/page.tsx'];
  if (surface === '/login') return ['src/app/(auth)/login/page.tsx', 'src/app/login/page.tsx'];
  if (surface === '/agents/[runId]') return ['src/app/agents/[runId]/page.tsx'];
  return [`src/app${surface}/page.tsx`];
}

function buildObsoleteCandidates(fileTexts: Map<string, string>): ObsoleteCodeCandidate[] {
  const candidates: ObsoleteCodeCandidate[] = [];
  const stemReferenceCounts = new Map<string, number>();
  for (const [file, text] of fileTexts) {
    if (!isCandidateFile(file, text)) continue;
    const markers = candidateMarkers(file, text);
    if (!markers.length) continue;
    const references = countCandidateReferences(file, fileTexts, stemReferenceCounts);
    const kind = file.startsWith('src/components/') ? 'component' : file.startsWith('scripts/') ? 'script' : file.startsWith('docs/') ? 'doc' : 'library';
    const disposition = dispositionForObsoleteCandidate(file, references, markers);
    candidates.push({
      file,
      kind,
      references,
      markers,
      disposition,
      deletionGate: deletionGateForObsoleteCandidate(file, disposition),
    });
  }
  return candidates
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a) || a.file.localeCompare(b.file))
    .slice(0, 80);
}

function isCandidateFile(file: string, text: string): boolean {
  if (!/\.(ts|tsx|md|mjs)$/.test(file)) return false;
  if (file.includes('node_modules') || file.includes('graphify-out')) return false;
  if (file.startsWith('docs/audits/')) return false;
  if (file.startsWith('tests/')) return false;
  return /deprecated|legacy|obsolete|retired|archive|compatibility|backward compatibility/i.test(`${file}\n${text}`);
}

function candidateMarkers(file: string, text: string): string[] {
  const markers = new Set<string>();
  if (/deprecated/i.test(text)) markers.add('deprecated');
  if (/legacy/i.test(text)) markers.add('legacy');
  if (/obsolete|retired/i.test(text)) markers.add('obsolete-or-retired');
  if (/compatibility|backward compatibility|back-compat/i.test(text)) markers.add('compatibility');
  if (/archive/i.test(file) || /surface:\s*['"]archive['"]/.test(text)) markers.add('archive');
  if (/archivedAt|archive[A-Z]/.test(text)) markers.add('archive-state-field');
  return [...markers];
}

export function countCandidateReferences(file: string, fileTexts: Map<string, string>, stemReferenceCounts = new Map<string, number>()): number {
  const stem = path.basename(file).replace(/\.(tsx|ts|mjs|md)$/, '');
  let count = stemReferenceCounts.get(stem);
  if (count === undefined) {
    count = 0;
    // Every full-file match also contains its stem. Count this literal once
    // per source snapshot, including files that share the same basename.
    for (const text of fileTexts.values()) {
      if (text.includes(stem)) count += 1;
    }
    stemReferenceCounts.set(stem, count);
  }
  return count - (fileTexts.get(file)?.includes(stem) ? 1 : 0);
}

function scoreCandidate(candidate: ObsoleteCodeCandidate): number {
  return (candidate.disposition === 'archive candidate' ? 100 : 0) + candidate.markers.length * 10 - candidate.references;
}

function dispositionForObsoleteCandidate(file: string, references: number, markers: string[]): CleanupDisposition {
  if (file.startsWith('docs/_archive/')) return 'keep';
  if (file.startsWith('docs/product/') || file.startsWith('docs/architecture/') || file === 'CLAUDE.md' || file === 'AGENTS.md') return 'keep';
  if (references > 0) return 'keep';
  if (markers.every((marker) => marker === 'archive-state-field')) return 'keep';
  return 'archive candidate';
}

function deletionGateForObsoleteCandidate(file: string, disposition: CleanupDisposition): string {
  if (file.startsWith('docs/_archive/')) return 'Already archived; leave it out of active-surface cleanup.';
  if (disposition === 'archive candidate') return 'Confirm no imports, no graph references, no active route use, then archive before deletion.';
  return 'Keep until compatibility/runtime use is removed.';
}

function buildAgenticRuntimeReadiness(routeMap: DeepRouteMapEntry[], fileTexts: Map<string, string>): AgenticRuntimeReadinessEntry[] {
  return [
    runtimeEntry('Ask conversation', ['/api/conversations', '/api/conversations/[conversationId]/turns'], routeMap, fileTexts, ['TaskletPraxisWorkbench', 'buildEnrichedTurnCapsule']),
    runtimeEntry('Agent run ledger', ['/api/agents/runs', '/api/agents/runs/[runId]'], routeMap, fileTexts, ['AgentRunOutputSchema', 'toAgentRunOutput']),
    runtimeEntry('Worker dispatch and execution', ['/api/agents/runs/[runId]/dispatch', '/api/agents/runs/[runId]/execute', '/api/agents/runs/[runId]/stream'], routeMap, fileTexts, ['Cloud Tasks', 'useOrchestratorEvents']),
    runtimeEntry('Capsule context', ['/api/context/capsules', '/api/context/resolve', '/api/context/packages'], routeMap, fileTexts, ['ContextCapsule', 'resolveInjectableContext']),
    runtimeEntry('Output handoff', ['/api/output-capsules', '/api/memos/from-ask', '/api/work-products/export-docx'], routeMap, fileTexts, ['outputHref', 'memo_studio']),
  ];
}

function runtimeEntry(area: string, routes: string[], routeMap: DeepRouteMapEntry[], fileTexts: Map<string, string>, markers: string[]): AgenticRuntimeReadinessEntry {
  const missingRoutes = routes.filter((route) => !routeMap.some((entry) => entry.route === route || entry.route.startsWith(`${route}/`)));
  const markerHits = markers.filter((marker) => [...fileTexts.values()].some((text) => text.includes(marker)));
  const status = missingRoutes.length ? 'blocked' : markerHits.length === markers.length ? 'pass' : 'warn';
  return {
    area,
    routes,
    status,
    evidence: [
      missingRoutes.length ? `missing routes: ${missingRoutes.join(', ')}` : 'routes present',
      `markers found: ${markerHits.join(', ') || 'none'}`,
    ],
    nextAction: status === 'pass'
      ? 'Preserve this runtime lane during cleanup.'
      : 'Harden missing markers/routes before considering related cleanup.',
  };
}

export function buildGraphReferenceCounts(routes: string[], graphText: string): Map<string, number> {
  const literals = new Map<string, { count: number; nextStart: number }>();
  for (const route of routes) {
    for (const literal of routeLiterals(route)) {
      if (!literals.has(literal)) literals.set(literal, { count: 0, nextStart: 0 });
    }
  }
  // All route literals start with /api/. Visit those positions once rather
  // than splitting the complete graph for every route and dynamic prefix.
  let position = -1;
  while ((position = graphText.indexOf('/api/', position + 1)) !== -1) {
    for (const [literal, counter] of literals) {
      if (position >= counter.nextStart && graphText.startsWith(literal, position)) {
        counter.count += 1;
        // String.split counted non-overlapping matches independently for
        // each literal; preserve that behavior for nested /api/ segments.
        counter.nextStart = position + literal.length;
      }
    }
  }
  return new Map(routes.map((route) => [route, routeLiterals(route)
    .reduce((count, literal) => count + (literals.get(literal)?.count ?? 0), 0)]));
}

function loadGraphText(): string {
  const graphPath = path.join(process.cwd(), 'graphify-out', 'graph.json');
  return existsSync(graphPath) ? safeRead(graphPath) : '';
}

function listProjectFiles(): string[] {
  return SOURCE_ROOTS.flatMap((root) => listFiles(path.join(process.cwd(), root)))
    .map((file) => path.relative(process.cwd(), file).replace(/\\/g, '/'))
    .filter((file) => !file.includes('/_archive/'));
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    if (entry.isFile() && /\.(ts|tsx|js|mjs|md|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function safeRead(file: string): string {
  const full = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  try {
    return readFileSync(full, 'utf8');
  } catch {
    return '';
  }
}

function formatRouteMapMarkdown(audit: CleanupAudit): string {
  return [
    '# API Route Cleanup Map',
    '',
    `Generated: ${audit.generatedAt}`,
    `Total routes: ${audit.totalRoutes}`,
    '',
    '| Disposition | Count |',
    '| --- | ---: |',
    ...Object.entries(audit.summary).map(([disposition, count]) => `| ${disposition} | ${count} |`),
    '',
    '## Interpretation',
    '',
    '- `delete candidate` is intentionally rare. A route only gets that label when static callers and graph references are absent.',
    '- `archive candidate` means hide/archive first; deletion is a later wave after tests and graph references stay clean.',
    '- `do not touch` covers auth, billing, runtime, health, documents, capsules, and agentic execution paths.',
    '',
    '| Route | Disposition | Category | Methods | Data stores | Visible callers | Server callers | Tests | Graph refs | Gate |',
    '| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |',
    ...audit.routeMap.map((entry) => `| \`${entry.route}\` | ${entry.disposition} | ${entry.category} | ${entry.methods.join(', ') || 'none'} | ${entry.dataStores.join('<br>')} | ${entry.visibleCallerCount} | ${entry.serverCallerCount} | ${entry.testCallerCount} | ${entry.graphReferences} | ${entry.deletionGate} |`),
    '',
  ].join('\n');
}

function formatVisibleSurfaceMarkdown(entries: VisibleSurfaceEntry[]): string {
  return [
    '# Visible Surface Preservation Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Surface | Preserve | Evidence | Reason |',
    '| --- | --- | --- | --- |',
    ...entries.map((entry) => `| \`${entry.path}\` | ${entry.expected ? 'yes' : 'no'} | ${entry.evidence.map((file) => `\`${file}\``).join('<br>') || 'not found'} | ${entry.preserveReason} |`),
    '',
  ].join('\n');
}

function formatObsoleteCandidatesMarkdown(entries: ObsoleteCodeCandidate[]): string {
  return [
    '# Obsolete Code Candidate Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'No file in this ledger is approved for immediate deletion. Candidates require the listed gate first.',
    '',
    '| File | Kind | Disposition | References | Markers | Gate |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...entries.map((entry) => `| \`${entry.file}\` | ${entry.kind} | ${entry.disposition} | ${entry.references} | ${entry.markers.join(', ')} | ${entry.deletionGate} |`),
    '',
  ].join('\n');
}

function formatAgenticRuntimeMarkdown(entries: AgenticRuntimeReadinessEntry[]): string {
  return [
    '# Agentic Runtime Readiness Cleanup Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Cleanup must preserve these lanes because they are the backbone of real agentic work.',
    '',
    '| Status | Area | Routes | Evidence | Next action |',
    '| --- | --- | --- | --- | --- |',
    ...entries.map((entry) => `| ${entry.status} | ${entry.area} | ${entry.routes.map((route) => `\`${route}\``).join('<br>')} | ${entry.evidence.join('<br>')} | ${entry.nextAction} |`),
    '',
  ].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const audit = writeCleanupAudit();
  console.log(`Route cleanup map generated for ${audit.totalRoutes} routes.`);
  console.log(`Dispositions: ${Object.entries(audit.summary).map(([key, value]) => `${key}=${value}`).join(', ')}`);
  console.log(`Obsolete/code candidates reviewed: ${audit.obsoleteCandidates.length}`);
}
