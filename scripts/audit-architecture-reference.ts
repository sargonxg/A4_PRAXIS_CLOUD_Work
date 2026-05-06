import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'docs/architecture/PRAXIS_ARCHITECTURE.md',
  'docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md',
  'docs/architecture/MODEL_SELECTION.md',
  'docs/backlog/2026-05-06-master-charter-completion-todo.md',
  'ARCHITECTURE.md',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'TODO.md',
];

const failures: string[] = [];

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) {
    failures.push(`missing ${file}`);
  }
}

function body(file: string): string {
  return readFileSync(path.join(root, file), 'utf8');
}

if (failures.length === 0) {
  const bible = body('docs/architecture/PRAXIS_ARCHITECTURE.md');
  const alignment = body('docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md');
  const rootArchitecture = body('ARCHITECTURE.md');
  const startupDocs = ['README.md', 'AGENTS.md', 'CLAUDE.md', 'TODO.md'];

  const requiredBibleMarkers = [
    'PRAXIS — Architecture Bible',
    'Foundational invariants',
    'The audit chain',
    'Decision tree',
  ];
  for (const marker of requiredBibleMarkers) {
    if (!bible.includes(marker)) failures.push(`architecture bible missing marker: ${marker}`);
  }

  const requiredAlignmentMarkers = [
    'Gemini Enterprise',
    'Vertex AI',
    'Shipped And Enforced',
    'Partially Implemented Target State',
    'Known Reference/API Shape Drift',
  ];
  for (const marker of requiredAlignmentMarkers) {
    if (!alignment.includes(marker)) failures.push(`alignment doc missing marker: ${marker}`);
  }

  for (const marker of ['PRAXIS_ARCHITECTURE.md', 'PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md', 'audit:architecture-reference']) {
    if (!rootArchitecture.includes(marker)) failures.push(`root ARCHITECTURE.md missing marker: ${marker}`);
  }

  for (const file of startupDocs) {
    const text = body(file);
    for (const marker of ['PRAXIS_ARCHITECTURE.md', 'PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md']) {
      if (!text.includes(marker)) failures.push(`${file} missing architecture marker: ${marker}`);
    }
  }

  for (const file of ['README.md', 'AGENTS.md', 'TODO.md']) {
    if (!body(file).includes('audit:architecture-reference')) {
      failures.push(`${file} missing audit:architecture-reference`);
    }
  }
}

if (failures.length > 0) {
  console.error('[audit:architecture-reference] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:architecture-reference] ok');
