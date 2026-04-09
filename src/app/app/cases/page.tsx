'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useSituationStore } from '@/stores/situation-store';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { PraxisLink } from '@/components/shared/praxis-link';
import {
  BookOpen, Search, GitCompare, AlertTriangle, Pause, CheckCircle,
  TrendingUp, Filter, X, ExternalLink, Plus, FolderOpen, Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Situation, SituationStatus, EscalationTrend } from '@/types/situation';

import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
/* ------------------------------------------------------------------ */
/*  Status config — shared between Demo and Real                      */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG = {
  active:      { label: 'Active',     color: 'text-crimson',   bg: 'bg-crimson/8',   icon: TrendingUp,     bar: '#A63D40' },
  escalating:  { label: 'Escalating', color: 'text-gold-600',  bg: 'bg-gold-500/8',  icon: AlertTriangle,  bar: '#C8961E' },
  frozen:      { label: 'Frozen',     color: 'text-teal',      bg: 'bg-teal/8',      icon: Pause,          bar: '#2E8A8A' },
  resolved:    { label: 'Resolved',   color: 'text-sage',      bg: 'bg-sage/8',      icon: CheckCircle,    bar: '#5B8C5A' },
  archived:    { label: 'Archived',   color: 'text-navy-400',  bg: 'bg-navy-100/60', icon: Archive,        bar: '#64748B' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

/* ------------------------------------------------------------------ */
/*  Shared UI helpers                                                  */
/* ------------------------------------------------------------------ */

function RiskBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-app-surface-alt)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(score / 10) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs font-semibold text-navy-700 w-6 text-right">
        {score > 0 ? score.toFixed(1) : '—'}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Demo mode — hardcoded case data                                   */
/* ------------------------------------------------------------------ */

interface DemoCaseData {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'escalating' | 'frozen' | 'resolved';
  riskScore: number;
  actorCount: number;
  eventCount: number;
  themes: string[];
  institutions: string[];
  startYear: number;
  endYear?: number;
  description: string;
  primaryConflictType: string;
}

const DEMO_CASES: DemoCaseData[] = [
  {
    id: 'nordalia',
    name: 'Nordalia Crisis',
    region: 'East Africa',
    status: 'active',
    riskScore: 7.8,
    actorCount: 12,
    eventCount: 47,
    themes: ['Electoral Violence', 'Armed Conflict', 'Peace Process', 'Sanctions', 'Humanitarian Crisis'],
    institutions: ['UNSC', 'AU', 'EU', 'UNMN', 'ICC'],
    startYear: 2021,
    description: 'Multi-party political crisis triggered by disputed elections. Government forces and Democratic Reform Movement (DRM) engaged in armed conflict over eastern provincial autonomy and resource control. UN peacekeeping mission (UNMN) deployed November 2025.',
    primaryConflictType: 'Internal armed conflict with regional proxy dimensions',
  },
  {
    id: 'sahel',
    name: 'Sahel Security Crisis',
    region: 'West Africa',
    status: 'active',
    riskScore: 6.2,
    actorCount: 8,
    eventCount: 31,
    themes: ['Terrorism', 'Governance Failure', 'Displacement', 'Climate Fragility', 'Cross-Border'],
    institutions: ['AU PSC', 'ECOWAS', 'UN MINUSMA', 'EU'],
    startYear: 2020,
    description: 'Persistent insecurity driven by jihadist groups and governance failures across Mali, Burkina Faso, Niger, and Chad. Military coups destabilized government responses. MINUSMA withdrawal in 2023 created security vacuum.',
    primaryConflictType: 'Regional insurgency and state fragility',
  },
  {
    id: 'scs',
    name: 'South China Sea Tensions',
    region: 'East Asia',
    status: 'escalating',
    riskScore: 5.8,
    actorCount: 6,
    eventCount: 23,
    themes: ['Maritime Dispute', 'Territorial Conflict', 'Great Power Competition', 'UNCLOS', 'Naval Incidents'],
    institutions: ['ASEAN', 'UN', 'US', 'NATO'],
    startYear: 2010,
    description: 'Ongoing territorial disputes and maritime incidents in disputed waters. Competing claims by China, Philippines, Vietnam, Malaysia, Brunei, and Taiwan. Code of Conduct negotiations stalled.',
    primaryConflictType: 'Interstate territorial and maritime dispute',
  },
  {
    id: 'kolari-borders',
    name: 'Kolari-Barantum Border Dispute',
    region: 'Central Africa',
    status: 'frozen',
    riskScore: 3.2,
    actorCount: 4,
    eventCount: 12,
    themes: ['Border Dispute', 'Natural Resources', 'Frozen Conflict', 'ICJ Proceedings'],
    institutions: ['AU', 'ICJ'],
    startYear: 2018,
    description: 'Frozen territorial conflict over mineral-rich border region between Kolari and Barantum. ICJ proceedings ongoing since 2022. Low-level incidents continue despite formal ceasefire.',
    primaryConflictType: 'Interstate border and resource dispute',
  },
  {
    id: 'meldova-1991',
    name: 'Meldova Civil War (Historical)',
    region: 'Eastern Europe',
    status: 'resolved',
    riskScore: 0,
    actorCount: 5,
    eventCount: 89,
    themes: ['Civil War', 'Peace Agreement', 'Post-Conflict Reconstruction', 'OSCE Mediation'],
    institutions: ['OSCE', 'UN', 'EU'],
    startYear: 1992,
    endYear: 1997,
    description: 'Historical case study: civil war resolved through comprehensive peace agreement brokered by OSCE. Post-conflict reconstruction involved EU stabilization funds and UN transitional justice mechanisms.',
    primaryConflictType: 'Internal armed conflict — resolved',
  },
  // --- Historical conflict cases ---
  {
    id: 'south-africa-1994',
    name: 'South African Democratic Transition',
    region: 'Sub-Saharan Africa',
    status: 'resolved',
    riskScore: 0,
    actorCount: 5,
    eventCount: 112,
    themes: ['Negotiated Transition', 'Power-Sharing', 'Truth & Reconciliation', 'Apartheid', 'DDR'],
    institutions: ['CODESA', 'TRC', 'ANC', 'GNU'],
    startYear: 1990,
    endYear: 1994,
    description: 'Negotiated transition from apartheid to democracy via CODESA multi-party talks. Mandela–de Klerk leadership enabled elite compromise; sunset clauses reduced spoiler incentives. The TRC chose restorative over retributive justice, enabling national reintegration.',
    primaryConflictType: 'Political transition — negotiated democracy',
  },
  {
    id: 'mozambique-1992',
    name: 'Mozambique: Rome General Peace Accords',
    region: 'Sub-Saharan Africa',
    status: 'resolved',
    riskScore: 0,
    actorCount: 4,
    eventCount: 98,
    themes: ['Civil War', 'DDR', 'Non-State Mediation', 'Economic Incentives', 'UN Verification'],
    institutions: ['Sant\'Egidio', 'ONUMOZ', 'UN', 'Italian Government'],
    startYear: 1977,
    endYear: 1992,
    description: 'Rome General Peace Accords (1992) ended 15 years of civil war. Sant\'Egidio Community provided non-state mediation with flexibility unavailable to state actors. ONUMOZ guaranteed commitments; economic incentives secured RENAMO buy-in.',
    primaryConflictType: 'Civil war — resolved via non-state mediation',
  },
  {
    id: 'el-salvador-1992',
    name: 'El Salvador: Chapultepec Peace Agreement',
    region: 'Latin America & Caribbean',
    status: 'resolved',
    riskScore: 0,
    actorCount: 4,
    eventCount: 87,
    themes: ['Civil War', 'Security Sector Reform', 'UN Verification', 'Land Reform', 'Truth Commission'],
    institutions: ['ONUSAL', 'UN', 'US Government', 'OAS'],
    startYear: 1979,
    endYear: 1992,
    description: 'Chapultepec Agreement (1992) ended 13-year civil war with FMLN demobilization, military/security sector reform, and land redistribution. UN verification (ONUSAL) was critical to implementation. External superpower pressure created ripeness.',
    primaryConflictType: 'Civil war — comprehensive peace agreement',
  },
  {
    id: 'rwanda-1994',
    name: 'Rwanda: Genocide and Arusha Accords Failure',
    region: 'Sub-Saharan Africa',
    status: 'resolved',
    riskScore: 0,
    actorCount: 5,
    eventCount: 203,
    themes: ['Genocide', 'Early Warning Failure', 'UN Mandate Failure', 'Hate Media', 'Transitional Justice'],
    institutions: ['UNAMIR', 'UNSC', 'ICTR', 'Gacaca Courts'],
    startYear: 1990,
    endYear: 1994,
    description: 'Arusha Accords failed when Hutu Power extremists — excluded from negotiations — controlled implementation. ~800,000 killed despite UNAMIR presence. Radio Milles Collines amplified genocide; UNAMIR rules of engagement prevented intervention. Critical early warning failure case.',
    primaryConflictType: 'Genocide — Arusha peace process failure',
  },
  {
    id: 'bosnia-1995',
    name: 'Bosnia: Dayton Agreement',
    region: 'Europe',
    status: 'frozen',
    riskScore: 3.1,
    actorCount: 7,
    eventCount: 178,
    themes: ['Ethnic Conflict', 'NATO Intervention', 'Power-Sharing', 'Territorial Partition', 'Coercive Diplomacy'],
    institutions: ['NATO', 'OHR', 'IFOR/SFOR', 'EU', 'UN'],
    startYear: 1992,
    endYear: 1995,
    description: 'Dayton Agreement (1995) ended Bosnian War after NATO\'s Operation Deliberate Force changed battlefield dynamics. Ethnic territorial partition institutionalized war gains, enabling a stable but unreconciled peace. OHR established as international protectorate.',
    primaryConflictType: 'Ethnic civil war — frozen partition peace',
  },
  {
    id: 'northern-ireland-1998',
    name: 'Northern Ireland: Good Friday Agreement',
    region: 'Europe',
    status: 'resolved',
    riskScore: 0,
    actorCount: 7,
    eventCount: 134,
    themes: ['Political Violence', 'Power-Sharing', 'Identity Conflict', 'External Facilitation', 'Referendum Legitimacy'],
    institutions: ['British Government', 'Irish Government', 'Mitchell Commission', 'Stormont Assembly'],
    startYear: 1968,
    endYear: 1998,
    description: 'Good Friday Agreement (1998) established power-sharing assembly and cross-border institutions after 30 years of conflict. George Mitchell\'s facilitation provided neutral process architecture; referendum ratification gave popular legitimacy spoilers could not undermine.',
    primaryConflictType: 'Political/ethno-national conflict — power-sharing settlement',
  },
  {
    id: 'sierra-leone-2002',
    name: 'Sierra Leone: Post-Conflict Reconstruction',
    region: 'Sub-Saharan Africa',
    status: 'resolved',
    riskScore: 0,
    actorCount: 6,
    eventCount: 156,
    themes: ['Civil War', 'Resource Conflict', 'Child Soldiers', 'Transitional Justice', 'UK Intervention'],
    institutions: ['UNAMSIL', 'Special Court SL', 'Kimberley Process', 'ECOMOG'],
    startYear: 1991,
    endYear: 2002,
    description: 'Sierra Leone civil war ended 2002 after UK military intervention restabilized government when UNAMSIL was overwhelmed. Lomé Accord (1999) failed due to RUF impunity; Special Court provided accountability. Kimberley Process addressed conflict diamond supply chains.',
    primaryConflictType: 'Civil war — resource conflict with child soldier crisis',
  },
  {
    id: 'colombia-2016',
    name: 'Colombia: FARC Peace Accord',
    region: 'Latin America & Caribbean',
    status: 'active',
    riskScore: 4.2,
    actorCount: 5,
    eventCount: 189,
    themes: ['Civil War', 'Transitional Justice', 'Gender-Responsive Peace', 'Plebiscite Legitimacy', 'ELN Spoiler'],
    institutions: ['JEP', 'UN Mission Colombia', 'Cuba', 'Norway'],
    startYear: 1964,
    description: 'Havana Peace Accord (2016) ended 52-year FARC insurgency with rural reform, political participation provisions, and JEP restorative justice. Plebiscite defeat showed agreements need public legitimacy. ELN non-inclusion created residual armed group problem.',
    primaryConflictType: 'Civil war — landmark peace accord, partial implementation',
  },
  {
    id: 'south-sudan-2015',
    name: 'South Sudan: ARCSS and Relapse',
    region: 'Sub-Saharan Africa',
    status: 'active',
    riskScore: 7.6,
    actorCount: 6,
    eventCount: 211,
    themes: ['Power-Sharing Failure', 'Elite Settlement', 'Oil Revenue Conflict', 'DDR Failure', 'Relapse'],
    institutions: ['IGAD', 'AU', 'UNMISS', 'Troika'],
    startYear: 2013,
    description: 'ARCSS (2015) and R-ARCSS (2018) signed but poorly implemented; parallel command structures enabled relapse into violence. Elite political settlement divorced from community reconciliation. Oil revenue competition was structural driver peace agreements failed to resolve.',
    primaryConflictType: 'Civil war — power-sharing agreement relapse',
  },
  {
    id: 'minsk-ukraine',
    name: 'Ukraine: Minsk Agreements (2014–2022)',
    region: 'Europe',
    status: 'escalating',
    riskScore: 9.2,
    actorCount: 6,
    eventCount: 287,
    themes: ['Interstate Conflict', 'Frozen Conflict', 'Failed Implementation', 'Coercive Diplomacy', 'Russia-West'],
    institutions: ['OSCE', 'Normandy Format', 'UN', 'NATO'],
    startYear: 2014,
    description: 'Minsk I (2014) and Minsk II (2015) signed under military duress after Ukrainian defeats; sequencing dispute on ceasefire vs. autonomy never resolved. OSCE monitoring lacked enforcement; Russia used Minsk as strategic cover. Russia invaded February 2022.',
    primaryConflictType: 'Interstate conflict — failed frozen conflict management',
  },
  {
    id: 'yemen-current',
    name: 'Yemen: Civil War and Regional Proxy Conflict',
    region: 'Middle East & North Africa',
    status: 'active',
    riskScore: 8.7,
    actorCount: 7,
    eventCount: 312,
    themes: ['Proxy War', 'Humanitarian Crisis', 'Coalition Intervention', 'Houthi Insurgency', 'Saudi-Iran'],
    institutions: ['UN OSESGY', 'Saudi-led Coalition', 'OCHA', 'AU'],
    startYear: 2014,
    description: 'Multi-sided conflict pitting Houthis against Saudi-led coalition with UAE and STC splinter. 2022 UN-brokered truce partially held. Saudi-Iran rapprochement (2023) changed dynamics but implementation remains fragile. Humanitarian access used as a bargaining chip by all parties.',
    primaryConflictType: 'Civil war with regional proxy dimensions — ongoing',
  },
  {
    id: 'ethiopia-tigray-2022',
    name: 'Ethiopia: Tigray Conflict and Pretoria Agreement',
    region: 'Sub-Saharan Africa',
    status: 'active',
    riskScore: 6.4,
    actorCount: 5,
    eventCount: 198,
    themes: ['Civil War', 'AU Mediation', 'Mutually Hurting Stalemate', 'Eritrea Spoiler', 'Mass Atrocities'],
    institutions: ['AU High-Level Panel', 'IGAD', 'UN', 'EU'],
    startYear: 2020,
    description: 'Pretoria Agreement (Nov 2022) ended major hostilities after AU-led mediation by Obasanjo. Military stalemate following TPLF recapture of Tigray capital created ripeness. Eritrea as external party not bound by agreement; implementation ongoing.',
    primaryConflictType: 'Civil war — AU-mediated settlement, partial implementation',
  },
  {
    id: 'myanmar-2021',
    name: 'Myanmar: Military Coup and Civil Resistance',
    region: 'Asia-Pacific',
    status: 'escalating',
    riskScore: 8.1,
    actorCount: 7,
    eventCount: 243,
    themes: ['Military Coup', 'Civil Resistance', 'ASEAN Non-Interference', 'Ethnic Armed Groups', 'Sanctions Failure'],
    institutions: ['ASEAN', 'UN Special Envoy', 'NUG/CRPH', 'PDF'],
    startYear: 2021,
    description: 'Feb 2021 military coup reversed democratic transition; civil disobedience movement and PDF resistance ongoing. ASEAN Five-Point Consensus unimplemented; non-interference principle prevents effective regional mediation. EAO fragmentation creates multi-party complexity.',
    primaryConflictType: 'Military coup — civil resistance and fragmented insurgency',
  },
  {
    id: 'iran-nuclear-jcpoa',
    name: 'Iran Nuclear Program: JCPOA Negotiations',
    region: 'Middle East & North Africa',
    status: 'escalating',
    riskScore: 6.8,
    actorCount: 6,
    eventCount: 167,
    themes: ['Nuclear Diplomacy', 'Sanctions', 'Multilateral Verification', 'US Withdrawal', 'Two-Level Games'],
    institutions: ['IAEA', 'P5+1', 'EU', 'UN Security Council'],
    startYear: 2003,
    description: 'JCPOA (2015) dismantled Iran\'s nuclear program in exchange for sanctions relief; US withdrawal (2018) destroyed trust and credibility. Iran incrementally breached limits; JCPOA II talks stalled 2022. Demonstrates how domestic politics mirror-image as negotiation constraints.',
    primaryConflictType: 'Nuclear diplomacy — multilateral agreement collapse',
  },
  {
    id: 'sudan-civil-war-2023',
    name: 'Sudan: SAF-RSF Conflict',
    region: 'Sub-Saharan Africa',
    status: 'active',
    riskScore: 9.0,
    actorCount: 7,
    eventCount: 276,
    themes: ['Military Fragmentation', 'Proxy War', 'Transition Collapse', 'Humanitarian Catastrophe', 'Capital Siege'],
    institutions: ['IGAD', 'AU', 'Jeddah Process', 'FFC'],
    startYear: 2023,
    description: 'SAF-RSF power struggle erupted April 2023 after failed security sector integration. UAE backing RSF vs Egypt backing SAF undermined mediation coherence. Jeddah talks produced limited tactical ceasefires. Capital Khartoum divided; civilian transition actors sidelined.',
    primaryConflictType: 'Military fragmentation — transition collapse conflict',
  },
];

const DEMO_REGIONS = ['All Regions', ...Array.from(new Set(DEMO_CASES.map((c) => c.region)))];
const DEMO_STATUSES = ['All Status', 'active', 'escalating', 'frozen', 'resolved'];

function DemoCaseCard({ caseData, compareIds, onToggleCompare }: {
  caseData: DemoCaseData;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
}) {
  const router = useRouter();
  const status = STATUS_CONFIG[caseData.status];
  const StatusIcon = status.icon;
  const isSelected = compareIds.includes(caseData.id);

  return (
    <div className={cn(
      'group rounded-xl border bg-white transition-all hover:shadow-md hover:shadow-navy-950/5 flex flex-col',
      isSelected
        ? 'border-diplomatic-blue/40 shadow-sm shadow-diplomatic-blue/10'
        : 'border-[var(--color-app-border)] hover:border-navy-300'
    )}>
      {isSelected && (
        <div className="h-0.5 rounded-t-xl bg-diplomatic-blue" />
      )}
      <div className="flex-1 p-5">
        {/* Header */}
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', status.bg, status.color)}>
              <StatusIcon className="h-2.5 w-2.5" />
              {status.label}
            </span>
            <span className="text-[10px] text-navy-400">
              {caseData.region} · {caseData.startYear}{caseData.endYear ? `–${caseData.endYear}` : '–present'}
            </span>
          </div>
          <h3 className="text-base font-semibold text-navy-900">{caseData.name}</h3>
          <p className="mt-0.5 text-[11px] text-navy-400 italic">{caseData.primaryConflictType}</p>
        </div>

        <p className="mb-4 text-xs text-navy-600 leading-relaxed line-clamp-3">{caseData.description}</p>

        {/* Risk score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">Risk Score</span>
            {caseData.status === 'resolved' && (
              <span className="text-[10px] text-sage font-medium">Resolved</span>
            )}
          </div>
          <RiskBar score={caseData.riskScore} color={status.bar} />
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] p-3">
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.actorCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Actors</p>
          </div>
          <div className="border-x border-[var(--color-app-border-light)] text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.eventCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Events</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.institutions.length}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Bodies</p>
          </div>
        </div>

        {/* Themes */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {caseData.themes.slice(0, 3).map((theme) => (
            <span key={theme} className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] text-navy-600">
              {theme}
            </span>
          ))}
          {caseData.themes.length > 3 && (
            <span className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] text-navy-400">
              +{caseData.themes.length - 3} more
            </span>
          )}
        </div>

        {/* Institutions */}
        <div className="mb-4 flex flex-wrap gap-1">
          {caseData.institutions.map((inst) => (
            <span key={inst} className="rounded-md bg-diplomatic-blue/6 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue">
              {inst}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-[var(--color-app-border-light)] p-4">
        <PraxisLink
          href={`/cases/${caseData.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-app-border)] px-3 py-2 text-xs font-medium text-navy-600 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Case
        </PraxisLink>
        <button
          onClick={() => onToggleCompare(caseData.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            isSelected
              ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
              : 'border-[var(--color-app-border)] text-navy-600 hover:border-diplomatic-blue/20 hover:text-diplomatic-blue'
          )}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {isSelected ? 'Selected' : 'Compare'}
        </button>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            router.push(`/app/compare?caseId=${encodeURIComponent(caseData.id)}&caseName=${encodeURIComponent(caseData.name)}`);
          }}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-3"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Compare with my situation
        </button>
      </div>
    </div>
  );
}

function DemoCasesPage() {
  const router = useRouter();
  const route = usePraxisRoute();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = DEMO_CASES.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.themes.some((t) => t.toLowerCase().includes(q)) ||
      c.description.toLowerCase().includes(q);
    const matchRegion = regionFilter === 'All Regions' || c.region === regionFilter;
    const matchStatus = statusFilter === 'All Status' || c.status === statusFilter;
    return matchSearch && matchRegion && matchStatus;
  });

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (compareIds.length === 2) {
      router.push(route(`/compare?a=${compareIds[0]}&b=${compareIds[1]}`));
    }
  };

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="cases" />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <BookOpen className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Case Library</h1>
            <p className="text-sm text-navy-500">
              {DEMO_CASES.length} conflict case studies. Select two cases to run a comparative analysis.
            </p>
          </div>
        </div>

        {compareIds.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-2 text-xs text-diplomatic-blue">
              <GitCompare className="h-3.5 w-3.5" />
              {compareIds.length === 1 ? (
                <span>Select 1 more case</span>
              ) : (
                <span>2 cases selected</span>
              )}
              <button onClick={() => setCompareIds([])} className="ml-1 text-navy-400 hover:text-navy-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {compareIds.length === 2 && (
              <button
                onClick={handleCompare}
                className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 transition-colors"
              >
                <GitCompare className="h-4 w-4" />
                Compare Cases
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases by name, region, theme..."
            className="w-full rounded-lg border border-[var(--color-app-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-navy-400 shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {DEMO_REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                  regionFilter === r
                    ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                    : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
                )}
              >
                {r === 'All Regions' ? 'All' : r}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-[var(--color-app-border)]" />
          <div className="flex gap-2 flex-wrap">
            {DEMO_STATUSES.map((s) => {
              const meta = s !== 'All Status' ? STATUS_CONFIG[s as StatusKey] : null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-medium transition-all capitalize',
                    statusFilter === s
                      ? meta ? `${meta.bg} ${meta.color} border-transparent` : 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                      : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
                  )}
                >
                  {s === 'All Status' ? 'All' : s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <DemoCaseCard key={c.id} caseData={c} compareIds={compareIds} onToggleCompare={toggleCompare} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-app-border)] p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-navy-300" />
          <p className="text-sm font-medium text-navy-600">No cases match your search</p>
          <button
            onClick={() => { setSearch(''); setRegionFilter('All Regions'); setStatusFilter('All Status'); }}
            className="mt-3 text-xs text-diplomatic-blue hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Real mode — user's situations from the store                      */
/* ------------------------------------------------------------------ */

/** Map escalation trend to a visual status key for STATUS_CONFIG */
function resolveSituationStatusKey(s: Situation): StatusKey {
  if (s.status === 'resolved') return 'resolved';
  if (s.status === 'archived') return 'archived';
  // For active situations, use escalation trend to pick visual status
  if (s.escalationTrend === 'escalating' || s.escalationTrend === 'volatile') return 'escalating';
  if (s.escalationTrend === 'de-escalating') return 'resolved'; // calming down — show green
  return 'active'; // stable or default
}

function SituationCard({ situation, compareIds, onToggleCompare }: {
  situation: Situation;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
}) {
  const statusKey = resolveSituationStatusKey(situation);
  const status = STATUS_CONFIG[statusKey];
  const StatusIcon = status.icon;
  const isSelected = compareIds.includes(situation.id);

  const createdDate = new Date(situation.createdAt);
  const yearLabel = createdDate.getFullYear();

  return (
    <div className={cn(
      'group rounded-xl border bg-white transition-all hover:shadow-md hover:shadow-navy-950/5 flex flex-col',
      isSelected
        ? 'border-diplomatic-blue/40 shadow-sm shadow-diplomatic-blue/10'
        : 'border-[var(--color-app-border)] hover:border-navy-300'
    )}>
      {isSelected && (
        <div className="h-0.5 rounded-t-xl bg-diplomatic-blue" />
      )}
      <div className="flex-1 p-5">
        {/* Header */}
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', status.bg, status.color)}>
              <StatusIcon className="h-2.5 w-2.5" />
              {status.label}
            </span>
            <span className="text-[10px] text-navy-400">
              {situation.region} · {yearLabel}–present
            </span>
          </div>
          <h3 className="text-base font-semibold text-navy-900">{situation.name}</h3>
          <p className="mt-0.5 text-[11px] text-navy-400 italic capitalize">{situation.type} conflict</p>
        </div>

        <p className="mb-4 text-xs text-navy-600 leading-relaxed line-clamp-3">{situation.description}</p>

        {/* Risk score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">Risk Score</span>
            {situation.status === 'resolved' && (
              <span className="text-[10px] text-sage font-medium">Resolved</span>
            )}
          </div>
          <RiskBar score={situation.riskScore} color={status.bar} />
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] p-3">
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{situation.actorCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Actors</p>
          </div>
          <div className="border-x border-[var(--color-app-border-light)] text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{situation.graphEntities}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Entities</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{situation.documentCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Docs</p>
          </div>
        </div>

        {/* Actors as theme-style tags */}
        {situation.actors.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {situation.actors.slice(0, 4).map((actor) => (
              <span key={actor} className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] text-navy-600">
                {actor}
              </span>
            ))}
            {situation.actors.length > 4 && (
              <span className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] text-navy-400">
                +{situation.actors.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Escalation + Glasl info */}
        <div className="flex flex-wrap gap-1">
          <span className="rounded-md bg-diplomatic-blue/6 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue capitalize">
            {situation.escalationTrend}
          </span>
          {situation.glaslStage !== null && (
            <span className="rounded-md bg-diplomatic-blue/6 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue">
              Glasl {situation.glaslStage}
            </span>
          )}
          <span className="rounded-md bg-diplomatic-blue/6 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue capitalize">
            {situation.userRole}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-[var(--color-app-border-light)] p-4">
        <PraxisLink
          href={`/cases/${situation.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-app-border)] px-3 py-2 text-xs font-medium text-navy-600 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Case
        </PraxisLink>
        <button
          onClick={() => onToggleCompare(situation.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            isSelected
              ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
              : 'border-[var(--color-app-border)] text-navy-600 hover:border-diplomatic-blue/20 hover:text-diplomatic-blue'
          )}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {isSelected ? 'Selected' : 'Compare'}
        </button>
      </div>
    </div>
  );
}

function RealCasesPage() {
  const router = useRouter();
  const route = usePraxisRoute();
  const { situations } = useSituationStore();

  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Derive dynamic filter options from user's actual situations
  const regions = useMemo(
    () => ['All Regions', ...Array.from(new Set(situations.map((s) => s.region).filter(Boolean)))],
    [situations],
  );
  const statuses = useMemo(
    () => ['All Status', ...Array.from(new Set(situations.map((s) => s.status)))],
    [situations],
  );

  // Empty state
  if (situations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-diplomatic-blue/10">
          <FolderOpen className="h-8 w-8 text-diplomatic-blue" />
        </div>
        <h2 className="mt-6 text-lg font-semibold text-navy-900">Your Case Library is Empty</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-navy-500">
          Create your first situation to start building your case library. Each situation becomes a case you can analyze, compare, and track.
        </p>
        <button
          onClick={() => router.push(route('/situations/new'))}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" />
          Create Your First Situation
        </button>
      </div>
    );
  }

  const filtered = situations.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      s.name.toLowerCase().includes(q) ||
      s.region.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.actors.some((a) => a.toLowerCase().includes(q)) ||
      s.type.toLowerCase().includes(q);
    const matchRegion = regionFilter === 'All Regions' || s.region === regionFilter;
    const matchStatus = statusFilter === 'All Status' || s.status === statusFilter;
    return matchSearch && matchRegion && matchStatus;
  });

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (compareIds.length === 2) {
      router.push(route(`/compare?a=${compareIds[0]}&b=${compareIds[1]}`));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <BookOpen className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Case Library</h1>
            <p className="text-sm text-navy-500">
              {situations.length} situation{situations.length !== 1 ? 's' : ''} in your library. Select two to run a comparative analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(route('/situations/new'))}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-600 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Situation
          </button>

          {compareIds.length > 0 && (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-2 text-xs text-diplomatic-blue">
                <GitCompare className="h-3.5 w-3.5" />
                {compareIds.length === 1 ? (
                  <span>Select 1 more case</span>
                ) : (
                  <span>2 cases selected</span>
                )}
                <button onClick={() => setCompareIds([])} className="ml-1 text-navy-400 hover:text-navy-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {compareIds.length === 2 && (
                <button
                  onClick={handleCompare}
                  className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 transition-colors"
                >
                  <GitCompare className="h-4 w-4" />
                  Compare Cases
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, region, actor, type..."
            className="w-full rounded-lg border border-[var(--color-app-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-navy-400 shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                  regionFilter === r
                    ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                    : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
                )}
              >
                {r === 'All Regions' ? 'All' : r}
              </button>
            ))}
          </div>
          {statuses.length > 1 && (
            <>
              <div className="h-4 w-px bg-[var(--color-app-border)]" />
              <div className="flex gap-2 flex-wrap">
                {statuses.map((s) => {
                  const meta = s !== 'All Status' ? STATUS_CONFIG[s as StatusKey] : null;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-xs font-medium transition-all capitalize',
                        statusFilter === s
                          ? meta ? `${meta.bg} ${meta.color} border-transparent` : 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                          : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
                      )}
                    >
                      {s === 'All Status' ? 'All' : s}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => (
          <SituationCard key={s.id} situation={s} compareIds={compareIds} onToggleCompare={toggleCompare} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-app-border)] p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-navy-300" />
          <p className="text-sm font-medium text-navy-600">No cases match your search</p>
          <button
            onClick={() => { setSearch(''); setRegionFilter('All Regions'); setStatusFilter('All Status'); }}
            className="mt-3 text-xs text-diplomatic-blue hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export — routes to Demo or Real based on mode                */
/* ------------------------------------------------------------------ */

export default function CasesPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  if (isDemo) return <DemoCasesPage />;
  if (showGuard || !situation) return <NoSituationState />;
  return <RealCasesPage />;
}
