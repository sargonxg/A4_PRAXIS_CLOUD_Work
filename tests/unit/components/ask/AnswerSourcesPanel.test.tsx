import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  AnswerSourceGapChips,
  AnswerSourcesPanel,
  type AnswerSourcesPanelProps,
} from '@/components/ask/AnswerSourcesPanel';
import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';

function render(html: React.ReactElement) {
  return renderToStaticMarkup(html);
}

const baseEnvelope = {
  sourceCards: [],
  claimLedger: [],
  sourceabilityVerdicts: [],
  claimLedgerSummary: {
    totalClaims: 0,
    supportedClaims: 0,
    weakClaims: 0,
    unsupportedClaims: 0,
    contradictedClaims: 0,
    modelPriorClaims: 0,
    assumptionClaims: 0,
  },
  sourceAudit: {
    sourceCount: 0,
    sourceReceiptCount: 0,
    sourceTypes: [],
    gapCount: 0,
    supportedClaimCount: 0,
    weakClaimCount: 0,
    unsupportedClaimCount: 0,
    contradictedClaimCount: 0,
    modelPriorClaimCount: 0,
    assumptionClaimCount: 0,
    sourcePosture: 'model_prior_or_inference',
    gapPosture: 'no_recorded_gaps',
  },
  sourceRefreshDocket: {
    capsuleId: 'capsule-test',
    capsuleVersion: 1,
    generatedAt: '2026-07-08T12:00:00.000Z',
    items: [],
    sourceIds: [],
    excerptSourceIds: [],
    staleSourceIds: [],
    missingEvidenceGaps: [],
    lastRefreshedAt: null,
    needsRefresh: false,
    nextActions: [],
  },
} as unknown as AskAnswerEnvelope;

function fixtureEnvelope(overrides: Partial<AskAnswerEnvelope> = {}): AskAnswerEnvelope {
  return {
    ...baseEnvelope,
    ...overrides,
  } as AskAnswerEnvelope;
}

