'use client';

/**
 * <SourcePicker> — the single shared UI for picking research source categories.
 *
 * Used by:
 *   - `/app/situations/new` (Step 3 of the wizard)
 *   - `/app/situations/[id]/settings` (Sources tab)
 *
 * Features:
 *   - Two-column expandable card grid (single column on mobile)
 *   - Each card has an icon, title, one-line desc, toggle switch, and a
 *     "Details" disclosure revealing the longDescription + source badges
 *   - Drag-and-drop reorder via @dnd-kit/sortable, persisted via
 *     `order` + `onOrderChange`
 *   - Inline "+ Add custom source" dialog (URL + category + optional name),
 *     persisted via `customSources` + `onCustomChange`. Custom sources show
 *     as chips inside their category card
 *   - Fully keyboard-accessible: focus rings on diplomatic-blue, aria-pressed
 *     on toggles, aria-expanded on disclosures
 *   - Visual coherence with `/app/settings/profile` and the wizard shell
 *     (navy-200 borders, white bg, rounded-xl, gold-500 accent)
 *
 * Props are fully controlled — the parent owns state for `enabled`, `order`
 * and `customSources`.
 */

import { useId, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  GripVertical,
  Link2,
  Lock,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  SOURCE_CATEGORIES,
  SOURCE_CATEGORY_BY_ID,
  type CustomSource,
  type SourceCategory,
} from '@/lib/constants/source-categories';
import { cn } from '@/lib/utils/cn';

// ── Props ───────────────────────────────────────────────────────────────────

export interface SourcePickerProps {
  /** Record of categoryId → on/off. `alwaysOn` categories are coerced true. */
  enabled: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  /** Ordered category ids (controls display order). Missing ids appended. */
  order?: string[];
  onOrderChange?: (next: string[]) => void;
  /** Extra URLs the user attached to a category. */
  customSources?: CustomSource[];
  onCustomChange?: (next: CustomSource[]) => void;
  /** Region string from the parent situation, displayed on the footer. */
  situationRegion?: string;
  className?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveOrder(
  explicit: string[] | undefined,
  cats: SourceCategory[],
): SourceCategory[] {
  if (!explicit || explicit.length === 0) return cats;
  const byId = new Map<string, SourceCategory>(cats.map((c) => [c.id as string, c]));
  const seen = new Set<string>();
  const ordered: SourceCategory[] = [];
  for (const id of explicit) {
    const cat = byId.get(id);
    if (cat && !seen.has(id)) {
      ordered.push(cat);
      seen.add(id);
    }
  }
  for (const cat of cats) {
    if (!seen.has(cat.id)) ordered.push(cat);
  }
  return ordered;
}

function genId(): string {
  return `cs_${Math.random().toString(36).slice(2, 10)}`;
}

// ── Sub-component: Toggle switch ────────────────────────────────────────────

function Toggle({
  on,
  disabled,
  onChange,
  label,
}: {
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-pressed={on}
      aria-label={`${label} ${on ? 'enabled' : 'disabled'}`}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!on);
      }}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
        on ? 'bg-diplomatic-blue' : 'bg-navy-200',
        disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-[18px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  );
}

// ── Sub-component: A single draggable category card ────────────────────────

