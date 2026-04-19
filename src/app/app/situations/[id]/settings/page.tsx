'use client';

/**
 * /app/situations/[id]/settings — six-tab situation editor.
 *
 * Reuses PATCH /api/situations/[id] for persistence. Each tab composes a
 * partial `Situation` delta and POSTs it. The Danger Zone tab uses
 * DELETE /api/situations/[id] + a confirm dialog. Uploads in the Sources
 * tab hit /api/documents/upload with `situationId` so the server attaches
 * the blob to the current situation.
 *
 * Styling intentionally mirrors:
 *   - src/app/app/situations/new/page.tsx (Step 1 input shape)
 *   - src/app/app/settings/profile/page.tsx (tab nav + layout)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  Globe,
  Info,
  Languages as LanguagesIcon,
  Loader2,
  Plus,
  Settings as SettingsIcon,
  ShieldAlert,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { usePraxisRoute } from '@/lib/utils/routes';
import { PraxisLink } from '@/components/shared/praxis-link';
import { DomainPicker } from '@/components/domain/domain-picker';
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';
import { isDomainId, type DomainId } from '@/types/domain';
import { LANGUAGES, type Language } from '@/types/analyst-profile';
import type {
  Situation,
  SituationStatus,
  SituationType,
  UserRole,
} from '@/types/situation';
import { cn } from '@/lib/utils/cn';
import { SourcePicker } from '@/components/sources/source-picker';
import {
  SOURCE_CATEGORIES,
  defaultEnabledMap,
  type CustomSource,
} from '@/lib/constants/source-categories';

/* ---------- Constants (kept in sync with /app/situations/new Step 1) ---------- */

const SITUATION_TYPES: { value: SituationType; label: string }[] = [
  { value: 'international', label: 'International Conflict' },
  { value: 'civil', label: 'Civil Conflict' },
  { value: 'political', label: 'Political Crisis' },
  { value: 'trade', label: 'Trade Dispute' },
  { value: 'workplace', label: 'Workplace Dispute' },
  { value: 'community', label: 'Community Dispute' },
  { value: 'legal', label: 'Legal Dispute' },
  { value: 'custom', label: 'Custom' },
];

const USER_ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'observer', label: 'Observer', desc: 'Monitoring without direct involvement' },
  { value: 'analyst', label: 'Analyst', desc: 'Producing intelligence and assessments' },
  { value: 'mediator', label: 'Mediator', desc: 'Facilitating negotiation between parties' },
  { value: 'party', label: 'Party to conflict', desc: 'Directly involved in the situation' },
  { value: 'advisor', label: 'Advisor', desc: 'Providing counsel to stakeholders' },
  { value: 'researcher', label: 'Researcher', desc: 'Academic or policy research' },
];

const STATUS_OPTIONS: { value: SituationStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

// Source category metadata lives in `src/lib/constants/source-categories.ts`
// and is consumed via <SourcePicker>.

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  ar: 'العربية',
  ru: 'Русский',
  zh: '中文',
};

/* ---------- Tab definition ---------- */

type TabId = 'context' | 'domain' | 'actors' | 'sources' | 'preferences' | 'danger';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'context', label: 'Context', icon: FileText },
  { id: 'domain', label: 'Domain', icon: SettingsIcon },
  { id: 'actors', label: 'Actors', icon: Users },
  { id: 'sources', label: 'Sources', icon: BookOpen },
  { id: 'preferences', label: 'Preferences', icon: LanguagesIcon },
  { id: 'danger', label: 'Danger zone', icon: ShieldAlert },
];

/* ---------- Shared UI atoms ---------- */

