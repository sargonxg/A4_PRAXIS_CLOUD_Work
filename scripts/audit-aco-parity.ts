#!/usr/bin/env tsx
/**
 * audit:aco-parity (static-marker) - confirm the 14-entity ACO copy
 * is present, mounted in-app, and reusable from the Ontology tab.
 */

import { promises as fs } from 'node:fs';
import process from 'node:process';
import { ACO_COPY, ACO_THESIS_COPY, ACO_WORKED_EXAMPLE } from '../src/lib/ontology/aco-copy';

const EXPECTED_IDS = [
  'actor',
  'claim',
  'interest',
  'constraint',
  'leverage',
  'commitment',
  'event',
  'narrative',
  'institution',
  'norm',
  'resource',
  'risk',
  'policy',
  'grievance',
] as const;

async function main() {
  const failures: string[] = [];

  for (const id of EXPECTED_IDS) {
    if (!ACO_COPY.find((copy) => copy.id === id)) {
      failures.push(`ACO_COPY missing entity ${id}`);
    }
  }
  if (ACO_COPY.length !== EXPECTED_IDS.length) {
    failures.push(`ACO_COPY has ${ACO_COPY.length} entries, expected ${EXPECTED_IDS.length}`);
  }
  const coreCount = ACO_COPY.filter((copy) => copy.tier === 'core').length;
  const extendedCount = ACO_COPY.filter((copy) => copy.tier === 'extended').length;
  if (coreCount !== 8) failures.push(`ACO_COPY has ${coreCount} core entries, expected 8`);
  if (extendedCount !== 6) failures.push(`ACO_COPY has ${extendedCount} extended entries, expected 6`);
  const normalizedThesis = ACO_THESIS_COPY.replace(/\s+/g, ' ');
  if (!normalizedThesis.includes('The grammar is shared; the content is yours.')) {
    failures.push('ACO_THESIS_COPY is missing the product thesis close');
  }
  if (ACO_WORKED_EXAMPLE.decomposition.length < 6) {
    failures.push('ACO_WORKED_EXAMPLE decomposition is too thin');
  }

  await assertFileContains('src/components/ontology/AcoFirstTimeOverlay.tsx', ['ACO_COPY', 'ACO_THESIS_COPY', 'ACO_WORKED_EXAMPLE'], failures);
  await assertFileContains('src/components/workbench/workbench-active-case.tsx', ['AcoFirstTimeOverlay', 'trigger="first-case-open"'], failures);
  await assertFileContains('src/components/ontology/OntologySchemaViewer.tsx', ['View the conflict grammar', 'trigger="manual"'], failures);
  await assertFileContains('src/app/onboarding/page.tsx', ['14 conflict-grammar entities', 'full primer'], failures);

  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8')) as { scripts?: Record<string, string> };
  if (packageJson.scripts?.['audit:aco-parity'] !== 'tsx scripts/audit-aco-parity.ts') {
    failures.push('package.json missing audit:aco-parity script');
  }
  if (!packageJson.scripts?.['audit:gate']?.includes('npm run audit:aco-parity')) {
    failures.push('audit:gate does not include audit:aco-parity');
  }

  if (failures.length > 0) {
    console.error('audit:aco-parity FAILED');
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log('audit:aco-parity passed (14 entities, overlay mounted, ontology reference wired) (static-marker)');
}

async function assertFileContains(file: string, markers: string[], failures: string[]) {
  const content = await fs.readFile(file, 'utf8').catch(() => null);
  if (content === null) {
    failures.push(`${file} is missing`);
    return;
  }
  for (const marker of markers) {
    if (!content.includes(marker)) {
      failures.push(`${file} missing marker: ${marker}`);
    }
  }
}

main().catch((error) => {
  console.error('audit:aco-parity threw:', error);
  process.exit(2);
});
