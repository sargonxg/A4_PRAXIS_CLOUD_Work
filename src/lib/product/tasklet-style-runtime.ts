export type PraxisAgentRuntimeLayer =
  | 'frontend'
  | 'identity'
  | 'context'
  | 'agent-run-ledger'
  | 'tool-layer'
  | 'model-runtime'
  | 'durable-work'
  | 'integration'
  | 'browser-fallback'
  | 'code-sandbox'
  | 'outputs'
  | 'observability';

export type PraxisAgentRuntimeStatus = 'live' | 'build-next' | 'defer';

export interface PraxisAgentRuntimeDecision {
  layer: PraxisAgentRuntimeLayer;
  status: PraxisAgentRuntimeStatus;
  use: string;
  repoAnchor: string;
  rationale: string;
}

export type PraxisAgentKind = 'daily-brief' | 'research-memo' | 'watchlist';

export interface PraxisAgentBlueprint {
  id: PraxisAgentKind;
  label: string;
  capsuleRequired: boolean;
  triggerTypes: PraxisAgentTriggerType[];
  firstTools: string[];
  outputSurface: 'ask' | 'memo-studio' | 'canvas' | 'library';
  approvalRequiredFor: string[];
}

export type PraxisAgentTriggerType =
  | 'manual'
  | 'schedule'
  | 'webhook'
  | 'email_event'
  | 'source_update'
  | 'capsule_change';

export const PRAXIS_TASKLET_STYLE_STACK: PraxisAgentRuntimeDecision[] = [
  {
    layer: 'frontend',
    status: 'live',
    use: 'Next.js, React, TypeScript, existing simple PRAXIS app spine',
    repoAnchor: 'src/app, src/components',
    rationale: 'The product already has the app shell Tasklet-style agents need.',
  },
  {
    layer: 'identity',
    status: 'live',
    use: 'Firebase Auth, owner-scoped Firestore, and Cloud SQL user/run joins',
    repoAnchor: 'src/lib/auth, src/lib/firebase',
    rationale: 'Agent state must inherit the existing user and owner boundary while the run ledger becomes queryable.',
  },
  {
    layer: 'context',
    status: 'live',
    use: 'ContextCapsules, cores, contextStacks/default',
    repoAnchor: 'src/lib/context',
    rationale: 'PRAXIS agents should run from a capsule, not a blank prompt.',
  },
  {
    layer: 'agent-run-ledger',
    status: 'build-next',
    use: 'Cloud SQL Postgres agent specs, runs, tool calls, approvals, run events; Firestore mirrors active capsule UI state',
    repoAnchor: 'src/lib/agent-runtime',
    rationale: 'Persistent agent execution needs relational auditability, joins, retries, and reporting without replacing Firestore capsules.',
  },
  {
    layer: 'tool-layer',
    status: 'live',
    use: 'Canonical PRAXIS tool registry and calibrated AI routes',
    repoAnchor: 'src/lib/constants/tool-registry.ts',
    rationale: 'Agents should invoke PRAXIS capabilities before adding generic integrations.',
  },
  {
    layer: 'model-runtime',
    status: 'live',
    use: 'Vertex AI/Gemini through the existing provider abstraction',
    repoAnchor: 'src/lib/ai/providers.ts',
    rationale: 'This preserves current audits, secrets, compliance posture, and model matrix discipline.',
  },
  {
    layer: 'durable-work',
    status: 'build-next',
    use: 'Cloud Tasks, Cloud Scheduler, Pub/Sub, Cloud Run worker routes',
    repoAnchor: 'scripts/audit-gcp.mjs, infrastructure',
    rationale: 'The GCP primitives already exist and fit long-running agent runs.',
  },
  {
    layer: 'integration',
    status: 'defer',
    use: 'Private MCP gateway first, then selected OAuth/SaaS integrations',
    repoAnchor: 'backend/mcp/praxis_server.py',
    rationale: 'Expose PRAXIS read tools before adding broad third-party write access.',
  },
  {
    layer: 'browser-fallback',
    status: 'defer',
    use: 'Read-only allowlisted browser sessions, later Browserbase or Cloud Run sandbox',
    repoAnchor: 'tests/e2e, future src/lib/agent-runtime/browser.ts',
    rationale: 'Browser control is powerful and risky; ledger and approvals must ship first.',
  },
  {
    layer: 'code-sandbox',
    status: 'defer',
    use: 'Document/table processing sandbox only after approval model exists',
    repoAnchor: 'future src/lib/agent-runtime/sandbox.ts',
    rationale: 'Generated code execution should not precede run isolation and audit trails.',
  },
  {
    layer: 'outputs',
    status: 'live',
    use: 'Memo Studio, Canvas, Library, handover packages',
    repoAnchor: 'src/app/api/memos, src/components/cores',
    rationale: 'Agents should produce known PRAXIS artifacts rather than arbitrary generated UI.',
  },
  {
    layer: 'observability',
    status: 'live',
    use: 'Audit scripts, health routes, telemetry, Graphify',
    repoAnchor: 'scripts/audit-*.ts, graphify-out',
    rationale: 'The runtime must be inspectable before it becomes autonomous.',
  },
];

