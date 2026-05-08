import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';

const root = process.cwd();
const date = '2026-05-08';
const out = path.join(root, 'docs', 'audits', `${date}-CODEBASE_AUDIT`);
const temp = process.env.TEMP || process.env.TMP || '.';
const dirs = ['01-inventory', '02-graphs', '03-dead-code', '04-duplications', '05-hotspots', '06-surface-area'];
for (const d of dirs) fs.mkdirSync(path.join(out, d), { recursive: true });

const sh = (cmd) => {
  try {
    return cp.execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 120 * 1024 * 1024 }).trim();
  } catch (error) {
    return String(error.stdout || error.stderr || '').trim();
  }
};
const read = (file) => {
  try { return fs.readFileSync(path.join(root, file), 'utf8'); } catch { return ''; }
};
const readAbs = (file) => {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
};
const write = (rel, content) => {
  const target = path.join(out, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith('\n') ? content : `${content}\n`);
};
const writeJson = (rel, value) => write(rel, JSON.stringify(value, null, 2));
const norm = (file) => file.replace(/\\/g, '/');
const lineCount = (text) => text ? text.split(/\r?\n/).length : 0;
const table = (rows, cols) => {
  if (!rows.length) return '_No findings in this category from this static pass._\n';
  return `| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|\n${rows.map((row) => `| ${cols.map((col) => String(row[col] ?? '').replace(/\n/g, ' ').replace(/\|/g, '\\|')).join(' | ')} |`).join('\n')}\n`;
};
const bullet = (items) => items.length ? `${items.map((x) => `- ${x}`).join('\n')}\n` : '_None._\n';

function kindFor(file) {
  if (file.startsWith('src/app/api/') && file.endsWith('/route.ts')) return 'route';
  if (file.includes('/__tests__/') || file.startsWith('tests/') || /\.(test|spec)\.[tj]sx?$/.test(file) || file.startsWith('backend/tests/')) return 'test';
  if (file.startsWith('src/components/') || (file.startsWith('src/app/') && !file.includes('/api/'))) return 'component';
  if (file.startsWith('src/lib/') || file.startsWith('backend/services/') || file.startsWith('backend/agents/') || file.startsWith('backend/dialectica/')) return 'lib';
  if (file.startsWith('scripts/')) return 'script';
  if (file.startsWith('docs/')) return 'doc';
  if (file.startsWith('infrastructure/') || ['firebase.json', 'firestore.rules', 'cloudbuild.yaml'].includes(file) || file.includes('config')) return 'config';
  return 'other';
}

function appRoute(file) {
  return file
    .replace(/^src\/app\/api\//, '/api/')
    .replace(/\/route\.ts$/, '')
    .replace(/\[\.\.\.([^\]]+)\]/g, ':$1*')
    .replace(/\[([^\]]+)\]/g, ':$1');
}

