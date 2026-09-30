import { WORKSPACE_ROUTES } from '@/lib/navigation/primary-nav';

export interface CommandSearchAction {
  id: string;
  label: string;
  description: string;
  href: string;
  keywords: string[];
  badges: string[];
  sourcePosture: string | null;
}

export const COMMAND_SEARCH_ACTIONS: CommandSearchAction[] = [
  {
    id: 'open-home',
    label: 'Open chat',
    description: 'Ask, draft and review with your attached context.',
    href: WORKSPACE_ROUTES.chat,
    keywords: ['ask', 'chat', 'praxis', 'home', 'cockpit'],
    badges: ['action'],
    sourcePosture: null,
  },
  {
    id: 'open-capsule-factory',
    label: 'Open Capsules',
    description: 'Manage, improve, source, and download ContextCapsules.',
    href: WORKSPACE_ROUTES.capsules,
    keywords: ['capsules', 'repository', 'context'],
    badges: ['action'],
    sourcePosture: null,
  },
  {
    id: 'open-workspace',
    label: 'Sources and receipts',
    description: 'Inspect source documents and evidence receipts inside Capsules.',
    href: WORKSPACE_ROUTES.sources,
    keywords: ['sources', 'receipts', 'repository', 'workspace', 'documents'],
    badges: ['action', 'sources'],
    sourcePosture: 'source workspace',
  },
  {
    id: 'attach-source',
    label: 'Attach source',
    description: 'Upload or attach a source to the active capsule.',
    href: WORKSPACE_ROUTES.sources,
    keywords: ['source', 'upload', 'document'],
    badges: ['action', 'sources'],
    sourcePosture: 'explicit action',
  },
  {
    id: 'find-gaps',
    label: 'Find evidence gaps',
    description: 'Review evidence gaps from the active capsule.',
    href: `${WORKSPACE_ROUTES.chat}?${new URLSearchParams({ prompt: 'Review the attached context for evidence gaps, unsupported claims and missing sources.' })}`,
    keywords: ['gap', 'redflag', 'source', 'evidence'],
    badges: ['action', 'diagnostic'],
    sourcePosture: 'explicit action',
  },
  {
    id: 'create-capsule',
    label: 'Create capsule',
    description: 'Build a private capsule from documents, notes or a conversation.',
    href: WORKSPACE_ROUTES.newCapsule,
    keywords: ['new', 'create', 'capsule', 'context', 'builder'],
    badges: ['action'],
    sourcePosture: null,
  },
  {
    id: 'fork-demo',
    label: 'Fork sample capsule',
    description: 'Copy a sample structure into your workspace.',
    href: WORKSPACE_ROUTES.starters,
    keywords: ['starter', 'sample', 'demo'],
    badges: ['action', 'starter'],
    sourcePosture: 'starter context',
  },
  {
    id: 'improve-capsule',
    label: 'Improve capsule',
    description: 'Ask PRAXIS to find missing context.',
    href: `${WORKSPACE_ROUTES.chat}?${new URLSearchParams({ prompt: 'Review the attached capsule and propose improvements to its sources, assumptions and handover notes. Do not apply changes without my approval.' })}`,
    keywords: ['improve', 'missing', 'context'],
    badges: ['action'],
    sourcePosture: 'explicit action',
  },
  {
    id: 'runtime-doctor',
    label: 'Runtime doctor',
    description: 'Open Settings/System runtime proof and doctor commands.',
    href: '/app/settings?tab=system',
    keywords: ['runtime', 'doctor', 'health', 'diagnostics', 'system'],
    badges: ['diagnostic'],
    sourcePosture: 'live endpoint',
  },
  {
    id: 'research-runtime',
    label: 'Research runtime',
    description: 'Inspect agentic research health, local audit posture, and missing runtime gates.',
    href: '/app/settings?tab=system',
    keywords: ['research', 'agentic search', 'deep research', 'source scout'],
    badges: ['diagnostic'],
    sourcePosture: 'local audit',
  },
  {
    id: 'source-gaps',
    label: 'Source gaps',
    description: 'Review sourceability, missing evidence, and grounded-search posture.',
    href: '/app/settings?tab=system',
    keywords: ['source gaps', 'sourceability', 'evidence gaps', 'grounding'],
    badges: ['diagnostic', 'sources'],
    sourcePosture: 'explicit action',
  },
  {
    id: 'agent-runs',
    label: 'Agent runs',
    description: 'Inspect recent agent runs from the existing PRAXIS cockpit and run ledger.',
    href: WORKSPACE_ROUTES.savedWork,
    keywords: ['agent runs', 'run ledger', 'cloud tasks', 'worker'],
    badges: ['diagnostic'],
    sourcePosture: 'runtime ledger',
  },
  {
    id: 'settings-system',
    label: 'Settings/System',
    description: 'Open runtime, graph, search, and canary diagnostics.',
    href: '/app/settings?tab=system',
    keywords: ['settings', 'system', 'auth canary', 'graph provenance', 'search'],
    badges: ['setting'],
    sourcePosture: 'static route check',
  },
  {
    id: 'intellectual-devices',
    label: 'Intellectual Devices',
    description: 'Browse thinking-device capsules and expert methods.',
    href: '/app/capsules',
    keywords: ['intellectual devices', 'thinking devices', 'assumption stress', 'ach', 'premortem'],
    badges: ['thinking device'],
    sourcePosture: 'starter context',
  },
  {
    id: 'praxis-import-export',
    label: '.praxis import/export',
    description: 'Use Capsules controls for portable Capsule+ packages.',
    href: '/app/capsules',
    keywords: ['.praxis', 'import', 'export', 'capsule plus', 'download'],
    badges: ['action'],
    sourcePosture: 'capsule package',
  },
];
