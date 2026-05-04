'use client';

import { Activity, BookOpen, Building2, Database, FileSignature, Network, Sparkles, Target, TrendingUp } from 'lucide-react';
import { SyriaWalkthroughNav } from '@/components/syria/walkthrough-nav';
import { PolicyDeskTemplate, type PolicyDesk } from '@/components/syria/policy-desk-template';

const SEMICONDUCTOR_DESK: PolicyDesk = {
  id: 'semiconductor-econ-research',
  domain: 'economic',
  flag: '🛠️',
  hero: {
    persona: 'Senior trade & technology economist',
    mandate: 'Brief asset-allocation and corporate clients on the US-China semiconductor decoupling',
    title: 'Semiconductor supply chain · economic research desk',
    subtitle:
      'Export-control regime evolution · CHIPS Act subsidy disbursement · Taiwan + Korea + Japan industrial response · Chinese SMIC and YMTC node progression · derivative impact on AI compute pricing.',
    pills: [
      { label: 'Economic research',         tone: 'navy'    },
      { label: 'US-China decoupling',       tone: 'amber'   },
      { label: 'Quarterly + reactive memo', tone: 'emerald' },
    ],
  },
  kpis: [
    { label: 'Risk score',          value: '67',     tone: 'rose'    },
    { label: 'CHIPS disbursed',     value: '$32B',   tone: 'navy'    },
    { label: 'TSMC US capex',       value: '$65B',   tone: 'blue'    },
    { label: 'SMIC 7nm yield',      value: '~28%',   tone: 'amber'   },
    { label: 'Compute price idx',   value: '142.3',  tone: 'purple'  },
    { label: 'Sources',             value: '64',     tone: 'emerald' },
  ],
  trackedActors: [
    { name: 'BIS (US Commerce)',                  role: 'Export-control rule writer · entity-list curator',     stance: 'opposed' },
    { name: 'TSMC',                               role: 'Foundry leader · Arizona + Kumamoto + Dresden expansion', stance: 'aligned' },
    { name: 'Samsung Foundry',                    role: 'Texas advanced node · Korean industrial policy lever',    stance: 'aligned' },
    { name: 'SMIC',                               role: 'Chinese leading-edge foundry · 7nm yield watch',          stance: 'opposed' },
    { name: 'ASML',                               role: 'EUV / DUV gatekeeper · Dutch + EU rule alignment',         stance: 'mixed'   },
    { name: 'NVIDIA',                             role: 'Compute demand pull · downstream beneficiary',             stance: 'neutral' },
    { name: 'METI (Japan)',                       role: 'Rapidus + node-2 coordination · industrial subsidy',        stance: 'aligned' },
    { name: 'MIIT (China)',                       role: 'Localisation push · Big Fund III deployment',                stance: 'opposed' },
  ],
  trackedQuestions: [
    'How fast does CHIPS Act capacity convert to US-printed advanced wafers vs Asian flagship?',
    'Where is the next BIS export-control rule expansion (entity list, foundry-services rule, equipment)?',
    'What is realistic SMIC 5nm timeline given Big Fund III + DUV repurposing?',
    'How does AI compute demand interact with foundry pricing and equipment lead-times?',
  ],
  tools: [
    { name: 'Export-control delta tracker',  detail: 'Diffs every BIS rule across entity list, foundry rule, equipment categories.', example: 'Latest delta: 3 new entities · 1 SOFR clause expansion · 2 advisory opinions.', icon: TrendingUp },
    { name: 'Capex flow map',                 detail: 'TSMC, Samsung, Intel, Rapidus, SMIC capex by site, node, $ committed vs landed.', example: 'TSMC Arizona Fab 21 wafer-in projected Q3 2026 · 4nm.',              icon: Network    },
    { name: 'Equipment + EUV monitor',        detail: 'ASML EUV / DUV / High-NA shipment trends + service-revenue mix.',               example: 'High-NA shipments to TSMC + Intel · 0 to China.',                     icon: Activity   },
    { name: 'AI compute price index',         detail: 'Token + GPU spot price index for cloud + on-prem · monthly.',                    example: 'H100 hour spot · $1.85 · 7-day trailing.',                            icon: Target     },
  ],
  workflow: {
    name: 'Reactive memo workflow · BIS rule drop',
    pace: 'Sub-hour · adversarial · for institutional clients',
    steps: [
      { label: 'Rule diff',             detail: 'Tool ingests Federal Register entry · diffs entity list and licence policy clauses' },
      { label: 'Affected entities',     detail: 'Filter by foundry / fabless / EDA / equipment / materials' },
      { label: 'Equity + bond impact',  detail: 'Pull tickers + IG/HY exposure · sector heatmap' },
      { label: 'Counter-rule scenarios', detail: 'Likely China retaliation paths · gallium, rare-earth, anti-spy law' },
      { label: 'Client memo',           detail: 'Two-page memo · BLUF + sector heatmap + 3 actionable lines' },
    ],
  },
  timeline: [
    { date: '2024-12-02', label: 'BIS new equipment rule · advanced-logic wafer rules tightened',        category: 'Regulatory' },
    { date: '2025-02-19', label: 'TSMC Arizona Fab 21 first 4nm wafer · pilot run',                       category: 'Industrial' },
    { date: '2025-06-09', label: 'China announces gallium + germanium export-licence regime',              category: 'Counter-rule' },
    { date: '2025-09-30', label: 'Big Fund III · $47B · industrial-localisation deployment begins',         category: 'Industrial' },
    { date: '2025-12-15', label: 'CHIPS Act $32B disbursed · 14 grant agreements signed',                    category: 'Subsidy' },
    { date: '2026-02-04', label: 'BIS adds 6 entities · SMIC affiliate + EUV-related',                       category: 'Regulatory' },
    { date: '2026-04-22', label: 'SMIC announces 5nm pilot · public statement only',                          category: 'Industrial' },
  ],
  alerts: [
    { time: '06:55', tier: 'A', source: 'Federal Register',   headline: 'BIS publishes amendment · 3 new entity-list adds, 1 advisory opinion (foundry-services clarification)' },
    { time: '07:12', tier: 'B', source: 'Reuters Tech desk',  headline: 'TSMC Q1 earnings preview · Arizona ramp slower than guided, demand robust' },
    { time: '08:04', tier: 'C', source: 'Caixin',             headline: 'YMTC announces 200-layer NAND · domestic equipment claim (unverified)' },
  ],
  analysis: {
    question: 'What does this morning\'s BIS amendment + TSMC ramp signal mean for compute pricing through Q3?',
    bullets: [
      { heading: 'BLUF', tone: 'rose',
        body: 'BIS amendment narrows foundry-services workaround used by SMIC affiliates · TSMC Arizona slower ramp tightens advanced-node supply through Q3 · expect H100/B-series cloud spot prices firm 5-8% above current trailing index.' },
      { heading: 'Tail risks', tone: 'amber',
        body: 'China retaliation timing risk · gallium-licence tightening + 1-2 anti-spy law actions plausible within 30 days. ASML services-revenue at risk on next rule expansion.' },
      { heading: 'Cross-asset read', tone: 'neutral',
        body: 'Long Asian foundry equity + Japanese equipment vs short Chinese advanced-logic exposure · neutral on US fabless until BIS foundry-services clarification matures.' },
      { heading: 'Recommended action', tone: 'emerald',
        body: 'Publish reactive memo by 10:30 EDT to capture European cash-open moves. Pin to client portal with named scenarios + dated review at next BIS rulemaking calendar checkpoint.' },
    ],
    sources: ['Federal Register · BIS', 'TSMC Q1 prelim filing', 'ASML investor letter', 'Caixin tech desk', 'CSIS Wadhwani Center'],
    confidence: 0.76,
  },
};

export default function EconomicResearchPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SyriaWalkthroughNav />
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <PolicyDeskTemplate desk={SEMICONDUCTOR_DESK} />
      </div>
    </main>
  );
}
