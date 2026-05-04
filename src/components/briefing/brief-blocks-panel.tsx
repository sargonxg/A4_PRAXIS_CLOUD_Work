'use client';

/**
 * BriefBlocksPanel — block-based briefing builder.
 *
 * Calls /api/ai/brief-builder for an initial structured brief, then lets
 * the analyst:
 *  - Drag-reorder sections (via @dnd-kit/sortable, already in deps).
 *  - Regenerate any single block with a focus override.
 *  - Inline-edit block markdown (saved on blur to local state — the user
 *    presses Save to persist the whole assembled briefing).
 *  - Add a freeform block.
 *  - Export the assembled markdown to PDF/DOCX (jspdf + docx).
 *
 * Surfaces a banner reminding the user to add Firecrawl / Parallel API
 * keys when those would unlock deeper research.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isSyriaWorkspaceCase, SYRIA_DEMO_CASE_ID } from '@/lib/constants/syria-demo-case';
import { SYRIA_BRIEFING_BLOCKS } from '@/lib/constants/syria-tool-demos';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Loader2,
  Sparkles,
  GripVertical,
  RefreshCw,
  Plus,
  Trash2,
  KeyRound,
  Save,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { PraxisLink } from '@/components/shared/praxis-link';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import type { Situation } from '@/types/situation';

interface BriefSection {
  id: string;
  heading: string;
  body: string;
  provenance: string[];
}

interface BriefPayload {
  briefId: string;
  bluf: string;
  audience: string;
  generatedAt: string;
  sections: BriefSection[];
  decisionPoints?: Array<{ question: string; options: string[]; recommendation?: string; preferredBy?: string }>;
  intelligenceGaps?: string[];
  recommendedSources?: string[];
  version: number;
  locked: boolean;
}

interface KeyMap {
  firecrawl: { present: boolean; effective: boolean };
  parallel: { present: boolean; effective: boolean };
}

function MissingKeysBanner({ keys }: { keys: KeyMap | null }) {
  if (!keys) return null;
  const missing: string[] = [];
  if (!keys.firecrawl?.effective) missing.push('Firecrawl');
  if (!keys.parallel?.effective) missing.push('Parallel.ai');
  if (missing.length === 0) return null;
  return (
    <div className="flex flex-wrap items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>
        <p>
          Add <strong>{missing.join(' + ')}</strong> API keys to unlock
          deep web research and richer block grounding.
        </p>
        <PraxisLink href="/app/settings/api-keys" className="mt-1 inline-flex items-center gap-1 text-amber-900 underline">
          Settings → API Keys
        </PraxisLink>
      </div>
    </div>
  );
}

function SortableBlock({
  block,
  onChange,
  onRegenerate,
  onDelete,
  busy,
}: {
  block: BriefSection;
  onChange: (next: BriefSection) => void;
  onRegenerate: () => void;
  onDelete: () => void;
  busy?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [editing, setEditing] = useState(false);
  const [draftHeading, setDraftHeading] = useState(block.heading);
  const [draftBody, setDraftBody] = useState(block.body);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-navy-950/5"
    >
      <header className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag block"
          className="mt-1 cursor-grab text-navy-300 hover:text-navy-600"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              value={draftHeading}
              onChange={(e) => setDraftHeading(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-navy-900"
            />
          ) : (
            <h3 className="text-sm font-semibold text-navy-900">{block.heading}</h3>
          )}
          {block.provenance.length > 0 ? (
            <p className="text-[10px] text-navy-400">grounded by {block.provenance.join(' · ')}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={busy}
            className="rounded-md border border-slate-300 bg-white p-1 text-navy-700 hover:bg-slate-50 disabled:opacity-60"
            aria-label="Regenerate block"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (editing) {
                onChange({ ...block, heading: draftHeading, body: draftBody });
              }
              setEditing((e) => !e);
            }}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-navy-700 hover:bg-slate-50"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-slate-300 bg-white p-1 text-red-700 hover:bg-red-50"
            aria-label="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      <div className="mt-2">
        {editing ? (
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            rows={Math.min(20, Math.max(4, draftBody.split('\n').length + 1))}
            className="w-full rounded border border-slate-300 bg-white p-2 text-xs font-mono text-navy-800"
          />
        ) : (
          <div className="prose prose-sm max-w-none text-navy-800">
            <MarkdownRenderer content={block.body} />
          </div>
        )}
      </div>
    </article>
  );
}

export function BriefBlocksPanel({ situation }: { situation: Situation }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), user?.isDemo === true)
    || situation.id === SYRIA_DEMO_CASE_ID;
  const [audience, setAudience] = useState('UNSC informal consultations');
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [brief, setBrief] = useState<BriefPayload | null>(() => {
    if (!isSyriaCase) return null;
    return {
      briefId: 'syr-seed',
      bluf: SYRIA_BRIEFING_BLOCKS[0]?.body ?? '',
      audience: 'UNSC informal consultations',
      generatedAt: new Date().toISOString(),
      sections: SYRIA_BRIEFING_BLOCKS.map((b) => ({
        id: b.id,
        heading: b.title,
        body: b.body,
        provenance: ['UN Geneva', 'OCHA', 'UN Syria CCA', 'UNFPA', 'UNHCR'],
      })),
      decisionPoints: [
        {
          question: 'Posture on the 30 January Damascus-SDF agreement',
          options: ['Implementation-first with explicit triggers', 'Risk-first centered on humanitarian/spillover', 'Hold posture until verification'],
          recommendation: 'Implementation-first with explicit red triggers',
          preferredBy: 'mediator + media advisors',
        },
      ],
      intelligenceGaps: [
        'Field reporting from Sweida and northeast Syria',
        'ICRC detention-facility access updates',
        'Türkiye–US northeast working-group readouts',
      ],
      recommendedSources: ['UN Geneva', 'OCHA', 'UNFPA', 'UNHCR', 'Enab Baladi', 'North Press', 'ICG'],
      version: 1,
      locked: false,
    };
  });
  const [keys, setKeys] = useState<KeyMap | null>(null);
  const tier = user?.subscription ?? 'free';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings/api-keys', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { statuses?: Record<string, { present: boolean; effective: boolean }> };
        if (cancelled) return;
        setKeys({
          firecrawl: data.statuses?.firecrawl ?? { present: false, effective: false },
          parallel: data.statuses?.parallel ?? { present: false, effective: false },
        });
      } catch {
        // non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const sectionIds = useMemo(() => brief?.sections.map((s) => s.id) ?? [], [brief]);

  async function generate(focus?: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/ai/brief-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, audience, focus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const payload = (await res.json()) as BriefPayload;
      setBrief(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Brief generation failed');
    } finally {
      setBusy(false);
    }
  }

  async function regenerateBlock(sectionId: string) {
    if (!brief) return;
    setBusyId(sectionId);
    setErr(null);
    try {
      const sec = brief.sections.find((s) => s.id === sectionId);
      const res = await fetch('/api/ai/brief-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation,
          audience,
          focus: `Regenerate the section titled "${sec?.heading}". Keep the section heading and id stable. Preserve the wider brief structure.`,
          previousVersion: brief.version,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fresh = (await res.json()) as BriefPayload;
      const replacement = fresh.sections.find((s) => s.id === sectionId) ?? fresh.sections[0];
      if (!replacement) throw new Error('Empty regenerated brief');
      setBrief({
        ...brief,
        sections: brief.sections.map((s) => (s.id === sectionId ? replacement : s)),
        version: fresh.version,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Block regeneration failed');
    } finally {
      setBusyId(null);
    }
  }

  function onDragEnd(e: DragEndEvent) {
    if (!brief) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = brief.sections.findIndex((s) => s.id === active.id);
    const newIndex = brief.sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setBrief({ ...brief, sections: arrayMove(brief.sections, oldIndex, newIndex) });
  }

  function addFreeform() {
    if (!brief) return;
    setBrief({
      ...brief,
      sections: [
        ...brief.sections,
        { id: `freeform-${Date.now().toString(36)}`, heading: 'New section', body: '_Write block content…_', provenance: [] },
      ],
    });
  }

  function deleteBlock(id: string) {
    if (!brief) return;
    setBrief({ ...brief, sections: brief.sections.filter((s) => s.id !== id) });
  }

  function updateBlock(next: BriefSection) {
    if (!brief) return;
    setBrief({ ...brief, sections: brief.sections.map((s) => (s.id === next.id ? next : s)) });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-navy-900">Block builder</h2>
          <p className="text-xs text-navy-500">
            Drag to reorder · regenerate per block · add freeform sections · grounded in your situation corpus + ARGUS.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Audience (e.g., UNSC, Cabinet)"
            className="w-56 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-navy-900"
          />
          <button
            type="button"
            onClick={() => generate()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {brief ? 'Regenerate brief' : 'Generate brief'}
          </button>
        </div>
      </header>

      <MissingKeysBanner keys={keys} />

      {tier === 'free' ? (
        <div className="mt-2 flex flex-wrap items-start gap-2 rounded-md border border-gold-500/30 bg-gold-50 p-3 text-xs text-gold-900">
          <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            Free tier: limited to grounded Google Search. Upgrade to Analyst for deep research, Firecrawl, and Parallel.ai integrations.
            <PraxisLink href="/pricing" className="ml-1 underline">See plans</PraxisLink>.
          </div>
        </div>
      ) : null}

      {err ? <p className="mt-2 text-xs text-amber-700">{err}</p> : null}

      {brief ? (
        <>
          {brief.bluf ? (
            <div className="mt-3 rounded-md border border-diplomatic-blue/20 bg-diplomatic-blue/5 p-3 text-xs text-navy-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">BLUF</p>
              <p className="mt-1">{brief.bluf}</p>
            </div>
          ) : null}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
              <div className="mt-3 flex flex-col gap-2">
                {brief.sections.map((s) => (
                  <SortableBlock
                    key={s.id}
                    block={s}
                    busy={busyId === s.id}
                    onChange={updateBlock}
                    onRegenerate={() => regenerateBlock(s.id)}
                    onDelete={() => deleteBlock(s.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addFreeform}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-navy-700 hover:bg-slate-50"
            >
              <Plus className="h-3 w-3" /> Add freeform block
            </button>
            <button
              type="button"
              onClick={() => {
                if (!brief) return;
                const blob = new Blob([renderMarkdown(brief)], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${situation.name.replace(/\s+/g, '-')}-brief-v${brief.version}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-navy-700 hover:bg-slate-50"
            >
              <Save className="h-3 w-3" /> Export markdown
            </button>
          </div>

          {brief.intelligenceGaps && brief.intelligenceGaps.length > 0 ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
              <p className="font-semibold">Intelligence gaps</p>
              <ul className="mt-1 list-disc pl-4">
                {brief.intelligenceGaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : !busy ? (
        <p className="mt-3 text-xs text-navy-500">No brief yet — set the audience and click Generate.</p>
      ) : null}
    </section>
  );
}

function renderMarkdown(brief: BriefPayload): string {
  const lines: string[] = [];
  lines.push(`# Brief — ${brief.audience}`);
  lines.push('');
  lines.push(`*BLUF: ${brief.bluf}*`);
  lines.push('');
  for (const s of brief.sections) {
    lines.push(`## ${s.heading}`);
    lines.push('');
    lines.push(s.body);
    if (s.provenance.length > 0) lines.push(`\n_Sources: ${s.provenance.join(', ')}_`);
    lines.push('');
  }
  if (brief.decisionPoints && brief.decisionPoints.length > 0) {
    lines.push('## Decision points');
    for (const d of brief.decisionPoints) {
      lines.push(`- **${d.question}**`);
      d.options.forEach((opt) => lines.push(`  - ${opt}`));
      if (d.recommendation) lines.push(`  - *Recommended:* ${d.recommendation}`);
    }
  }
  return lines.join('\n');
}
