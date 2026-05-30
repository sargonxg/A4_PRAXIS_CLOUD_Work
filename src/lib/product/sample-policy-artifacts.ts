export type SamplePolicyArtifact = {
  id: string;
  title: string;
  type: string;
  status: string;
  prompt: string;
  summary: string;
  bullets: string[];
  sources: Array<{ label: string; href: string }>;
};

export const SAMPLE_POLICY_ARTIFACTS: SamplePolicyArtifact[] = [
  {
    id: 'sample-ai-act-sme-implementation',
    title: 'Briefing note: EU AI Act implementation for SMEs',
    type: 'briefing note',
    status: 'PRAXIS sample / cited',
    prompt: 'Create a briefing note on EU AI Act implementation risks for SMEs, with source-backed obligations, open questions, and next actions.',
    summary: 'Short policy brief mapping likely SME pressure points: classification, provider/deployer obligations, documentation capacity, and regulator guidance still needed.',
    bullets: [
      'Decision question: which compliance obligations should an SME prioritize in the next two quarters?',
      'Evidence posture: official law text and Commission guidance only; no vendor commentary treated as authority.',
      'Open gap: sector-specific conformity assessment cost estimates need newer implementation evidence.',
    ],
    sources: [
      { label: 'Regulation (EU) 2024/1689, Official Journal', href: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' },
      { label: 'European Commission AI Act overview', href: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
    ],
  },
  {
    id: 'sample-humanitarian-access-deconfliction',
    title: 'Options memo: humanitarian access deconfliction cell',
    type: 'options memo',
    status: 'PRAXIS sample / source receipts',
    prompt: 'Draft an options memo for a humanitarian access deconfliction cell, separating facts, assumptions, risks, and decision options.',
    summary: 'Decision memo comparing a light notification desk, a joint deconfliction cell, and a third-party verified channel for access negotiations.',
    bullets: [
      'Decision question: what mechanism reduces operational risk without transferring inappropriate information?',
      'Tradeoff: speed and trust increase with shared channels, but data minimization and mandate clarity become critical.',
      'Open gap: local authority acceptance and humanitarian partner red lines require field confirmation.',
    ],
    sources: [
      { label: 'UN OCHA Civil-Military Coordination', href: 'https://www.unocha.org/civil-military-coordination' },
      { label: 'ICRC IHL Database', href: 'https://ihl-databases.icrc.org/en' },
    ],
  },
  {
    id: 'sample-heat-resilience-stakeholder-map',
    title: 'Stakeholder map: municipal heat resilience',
    type: 'stakeholder map',
    status: 'PRAXIS sample / review ready',
    prompt: 'Build a stakeholder map and narrative brief for municipal heat resilience, including authorities, vulnerable groups, funding channels, and evidence gaps.',
    summary: 'Actor map for city heat planning: public health, emergency management, utilities, schools, housing, community groups, and state/federal funding channels.',
    bullets: [
      'Decision question: which actors can reduce heat mortality fastest before peak season?',
      'Key risk: cooling access plans fail if transport, power reliability, and trusted community messengers are missing.',
      'Open gap: neighborhood-level vulnerability data and cooling-center operating hours need verification.',
    ],
    sources: [
      { label: 'CDC Heat and Health Tracker', href: 'https://ephtracking.cdc.gov/Applications/heatTracker/' },
      { label: 'FEMA BRIC program', href: 'https://www.fema.gov/grants/mitigation/building-resilient-infrastructure-communities' },
    ],
  },
];
