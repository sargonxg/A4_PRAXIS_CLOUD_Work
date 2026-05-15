import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAPABILITIES,
  LEGACY_AI_ROUTE_CAPABILITY_MAP,
  ROUTE_FAMILIES,
} from '../src/lib/ai/capability-registry';

const root = process.cwd();
const aiRoutesDir = join(root, 'src', 'app', 'api', 'ai');
const failures: string[] = [];
const routeNames = readdirSync(aiRoutesDir)
  .filter((name) => statSync(join(aiRoutesDir, name)).isDirectory())
  .sort();

const familyCount = Object.keys(ROUTE_FAMILIES).length;
if (familyCount !== 15) {
  failures.push(`route family registry must contain exactly 15 families; found ${familyCount}`);
}

const capabilityCount = Object.keys(CAPABILITIES).length;
if (capabilityCount > 25) {
  failures.push(`capability registry must contain no more than 25 capabilities; found ${capabilityCount}`);
}

const superTools = new Set(Object.values(CAPABILITIES).map((capability) => capability.superToolId));
if (superTools.size > 15) {
  failures.push(`hidden super-tool registry must contain no more than 15 super-tools; found ${superTools.size}`);
}

for (const [id, capability] of Object.entries(CAPABILITIES)) {
  if (!ROUTE_FAMILIES[capability.routeFamily]) {
    failures.push(`${id} references missing route family ${capability.routeFamily}`);
  }
  if (ROUTE_FAMILIES[capability.routeFamily].canonicalPath !== capability.canonicalPath) {
    failures.push(`${id} canonicalPath ${capability.canonicalPath} does not match family ${capability.routeFamily}`);
  }
  if (capability.requiredCores.length === 0) {
    failures.push(`${id} must declare at least one required core`);
  }
  if (capability.suggestionRules.length === 0) {
    failures.push(`${id} must declare suggestion rules`);
  }
}

for (const routeName of routeNames) {
  const capabilityId = LEGACY_AI_ROUTE_CAPABILITY_MAP[routeName];
  if (!capabilityId) {
    failures.push(`/api/ai/${routeName} is not mapped to a hidden capability`);
    continue;
  }
  if (!CAPABILITIES[capabilityId]) {
    failures.push(`/api/ai/${routeName} maps to unknown capability ${capabilityId}`);
  }
}

const firstWave = ['ask', 'search', 'extract', 'document', 'critique', 'brief', 'graph-propose'];
for (const family of firstWave) {
  const routePath = join(aiRoutesDir, family, 'route.ts');
  try {
    if (!statSync(routePath).isFile()) failures.push(`/api/ai/${family} route wrapper is missing`);
  } catch {
    failures.push(`/api/ai/${family} route wrapper is missing`);
  }
}

if (failures.length > 0) {
  console.error('audit:capability-registry failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`audit:capability-registry OK (${routeNames.length} routes -> ${capabilityCount} capabilities -> ${familyCount} families)`);
