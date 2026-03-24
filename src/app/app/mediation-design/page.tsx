'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { AiPopulate } from '@/components/praxis/ai-populate';

import { useState, useEffect } from 'react';
import {
  Handshake, ChevronDown, ChevronUp, CheckCircle2, Clock,
  MapPin, Users, AlertTriangle, Flag,
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

      {/* Phase roadmap */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">Process Roadmap</h2>
        <div className="space-y-3">
          {data.phases.map((phase, i) => (
            <PhaseCard key={phase.id} phase={phase} index={i} />
          ))}
        </div>
      </div>

      {/* CBMs */}
      {data.cbms.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">
            Confidence-Building Measures
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

  return (
    <div className="space-y-6">
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

      <AiPopulate
        toolId="mediation-design"
        toolName="Mediation Process Design"
        apiEndpoint="/api/ai/mediation-design"
        creditCost={3}
        hasExistingData={!!data}
        onDataGenerated={(raw) => setData(raw as MediationDesign)}
      >
        {data ? <MediationDesignContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
