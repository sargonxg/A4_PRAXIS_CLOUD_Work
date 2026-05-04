/**
 * Demo-safe agentic presets used to power the SyriaAgentConsole.
 *
 * Each preset is a canonical, cached output for a Syria-related agent run.
 * The reasoning trace is scripted to mirror the real production flow so a
 * recording reads as a live agent, but no AI route is actually called by
 * default. To wire a real route, pass a `runner` to the console component.
 */

import type { AgentTraceStep } from '@/components/syria/agent-console';

export interface SyriaAgentPreset {
  id: string;
  persona: string;
  toolId: string;
  question: string;
  trace: AgentTraceStep[];
  answer: {
    headline: string;
    body: string;
    bullets?: string[];
    provenance?: string[];
    confidence?: number;
  };
}

export const SYRIA_AGENT_PRESETS: Record<string, SyriaAgentPreset> = {
  'source-scout': {
    id: 'source-scout',
    persona: 'Source Scout',
    toolId: 'source-scout',
    question:
      'Find five fresh, defensible sources on the Damascus-SDF integration timeline that are not already in the analyst library.',
    trace: [
      { label: 'Loading analyst calibration', detail: 'role · perspective · red-line phrases', ms: 320 },
      { label: 'Reading existing corpus', detail: '39 indexed sources, 17 timeline events', ms: 420 },
      { label: 'Searching grounded reference layer', detail: 'UN docs · OHCHR · academic centres', ms: 520 },
      { label: 'Cross-checking against vector store', detail: 'k=8, COSINE 0.74+ filter', ms: 360 },
      { label: 'Ranking by reliability tier + freshness', detail: 'tier_a > tier_b > tier_c', ms: 280 },
      { label: 'Writing reasoning notes', detail: 'why each source is non-duplicative', ms: 320 },
    ],
    answer: {
      headline: '5 fresh sources outside the current Syria library',
      body:
        'PRAXIS recommends adding the UN Special Envoy April briefing transcript, the latest UN COI Syria periodic report, an OCHA HRP funding tracker snapshot for Q2 2026, an ECFR analysis on EU sanctions delisting benchmarks, and a North Press Agency field dispatch on SDF-area civic documentation. Each one fills a gap in the existing tier-1 mix and improves coverage of integration-implementation evidence.',
      bullets: [
        'UN Special Envoy briefing — 22 Apr 2026 (tier_a, primary record)',
        'UN COI Syria periodic report A/HRC — coastal accountability section (tier_a)',
        'OCHA Syria HRP FTS snapshot — sector funding deltas (tier_a)',
        'ECFR — EU benchmarks for conditional sanctions delisting (tier_b)',
        'North Press Agency — civic documentation in northeast (tier_b, regional)',
      ],
      provenance: ['UN Geneva live coverage', 'OHCHR COI Syria archive', 'OCHA FTS', 'ECFR', 'North Press'],
      confidence: 0.78,
    },
  },
  'red-team-review': {
    id: 'red-team-review',
    persona: 'Red Team Reviewer',
    toolId: 'red-team-review',
    question:
      'Stress-test the working assessment: "The Damascus-SDF agreement is the stabilizing center of gravity for the transition." What would change the line?',
    trace: [
      { label: 'Loading assessment + provenance', detail: 'BLUF + 4 supporting claims', ms: 320 },
      { label: 'Mapping graph edges that would falsify each claim', detail: '12 falsification paths', ms: 480 },
      { label: 'Searching contradicting evidence', detail: 'local media + monitoring streams', ms: 460 },
      { label: 'Surfacing dissent perspectives', detail: 'minorities · external states · civil society', ms: 380 },
      { label: 'Scoring confidence deltas', detail: 'Bayesian update over claim set', ms: 320 },
    ],
    answer: {
      headline: 'Three falsification paths an analyst should track this week',
      body:
        'The agreement narrative is fragile in three places. First, repeated localized clashes in Deir-ez-Zor rural areas would convert "phased integration" rhetoric into evidence of fragmentation. Second, an Israeli operations spike in southern Syria would displace UN attention from the integration track and re-anchor the public story around regional war. Third, a civil-society walkout from the constitutional drafting consultative round would expose the legitimacy thinness underneath the political theatre. Each one is observable within 14 days from public sources.',
      bullets: [
        'Watch: 4+ confirmed clashes in Deir-ez-Zor in 7 days flips the integration narrative',
        'Watch: a single high-casualty Israeli strike in Sweida or Quneitra resets attention',
        'Watch: a public boycott of the drafting round by 2+ named civil-society networks',
      ],
      provenance: ['Graph stance view', 'North Press Agency', 'UN Special Envoy', 'SyriaUntold civic networks'],
      confidence: 0.71,
    },
  },
  'brief-builder': {
    id: 'brief-builder',
    persona: 'Brief Builder',
    toolId: 'brief-builder',
    question:
      'Compose a one-page principal briefing on the Syria transition that a USG/EEAS analyst can defend in front of a sceptical reviewer.',
    trace: [
      { label: 'Reading evidence ledger', detail: '5 chapters · 8 commitments · 17 events', ms: 360 },
      { label: 'Selecting BLUF candidates', detail: 'top 3 framings ranked by graph support', ms: 400 },
      { label: 'Composing risk board', detail: 'security · humanitarian · political · economic', ms: 360 },
      { label: 'Attaching provenance + confidence labels', detail: 'per-claim citations', ms: 300 },
      { label: 'Running red-line filter', detail: 'profile.workingStyle.redLines', ms: 220 },
      { label: 'Rendering brief surface', detail: 'BLUF · Risk · Watch · Asks', ms: 280 },
    ],
    answer: {
      headline: 'BLUF + risk board + dated triggers, ready to edit',
      body:
        'BLUF: The 30 January Damascus-SDF agreement is the most concrete de-escalatory pathway in the public-source Syria file but it is fragile; implementation, humanitarian access, and regional spillover are decision triggers within days, not months. Risk board: implementation risk is governance + rights protections; humanitarian risk is returns and protection; security risk is south, Israel, and detention; evidence risk is thin local field verification. Asks: protect the agreement with a 30-day implementation dashboard, fuse humanitarian metrics into the same view, and add local civil-society sources before granular claims.',
      bullets: [
        'BLUF — confidence 0.72, 4 supporting graph edges, 7 sources cited',
        'Risk board — 4 lanes, each with verification window',
        'Watch — 6 dated triggers across 14-day, 30-day, 60-day horizons',
        'Asks — 3 decisions, each tied to a named monitoring artefact',
      ],
      provenance: ['UN Geneva', 'OCHA HRP', 'ECFR', 'Carnegie Middle East Center', 'North Press Agency'],
      confidence: 0.74,
    },
  },
};