function SourceCard({
  cat,
  enabled,
  expanded,
  onToggle,
  onExpand,
  customSources,
  onRemoveCustom,
}: {
  cat: SourceCategory;
  enabled: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  customSources: CustomSource[];
  onRemoveCustom: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });
  const Icon = cat.icon;
  const detailsId = `src-details-${cat.id}`;
  const headerId = `src-header-${cat.id}`;

  const accent = cat.color;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-white transition-all',
        enabled
          ? 'border-diplomatic-blue/30 shadow-sm ring-1 ring-diplomatic-blue/10'
          : 'border-navy-200 hover:border-navy-300',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-3.5">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${cat.label}`}
          className={cn(
            'mt-1 cursor-grab rounded p-0.5 text-navy-300 opacity-0 transition-opacity',
            'hover:text-navy-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40',
            'group-hover:opacity-100 active:cursor-grabbing',
          )}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: enabled ? `${accent}1A` : '#F1F5F9',
            color: enabled ? accent : '#94A3B8',
          }}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>

        <div className="min-w-0 flex-1" id={headerId}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className={cn(
                'text-sm font-semibold leading-tight',
                enabled ? 'text-navy-900' : 'text-navy-700',
              )}
            >
              {cat.label}
            </p>
            {cat.alwaysOn && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                Always on
              </span>
            )}
            {cat.premium && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-700">
                <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-navy-500">
            {cat.description}
          </p>
        </div>

        <Toggle
          on={enabled}
          disabled={cat.alwaysOn}
          onChange={onToggle}
          label={cat.label}
        />
      </div>

      {/* Source badges — always-visible mini preview */}
      <div className="-mt-1 flex flex-wrap gap-1 px-3.5 pb-2">
        {cat.sources.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full bg-navy-100/80 px-1.5 py-0.5 text-[9px] font-medium text-navy-500"
          >
            {s}
          </span>
        ))}
        {cat.sources.length > 3 && (
          <span className="rounded-full bg-navy-100/80 px-1.5 py-0.5 text-[9px] font-medium text-navy-400">
            +{cat.sources.length - 3} more
          </span>
        )}
      </div>

      {/* Custom source chips */}
      {customSources.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-navy-100 bg-navy-50/40 px-3.5 py-2">
          {customSources.map((c) => (
            <span
              key={c.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue shadow-sm ring-1 ring-diplomatic-blue/15"
            >
              <Link2 className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span className="max-w-[140px] truncate" title={c.name ?? c.url}>
                {c.name?.trim() ? c.name : c.url}
              </span>
              <button
                type="button"
                onClick={() => onRemoveCustom(c.id)}
                aria-label={`Remove custom source ${c.name ?? c.url}`}
                className="text-diplomatic-blue/60 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 rounded-sm"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Details disclosure */}
      <button
        type="button"
        onClick={onExpand}
        aria-expanded={expanded}
        aria-controls={detailsId}
        aria-labelledby={headerId}
        className={cn(
          'flex items-center justify-between gap-2 border-t border-navy-100 px-3.5 py-2 text-[11px] font-medium text-navy-500 transition-colors',
          'hover:bg-navy-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-0',
        )}
      >
        <span>Details</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div
          id={detailsId}
          className="space-y-2 border-t border-navy-100 bg-white px-3.5 py-3"
        >
          <p className="text-[11px] leading-relaxed text-navy-600">
            {cat.longDescription}
          </p>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              Included sources
            </p>
            <div className="flex flex-wrap gap-1">
              {cat.sources.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-navy-200 bg-white px-2 py-0.5 text-[10px] font-medium text-navy-700"
                  style={{ borderColor: `${accent}55` }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: Add-custom-source dialog ────────────────────────────────

function AddCustomDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (cs: CustomSource) => void;
}) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>(
    SOURCE_CATEGORIES[1]?.id ?? 'news-media',
  );
  const [err, setErr] = useState<string | null>(null);
  const titleId = useId();

  if (!open) return null;

  const submit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setErr('Paste a URL to continue.');
      return;
    }
    try {
      // Accept bare domains by prepending https://
      const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
      onSave({
        id: genId(),
        url: parsed.toString(),
        name: name.trim() || undefined,
        categoryId,
      });
      setUrl('');
      setName('');
      setErr(null);
      onClose();
    } catch {
      setErr('That does not look like a valid URL.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-navy-200 bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-sm font-semibold text-navy-900">
              Add a custom source
            </h3>
            <p className="mt-0.5 text-[11px] text-navy-500">
              Attach a URL to one of the categories. It will be scraped alongside
              the built-in feeds for this situation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-1 text-navy-400 hover:bg-navy-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="cs-url"
              className="text-[11px] font-medium text-navy-700"
            >
              URL <span className="text-red-500">*</span>
            </label>
            <input
              id="cs-url"
              type="url"
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErr(null);
              }}
              placeholder="https://example.org/report.pdf"
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="cs-name"
              className="text-[11px] font-medium text-navy-700"
            >
              Display name <span className="text-navy-400">(optional)</span>
            </label>
            <input
              id="cs-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MoD white paper"
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="cs-cat"
              className="text-[11px] font-medium text-navy-700"
            >
              Category
            </label>
            <select
              id="cs-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
            >
              {SOURCE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {err && (
            <p role="alert" className="text-[11px] text-red-600">
              {err}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-navy-200 bg-white px-4 py-2 text-xs font-medium text-navy-700 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-gold-500/20 hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add source
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function SourcePicker({
  enabled,
  onChange,
  order,
  onOrderChange,
  customSources,
  onCustomChange,
  situationRegion,
  className,
}: SourcePickerProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ordered = useMemo(
    () => resolveOrder(order, SOURCE_CATEGORIES),
    [order],
  );
  const orderedIds: string[] = ordered.map((c) => c.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over || !onOrderChange) return;
    if (e.active.id === e.over.id) return;
    const oldIdx = orderedIds.indexOf(String(e.active.id));
    const newIdx = orderedIds.indexOf(String(e.over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    onOrderChange(arrayMove(orderedIds, oldIdx, newIdx));
  };

  const toggleCat = (id: string) => {
    const cat = SOURCE_CATEGORY_BY_ID[id];
    if (!cat || cat.alwaysOn) return;
    onChange({ ...enabled, [id]: !enabled[id] });
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const addCustom = (cs: CustomSource) => {
    if (!onCustomChange) return;
    onCustomChange([...(customSources ?? []), cs]);
  };
  const removeCustom = (id: string) => {
    if (!onCustomChange) return;
    onCustomChange((customSources ?? []).filter((c) => c.id !== id));
  };

  const enabledCount = ordered.filter(
    (c) => c.alwaysOn || enabled[c.id],
  ).length;
  const customByCat = (customSources ?? []).reduce<Record<string, CustomSource[]>>(
    (acc, cs) => {
      (acc[cs.categoryId] ??= []).push(cs);
      return acc;
    },
    {},
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy-200 bg-navy-50/40 px-3.5 py-2">
        <div className="flex items-center gap-2 text-[11px] text-navy-600">
          <Sparkles className="h-3.5 w-3.5 text-gold-600" aria-hidden />
          <span>
            <span className="font-semibold text-navy-800">{enabledCount}</span>
            {' of '}
            {ordered.length} categories on
            {situationRegion && (
              <>
                {' '}· focused on{' '}
                <span className="font-medium text-navy-700">{situationRegion}</span>
              </>
            )}
            {(customSources?.length ?? 0) > 0 && (
              <>
                {' '}·{' '}
                <span className="font-medium text-navy-700">
                  {customSources!.length} custom
                </span>
              </>
            )}
          </span>
        </div>
        <p className="text-[10px] text-navy-400">
          Drag cards to prioritise. Top of the list biases research first.
        </p>
      </div>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ordered.map((cat) => (
              <SourceCard
                key={cat.id}
                cat={cat}
                enabled={cat.alwaysOn ? true : enabled[cat.id] === true}
                expanded={expanded[cat.id] === true}
                onToggle={() => toggleCat(cat.id)}
                onExpand={() => toggleExpand(cat.id)}
                customSources={customByCat[cat.id] ?? []}
                onRemoveCustom={removeCustom}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add custom source */}
      {onCustomChange && (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-navy-300 bg-white px-4 py-3 text-xs font-medium text-navy-600 transition-colors',
            'hover:border-diplomatic-blue/50 hover:bg-diplomatic-blue/5 hover:text-diplomatic-blue',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
          )}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add custom source
        </button>
      )}

      <AddCustomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={addCustom}
      />
    </div>
  );
}
