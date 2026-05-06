'use client';

/**
 * /app/library — workspace artifact explorer.
 *
 * Single landing surface for everything the workspace has produced:
 * memos, briefs, source packs, stakeholder exports, commitments scans,
 * humanitarian readouts. Pulls from /api/artifacts/list, which mirrors
 * Firestore metadata + the GCS bucket. Demo mode returns a Syria-rich
 * fixture so the recording walkthrough has real substance.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookText,
  CalendarDays,
  Cloud,
  ExternalLink,
  Filter,
  FileSearch,
  FileText,
  Library as LibraryIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { PraxisLink } from '@/components/shared/praxis-link';
import { isSyriaWorkspaceCase } from '@/lib/constants/syria-demo-case';
import { resolveCaseTemplate } from '@/lib/constants/cases';
import { getDemoTemplate } from '@/lib/constants/demo-templates';
import { cn } from '@/lib/utils/cn';

interface ArtifactEntry {
  id: string;
  title: string;
  toolId: string;
  bucketUri?: string;
  objectPath?: string;
  size?: number;
  contentType?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface LibraryResponse {
  mode: 'demo' | 'live' | 'fallback';
  artifacts: ArtifactEntry[];
  bucket?: string;
  error?: string;
}

const TOOL_LABEL: Record<string, string> = {
  editor: 'Editor',
  briefing: 'Briefing Studio',
  'source-scout': 'Sources & Research',
  'stakeholder-map': 'Stakeholders',
  commitments: 'Commitments',
  humanitarian: 'Humanitarian',
  'policy-memo': 'Policy Memo',
  'conflict-graph': 'Conflict Graph',
  graphops: 'GraphOps',
  timeline: 'Timeline',
  advisory: 'Advisory Council',
  sanctions: 'Sanctions Monitor',
};

const TOOL_HREF: Record<string, string> = {
  editor: '/editor',
  briefing: '/briefing',
  'source-scout': '/source-scout',
  'stakeholder-map': '/stakeholder-map',
  commitments: '/commitments',
  humanitarian: '/humanitarian',
  'policy-memo': '/policy-memo',
  'conflict-graph': '/conflict-graph',
  graphops: '/graphops',
  timeline: '/timeline',
  advisory: '/advisory',
  sanctions: '/sanctions',
};

export default function LibraryPage() {
  const guard = useSituationGuard();
  const searchParams = useSearchParams();
  const caseParam = searchParams.get('case');
  const isSyriaCase = isSyriaWorkspaceCase(caseParam, guard.isDemo);
  const genericTemplate = resolveCaseTemplate(caseParam);
  const templateMeta = getDemoTemplate(caseParam);

  const [data, setData] = useState<LibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<{ state: 'idle' | 'uploading' | 'success' | 'error'; message?: string }>({ state: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (guard.situation?.id) params.set('situationId', guard.situation.id);
      const res = await fetch(`/api/artifacts/list?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json()) as LibraryResponse;
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.situation?.id]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (guard.isDemo) {
      setUploadStatus({ state: 'error', message: 'Demo mode: uploads simulated. Sign in to push to the bucket.' });
      setTimeout(() => setUploadStatus({ state: 'idle' }), 4000);
      return;
    }
    if (!guard.situation?.id) {
      setUploadStatus({ state: 'error', message: 'Pick an active situation before uploading.' });
      return;
    }
    setUploadStatus({ state: 'uploading' });
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('situationId', guard.situation.id);
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setUploadStatus({ state: 'success', message: `${file.name} uploaded and synced to bucket.` });
      void load();
    } catch (e) {
      setUploadStatus({ state: 'error', message: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadStatus({ state: 'idle' }), 4000);
    }
  };

  const artifacts = data?.artifacts ?? [];
  const filtered = useMemo(() => {
    return artifacts.filter((a) => {
      if (filter !== 'all' && a.toolId !== filter) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [artifacts, filter, search]);

  const stats = useMemo(() => {
    const totalSize = artifacts.reduce((s, a) => s + (a.size ?? 0), 0);
    const byTool = new Map<string, number>();
    artifacts.forEach((a) => byTool.set(a.toolId, (byTool.get(a.toolId) ?? 0) + 1));
    return {
      total: artifacts.length,
      totalSizeKb: Math.round(totalSize / 1024),
      byTool: Array.from(byTool.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [artifacts]);

  if (guard.needsOnboarding) return <OnboardingRequiredState />;

  return (
    <div className="space-y-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
            <LibraryIcon className="h-3.5 w-3.5" /> Workspace artifacts
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-navy-900">Library</h1>
          <p className="mt-1 text-sm text-navy-500">
            {isSyriaCase
              ? 'Syria post-Assad case file: every memo, brief, source pack, stakeholder export, and humanitarian readout this workspace has produced.'
              : 'Every artifact PRAXIS has produced for this workspace — drafts, briefs, exports, and source packs synced to your bucket.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.html"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadStatus.state === 'uploading'}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            {uploadStatus.state === 'uploading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload to bucket
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
          </button>
          <PraxisLink
            href="/editor"
            className="inline-flex items-center gap-1.5 rounded-md bg-diplomatic-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-diplomatic-blue/90"
          >
            <Sparkles className="h-3.5 w-3.5" /> Open editor
          </PraxisLink>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        <PraxisLink href="/library/sources" className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50">
          Sources
        </PraxisLink>
        <PraxisLink href="/library/work-products" className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50">
          Work products
        </PraxisLink>
      </nav>

      {uploadStatus.state !== 'idle' && uploadStatus.message && (
        <div
          className={cn(
            'rounded-md border px-3 py-2 text-xs',
            uploadStatus.state === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
            uploadStatus.state === 'error' && 'border-rose-200 bg-rose-50 text-rose-700',
            uploadStatus.state === 'uploading' && 'border-amber-200 bg-amber-50 text-amber-800',
          )}
        >
          {uploadStatus.message}
        </div>
      )}

      {/* Case-aware document set — shown when a generic template is active. */}
      {genericTemplate && templateMeta && (
        <section className="rounded-lg border border-gold-200 bg-gold-50/40 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl leading-none" aria-hidden>{templateMeta.flag}</span>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">
              Case documents · {templateMeta.shortName}
            </p>
            <span className="text-[11px] text-navy-700">{genericTemplate.documents.length} document{genericTemplate.documents.length === 1 ? '' : 's'}</span>
          </div>
          <p className="mt-1 text-[12px] text-navy-700">{genericTemplate.subtitle}</p>
          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {genericTemplate.documents.map((doc) => (
              <li key={doc.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-navy-900">{doc.title}</p>
                    <p className="text-[10px] text-navy-500">{doc.publisher} · {doc.publishedAt} · {doc.type}</p>
                  </div>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-navy-700 hover:border-navy-400 hover:text-navy-900"
                    >
                      Open <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-4 text-navy-600">{doc.summary}</p>
                {doc.tags && doc.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.tags.map((t) => (
                      <span key={t} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-600">{t}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Artifacts" value={String(stats.total)} icon={FileText} tone="blue" />
        <StatTile label="Total size" value={`${stats.totalSizeKb} KB`} icon={Cloud} tone="emerald" />
        <StatTile label="Producing tools" value={String(stats.byTool.length)} icon={BookText} tone="amber" />
        <StatTile
          label="Bucket"
          value={data?.bucket ?? '—'}
          icon={Cloud}
          tone="indigo"
          subtle
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-navy-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-navy-800 focus:border-diplomatic-blue focus:outline-none"
          >
            <option value="all">All tools</option>
            {stats.byTool.map(([toolId, count]) => (
              <option key={toolId} value={toolId}>
                {(TOOL_LABEL[toolId] ?? toolId)} · {count}
              </option>
            ))}
          </select>
          <div className="relative ml-auto">
            <FileSearch className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artifacts…"
              className="w-64 rounded-md border border-slate-200 bg-slate-50 pl-7 pr-3 py-1.5 text-xs text-navy-800 focus:border-diplomatic-blue focus:outline-none"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-rose-600">Library failed to load: {error}</p>
        ) : null}

        {loading && artifacts.length === 0 ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-navy-500">
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading library…
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-navy-700">
              No artifacts yet. Generate a brief, draft a memo, or save a source pack — everything you produce will land here.
            </p>
            <PraxisLink
              href="/editor"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-diplomatic-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-diplomatic-blue/90"
            >
              <Sparkles className="h-3.5 w-3.5" /> Open editor
            </PraxisLink>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
            {filtered.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <FileText className="h-4 w-4 shrink-0 text-diplomatic-blue" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-navy-900">{a.title}</p>
                    <span className="rounded-full bg-diplomatic-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">
                      {TOOL_LABEL[a.toolId] ?? a.toolId}
                    </span>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-navy-500">
                    <CalendarDays className="h-3 w-3" />
                    {a.updatedAt ? new Date(a.updatedAt).toLocaleString() : '—'}
                    {a.size ? <span>· {Math.round(a.size / 1024)} KB</span> : null}
                    {a.bucketUri ? (
                      <span className="inline-flex items-center gap-1">
                        · <Cloud className="h-3 w-3" /> {a.bucketUri.replace(/^gs:\/\//, '')}
                      </span>
                    ) : null}
                  </p>
                </div>
                {TOOL_HREF[a.toolId] && (
                  <PraxisLink
                    href={`${TOOL_HREF[a.toolId]}${isSyriaCase ? '?recording=1&case=syria' : ''}`}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-navy-700 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                  >
                    Open in tool <ArrowRight className="h-3 w-3" />
                  </PraxisLink>
                )}
                {a.bucketUri && !a.bucketUri.startsWith('demo://') ? (
                  <a
                    href={`https://console.cloud.google.com/storage/browser/_details/${(a.bucketUri || '').replace(/^gs:\/\//, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-navy-700 hover:border-diplomatic-blue/40"
                  >
                    Bucket <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-navy-900">Where artifacts go</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-navy-600">
          Every saved brief, memo, source pack, stakeholder export, and humanitarian readout is mirrored to the
          PRAXIS GCS bucket (<code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">{data?.bucket ?? 'praxisbytacitus.appspot.com'}</code>).
          Metadata is indexed in Firestore at <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">users/&#123;uid&#125;/situations/&#123;sitId&#125;/artifacts</code> for
          fast retrieval. The Document Dashboard (<PraxisLink href="/documents" className="text-diplomatic-blue underline">Documents</PraxisLink>) shows
          your uploaded source corpus alongside generated artifacts so analysts can audit provenance end-to-end.
        </p>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  subtle,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'blue' | 'emerald' | 'amber' | 'indigo';
  subtle?: boolean;
}) {
  const toneClass: Record<string, string> = {
    blue: 'border-diplomatic-blue/20 bg-diplomatic-blue/5 text-diplomatic-blue',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  };
  return (
    <div className={cn('rounded-md border p-3', toneClass[tone])}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className={cn('mt-1 font-bold text-navy-900', subtle ? 'text-sm break-all' : 'text-xl')}>{value}</p>
    </div>
  );
}
