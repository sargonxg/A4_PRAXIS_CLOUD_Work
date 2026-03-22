'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useCallback } from 'react';
import {
  Scale,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  Shield,
  AlertTriangle,
  MessageSquare,
  ArrowRightLeft,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

// ─── Demo Data ────────────────────────────────────────────────────────────────

const NORDALIA_PARTIES = [
  {
    id: 'gov',
    name: 'Government of Nordalia',
    shortName: 'GOV',
    color: '#1A2332',
    position: 'Full restoration of constitutional order; DRM disarmament before any political talks',
    interests: 'Political survival, territorial integrity, international legitimacy',
    needs: 'Continued hold on power apparatus; security guarantees for ruling coalition',
    constraints: [
      'Cannot be seen as weak domestically',
      'Election results are non-negotiable',
      'Cabinet hardliners oppose concessions',
      'Foreign debt obligations limit fiscal space',
    ],
    leverage: 'Controls state institutions, international recognition, UN Security Council relationships',
    batnaStrength: 'moderate' as const,
    batna: 'Military campaign to reassert control, accepting prolonged conflict and isolation',
  },
  {
    id: 'drm',
    name: 'Democratic Reform Movement (DRM)',
    shortName: 'DRM',
    color: '#A63D40',
    position: 'New elections under international supervision; transitional power-sharing arrangement',
    interests: 'Political representation, accountability for electoral fraud, protection for supporters',
    needs: 'Credible path to political participation; security guarantees for leadership',
    constraints: [
      'Armed wing has its own dynamics',
      'Cannot agree to disarmament without political wins',
      'Diaspora funding contingent on electoral demands',
      'Internal factional disagreements on timelines',
    ],
    leverage: 'Military capacity, popular legitimacy in several provinces, diaspora support',
    batnaStrength: 'weak' as const,
    batna: 'Prolonged insurgency with risk of fragmentation of movement',
  },
  {
    id: 'unmn',
    name: 'UN Mission in Nordalia (UNMN)',
    shortName: 'UNMN',
    color: '#4B92DB',
    position: 'Implementation of Framework Agreement; phased approach to electoral reform',
    interests: 'Mandate implementation, host country cooperation, troop contributor satisfaction',
    needs: 'Access to conflict zones; government cooperation for mission activities',
    constraints: [
      'UNSC mandate limits scope of action',
      'Neutrality requirements constrain public positioning',
      'P5 political dynamics in Security Council',
      'Troop contributor nations have own interests',
    ],
    leverage: 'UNSC authority, international legitimacy, humanitarian coordination',
    batnaStrength: 'strong' as const,
    batna: 'Report to Security Council and recommend mandate modification',
  },
];

const ISSUES = [
  { id: 'elections', title: 'Electoral Reform', govRange: [20, 35] as [number, number], drmRange: [60, 90] as [number, number], zopa: false },
  { id: 'ceasefire', title: 'Permanent Ceasefire', govRange: [50, 80] as [number, number], drmRange: [40, 75] as [number, number], zopa: true },
  { id: 'power', title: 'Power Sharing', govRange: [10, 30] as [number, number], drmRange: [50, 90] as [number, number], zopa: false },
  { id: 'amnesty', title: 'Amnesty Arrangements', govRange: [30, 60] as [number, number], drmRange: [40, 70] as [number, number], zopa: true },
];

const CONCESSIONS = [
  {
    concession: 'International election monitoring with limited scope',
    costToGov: 'Medium',
    valueToDRM: 'High',
    feasibility: 'High',
    notes: 'Could satisfy DRM transparency demands while limiting external interference narrative',
  },
  {
    concession: 'Conditional amnesty for non-violent DRM members',
    costToGov: 'Low',
    valueToDRM: 'High',
    feasibility: 'High',
    notes: 'Splits moderate from hardline DRM factions; low domestic political cost',
  },
  {
    concession: 'DRM participation in transitional commission (advisory role)',
    costToGov: 'Medium',
    valueToDRM: 'Medium',
    feasibility: 'Medium',
    notes: 'Provides DRM legitimacy without threatening current power structure',
  },
  {
    concession: 'Phased disarmament tied to political benchmarks',
    costToGov: 'Low',
    valueToDRM: 'High',
    feasibility: 'Medium',
    notes: 'Gives DRM security while achieving government\'s primary demand',
  },
  {
    concession: 'Provincial autonomy pilot in two eastern districts',
    costToGov: 'High',
    valueToDRM: 'High',
    feasibility: 'Low',
    notes: 'High-value trade but faces strong constitutional and political resistance',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function OnionDiagram({ color, position, interest, need }: {
  color: string;
  position: string;
  interest: string;
  need: string;
}) {
  const [hovered, setHovered] = useState<'position' | 'interest' | 'need' | null>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 180, height: 180 }}>
        <svg viewBox="0 0 180 180" width="180" height="180">
          {/* Outer ring - Position */}
          <circle
            cx="90" cy="90" r="85"
            fill={`${color}18`}
            stroke={color}
            strokeWidth="1.5"
            strokeOpacity="0.3"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            fillOpacity={hovered === 'position' ? 0.35 : 0.18}
            onMouseEnter={() => setHovered('position')}
            onMouseLeave={() => setHovered(null)}
          />
          {/* Middle ring - Interest */}
          <circle
            cx="90" cy="90" r="57"
            fill={`${color}28`}
            stroke={color}
            strokeWidth="1.5"
            strokeOpacity="0.45"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            fillOpacity={hovered === 'interest' ? 0.5 : 0.28}
            onMouseEnter={() => setHovered('interest')}
            onMouseLeave={() => setHovered(null)}
          />
          {/* Inner circle - Need */}
          <circle
            cx="90" cy="90" r="30"
            fill={color}
            fillOpacity={hovered === 'need' ? 0.85 : 0.65}
            stroke={color}
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={() => setHovered('need')}
            onMouseLeave={() => setHovered(null)}
          />
          {/* Labels */}
          <text x="90" y="18" textAnchor="middle" fontSize="9" fontWeight="600" fill={color} fillOpacity="0.7">POSITION</text>
          <text x="90" y="58" textAnchor="middle" fontSize="8" fontWeight="600" fill={color}>INTEREST</text>
          <text x="90" y="88" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">NEED</text>
          <text x="90" y="100" textAnchor="middle" fontSize="7" fill="white" fillOpacity="0.85">(core)</text>
        </svg>
      </div>

      {/* Tooltip info */}
      <div className="w-full rounded-lg bg-[var(--color-app-surface-alt)] p-3 text-xs text-navy-600 leading-relaxed min-h-[52px] transition-all">
        {hovered === 'position' && <><span className="font-semibold" style={{ color }}>Position:</span> {position}</>}
        {hovered === 'interest' && <><span className="font-semibold" style={{ color }}>Interest:</span> {interest}</>}
        {hovered === 'need' && <><span className="font-semibold" style={{ color }}>Need:</span> {need}</>}
        {!hovered && <span className="text-navy-400 italic">Hover over a ring to explore position, interest, and need</span>}
      </div>
    </div>
  );
}

