import { TOOL_REGISTRY } from '../src/lib/constants/tool-registry';
import {
  getV7SkillManifest,
  type V7OntologyCompat,
  type V7SkillCategory,
} from '../src/lib/tools/v7-skill-manifest';

const failures: string[] = [];
const validCategories = new Set<V7SkillCategory>(['structure', 'research', 'analysis', 'production', 'operations']);
const validOntologies = new Set<V7OntologyCompat>([
  'conflict',
  'mediation',
  'governance',
  'narrative',
  'humanitarian',
  'legal',
  'economic',
  'security',
  'generic',
]);

const manifest = getV7SkillManifest();
const byToolId = new Map(manifest.map((entry) => [entry.toolId, entry]));

for (const tool of TOOL_REGISTRY) {
  const entry = byToolId.get(tool.id);
  if (!entry) {
    failures.push(`${tool.id}: missing v7 skill manifest entry`);
    continue;
  }

  if (!validCategories.has(entry.skillCategory)) {
    failures.push(`${tool.id}: invalid skillCategory ${entry.skillCategory}`);
  }

  if (entry.ontologyCompat.length === 0) {
    failures.push(`${tool.id}: empty ontologyCompat`);
  }

  for (const ontology of entry.ontologyCompat) {
    if (!validOntologies.has(ontology)) failures.push(`${tool.id}: invalid ontologyCompat ${ontology}`);
  }

  if ((tool.surface === 'hero' && tool.visible) !== entry.visibleInV7) {
    failures.push(`${tool.id}: visibleInV7 does not match hero+visible posture`);
  }

  if ((tool.tier === 'deterministic-structural') !== entry.structural) {
    failures.push(`${tool.id}: structural flag does not match tool tier`);
  }
}

if (manifest.length !== TOOL_REGISTRY.length) {
  failures.push(`manifest length ${manifest.length} does not match tool registry length ${TOOL_REGISTRY.length}`);
}

for (const category of validCategories) {
  if (!manifest.some((entry) => entry.skillCategory === category)) {
    failures.push(`no v7 skill manifest entries for category ${category}`);
  }
}

if (failures.length > 0) {
  console.error('[audit:v7-skill-manifest] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[audit:v7-skill-manifest] ok - ${manifest.length} tools covered`);
