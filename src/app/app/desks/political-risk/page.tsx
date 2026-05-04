'use client';

import { Activity, Building2, Database, Flag, Globe2, MapPin, Network, Sparkles, Target, TrendingUp, BookOpen, FileSignature } from 'lucide-react';
import { SyriaWalkthroughNav } from '@/components/syria/walkthrough-nav';
import { PolicyDeskTemplate, type PolicyDesk } from '@/components/syria/policy-desk-template';

const PAKISTAN_DESK: PolicyDesk = {
  id: 'pakistan-political-risk',
  domain: 'foreign',
  flag: '🇵🇰',
  hero: {
    persona: 'Senior emerging-markets political risk analyst',
    mandate: 'Brief institutional clients on Pakistan civil-military balance, IMF programme, militancy, and elections',
    title: 'Pakistan · political risk desk',
    subtitle:
      'Civil-military rebalancing post-Imran · IMF programme conditionality · TTP resurgence in KP · provincial elections cycle. The desk holds a sovereign-debt analyst, a militancy specialist, and a politics correspondent on the same case file.',
    pills: [
      { label: 'Foreign policy · South Asia', tone: 'navy' },
      { label: 'Sovereign debt + militancy', tone: 'rose' },
      { label: 'Quarterly client report', tone: 'emerald' },
    ],
  },
  kpis: [
    { label: 'Risk',           value: '74',    tone: 'rose'    },
    { label: 'IMF tranche',    value: '$1.1B', tone: 'navy'    },
    { label: 'TTP attacks/mo', value: '38',    tone: 'amber'   },
    { label: 'FX reserves',    value: '$11.4B',tone: 'blue'    },
    { label: 'PKR / USD',      value: '283',   tone: 'purple'  },
    { label: 'Sources',        value: '54',    tone: 'emerald' },
  ],
  trackedActors: [
    { name: 'Shehbaz Sharif (PML-N PM)',          role: 'Prime Minister · cabinet alignment with army',         stance: 'aligned' },
    { name: 'Asim Munir (COAS)',                  role: 'Army chief · effective political principal',           stance: 'mixed'   },
    { name: 'Imran Khan (PTI, jailed)',           role: 'Opposition · mobilisation through digital channels',   stance: 'opposed' },
    { name: 'IMF Resident Representative',        role: 'EFF programme oversight · benchmark gatekeeper',       stance: 'neutral' },
    { name: 'Tehrik-i-Taliban Pakistan (TTP)',    role: 'Insurgent threat in KP and Afghan border belt',        stance: 'opposed' },
    { name: 'Saudi Arabia + UAE bilateral lines', role: 'Oil deferral + deposit support',                       stance: 'aligned' },
    { name: 'China (CPEC + ML-1)',                role: 'Reconstruction debt + security assurances',            stance: 'mixed'   },
    { name: 'Election Commission of Pakistan',    role: 'Provincial cycle scheduling · legitimacy gatekeeper',  stance: 'neutral' },
  ],
  trackedQuestions: [
    'What benchmarks must Islamabad clear before the next IMF EFF tranche?',
    'How does the army handle a sustained PTI street campaign through Q3?',
    'Will the KP provincial security plan close the Afghan-border safe-haven gap?',
    'What is the realistic 12-month FX reserve floor — and which Gulf deposits roll?',
  ],
  tools: [
    { name: 'Sovereign debt monitor',     detail: 'Tracks IMF benchmarks, deposit roll-overs, and Eurobond spreads with named due-dates.', example: 'Next gate: 2026-06-15 SBP independence amendment in National Assembly.', icon: TrendingUp },
    { name: 'Civil-military leverage map', detail: 'GHQ ↔ PM Office ↔ Establishment Division leverage flows with weekly delta.',          example: 'Munir tenure extension legislated — legitimacy debt accruing.',           icon: Network    },
    { name: 'Militancy event tracker',     detail: 'TTP, BLA, IS-K incidents geotagged from local-source feeds with casualty triage.',     example: '38 incidents this month · D.I. Khan + Bannu cluster',                    icon: Activity   },
    { name: 'Election timing scenarios',   detail: 'Probability tree on provincial polls × constitutional amendment paths.',               example: 'KP poll deferral 65% likely under emergency clause discourse.',          icon: Target     },
  ],
  workflow: {
    name: 'Quarterly client briefing workflow',
    pace: 'Cycle · 3 weeks build · 1 week review',
    steps: [
      { label: 'Question scoping',      detail: 'Client asks: what is the 12-month sovereign-default tail risk?' },
      { label: 'Source corpus refresh', detail: 'IMF Article IV · State Bank · ICG · Crisis Group · Dawn · Geo' },
      { label: 'Recipe stack',          detail: 'LEVERAGE-TRACE · COMMITMENT-CHECK on EFF · PATH-SEARCH for Gulf deposits' },
      { label: 'Stress scenarios',      detail: '3 scenarios: programme on-track, slip, off-track. FX + spread paths.' },
      { label: 'Report composition',    detail: '24-page memo with named benchmarks, signal-watches, and dissent annex' },
    ],
  },
  timeline: [
    { date: '2025-09-22', label: 'IMF Executive Board approves new EFF · $7B over 37 months',     category: 'Economic' },
    { date: '2025-11-04', label: 'PTI digital protests · prison letter campaign reaches scale',    category: 'Political' },
    { date: '2026-01-12', label: 'Munir extension legislation passes National Assembly',            category: 'Political' },
    { date: '2026-02-26', label: 'TTP suicide attack on Bannu garrison · 12 fatalities',            category: 'Security' },
    { date: '2026-03-14', label: 'IMF first review · benchmarks partially cleared, structural slip',category: 'Economic' },
    { date: '2026-04-02', label: 'Saudi $3B SDR deposit rolled · 12-month maturity',                category: 'Economic' },
    { date: '2026-04-30', label: 'KP provincial elections postponed under security clause',          category: 'Political' },
  ],
  alerts: [
    { time: '07:18', tier: 'A', source: 'IMF Mission Press',   headline: 'Mission concludes review · staff-level agreement reached, board mid-July' },
    { time: '08:02', tier: 'B', source: 'Geo TV',              headline: 'Imran Khan transferred to Adiala · PTI calls for nationwide rally' },
    { time: '08:45', tier: 'C', source: 'Dawn',                headline: 'PKR closes at 283.4 · SBP intervened in interbank market' },
  ],
  analysis: {
    question: 'What does PRAXIS read into this morning\'s IMF + PTI + PKR conjunction?',
    bullets: [
      { heading: 'BLUF', tone: 'rose',
        body: 'Pakistan clears the IMF review at staff level but only after structural slip on tax-base broadening. Combined with a fresh PTI mobilisation cycle and a soft PKR, sovereign-spread risk widens in the 90-day window even as default tail-risk drops.' },
      { heading: 'Drivers', tone: 'amber',
        body: 'Tax base + power-sector circular debt remain unresolved. Munir extension reduces immediate political-cycle uncertainty but raises legitimacy debt. Gulf deposit rolls provide 12-month buffer; Eurobond market sees through it.' },
      { heading: 'Counter-view', tone: 'neutral',
        body: 'Bull case: Saudi + UAE deposit floor + China rollover + IMF anchor produce a stable carry trade for next 6 months. Bear case: a KP-Punjab security spike that pulls fiscal space below programme floors.' },
      { heading: 'Recommended ask', tone: 'emerald',
        body: 'Run scenario A (programme on-track) at base; brief client on tail-risk hedge via PKR forwards and 5-year CDS rather than spot equity exposure.' },
    ],
    sources: ['IMF Article IV 2025', 'Crisis Group South Asia briefing', 'Dawn macro desk', 'Geo TV politics', 'State Bank statistics'],
    confidence: 0.71,
  },
};

export default function PakistanPoliticalRiskPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SyriaWalkthroughNav />
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <PolicyDeskTemplate desk={PAKISTAN_DESK} />
      </div>
    </main>
  );
}
