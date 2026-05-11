import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];

const requiredFiles = [
  'src/lib/semantica/context-core-adapter.ts',
  'src/app/api/situations/route.ts',
  'src/app/app/situations/new/page.tsx',
  'src/app/api/health/semantica-core/route.ts',
  'src/app/api/situations/[id]/inspect/route.ts',
  'src/lib/semantica/rust-runtime.ts',
  'backend/services/semantica_context_store.py',
  'backend/tests/test_semantica_context_store.py',
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

  const route = file('src/app/api/situations/route.ts');
  for (const marker of ['cleanSemanticaContextGraph', 'MAX_SEMANTICA_GRAPH_BYTES', 'semanticaGraphNodes']) {
    if (!route.includes(marker)) failures.push(`situations API missing ${marker}`);
  }

  const firestore = file('src/lib/firebase/situations.ts');
  for (const marker of ['semantica-context-core', 'postgresPromotionStatus', 'owner-scoped-firestore-graph-seed']) {
    if (!firestore.includes(marker)) failures.push(`Firestore situation creation missing ${marker}`);
  }

  const realCreatePage = file('src/app/app/situations/new/page.tsx');
  for (const marker of ['buildSemanticaSituationGraph', 'semanticaContextGraph', 'semanticaLayer']) {
    if (!realCreatePage.includes(marker)) failures.push(`authenticated context creation missing ${marker}`);
  }

  const rustRuntime = file('src/lib/semantica/rust-runtime.ts');
  for (const marker of ['PRAXIS_SEMANTICA_CORE_BIN', 'execFile', 'validateWithRustSemanticaCore']) {
    if (!rustRuntime.includes(marker)) failures.push(`Rust runtime bridge missing ${marker}`);
  }

  const backendStore = file('backend/services/semantica_context_store.py');
  for (const marker of ['GraphNodeRecord', 'GraphEdgeRecord', 'promote_semantica_context_graph', 'uuid5']) {
    if (!backendStore.includes(marker)) failures.push(`Semantica backend store missing ${marker}`);
  }

  const inspectRoute = file('src/app/api/situations/[id]/inspect/route.ts');
  for (const marker of ['semanticaContextGraph', "doc('semantica-context-core')"]) {
    if (!inspectRoute.includes(marker)) failures.push(`situation inspect route missing ${marker}`);
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
