'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock3, ExternalLink, FileText, Library, ShieldCheck } from 'lucide-react';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { SAMPLE_POLICY_ARTIFACTS } from '@/lib/product/sample-policy-artifacts';

type CreatedWorkItem = {
  id: string;
  title: string;
  href: string;
  kind: string;
  status: string;
  createdAt: string;
  capsuleId: string | null;
  receiptIds: string[];
};

export function RecentPolicyWorkPage() {
  const [items, setItems] = useState<CreatedWorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch('/api/created-work?limit=24', {
          credentials: 'include',
          cache: 'no-store',
        });
        const payload = response.ok ? await response.json().catch(() => ({})) : {};
        const next = Array.isArray(payload?.items)
          ? payload.items.flatMap((item: Record<string, unknown>) => {
              const action = isRecord(item.primaryAction) ? item.primaryAction : {};
              const id = stringField(item.id);
              const title = stringField(item.title) ?? stringField(item.label);
              const href = stringField(item.href) ?? stringField(action.href);
              if (!id || !title || !href) return [];
              return [{
                id,
                title,
                href,
                kind: stringField(item.kind) ?? 'work',
                status: stringField(item.status) ?? 'ready',
                createdAt: stringField(item.createdAt) ?? '',
                capsuleId: stringField(item.capsuleId),
                receiptIds: Array.isArray(item.receiptIds) ? item.receiptIds.filter((value): value is string => typeof value === 'string') : [],
              }];
            })
          : [];
        if (!cancelled) setItems(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="civic-atelier-shell praxis-checker-constellation min-h-screen text-slate-950" data-testid="recent-work-page">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/app" className="min-w-0">
            <PraxisBrandChip compact />
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500" aria-label="Recent work navigation">
            <Link href="/app" className="hover:text-slate-950">Ask PRAXIS</Link>
            <Link href="/app/capsules" className="hover:text-slate-950">Your capsules</Link>
            <Link href="/app/capsules?lane=marketplace" className="hover:text-slate-950">Marketplace</Link>
            <Link href="/learn" className="hover:text-slate-950">Learn</Link>
            <Link href="/release-notes" className="hover:text-slate-950">Changelog</Link>
          </nav>
        </header>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
          <Link href="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Back to Ask PRAXIS
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">
                <Clock3 className="h-3.5 w-3.5" />
                Recent work
              </p>
              <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Policy artifacts, runs, and drafts.
              </h1>
            </div>
            <Link href="/app/capsules" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Library className="h-4 w-4" />
              Open capsules
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="grid gap-3">
              {loading ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-4 text-sm text-slate-500">Loading recent work...</p>
              ) : null}
              {!loading && items.length ? items.map((item) => (
                <Link key={`${item.kind}:${item.id}`} href={item.href} className="rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-4 hover:bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.kind}</p>
                      <h2 className="mt-1 truncate text-base font-semibold text-slate-950">{item.title}</h2>
                    </div>
                    <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span className="rounded-md bg-white px-2 py-1">{item.capsuleId ?? 'no capsule'}</span>
                    <span className="rounded-md bg-white px-2 py-1">{item.receiptIds.length} receipt{item.receiptIds.length === 1 ? '' : 's'}</span>
                    {item.createdAt ? <span className="rounded-md bg-white px-2 py-1">{formatDate(item.createdAt)}</span> : null}
                  </div>
                </Link>
              )) : null}
              {!loading && !items.length ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-4">
                  <p className="text-sm font-semibold text-slate-950">No saved work yet.</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Use the PRAXIS samples on the right to start a capsule-aware policy artifact.</p>
                </div>
              ) : null}
            </section>

            <aside className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[color:var(--color-oxide)]" />
                <h2 className="text-sm font-semibold text-slate-950">Sample PRAXIS artifacts</h2>
              </div>
              <div className="mt-3 grid gap-3">
                {SAMPLE_POLICY_ARTIFACTS.map((artifact) => (
                  <article key={artifact.id} className="rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-oxide)]" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{artifact.type}</p>
                        <h3 className="mt-1 text-sm font-semibold leading-5 text-slate-950">{artifact.title}</h3>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{artifact.summary}</p>
                    <div className="mt-2 grid gap-1">
                      {artifact.sources.map((source) => (
                        <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 text-xs font-semibold text-[color:var(--color-civic-blue)] hover:text-slate-950">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{source.label}</span>
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