function BatnaStrengthBadge({ strength }: { strength: 'strong' | 'moderate' | 'weak' }) {
  const config = {
    strong: { label: 'Strong BATNA', className: 'bg-sage/15 text-sage-700 border-sage/25' },
    moderate: { label: 'Moderate BATNA', className: 'bg-gold-500/15 text-gold-700 border-gold-500/25' },
    weak: { label: 'Weak BATNA', className: 'bg-crimson/10 text-crimson border-crimson/20' },
  };
  const { label, className } = config[strength];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', className)}>
      {label}
    </span>
  );
}

function FeasibilityBadge({ value }: { value: string }) {
  const className =
    value === 'High' ? 'bg-sage/15 text-sage-700' :
    value === 'Medium' ? 'bg-gold-500/15 text-gold-700' :
    'bg-crimson/10 text-crimson';
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', className)}>
      {value}
    </span>
  );
}

function CostValueBadge({ value }: { value: string }) {
  const className =
    value === 'Low' ? 'bg-sage/15 text-sage-700' :
    value === 'Medium' ? 'bg-gold-500/15 text-gold-700' :
    'bg-crimson/10 text-crimson';
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', className)}>
      {value}
    </span>
  );
}

function ZopaBar({ issue }: { issue: typeof ISSUES[0] }) {
  const { title, govRange, drmRange, zopa } = issue;

  // Calculate overlap
  const overlapStart = Math.max(govRange[0], drmRange[0]);
  const overlapEnd = Math.min(govRange[1], drmRange[1]);
  const hasZopa = overlapEnd > overlapStart;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-navy-800">{title}</span>
        {hasZopa ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sage-700 border border-sage/20">
            ZOPA: {overlapStart}–{overlapEnd}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-crimson/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-crimson border border-crimson/20">
            No Deal Zone
          </span>
        )}
      </div>

      {/* Gov bar */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-[10px] font-semibold text-navy-500">GOV</span>
          <div className="relative h-6 flex-1 rounded-md bg-navy-50 overflow-hidden">
            <div
              className="absolute inset-y-0 rounded-md"
              style={{
                left: `${govRange[0]}%`,
                width: `${govRange[1] - govRange[0]}%`,
                backgroundColor: '#1A2332',
                opacity: 0.75,
              }}
            />
            {hasZopa && (
              <div
                className="absolute inset-y-0 rounded-sm"
                style={{
                  left: `${overlapStart}%`,
                  width: `${overlapEnd - overlapStart}%`,
                  backgroundColor: '#5B8C5A',
                  opacity: 0.9,
                }}
              />
            )}
            <div className="absolute inset-y-0 flex items-center" style={{ left: `${govRange[0]}%`, marginLeft: 2 }}>
              <span className="text-[9px] font-bold text-white">{govRange[0]}</span>
            </div>
            <div className="absolute inset-y-0 flex items-center" style={{ right: `${100 - govRange[1]}%`, marginRight: 2 }}>
              <span className="text-[9px] font-bold text-white">{govRange[1]}</span>
            </div>
          </div>
        </div>

        {/* DRM bar */}
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-[10px] font-semibold text-crimson">DRM</span>
          <div className="relative h-6 flex-1 rounded-md bg-crimson/5 overflow-hidden">
            <div
              className="absolute inset-y-0 rounded-md"
              style={{
                left: `${drmRange[0]}%`,
                width: `${drmRange[1] - drmRange[0]}%`,
                backgroundColor: '#A63D40',
                opacity: 0.75,
              }}
            />
            {hasZopa && (
              <div
                className="absolute inset-y-0 rounded-sm"
                style={{
                  left: `${overlapStart}%`,
                  width: `${overlapEnd - overlapStart}%`,
                  backgroundColor: '#5B8C5A',
                  opacity: 0.9,
                }}
              />
            )}
            <div className="absolute inset-y-0 flex items-center" style={{ left: `${drmRange[0]}%`, marginLeft: 2 }}>
              <span className="text-[9px] font-bold text-white">{drmRange[0]}</span>
            </div>
            <div className="absolute inset-y-0 flex items-center" style={{ right: `${100 - drmRange[1]}%`, marginRight: 2 }}>
              <span className="text-[9px] font-bold text-white">{drmRange[1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gap/ZOPA annotation */}
      <div className="pl-14">
        {hasZopa ? (
          <p className="text-[10px] text-sage-700 font-medium">
            Overlap zone: points {overlapStart}–{overlapEnd} — {overlapEnd - overlapStart} point ZOPA
          </p>
        ) : (
          <p className="text-[10px] text-crimson font-medium">
            Gap: {overlapStart - overlapEnd} points between party positions — bridging package required
          </p>
        )}
      </div>
    </div>
  );
}

