'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BriefcaseBusiness, ChevronDown, Clock3, FileText, Library, Sparkles } from 'lucide-react';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { PENDING_TASKLET_PROMPT_KEY } from '@/lib/product/policy-agents';

type RecentWork = {
  id: string;
  label: string;
  href: string;
  kind: string;
};

export function PraxisAppLaunchpad() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') ?? searchParams.get('capsulePrompt') ?? '';
  const [prompt, setPrompt] = useState(initialPrompt);
  const [recentWork, setRecentWork] = useState<RecentWork[]>([]);
  const capsuleLabel = useMemo(() => 'Verified policy capsule', []);

  useEffect(() => {
    let cancelled = false;
    async function loadRecentWork() {
      try {
        const response = await fetch('/api/created-work?limit=4', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        const items = Array.isArray(payload?.items) ? payload.items : [];
        if (cancelled) return;
        setRecentWork(items.slice(0, 4).flatMap((item: Record<string, unknown>) => {
          const id = typeof item.id === 'string' ? item.id : null;
          const label = typeof item.title === 'string' ? item.title : typeof item.label === 'string' ? item.label : null;
          const href = typeof item.href === 'string' ? item.href : null;
          const kind = typeof item.kind === 'string' ? item.kind : 'work';
          return id && label && href ? [{ id, label, href, kind }] : [];
        }));
      } catch {
        if (!cancelled) setRecentWork([]);
      }
    }
    void loadRecentWork();
    return () => {
      cancelled = true;
    };
  }, []);

  function submitLaunchpad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed) {
      window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, trimmed);
    }
    const params = new URLSearchParams();
    if (trimmed) params.set('prompt', trimmed);
    params.set('workspace', 'research');
    router.push(`/app/capsules?${params.toString()}`);
  }

  return (
    <main className="civic-atelier-shell praxis-checker-constellation min-h-screen text-slate-950" data-testid="app-launchpad">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/app" className="min-w-0">
            <PraxisBrandChip compact />
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold text-slate-500" aria-label="Workspace navigation">
            <Link href="/app/capsules" className="hover:text-slate-950">Your capsules</Link>
            <Link href="/app/capsules?lane=marketplace" className="hover:text-slate-950">Marketplace</Link>
            <Link href="/app/settings" className="hover:text-slate-950">Settings</Link>
          </nav>
        </header>

        <section className="mx-auto mt-16 w-full max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-clay)]/25 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">
            <Sparkles className="h-3.5 w-3.5" />
            Workspace
          </p>
          <h1 className="mt-6 font-serif text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            What do you want to analyze?
          </h1>
          <form onSubmit={submitLaunchpad} className="mx-auto mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl shadow-slate-200/60">
            <button
              type="button"
              data-testid="launchpad-capsule-chip"
              onClick={() => router.push('/app/capsules')}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
            >
              <Library className="h-3.5 w-3.5 text-[color:var(--color-oxide)]" />
              {capsuleLabel}
            </button>
            <label className="sr-only" htmlFor="launchpad-prompt">Analysis prompt</label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <textarea
                id="launchpad-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={3}
                className="min-w-0 resize-none rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-4 py-3 text-base leading-7 text-slate-950 outline-none placeholder:text-slate-400 focus:border-[color:var(--color-oxide)] focus:bg-white"
                placeholder="Ask for a sourced brief, options memo, actor map, or evidence gap check."
              />
              <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                Start research run
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>

        <section className="mx-auto mt-10 grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm" data-testid="launchpad-recent-work">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[color:var(--color-oxide)]" />
                <h2 className="text-sm font-semibold text-slate-950">Recent work</h2>
              </div>
              <Link href="/app/capsules?tab=work" className="text-xs font-semibold text-slate-500 hover:text-slate-950">See all</Link>
            </div>
            <div className="mt-3 grid gap-2">
              {recentWork.length ? recentWork.map((item) => (
                <Link key={item.id} href={item.href} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-[color:var(--color-archive-paper-strong)] px-3 py-2 text-sm hover:bg-white">
                  <span className="min-w-0 truncate font-semibold text-slate-800">{item.label}</span>
                  <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.kind}</span>
                </Link>
              )) : (
                <p className="rounded-lg border border-dashed border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-4 text-sm text-slate-500">
                  Your latest briefs, runs, and capsule outputs will appear here after your first run.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <QuietLink href="/app/capsules" icon={Library} label="Your capsules" />
            <QuietLink href="/app/capsules?lane=marketplace" icon={BriefcaseBusiness} label="Browse marketplace" />
            <QuietLink href="/app/capsules?tab=work" icon={FileText} label="Recent work" />
          </div>
        </section>

        <details className="mx-auto mt-5 w-full max-w-5xl rounded-xl border border-slate-200 bg-white/75 p-4" data-testid="advanced-edit-context">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-800">
            Advanced / Edit context
            <ChevronDown className="h-4 w-4" />
          </summary>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-5">
            {['User core', 'Situation', 'Sources', 'Thinking devices', 'Output'].map((label) => (
              <span key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">{label}</span>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}

function QuietLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Library;
  label: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-white">
      <Icon className="h-4 w-4 text-[color:var(--color-oxide)]" />
      {label}
    </Link>
  );
}