function SaveBar({
  onSave,
  saving,
  savedAt,
  error,
  disabled,
}: {
  onSave: () => void;
  saving: boolean;
  savedAt: number | null;
  error: string | null;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 pt-4">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          {savedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Saved
              <span className="text-emerald-600/70">· {new Date(savedAt).toLocaleTimeString()}</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition',
            saving || disabled
              ? 'cursor-not-allowed bg-navy-200 text-navy-400'
              : 'bg-gold-500 text-white shadow-md shadow-gold-500/20 hover:bg-gold-600',
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Tab: Context ---------- */

function ContextTab({
  situation,
  onPatch,
}: {
  situation: Situation;
  onPatch: (patch: Partial<Situation>) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    name: situation.name ?? '',
    type: situation.type ?? 'international',
    region: situation.region ?? '',
    description: situation.description ?? '',
    userRole: situation.userRole ?? 'analyst',
    status: situation.status ?? 'active',
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      name: situation.name ?? '',
      type: situation.type ?? 'international',
      region: situation.region ?? '',
      description: situation.description ?? '',
      userRole: situation.userRole ?? 'analyst',
      status: situation.status ?? 'active',
    });
  }, [situation.id, situation.name, situation.type, situation.region, situation.description, situation.userRole, situation.status]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const ok = await onPatch({
      name: form.name.trim(),
      type: form.type,
      region: form.region.trim(),
      description: form.description,
      userRole: form.userRole,
      status: form.status,
    });
    setSaving(false);
    if (ok) setSavedAt(Date.now());
    else setError('Could not save. Please try again.');
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">
          Situation Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g., Syria Ceasefire Monitoring"
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-navy-700">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SituationType }))}
            className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
          >
            {SITUATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
            <Globe className="h-3 w-3" /> Region
          </label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            placeholder="e.g., Eastern Mediterranean"
            className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          placeholder="2-3 sentences describing the conflict dynamics, key issues, and current state..."
          className="w-full resize-none rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Your Role</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {USER_ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, userRole: r.value }))}
              className={cn(
                'rounded-lg border px-4 py-3 text-left transition-all',
                form.userRole === r.value
                  ? 'border-diplomatic-blue bg-diplomatic-blue/5 ring-1 ring-diplomatic-blue/20'
                  : 'border-navy-200 hover:border-navy-300',
              )}
            >
              <p
                className={cn(
                  'text-sm font-medium',
                  form.userRole === r.value ? 'text-diplomatic-blue' : 'text-navy-700',
                )}
              >
                {r.label}
              </p>
              <p className="mt-0.5 text-[11px] text-navy-500">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SituationStatus }))}
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <SaveBar onSave={save} saving={saving} savedAt={savedAt} error={error} disabled={!form.name.trim()} />
    </div>
  );
}

/* ---------- Tab: Domain ---------- */

