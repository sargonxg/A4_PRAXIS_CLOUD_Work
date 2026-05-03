import type { AnalystProfile } from '@/types/analyst-profile';

export const SYRIA_DEMO_ANALYST_PROFILE: AnalystProfile = {
  identity: {
    role: 'un_official',
    seniority: 'senior',
    org: 'TACITUS Demo Organization',
    team: 'Syria Transition Case Cell',
  },
  perspective: {
    mandate:
      'Prepare source-grounded decision support for senior leadership on Syria transition risk, humanitarian access, rights-protective implementation, and regional spillover.',
    lenses: ['diplomatic', 'security', 'humanitarian', 'legal_ihl', 'mediation'],
    regions: ['Syrian Arab Republic', 'Northeast Syria', 'Aleppo', 'Sweida', 'Middle East regional theater'],
    audience: 'senior_leadership',
    primaryDomain: 'armed-conflict-security',
    secondaryDomains: ['diplomacy-negotiation', 'humanitarian', 'governance-rule-of-law'],
  },
  workingStyle: {
    sourceCategories: ['un-official', 'humanitarian', 'conflict-data', 'local-media', 'think-tank'],
    language: 'en',
    redLines: [
      'Do not imply classified access or live intelligence collection.',
      'Separate observed reporting from PRAXIS assessment.',
      'Do not treat the January agreement as implemented until rights and governance benchmarks are verified.',
      'Keep humanitarian access, returns, and protection indicators in the same decision frame as political implementation.',
    ],
    analyticalStyle: 'rapid_brief',
  },
  meta: {
    version: 1,
    completedAt: '2026-05-02T09:00:00.000Z',
    lastEditedAt: '2026-05-02T09:00:00.000Z',
    skipCount: 0,
    createdAt: '2026-05-02T09:00:00.000Z',
    deletedAt: null,
  },
};

export const SYRIA_DEMO_PREFERENCES = {
  sourceMode: 'Public-source first, UN and humanitarian receipts prioritized',
  defaultFramework: 'ACO v2.0 graph + ICD-203 discipline + INFORM-style risk decomposition',
  outputStyle: 'Leadership-ready, fact/assessment/gap separated, red-team dissent preserved',
  trustedSources: ['UN Geneva', 'OCHA', 'UN Syria CCA', 'UNFPA', 'UNHCR', 'ReliefWeb', 'UCDP/GDELT when available'],
  avoidedPatterns: ['unsourced social posts', 'single-source tactical claims', 'stale pre-transition explainers'],
  toolOverrides: [
    'Source Scout: reliability tiers and retrieval trace visible',
    'GraphOps: provenance and temporal anchors required before graph claims are trusted',
    'Policy Memo: options must include implementation triggers and evidence limits',
    'Briefing: BLUF, graph readout, risk board, action asks, and collection gaps',
  ],
};

export const SYRIA_SITUATION_CONTEXT_CARDS = [
  {
    label: 'Decision center',
    value: '30 Jan agreement',
    detail: 'Damascus-SDF ceasefire and integration track is the main stabilizing opportunity.',
  },
  {
    label: 'Breakpoints',
    value: '4 trigger lanes',
    detail: 'Humanitarian access, rights implementation, southern flashpoints, regional spillover.',
  },
  {
    label: 'Evidence posture',
    value: 'Public-source',
    detail: 'UN and humanitarian receipts are strong; local implementation details remain thinner.',
  },
  {
    label: 'Next product',
    value: 'Principal brief',
    detail: 'Separate facts, PRAXIS assessment, assumptions, and collection gaps.',
  },
];

export const SYRIA_DOCUMENT_REVIEW_CHECKLIST = [
  'Every recommendation has a source basis or explicit assumption label.',
  'Humanitarian, political, legal, and security effects are not collapsed into one generic risk.',
  'The memo preserves a red-team objection and a next collection task.',
  'The document can be exported to DOCX and edited in LibreOffice or Word.',
];

export const SYRIA_DEMO_ENTRY_PATH =
  '/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria';
