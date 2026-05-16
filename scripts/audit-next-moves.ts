/**
 * audit:next-moves
 *
 * Locks two invariants on the NextMove contract codex added in
 * src/lib/assistant/next-moves.ts:
 *
 *   1. The contract NEVER surfaces more than three moves. The whole
 *      product principle is "max three next moves" — if a future PR
 *      raises the ceiling we want CI to refuse it.
 *
 *   2. The user-visible labels stay inside the locked vocabulary
 *      ("Draft memo" / "Check sources" / "Map situation" / "Build
 *      timeline" / "Stress-test option" / "Add Source Core" /
 *      "Add Situation Core"). Adding a new label requires
 *      updating this audit explicitly.
 *
 *   3. NextMove[] consumers — the Ask workspace and the app shell
 *      home — must import getNextMoves; they should not render
 *      tool grids inline.
 *
 * Fast static check; no module evaluation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = join(root, rel);
  if (!existsSync(full)) {
    failures.push(`missing ${rel}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

const SRC_PATH = 'src/lib/assistant/next-moves.ts';
const src = read(SRC_PATH);

if (src) {
  const maxMatch = src.match(/const\s+MAX_NEXT_MOVES\s*=\s*(\d+)/);
  if (!maxMatch) {
    failures.push(`${SRC_PATH} must declare MAX_NEXT_MOVES as a top-level const`);
  } else if (Number(maxMatch[1]) > 3) {
    failures.push(`${SRC_PATH} MAX_NEXT_MOVES is ${maxMatch[1]} — must stay <= 3 per product principle`);
  }

  // Locked label vocabulary. Adding a label here is a deliberate move,
  // not an accident.
  const ALLOWED_LABELS = [
    'Draft memo',
    'Check sources',
    'Map situation',
    'Build timeline',
    'Stress-test option',
    'Add Source Core',
    'Add Situation Core',
  ];
  // Pull all labels declared as the discriminated union member.
  const labelLiterals = [...src.matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
  for (const lit of labelLiterals) {
    if (!ALLOWED_LABELS.includes(lit)) {
      failures.push(`${SRC_PATH} introduces unapproved NextMove label "${lit}" — update audit-next-moves.ts deliberately if intended`);
    }
  }
}

// Consumers must import getNextMoves rather than re-roll their own
// tool grid logic.
const CONSUMERS = [
  'src/components/ask/AskWorkspacePage.tsx',
  'src/components/app/praxis-workspace-shell.tsx',
];
for (const consumer of CONSUMERS) {
  const text = read(consumer);
  if (!text) continue;
  if (!text.includes('getNextMoves')) {
    failures.push(`${consumer} must consume getNextMoves from src/lib/assistant/next-moves.ts (no tool grid drift)`);
  }
}

if (failures.length > 0) {
  console.error('audit:next-moves failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('audit:next-moves OK (MAX_NEXT_MOVES <= 3, vocabulary locked, consumers consume getNextMoves)');
