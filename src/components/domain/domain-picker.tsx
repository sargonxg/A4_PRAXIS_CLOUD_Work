'use client';

/**
 * DomainPicker — reusable radio-card grid of the 11 PRAXIS domains.
 *
 * Used in onboarding Step 2 (primaryDomain) and situation wizard
 * (classification override). Reads from the client-safe `DOMAIN_SEEDS`
 * so no Firestore round-trip is needed to render.
 *
 * Spec: docs/superpowers/specs/2026-04-19-domain-taxonomy-stabilization-design.md §10
 */

import { useMemo } from 'react';
import * as Icons from 'lucide-react';
import { DOMAIN_IDS, type DomainId } from '@/types/domain';
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';
import { cn } from '@/lib/utils/cn';

type IconName = keyof typeof Icons;

function iconFor(name: string): React.ComponentType<{ className?: string }> {
  const Icon = Icons[name as IconName] as React.ComponentType<{ className?: string }> | undefined;
  return Icon ?? Icons.Circle;
}

export interface DomainPickerProps {
  value: DomainId;
  onChange: (next: DomainId) => void;
  /** When true, hides `generic` from the grid (useful for situation wizard). */
  hideGeneric?: boolean;
  /** Optional secondary-mode: show check marks instead of radio; allow multi-select. */
  mode?: 'single' | 'multi';
  multiValue?: DomainId[];
  onMultiChange?: (next: DomainId[]) => void;
  disabledIds?: DomainId[];
  maxMulti?: number;
}

export function DomainPicker({
  value,
  onChange,
  hideGeneric = false,
  mode = 'single',
  multiValue = [],
  onMultiChange,
  disabledIds = [],
  maxMulti = 3,
}: DomainPickerProps) {
  const ids = useMemo(() => {
    const base = DOMAIN_IDS.slice();
    return hideGeneric ? base.filter((id) => id !== 'generic') : base;
  }, [hideGeneric]);

  const toggleMulti = (id: DomainId) => {
    if (!onMultiChange) return;
    const picked = multiValue.includes(id);
    if (picked) {
      onMultiChange(multiValue.filter((x) => x !== id));
    } else if (multiValue.length < maxMulti) {
      onMultiChange([...multiValue, id]);
    }
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {ids.map((id) => {
        const seed = DOMAIN_SEEDS[id];
        const Icon = iconFor(seed.icon);
        const selected = mode === 'multi' ? multiValue.includes(id) : value === id;
        const disabled = disabledIds.includes(id);

        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => (mode === 'multi' ? toggleMulti(id) : onChange(id))}
            aria-pressed={selected}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-left transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
              disabled && 'opacity-40 cursor-not-allowed',
              !disabled &&
                (selected
                  ? 'border-diplomatic-blue bg-diplomatic-blue/5 shadow-sm'
                  : 'border-navy-200 bg-white hover:border-navy-300'),
            )}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${seed.colorHex}14`, color: seed.colorHex }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-navy-900">{seed.name}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-navy-500 line-clamp-2">
                {seed.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
