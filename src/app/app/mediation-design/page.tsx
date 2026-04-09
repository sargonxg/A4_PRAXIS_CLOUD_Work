'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';

import { useState, useEffect } from 'react';
import {
  Handshake, ChevronDown, ChevronUp, CheckCircle2, Clock,
  MapPin, Users, AlertTriangle, Flag, ChevronRight, Loader2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { recordActivity } from '@/lib/utils/activity';

// ─── Types ─────────────────────────────────────────────────────────────────

type PhaseStatus = 'completed' | 'active' | 'pending';
type FormatType = 'direct' | 'proximity' | 'shuttle' | 'multilateral' | 'hybrid';

interface ProcessPhase {
  id: string;
  name: string;
  duration: string;
  objective: string;
  keyActivities: string[];
  successCriteria: string[];
  risks: string[];
  status: PhaseStatus;
}

interface CBM {
  title: string;
  type: 'military' | 'humanitarian' | 'economic' | 'political' | 'symbolic';
  parties: string[];
  timeline: string;
  verificationMechanism: string;
}

interface MediationDesign {
  processName: string;
  format: FormatType;
  venue: string;
  mediatorProfile: string;
  phases: ProcessPhase[];
  cbms: CBM[];
  groundRules: string[];
  spoilerMitigation: string[];
  implementationMonitoring: string;
  processRisks: string[];
  designRationale: string;
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const PHASE_STATUS: Record<PhaseStatus, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50'     },
  active:    { icon: Clock,        color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8' },
  pending:   { icon: Clock,        color: 'text-navy-400',    bg: 'bg-navy-50'        },
};

const CBM_TYPE_COLORS: Record<CBM['type'], string> = {
  military:     'bg-red-50    text-red-700    border-red-200',
  humanitarian: 'bg-amber-50  text-amber-700  border-amber-200',
  economic:     'bg-green-50  text-green-700  border-green-200',
  political:    'bg-blue-50   text-blue-700   border-blue-200',
  symbolic:     'bg-purple-50 text-purple-700 border-purple-200',
};

const FORMAT_LABELS: Record<FormatType, { label: string; description: string }> = {
  direct:        { label: 'Direct Talks',     description: 'Parties meet face-to-face'                              },
  proximity:     { label: 'Proximity Talks',  description: 'Parties in separate rooms, mediator shuttles'           },
  shuttle:       { label: 'Shuttle Diplomacy',description: 'Mediator travels between parties\' home locations'       },
  multilateral:  { label: 'Multilateral',     description: 'Multiple parties in plenary format'                      },
  hybrid:        { label: 'Hybrid Format',    description: 'Combination of direct, proximity, and shuttle elements' },
};

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_DATA: MediationDesign = {
  processName: 'Nordalia Inclusive Peace Process (NIPP)',
  format: 'hybrid',
  venue: 'Kigali, Rwanda (African Union Peace and Security Council facilities)',
  mediatorProfile: 'Joint AU-UN mediation team: AU Commissioner for Peace and Security (lead), UN DPPA senior political officer, supported by specialized technical advisors (security, economic, human rights).',
  phases: [
    {
      id: 'p1',
      name: 'Pre-Negotiation: Confidence-Building',
      duration: '8-12 weeks',
      objective: 'Establish sufficient trust and conditions for both parties to commit to formal negotiations. Secure Karovia\'s commitment to halt material support to DRM.',
      keyActivities: [
        'Bilateral pre-talks with GoN (Foreign Minister level) and DRM leadership (through backchannel)',
        'Karovian engagement track: secure commitment to pause military support as pre-condition',
        'Humanitarian confidence-building: ICRC-facilitated prisoner exchange (minimum 30 detainees per side)',
        'Technical working group on ceasefire compliance (GoN + DRM military representatives, UNMN chair)',
        'Identify and agree on list of core issues for the main negotiation agenda',
      ],
      successCriteria: [
        'Both parties provide written commitment to negotiate in good faith',
        'Humanitarian access opens to all districts (OCHA verification)',
        'At least one prisoner exchange completed',
        'Karovia issues public statement on non-interference',
      ],
      risks: [
        'GoN may condition participation on DRM disarmament first — resist any pre-conditions beyond ceasefire respect',
        'DRM may demand political recognition before talks — offer "consultation status" as compromise',
      ],
      status: 'active',
    },
    {
      id: 'p2',
      name: 'Substantive Negotiations: Economic Issues',
      duration: '10-14 weeks',
      objective: 'Reach framework agreement on revenue-sharing and economic governance of eastern provinces — the issue with the strongest ZOPA.',
      keyActivities: [
        'Belara Mining Complex revenue-sharing formula (World Bank technical support)',
        'Eastern Provincial Development Fund establishment (EU as anchor donor)',
        'Economic governance framework for DRM-controlled territory (transition arrangements)',
        'International investment guarantees conditional on settlement',
      ],
      successCriteria: [
        'Agreement in principle on revenue-sharing percentage (target: 30-40% to eastern provinces)',
        'International financial institution commitment to administer interim arrangements',
        'Both parties sign Partial Economic Framework Agreement',
      ],
      risks: [
        'GoN may attempt to link economic agreement to security/DDR (resists sequencing)',
        'DRM maximalist positions may delay unless Karovia applies pressure',
      ],
      status: 'pending',
    },
    {
      id: 'p3',
      name: 'Substantive Negotiations: Security and DDR',
      duration: '12-16 weeks',
      objective: 'Negotiate phased DDR and security arrangements. Most technically complex phase requiring parallel military-to-military track.',
      keyActivities: [
        'Ceasefire consolidation and buffer zone expansion negotiations',
        'DDR sequencing: phased cantonment linked to political benchmarks (not pre-conditions)',
        'Security guarantees for DRM leadership (international guarantors mechanism)',
        'UNMN monitoring mandate expansion and strengthening',
        'Security sector reform framework (integration pathway for DRM fighters)',
      ],
      successCriteria: [
        'Phased DDR timeline agreed (24-36 month framework)',
        'Security guarantee mechanism signed by international guarantors',
        'Joint Security Committee established with UNMN oversight',
      ],
      risks: [
        'GoN military hardliners may resist any integration pathway for DRM commanders',
        'DRM will not disarm without credible security guarantees — this is the chicken-and-egg problem',
      ],
      status: 'pending',
    },
    {
      id: 'p4',
      name: 'Substantive Negotiations: Political Settlement',
      duration: '10-14 weeks',
      objective: 'Negotiate transitional political arrangements, electoral framework, and long-term governance structure.',
      keyActivities: [
        'Transitional governance framework (power-sharing modalities)',
        'Electoral commission reform and internationally supervised elections (timeline)',
        'Constitutional amendment process for eastern province autonomy',
        'Transitional justice and accountability mechanism (TRC or hybrid tribunal)',
        'DRM political party registration pathway',
      ],
      successCriteria: [
        'Electoral framework agreement including DRM participation rights',
        'Transitional justice mechanism with international support',
        'Constitutional reform roadmap with clear timelines',
      ],
      risks: [
        'President Osei will resist any power-sharing that threatens his position',
        'DRM maximalist demand for immediate elections may be a spoiler position',
      ],
      status: 'pending',
    },
    {
      id: 'p5',
      name: 'Implementation and Monitoring',
      duration: 'Ongoing (36 months)',
      objective: 'Ensure faithful implementation of all agreement provisions through robust monitoring and enforcement architecture.',
      keyActivities: [
        'Joint Implementation Commission establishment (co-chaired by AU and UN)',
        'Quarterly UNSC reporting on implementation progress',
        'International contact group activation (AU, EU, Karovia, Westmark)',
        'Early warning mechanism for spoiler activity',
      ],
      successCriteria: [
        'Implementation Commission operational within 30 days of signing',
        'First UNSC report submitted within 90 days',
        'Contact group holds first ministerial meeting within 60 days',
      ],
      risks: [
        'Donor fatigue may reduce financial support for implementation',
        'Spoiler activity by military hardliners in post-settlement phase',
      ],
      status: 'pending',
    },
  ],
  cbms: [
    {
      title: 'ICRC-facilitated prisoner exchange',
      type: 'military',
      parties: ['Government of Nordalia', 'Democratic Reform Movement'],
      timeline: 'Phase 1 — weeks 4-6',
      verificationMechanism: 'ICRC independent monitoring with UNMN observation; joint GoN-DRM prisoner list submission.',
    },
    {
      title: 'Humanitarian access opening',
      type: 'humanitarian',
      parties: ['Government of Nordalia', 'OCHA'],
      timeline: 'Phase 1 — weeks 1-3',
      verificationMechanism: 'OCHA weekly convoy reporting; UNMN checkpoint monitoring.',
    },
    {
      title: 'Belara Mining escrow continuation',
      type: 'economic',
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'World Bank'],
      timeline: 'Ongoing from Phase 1',
      verificationMechanism: 'World Bank monthly financial transparency reports; joint account access.',
    },
    {
      title: 'Joint military de-escalation declaration',
      type: 'military',
      parties: ['Government of Nordalia', 'Democratic Reform Movement'],
      timeline: 'Phase 1 — week 2',
      verificationMechanism: 'UNMN observation on ground; satellite monitoring; joint incident reporting hotline.',
    },
  ],
  groundRules: [
    'All parties negotiate in good faith and refrain from publicly undermining the process',
    'Confidentiality of negotiating positions — no leak to press without mutual agreement',
    'No pre-conditions beyond ceasefire respect and humanitarian access',
    'Mediator has authority to propose compromise formulations and procedural decisions',
    'Parties may consult their constituencies but delegation heads have mandate to initial agreements',
    'Nothing is agreed until everything is agreed (single undertaking principle)',
    'Regional and international guarantors observe but do not participate in substantive negotiations',
  ],
  spoilerMitigation: [
    'GoN military hardliners: Engage through Ministry of Defence parallel track; offer security sector reform benefits; UNSC targeted sanctions designation as deterrent',
    'DRM commanders with criminal networks: Targeted financial accountability measures; DDR economic incentives tailored to economic spoilers',
    'Karovia: High-level bilateral engagement; offer economic investment package conditional on non-interference',
    'President Osei political vulnerability: Design process guarantees that protect incumbent from removal — elections must not threaten his immediate political survival to prevent spoiling',
  ],
  implementationMonitoring: 'A Joint Implementation Commission (JIC), co-chaired by the AU Commissioner and UN DPPA, will monitor all agreement provisions with quarterly UNSC reporting. An International Contact Group comprising AU, EU, Karovia, and Westmark will provide political oversight at ministerial level. UNMN mandate will be strengthened to include implementation verification. A dedicated financial mechanism (trust fund) will be administered by the World Bank to ensure resource availability for all implementation activities. Early warning triggers linked to UNSC action will be built into the monitoring framework.',
  processRisks: [
    'Karovia non-compliance: If Karovia continues material support during negotiations, DRM will have less incentive to make concessions — must be addressed before talks begin',
    'GoN elections: If elections are called before settlement, the GoN delegation loses its negotiating mandate',
    'DRM internal fragmentation: Multiple DRM commanders may not accept what the political leadership agrees — internal DRM consultation mechanism is essential',
    'Regional contagion: Neighboring states may opportunistically intervene if process appears to weaken GoN or strengthen DRM',
    'Donor fatigue: Without sustained EU/US financial commitment, implementation fund cannot be capitalized',
  ],
  designRationale: 'The hybrid format (proximity for initial phases, direct for technical working groups, shuttle for political issues) reflects the deep mutual distrust between the parties. The sequencing from economic to security to political issues applies the Lax/Sebenius principle of building momentum on easier issues first. The inclusion of Karovia as a "regional guarantor" rather than a party transforms its spoiler potential into a vested interest in success. The single undertaking principle prevents cherry-picking and ensures comprehensive implementation.',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function PhaseCard({ phase, index }: { phase: ProcessPhase; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const { icon: Icon, color, bg } = PHASE_STATUS[phase.status];

  return (
    <div className={cn(
      'rounded-xl border bg-white transition-shadow hover:shadow-sm',
      phase.status === 'active' ? 'border-diplomatic-blue/25' : 'border-[var(--color-app-border)]'
    )}>
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] font-bold text-navy-600">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-navy-900">{phase.name}</h3>
            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', bg, color)}>
              <Icon className="h-3 w-3" />
              {phase.status}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-navy-400">
            <Clock className="h-3 w-3" />
            {phase.duration}
          </div>
          {!expanded && (
            <p className="mt-1 text-xs text-navy-500 line-clamp-1">{phase.objective}</p>
          )}
        </div>

        <div className="shrink-0 text-navy-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-app-border)] px-4 pb-4 pt-3 space-y-4">
          <p className="text-xs leading-relaxed text-navy-600">{phase.objective}</p>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-navy-400">Key Activities</p>
            <ul className="space-y-1">
              {phase.keyActivities.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-diplomatic-blue/40" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">Success Criteria</p>
            <ul className="space-y-1">
              {phase.successCriteria.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {phase.risks.length > 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">Phase Risks</p>
              <ul className="space-y-1">
                {phase.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Process Architecture Timeline ──────────────────────────────────────────

const TIMELINE_PHASES = [
  {
    key: 'pre-negotiation',
    label: 'Pre-Negotiation',
    description: 'Build trust, secure commitments',
    statusKey: 'p1',
  },
  {
    key: 'framework',
    label: 'Framework Agreement',
    description: 'Agree on process architecture',
    statusKey: 'p2',
  },
  {
    key: 'substance',
    label: 'Substance',
    description: 'Negotiate core issues',
    statusKey: 'p3',
  },
  {
    key: 'implementation',
    label: 'Implementation',
    description: 'Monitor and enforce agreement',
    statusKey: 'p5',
  },
];

function ProcessArchitectureTimeline({ data }: { data: MediationDesign }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const phaseByStatusKey = (statusKey: string) =>
    data.phases.find((p) => p.id === statusKey) ?? null;

  const getPhaseStatus = (statusKey: string): PhaseStatus => {
    const ph = phaseByStatusKey(statusKey);
    return ph?.status ?? 'pending';
  };

  const statusBorder: Record<PhaseStatus, string> = {
    completed: 'border-emerald-200 bg-emerald-50',
    active: 'border-diplomatic-blue bg-diplomatic-blue/10',
    pending: 'border-navy-200 bg-navy-50/50',
  };

  const statusDot: Record<PhaseStatus, string> = {
    completed: 'bg-emerald-500',
    active: 'bg-diplomatic-blue',
    pending: 'bg-navy-300',
  };

  const selectedPhase = selectedKey
    ? data.phases.find((p) =>
        TIMELINE_PHASES.find((t) => t.key === selectedKey)?.statusKey === p.id
      ) ?? null
    : null;

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">
        Process Architecture
      </h2>

      {/* Horizontal timeline */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {TIMELINE_PHASES.map((tp, idx) => {
          const status = getPhaseStatus(tp.statusKey);
          const isSelected = selectedKey === tp.key;

          return (
            <div key={tp.key} className="flex items-center">
              <button
                onClick={() => setSelectedKey(isSelected ? null : tp.key)}
                className={cn(
                  'flex min-w-[130px] flex-col gap-1 rounded-xl border-2 p-3 text-left transition-all hover:shadow-md',
                  statusBorder[status],
                  isSelected && 'ring-2 ring-offset-1',
                  isSelected && status === 'active' && 'ring-diplomatic-blue',
                  isSelected && status === 'completed' && 'ring-emerald-400',
                  isSelected && status === 'pending' && 'ring-navy-300',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', statusDot[status])} />
                  <span className="text-[11px] font-bold text-navy-800">{tp.label}</span>
                </div>
                <p className="text-[10px] text-navy-500">{tp.description}</p>
                <span className={cn(
                  'mt-0.5 self-start rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize',
                  status === 'completed' && 'bg-emerald-100 text-emerald-700',
                  status === 'active' && 'bg-diplomatic-blue/10 text-diplomatic-blue',
                  status === 'pending' && 'bg-navy-100 text-navy-500',
                )}>
                  {status}
                </span>
              </button>

              {idx < TIMELINE_PHASES.length - 1 && (
                <ChevronRight className="mx-1 h-5 w-5 shrink-0 text-navy-300" />
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded detail panel */}
      {selectedPhase && (
        <div className="mt-3 rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-navy-900">{selectedPhase.name}</h3>
              <p className="mt-0.5 text-xs text-navy-500">{selectedPhase.objective}</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-navy-400">
              <Clock className="h-3 w-3" />
              {selectedPhase.duration}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-navy-400">Objectives</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-xs text-navy-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-diplomatic-blue/40" />
                  {selectedPhase.objective}
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-navy-400">Key Activities</p>
              <ul className="space-y-1">
                {selectedPhase.keyActivities.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-diplomatic-blue/40" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">Success Criteria</p>
              <ul className="space-y-1">
                {selectedPhase.successCriteria.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {selectedPhase.risks.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">Risks</p>
                <ul className="space-y-1">
                  {selectedPhase.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CBM Designer Section ────────────────────────────────────────────────────

const CBM_SEQUENCE_ORDER: CBM['type'][] = ['symbolic', 'humanitarian', 'economic', 'political', 'military'];

const CBM_SEQUENCE_LABELS: Record<CBM['type'], string> = {
  symbolic: 'Symbolic (quickest to implement)',
  humanitarian: 'Humanitarian',
  economic: 'Economic',
  political: 'Political',
  military: 'Military (hardest)',
};

const CBM_TRUST_BRIDGES: Record<CBM['type'], string> = {
  symbolic: 'Builds trust for: Humanitarian access',
  humanitarian: 'Builds trust for: Economic arrangements',
  economic: 'Builds trust for: Political negotiations',
  political: 'Builds trust for: Military/DDR agreements',
  military: 'Culminating measure — requires all preceding trust',
};

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-navy-50/50 transition-colors"
      >
        <span className="text-sm font-semibold text-navy-900">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-navy-400" /> : <ChevronDown className="h-4 w-4 text-navy-400" />}
      </button>
      {open && (
        <div className="border-t border-[var(--color-app-border)] p-4">
          {children}
        </div>
      )}
    </div>
  );
}

function CBMDesignerSection({ cbms }: { cbms: CBM[] }) {
  // Group by type
  const grouped = CBM_SEQUENCE_ORDER.reduce<Record<CBM['type'], CBM[]>>(
    (acc, type) => {
      acc[type] = cbms.filter((c) => c.type === type);
      return acc;
    },
    { symbolic: [], humanitarian: [], economic: [], political: [], military: [] }
  );

  // Sequenced list sorted by urgency order
  const sequenced = CBM_SEQUENCE_ORDER.flatMap((type) => grouped[type]);

  return (
    <CollapsibleSection title="CBMs Designer — Confidence-Building Measures">
      <div className="space-y-5">
        {/* Grouped CBMs */}
        <div className="space-y-3">
          {CBM_SEQUENCE_ORDER.map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            return (
              <div key={type}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize', CBM_TYPE_COLORS[type])}>
                    {type}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((cbm, i) => (
                    <div key={i} className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt,#f8fafc)] p-3">
                      <p className="text-xs font-semibold text-navy-800">{cbm.title}</p>
                      <div className="mt-1.5 grid gap-1 text-[11px] text-navy-500 sm:grid-cols-2">
                        <span><strong className="text-navy-600">Timeline:</strong> {cbm.timeline}</span>
                        <span><strong className="text-navy-600">Verification:</strong> {cbm.verificationMechanism}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {cbm.parties.map((p) => (
                          <span key={p} className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] text-navy-500">{p}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sequencing sub-panel */}
        {sequenced.length > 0 && (
          <div className="rounded-xl border border-navy-100 bg-navy-50/40 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-navy-400">
              Recommended Sequencing (Trust-Building Order)
            </p>
            <div className="space-y-2">
              {sequenced.map((cbm, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                      cbm.type === 'symbolic' && 'bg-purple-500',
                      cbm.type === 'humanitarian' && 'bg-amber-500',
                      cbm.type === 'economic' && 'bg-green-600',
                      cbm.type === 'political' && 'bg-blue-600',
                      cbm.type === 'military' && 'bg-red-600',
                    )}>
                      {i + 1}
                    </span>
                    {i < sequenced.length - 1 && (
                      <div className="mt-0.5 h-3 w-px bg-navy-200" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-medium text-navy-800">{cbm.title}</p>
                    <p className="text-[10px] text-navy-400">
                      {CBM_TRUST_BRIDGES[cbm.type]}
                    </p>
                    <p className="text-[10px] italic text-navy-400">{CBM_SEQUENCE_LABELS[cbm.type]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

// ─── Spoiler Analysis Section ────────────────────────────────────────────────

interface SpoilerActor {
  name: string;
  motivation: string;
  capacity: 'High' | 'Medium' | 'Low' | 'Low-Medium';
  strategy: string;
  capacityScore: number; // 0-1 for matrix positioning
  motivationScore: number; // 0-1 for matrix positioning
}

const DEMO_SPOILERS: {
  total: SpoilerActor[];
  limited: SpoilerActor[];
  greedy: SpoilerActor[];
} = {
  total: [
    {
      name: 'EMLF hardliners faction',
      motivation: 'Continued conflict enables resource extraction',
      capacity: 'High',
      strategy: 'Exclusion from process + offer partial amnesty',
      capacityScore: 0.85,
      motivationScore: 0.9,
    },
  ],
  limited: [
    {
      name: 'Karovia proxy networks',
      motivation: 'Maintain influence in eastern provinces',
      capacity: 'Medium',
      strategy: 'Include in observer status, address specific security concerns',
      capacityScore: 0.5,
      motivationScore: 0.55,
    },
  ],
  greedy: [
    {
      name: 'Armed criminal networks',
      motivation: 'Peace disrupts illicit economy',
      capacity: 'Low-Medium',
      strategy: 'SSR program with economic alternatives',
      capacityScore: 0.3,
      motivationScore: 0.7,
    },
  ],
};

const SPOILER_TYPE_STYLES = {
  total: { label: 'Total Spoilers', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', risk: 'High Risk' },
  limited: { label: 'Limited Spoilers', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', risk: 'Medium Risk' },
  greedy: { label: 'Greedy Spoilers', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', risk: 'Variable Risk' },
};

function SpoilerAnalysisSection({ data }: { data: MediationDesign }) {
  // In real mode we use demo spoilers mapped from spoilerMitigation; in demo we use DEMO_SPOILERS
  const spoilers = DEMO_SPOILERS;

  return (
    <CollapsibleSection title="Spoiler Risk Assessment (Stedman 1997)">
      <div className="space-y-4">
        <p className="text-[11px] italic text-navy-500">
          Based on Stedman&apos;s spoiler theory distinguishing total spoilers (oppose any settlement), limited spoilers (have specific objections), and greedy spoilers (opportunistic).
        </p>

        {/* 3-column grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          {(['total', 'limited', 'greedy'] as const).map((type) => {
            const style = SPOILER_TYPE_STYLES[type];
            const actors = spoilers[type];
            return (
              <div key={type} className={cn('rounded-xl border p-4 space-y-3', style.bg, style.border)}>
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', style.badge)}>
                    {style.label}
                  </span>
                  <span className="text-[9px] text-navy-400">{style.risk}</span>
                </div>
                {actors.map((actor, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />
                      <p className="text-[11px] font-semibold text-navy-800">{actor.name}</p>
                    </div>
                    <p className="text-[10px] text-navy-600">
                      <strong>Motivation:</strong> {actor.motivation}
                    </p>
                    <p className="text-[10px] text-navy-600">
                      <strong>Capacity:</strong> {actor.capacity}
                    </p>
                    <p className="text-[10px] italic text-navy-500">
                      <strong>Strategy:</strong> {actor.strategy}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Risk matrix 2x2 */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-navy-400">
            Risk Matrix: Motivation × Capacity
          </p>
          <div className="relative h-48 w-full overflow-hidden rounded-xl border border-navy-200 bg-navy-50/50">
            {/* Axes labels */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-navy-400">Motivation →</div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-navy-400">Capacity →</div>

            {/* Quadrant lines */}
            <div className="absolute left-1/2 top-0 h-full w-px bg-navy-200" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-navy-200" />

            {/* Quadrant labels */}
            <span className="absolute right-2 top-2 text-[9px] text-red-400 font-semibold">High Risk</span>
            <span className="absolute left-6 top-2 text-[9px] text-amber-400 font-semibold">Moderate</span>
            <span className="absolute right-2 bottom-2 text-[9px] text-amber-400 font-semibold">Moderate</span>
            <span className="absolute left-6 bottom-2 text-[9px] text-green-500 font-semibold">Low Risk</span>

            {/* Actor dots */}
            {[...spoilers.total, ...spoilers.limited, ...spoilers.greedy].map((actor, i) => {
              const type = spoilers.total.includes(actor)
                ? 'total'
                : spoilers.limited.includes(actor)
                ? 'limited'
                : 'greedy';
              const style = SPOILER_TYPE_STYLES[type];
              const left = `${10 + actor.motivationScore * 80}%`;
              const top = `${10 + (1 - actor.capacityScore) * 80}%`;
              return (
                <div
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{ left, top, transform: 'translate(-50%, -50%)' }}
                >
                  <span className={cn('h-3 w-3 rounded-full border-2 border-white shadow', style.dot)} />
                  <span className="mt-0.5 max-w-[80px] text-center text-[8px] leading-tight text-navy-600 line-clamp-2">
                    {actor.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mitigation note */}
        {data.spoilerMitigation.length > 0 && (
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">Mitigation Strategies (from Process Design)</p>
            <ul className="space-y-1">
              {data.spoilerMitigation.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-navy-600">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

// ─── Ripeness Assessment Section ─────────────────────────────────────────────

interface RipenessIndicator {
  label: string;
  checked: boolean;
}

const MHS_INDICATORS: RipenessIndicator[] = [
  { label: 'Both parties unable to achieve military victory', checked: true },
  { label: 'Economic costs of conflict unsustainable', checked: true },
  { label: 'Civilian population pressuring for resolution', checked: true },
  { label: 'International isolation increasing', checked: true },
];

const MEO_INDICATORS: RipenessIndicator[] = [
  { label: 'Credible mediator available', checked: true },
  { label: 'Political will exists in key decision-makers', checked: true },
  { label: 'International guarantors ready to engage', checked: false },
  { label: 'Favorable external conditions (elections, regional forum)', checked: false },
];

function RipenessAssessmentSection() {
  const [mhs, setMhs] = useState<RipenessIndicator[]>(MHS_INDICATORS);
  const [meo, setMeo] = useState<RipenessIndicator[]>(MEO_INDICATORS);

  const score = mhs.filter((i) => i.checked).length + meo.filter((i) => i.checked).length;
  const total = mhs.length + meo.length;

  const scoreColor =
    score <= 3 ? 'text-red-600' :
    score <= 5 ? 'text-amber-600' :
    'text-emerald-600';

  const windowLabel =
    score <= 3 ? 'Weak' :
    score <= 5 ? 'Moderate' :
    'Strong';

  const windowBg =
    score <= 3 ? 'bg-red-100 text-red-700' :
    score <= 5 ? 'bg-amber-100 text-amber-700' :
    'bg-emerald-100 text-emerald-700';

  const thermometerPct = Math.round((score / total) * 100);
  const thermometerColor =
    score <= 3 ? 'bg-red-400' :
    score <= 5 ? 'bg-amber-400' :
    'bg-emerald-500';

  const toggleMhs = (idx: number) =>
    setMhs((prev) => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  const toggleMeo = (idx: number) =>
    setMeo((prev) => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));

  return (
    <CollapsibleSection title="Ripeness Assessment (Zartman 1989)">
      <div className="space-y-4">
        <p className="text-[11px] italic text-navy-500">
          Zartman&apos;s Ripeness Theory identifies Mutually Hurting Stalemates (MHS) and Mutually Enticing Opportunities (MEO) as prerequisites for successful negotiation.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* MHS */}
          <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-red-600">
              MHS Indicators — Mutually Hurting Stalemate
            </p>
            <ul className="space-y-2">
              {mhs.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleMhs(i)}
                    className="mt-0.5 h-3.5 w-3.5 accent-red-500"
                  />
                  <span className="text-xs text-navy-700">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* MEO */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
              MEO Indicators — Mutually Enticing Opportunity
            </p>
            <ul className="space-y-2">
              {meo.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleMeo(i)}
                    className="mt-0.5 h-3.5 w-3.5 accent-emerald-500"
                  />
                  <span className="text-xs text-navy-700">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Score + thermometer */}
        <div className="flex items-center gap-6 rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          {/* Thermometer */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Ripeness</p>
            <div className="relative h-24 w-5 overflow-hidden rounded-full border border-navy-200 bg-navy-100">
              <div
                className={cn('absolute bottom-0 w-full rounded-full transition-all duration-500', thermometerColor)}
                style={{ height: `${thermometerPct}%` }}
              />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className={cn('text-2xl font-bold tabular-nums', scoreColor)}>
                {score}/{total}
              </span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', windowBg)}>
                {windowLabel} Window
              </span>
            </div>
            <p className="text-[11px] text-navy-600">
              A score of 6+ suggests strong conditions for mediation.
              Current window: <span className={cn('font-semibold', scoreColor)}>{windowLabel}</span>
            </p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ─── UNSCR 1325 Inclusivity Checklist ───────────────────────────────────────

interface InclusivityItem {
  label: string;
  checked: boolean;
}

interface InclusivityCategory {
  title: string;
  items: InclusivityItem[];
}

const INITIAL_INCLUSIVITY: InclusivityCategory[] = [
  {
    title: "Women's Participation (UNSCR 1325)",
    items: [
      { label: 'Women present in delegation', checked: true },
      { label: 'Gender advisor appointed', checked: true },
      { label: 'Gender provisions in framework', checked: false },
    ],
  },
  {
    title: 'Civil Society Inclusion',
    items: [
      { label: 'CSO consultation mechanism', checked: true },
      { label: 'CSO observer status in talks', checked: false },
    ],
  },
  {
    title: 'Youth Engagement (UNSCR 2250)',
    items: [
      { label: 'Youth representatives consulted', checked: true },
      { label: 'Youth provisions in peace agreement', checked: false },
    ],
  },
  {
    title: "Victims' Representation",
    items: [
      { label: "Victims' commission established", checked: true },
      { label: 'Accountability provisions included', checked: false },
    ],
  },
  {
    title: 'Track II/III Coordination',
    items: [
      { label: 'Back-channel Track II active', checked: true },
      { label: 'Community peace committees engaged', checked: false },
    ],
  },
];

function InclusivityChecklist() {
  const [categories, setCategories] = useState<InclusivityCategory[]>(INITIAL_INCLUSIVITY);

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
  const checkedItems = categories.reduce((sum, c) => sum + c.items.filter((i) => i.checked).length, 0);
  const pct = Math.round((checkedItems / totalItems) * 100);

  const toggle = (catIdx: number, itemIdx: number) => {
    setCategories((prev) =>
      prev.map((cat, ci) =>
        ci !== catIdx
          ? cat
          : {
              ...cat,
              items: cat.items.map((item, ii) =>
                ii !== itemIdx ? item : { ...item, checked: !item.checked }
              ),
            }
      )
    );
  };

  const scoreColor =
    pct < 40 ? 'bg-red-400' :
    pct < 70 ? 'bg-amber-400' :
    'bg-emerald-500';

  return (
    <CollapsibleSection title="Inclusivity Checklist (UNSCR 1325 & 2250)">
      <div className="space-y-4">
        {/* Score bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-navy-700">
              {checkedItems}/{totalItems} inclusivity criteria met
            </span>
            <span className="text-navy-400">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
            <div
              className={cn('h-full rounded-full transition-all duration-500', scoreColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((cat, ci) => (
            <div key={ci} className="rounded-lg border border-[var(--color-app-border)] bg-navy-50/30 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-navy-500">{cat.title}</p>
              <ul className="space-y-1.5">
                {cat.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggle(ci, ii)}
                      className="mt-0.5 h-3.5 w-3.5 accent-diplomatic-blue"
                    />
                    <span className="text-xs text-navy-700">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-[10px] italic text-navy-400">
          UNSCR 2250 (2015) on Youth, Peace and Security supplements UNSCR 1325 with specific provisions for youth participation. Both resolutions set international standards for inclusive peace processes.
        </p>
      </div>
    </CollapsibleSection>
  );
}

// ─── Shared content ──────────────────────────────────────────────────────────

function MediationDesignContent({ data }: { data: MediationDesign }) {
  const formatInfo = FORMAT_LABELS[data.format];

  return (
    <div className="space-y-6">
      {/* Process overview */}
      <div className="rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/4 p-5">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">{data.processName}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-diplomatic-blue/60" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">Format</p>
              <p className="text-xs font-medium text-navy-700">{formatInfo.label}</p>
              <p className="text-[11px] text-navy-500">{formatInfo.description}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-diplomatic-blue/60" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">Venue</p>
              <p className="text-xs text-navy-700">{data.venue}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Handshake className="mt-0.5 h-4 w-4 shrink-0 text-diplomatic-blue/60" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">Mediator</p>
              <p className="text-xs text-navy-700">{data.mediatorProfile}</p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Process Architecture Timeline */}
      <ProcessArchitectureTimeline data={data} />

      {/* Phase roadmap */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">Process Roadmap</h2>
        <div className="space-y-3">
          {data.phases.map((phase, i) => (
            <PhaseCard key={phase.id} phase={phase} index={i} />
          ))}
        </div>
      </div>

      {/* NEW: CBMs Designer */}
      {data.cbms.length > 0 && <CBMDesignerSection cbms={data.cbms} />}

      {/* Original CBMs (full detail view) */}
      {data.cbms.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">
            Confidence-Building Measures (Detail)
          </h2>
          <div className="space-y-2">
            {data.cbms.map((cbm, i) => (
              <div key={i} className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-navy-800">{cbm.title}</span>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', CBM_TYPE_COLORS[cbm.type])}>
                    {cbm.type}
                  </span>
                </div>
                <div className="mt-2 grid gap-1 text-[11px] text-navy-500 sm:grid-cols-2">
                  <span><strong className="text-navy-600">Timeline:</strong> {cbm.timeline}</span>
                  <span><strong className="text-navy-600">Verification:</strong> {cbm.verificationMechanism}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {cbm.parties.map(p => (
                    <span key={p} className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] text-navy-500">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW: Spoiler Analysis */}
      <SpoilerAnalysisSection data={data} />

      {/* NEW: Ripeness Assessment */}
      <RipenessAssessmentSection />

      {/* NEW: UNSCR 1325 Inclusivity Checklist */}
      <InclusivityChecklist />

      {/* Ground rules */}
      {data.groundRules.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Ground Rules</h3>
          <ol className="space-y-1.5">
            {data.groundRules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-navy-600">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[9px] font-bold text-navy-500">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Spoiler mitigation */}
      {data.spoilerMitigation.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-navy-900">Spoiler Mitigation Strategies</h3>
          </div>
          <ul className="space-y-2">
            {data.spoilerMitigation.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Process risks */}
      {data.processRisks.length > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-navy-900">Process Risks</h3>
          </div>
          <ul className="space-y-1.5">
            {data.processRisks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-300" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Design rationale */}
      {data.designRationale && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-2 text-sm font-semibold text-navy-900">Design Rationale</h3>
          <p className="text-xs leading-relaxed text-navy-600">{data.designRationale}</p>
        </div>
      )}

      {/* Implementation monitoring */}
      {data.implementationMonitoring && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-navy-900">Implementation & Monitoring Framework</h3>
          </div>
          <p className="text-xs leading-relaxed text-navy-600">{data.implementationMonitoring}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MediationDesignPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<MediationDesign | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('mediation_design');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const situationId = isDemo ? 'demo' : situation?.id;
    if (situationId) {
      recordActivity({ tool: 'Mediation Design', href: '/mediation-design', situationId });
    }
  }, [isDemo, situation?.id]);

  if (isDemo) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Mediation Process Designer</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            Process architecture, phased roadmap, and CBM sequencing — Nordalia Crisis (Demo)
          </p>
        </div>
        <MediationDesignContent data={DEMO_DATA} />
      </div>
    );
  }

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/mediation-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Mediation Process Designer</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `Process architecture, phased roadmap, and CBM sequencing — ${situation.name}`
              : 'Design mediation process architecture, phase sequencing, and confidence-building measures'}
          </p>
        </div>
        {firestoreLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400 mt-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : hasData ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50 shrink-0"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 shrink-0"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>

      <RegistryToolInfo toolId="mediation-design" />
      <AiPopulate
        toolId="mediation-design"
        toolName="Mediation Process Design"
        apiEndpoint="/api/ai/mediation-design"
        creditCost={3}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as MediationDesign)}
      >
        {data ? <MediationDesignContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
