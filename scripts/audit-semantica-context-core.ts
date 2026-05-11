import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];

const requiredFiles = [
  'src/lib/semantica/context-core-adapter.ts',
  'src/lib/contexts/context-create-payload.ts',
  'src/app/api/situations/route.ts',
  'tests/unit/lib/semantica/context-core-adapter.test.ts',
  'docs/architecture/PRAXIS_SEMANTICA_CONTEXT_CORE_PLAN_2026-05-11.md',
];

for (const file of requiredFiles) {
  if (!existsSync(join(process.cwd(), file))) failures.push(`missing ${file}`);
}

function file(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

if (failures.length === 0) {
  const adapter = file('src/lib/semantica/context-core-adapter.ts');
  for (const marker of [
    'praxis-semantica-context-core.v1',
    'targetSemanticaVersion',
    'intendedSemanticaCapabilities',
    'entity_resolution',
    'conflict_detection',
    'multi_hop_retrieval',
    'policy_trace',
  ]) {
    if (!adapter.includes(marker)) failures.push(`Semantica adapter missing ${marker}`);
  }

  const payload = file('src/lib/contexts/context-create-payload.ts');
  for (const marker of ['buildSemanticaContextGraph', 'semanticaLayer', 'semanticaContextGraph']) {
    if (!payload.includes(marker)) failures.push(`context create payload missing ${marker}`);
  }

  const route = file('src/app/api/situations/route.ts');
  for (const marker of ['cleanSemanticaContextGraph', 'MAX_SEMANTICA_GRAPH_BYTES', 'semanticaGraphNodes']) {
    if (!route.includes(marker)) failures.push(`situations API missing ${marker}`);
  }

  const plan = file('docs/architecture/PRAXIS_SEMANTICA_CONTEXT_CORE_PLAN_2026-05-11.md');
  for (const marker of ['service boundary', 'Semantica', 'Context Core', 'Ask PRAXIS']) {
    if (!plan.includes(marker)) failures.push(`Semantica plan missing ${marker}`);
  }
}

if (failures.length > 0) {
  console.error('[audit:semantica-context-core] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:semantica-context-core] ok');