function DomainTab({
  situation,
  onPatch,
}: {
  situation: Situation;
  onPatch: (patch: Partial<Situation>) => Promise<boolean>;
}) {
  const initial: DomainId = isDomainId(situation.domain) ? (situation.domain as DomainId) : 'generic';
  const [picked, setPicked] = useState<DomainId>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPicked(isDomainId(situation.domain) ? (situation.domain as DomainId) : 'generic');
  }, [situation.id, situation.domain]);

  const currentSeed = DOMAIN_SEEDS[initial];
  const confidence = typeof situation.domainConfidence === 'number' ? situation.domainConfidence : null;
  const confPct = confidence !== null ? Math.round(confidence * 100) : null;
  const overridden = situation.domainOverriddenByUser === true;
  const dirty = picked !== initial;

  const save = async () => {
    setSaving(true);
    setError(null);
    const ok = await onPatch({
      domain: picked,
      domainOverriddenByUser: true,
      domainVersion: (situation.domainVersion ?? 0) + 1,
      domainClassifiedAt: new Date().toISOString(),
    });
    setSaving(false);
    if (ok) setSavedAt(Date.now());
    else setError('Could not save. Please try again.');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-navy-200 bg-navy-50/40 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
          Current domain
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${currentSeed.colorHex}14`, color: currentSeed.colorHex }}
          >
            <span className="text-xs font-bold">{currentSeed.name.slice(0, 1)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy-900">{currentSeed.name}</p>
            <p className="mt-0.5 text-[11px] text-navy-500">{currentSeed.description}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {confPct !== null && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-navy-600 ring-1 ring-navy-200">
                {confPct}% confidence
              </span>
            )}
            {overridden && (
              <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
                Overridden
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-navy-700">Change domain</p>
        <DomainPicker value={picked} onChange={setPicked} hideGeneric={false} />
      </div>

      <p className="text-[11px] text-navy-500">
        Overriding the domain changes lens weights, preferred feeds and frameworks for every tool run
        against this situation. Previous classifications stay in the history for provenance.
      </p>

      <SaveBar onSave={save} saving={saving} savedAt={savedAt} error={error} disabled={!dirty} />
    </div>
  );
}

/* ---------- Tab: Actors ---------- */

function ActorsTab({
  situation,
  onPatch,
}: {
  situation: Situation;
  onPatch: (patch: Partial<Situation>) => Promise<boolean>;
}) {
  const [actors, setActors] = useState<string[]>(situation.actors ?? []);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActors(situation.actors ?? []);
  }, [situation.id, situation.actors]);

  const add = () => {
    const name = input.trim();
    if (!name || actors.includes(name)) return;
    setActors((a) => [...a, name]);
    setInput('');
  };

  const remove = (name: string) => setActors((a) => a.filter((x) => x !== name));

  const save = async () => {
    setSaving(true);
    setError(null);
    const ok = await onPatch({ actors, actorCount: actors.length });
    setSaving(false);
    if (ok) setSavedAt(Date.now());
    else setError('Could not save. Please try again.');
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-navy-700">Key actors / parties</p>
        <p className="mt-1 text-[11px] text-navy-500">
          Add the main states, armed groups, institutions or individuals involved in the situation.
          Actors seed every graph build and actor-profile enrichment.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Type an actor name and press Enter"
          className="flex-1 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-navy-100 px-3 py-2.5 text-navy-600 transition-colors hover:bg-navy-200 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {actors.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/5 p-3">
          {actors.map((actor) => (
            <span
              key={actor}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-diplomatic-blue shadow-sm"
            >
              {actor}
              <button
                type="button"
                onClick={() => remove(actor)}
                aria-label={`Remove ${actor}`}
                className="text-diplomatic-blue/60 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-navy-200 bg-navy-50/40 px-4 py-6 text-center">
          <p className="text-xs text-navy-500">No actors yet. Add the first one above.</p>
        </div>
      )}

      <SaveBar onSave={save} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}

/* ---------- Tab: Sources ---------- */

function SourcesTab({
  situation,
  onPatch,
}: {
  situation: Situation;
  onPatch: (patch: Partial<Situation>) => Promise<boolean>;
}) {
  const initialEnabled = useMemo<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    const defaults = defaultEnabledMap();
    for (const cat of SOURCE_CATEGORIES) {
      out[cat.id] = cat.alwaysOn
        ? true
        : situation.sourceCategoriesEnabled?.[cat.id] ?? defaults[cat.id] ?? false;
    }
    return out;
  }, [situation.sourceCategoriesEnabled, situation.id]);

  const initialOrder = useMemo<string[]>(
    () => situation.sourceCategoryOrder ?? SOURCE_CATEGORIES.map((c) => c.id),
    [situation.sourceCategoryOrder, situation.id],
  );
  const initialCustom = useMemo<CustomSource[]>(
    () => (situation.customSources ?? []).map((c) => ({ ...c })),
    [situation.customSources, situation.id],
  );

  const [urlsText, setUrlsText] = useState(() => (situation.sourceUrls ?? []).join('\n'));
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initialEnabled);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [customSources, setCustomSources] = useState<CustomSource[]>(initialCustom);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ name: string; ok: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setUrlsText((situation.sourceUrls ?? []).join('\n'));
    setEnabled(initialEnabled);
    setOrder(initialOrder);
    setCustomSources(initialCustom);
  }, [situation.id, situation.sourceUrls, initialEnabled, initialOrder, initialCustom]);

  const parseUrls = (raw: string): string[] => {
    return raw
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);
  };

  const acceptFiles = (incoming: FileList | File[]) => {
    const accepted = Array.from(incoming).filter((f) =>
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ].includes(f.type),
    );
    setFiles((prev) => [...prev, ...accepted].slice(0, 10));
  };

  const uploadAll = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const results: { name: string; ok: boolean }[] = [];
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('situationId', situation.id);
        const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
        results.push({ name: file.name, ok: res.ok });
      } catch {
        results.push({ name: file.name, ok: false });
      }
    }
    setUploadStatus(results);
    setFiles([]);
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const urls = parseUrls(urlsText);
    const ok = await onPatch({
      sourceUrls: urls,
      sourceCategoriesEnabled: enabled,
      sourceCategoryOrder: order,
      customSources: customSources.map((c) => ({
        id: c.id,
        url: c.url,
        name: c.name,
        categoryId: c.categoryId,
      })),
    });
    setSaving(false);
    if (ok) setSavedAt(Date.now());
    else setError('Could not save. Please try again.');
  };

  return (
    <div className="space-y-6">
      {/* Source URLs */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Source URLs (one per line)</label>
        <p className="text-[11px] text-navy-500">
          Paste URLs of reports, articles or primary documents PRAXIS should index for this situation.
        </p>
        <textarea
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          rows={5}
          placeholder={'https://reliefweb.int/...\nhttps://www.crisisgroup.org/...'}
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 font-mono text-xs text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
        />
        <p className="text-[10px] text-navy-400">{parseUrls(urlsText).length} URL(s)</p>
      </div>

      {/* File upload */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Upload documents</label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) acceptFiles(e.dataTransfer.files);
          }}
          className={cn(
            'rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
            isDragging
              ? 'border-diplomatic-blue bg-diplomatic-blue/5'
              : 'border-navy-200 bg-navy-50/50 hover:border-diplomatic-blue/30',
          )}
        >
          <Upload className="mx-auto h-6 w-6 text-navy-400" />
          <p className="mt-2 text-xs text-navy-600">
            Drag & drop PDF, DOCX or TXT here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-diplomatic-blue underline-offset-2 hover:underline"
            >
              browse
            </button>
            .
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) acceptFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-1 pt-1">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-navy-200 bg-white px-3 py-2"
              >
                <span className="truncate text-xs text-navy-700">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                  className="text-navy-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={uploadAll}
              disabled={uploading}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-xs font-semibold text-white hover:bg-diplomatic-blue/90 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload {files.length} file{files.length === 1 ? '' : 's'}
            </button>
          </div>
        )}

        {uploadStatus.length > 0 && (
          <div className="mt-2 space-y-1">
            {uploadStatus.map((s, i) => (
              <p
                key={i}
                className={cn(
                  'text-[11px]',
                  s.ok ? 'text-emerald-700' : 'text-red-700',
                )}
              >
                {s.ok ? '✓' : '✗'} {s.name}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Category picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-navy-700">Source categories</label>
        <p className="text-[11px] text-navy-500">
          Control which research categories PRAXIS pulls from when refreshing this situation. Drag
          to reorder — the top of the list biases research first.
        </p>
        <SourcePicker
          enabled={enabled}
          onChange={setEnabled}
          order={order}
          onOrderChange={setOrder}
          customSources={customSources}
          onCustomChange={setCustomSources}
          situationRegion={situation.region}
        />
      </div>

      <SaveBar onSave={save} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}

/* ---------- Tab: Preferences ---------- */

function PreferencesTab({
  situation,
  onPatch,
}: {
  situation: Situation;
  onPatch: (patch: Partial<Situation>) => Promise<boolean>;
}) {
  const [language, setLanguage] = useState<string>(situation.languageOverride ?? '');
  const [from, setFrom] = useState<string>(situation.dateRangeFrom ?? '');
  const [to, setTo] = useState<string>(situation.dateRangeTo ?? '');
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    situation.sourceCategoriesEnabled ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(situation.languageOverride ?? '');
    setFrom(situation.dateRangeFrom ?? '');
    setTo(situation.dateRangeTo ?? '');
    setEnabled(situation.sourceCategoriesEnabled ?? {});
  }, [
    situation.id,
    situation.languageOverride,
    situation.dateRangeFrom,
    situation.dateRangeTo,
    situation.sourceCategoriesEnabled,
  ]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const patch: Partial<Situation> = {
      languageOverride: language || undefined,
      dateRangeFrom: from || undefined,
      dateRangeTo: to || undefined,
      sourceCategoriesEnabled: enabled,
    };
    const ok = await onPatch(patch);
    setSaving(false);
    if (ok) setSavedAt(Date.now());
    else setError('Could not save. Please try again.');
  };

  const toggleCat = (id: string) => setEnabled((e) => ({ ...e, [id]: !(e[id] ?? false) }));

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
          <LanguagesIcon className="h-3 w-3" /> Output language override
          <span className="ml-1 rounded-full bg-navy-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-navy-500">
            Optional
          </span>
        </label>
        <p className="text-[11px] text-navy-500">
          When set, every tool run for this situation falls back to this language instead of your
          profile default.
        </p>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
        >
          <option value="">Use my profile language</option>
          {LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_LABELS[code]} ({code})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
            <Calendar className="h-3 w-3" /> Date range — from
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-navy-700">
            <Calendar className="h-3 w-3" /> Date range — to
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">
          Per-situation source toggles
        </label>
        <p className="text-[11px] text-navy-500">
          These override the defaults from the Sources tab for any ad-hoc research run.
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {SOURCE_CATEGORIES.map((cat) => {
            const on = cat.alwaysOn ? true : enabled[cat.id] === true;
            return (
              <label
                key={cat.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs',
                  on
                    ? 'border-diplomatic-blue/30 bg-diplomatic-blue/5 text-diplomatic-blue'
                    : 'border-navy-200 bg-white text-navy-600',
                  cat.alwaysOn && 'cursor-default opacity-80',
                )}
              >
                <span>{cat.label}</span>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={cat.alwaysOn}
                  onChange={() => toggleCat(cat.id)}
                  className="h-3.5 w-3.5 accent-diplomatic-blue"
                />
              </label>
            );
          })}
        </div>
      </div>

      <SaveBar onSave={save} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}

/* ---------- Tab: Danger zone ---------- */

function DangerZoneTab({
  situation,
  onPatch,
  onDeleted,
}: {
  situation: Situation;
  onPatch: (patch: Partial<Situation>) => Promise<boolean>;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isArchived = situation.status === 'archived';

  const archive = async () => {
    setArchiving(true);
    setError(null);
    const ok = await onPatch({ status: 'archived' });
    setArchiving(false);
    if (!ok) setError('Could not archive. Please try again.');
  };

  const confirmDelete = async () => {
    if (deleteText !== situation.name) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/situations/${situation.id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Delete failed — please try again.');
        setDeleting(false);
        return;
      }
      onDeleted();
    } catch {
      setError('Network error — please check your connection.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <p className="text-sm font-semibold text-amber-900">Archive this situation</p>
        <p className="mt-1 text-xs text-amber-800/80">
          Archiving hides the situation from your active list but keeps every tool output, graph and
          document intact. You can restore it later by changing the status back to &ldquo;active&rdquo;.
        </p>
        <button
          type="button"
          onClick={archive}
          disabled={archiving || isArchived}
          className={cn(
            'mt-3 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition',
            isArchived
              ? 'cursor-not-allowed border-amber-300 bg-amber-100 text-amber-800'
              : 'border-amber-400 bg-white text-amber-800 hover:bg-amber-100',
          )}
        >
          {archiving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SettingsIcon className="h-3.5 w-3.5" />
          )}
          {isArchived ? 'Already archived' : 'Archive situation'}
        </button>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
        <p className="text-sm font-semibold text-red-900">Delete this situation</p>
        <p className="mt-1 text-xs text-red-800/80">
          Permanently removes the situation document and every subcollection (graph, documents,
          reports, scenarios, chats, tool-data). This cannot be undone.
        </p>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-400 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete situation…
          </button>
        ) : (
          <div className="mt-3 space-y-2 rounded-lg border border-red-300 bg-white p-3">
            <p className="text-xs text-red-900">
              Type{' '}
              <span className="rounded bg-red-100 px-1 py-0.5 font-mono font-semibold">
                {situation.name}
              </span>{' '}
              to confirm:
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder={situation.name}
              className="w-full rounded-md border border-red-300 bg-white px-3 py-2 text-xs text-navy-900 focus:border-red-500 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setDeleteText('');
                }}
                disabled={deleting}
                className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting || deleteText !== situation.name}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  deleteText === situation.name && !deleting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'cursor-not-allowed bg-red-200 text-red-500',
                )}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Permanently delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Summary card (right column on lg+) ---------- */

function SituationSummaryCard({ situation }: { situation: Situation }) {
  const domainId: DomainId = isDomainId(situation.domain) ? (situation.domain as DomainId) : 'generic';
  const seed = DOMAIN_SEEDS[domainId];
  const typeLabel =
    SITUATION_TYPES.find((t) => t.value === situation.type)?.label ?? situation.type;

  return (
    <div className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
        Situation frame
      </p>
      <h3 className="mt-1.5 text-base font-bold text-navy-900">{situation.name || 'Untitled situation'}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-navy-500">
        <span className="rounded-full bg-diplomatic-blue/10 px-2 py-0.5 font-medium text-diplomatic-blue">
          {typeLabel}
        </span>
        {situation.region && (
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {situation.region}
          </span>
        )}
        <span className="capitalize">{situation.status}</span>
      </div>

      <dl className="mt-4 space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <dt className="text-navy-500">Domain</dt>
          <dd className="font-medium text-navy-800">{seed.name}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-navy-500">Actors</dt>
          <dd className="font-medium text-navy-800">{situation.actors?.length ?? 0}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-navy-500">Sources</dt>
          <dd className="font-medium text-navy-800">{situation.sourceUrls?.length ?? 0}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-navy-500">Documents</dt>
          <dd className="font-medium text-navy-800">{situation.documentCount ?? 0}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-navy-500">Graph entities</dt>
          <dd className="font-medium text-navy-800">{situation.graphEntities ?? 0}</dd>
        </div>
      </dl>

      {situation.updatedAt && (
        <p className="mt-3 text-[10px] text-navy-400">
          Last updated {new Date(situation.updatedAt).toLocaleString()}
        </p>
      )}

      <div className="mt-4 rounded-lg border border-navy-100 bg-navy-50/40 p-3 text-[11px] text-navy-600">
        <p className="flex items-center gap-1 font-semibold text-navy-800">
          <Info className="h-3 w-3" /> Changes apply instantly
        </p>
        <p className="mt-1 leading-relaxed">
          Each save writes directly to Firestore. The next tool run against this situation picks up
          your edits automatically.
        </p>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function SituationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const route = usePraxisRoute();
  const { user } = useAuth();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const [tab, setTab] = useState<TabId>('context');
  const [situation, setSituation] = useState<Situation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch(`/api/situations/${id}`);
        if (!res.ok) {
          const msg = res.status === 404 ? 'Situation not found.' : 'Failed to load situation.';
          if (!cancelled) {
            setLoadError(msg);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as { situation: Situation };
        if (cancelled) return;
        setSituation(data.situation);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setLoadError('Network error — please check your connection.');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const patchSituation = useCallback(
    async (patch: Partial<Situation>): Promise<boolean> => {
      if (!id) return false;
      try {
        const res = await fetch(`/api/situations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) return false;
        // Optimistic local update
        setSituation((prev) => (prev ? ({ ...prev, ...patch, updatedAt: new Date().toISOString() } as Situation) : prev));
        return true;
      } catch {
        return false;
      }
    },
    [id],
  );

  const handleDeleted = useCallback(() => {
    router.replace(route('/dashboard'));
  }, [router, route]);

  if (user?.isDemo) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 text-sm text-navy-800">
        <p className="font-semibold text-gold-700">Demo mode</p>
        <p className="mt-2 text-navy-600">
          Situation settings are only available for real accounts. Sign in with a TACITUS account to edit
          situations.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-navy-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading situation…
      </div>
    );
  }

  if (loadError || !situation) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-4">
        <PraxisLink
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </PraxisLink>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadError ?? 'Situation not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Breadcrumb + header */}
      <div>
        <PraxisLink
          href="/dashboard"
          className="mb-2 inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </PraxisLink>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">{situation.name}</h1>
            <p className="mt-1 max-w-xl text-sm text-navy-500">
              Edit the context, actors, sources and preferences that every AI tool run pulls from.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs + layout */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <nav
            className="mb-4 flex flex-wrap gap-1 rounded-lg border border-navy-200 bg-white p-1"
            role="tablist"
            aria-label="Situation settings sections"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 focus-visible:ring-offset-1',
                    active
                      ? t.id === 'danger'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-diplomatic-blue text-white shadow-sm'
                      : 'text-navy-600 hover:bg-navy-50',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="rounded-xl border border-navy-200 bg-white p-6 shadow-sm">
            {tab === 'context' && <ContextTab situation={situation} onPatch={patchSituation} />}
            {tab === 'domain' && <DomainTab situation={situation} onPatch={patchSituation} />}
            {tab === 'actors' && <ActorsTab situation={situation} onPatch={patchSituation} />}
            {tab === 'sources' && <SourcesTab situation={situation} onPatch={patchSituation} />}
            {tab === 'preferences' && <PreferencesTab situation={situation} onPatch={patchSituation} />}
            {tab === 'danger' && (
              <DangerZoneTab situation={situation} onPatch={patchSituation} onDeleted={handleDeleted} />
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SituationSummaryCard situation={situation} />
        </aside>
      </div>
    </div>
  );
}