// ─── AI Streaming Hook ────────────────────────────────────────────────────────

async function streamAI(
  prompt: string,
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  });
  if (!response.ok || !response.body) throw new Error('Stream failed');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split('\n')) {
      const parsed = parseDataStreamChunk(line);
      if (parsed) {
        text += parsed;
        onChunk(text);
      }
    }
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ActiveSection = 'parties' | 'zopa' | 'batna' | 'concessions' | 'talking-points';

export default function NegotiationPrepPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const [activeSection, setActiveSection] = useState<ActiveSection>('parties');
  const [expandedParty, setExpandedParty] = useState<string | null>(null);
  const [partyAnalysis, setPartyAnalysis] = useState<Record<string, string>>({});
  const [loadingParty, setLoadingParty] = useState<string | null>(null);
  const [tradesAnalysis, setTradesAnalysis] = useState('');
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [talkingPoint, setTalkingPoint] = useState<'opening' | 'response' | 'closing' | null>(null);
  const [talkingPointText, setTalkingPointText] = useState('');
  const [loadingTalkingPoint, setLoadingTalkingPoint] = useState(false);

  const analyzeParty = useCallback(async (partyId: string) => {
    if (loadingParty) return;
    const party = NORDALIA_PARTIES.find(p => p.id === partyId);
    if (!party) return;
    setLoadingParty(partyId);
    setPartyAnalysis(prev => ({ ...prev, [partyId]: '' }));
    try {
      const prompt = `Analyze ${party.name}'s negotiation position in the Nordalia conflict. Based on this data:
Position: ${party.position}
Interests: ${party.interests}
Needs: ${party.needs}
Constraints: ${party.constraints.join('; ')}
Leverage: ${party.leverage}
BATNA: ${party.batna} (Strength: ${party.batnaStrength})

Generate a structured analysis covering:
## 1. Negotiation Style Prediction
Assess their likely approach at the table — positional vs. principled, aggressive vs. accommodating, time pressure sensitivity.

## 2. Likely Red Lines
What concessions would cause them to walk away? What is non-negotiable under any circumstances?

## 3. Potential Flexibility Areas
Where might they show movement if the right incentives or framing is offered?

## 4. Historical Behavior Patterns
How have similar actors in similar conflicts behaved historically? What precedents apply?

## 5. Strategic Recommendations
What approach should the mediator take with this party specifically?

Be analytically rigorous and diplomatically precise. Focus on actionable insights for the negotiating team.`;

      await streamAI(prompt, (text) => {
        setPartyAnalysis(prev => ({ ...prev, [partyId]: text }));
      });
    } catch {
      setPartyAnalysis(prev => ({ ...prev, [partyId]: 'Analysis unavailable. Please try again.' }));
    } finally {
      setLoadingParty(null);
    }
  }, [loadingParty]);

  const analyzeTrades = useCallback(async () => {
    if (loadingTrades) return;
    setLoadingTrades(true);
    setTradesAnalysis('');
    try {
      const prompt = `Analyze the following concession matrix for the Nordalia peace negotiations between the Government and DRM, facilitated by UNMN.

Possible concessions:
${CONCESSIONS.map(c => `- ${c.concession}: Cost to Gov (${c.costToGov}), Value to DRM (${c.valueToDRM}), Feasibility (${c.feasibility}). Note: ${c.notes}`).join('\n')}

Generate:
## High-Value, Low-Cost Package
Identify 2-3 concessions that maximize DRM value at minimum political cost to government. Explain the logic.

## Linkage Opportunities
Which concessions can be packaged together for mutual gains? Identify linkage trades across issues.

## Sequencing Strategy
In what order should concessions be offered to build momentum and trust? What should be held back?

## Spoiler Risks
Which concessions might trigger spoiler behavior from hardliners on either side?

## Recommended Opening Package
Draft a specific opening package the government could offer without revealing its full flexibility.

Be specific, strategic, and operationally focused.`;

      await streamAI(prompt, setTradesAnalysis);
    } catch {
      setTradesAnalysis('Analysis unavailable. Please try again.');
    } finally {
      setLoadingTrades(false);
    }
  }, [loadingTrades]);

  const generateTalkingPoint = useCallback(async (type: 'opening' | 'response' | 'closing') => {
    if (loadingTalkingPoint) return;
    setLoadingTalkingPoint(true);
    setTalkingPoint(type);
    setTalkingPointText('');

    const contextSummary = `
Conflict: Nordalia Peace Process — Government ↔ DRM Bilateral Talks
Facilitated by: UN Mission in Nordalia (UNMN)
Government position: ${NORDALIA_PARTIES[0].position}
DRM position: ${NORDALIA_PARTIES[1].position}
ZOPA issues: Permanent Ceasefire (50-75%), Amnesty Arrangements (40-60%)
No deal zone issues: Electoral Reform, Power Sharing
`;

    const prompts = {
      opening: `You are the chief mediator preparing an opening statement for the Nordalia bilateral peace talks between the Government and DRM.

Context:
${contextSummary}

Draft a formal opening statement (600-800 words) that:
1. Establishes the gravity and opportunity of the moment
2. Acknowledges both parties' legitimate concerns without taking sides
3. Frames the talks around shared interests (security, stability, prosperity)
4. Sets clear procedural ground rules and expectations
5. Invokes relevant UN Security Council resolutions and international law
6. Ends with a call to courageous compromise

Use diplomatic register appropriate for a UN-facilitated process. Avoid language that favors either party.`,

      response: `You are advising the Government of Nordalia delegation. The DRM has just presented their opening position calling for immediate new elections under international supervision and a transitional power-sharing arrangement before any disarmament discussions.

Context:
${contextSummary}
DRM position: ${NORDALIA_PARTIES[1].position}

Draft a government response (500-700 words) that:
1. Acknowledges the DRM's concerns respectfully without conceding their framing
2. Reaffirms the constitutional order while signaling openness to reform
3. Introduces the government's sequencing preference (security first, then political reform)
4. Proposes a technical working group on electoral processes as a face-saving bridge
5. Avoids inflammatory language while remaining firm on core positions
6. Leaves door open for further engagement

Strike the tone of a party committed to peace but unwilling to reward armed coercion.`,

      closing: `You are the chief mediator preparing closing language for the first round of the Nordalia bilateral talks. The session has produced agreement on a ceasefire monitoring mechanism but no breakthrough on political issues.

Context:
${contextSummary}
Areas of progress: Agreement in principle on ceasefire monitoring; shared commitment to civilian protection
Areas of continued divergence: Electoral reform timing, power-sharing arrangements, disarmament sequencing

Draft formal closing language (400-500 words) that:
1. Credits both parties for their engagement and flexibility shown
2. Accurately characterizes areas of agreement without overstating progress
3. Frames disagreements as problems to be solved rather than incompatible positions
4. Proposes specific next steps: technical committees, timeline for next round, confidence-building measures
5. Maintains political momentum while managing expectations publicly

Use the precise diplomatic language appropriate for a joint communiqué or closing press statement.`,
    };

    try {
      await streamAI(prompts[type], setTalkingPointText);
    } catch {
      setTalkingPointText('Generation failed. Please try again.');
    } finally {
      setLoadingTalkingPoint(false);
    }
  }, [loadingTalkingPoint]);

  const sections: { id: ActiveSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'parties', label: 'Party Analysis', icon: Users },
    { id: 'zopa', label: 'ZOPA Visualizer', icon: ArrowRightLeft },
    { id: 'batna', label: 'BATNA Assessment', icon: Shield },
    { id: 'concessions', label: 'Concession Matrix', icon: TrendingUp },
    { id: 'talking-points', label: 'Talking Points', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <Scale className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-navy-900">Negotiation Preparation Module</h1>
              <span className="inline-flex items-center rounded-full bg-crimson/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-crimson border border-crimson/15">
                NEW
              </span>
            </div>
            <p className="text-sm text-navy-500">
              Nordalia Peace Process — Government ↔ DRM Bilateral Talks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div className="rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Format</p>
            <p className="text-sm font-semibold text-navy-800">Bilateral</p>
          </div>
          <div className="rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Parties</p>
            <p className="text-sm font-semibold text-navy-800">3 actors</p>
          </div>
          <div className="rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">ZOPA Found</p>
            <p className="text-sm font-semibold text-sage-700">2 of 4</p>
          </div>
        </div>
      </div>

      {/* ── Section Nav ───────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-[var(--color-app-border)] bg-white p-1.5 overflow-x-auto">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all',
              activeSection === id
                ? 'bg-diplomatic-blue text-white shadow-sm'
                : 'text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: Party Analysis
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'parties' && (
        <div className="space-y-5">
          <p className="text-sm text-navy-500">
            Click each party card to explore their onion diagram and generate AI-powered negotiation behavior analysis.
          </p>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {NORDALIA_PARTIES.map((party) => (
              <div
                key={party.id}
                className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden"
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ backgroundColor: `${party.color}10`, borderBottom: `2px solid ${party.color}30` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: party.color }}
                    >
                      {party.shortName.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-navy-900">{party.name}</h3>
                      <BatnaStrengthBadge strength={party.batnaStrength} />
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedParty(expandedParty === party.id ? null : party.id)}
                    className="rounded-lg p-1.5 text-navy-400 hover:bg-white/60 transition-colors"
                  >
                    {expandedParty === party.id
                      ? <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />
                    }
                  </button>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-5">
                  {/* Onion diagram */}
                  <OnionDiagram
                    color={party.color}
                    position={party.position}
                    interest={party.interests}
                    need={party.needs}
                  />

                  {/* Text fields */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Stated Position</p>
                      <p className="text-xs text-navy-700 leading-relaxed">{party.position}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Underlying Interests</p>
                      <p className="text-xs text-navy-700 leading-relaxed">{party.interests}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Core Needs</p>
                      <p className="text-xs text-navy-700 leading-relaxed">{party.needs}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Constraints</p>
                      <ul className="space-y-1">
                        {party.constraints.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-navy-600">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: party.color }} />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Leverage</p>
                      <p className="text-xs text-navy-700 leading-relaxed">{party.leverage}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-app-surface-alt)] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">BATNA</p>
                      <p className="text-xs text-navy-600 italic leading-relaxed">{party.batna}</p>
                    </div>
                  </div>

                  {/* AI Analyze button */}
                  <button
                    onClick={() => analyzeParty(party.id)}
                    disabled={loadingParty === party.id}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all',
                      loadingParty === party.id
                        ? 'border-diplomatic-blue/20 bg-diplomatic-blue/5 text-diplomatic-blue opacity-70 cursor-not-allowed'
                        : 'border-diplomatic-blue/20 bg-diplomatic-blue/5 text-diplomatic-blue hover:bg-diplomatic-blue/10'
                    )}
                  >
                    {loadingParty === party.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Sparkles className="h-3.5 w-3.5" />
                    }
                    {partyAnalysis[party.id] ? 'Refresh AI Analysis' : 'AI Analyze Party'}
                  </button>

                  {/* AI Analysis output */}
                  {partyAnalysis[party.id] && (
                    <div className="rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/4 p-4">
                      <div className="flex items-center gap-1.5 mb-3">
                        <Sparkles className="h-3.5 w-3.5 text-diplomatic-blue" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">PRAXIS Analysis</p>
                        {loadingParty === party.id && (
                          <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-diplomatic-blue" />
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none text-xs">
                        <MarkdownRenderer content={partyAnalysis[party.id]} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2: ZOPA Visualizer
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'zopa' && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-navy-900">Zone of Possible Agreement (ZOPA)</h2>
              <p className="text-xs text-navy-500 mt-0.5">
                Each bar represents a party&apos;s acceptable range (0–100 scale). Overlapping zones indicate ZOPA. Sage = overlap, Navy = Gov range, Crimson = DRM range.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-navy-500">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded-sm bg-navy-800/75" />
                <span>Gov range</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded-sm bg-crimson/75" />
                <span>DRM range</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#5B8C5A' }} />
                <span>ZOPA</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {ISSUES.map((issue) => (
              <div key={issue.id} className="rounded-lg border border-[var(--color-app-border)] p-4">
                <ZopaBar issue={issue} />
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-gold-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-navy-800 mb-1">Mediator Note</p>
                <p className="text-xs text-navy-600 leading-relaxed">
                  Two of four issues show no natural ZOPA. Electoral Reform and Power Sharing have a combined gap of 25–30 points.
                  A bridging mechanism — such as a technical committee with international benchmarks — may be needed to create the
                  conditions for agreement on these issues. Consider packaging with ceasefire progress to build momentum.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: BATNA Assessment
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'batna' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
            <div className="border-b border-[var(--color-app-border)] px-6 py-4">
              <h2 className="text-base font-semibold text-navy-900">BATNA Assessment</h2>
              <p className="text-xs text-navy-500 mt-0.5">
                Best Alternative to Negotiated Agreement — assesses each party&apos;s walkaway point and negotiating power
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400 w-40">Party</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400">BATNA</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400 w-36">Strength</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400 w-48">Walkaway Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {NORDALIA_PARTIES.map((party, i) => {
                    const walkawayCosts: Record<string, string> = {
                      gov: 'Medium — Prolonged conflict; international sanctions risk; economic deterioration',
                      drm: 'Very High — Movement fragmentation; loss of diaspora support; military attrition',
                      unmn: 'Low — Mandate continues regardless; UNSC reporting is routine option',
                    };
                    return (
                      <tr
                        key={party.id}
                        className={cn('border-b border-[var(--color-app-border)] last:border-0', i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-app-surface-alt)]/50')}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: party.color }} />
                            <span className="text-sm font-semibold text-navy-800">{party.shortName}</span>
                          </div>
                          <p className="text-[10px] text-navy-500 mt-0.5">{party.name.split('(')[0].trim()}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-navy-700 leading-relaxed max-w-sm">{party.batna}</p>
                        </td>
                        <td className="px-5 py-4">
                          <BatnaStrengthBadge strength={party.batnaStrength} />
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-navy-600 leading-relaxed">{walkawayCosts[party.id]}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: 'Negotiating Power Imbalance',
                content: 'The Government holds a stronger overall BATNA than the DRM. The UNMN\'s near-zero walkaway cost gives it maximum flexibility as a mediator. This asymmetry should inform concession sequencing.',
                icon: Target,
                color: 'diplomatic-blue',
              },
              {
                title: 'DRM Vulnerability Window',
                content: 'DRM\'s weak BATNA creates a limited window for a deal before internal fragmentation reduces its capacity to deliver. Time pressure favors government, but overplaying could collapse the movement and enable spoilers.',
                icon: AlertTriangle,
                color: 'gold',
              },
              {
                title: 'Mediator Leverage',
                content: 'UNMN\'s strong BATNA paradoxically increases its leverage — it can credibly threaten to escalate to the UNSC without reputational cost, making its mediation role more coercive than traditional facilitation.',
                icon: Shield,
                color: 'sage',
              },
            ].map(({ title, content, icon: Icon, color }) => (
              <div key={title} className={cn('rounded-xl border p-4',
                color === 'diplomatic-blue' ? 'border-diplomatic-blue/15 bg-diplomatic-blue/4' :
                color === 'gold' ? 'border-gold-500/20 bg-gold-500/5' :
                'border-sage/20 bg-sage/5'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('h-4 w-4',
                    color === 'diplomatic-blue' ? 'text-diplomatic-blue' :
                    color === 'gold' ? 'text-gold-600' :
                    'text-sage-700'
                  )} />
                  <p className="text-xs font-semibold text-navy-800">{title}</p>
                </div>
                <p className="text-xs text-navy-600 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4: Concession Matrix
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'concessions' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
            <div className="border-b border-[var(--color-app-border)] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Concession Matrix</h2>
                <p className="text-xs text-navy-500 mt-0.5">Possible trades mapped by political cost to Gov vs. value received by DRM</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-navy-400">
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-sage-600" /><span>Low cost</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-gold-600" /><span>Medium</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-crimson" /><span>High cost</span></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400">Possible Concession</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400 w-28">Cost to Gov</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400 w-28">Value to DRM</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400 w-28">Feasibility</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-400">Strategic Note</th>
                  </tr>
                </thead>
                <tbody>
                  {CONCESSIONS.map((row, i) => (
                    <tr
                      key={i}
                      className={cn('border-b border-[var(--color-app-border)] last:border-0 hover:bg-[var(--color-app-surface-alt)]/50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-app-surface-alt)]/30')}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-navy-800">{row.concession}</p>
                      </td>
                      <td className="px-5 py-4"><CostValueBadge value={row.costToGov} /></td>
                      <td className="px-5 py-4"><CostValueBadge value={row.valueToDRM} /></td>
                      <td className="px-5 py-4"><FeasibilityBadge value={row.feasibility} /></td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-navy-500 leading-relaxed">{row.notes}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Suggest Trades */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-diplomatic-blue" />
                <h3 className="text-sm font-semibold text-navy-900">AI Trade Analysis</h3>
              </div>
              <button
                onClick={analyzeTrades}
                disabled={loadingTrades}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-all',
                  loadingTrades
                    ? 'border-diplomatic-blue/20 bg-diplomatic-blue/5 text-diplomatic-blue opacity-70 cursor-not-allowed'
                    : 'border-diplomatic-blue/20 bg-diplomatic-blue/5 text-diplomatic-blue hover:bg-diplomatic-blue/10'
                )}
              >
                {loadingTrades ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {tradesAnalysis ? 'Refresh Analysis' : 'AI Suggest Trades'}
              </button>
            </div>
            {tradesAnalysis ? (
              <div className="prose prose-sm max-w-none text-xs text-navy-700">
                <MarkdownRenderer content={tradesAnalysis} />
                {loadingTrades && <span className="inline-block h-3 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />}
              </div>
            ) : (
              <p className="text-sm text-navy-400 text-center py-8">
                Click &quot;AI Suggest Trades&quot; to generate analysis of high-value, low-cost concession packages and sequencing strategy.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5: Talking Points Generator
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'talking-points' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-navy-500" />
              <h2 className="text-base font-semibold text-navy-900">Talking Points Generator</h2>
            </div>
            <p className="text-xs text-navy-500 mb-6">
              AI-generated diplomatic language for key moments in the negotiation. All outputs use the full Nordalia context.
            </p>

            <div className="flex flex-wrap gap-3">
              {([
                { type: 'opening' as const, label: 'Generate Opening Statement', description: 'Mediator opening statement for bilateral talks' },
                { type: 'response' as const, label: 'Generate Response to DRM Position', description: 'Government delegation counter-position' },
                { type: 'closing' as const, label: 'Generate Closing Language', description: 'End-of-session joint communiqué draft' },
              ]).map(({ type, label, description }) => (
                <button
                  key={type}
                  onClick={() => generateTalkingPoint(type)}
                  disabled={loadingTalkingPoint}
                  className={cn(
                    'flex flex-col items-start rounded-xl border px-5 py-4 text-left transition-all min-w-[200px]',
                    talkingPoint === type && !loadingTalkingPoint
                      ? 'border-diplomatic-blue bg-diplomatic-blue/5'
                      : loadingTalkingPoint && talkingPoint === type
                      ? 'border-diplomatic-blue/30 bg-diplomatic-blue/5 opacity-80 cursor-not-allowed'
                      : 'border-[var(--color-app-border)] bg-white hover:border-diplomatic-blue/30 hover:bg-diplomatic-blue/3'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {loadingTalkingPoint && talkingPoint === type
                      ? <Loader2 className="h-4 w-4 animate-spin text-diplomatic-blue" />
                      : <MessageSquare className="h-4 w-4 text-diplomatic-blue" />
                    }
                    <span className="text-sm font-semibold text-navy-800">{label}</span>
                  </div>
                  <p className="text-[11px] text-navy-500">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Output area */}
          {(talkingPointText || loadingTalkingPoint) && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-diplomatic-blue" />
                <h3 className="text-sm font-semibold text-navy-900">
                  {talkingPoint === 'opening' && 'Opening Statement'}
                  {talkingPoint === 'response' && 'Response to DRM Position'}
                  {talkingPoint === 'closing' && 'Closing Language'}
                </h3>
                {loadingTalkingPoint && (
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-diplomatic-blue font-medium">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating...
                  </span>
                )}
              </div>
              <div className="prose prose-sm max-w-none rounded-lg bg-[var(--color-app-surface-alt)] p-5 text-sm text-navy-700">
                <MarkdownRenderer content={talkingPointText} />
                {loadingTalkingPoint && (
                  <span className="inline-block h-4 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(talkingPointText).catch(() => {});
                  }}
                  className="rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-[var(--color-app-surface-alt)] transition-colors"
                >
                  Copy to clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
