import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'docs/architecture/PRAXIS_ARCHITECTURE.md',
  'docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md',
  'docs/architecture/MODEL_SELECTION.md',
  'docs/adr/README.md',
  'docs/audits/2026-05-06-SELF_AUDIT.md',
  'docs/backlog/2026-05-06-from-self-audit.md',
  'docs/backlog/2026-05-06-master-charter-completion-todo.md',
  'ARCHITECTURE.md',
  'package.json',
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
  const adrReadme = body('docs/adr/README.md');
  const selfAudit = body('docs/audits/2026-05-06-SELF_AUDIT.md');
  const selfAuditBacklog = body('docs/backlog/2026-05-06-from-self-audit.md');
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
    'Active Status Ledger',
    'Partially Implemented Target State',
    'Known Reference/API Shape Drift',
  ];
  for (const marker of requiredAlignmentMarkers) {
    if (!alignment.includes(marker)) failures.push(`alignment doc missing marker: ${marker}`);
  }

  for (const marker of ['Architecture Decision Records', 'MADR-style', 'Current ADR Set']) {
    if (!adrReadme.includes(marker)) failures.push(`ADR README missing marker: ${marker}`);
  }

  for (const marker of ['PRAXIS Self Audit Against Architecture Bible', '3 S0', '15 S1', 'Proposed Plan For Giulio']) {
    if (!selfAudit.includes(marker)) failures.push(`self-audit missing marker: ${marker}`);
  }

  for (const marker of ['S0 / S1 Launch Blockers', 'Public demo contract', 'Persona CI', 'S2 Backlog']) {
    if (!selfAuditBacklog.includes(marker)) failures.push(`self-audit backlog missing marker: ${marker}`);
  }

  for (const marker of ['PRAXIS_ARCHITECTURE.md', 'PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md', 'audit:architecture-reference', 'audit:architecture-chain']) {
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

  const packageJson = JSON.parse(body('package.json')) as { scripts?: Record<string, string> };
  if (!packageJson.scripts?.['audit:architecture-chain']) failures.push('package.json missing audit:architecture-chain');
  if (!packageJson.scripts?.['audit:gate']?.includes('audit:architecture-chain')) {
    failures.push('audit:gate must include audit:architecture-chain');
  }
}

if (failures.length > 0) {
  console.error('[audit:architecture-reference] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:architecture-reference] ok');
