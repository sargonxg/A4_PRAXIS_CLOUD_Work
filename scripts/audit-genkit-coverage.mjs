import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const aiRoutesRoot = path.join(repoRoot, 'src', 'app', 'api', 'ai');

const sprintTargetRoutes = [
  'situation-intelligence',
  'situation-brief',
  'actor-map',
  'escalation-monitor',
  'leverage-map',
  'scenario-tree',
  'brief-builder',
  'redline-finder',
  'needs-assessment',
  'narrative-map',
  'attribution-graph',
  'next-moves',
];

const routeAliases = new Map([
  ['actor-map', ['stakeholder-map', 'actor-profiles', 'actor-brief']],
  ['escalation-monitor', ['escalation-scan', 'risk-indicators']],
  ['scenario-tree', ['scenario']],
  ['redline-finder', ['legal-check', 'red-team-review']],
  ['needs-assessment', ['humanitarian']],
  ['narrative-map', ['info-environment', 'media-compass']],
  ['attribution-graph', ['media-analyze', 'source-scout']],
  ['next-moves', ['advisory', 'dashboard-summary']],
  ['situation-brief', ['auto-briefing', 'briefing-generate']],
]);

function walkRoutes(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkRoutes(entryPath);
    }

    return entry.name === 'route.ts' ? [entryPath] : [];
  });
}

function routeIdFor(filePath) {
  const relative = path.relative(aiRoutesRoot, path.dirname(filePath));
  return relative.split(path.sep).join('/');
}

function routeUsesGenkit(content) {
  return (
    /@\/lib\/genkit\/flows\//.test(content) ||
    /src\/lib\/genkit\/flows\//.test(content) ||
    /\bdefineFlow\b/.test(content) ||
    /\bgenkit\b/.test(content)
  );
}

function routeUsesAiSdk(content) {
  return (
    /from\s+['"]ai['"]/.test(content) ||
    /from\s+['"]@ai-sdk\//.test(content) ||
    /\b(generateText|streamText|generateObject|streamObject|Output\.object)\b/.test(content)
  );
}

function matchingRoutes(target, routeRows) {
  const aliases = routeAliases.get(target) ?? [];
  const accepted = new Set([target, ...aliases]);
  return routeRows.filter((row) => accepted.has(row.id));
}

const routes = walkRoutes(aiRoutesRoot);
const rows = routes
  .map((filePath) => {
    const content = readFileSync(filePath, 'utf8');
    return {
      id: routeIdFor(filePath),
      filePath,
      genkit: routeUsesGenkit(content),
      aiSdk: routeUsesAiSdk(content),
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const genkitRows = rows.filter((row) => row.genkit);
const aiSdkRows = rows.filter((row) => row.aiSdk && !row.genkit);
const targetRows = sprintTargetRoutes.map((target) => {
  const matches = matchingRoutes(target, rows);
  return {
    target,
    present: matches.length > 0,
    matchedRoutes: matches.map((row) => row.id),
    migrated: matches.some((row) => row.genkit),
    remainingAiSdkRoutes: matches.filter((row) => row.aiSdk && !row.genkit).map((row) => row.id),
  };
});
const migratedTargets = targetRows.filter((row) => row.migrated);
const missingTargets = targetRows.filter((row) => !row.present).map((row) => row.target);
const remainingTargets = targetRows.filter((row) => row.present && !row.migrated).map((row) => row.target);

const routePercent = rows.length === 0 ? 100 : Math.round((genkitRows.length / rows.length) * 100);
const targetPercent = Math.round((migratedTargets.length / sprintTargetRoutes.length) * 100);

console.log('Genkit route coverage audit');
console.log(`- Route migration: ${genkitRows.length}/${rows.length} (${routePercent}%) src/app/api/ai routes import Genkit flows`);
console.log(`- Sprint target migration: ${migratedTargets.length}/${sprintTargetRoutes.length} (${targetPercent}%)`);
console.log(`- AI SDK legacy routes remaining: ${aiSdkRows.length}`);

if (genkitRows.length > 0) {
  console.log(`- Migrated routes: ${genkitRows.map((row) => row.id).join(', ')}`);
}

if (remainingTargets.length > 0) {
  console.log(`- Sprint targets still pending: ${remainingTargets.join(', ')}`);
}

if (missingTargets.length > 0) {
  console.log(`- Sprint targets without exact/alias route yet: ${missingTargets.join(', ')}`);
}

if (aiSdkRows.length > 0) {
  console.log('- Remaining AI SDK route list:');
  for (const row of aiSdkRows) {
    console.log(`  - ${row.id}`);
  }
}

const minimumTargets = Number.parseInt(process.env.GENKIT_COVERAGE_MIN_TARGETS ?? '0', 10);
if (Number.isFinite(minimumTargets) && migratedTargets.length < minimumTargets) {
  console.error(
    `Genkit sprint target coverage ${migratedTargets.length}/${sprintTargetRoutes.length} is below GENKIT_COVERAGE_MIN_TARGETS=${minimumTargets}.`,
  );
  process.exit(1);
}
