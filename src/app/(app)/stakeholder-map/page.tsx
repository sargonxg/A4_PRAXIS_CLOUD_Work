'use client';

import { useState } from 'react';
import { Users, FileUp, Sparkles, ArrowRight, MessageSquare, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

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
        <button className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-sm text-navy-600 hover:bg-[var(--color-app-surface-alt)] transition-colors">
          <FileUp className="h-4 w-4" />
          Auto-populate from Documents
        </button>
      </div>

      <div className="flex gap-6">
        {/* Graph area */}
        <div className="flex-1 rounded-xl border border-[var(--color-app-border)] bg-white p-2 overflow-hidden">
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
              {aiInsights[selectedActor.id] && (
                <div className="rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-gold-600" />
                    <h4 className="text-xs font-semibold text-navy-900">PRAXIS Insight</h4>
                  </div>
                  <p className="text-xs text-navy-600 leading-relaxed">{aiInsights[selectedActor.id]}</p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/talking-points" className="rounded-md bg-white border border-[var(--color-app-border)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors">
                      Talking Points
                    </Link>
                    <Link href="/advisory" className="rounded-md bg-white border border-[var(--color-app-border)] px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:text-gold-700 transition-colors">
                      Ask Advisor
                    </Link>
                  </div>
                </div>
              )}
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
