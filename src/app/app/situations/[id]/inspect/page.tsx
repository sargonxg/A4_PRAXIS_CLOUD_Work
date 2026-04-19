'use client';

/**
 * /app/situations/[id]/inspect — Situation Inspector (read-only).
 *
 * Shows EVERYTHING stored about an active situation: metadata, description,
 * actors, sources, documents (with extracted-text previews), tools output
 * cache, episodes (if any — currently omitted), full merged domain config,
 * and raw Firestore JSON in a collapsible section at the bottom.
 */

import { use, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Compass,
  Database,
  FileText,
  Globe,
  Loader2,
  Network,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useAuth } from '@/lib/auth/auth-context';
import { LENS_CATALOG } from '@/lib/constants/lens-catalog';
import { LENSES, type Lens } from '@/types/analyst-profile';
import type { MergedDomainConfig } from '@/types/domain';
import type { Situation } from '@/types/situation';
import { cn } from '@/lib/utils/cn';

interface DocumentPreview {
  id: string;
  name: string;
  size: number;
  extractedTextPreview: string;
  status?: string;
  uploadedAt?: string;
}

interface ToolCacheEntry {
  toolId: string;
  generatedAt: unknown;
  profileVersion: number | null;
}

interface InspectPayload {
  situation: Situation;
  documents: DocumentPreview[];
  toolsCache: ToolCacheEntry[];
  episodes: unknown[] | null;
  resolvedDomain: MergedDomainConfig;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let idx = 0;
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024;
    idx++;
  }
  return `${n.toFixed(n >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function formatTimestamp(value: unknown): string {
  if (!value) return '—';
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    const v = value as { _seconds?: number; seconds?: number };
    const secs = v._seconds ?? v.seconds;
    if (typeof secs === 'number') return new Date(secs * 1000).toLocaleString();
  }
  return '—';
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  rightSlot,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-diplomatic-blue/10 text-diplomatic-blue">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
            {subtitle && <p className="text-[11px] text-navy-500">{subtitle}</p>}
          </div>
        </div>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg bg-navy-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold text-navy-900', valueClass)}>{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-diplomatic-blue/25 bg-diplomatic-blue/10 px-2 py-0.5 text-[11px] font-medium text-diplomatic-blue">
      {children}
    </span>
  );
}

function LensWeightsChart({ weights }: { weights: Record<Lens, number> }) {
  const maxWeight = Math.max(...LENSES.map((l) => weights[l] ?? 1.0), 1.0);
  return (
    <div className="space-y-1.5">
      {LENSES.map((lens) => {
        const w = weights[lens] ?? 1.0;
        const pct = Math.min(100, (w / maxWeight) * 100);
        const def = LENS_CATALOG[lens];
        return (
          <div key={lens} className="grid grid-cols-[110px_1fr_40px] items-center gap-2">
            <span className="text-[11px] font-medium text-navy-700">{def.label}</span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: def.color }}
              />
            </div>
            <span className="text-right font-mono text-[10px] tabular-nums text-navy-500">
              {w.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SituationInspectorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<InspectPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => {
    if (!user?.id || !id) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/situations/${encodeURIComponent(id)}/inspect`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((body: InspectPayload) => {
        if (!cancelled) {
          setData(body);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, id]);

  if (user?.isDemo) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 text-sm text-navy-800">
        <p className="font-semibold text-gold-700">Demo mode</p>
        <p className="mt-2 text-navy-600">
          The situation inspector is available for authenticated users only.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-navy-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading situation data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-crimson/30 bg-crimson/5 p-6 text-sm text-navy-800">
        <p className="font-semibold text-crimson">Could not load situation</p>
        <p className="mt-2 text-navy-600">{error ?? 'Unknown error.'}</p>
        <PraxisLink
          href="/dashboard"
          className="mt-3 inline-flex items-center gap-1 text-xs text-diplomatic-blue hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </PraxisLink>
      </div>
    );
  }

  const { situation, documents, toolsCache, episodes, resolvedDomain } = data;
  const confidencePct =
    typeof situation.domainConfidence === 'number'
      ? Math.round(situation.domainConfidence * 100)
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Header */}
      <div>
        <PraxisLink
          href="/dashboard"
          className="mb-2 inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </PraxisLink>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Database className="h-4 w-4 text-diplomatic-blue" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-diplomatic-blue">
                Situation inspector
              </p>
            </div>
            <h1 className="text-2xl font-semibold text-navy-900">{situation.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-navy-500">
              Everything currently stored about this situation — what the AI reads before every
              tool run. Read-only.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-[11px] font-medium text-diplomatic-blue capitalize">
              {situation.type.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-navy-400">
              Updated {formatTimestamp(situation.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Section
        icon={Compass}
        title="Overview"
        subtitle="Metadata + domain classification"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Domain"
            value={resolvedDomain.name}
            valueClass="text-diplomatic-blue"
          />
          <StatTile
            label="Classification confidence"
            value={confidencePct !== null ? `${confidencePct}%` : '—'}
          />
          <StatTile label="Domain version" value={`v${resolvedDomain.version}`} />
          <StatTile
            label="Classified at"
            value={
              <span className="text-xs font-medium text-navy-700">
                {situation.domainClassifiedAt
                  ? formatTimestamp(situation.domainClassifiedAt)
                  : '—'}
              </span>
            }
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatTile label="Status" value={situation.status} />
          <StatTile
            label="Glasl stage"
            value={situation.glaslStage ? `${situation.glaslStage}/9` : '—'}
          />
          <StatTile
            label="Risk score"
            value={
              typeof situation.riskScore === 'number' ? situation.riskScore.toFixed(1) : '—'
            }
          />
        </div>

        {situation.description && (
          <div className="mt-4 rounded-lg border border-navy-100 bg-navy-50/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              Description
            </p>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-navy-700">
              {situation.description}
            </p>
          </div>
        )}

        {situation.region && (
          <div className="mt-3 flex items-center gap-2 text-xs text-navy-600">
            <Globe className="h-3.5 w-3.5 text-navy-400" />
            {situation.region}
          </div>
        )}

        {situation.domainOverriddenByUser && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            Domain manually overridden by user
          </div>
        )}
      </Section>

      {/* Actors */}
      <Section
        icon={Users}
        title="Actors"
        subtitle={`${situation.actors.length} listed`}
      >
        {situation.actors.length === 0 ? (
          <p className="text-sm text-navy-400">No actors recorded.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {situation.actors.map((a) => (
              <Chip key={a}>{a}</Chip>
            ))}
          </div>
        )}
      </Section>

      {/* Sources + Documents */}
      <Section
        icon={FileText}
        title="Sources &amp; documents"
        subtitle={`${situation.sourceUrls?.length ?? 0} source URLs · ${documents.length} stored documents`}
      >
        {(situation.sourceUrls?.length ?? 0) > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              Source URLs
            </p>
            <ul className="space-y-1 text-xs text-navy-700">
              {situation.sourceUrls!.map((url) => (
                <li key={url} className="truncate">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-diplomatic-blue hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {documents.length === 0 ? (
          <p className="text-sm text-navy-400">
            No documents have been uploaded or ingested for this situation.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-navy-100 bg-navy-50/30 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-900">{d.name}</p>
                    <p className="mt-0.5 text-[10px] text-navy-500">
                      {formatBytes(d.size)}
                      {d.status && <span className="ml-2 capitalize">· {d.status}</span>}
                      {d.uploadedAt && (
                        <span className="ml-2">· {formatTimestamp(d.uploadedAt)}</span>
                      )}
                    </p>
                  </div>
                </div>
                {d.extractedTextPreview && (
                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-[11px] leading-relaxed text-navy-600">
                    {d.extractedTextPreview}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Episodes — conditional, currently always null in v1 */}
      {episodes !== null && (
        <Section
          icon={ClipboardList}
          title="Episodes"
          subtitle={`${episodes.length} recorded`}
        >
          {episodes.length === 0 ? (
            <p className="text-sm text-navy-400">No episodes recorded.</p>
          ) : (
            <pre className="max-h-72 overflow-auto rounded-lg bg-navy-900 p-3 text-[11px] text-emerald-300">
              {JSON.stringify(episodes, null, 2)}
            </pre>
          )}
        </Section>
      )}

      {/* Tool output cache */}
      <Section
        icon={Network}
        title="Tool output cache"
        subtitle={`${toolsCache.length} tool${toolsCache.length === 1 ? '' : 's'} populated`}
      >
        {toolsCache.length === 0 ? (
          <p className="text-sm text-navy-400">
            No tool outputs have been cached for this situation yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-navy-100">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-navy-50 text-[10px] uppercase tracking-wider text-navy-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tool ID</th>
                  <th className="px-3 py-2 font-semibold">Last generated</th>
                  <th className="px-3 py-2 font-semibold">Profile version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {toolsCache.map((t) => (
                  <tr key={t.toolId} className="hover:bg-navy-50/40">
                    <td className="px-3 py-2 font-mono text-navy-900">{t.toolId}</td>
                    <td className="px-3 py-2 text-navy-700">
                      {formatTimestamp(t.generatedAt)}
                    </td>
                    <td className="px-3 py-2 text-navy-700">
                      {t.profileVersion !== null ? `v${t.profileVersion}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Resolved domain (full config) */}
      <Section
        icon={Compass}
        title="Resolved domain config"
        subtitle="Merged with generic baseline"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: resolvedDomain.colorHex }}
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-navy-900">{resolvedDomain.name}</p>
                <p className="text-[10px] text-navy-500">
                  id: <code className="font-mono">{resolvedDomain.id}</code> · v
                  {resolvedDomain.version}
                </p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-navy-600">
              {resolvedDomain.description}
            </p>

            <div className="mt-4 space-y-3 text-[11px]">
              <div>
                <p className="font-semibold text-navy-700">Preferred feeds</p>
                <p className="mt-0.5 text-navy-500">
                  {resolvedDomain.preferredFeeds.length > 0
                    ? resolvedDomain.preferredFeeds.join(', ')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-navy-700">Frameworks</p>
                <p className="mt-0.5 text-navy-500">
                  {resolvedDomain.frameworks.length > 0
                    ? resolvedDomain.frameworks.join(', ')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-navy-700">Default audience</p>
                <p className="mt-0.5 text-navy-500">
                  {resolvedDomain.defaultAudience ?? '—'}
                </p>
              </div>
            </div>

            {resolvedDomain.inheritanceTrace && (
              <div className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-[10px] text-navy-500">
                <p>
                  Inherits from{' '}
                  <span className="font-mono text-navy-700">
                    {resolvedDomain.inheritanceTrace.parent ?? 'none'}
                  </span>
                </p>
                {resolvedDomain.inheritanceTrace.overriddenFields.length > 0 && (
                  <p className="mt-0.5">
                    Overridden: {resolvedDomain.inheritanceTrace.overriddenFields.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
              Lens weights
            </p>
            <LensWeightsChart weights={resolvedDomain.lensWeights} />
          </div>
        </div>
      </Section>

      {/* Raw JSON */}
      <section className="rounded-xl border border-navy-200 bg-white shadow-sm">
        <button
          onClick={() => setRawOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          aria-expanded={rawOpen}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-100 text-navy-600">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-navy-900">Raw Firestore JSON</h2>
              <p className="text-[11px] text-navy-500">
                Exact document at{' '}
                <code className="font-mono">users/{'{uid}'}/situations/{situation.id}</code>
              </p>
            </div>
          </div>
          {rawOpen ? (
            <ChevronDown className="h-4 w-4 text-navy-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-navy-400" />
          )}
        </button>
        {rawOpen && (
          <div className="border-t border-navy-100 p-5">
            <pre className="max-h-96 overflow-auto rounded-lg bg-navy-900 p-4 text-[11px] leading-relaxed text-emerald-300">
              {JSON.stringify(situation, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
