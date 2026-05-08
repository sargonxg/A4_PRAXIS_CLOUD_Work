import cases from '../tests/fixtures/ontology-classifier/cases.json';
import { classifyOntologySignals } from '../src/lib/ontology/classifier';
import { isOntologyId, type OntologyId } from '../src/lib/ontology/types';

interface Fixture {
  name: string;
  description: string;
  role?: string;
  expectedPrimaryOntologyId: OntologyId;
}

const fixtures = cases as Fixture[];
const failures: string[] = [];
let correct = 0;

for (const fixture of fixtures) {
  if (!isOntologyId(fixture.expectedPrimaryOntologyId)) {
    failures.push(`${fixture.name}: invalid expected ontology ${fixture.expectedPrimaryOntologyId}`);
    continue;
  }

  const result = classifyOntologySignals(fixture);
  if (result.primaryOntologyId === fixture.expectedPrimaryOntologyId) {
    correct += 1;
  } else {
    failures.push(
      `${fixture.name}: expected ${fixture.expectedPrimaryOntologyId}, got ${result.primaryOntologyId} (${result.rationale})`,
    );
  }
}

const accuracy = fixtures.length > 0 ? correct / fixtures.length : 0;
const floor = 0.8;

if (accuracy < floor || failures.length > 0) {
  console.error(`Ontology classifier audit failed: ${correct}/${fixtures.length} (${Math.round(accuracy * 100)}%)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Ontology classifier audit passed: ${correct}/${fixtures.length} (${Math.round(accuracy * 100)}%) (static-marker)`);
