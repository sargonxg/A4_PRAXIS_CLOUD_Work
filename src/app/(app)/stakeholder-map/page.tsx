'use client';

import { useState } from 'react';
import { Users, ArrowRight, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
}

interface Relationship {
  from: string;
  to: string;
  type: 'alliance' | 'rivalry' | 'mediation' | 'funding' | 'diplomatic_pressure';
  label: string;
}

const actors: Actor[] = [
  { id: 'gov', name: 'Government of Nordalia', type: 'Government', influence: 9, color: '#4A90A4', x: 50, y: 25, interests: 'Territorial integrity, maintain power, international legitimacy', leverage: 'Military superiority, international recognition, control of capital' },
  { id: 'drm', name: 'DRM (Democratic Reform Movement)', type: 'Opposition', influence: 7, color: '#A63D40', x: 20, y: 50, interests: 'Political representation, resource access, regional autonomy', leverage: 'Control of eastern provinces, popular support base, mining revenues' },
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

export default function StakeholderMapPage() {
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-steel" />
            <h1 className="text-2xl font-semibold text-navy-50">Stakeholder Mapper</h1>
          </div>
          <p className="mt-1 text-sm text-navy-400">
            Visual network analysis of actors, alliances, and influence pathways
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-md border border-navy-700/50 bg-navy-800 px-4 py-2 text-sm text-navy-300 hover:bg-navy-700/50">
          <FileUp className="h-4 w-4" />
          Auto-populate from Documents
        </button>
      </div>

      <div className="flex gap-6">
        {/* Graph area */}
        <div className="flex-1 rounded-lg border border-navy-700/50 bg-navy-800 p-2">
          <svg viewBox="0 0 100 100" className="h-[500px] w-full" style={{ background: 'radial-gradient(ellipse at center, #0F172A 0%, #0B1120 100%)' }}>
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
                    strokeWidth={0.3}
                    strokeOpacity={0.5}
                    strokeDasharray={rel.type === 'rivalry' ? '1,1' : undefined}
                  />
                  <text
                    x={(fromActor.x + toActor.x) / 2}
                    y={(fromActor.y + toActor.y) / 2 - 1}
                    textAnchor="middle"
                    fill={typeColors[rel.type]}
                    fontSize="1.8"
                    opacity={0.6}
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
                    <circle cx={actor.x} cy={actor.y} r={r + 2} fill="none" stroke={actor.color} strokeWidth={0.3} strokeOpacity={0.5}>
                      <animate attributeName="r" values={`${r + 1};${r + 3};${r + 1}`} dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={actor.x}
                    cy={actor.y}
                    r={r}
                    fill={actor.color}
                    fillOpacity={isSelected ? 0.3 : 0.15}
                    stroke={actor.color}
                    strokeWidth={isSelected ? 0.5 : 0.3}
                  />
                  <circle cx={actor.x} cy={actor.y} r={1} fill={actor.color} />
                  <text
                    x={actor.x}
                    y={actor.y + r + 2.5}
                    textAnchor="middle"
                    fill={isSelected ? actor.color : '#94A3B8'}
                    fontSize="2.2"
                    fontWeight={isSelected ? 600 : 400}
                  >
                    {actor.name.split(' ').slice(0, 2).join(' ')}
                  </text>
                  <text
                    x={actor.x}
                    y={actor.y + r + 4.5}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="1.6"
                  >
                    {actor.type}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-navy-700/50 px-4 py-3">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="h-2 w-4 rounded-sm" style={{ backgroundColor: color, opacity: 0.6 }} />
                <span className="text-[10px] text-navy-500 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="hidden w-72 shrink-0 lg:block">
          {selectedActor ? (
            <div className="rounded-lg border border-navy-700/50 bg-navy-800 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${selectedActor.color}15`, color: selectedActor.color, border: `2px solid ${selectedActor.color}40` }}
                >
                  {selectedActor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-100">{selectedActor.name}</h3>
                  <p className="text-[10px] text-navy-500">{selectedActor.type}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-1">Influence Level</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-navy-700/50">
                      <div className="h-full rounded-full" style={{ width: `${selectedActor.influence * 10}%`, backgroundColor: selectedActor.color }} />
                    </div>
                    <span className="text-xs font-mono" style={{ color: selectedActor.color }}>{selectedActor.influence}/10</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-1">Interests</p>
                  <p className="text-xs text-navy-300 leading-relaxed">{selectedActor.interests}</p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-1">Leverage</p>
                  <p className="text-xs text-navy-300 leading-relaxed">{selectedActor.leverage}</p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-2">Relationships</p>
                  {relationships
                    .filter((r) => r.from === selectedActor.id || r.to === selectedActor.id)
                    .map((rel, i) => {
                      const other = actors.find((a) => a.id === (rel.from === selectedActor.id ? rel.to : rel.from))!;
                      return (
                        <div key={i} className="mb-2 flex items-center gap-2 rounded-md bg-navy-900/40 px-2.5 py-1.5">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: typeColors[rel.type] }} />
                          <span className="text-[10px] text-navy-300">{other.name.split(' ').slice(0, 2).join(' ')}</span>
                          <span className="ml-auto text-[9px] capitalize" style={{ color: typeColors[rel.type] }}>{rel.type.replace('_', ' ')}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-navy-700/30 bg-navy-800/50 p-5 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-navy-600" />
              <p className="text-sm text-navy-400">
                Click an actor node to view their profile, interests, and relationships
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