describe('AnswerSourcesPanel', () => {
  it('renders a deduped source list with tiers, publisher/date lines, and quote snippets', () => {
    const envelope = fixtureEnvelope({
      sourceCards: [
        {
          id: 'source-a',
          title: 'UN OCHA Situation Report',
          label: 'Grounded Search',
          sourceType: 'grounded-search',
          url: 'https://relief.example/report',
          quotePreview: 'The July update reports 42 monitored crossings and a constrained aid corridor.',
          publisher: 'UN OCHA',
          date: '2026-07-03',
          reliabilityTier: 1,
          confidence: 0.91,
        },
        {
          id: 'source-a-duplicate',
          title: 'UN OCHA Situation Report duplicate',
          label: 'Grounded Search',
          sourceType: 'grounded-search',
          url: 'https://relief.example/report',
          quotePreview: 'A second excerpt says convoys still require negotiated access windows.',
          publisher: 'UN OCHA',
          date: '2026-07-03',
          reliabilityTier: 1,
          confidence: 0.84,
        },
        {
          id: 'source-b',
          title: 'Regional commentary brief',
          label: 'Source Receipt',
          sourceType: 'source-receipt',
          url: 'https://commentary.example/brief',
          quotePreview: 'Analysts describe the crossing dispute as unresolved.',
          publisher: 'Policy Review',
          date: '2026-07-01',
          reliabilityTier: 3,
          confidence: 0.62,
        },
      ],
      claimLedger: [
        {
          claimId: 'claim-supported',
          text: 'The July update reports 42 monitored crossings.',
          status: 'supported',
          sourceIds: ['source-a'],
          memoryIds: [],
          confidence: 'high',
          freshness: 'current',
          reviewState: 'none',
        },
      ],
      sourceAudit: {
        ...baseEnvelope.sourceAudit,
        sourceCount: 3,
        sourceReceiptCount: 1,
        sourceTypes: ['grounded-search', 'source-receipt'],
        supportedClaimCount: 1,
        sourcePosture: 'source_previews_attached',
      },
    });

    const html = render(<AnswerSourcesPanel envelope={envelope} defaultExpanded />);

    expect(html).toContain('data-testid="answer-sources-panel"');
    expect(html).toContain('UN OCHA Situation Report');
    expect(html).toContain('T1');
    expect(html).toContain('UN OCHA / 2026-07-03');
    expect(html).toContain('The July update reports 42 monitored crossings');
    expect(html).toContain('A second excerpt says convoys still require negotiated access windows.');
    expect(html).toContain('Regional commentary brief');
    expect(html).toContain('T3 verify');
    expect(html.match(/data-testid="answer-source-entry"/g)?.length).toBe(2);
  });

  it('renders claim chips with support posture labels', () => {
    const envelope = fixtureEnvelope({
      claimLedger: [
        {
          claimId: 'claim-supported',
          text: 'Supported claim text.',
          status: 'supported',
          sourceIds: ['source-a'],
          memoryIds: [],
          confidence: 'high',
          freshness: 'current',
          reviewState: 'none',
        },
        {
          claimId: 'claim-weak',
          text: 'Weak claim text.',
          status: 'weak',
          sourceIds: ['source-a'],
          memoryIds: [],
          confidence: 'medium',
          freshness: 'current',
          reviewState: 'owner_review',
        },
        {
          claimId: 'claim-unsupported',
          text: 'Unsupported claim text.',
          status: 'unsupported',
          sourceIds: [],
          memoryIds: [],
          confidence: 'low',
          freshness: 'unknown',
          reviewState: 'owner_review',
        },
        {
          claimId: 'claim-contradicted',
          text: 'Disputed claim text.',
          status: 'contradicted',
          sourceIds: [],
          memoryIds: [],
          confidence: 'low',
          freshness: 'unknown',
          reviewState: 'owner_review',
        },
      ],
    });

    const html = render(<AnswerSourcesPanel envelope={envelope} defaultExpanded />);

    expect(html).toContain('supported');
    expect(html).toContain('partially');
    expect(html).toContain('unsupported');
    expect(html).toContain('disputed');
  });

  it('surfaces unsupported and weak gap chips and invokes the source-gap scout callback', () => {
    const onQueueSourceGapScout: NonNullable<AnswerSourcesPanelProps['onQueueSourceGapScout']> = vi.fn();
    const claims = ['Unsupported claim text.', 'Weak claim text.'];
    const element = AnswerSourceGapChips({ claims, onQueueSourceGapScout });
    const buttons = React.Children.toArray(element.props.children) as Array<React.ReactElement<{ onClick: () => void }>>;

    buttons[0].props.onClick();

    expect(onQueueSourceGapScout).toHaveBeenCalledWith(['Unsupported claim text.']);

    const html = render(<AnswerSourceGapChips claims={claims} onQueueSourceGapScout={onQueueSourceGapScout} />);
    expect(html).toContain('Queue source-gap scout');
    expect(html).toContain('Unsupported claim text.');
    expect(html).toContain('Weak claim text.');
  });

  it('shows claims and an honest no-source line when claims exist without sources', () => {
    const envelope = fixtureEnvelope({
      claimLedger: [
        {
          claimId: 'claim-unsupported',
          text: 'No source supports this claim yet.',
          status: 'unsupported',
          sourceIds: [],
          memoryIds: [],
          confidence: 'low',
          freshness: 'unknown',
          reviewState: 'owner_review',
        },
      ],
    });

    const html = render(<AnswerSourcesPanel envelope={envelope} defaultExpanded />);

    expect(html).toContain('No sources attached');
    expect(html).toContain('No source supports this claim yet.');
  });

  it('renders nothing when the envelope has no sources, claims, verdicts, or gaps', () => {
    const html = render(<AnswerSourcesPanel envelope={baseEnvelope} />);

    expect(html).toBe('');
  });
});
