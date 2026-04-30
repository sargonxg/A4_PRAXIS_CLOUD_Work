import { describe, expect, it } from 'vitest';
import {
  buildSituationContextHealthPrompt,
  computeSituationContextHealth,
} from '@/lib/context/situation-context-health';
import type { AnalystProfile } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';

const completeProfile: Partial<AnalystProfile> = {
  identity: { role: 'diplomat', seniority: 'senior', org: 'TACITUS', team: 'Policy' },
  perspective: {
    mandate: 'Provide decision-grade conflict analysis for senior policy users.',
    lenses: ['diplomatic', 'security'],
    regions: ['Eastern Mediterranean'],
    audience: 'senior_leadership',
    primaryDomain: 'armed-conflict-security',
    secondaryDomains: [],
  },
};

const strongSituation: Partial<Situation> = {
  id: 's1',
  name: 'Test Border Crisis',
  description: 'A detailed situation record with enough context for calibrated analysis.',
  region: 'Eastern Mediterranean',
  actors: ['Government A', 'Movement B', 'UN Mission'],
  actorCount: 3,
  graphEntities: 24,
  documentCount: 3,
  sourceUrls: ['https://example.org/report'],
  updatedAt: new Date().toISOString(),
};

describe('situation context health', () => {
  it('marks strong context as green enough for analysis', () => {
    const report = computeSituationContextHealth({
      situation: strongSituation,
      profile: completeProfile,
      expectedToolIds: ['risk-monitor', 'policy-memo'],
      retrievalCount: 4,
      episodeCount: 2,
      now: new Date(),
    });

    expect(report.state).toBe('green');
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.findings.filter((finding) => finding.state === 'red')).toHaveLength(0);
  });

  it('flags weak situations before high-confidence outputs', () => {
    const report = computeSituationContextHealth({
      situation: {
        id: 'weak',
        name: 'Weak case',
        actors: ['Actor A'],
        actorCount: 1,
        graphEntities: 0,
        documentCount: 0,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      expectedToolIds: ['policy-memo'],
      now: new Date('2026-04-30T00:00:00.000Z'),
    });

    expect(report.state).toBe('red');
    expect(report.findings.map((finding) => finding.kind)).toContain('missing-evidence');
    expect(report.findings.map((finding) => finding.kind)).toContain('weak-graph');
    expect(report.missingLayers).toContain('document-corpus');
  });

  it('renders model instructions that prevent invented context', () => {
    const report = computeSituationContextHealth({
      situation: strongSituation,
      profile: completeProfile,
      expectedToolIds: ['source-scout'],
      retrievalCount: 0,
      episodeCount: 0,
    });
    const prompt = buildSituationContextHealthPrompt(report);

    expect(prompt).toContain('Current PRAXIS Situation Context Health');
    expect(prompt).toContain('Do not invent documents');
    expect(prompt).toContain('Missing layers');
  });
});
