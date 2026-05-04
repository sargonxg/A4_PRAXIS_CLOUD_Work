'use client';

import { Activity, Building2, Database, FileSignature, MapPin, Network, Sparkles, Target, TrendingUp } from 'lucide-react';
import { SyriaWalkthroughNav } from '@/components/syria/walkthrough-nav';
import { PolicyDeskTemplate, type PolicyDesk } from '@/components/syria/policy-desk-template';

const US_HOUSING_DESK: PolicyDesk = {
  id: 'us-housing',
  domain: 'domestic',
  flag: '🇺🇸',
  hero: {
    persona: 'Senior US domestic-policy analyst · housing portfolio',
    mandate: 'Brief governors\' offices, advocacy groups, and state-level legislators on housing-affordability legislation across American states',
    title: 'US housing policy · domestic desk',
    subtitle:
      'Zoning reform · ADU legalisation · rent-stabilisation legislation · LIHTC + state HFA pipelines · NIMBY litigation. The desk follows California, Oregon, Massachusetts, Texas, Minnesota, Florida, Colorado, and New York simultaneously.',
    pills: [
      { label: 'Domestic policy · 50 states',  tone: 'navy'    },
      { label: 'Housing affordability',         tone: 'amber'   },
      { label: 'Quarterly state report',        tone: 'emerald' },
    ],
  },
  kpis: [
    { label: 'Bills tracked',     value: '142',   tone: 'navy'    },
    { label: 'States · active',   value: '24',    tone: 'blue'    },
    { label: 'Reform passed YTD', value: '17',    tone: 'emerald' },
    { label: 'Median rent index', value: '+4.2%', tone: 'rose'    },
    { label: 'Litigation cases',  value: '38',    tone: 'amber'   },
    { label: 'Sources',           value: '83',    tone: 'purple'  },
  ],
  trackedActors: [
    { name: 'California Legislature (SB 9, SB 423)',     role: 'Bellwether on by-right approvals + duplex',         stance: 'aligned' },
    { name: 'Oregon HB 2001 implementation',             role: 'Statewide single-family-zone elimination',          stance: 'aligned' },
    { name: 'Massachusetts MBTA Communities Act',        role: 'Multifamily zoning near transit',                   stance: 'aligned' },
    { name: 'Minneapolis 2040 plan + Minnesota state',   role: 'Triplex by-right + comprehensive plan precedent',    stance: 'aligned' },
    { name: 'Texas SB 2 (2025)',                         role: 'Statewide zoning preemption attempts',              stance: 'mixed'   },
    { name: 'Florida Live Local Act',                    role: 'Density + tax incentive bundle',                    stance: 'aligned' },
    { name: 'NIMBY coalitions (state-level)',            role: 'CEQA + ESA + state-equivalent litigation',          stance: 'opposed' },
    { name: 'YIMBY Action + Urban Reform Institute',      role: 'Pro-supply advocacy networks',                      stance: 'aligned' },
    { name: 'NLIHC + state low-income housing coalitions', role: 'Affordability + tenant-protection advocates',       stance: 'aligned' },
  ],
  trackedQuestions: [
    'Which 5 states are most likely to pass MBTA-style transit-zone legislation in the next session?',
    'How are CEQA reform bills (CA AB 2011 etc.) reshaping by-right project pipelines?',
    'What is the LIHTC + state HFA bond pipeline through 2027 across the 24 active states?',
    'Where is the next ADU legalisation push — and which counties opt-out clauses survive?',
  ],
  tools: [
    { name: 'State legislation tracker', detail: 'Bills, amendments, hearings, votes pulled live across 50 state legislatures.', example: '142 bills active · CA · OR · MA · MN · FL · TX · CO · NY most active.', icon: TrendingUp },
    { name: 'Zoning reform map',         detail: 'County-level by-right vs discretionary review status, with overlay on transit + flood data.', example: 'MBTA Communities Act compliance · 175 of 177 cities filed.',           icon: MapPin     },
    { name: 'LIHTC pipeline monitor',    detail: 'Per-state HFA QAP scoring + 9% / 4% credit allocations · pipeline starts vs deliveries.', example: 'Texas Q1 2026 9% allocations · 38 awards · 4,200 units.',              icon: Network    },
    { name: 'Litigation watch',          detail: 'CEQA + state environmental review challenges + standing rulings · timeline view.',     example: 'CA AB 2011 challenge · appellate ruling expected June 2026.',             icon: Activity   },
  ],
  workflow: {
    name: 'Quarterly state report workflow',
    pace: 'Cycle · 4 weeks build · 1 week review · client-distributed',
    steps: [
      { label: 'Question scoping',     detail: 'Client (governor\'s office) asks: where can we replicate Minneapolis or Massachusetts?' },
      { label: 'Source corpus refresh',detail: 'State legislative records · NLIHC · Brookings · Urban Institute · local press' },
      { label: 'Comparator overlay',   detail: 'Score 7 states against Minneapolis 2040 + MBTA Act primitives' },
      { label: 'Stakeholder mapping',  detail: 'Map allies + opposition coalitions · likely litigation paths' },
      { label: 'Report composition',   detail: '32-page state report with named bills, vote counts, and 3 replicable pathways' },
    ],
  },
  timeline: [
    { date: '2018-12-07', label: 'Minneapolis 2040 plan adopted · single-family-only zoning eliminated',     category: 'Local'   },
    { date: '2019-06-30', label: 'Oregon HB 2001 signed · statewide preemption of single-family zoning',      category: 'State'   },
    { date: '2021-09-16', label: 'California SB 9 signed · duplex by-right and lot splits',                    category: 'State'   },
    { date: '2022-12-12', label: 'Massachusetts MBTA Communities Act takes effect',                            category: 'State'   },
    { date: '2023-03-29', label: 'Florida Live Local Act signed · density + tax bundle',                        category: 'State'   },
    { date: '2024-09-19', label: 'CA AB 2011 + AB 1287 signed · streamlined commercial-to-housing conversion',   category: 'State'   },
    { date: '2025-08-14', label: 'Minnesota statewide zoning bill clears Senate · awaits House',                  category: 'State'   },
    { date: '2026-04-02', label: 'Texas SB 2 zoning preemption · House committee vote 11-7 in favour',             category: 'State'   },
  ],
  alerts: [
    { time: '07:30', tier: 'A', source: 'CA Legislature',     headline: 'CA AB 2011 amendment · streamlines mixed-use approvals · floor vote scheduled May 14' },
    { time: '08:11', tier: 'B', source: 'Urban Institute',    headline: 'Brief: MBTA Communities Act compliance · 175 of 177 cities filed plans' },
    { time: '08:54', tier: 'C', source: 'Texas Tribune',      headline: 'Texas SB 2 zoning preemption · Senate floor vote possible May 18' },
  ],
  analysis: {
    question: 'Which 3 states should the governor\'s office prioritise for an MBTA-style transit-zone legislation push?',
    bullets: [
      { heading: 'BLUF', tone: 'rose',
        body: 'Top 3: Colorado (post-failed-2024 momentum), Washington (Seattle metro coalition + Inslee successor), and Connecticut (8-30g revival pathway). Each has named legislator, transit-density alignment, and viable opposition coalition geometry.' },
      { heading: 'Why Colorado', tone: 'emerald',
        body: 'SB24-001 framework gives the policy template; 2026 legislative reset opens recess sessions; YIMBY Denver coalition is operational with named legislators McLachlan and Boesenecker.' },
      { heading: 'Why Washington', tone: 'emerald',
        body: 'HB 1110 missing-middle bill passed; transit-zone overlay logic translatable; Sound Transit alignment provides regional teeth; opposition coalition is fragmented by suburban political turnover.' },
      { heading: 'Why Connecticut', tone: 'amber',
        body: 'Section 8-30g groundwork still operational despite 2024 reform attempt loss; Hartford-New Haven density logic translates; opposition concentrated in Fairfield County requires careful coalition.' },
      { heading: 'Recommended action', tone: 'neutral',
        body: 'Publish memo with named legislator outreach plan, pre-stage YIMBY/labor coalition coordination through Urban Reform + Up For Growth networks, and brief governor\'s office on litigation path before introducing.' },
    ],
    sources: ['NLIHC state legislation tracker', 'Urban Institute housing finance', 'Brookings Mountain West', 'Texas Tribune', 'CA Legislative Information'],
    confidence: 0.74,
  },
};

export default function USHousingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SyriaWalkthroughNav />
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <PolicyDeskTemplate desk={US_HOUSING_DESK} />
      </div>
    </main>
  );
}
