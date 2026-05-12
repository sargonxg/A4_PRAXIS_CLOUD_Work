import { existsSync, readFileSync } from 'node:fs';

const path = 'docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md';
const failures: string[] = [];

if (!existsSync(path)) {
  failures.push(`${path} missing`);
} else {
  const text = readFileSync(path, 'utf8');
  for (const marker of [
    'Tool Authoring Spike',
    'Duration',
    'Result: PASS',
    'SKILL.md',
    'Tool Contract v2',
    'Semantic canary',
  ]) {
    if (!text.includes(marker)) failures.push(`${path} missing marker: ${marker}`);
  }
}

if (failures.length > 0) {
  console.error('Tool authoring spike audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tool authoring spike audit passed. (static-marker)');
