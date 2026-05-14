'use client';

import { useState } from 'react';
import { DOMAIN_IDS, type DomainId } from '@/types/domain';
import { cn } from '@/lib/utils/cn';

const DOMAIN_LABEL: Record<DomainId, string> = {
  'generic': 'Generic',
  'armed-conflict-security': 'Armed Conflict & Security',
  'diplomacy-negotiation': 'Diplomacy & Negotiation',
  'humanitarian': 'Humanitarian',
  'human-rights': 'Human Rights',
  'governance-rule-of-law': 'Governance & Rule of Law',
  'economic-sanctions': 'Economic & Sanctions',
  'development-stabilization': 'Development & Stabilization',
  'climate-environmental-security': 'Climate & Environmental Security',
  'information-cyber': 'Information & Cyber',
  'transnational-threats': 'Transnational Threats',
};

const DOMAIN_TINT: Record<DomainId, string> = {
  'generic': 'border-slate-300/80 bg-slate-50',
  'armed-conflict-security': 'border-[#A04545]/45 bg-[#FCF1F1]',
  'diplomacy-negotiation': 'border-[#3A5A7A]/45 bg-[#F1F4F8]',
  'humanitarian': 'border-[#3F7A66]/45 bg-[#F1F8F5]',
  'human-rights': 'border-[#7A3F4F]/45 bg-[#F8F1F4]',
  'governance-rule-of-law': 'border-[#5B6B8C]/45 bg-[#F2F4F8]',
  'economic-sanctions': 'border-[#C9A86A]/55 bg-[#FAF6EC]',
  'development-stabilization': 'border-[#A06A3C]/45 bg-[#FAF3EC]',
  'climate-environmental-security': 'border-[#4F8B6A]/45 bg-[#F1F6F2]',
  'information-cyber': 'border-[#6A5B8C]/45 bg-[#F4F2F8]',
  'transnational-threats': 'border-[#8C5B5B]/45 bg-[#F8F2F2]',
};

interface DomainPickerProps {
  initialDomain?: DomainId;
  onSelect?: (domain: DomainId) => void;
}

export function DomainPicker({ initialDomain = 'generic', onSelect }: DomainPickerProps) {
  const [selected, setSelected] = useState<DomainId>(initialDomain);

  function handleSelect(id: DomainId) {
    setSelected(id);
    onSelect?.(id);
  }

  return (
    <section className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700">Domain</p>
          <h3 className="mt-1 text-base font-semibold text-navy-950">
            Pick the analytical domain for this capsule
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          {selected.toUpperCase()}
        </span>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {DOMAIN_IDS.map((id) => {
          const active = id === selected;
          return (
            <button
              type="button"
              key={id}
              onClick={() => handleSelect(id)}
              aria-pressed={active}
              className={cn(
                'group relative flex aspect-[5/3] flex-col justify-between rounded-sm border-2 p-3 text-left transition',
                DOMAIN_TINT[id],
                active ? 'ring-2 ring-inset ring-amber-400 shadow-md' : 'hover:shadow-sm',
              )}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
                PRX-DOM-{id.toUpperCase().slice(0, 6)}
              </span>
              <span className="font-serif text-sm leading-snug text-[#0F172A]">
                {DOMAIN_LABEL[id]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
