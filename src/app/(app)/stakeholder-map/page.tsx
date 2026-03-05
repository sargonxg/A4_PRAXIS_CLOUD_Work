'use client';

import { useState, useCallback } from 'react';
import { Users, FileUp, Sparkles, Loader2, RefreshCw, Network, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

function parseDataStreamChunk(raw: string): string {
  return raw
    .split('\n')
    .filter((l) => l.startsWith('0:'))
    .map((l) => { try { return JSON.parse(l.slice(2)); } catch { return ''; } })
    .join('');
}

// Interest score (0-10) for the Influence/Interest Matrix
const actorInterest: Record<string, number> = {
  gov: 10, drm: 10, karovia: 8, sertania: 7, cso: 7, unmn: 6, au: 5,
};

interface Actor {
  id: string;
  name: string;
  type: string;
  influence: number;
  color: string;
  x: number;
  y: number;
  interests: string;
  leverage: string;
  keyQuote?: string;
}

interface Relationship {
  from: string;
  to: string;
  type: 'alliance' | 'rivalry' | 'mediation' | 'funding' | 'diplomatic_pressure';
  label: string;
}

const actors: Actor[] = [
  { id: 'gov', name: 'Government of Nordalia', type: 'Government', influence: 9, color: '#4A90A4', x: 50, y: 25, interests: 'Territorial integrity, maintain power, international legitimacy', leverage: 'Military superiority, international recognition, control of capital', keyQuote: '"We will not negotiate under duress. The territorial integrity of Nordalia is non-negotiable."' },
  { id: 'drm', name: 'DRM (Democratic Reform Movement)', type: 'Opposition', influence: 7, color: '#A63D40', x: 20, y: 50, interests: 'Political representation, resource access, regional autonomy', leverage: 'Control of eastern provinces, popular support base, mining revenues', keyQuote: '"The people of the East have been marginalized for too long. Autonomy is our minimum demand."' },
  { id: 'unmn', name: 'UNMN (UN Mission in Nordalia)', type: 'International Org', influence: 6, color: '#4B92DB', x: 80, y: 40, interests: 'Ceasefire maintenance, PoC, political process support', leverage: 'Peacekeeping mandate, reporting to UNSC, mediation capacity' },
  { id: 'karovia', name: 'Republic of Karovia', type: 'Regional Power', influence: 8, color: '#7B6D8D', x: 15, y: 80, interests: 'Regional influence, border security, natural resource access', leverage: 'Military capability, economic ties, intelligence sharing with DRM' },
  { id: 'cso', name: 'Civil Society Coalition', type: 'Civil Society', influence: 4, color: '#5B8C5A', x: 65, y: 75, interests: 'Human rights protection, inclusive dialogue, accountability', leverage: 'Grassroots networks, international media access, moral authority' },
  { id: 'au', name: 'African Union Mediation Team', type: 'International Org', influence: 5, color: '#E8B931', x: 85, y: 70, interests: 'Regional stability, African solutions to African problems', leverage: 'Mediation mandate, continental legitimacy, peace fund' },
  { id: 'sertania', name: 'Sertania (Neighboring State)', type: 'Regional Power', influence: 5, color: '#D4A373', x: 50, y: 85, interests: 'Refugee management, trade corridor stability, counter-DRM', leverage: 'Border control, refugee camps hosting, intelligence cooperation' },
];

const relationships: Relationship[] = [
  { from: 'gov', to: 'drm', type: 'rivalry', label: 'Armed conflict' },
  { from: 'gov', to: 'unmn', type: 'diplomatic_pressure', label: 'Mandate partner' },
  { from: 'drm', to: 'karovia', type: 'alliance', label: 'Military support' },
  { from: 'unmn', to: 'cso', type: 'mediation', label: 'Protection partnership' },
  { from: 'au', to: 'unmn', type: 'mediation', label: 'Joint mediation' },
  { from: 'gov', to: 'sertania', type: 'alliance', label: 'Security cooperation' },
  { from: 'cso', to: 'drm', type: 'diplomatic_pressure', label: 'Dialogue advocacy' },
  { from: 'au', to: 'gov', type: 'mediation', label: 'Peace process facilitation' },
];

const typeColors: Record<string, string> = {
  alliance: '#5B8C5A',
  rivalry: '#A63D40',
  mediation: '#4B92DB',
  funding: '#E8B931',
  diplomatic_pressure: '#7B6D8D',
};

const aiInsights: Record<string, string> = {
  gov: 'The Government appears to be consolidating its position ahead of the October elections. Watch for attempts to reframe the conflict as a counter-terrorism operation to gain international sympathy.',
  drm: 'The DRM\'s shift to controlling mining sites suggests a move toward self-funding operations. This could reduce Karovian leverage but also make diplomatic engagement harder.',
  unmn: 'UNMN force posture is stretched thin. The mandate renewal in March is an opportunity to push for a stronger civilian protection mandate and increased troop ceiling.',
  karovia: 'Intelligence suggests Karovia may be open to reducing support for the DRM in exchange for mining concessions. This could be a key diplomatic lever.',
};

export default function StakeholderMapPage() {
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [view, setView] = useState<'network' | 'matrix'>('network');
  const [liveInsights, setLiveInsights] = useState<Record<string, string>>({});
  const [loadingInsightId, setLoadingInsightId] = useState<string | null>(null);

  const generateInsight = useCallback(async (actor: Actor) => {
    if (loadingInsightId) return;
    setLoadingInsightId(actor.id);
    setLiveInsights((prev) => ({ ...prev, [actor.id]: '' }));

    try {
      const actorRelationships = relationships
        .filter((r) => r.from === actor.id || r.to === actor.id)
        .map((r) => {
          const other = actors.find((a) => a.id === (r.from === actor.id ? r.to : r.from));
          return `${r.type.replace('_', ' ')} with ${other?.name} (${r.label})`;
        });

      const prompt = `Provide a strategic intelligence analysis of this conflict actor in the Nordalia crisis:

Actor: ${actor.name}
Type: ${actor.type}
Influence Level: ${actor.influence}/10
Core Interests: ${actor.interests}
Key Leverage Points: ${actor.leverage}
${actor.keyQuote ? `Known position: ${actor.keyQuote}` : ''}
Relationships: ${actorRelationships.join('; ')}

Provide:
1. **Strategic Assessment** — current posture and likely next moves
2. **Negotiating Position** — red lines, flexibility, and entry points
3. **Influence Pathways** — how best to engage or influence this actor
4. **Risk Factors** — potential spoiler behavior or destabilizing actions
5. **Diplomatic Opportunities** — actionable leverage points for peacemakers

Be concise, analytically rigorous, and diplomatically precise.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setLiveInsights((prev) => ({ ...prev, [actor.id]: accumulated }));
      }
    } catch {
      setLiveInsights((prev) => ({
        ...prev,
        [actor.id]: aiInsights[actor.id] ?? `${actor.name} is a ${actor.type} with influence level ${actor.influence}/10. Key interests: ${actor.interests}.`,
      }));
    } finally {
      setLoadingInsightId(null);
    }
  }, [loadingInsightId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-steel/8">
            <Users className="h-5 w-5 text-steel" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Stakeholder Mapper</h1>
            <p className="text-sm text-navy-500">
              Visual network analysis of actors, alliances, and influence pathways with AI-powered insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--color-app-border)] bg-white p-1">
            <button
              onClick={() => setView('network')}
              className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', view === 'network' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-700')}
            >
              <Network className="h-3.5 w-3.5" />
              Network
            </button>
            <button
              onClick={() => setView('matrix')}
              className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', view === 'matrix' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-700')}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Matrix
            </button>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-sm text-navy-600 hover:bg-[var(--color-app-surface-alt)] transition-colors">
            <FileUp className="h-4 w-4" />
            Auto-populate
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Graph / Matrix area */}
        <div className="flex-1 rounded-xl border border-[var(--color-app-border)] bg-white p-2 overflow-hidden">
          {view === 'matrix' && (
            <div className="p-4 h-[550px] flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-4">Influence / Interest Matrix — click an actor to view profile</p>
              <div className="flex flex-1 gap-0">
                {/* Y axis label */}
                <div className="flex items-center justify-center w-6 shrink-0">
                  <p className="text-[9px] text-navy-400 font-medium rotate-[-90deg] whitespace-nowrap">Influence →</p>
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-1 gap-0">
                    {/* Top-left: Keep Satisfied */}
                    <div className="flex-1 rounded-tl-lg border border-[var(--color-app-border)] bg-blue-50/30 p-3 relative">
                      <p className="text-[9px] font-semibold text-diplomatic-blue/60 mb-2">KEEP SATISFIED</p>
                      {actors.filter((a) => a.influence >= 5 && (actorInterest[a.id] ?? 5) < 7).map((a) => (
                        <button key={a.id} onClick={() => setSelectedActor(selectedActor?.id === a.id ? null : a)}
                          className="mb-1.5 flex items-center gap-1.5 rounded-md bg-white border border-[var(--color-app-border)] px-2 py-1 text-[10px] font-medium text-navy-700 hover:border-diplomatic-blue/30 transition-colors w-full text-left">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                          {a.name.split(' ').slice(0, 2).join(' ')}
                        </button>
                      ))}
                    </div>
                    {/* Top-right: Key Players */}
                    <div className="flex-1 rounded-tr-lg border border-[var(--color-app-border)] border-l-0 bg-crimson/4 p-3 relative">
                      <p className="text-[9px] font-semibold text-crimson/60 mb-2">KEY PLAYERS</p>
                      {actors.filter((a) => a.influence >= 5 && (actorInterest[a.id] ?? 5) >= 7).map((a) => (
                        <button key={a.id} onClick={() => setSelectedActor(selectedActor?.id === a.id ? null : a)}
                          className="mb-1.5 flex items-center gap-1.5 rounded-md bg-white border border-[var(--color-app-border)] px-2 py-1 text-[10px] font-medium text-navy-700 hover:border-crimson/30 transition-colors w-full text-left">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                          {a.name.split(' ').slice(0, 2).join(' ')}
                          <span className="ml-auto text-[9px] text-crimson font-semibold">{a.influence}/10</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 gap-0">
                    {/* Bottom-left: Monitor */}
                    <div className="flex-1 rounded-bl-lg border border-[var(--color-app-border)] border-t-0 bg-[var(--color-app-surface-alt)] p-3 relative">
                      <p className="text-[9px] font-semibold text-navy-400 mb-2">MONITOR</p>
                      {actors.filter((a) => a.influence < 5 && (actorInterest[a.id] ?? 5) < 7).map((a) => (
                        <button key={a.id} onClick={() => setSelectedActor(selectedActor?.id === a.id ? null : a)}
                          className="mb-1.5 flex items-center gap-1.5 rounded-md bg-white border border-[var(--color-app-border)] px-2 py-1 text-[10px] font-medium text-navy-700 w-full text-left">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                          {a.name.split(' ').slice(0, 2).join(' ')}
                        </button>
                      ))}
                    </div>
                    {/* Bottom-right: Keep Informed */}
                    <div className="flex-1 rounded-br-lg border border-[var(--color-app-border)] border-t-0 border-l-0 bg-gold-500/4 p-3 relative">
                      <p className="text-[9px] font-semibold text-gold-600/70 mb-2">KEEP INFORMED</p>
                      {actors.filter((a) => a.influence < 5 && (actorInterest[a.id] ?? 5) >= 7).map((a) => (
                        <button key={a.id} onClick={() => setSelectedActor(selectedActor?.id === a.id ? null : a)}
                          className="mb-1.5 flex items-center gap-1.5 rounded-md bg-white border border-[var(--color-app-border)] px-2 py-1 text-[10px] font-medium text-navy-700 w-full text-left">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                          {a.name.split(' ').slice(0, 2).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* X axis label */}
                  <p className="text-center text-[9px] text-navy-400 font-medium mt-2">← Interest →</p>
                </div>
              </div>
            </div>
          )}
          {view === 'network' && (
          <>
          <svg viewBox="0 0 100 100" className="h-[500px] w-full" style={{ background: 'linear-gradient(135deg, #FAFBFD 0%, #F5F7FA 100%)' }}>
            {/* Grid pattern */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E2E8F0" strokeWidth="0.1" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Relationships */}
            {relationships.map((rel, i) => {
              const fromActor = actors.find((a) => a.id === rel.from)!;
              const toActor = actors.find((a) => a.id === rel.to)!;
              return (
                <g key={i}>
                  <line
                    x1={fromActor.x}
                    y1={fromActor.y}
                    x2={toActor.x}
                    y2={toActor.y}
                    stroke={typeColors[rel.type]}
                    strokeWidth={0.4}
                    strokeOpacity={0.4}
                    strokeDasharray={rel.type === 'rivalry' ? '1,1' : undefined}
                  />
                  <text
                    x={(fromActor.x + toActor.x) / 2}
                    y={(fromActor.y + toActor.y) / 2 - 1}
                    textAnchor="middle"
                    fill={typeColors[rel.type]}
                    fontSize="1.8"
                    opacity={0.7}
                    fontWeight="500"
                  >
                    {rel.label}
                  </text>
                </g>
              );
            })}

            {/* Actors */}
            {actors.map((actor) => {
              const r = 1.5 + actor.influence * 0.4;
              const isSelected = selectedActor?.id === actor.id;
              return (
                <g
                  key={actor.id}
                  onClick={() => setSelectedActor(isSelected ? null : actor)}
                  style={{ cursor: 'pointer' }}
                >
                  {isSelected && (
                    <circle cx={actor.x} cy={actor.y} r={r + 2} fill="none" stroke={actor.color} strokeWidth={0.3} strokeOpacity={0.4}>
                      <animate attributeName="r" values={`${r + 1};${r + 3};${r + 1}`} dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={actor.x}
                    cy={actor.y}
                    r={r}
                    fill={actor.color}
                    fillOpacity={isSelected ? 0.2 : 0.1}
                    stroke={actor.color}
                    strokeWidth={isSelected ? 0.6 : 0.3}
                  />
                  <circle cx={actor.x} cy={actor.y} r={1.2} fill={actor.color} fillOpacity={0.8} />
                  <text
                    x={actor.x}
                    y={actor.y + r + 2.5}
                    textAnchor="middle"
                    fill={isSelected ? actor.color : '#334155'}
                    fontSize="2.2"
                    fontWeight={isSelected ? 600 : 500}
                  >
                    {actor.name.split(' ').slice(0, 2).join(' ')}
                  </text>
                  <text
                    x={actor.x}
                    y={actor.y + r + 4.5}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="1.6"
                  >
                    {actor.type}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-app-border)] px-4 py-3">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="h-2 w-4 rounded-sm" style={{ backgroundColor: color, opacity: 0.5 }} />
                <span className="text-[10px] text-navy-500 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        {/* Detail panel */}
        <div className="hidden w-80 shrink-0 lg:block space-y-4">
          {selectedActor ? (
            <>
              <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${selectedActor.color}10`, color: selectedActor.color, border: `2px solid ${selectedActor.color}25` }}
                  >
                    {selectedActor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">{selectedActor.name}</h3>
                    <p className="text-[11px] text-navy-500">{selectedActor.type}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Influence Level</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-navy-100">
                        <div className="h-full rounded-full transition-all" style={{ width: `${selectedActor.influence * 10}%`, backgroundColor: selectedActor.color }} />
                      </div>
                      <span className="text-xs font-mono font-semibold" style={{ color: selectedActor.color }}>{selectedActor.influence}/10</span>
                    </div>
                  </div>

                  {selectedActor.keyQuote && (
                    <div className="rounded-lg bg-[var(--color-app-surface-alt)] p-3 border-l-2" style={{ borderColor: selectedActor.color }}>
                      <p className="text-xs italic text-navy-600 leading-relaxed">{selectedActor.keyQuote}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Interests</p>
                    <p className="text-xs text-navy-600 leading-relaxed">{selectedActor.interests}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Leverage</p>
                    <p className="text-xs text-navy-600 leading-relaxed">{selectedActor.leverage}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2">Relationships</p>
                    {relationships
                      .filter((r) => r.from === selectedActor.id || r.to === selectedActor.id)
                      .map((rel, i) => {
                        const other = actors.find((a) => a.id === (rel.from === selectedActor.id ? rel.to : rel.from))!;
                        return (
                          <div key={i} className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--color-app-surface-alt)] px-2.5 py-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: typeColors[rel.type] }} />
                            <span className="text-[11px] text-navy-700">{other.name.split(' ').slice(0, 2).join(' ')}</span>
                            <span className="ml-auto text-[9px] capitalize font-medium" style={{ color: typeColors[rel.type] }}>{rel.type.replace('_', ' ')}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* AI Insight */}
              <div className="rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold-600" />
                    <h4 className="text-xs font-semibold text-navy-900">PRAXIS Insight</h4>
                  </div>
                  <button
                    onClick={() => generateInsight(selectedActor)}
                    disabled={loadingInsightId === selectedActor.id}
                    className="flex items-center gap-1 text-[10px] text-gold-600 hover:text-gold-700 disabled:opacity-50"
                  >
                    {loadingInsightId === selectedActor.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <RefreshCw className="h-3 w-3" />
                    }
                    {liveInsights[selectedActor.id] ? 'Refresh' : 'Generate'}
                  </button>
                </div>
                {liveInsights[selectedActor.id] ? (
                  <div className="text-xs text-navy-600 leading-relaxed prose prose-sm max-w-none">
                    <MarkdownRenderer content={liveInsights[selectedActor.id]} />
                    {loadingInsightId === selectedActor.id && (
                      <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />
                    )}
                  </div>
                ) : aiInsights[selectedActor.id] ? (
                  <p className="text-xs text-navy-600 leading-relaxed">{aiInsights[selectedActor.id]}</p>
                ) : (
                  <button
                    onClick={() => generateInsight(selectedActor)}
                    disabled={loadingInsightId === selectedActor.id}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-gold-500/20 bg-white px-3 py-2 text-xs text-gold-700 hover:bg-gold-500/8 transition-colors disabled:opacity-50"
                  >
                    {loadingInsightId === selectedActor.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Sparkles className="h-3.5 w-3.5" />
                    }
                    Generate AI Analysis
                  </button>
                )}
                <div className="mt-3 flex gap-2">
                  <Link href="/talking-points" className="rounded-md bg-white border border-[var(--color-app-border)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors">
                    Talking Points
                  </Link>
                  <Link href="/advisory" className="rounded-md bg-white border border-[var(--color-app-border)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:text-gold-700 transition-colors">
                    Ask Advisor
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-navy-300" />
              <p className="text-sm font-medium text-navy-700">Select an Actor</p>
              <p className="mt-1 text-xs text-navy-500">
                Click a node to view their profile, interests, relationships, and AI-powered strategic insights
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