export const PRAXIS_FIRST_AGENT_BLUEPRINTS: PraxisAgentBlueprint[] = [
  {
    id: 'daily-brief',
    label: 'Daily Brief Agent',
    capsuleRequired: true,
    triggerTypes: ['manual', 'schedule'],
    firstTools: ['grounded-search', 'source-scout', 'timeline-events', 'risk-indicators', 'policy-memo'],
    outputSurface: 'memo-studio',
    approvalRequiredFor: [
      'send external notification',
      'mark claim resolved',
      'promote graph fact',
    ],
  },
  {
    id: 'research-memo',
    label: 'Research Memo Agent',
    capsuleRequired: true,
    triggerTypes: ['manual'],
    firstTools: ['context-resolve', 'source-scout', 'research-extract', 'policy-memo', 'red-team-review'],
    outputSurface: 'memo-studio',
    approvalRequiredFor: [
      'final export',
      'accept unsupported claim',
      'promote graph fact',
    ],
  },
  {
    id: 'watchlist',
    label: 'Watchlist Agent',
    capsuleRequired: true,
    triggerTypes: ['manual', 'schedule', 'source_update'],
    firstTools: ['grounded-search', 'risk-indicators', 'timeline-events', 'sanctions-scan'],
    outputSurface: 'ask',
    approvalRequiredFor: [
      'notify external recipient',
      'change capsule status',
      'change output goal',
    ],
  },
];

export const FORBIDDEN_PRIMARY_RUNTIME_ADDITIONS = [
  'supabase',
  'inngest',
  'trigger.dev',
  'prisma',
  'new primary database',
] as const;

export const PRAXIS_DEFERRED_BROWSER_AUTOMATION_LANE = {
  status: 'defer' as const,
  framework: 'browser-use',
  frameworkRuntime: 'python',
  browserInfrastructure: 'Steel.dev',
  initialMode: 'managed-read-only',
  scaleMode: 'self-host-on-gke',
  guardrails: [
    'allowlisted domains',
    'human approval before credentialed or destructive actions',
    'max step cap',
    'max session minute cap',
    'internal cost cap',
    'timeout watchdog',
    'idempotency key',
    'trace id',
    'action audit log',
  ],
  rationale:
    'Browser automation is powerful but risky; PRAXIS should ship the capsule-aware run ledger, outputs, and approvals before allowing browser sessions.',
} as const;

export function runtimeDecisionForLayer(
  layer: PraxisAgentRuntimeLayer
): PraxisAgentRuntimeDecision {
  const decision = PRAXIS_TASKLET_STYLE_STACK.find((item) => item.layer === layer);
  if (!decision) throw new Error(`Unknown PRAXIS agent runtime layer: ${layer}`);
  return decision;
}

export function firstAgentBlueprint(id: PraxisAgentKind): PraxisAgentBlueprint {
  const blueprint = PRAXIS_FIRST_AGENT_BLUEPRINTS.find((item) => item.id === id);
  if (!blueprint) throw new Error(`Unknown PRAXIS agent blueprint: ${id}`);
  return blueprint;
}
