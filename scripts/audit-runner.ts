import { spawnSync } from 'node:child_process';

type ScriptStep = {
  label: string;
  script: string;
};

const GROUPS: Record<string, ScriptStep[]> = {
  routes: [
    { label: 'AI route inventory', script: 'internal:audit-routes' },
  ],
  ontology: [
    { label: 'Ontology system', script: 'audit:ontology-system' },
  ],
};

const DROPPED_AUDIT_LEAVES = [
  {
    script: 'audit:path-coverage',
    replacement: 'audit:path-tool-coverage',
    reason: 'duplicate package alias removed; path-tool coverage remains the durable leaf',
  },
] as const;

GROUPS.capsules = [
  { label: 'Capsule depth', script: 'audit:capsule-depth' },
  { label: 'Capsule database', script: 'audit:capsule-database' },
  { label: 'Capsule consolidation', script: 'audit:capsule-consolidation' },
  { label: 'Capsule contract', script: 'audit:capsule-contract' },
  { label: 'Capsule memory contract', script: 'audit:capsule-memory-contract' },
  { label: 'Capsule V3', script: 'audit:capsule-v3' },
  { label: 'Capsule context capture', script: 'audit:capsule-context-capture' },
  { label: 'Capsule research dossiers', script: 'audit:capsule-research-dossiers' },
  { label: 'Capsule inspect visibility', script: 'audit:capsule-inspect-visibility' },
  { label: 'Capsule backfill readiness', script: 'audit:capsule-backfill-readiness' },
  { label: 'Capsule graphlite projections', script: 'audit:capsule-graphlite-projections' },
  { label: 'Output capsule storage', script: 'audit:output-capsule-storage' },
  { label: 'Knowledge library contract', script: 'audit:knowledge-library-contract' },
  { label: 'Named stack contract', script: 'audit:named-stack-contract' },
  { label: 'Graph proposal review contract', script: 'audit:graph-proposal-review-contract' },
];

GROUPS.agents = [
  { label: 'Agent process contract', script: 'audit:agent-process-contract' },
  { label: 'Agent runtime proof', script: 'audit:agent-runtime-proof' },
];

GROUPS.architecture = [
  { label: 'Architecture chain', script: 'audit:architecture-chain' },
  { label: 'Repository shape', script: 'audit:repo-shape' },
  { label: 'Architecture reference', script: 'audit:architecture-reference' },
];

GROUPS.surface = [
  { label: 'MVP route shape', script: 'audit:mvp-route-shape' },
  { label: 'Tool contracts', script: 'audit:tool-contracts' },
  { label: 'Purpose surface', script: 'audit:purpose-surface' },
  { label: 'Public surface', script: 'audit:public-surface' },
  { label: 'Release notes', script: 'audit:release-notes' },
  { label: 'Ask cockpit runtime', script: 'audit:ask-cockpit-runtime' },
  { label: 'Single H1', script: 'audit:single-h1' },
];

GROUPS.runtime = [
  { label: 'Deep preship', script: 'audit:deep-preship' },
  { label: 'Cognee isolation', script: 'audit:cognee' },
  { label: 'GCP', script: 'audit:gcp' },
];

GROUPS.simplification = [
  { label: 'Route consolidation', script: 'audit:route-consolidation' },
  { label: 'Archive guard', script: 'audit:no-normal-user-archive' },
  { label: 'Admin internals', script: 'audit:admin-only-internals' },
  { label: 'Next moves', script: 'audit:next-moves' },
  { label: 'Context health', script: 'audit:context-health' },
  { label: 'Canonical names', script: 'audit:names' },
];

GROUPS.gate = [
  { label: 'TypeScript', script: 'typecheck' },
  { label: 'Production build', script: 'build' },
  { label: 'Routes', script: 'audit:routes' },
  { label: 'Capsule lane', script: 'audit:capsules' },
  { label: 'Agent lane', script: 'audit:agents' },
  { label: 'Architecture lane', script: 'audit:architecture' },
  { label: 'Surface lane', script: 'audit:surface' },
  { label: 'Runtime lane', script: 'audit:runtime' },
  { label: 'Simplification', script: 'audit:simplification' },
];

GROUPS.launch = [
  ...GROUPS.gate,
  { label: 'Launch readiness', script: 'audit:launch-readiness' },
];

function runNpmScript(step: ScriptStep): void {
  console.log(`\n[audit-runner] ${step.label}: npm run ${step.script}`);
  const command = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', `npm run ${step.script}`] : ['run', step.script];
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    if (result.error) {
      throw new Error(`${step.script} failed to start: ${result.error.message}`);
    }
    const status = typeof result.status === 'number' ? result.status : 1;
    throw new Error(`${step.script} failed with exit code ${status}`);
  }
}

function usage(): string {
  return [
    'Usage: tsx scripts/audit-runner.ts <group>',
    `Groups: ${Object.keys(GROUPS).sort().join(', ')}`,
    `Dropped duplicate leaves: ${DROPPED_AUDIT_LEAVES.map((leaf) => `${leaf.script} -> ${leaf.replacement}`).join(', ')}`,
  ].join('\n');
}

function main(): void {
  const groupName = process.argv[2] ?? 'launch';
  const steps = GROUPS[groupName];
  if (!steps) {
    console.error(usage());
    process.exit(2);
  }

  console.log(`[audit-runner] starting ${groupName} (${steps.length} steps)`);
  if (DROPPED_AUDIT_LEAVES.length > 0) {
    console.log('[audit-runner] dropped duplicate audit leaves:');
    for (const leaf of DROPPED_AUDIT_LEAVES) {
      console.log(`[audit-runner] - ${leaf.script} -> ${leaf.replacement}: ${leaf.reason}`);
    }
  }
  for (const step of steps) runNpmScript(step);
  console.log(`[audit-runner] ${groupName} complete`);
}

try {
  main();
} catch (error) {
  console.error(`[audit-runner] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
