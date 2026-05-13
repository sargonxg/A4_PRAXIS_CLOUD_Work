export type ContextHealthStatus = 'ready' | 'partial' | 'missing';

export interface ContextHealthSignal {
  id: string;
  label: string;
  status: ContextHealthStatus;
  detail: string;
}

export interface NextBestAction {
  id: string;
  label: string;
  detail: string;
  href: string;
  priority: 'primary' | 'secondary' | 'optional';
}

export interface ContextHealthInput {
  hasUserCore: boolean;
  hasSituationCore: boolean;
  sourceCount: number;
  documentCount?: number;
  actorCount: number;
  hasTimeline: boolean;
  evidenceGapCount: number;
  hasDraft: boolean;
  situationHref?: string;
}

export interface ContextHealthReport {
  score: number;
  label: 'Ready to draft' | 'Needs grounding' | 'Context incomplete';
  signals: ContextHealthSignal[];
  nextActions: NextBestAction[];
}

export function buildContextHealthReport(input: ContextHealthInput): ContextHealthReport {
  const evidenceCount = input.sourceCount + (input.documentCount ?? 0);
  const signals: ContextHealthSignal[] = [
    {
      id: 'user-core',
      label: 'User Core',
      status: input.hasUserCore ? 'ready' : 'missing',
      detail: input.hasUserCore ? 'Role, audience, standards, and voice are attached.' : 'Attach how the analyst works before asking.',
    },
    {
      id: 'situation-core',
      label: 'Situation Core',
      status: input.hasSituationCore ? 'ready' : 'missing',
      detail: input.hasSituationCore ? 'A case frame is selected.' : 'Select the case, geography, actors, and decision moment.',
    },
    {
      id: 'sources',
      label: 'Sources',
      status: evidenceCount >= 4 ? 'ready' : evidenceCount > 0 ? 'partial' : 'missing',
      detail: evidenceCount > 0 ? `${evidenceCount} evidence items attached.` : 'Attach receipts before drafting final judgments.',
    },
    {
      id: 'actors',
      label: 'Actors',
      status: input.actorCount >= 3 ? 'ready' : input.actorCount > 0 ? 'partial' : 'missing',
      detail: input.actorCount > 0 ? `${input.actorCount} actors named.` : 'Name who can move, block, or absorb the decision.',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      status: input.hasTimeline ? 'ready' : 'partial',
      detail: input.hasTimeline ? 'Temporal context is present.' : 'Clarify dates, phases, and freshness caveats.',
    },
    {
      id: 'evidence-gaps',
      label: 'Evidence gaps',
      status: input.evidenceGapCount === 0 ? 'ready' : input.evidenceGapCount <= 3 ? 'partial' : 'missing',
      detail: input.evidenceGapCount === 0 ? 'No open gap is flagged.' : `${input.evidenceGapCount} open gaps need review.`,
    },
    {
      id: 'draft',
      label: 'Output',
      status: input.hasDraft ? 'ready' : 'partial',
      detail: input.hasDraft ? 'A working draft exists.' : 'Create a memo, brief, or handover target.',
    },
  ];

  const score = clamp(
    (input.hasUserCore ? 15 : 0) +
      (input.hasSituationCore ? 20 : 0) +
      Math.min(20, evidenceCount * 5) +
      Math.min(15, input.actorCount * 5) +
      (input.hasTimeline ? 10 : 4) +
      Math.max(0, 10 - input.evidenceGapCount * 2) +
      (input.hasDraft ? 10 : 4),
  );

  return {
    score,
    label: score >= 80 ? 'Ready to draft' : score >= 55 ? 'Needs grounding' : 'Context incomplete',
    signals,
    nextActions: buildNextActions(input, evidenceCount).slice(0, 3),
  };
}

function buildNextActions(input: ContextHealthInput, evidenceCount: number): NextBestAction[] {
  const situationHref = input.situationHref ?? '/app/contexts';
  const actions: NextBestAction[] = [];

  if (!input.hasUserCore) {
    actions.push({
      id: 'attach-user-core',
      label: 'Attach User Core',
      detail: 'Set role, audience, style, and evidence standards.',
      href: '/app/cores/user',
      priority: 'primary',
    });
  }
  if (!input.hasSituationCore) {
    actions.push({
      id: 'attach-situation-core',
      label: 'Attach Situation Core',
      detail: 'Choose the case frame before asking or drafting.',
      href: '/app/contexts',
      priority: 'primary',
    });
  }
  if (evidenceCount < 3) {
    actions.push({
      id: 'attach-sources',
      label: 'Attach sources',
      detail: 'Ground the active context with receipts and documents.',
      href: situationHref,
      priority: input.hasSituationCore ? 'primary' : 'secondary',
    });
  }
  if (input.actorCount < 3) {
    actions.push({
      id: 'map-actors',
      label: 'Map stakeholders',
      detail: 'Make leverage, blockers, and audiences explicit.',
      href: '/app/tools',
      priority: 'secondary',
    });
  }
  if (!input.hasTimeline) {
    actions.push({
      id: 'repair-timeline',
      label: 'Resolve timeline gap',
      detail: 'Add dates and freshness caveats before recommendations.',
      href: situationHref,
      priority: 'secondary',
    });
  }
  if (input.evidenceGapCount > 0) {
    actions.push({
      id: 'review-gaps',
      label: 'Review evidence gaps',
      detail: 'Find sources or rewrite unsupported claims cautiously.',
      href: '/app/write',
      priority: 'secondary',
    });
  }
  if (!input.hasDraft && input.hasUserCore && input.hasSituationCore) {
    actions.push({
      id: 'draft-memo',
      label: 'Draft from context',
      detail: 'Turn the active stack into a page-like memo.',
      href: '/app/write',
      priority: evidenceCount >= 3 ? 'primary' : 'secondary',
    });
  }

  actions.push({
    id: 'ask-context',
    label: 'Ask PRAXIS',
    detail: 'Reason over the active cores and source posture.',
    href: '/app/assistant',
    priority: 'optional',
  });

  return actions.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
}

function priorityWeight(priority: NextBestAction['priority']) {
  return priority === 'primary' ? 3 : priority === 'secondary' ? 2 : 1;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
