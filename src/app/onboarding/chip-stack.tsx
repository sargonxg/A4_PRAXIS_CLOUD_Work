'use client';

import { useState } from 'react';
import { Plus, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ChipStackProps {
  label: string;
  helper?: string;
  suggestions: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  allowCustom?: boolean;
  placeholder?: string;
  onRequestMore?: () => Promise<string[]>;  // optional AI chip expansion
}

export function ChipStack({
  label, helper, suggestions, value, onChange,
  max = 8, allowCustom = true, placeholder, onRequestMore,
}: ChipStackProps) {
  const [custom, setCustom] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [extra, setExtra] = useState<string[]>([]);

  const pool = [...suggestions, ...extra];

  const toggle = (chip: string) => {
    if (value.includes(chip)) {
      onChange(value.filter(v => v !== chip));
    } else if (value.length < max) {
      onChange([...value, chip]);
    }
  };

  const addCustom = () => {
    const c = custom.trim();
    if (!c || value.includes(c) || value.length >= max) return;
    onChange([...value, c]);
    setCustom('');
  };

  const loadMore = async () => {
    if (!onRequestMore) return;
    setLoadingMore(true);
    try {
      const more = await onRequestMore();
      setExtra(prev => [...prev, ...more.filter(m => !prev.includes(m) && !suggestions.includes(m))]);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-navy-700">{label}</label>
        <span className="text-[10px] text-navy-400">{value.length}/{max}</span>
      </div>
      {helper && <p className="text-[11px] text-navy-500">{helper}</p>}

      {/* Selected chips (editable) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/5 p-2">
          {value.map((v, i) => (
            <span key={i} className="group inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] text-navy-800 shadow-sm">
              {v}
              <button
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove ${v}`}
                className="text-navy-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestion pool */}
      <div className="flex flex-wrap gap-1.5">
        {pool.map((s, i) => {
          const active = value.includes(s);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(s)}
              disabled={!active && value.length >= max}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
                active ? 'border-diplomatic-blue/40 bg-diplomatic-blue/10 text-diplomatic-blue'
                       : 'border-navy-200 bg-white text-navy-600 hover:border-navy-300',
                !active && value.length >= max && 'opacity-50 cursor-not-allowed',
              )}
            >
              {active && <Check className="h-3 w-3" />}
              {s}
            </button>
          );
        })}
        {onRequestMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-gold-500/40 bg-gold-500/5 px-2.5 py-1 text-[11px] text-gold-700 hover:bg-gold-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1"
          >
            {loadingMore ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Suggest more
          </button>
        )}
      </div>

      {allowCustom && (
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            placeholder={placeholder ?? 'Add your own...'}
            aria-label={label}
            className="flex-1 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
          />
          <button
            onClick={addCustom}
            disabled={!custom.trim() || value.length >= max}
            className="inline-flex items-center gap-1 rounded-lg bg-navy-100 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-200 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      )}
    </div>
  );
}
