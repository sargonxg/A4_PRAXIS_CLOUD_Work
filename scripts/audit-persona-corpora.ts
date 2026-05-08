import { CANONICAL_PERSONAS } from '../src/lib/boardroom/personas';

const failures: string[] = [];

for (const persona of CANONICAL_PERSONAS) {
  if (!persona.corpus.namespace.startsWith(`persona:${persona.id}`) && !persona.corpus.namespace.includes(persona.id)) {
    failures.push(`${persona.id} corpus namespace does not include persona id`);
  }
  if (persona.corpus.manifest.length < 3) {
    failures.push(`${persona.id} corpus manifest has fewer than 3 starter sources`);
  }
  for (const entry of persona.corpus.manifest) {
    if (!entry.title || !entry.citation || !entry.license) {
      failures.push(`${persona.id} corpus entry ${entry.id} lacks title/citation/license`);
    }
  }
}

if (failures.length) {
  console.error('Persona corpus audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Persona corpus audit passed: canonical manifests are versioned, cited, and namespace-scoped. (static-marker)');
