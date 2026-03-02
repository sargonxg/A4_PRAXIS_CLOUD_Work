'use client';

import { useState } from 'react';
import { Shield, Search, Filter, Calendar, FileText, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';

interface Resolution {
  id: string;
  number: string;
  date: string;
  title: string;
  country: string;
  type: 'sanctions' | 'mandate' | 'thematic';
  keyProvisions: string[];
  relatedResolutions: string[];
  hasSanctions: boolean;
  sanctionTypes?: string[];
}

const resolutions: Resolution[] = [
  {
    id: 'res-001', number: 'S/RES/2677', date: '2023-07-14', title: 'Renewal of UNMISS Mandate',
    country: 'South Sudan', type: 'mandate',
    keyProvisions: ['Mandate renewal until March 2024', 'Strengthened PoC provisions', 'Arms embargo monitoring'],
    relatedResolutions: ['S/RES/2625', 'S/RES/2514'], hasSanctions: true,
    sanctionTypes: ['Arms embargo', 'Travel ban', 'Asset freeze'],
  },
  {
    id: 'res-002', number: 'S/RES/2699', date: '2023-10-02', title: 'Situation in the Democratic Republic of Congo',
    country: 'DRC', type: 'sanctions',
    keyProvisions: ['Sanctions regime renewal', 'M23 designations', 'Arms embargo enforcement'],
    relatedResolutions: ['S/RES/2641', 'S/RES/2293'], hasSanctions: true,
    sanctionTypes: ['Arms embargo', 'Travel ban', 'Asset freeze', 'Financial sanctions'],
  },
  {
    id: 'res-003', number: 'S/RES/2710', date: '2023-12-15', title: 'Non-Proliferation / DPRK',
    country: 'North Korea', type: 'sanctions',
    keyProvisions: ['Panel of Experts mandate renewal', 'Sanctions implementation review', 'Maritime interdiction provisions'],
    relatedResolutions: ['S/RES/2397', 'S/RES/2356'], hasSanctions: true,
    sanctionTypes: ['Comprehensive economic sanctions', 'Arms embargo', 'Travel ban', 'Luxury goods ban'],
  },
  {
    id: 'res-004', number: 'S/RES/2722', date: '2024-01-10', title: 'Situation in the Red Sea (Houthis)',
    country: 'Yemen', type: 'thematic',
    keyProvisions: ['Condemnation of Houthi attacks on shipping', 'Reaffirmation of freedom of navigation', 'Call for immediate cessation'],
    relatedResolutions: ['S/RES/2216', 'S/RES/2624'], hasSanctions: true,
    sanctionTypes: ['Arms embargo', 'Travel ban', 'Asset freeze'],
  },
  {
    id: 'res-005', number: 'S/RES/2730', date: '2024-03-25', title: 'Ceasefire in Gaza',
    country: 'Israel/Palestine', type: 'thematic',
    keyProvisions: ['Immediate ceasefire demand', 'Hostage release requirements', 'Humanitarian access provisions'],
    relatedResolutions: ['S/RES/2720', 'S/RES/2712'], hasSanctions: false,
  },
  {
    id: 'res-006', number: 'S/RES/2687', date: '2023-06-13', title: 'Situation in Libya',
    country: 'Libya', type: 'sanctions',
    keyProvisions: ['Arms embargo enforcement', 'Asset freeze on designated individuals', 'Illicit fuel exports monitoring'],
    relatedResolutions: ['S/RES/1970', 'S/RES/2174'], hasSanctions: true,
    sanctionTypes: ['Arms embargo', 'Travel ban', 'Asset freeze'],
  },
  {
    id: 'res-007', number: 'S/RES/2653', date: '2022-10-21', title: 'Situation in Haiti',
    country: 'Haiti', type: 'sanctions',
    keyProvisions: ['Travel ban on gang leaders', 'Asset freeze provisions', 'Arms embargo on non-state actors'],
    relatedResolutions: [], hasSanctions: true,
    sanctionTypes: ['Travel ban', 'Asset freeze', 'Arms embargo'],
  },
];

const typeStyles = {
  sanctions: { label: 'Sanctions', bg: 'bg-crimson/10', text: 'text-crimson' },
  mandate: { label: 'Mandate', bg: 'bg-teal/10', text: 'text-teal' },
  thematic: { label: 'Thematic', bg: 'bg-gold-500/10', text: 'text-gold-400' },
};

export default function SanctionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedRes, setSelectedRes] = useState<string | null>(null);

  const filtered = resolutions.filter((r) => {
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-purple" />
          <h1 className="text-2xl font-semibold text-navy-50">Sanctions & Resolutions Tracker</h1>
        </div>
        <p className="mt-1 text-sm text-navy-400">
          Searchable database of UNSC resolutions, sanctions regimes, and compliance monitoring
        </p>
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by resolution number, country, or topic..."
            className="w-full rounded-md border border-navy-700/50 bg-navy-800 pl-10 pr-4 py-2.5 text-sm text-navy-200 placeholder:text-navy-500 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
          />
        </div>
        {(['sanctions', 'mandate', 'thematic'] as const).map((type) => {
          const style = typeStyles[type];
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-medium transition-all',
                typeFilter === type
                  ? `${style.bg} ${style.text} ring-1 ring-current`
                  : 'bg-navy-800 text-navy-400 hover:text-navy-200'
              )}
            >
              {style.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="rounded-lg border border-navy-700/50 bg-navy-800">
        <div className="border-b border-navy-700/50 px-6 py-3">
          <span className="text-xs text-navy-500">{filtered.length} resolutions</span>
        </div>
        <div className="divide-y divide-navy-700/30">
          {filtered.map((res) => {
            const style = typeStyles[res.type];
            const isExpanded = selectedRes === res.id;
            return (
              <button
                key={res.id}
                onClick={() => setSelectedRes(isExpanded ? null : res.id)}
                className="flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-navy-700/10"
              >
                <div className="shrink-0">
                  <span className="font-mono text-sm font-semibold text-navy-200">{res.number}</span>
                  <p className="text-[10px] text-navy-500">{new Date(res.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', style.bg, style.text)}>
                      {style.label}
                    </span>
                    <span className="rounded-full bg-navy-700/40 px-2 py-0.5 text-[10px] text-navy-400">
                      {res.country}
                    </span>
                    {res.hasSanctions && (
                      <span className="rounded-full bg-crimson/10 px-2 py-0.5 text-[10px] font-medium text-crimson">
                        Active Sanctions
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-navy-100">{res.title}</h4>

                  {isExpanded && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-1">Key Provisions</p>
                        <ul className="space-y-1">
                          {res.keyProvisions.map((p, i) => (
                            <li key={i} className="text-xs text-navy-300">• {p}</li>
                          ))}
                        </ul>
                      </div>
                      {res.sanctionTypes && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-1">Sanctions Measures</p>
                          <div className="flex flex-wrap gap-1.5">
                            {res.sanctionTypes.map((s) => (
                              <span key={s} className="rounded-full bg-crimson/5 border border-crimson/20 px-2 py-0.5 text-[10px] text-crimson">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {res.relatedResolutions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-1">Related Resolutions</p>
                          <div className="flex gap-2">
                            {res.relatedResolutions.map((r) => (
                              <span key={r} className="rounded-full bg-navy-700/40 px-2 py-0.5 text-[10px] text-navy-300 font-mono">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 shrink-0 text-navy-600 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
