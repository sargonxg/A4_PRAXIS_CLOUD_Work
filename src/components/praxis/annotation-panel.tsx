'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquarePlus,
  ThumbsUp,
  ThumbsDown,
  PenLine,
  Sparkles,
  HelpCircle,
  Tag,
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  Plus,
  X,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Annotation, AnnotationType } from '@/types/provenance';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnnotationPanelProps {
  situationId: string;
  toolId: string;
  /** Compact inline mode (just a button) vs expanded panel */
  mode?: 'inline' | 'panel';
  className?: string;
}

const TYPE_CONFIG: Record<AnnotationType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}> = {
  agree:    { label: 'Agree',    icon: ThumbsUp,         color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  disagree: { label: 'Disagree', icon: ThumbsDown,        color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
  correct:  { label: 'Correct',  icon: PenLine,           color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  enhance:  { label: 'Enhance',  icon: Sparkles,          color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  question: { label: 'Question', icon: HelpCircle,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  classify: { label: 'Classify', icon: Tag,               color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: AnnotationType }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border', cfg.color, cfg.bg, cfg.border)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function AnnotationCard({
  annotation,
  onDelete,
}: {
  annotation: Annotation;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    onDelete(annotation.id);
  }

  return (
    <div className="group relative p-3 rounded-lg border border-navy-200 bg-white hover:border-navy-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <TypeBadge type={annotation.type} />
            {annotation.targetText && (
              <span className="text-xs text-navy-400 italic truncate max-w-[200px]">
                &ldquo;{annotation.targetText.slice(0, 60)}{annotation.targetText.length > 60 ? '…' : ''}&rdquo;
              </span>
            )}
          </div>
          <p className="text-sm text-navy-700 leading-relaxed">{annotation.note}</p>
          {annotation.correction && (
            <div className="mt-2 pl-2 border-l-2 border-blue-300">
              <p className="text-xs text-navy-500 mb-0.5 font-medium">Correction / Enhancement:</p>
              <p className="text-sm text-navy-700">{annotation.correction}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-navy-400 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Delete annotation"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-navy-400">
        {new Date(annotation.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

function AddAnnotationForm({
  onSave,
  onCancel,
}: {
  onSave: (data: { type: AnnotationType; note: string; correction?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<AnnotationType>('question');
  const [note, setNote] = useState('');
  const [correction, setCorrection] = useState('');
  const [saving, setSaving] = useState(false);

  const needsCorrection = type === 'correct' || type === 'enhance';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await onSave({
        type,
        note: note.trim(),
        ...(needsCorrection && correction.trim() ? { correction: correction.trim() } : {}),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/5">
      {/* Type selector */}
      <div>
        <label className="block text-xs font-medium text-navy-600 mb-1.5">Annotation type</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TYPE_CONFIG) as AnnotationType[]).map((t) => {
            const cfg = TYPE_CONFIG[t];
            const Icon = cfg.icon;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all',
                  type === t ? cn(cfg.color, cfg.bg, cfg.border) : 'text-navy-500 bg-white border-navy-200 hover:border-navy-300',
                )}
              >
                <Icon className="h-3 w-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-navy-600 mb-1">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            type === 'agree' ? 'What supports this finding?' :
            type === 'disagree' ? 'What contradicts this?' :
            type === 'correct' ? 'What is inaccurate?' :
            type === 'enhance' ? 'What additional context would help?' :
            type === 'question' ? 'What needs clarification?' :
            'How would you classify this?'
          }
          rows={2}
          required
          className="w-full text-sm px-2.5 py-2 rounded border border-navy-200 bg-white focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/50 focus:border-diplomatic-blue/50 resize-none"
        />
      </div>

      {/* Correction field for correct/enhance types */}
      {needsCorrection && (
        <div>
          <label className="block text-xs font-medium text-navy-600 mb-1">
            {type === 'correct' ? 'Corrected text' : 'Enhancement'}
          </label>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder={type === 'correct' ? 'Provide the accurate version…' : 'Add the missing context or detail…'}
            rows={2}
            className="w-full text-sm px-2.5 py-2 rounded border border-navy-200 bg-white focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/50 focus:border-diplomatic-blue/50 resize-none"
          />
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !note.trim()}
          className="px-3 py-1.5 text-xs rounded bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Save
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AnnotationPanel({ situationId, toolId, mode = 'panel', className }: AnnotationPanelProps) {
  const [open, setOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnotations = useCallback(async () => {
    if (!situationId || !toolId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/annotations?situationId=${encodeURIComponent(situationId)}&toolId=${encodeURIComponent(toolId)}`);
      if (!res.ok) throw new Error('Failed to load annotations');
      const data = await res.json() as { annotations: Annotation[] };
      setAnnotations(data.annotations || []);
    } catch {
      setError('Could not load annotations');
    } finally {
      setLoading(false);
    }
  }, [situationId, toolId]);

  useEffect(() => {
    if (open) fetchAnnotations();
  }, [open, fetchAnnotations]);

  async function handleSave(data: { type: AnnotationType; note: string; correction?: string }) {
    const res = await fetch('/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', situationId, toolId, ...data }),
    });
    if (!res.ok) throw new Error('Failed to save');
    const created = await res.json() as Annotation;
    setAnnotations((prev) => [created, ...prev]);
    setAdding(false);
  }

  async function handleDelete(annotationId: string) {
    await fetch('/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', situationId, toolId, annotationId }),
    });
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
  }

  const count = annotations.length;

  // Inline mode — just a compact button/badge
  if (mode === 'inline') {
    return (
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium transition-all',
          open
            ? 'border-diplomatic-blue/40 bg-diplomatic-blue/10 text-diplomatic-blue'
            : 'border-navy-200 text-navy-500 hover:border-navy-300 hover:text-navy-700 bg-white',
          className,
        )}
        title="Analyst annotations"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {count > 0 ? `${count} note${count !== 1 ? 's' : ''}` : 'Annotate'}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
    );
  }

  // Full panel mode
  return (
    <div className={cn('border border-navy-200 rounded-lg overflow-hidden bg-white', className)}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4 text-navy-500" />
          <span className="text-sm font-medium text-navy-700">Analyst Annotations</span>
          {count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-diplomatic-blue/10 text-diplomatic-blue text-xs font-medium">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!open && !adding && (
            <span className="text-xs text-navy-400">
              {count > 0 ? `${count} note${count !== 1 ? 's' : ''}` : 'Add notes, corrections, or questions'}
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-navy-400" /> : <ChevronDown className="h-4 w-4 text-navy-400" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-navy-100 p-4 space-y-3">
          {/* Add button */}
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-dashed border-navy-300 text-xs text-navy-500 hover:border-diplomatic-blue/50 hover:text-diplomatic-blue hover:bg-diplomatic-blue/5 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Add annotation
            </button>
          )}

          {/* Add form */}
          {adding && (
            <AddAnnotationForm onSave={handleSave} onCancel={() => setAdding(false)} />
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-navy-400" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200">
              <p className="text-xs text-red-600">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Annotations list */}
          {!loading && !error && annotations.length === 0 && !adding && (
            <div className="py-4 text-center">
              <MessageSquarePlus className="h-7 w-7 text-navy-300 mx-auto mb-2" />
              <p className="text-sm text-navy-500">No annotations yet</p>
              <p className="text-xs text-navy-400 mt-0.5">Agree, disagree, correct, or enhance this output</p>
            </div>
          )}

          {!loading && annotations.length > 0 && (
            <div className="space-y-2">
              {annotations.map((ann) => (
                <AnnotationCard key={ann.id} annotation={ann} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Context note */}
          {!loading && annotations.length > 0 && (
            <p className="text-xs text-navy-400 italic pt-1 border-t border-navy-100">
              Annotations with corrections are fed back into the AI context on the next regeneration.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