function pageRoute(file) {
  const route = file
    .replace(/^src\/app\//, '/')
    .replace(/\/page\.tsx$/, '')
    .replace(/\([^/]+\)\//g, '')
    .replace(/\([^/]+\)/g, '')
    .replace(/\[([^\]]+)\]/g, ':$1');
  return route === '' ? '/' : route;
}

const tracked = sh('git ls-files')
  .split(/\r?\n/)
  .filter(Boolean)
  .map(norm)
  .filter((file) =>
    !file.startsWith('node_modules/') &&
    !file.startsWith('.next/') &&
    !file.startsWith('backend/.venv/') &&
    !file.startsWith('graphify-out/') &&
    !file.startsWith(`docs/audits/${date}-CODEBASE_AUDIT/`)
  );
const auditFiles = tracked.filter((file) => /\.(ts|tsx|js|jsx|py|md|json|ya?ml|sh|toml|rules)$/.test(file));
const files = auditFiles.map((file) => {
  const stat = fs.statSync(path.join(root, file));
  const text = read(file);
  return { path: file, kind: kindFor(file), lines: lineCount(text), ext: path.extname(file).replace('.', ''), size_bytes: stat.size, last_modified: stat.mtime.toISOString() };
});
const byPath = Object.fromEntries(files.map((file) => [file.path, file]));
const tsFiles = auditFiles.filter((file) => /\.[tj]sx?$/.test(file));
const pyFiles = auditFiles.filter((file) => /\.py$/.test(file));

const modules = [];
const importRe = /(?:import\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?|export\s+[^'";]+?\s+from\s+|require\()\s*['"]([^'"]+)['"]/g;
const exportRe = /export\s+(?:async\s+)?(?:function|const|class|interface|type|enum)\s+([A-Za-z0-9_]+)/g;
const pyImportRe = /^\s*(?:from\s+([A-Za-z0-9_\.]+)\s+import|import\s+([A-Za-z0-9_\.]+))/gm;
for (const file of [...tsFiles, ...pyFiles]) {
  const text = read(file);
  const imports = [];
  const exports = [];
  let match;
  if (/\.[tj]sx?$/.test(file)) {
    while ((match = importRe.exec(text))) imports.push(match[1]);
    while ((match = exportRe.exec(text))) exports.push(match[1]);
  } else {
    while ((match = pyImportRe.exec(text))) imports.push(match[1] || match[2]);
    const fnRe = /^def\s+([A-Za-z0-9_]+)|^class\s+([A-Za-z0-9_]+)/gm;
    while ((match = fnRe.exec(text))) exports.push(match[1] || match[2]);
  }
  const complexity = (text.match(/\b(if|else|for|while|case|catch|except|elif)\b|\?|&&|\|\|/g) || []).length;
  modules.push({ path: file, exports: [...new Set(exports)], imports: [...new Set(imports)], imported_by: [], lines: lineCount(text), complexity_estimate: complexity });
}

function resolveImport(from, spec) {
  if (spec.startsWith('@/')) {
    const base = `src/${spec.slice(2)}`;
    return [base + '.ts', base + '.tsx', base + '.js', base + '.jsx', `${base}/index.ts`, `${base}/index.tsx`].find((candidate) => byPath[candidate]);
  }
  if (spec.startsWith('.')) {
    const base = norm(path.posix.normalize(path.posix.join(path.posix.dirname(from), spec)));
    return [base + '.ts', base + '.tsx', base + '.js', base + '.jsx', base + '.py', `${base}/index.ts`, `${base}/index.tsx`].find((candidate) => byPath[candidate]);
  }
  return null;
}
const moduleMap = Object.fromEntries(modules.map((module) => [module.path, module]));
for (const module of modules) {
  for (const spec of module.imports) {
    const resolved = resolveImport(module.path, spec);
    if (resolved && moduleMap[resolved]) moduleMap[resolved].imported_by.push(module.path);
  }
}
for (const module of modules) module.imported_by = [...new Set(module.imported_by)].sort();

const nextRoutes = auditFiles.filter((file) => file.startsWith('src/app/api/') && file.endsWith('/route.ts')).flatMap((file) => {
  const text = read(file);
  const methods = [...text.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g)].map((method) => method[1]);
  return (methods.length ? methods : ['UNKNOWN']).map((method) => ({
    kind: 'next',
    path: appRoute(file),
    method,
    file,
    auth: text.includes('withAuth') ? 'withAuth' : text.includes('requireAuth') ? 'requireAuth' : text.includes('admin') ? 'admin/manual' : null,
    calibration: text.includes('withCalibration') ? 'withCalibration' : null,
    lines: lineCount(text),
    consumers: [],
  }));
});
const fastapiRoutes = [];
for (const file of pyFiles.filter((candidate) => candidate.startsWith('backend/'))) {
  const text = read(file);
  const prefix = text.match(/APIRouter\(prefix=["']([^"']+)/)?.[1] || '';
  for (const match of text.matchAll(/@router\.(get|post|put|patch|delete)\(["']([^"']+)/g)) {
    fastapiRoutes.push({ kind: 'fastapi', path: prefix + match[2], method: match[1].toUpperCase(), file, auth: text.includes('Depends(') ? 'Depends auth/manual' : null, calibration: null, lines: lineCount(text), consumers: [] });
  }
}
const allRoutes = [...nextRoutes, ...fastapiRoutes];

const fetchRefs = [];
for (const file of tsFiles) {
  const text = read(file);
  for (const match of text.matchAll(/(?:fetch|apiFetch|useSWR)\(\s*[`'"]([^`'"]*\/api\/[^`'"]*)/g)) fetchRefs.push({ file, route: match[1] });
}
for (const route of nextRoutes) {
  const prefix = route.path.replace(/:[^/]+\*/g, '').replace(/:[^/]+/g, '');
  route.consumers = fetchRefs.filter((ref) => prefix && ref.route.includes(prefix)).slice(0, 10).map((ref) => ref.file);
}

const pages = auditFiles.filter((file) => file.startsWith('src/app/') && file.endsWith('/page.tsx')).map((file) => {
  const text = read(file);
  const components = [...text.matchAll(/import\s+(?:\{([^}]+)\}|([A-Z][A-Za-z0-9_]+))/g)]
    .flatMap((match) => match[1] ? match[1].split(',').map((entry) => entry.trim().split(/\s+as\s+/).pop()) : [match[2]])
    .filter(Boolean)
    .filter((entry) => /^[A-Z]/.test(entry));
  return {
    kind: 'page',
    route: pageRoute(file),
    file,
    uses_components: [...new Set(components)],
    uses_hooks: [...new Set([...text.matchAll(/\b(use[A-Z][A-Za-z0-9_]+)\b/g)].map((match) => match[1]))],
    uses_routes: [...new Set([...text.matchAll(/[`'"]([^`'"]*\/api\/[^`'"]*)[`'"]/g)].map((match) => match[1]))],
  };
});

const envReads = new Map();
const addEnv = (name, site) => envReads.set(name, [...(envReads.get(name) || []), site]);
for (const file of auditFiles) {
  const text = read(file);
  let match;
  const jsEnvRe = /process\.env\.([A-Z0-9_]+)/g;
  const pyEnvRe = /(?:os\.getenv|os\.environ\.get|os\.environ\[)\(?["']([A-Z0-9_]+)["']/g;
  while ((match = jsEnvRe.exec(text))) addEnv(match[1], file);
  while ((match = pyEnvRe.exec(text))) addEnv(match[1], file);
}
const envSetFiles = auditFiles.filter((file) => /(^|\/)\.env|cloudbuild|firebase|ya?ml|json$/.test(file));
const envVars = [...envReads.entries()].sort().map(([name, sites]) => ({
  name,
  read_in: [...new Set(sites)],
  set_in_env_files: envSetFiles.filter((file) => read(file).includes(name)),
  set_in_infra: envSetFiles.filter((file) => file.startsWith('infrastructure/') && read(file).includes(name)),
  documented: auditFiles.some((file) => file.startsWith('docs/') && read(file).includes(name)),
  documented_in: auditFiles.filter((file) => file.startsWith('docs/') && read(file).includes(name)).slice(0, 10),
}));
const flags = envVars.filter((envVar) => /_ENABLED$|^FEATURE_|COGNEE_ENABLED|DIALECTICA_ENABLED|NEXT_PUBLIC_DEBUG_PANEL|KG_BACKEND|VERTEX_AGENT_ENGINE_ID/.test(envVar.name)).map((envVar) => ({
  name: envVar.name,
  type: 'env',
  read_sites: envVar.read_in,
  set_sites: [...envVar.set_in_env_files, ...envVar.set_in_infra],
  default_value: envVar.name === 'COGNEE_ENABLED' ? 'false unless true + backend URL' : 'see read site',
}));

const pkg = JSON.parse(read('package.json'));
const depcheck = JSON.parse(readAbs(path.join(temp, 'praxis-depcheck.json')) || '{}');
const knip = JSON.parse(readAbs(path.join(temp, 'praxis-knip.json')) || '{"issues":[]}');
const jscpd = JSON.parse(readAbs(path.join(temp, 'praxis-jscpd', 'jscpd-report.json')) || '{"duplicates":[],"statistics":{}}');
const cycles = readAbs(path.join(temp, 'praxis-madge-src-cycles.txt')) || 'No circular dependency found.';
const declaredDeps = Object.keys(pkg.dependencies || {});
const declaredDevDeps = Object.keys(pkg.devDependencies || {});
const reqFiles = auditFiles.filter((file) => /requirements.*\.txt$|pyproject\.toml$/.test(file));
const pyDeps = reqFiles.map((file) => ({ file, lines: read(file).split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith('#')).slice(0, 120) }));

const orphanModules = modules.filter((module) =>
  module.imported_by.length === 0 &&
  !['route', 'component', 'script', 'test', 'config'].includes(kindFor(module.path)) &&
  !module.path.endsWith('/page.tsx') &&
  !module.path.endsWith('/layout.tsx')
).sort((a, b) => b.lines - a.lines);
const hubModules = modules.filter((module) => module.imported_by.length > 15).sort((a, b) => b.imported_by.length - a.imported_by.length);
const oversized = files.filter((file) => ['ts', 'tsx', 'py'].includes(file.ext) && file.lines > 500).sort((a, b) => b.lines - a.lines);
const complex = modules.filter((module) => module.complexity_estimate > 80).sort((a, b) => b.complexity_estimate - a.complexity_estimate);
const docsText = auditFiles.filter((file) => file.startsWith('docs/') || file === 'README.md').map((file) => read(file)).join('\n');
const undocumented = allRoutes.filter((route) => !docsText.includes(route.path)).slice(0, 200);
const orphanRoutes = allRoutes.filter((route) =>
  route.kind === 'next' &&
  route.consumers.length === 0 &&
  !route.path.startsWith('/api/auth') &&
  !route.path.startsWith('/api/cron') &&
  !route.path.startsWith('/api/polar/webhook')
).slice(0, 200);

writeJson('01-inventory/files.json', { generated_at: new Date().toISOString(), files });
writeJson('01-inventory/modules.json', { generated_at: new Date().toISOString(), modules });
writeJson('01-inventory/routes.json', { generated_at: new Date().toISOString(), routes: allRoutes });
writeJson('01-inventory/ui-surfaces.json', { generated_at: new Date().toISOString(), surfaces: pages });
writeJson('01-inventory/env-vars.json', { generated_at: new Date().toISOString(), env_vars: envVars });
writeJson('01-inventory/feature-flags.json', { generated_at: new Date().toISOString(), feature_flags: flags });
writeJson('01-inventory/deps-frontend.json', { declared_dependencies: declaredDeps, declared_dev_dependencies: declaredDevDeps, depcheck });
writeJson('01-inventory/deps-backend.json', { requirement_files: pyDeps, imported_top_level: [...new Set(pyFiles.flatMap((file) => [...read(file).matchAll(/^\s*(?:from\s+([A-Za-z0-9_]+)|import\s+([A-Za-z0-9_]+))/gm)].map((match) => match[1] || match[2])))].sort() });
write('01-inventory/tools-installed.md', `# Tools used

| tool | mode | purpose |
|---|---|---|
| ripgrep | installed | search and route/env scans |
| madge | npx --yes | TypeScript dependency graph and circular dependency check |
| depcheck | npx --yes | frontend dependency usage candidates |
| knip | npx --yes | unused file/export/dependency candidates |
| jscpd | npx --yes | clone detection |
| graphify | installed | refreshed repository knowledge graph after docs generation |

Graphviz dot and jq were not available on PATH; Mermaid/DOT text artifacts were generated directly.
`);

const sha = sh('git rev-parse HEAD');
const branch = sh('git branch --show-current');
const architectureDocs = fs.readdirSync(path.join(root, 'docs', 'architecture')).filter((file) => file.endsWith('.md')).sort();
const countsByKind = files.reduce((acc, file) => ({ ...acc, [file.kind]: (acc[file.kind] || 0) + 1 }), {});
write('00-context.md', `# Codebase Audit Context

- Date: ${date}
- Audit author: Codex
- Branch: ${branch}
- HEAD: ${sha}
- Remote: ${sh('git remote get-url origin')}
- Working tree at start: clean
- Node: ${sh('node --version')}
- npm: ${sh('npm --version')}
- Python: ${sh('python --version')}
- Audit-relevant tracked files: ${files.length}
- TypeScript/JavaScript modules: ${tsFiles.length}
- Python files: ${pyFiles.length}
- Next route method entries: ${nextRoutes.length}
- FastAPI route entries: ${fastapiRoutes.length}
- Declared frontend dependencies: ${declaredDeps.length}; dev dependencies: ${declaredDevDeps.length}

## File Counts By Kind

${table(Object.entries(countsByKind).map(([kind, count]) => ({ kind, count })), ['kind', 'count'])}

## Recent Commits

\`\`\`text
${sh('git log --oneline -10')}
\`\`\`

## Architecture Documents Read

${architectureDocs.map((file) => `- docs/architecture/${file}`).join('\n')}

## Claimed Shape From README

README describes PRAXIS as a Next.js 16 frontend plus Python FastAPI backend on Cloud Run, Firebase/Auth/Firestore for core app state, Vertex AI for model work, optional Cognee memory service, and a narrowed workbench/product surface. This audit checks repository shape against that claim rather than assuming the docs are current.
`);

let dot = 'digraph ModuleGraph {\n  rankdir=LR;\n';
for (const module of modules.filter((item) => item.path.startsWith('src/')).slice(0, 1200)) {
  for (const spec of module.imports) {
    const resolved = resolveImport(module.path, spec);
    if (resolved) dot += `  "${module.path}" -> "${resolved}";\n`;
  }
}
write('02-graphs/module-graph.dot', `${dot}}\n`);
const topHubs = hubModules.slice(0, 40);
let mermaid = 'graph LR\n';
for (const hub of topHubs) {
  const id = `N${topHubs.indexOf(hub)}`;
  mermaid += `  ${id}["${hub.path.replace(/"/g, '')}"]\n`;
  for (const importer of hub.imported_by.slice(0, 5)) mermaid += `  "${importer}" --> ${id}\n`;
}
write('02-graphs/module-graph.mermaid', mermaid);
const routeGroups = {};
for (const route of allRoutes) {
  const key = route.path.split('/').slice(0, 3).join('/') || '/';
  routeGroups[key] ||= [];
  routeGroups[key].push(route);
}
let routeMermaid = 'graph LR\n';
Object.entries(routeGroups).slice(0, 30).forEach(([group, routes], index) => {
  routeMermaid += `  subgraph G${index}["${group}"]\n`;
  routes.slice(0, 20).forEach((route, routeIndex) => routeMermaid += `    R${index}_${routeIndex}["${route.method} ${route.path}"]\n`);
  routeMermaid += '  end\n';
});
write('02-graphs/route-graph.mermaid', routeMermaid);
write('02-graphs/data-flow.mermaid', `graph LR
  User[Analyst in workbench] --> UI[React chapter or tab]
  UI --> Next[Next API route]
  Next --> Auth[withAuth / admin / cron gate]
  Next --> Calibration[withCalibration where calibrated AI]
  Calibration --> Context[Firestore + graph + prompt health + optional memory]
  Next --> Backend[FastAPI backend via /api/backend proxy where needed]
  Backend --> Stores[Firestore / Postgres KG / optional Cognee service]
  Context --> Model[Vertex or Google AI provider]
  Model --> Response[Structured response + telemetry]
  Response --> UI
`);
write('02-graphs/orphan-modules.md', `# Orphan modules

Static modules with zero importers and not obvious framework entry points. These are candidates, not deletion approvals.

${table(orphanModules.slice(0, 80).map((module) => ({ module: module.path, lines: module.lines, exports: module.exports.slice(0, 6).join(', '), risk: 'medium', notes: 'Zero static importers; verify dynamic import/string usage before deletion.' })), ['module', 'lines', 'exports', 'risk', 'notes'])}`);
write('02-graphs/hub-modules.md', `# Hub modules

${table(hubModules.slice(0, 80).map((module) => ({ module: module.path, importers: module.imported_by.length, lines: module.lines, exports: module.exports.length, concern: module.lines > 500 ? 'review: large hub' : 'likely healthy or intentional hub' })), ['module', 'importers', 'lines', 'exports', 'concern'])}`);
write('02-graphs/cycles.md', `# Circular dependencies

\`\`\`text
${cycles}
\`\`\`
`);

const knipIssues = knip.issues || [];
const knipUnusedFiles = knipIssues.filter((issue) => issue.files?.length).map((issue) => ({ file: issue.file || issue.files?.[0]?.name, risk: String(issue.file || '').includes('/_archive/') ? 'low' : 'medium', evidence: 'knip flagged; verify dynamic or script usage before deletion' }));
const knipExports = knipIssues.flatMap((issue) => (issue.exports || []).map((entry) => ({ symbol: entry.name, file: `${issue.file}:${entry.line}`, risk: 'medium', evidence: 'knip export candidate; ripgrep second pass required before deletion' })));
write('03-dead-code/unused-exports.md', `# Unused exports

Derived from knip JSON. No exports are approved for deletion in this audit.

${table(knipExports.slice(0, 120), ['symbol', 'file', 'risk', 'evidence'])}`);
write('03-dead-code/unused-files.md', `# Unused files

Derived from knip plus module graph orphaning. Scripts and archived UI are listed as candidates, not removed.

${table(knipUnusedFiles.slice(0, 120), ['file', 'risk', 'evidence'])}`);
write('03-dead-code/unused-deps-frontend.md', `# Unused frontend dependencies

Depcheck candidates. Some are false positives for CSS/build/runtime-loaded libraries.

## Dependencies

${bullet((depcheck.dependencies || []).map((dep) => `\`${dep}\``))}
## Dev dependencies

${bullet((depcheck.devDependencies || []).map((dep) => `\`${dep}\``))}
## Missing imports detected by depcheck

${Object.entries(depcheck.missing || {}).map(([dep, sites]) => `- \`${dep}\` imported by ${(sites || []).slice(0, 4).join(', ')}`).join('\n') || '_None._'}
`);
write('03-dead-code/unused-deps-backend.md', `# Unused backend dependencies

Backend has multiple requirement scopes. This pass inventories requirement files and observed top-level imports; it does not remove Python packages because some are service-image-only.

${pyDeps.map((dep) => `## ${dep.file}\n\n${dep.lines.slice(0, 80).map((line) => `- \`${line.replace(/\|/g, '')}\``).join('\n')}`).join('\n\n')}
`);
write('03-dead-code/dead-routes.md', `# Dead routes

Routes with no static UI consumer in this repo. Cron, auth, webhook, external API and MCP/proxy style routes can be legitimately consumerless, so most entries are medium risk.

${table(orphanRoutes.slice(0, 120).map((route) => ({ route: route.path, method: route.method, file: route.file, risk: route.path.includes('/debug') ? 'high' : 'medium', notes: 'No static frontend fetch found; verify production logs/external consumers before action.' })), ['route', 'method', 'file', 'risk', 'notes'])}`);
const readUnset = envVars.filter((envVar) => envVar.set_in_env_files.length === 0 && envVar.set_in_infra.length === 0 && !['NODE_ENV', 'K_SERVICE', 'NEXT_RUNTIME'].includes(envVar.name));
write('03-dead-code/dead-env-vars.md', `# Dead environment variables

## Set but unread

_Not computed from live environment; no local set-but-unread claims made._

## Read but not found in env/infra files

${table(readUnset.slice(0, 80).map((envVar) => ({ var: envVar.name, read_sites: envVar.read_in.slice(0, 4).join(', '), recommendation: 'Document default or add to env template if required.' })), ['var', 'read_sites', 'recommendation'])}`);
write('03-dead-code/dead-feature-flags.md', `# Dead feature flags

Flags and runtime switches discovered. Always-on/off status needs production env confirmation.

${table(flags.map((flag) => ({ flag: flag.name, default: flag.default_value, read_sites: flag.read_sites.slice(0, 4).join(', '), status: flag.set_sites.length ? 'configured somewhere' : 'read-only/defaulted', recommendation: 'Confirm production value before inlining or deleting.' })), ['flag', 'default', 'read_sites', 'status', 'recommendation'])}`);

const tier1 = [
  { item: 'src/components/landing/_archive/*', kind: 'archived components', lines: files.filter((file) => file.path.startsWith('src/components/landing/_archive/')).reduce((sum, file) => sum + file.lines, 0), action: 'move to docs/archive or delete after visual regression', evidence: '02-graphs/orphan-modules.md' },
  { item: 'scripts/audit-phase3-product-surface.ts', kind: 'old audit script', lines: byPath['scripts/audit-phase3-product-surface.ts']?.lines || 0, action: 'delete if superseded by current gate audits', evidence: '03-dead-code/unused-files.md' },
  { item: 'scripts/audit-routes.ts', kind: 'old audit script', lines: byPath['scripts/audit-routes.ts']?.lines || 0, action: 'delete if superseded by audit-ai-routes.mjs', evidence: '03-dead-code/unused-files.md' },
  { item: 'scripts/audit-spine.ts', kind: 'old audit script', lines: byPath['scripts/audit-spine.ts']?.lines || 0, action: 'delete if no package script/history needs it', evidence: '03-dead-code/unused-files.md' },
  { item: 'scripts/audit-verb-hookup.ts', kind: 'old audit script', lines: byPath['scripts/audit-verb-hookup.ts']?.lines || 0, action: 'delete or archive after current route audit covers it', evidence: '03-dead-code/unused-files.md' },
  { item: 'dep @types/leaflet', kind: 'dependency', lines: 'n/a', action: 'remove if map components no longer type-import Leaflet', evidence: '03-dead-code/unused-deps-frontend.md' },
  { item: 'dep rehype-highlight', kind: 'dependency', lines: 'n/a', action: 'remove if markdown highlighter not runtime used', evidence: '03-dead-code/unused-deps-frontend.md' },
  { item: 'dep @google-cloud/tasks', kind: 'dependency', lines: 'n/a', action: 'remove or wire actual Cloud Tasks producer', evidence: '03-dead-code/unused-deps-frontend.md' },
  { item: 'dep @radix-ui/react-popover', kind: 'dependency', lines: 'n/a', action: 'remove if no popover component uses it', evidence: '03-dead-code/unused-deps-frontend.md' },
  { item: 'legacy docs in docs/_archive', kind: 'documentation', lines: files.filter((file) => file.path.startsWith('docs/_archive/')).reduce((sum, file) => sum + file.lines, 0), action: 'keep archived but exclude from active product docs search/navigation', evidence: '03-dead-code/unused-files.md' },
];
write('03-dead-code/deletion-candidates.md', `# Deletion candidates ranked

No deletion was executed in this pass. The audit prompt requires review before source cleanup.

## Tier 1 - likely safe after focused verification

${table(tier1, ['item', 'kind', 'lines', 'action', 'evidence'])}
## Tier 2 - investigate before removal

${table(orphanModules.slice(0, 20).map((module) => ({ item: module.path, kind: 'orphan module', lines: module.lines, action: 'verify dynamic import/string refs, then delete/archive', evidence: '02-graphs/orphan-modules.md' })), ['item', 'kind', 'lines', 'action', 'evidence'])}`);

const clones = (jscpd.duplicates || []).filter((dup) => dup.lines >= 30 && !String(dup.firstFile?.name || '').includes('test') && !String(dup.secondFile?.name || '').includes('test')).slice(0, 80);
write('04-duplications/code-clones.md', `# Code clones

Filtered to clone groups >= 30 lines and excluding obvious tests.

${table(clones.map((dup) => ({ lines: dup.lines, first: `${dup.firstFile?.name}:${dup.firstFile?.start}`, second: `${dup.secondFile?.name}:${dup.secondFile?.start}`, recommendation: 'Extract helper only when behavior is intentionally identical.' })), ['lines', 'first', 'second', 'recommendation'])}`);
const parallel = [
  { set: 'Deep research routes', files: '/api/ai/deep-search-agent + /api/ai/deep-research', recommendation: 'Keep canonical + soft-deprecated fallback until production consumers are measured.' },
  { set: 'Documents versus Library ingest', files: '/api/documents/upload + backend tabs/library ingest', recommendation: 'Consolidate once Cognee service is live and source receipts are production-verified.' },
  { set: 'Graph backends', files: 'Firestore graph layer + Neo4j verifier + Postgres KG docs/migrations', recommendation: 'Follow B0-B3 gates before deleting any backend path.' },
  { set: 'Marketplace recipes versus hero tools', files: 'ToolMarketplace recipe staging + hero routes', recommendation: 'Keep recipe library but avoid AI-backed claims for deterministic recipes.' },
  { set: 'Cognee boundary', files: '/api/memory proxy + backend/services/cognee_memory.py + feature gates', recommendation: 'Keep disabled-safe boundary until C0 is deployed.' },
];
write('04-duplications/parallel-implementations.md', `# Parallel implementations

${table(parallel, ['set', 'files', 'recommendation'])}`);
const routeFamilies = ['/api/ai', '/api/graph', '/api/documents', '/api/cases', '/api/boardroom', '/api/sats', '/api/backend', '/api/dialectica'].map((prefix) => ({ family: prefix, count: allRoutes.filter((route) => route.path.startsWith(prefix)).length, recommendation: 'Review for facade/consolidation only after user-flow and telemetry proof.' }));
write('04-duplications/near-duplicate-routes.md', `# Near-duplicate route families

${table(routeFamilies, ['family', 'count', 'recommendation'])}`);
write('04-duplications/consolidation-candidates.md', `# Consolidation candidates

${table([
  { candidate: 'AI route family', evidence: '04-duplications/near-duplicate-routes.md', action: 'Build facade only after preserving calibrated wrappers', risk: 'medium' },
  { candidate: 'Boardroom route helper duplication', evidence: '04-duplications/code-clones.md', action: 'Extract auth/session helper', risk: 'low' },
  { candidate: 'Research route planning/run helpers', evidence: '04-duplications/code-clones.md', action: 'Extract shared case research validator', risk: 'low' },
  { candidate: 'Cron auth checks', evidence: '04-duplications/code-clones.md', action: 'Extract cron bearer helper', risk: 'low' },
  { candidate: 'Landing card patterns', evidence: '04-duplications/code-clones.md', action: 'Extract visual primitive or leave if design-divergent', risk: 'low' },
], ['candidate', 'evidence', 'action', 'risk'])}`);

write('05-hotspots/oversized-files.md', `# Oversized files

Threshold: > 500 lines.

${table(oversized.slice(0, 100).map((file) => ({ file: file.path, lines: file.lines, recommendation: file.path.includes('/api/ai/') ? 'Candidate for shared route executor extraction' : 'Review responsibilities before splitting' })), ['file', 'lines', 'recommendation'])}`);
write('05-hotspots/overcomplex-functions.md', `# Overcomplex functions/modules

Approximation: branch-keyword count by file, not precise cyclomatic complexity.

${table(complex.slice(0, 100).map((module) => ({ file: module.path, complexity_estimate: module.complexity_estimate, lines: module.lines, recommendation: 'Break by command/query/helper boundaries after adding focused tests.' })), ['file', 'complexity_estimate', 'lines', 'recommendation'])}`);
write('05-hotspots/god-modules.md', `# God modules

${table(hubModules.filter((module) => module.lines > 300 || module.imported_by.length > 30).slice(0, 60).map((module) => ({ module: module.path, importers: module.imported_by.length, lines: module.lines, recommendation: module.path.includes('with-calibration') ? 'Split only with calibration tests and audit coverage' : 'Classify as healthy hub or split by responsibility.' })), ['module', 'importers', 'lines', 'recommendation'])}`);
const boundaryLeaks = [];
for (const file of tsFiles.filter((candidate) => candidate.startsWith('src/app/'))) {
  const text = read(file);
  if (/firebase-admin|@google-cloud\/aiplatform|openai|anthropic|neo4j-driver|pg\b/.test(text)) boundaryLeaks.push({ file, pattern: 'server/provider import in app boundary', recommendation: 'Allowed for server route only if wrapped/gated; verify no client boundary import.' });
}
write('05-hotspots/boundary-leaks.md', `# Boundary leaks

${table(boundaryLeaks.slice(0, 120), ['file', 'pattern', 'recommendation'])}`);
write('05-hotspots/lying-labels.md', `# Lying labels

Potential labels whose names or docs can overstate runtime behavior.

${table([
  { label: 'Agent Engine subagents', evidence: 'STATUS.md C2 gate', recommendation: 'Keep hidden/renamed unless deployed artifacts exist.' },
  { label: 'Cognee memory', evidence: 'C0/C1 blockers and feature flags', recommendation: 'Only surface when COGNEE_ENABLED=true and backend URL exists.' },
  { label: 'Marketplace tools', evidence: 'Recipe library staging work', recommendation: 'Continue labeling deterministic recipes as staging patterns.' },
  { label: '/api/ai/deep-research', evidence: 'Z3 soft-deprecated route', recommendation: 'Use /api/ai/deep-search-agent in new clients.' },
  { label: 'Postgres KG production backend', evidence: 'B0-B3 blocked statuses', recommendation: 'Do not claim cutover until live counts and soak gates pass.' },
], ['label', 'evidence', 'recommendation'])}`);
write('05-hotspots/refactor-candidates.md', `# Refactor candidates

${table([
  { candidate: 'AI route executor helper', evidence: '05-hotspots/oversized-files.md + 04-duplications/code-clones.md', effort: '1-2 evenings', risk: 'medium' },
  { candidate: 'Boardroom API mutation helper', evidence: '04-duplications/code-clones.md', effort: 'half day', risk: 'low' },
  { candidate: 'Cron auth helper', evidence: '04-duplications/code-clones.md', effort: '1 hour', risk: 'low' },
  { candidate: 'Landing visual card primitive', evidence: '04-duplications/code-clones.md', effort: 'half day', risk: 'low' },
  { candidate: 'Calibration module split', evidence: '02-graphs/hub-modules.md', effort: '1 evening with tests', risk: 'medium' },
], ['candidate', 'evidence', 'effort', 'risk'])}`);

write('06-surface-area/public-api-surface.md', `# Public API surface

Static classification from route files. Public here means callable route exists; auth posture is inferred from wrappers and may need runtime verification.

${table(allRoutes.slice(0, 220).map((route) => ({ route: route.path, method: route.method, kind: route.kind, auth: route.auth || 'none/manual/unknown', calibration: route.calibration || '', file: route.file })), ['route', 'method', 'kind', 'auth', 'calibration', 'file'])}`);
write('06-surface-area/undocumented-routes.md', `# Undocumented routes

Routes not mentioned verbatim in README/docs. Many internal routes are intentionally undocumented; use this for docs/API surface cleanup.

${table(undocumented.map((route) => ({ route: route.path, method: route.method, file: route.file, recommendation: 'Document if public product API; otherwise keep internal.' })), ['route', 'method', 'file', 'recommendation'])}`);
write('06-surface-area/orphan-routes.md', `# Orphan routes

No static UI consumer found in this repo. Verify logs/external clients before removal.

${table(orphanRoutes.map((route) => ({ route: route.path, method: route.method, file: route.file, risk: 'medium' })), ['route', 'method', 'file', 'risk'])}`);
write('06-surface-area/lying-routes.md', `# Lying routes

${table([
  { route: '/api/ai/deep-research', issue: 'Name implies canonical deep research but Z3 makes deep-search-agent canonical.', action: 'Keep soft-deprecated until consumers measured.' },
  { route: '/api/tools/marketplace/run', issue: 'Can look AI-backed if called directly; UI now stages recipes.', action: 'Consider 410 after all consumers migrate.' },
  { route: '/api/memory/[...slug]', issue: 'Boundary exists while Cognee disabled by default.', action: 'Keep but ensure UI remains feature-gated.' },
  { route: '/api/backend/[...path]', issue: 'Proxy hides FastAPI surface area.', action: 'Keep allowlist/gates and document consumers.' },
], ['route', 'issue', 'action'])}`);
write('06-surface-area/surface-recommendations.md', `# Surface recommendations

${table([
  { priority: 'P0', recommendation: 'Keep auth/calibration audits in gate before any API consolidation.', evidence: '06-surface-area/public-api-surface.md' },
  { priority: 'P1', recommendation: 'Measure production consumers before deleting orphan routes.', evidence: '06-surface-area/orphan-routes.md' },
  { priority: 'P1', recommendation: 'Promote only intentional public APIs into docs; keep internal routes undocumented by design.', evidence: '06-surface-area/undocumented-routes.md' },
  { priority: 'P1', recommendation: 'Resolve /api/tools/marketplace/run posture: no UI consumer or return 410.', evidence: '06-surface-area/lying-routes.md' },
  { priority: 'P2', recommendation: 'Document /api/backend proxy allowlist and FastAPI consumer map.', evidence: '06-surface-area/public-api-surface.md' },
], ['priority', 'recommendation', 'evidence'])}`);

write('07-cleanup-plan.md', `# PRAXIS cleanup plan

Generated ${date} from ${branch} @ ${sha}. This is a plan, not an executed deletion.

## Tier 1 - review then execute first

${table(tier1.map((item, index) => ({ '#': index + 1, action: item.action, item: item.item, 'est. lines': item.lines, risk: 'low-to-medium', evidence: item.evidence })), ['#', 'action', 'item', 'est. lines', 'risk', 'evidence'])}
## Tier 2 - consolidate after Tier 1 is green

${table([
  { '#': 'T2-1', action: 'extract shared route executor', item: 'repeated calibrated AI route structure', 'est. effort': '1-2 evenings', risk: 'medium', evidence: '04-duplications/code-clones.md' },
  { '#': 'T2-2', action: 'merge helper logic', item: 'boardroom mutation routes', 'est. effort': 'half day', risk: 'low', evidence: '04-duplications/code-clones.md' },
  { '#': 'T2-3', action: 'canonicalize labels', item: 'Agent Engine subagent claims if C2 Option B', 'est. effort': 'half day', risk: 'low', evidence: '05-hotspots/lying-labels.md' },
  { '#': 'T2-4', action: 'consolidate route docs', item: 'public/internal API docs', 'est. effort': 'half day', risk: 'low', evidence: '06-surface-area/undocumented-routes.md' },
  { '#': 'T2-5', action: 'split large modules', item: 'largest AI/workbench/dashboard files', 'est. effort': 'multi-PR', risk: 'medium', evidence: '05-hotspots/oversized-files.md' },
], ['#', 'action', 'item', 'est. effort', 'risk', 'evidence'])}
## Tier 3 - GC decisions

- B0-B3: pick and approve Postgres KG cutover case before dual-write or read-path cleanup.
- C0/C1: deploy Cognee service before exposing memory recall in calibration.
- C2: deploy Agent Engine artifacts or rename subagent labels to calibrated pipeline.
- Marketplace run route: keep as compatibility, or return 410 once no consumers remain.
- Archived landing/components: delete, move to docs archive, or keep as heritage assets.

## Tier 4 - investigate, do not act

See 08-unknowns.md.

## Estimated impact

If Tier 1 and Tier 2 ship after review: remove or archive thousands of non-runtime lines, remove several candidate dependencies, reduce route-helper duplication, and make the public/internal API map easier to reason about. Exact bundle/build impact must be measured after each cleanup PR.
`);
write('08-unknowns.md', `# Unknowns

${table([
  { '#': 1, question: 'Which orphan API routes have external consumers or production traffic?', suspected_resolution: 'Use Cloud Logging route counts before deletion.', who: 'GC/Codex with observability access' },
  { '#': 2, question: 'Are landing _archive components heritage assets or safe deletion candidates?', suspected_resolution: 'Likely archive-only; preserve if visual history matters.', who: 'GC' },
  { '#': 3, question: 'Are depcheck unused map libraries intentionally kept for near-term map work?', suspected_resolution: 'Possibly future-useful because maps remain a requested surface.', who: 'GC/product' },
  { '#': 4, question: 'Should /api/tools/marketplace/run return 410 now?', suspected_resolution: 'Only after confirming no clients post to it.', who: 'GC/Codex logs' },
  { '#': 5, question: 'Can Agent Engine labels be renamed now?', suspected_resolution: 'Blocked by C2 decision.', who: 'GC' },
  { '#': 6, question: 'Can Postgres KG replace Firestore graph paths?', suspected_resolution: 'Blocked by B0-B3 live gates.', who: 'GC with Cloud SQL/VPC shell' },
  { '#': 7, question: 'Can Cognee memory UI and calibration recall be enabled?', suspected_resolution: 'Blocked by C0 service deployment.', who: 'GC/platform' },
  { '#': 8, question: 'Which script files are historical but useful for forensic reproduction?', suspected_resolution: 'Move to docs/archive instead of deleting if unsure.', who: 'GC/Codex' },
], ['#', 'question', 'suspected_resolution', 'who'])}`);
write('09-summary.md', `# PRAXIS codebase audit - ${date} - summary

## Snapshot

- ${files.length} audit-relevant tracked files.
- ${tsFiles.length} TS/JS files and ${pyFiles.length} Python files.
- ${allRoutes.length} route method entries: ${nextRoutes.length} Next, ${fastapiRoutes.length} FastAPI.
- ${declaredDeps.length} frontend dependencies, ${declaredDevDeps.length} dev dependencies.
- Circular dependencies: 0 from Madge.
- Hub modules over 15 importers: ${hubModules.length}.
- Orphan module candidates: ${orphanModules.length}.

## Headlines

1. The repo is large but currently cycle-clean in the TypeScript app graph.
2. The highest-confidence cleanup is not app logic deletion; it is archived UI, old audit scripts, and dependency hygiene.
3. Route surface area remains broad; deletion needs production route-consumer evidence, not static grep alone.
4. The biggest consolidation opportunity is repeated AI/boardroom/research route boilerplate.
5. B0-B3/C0-C2 remain hard gates; cleanup must not erase future-useful scaffolding before those decisions.

## Tier 1 cleanup

- ${tier1.length} review-ready cleanup candidates.
- Candidate dependency removals: ${(depcheck.dependencies || []).length} runtime, ${(depcheck.devDependencies || []).length} dev.
- Dead route candidates are medium risk until production logs are checked.

## Decisions needed from GC

1. Keep/delete/archive landing _archive and historical audit scripts.
2. Approve B0-B3 Postgres KG path before graph backend cleanup.
3. Deploy Cognee or keep memory disabled/hidden.
4. Decide Agent Engine runtime artifacts vs label rename.
5. Decide whether marketplace run route can become 410.

## Evidence

- Cleanup plan: 07-cleanup-plan.md
- Unknowns: 08-unknowns.md
- Module graph: 02-graphs/module-graph.mermaid
- Dead code: 03-dead-code/
- Duplications: 04-duplications/
- Hotspots: 05-hotspots/
- Surface area: 06-surface-area/
`);

console.log(`Wrote comprehensive audit to ${out}`);
