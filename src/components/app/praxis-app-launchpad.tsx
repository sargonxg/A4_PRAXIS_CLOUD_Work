'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  History,
  Info,
  Layers3,
  Library,
  MessageSquareText,
  PlusCircle,
  SearchCheck,
  SendHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { CapsuleListPicker } from '@/components/cores/CapsuleListPicker';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { PENDING_TASKLET_PROMPT_KEY } from '@/lib/product/policy-agents';
import { POLICY_MISSION_EXAMPLES } from '@/lib/product/policy-missions';
import { SAMPLE_POLICY_ARTIFACTS, type SamplePolicyArtifact } from '@/lib/product/sample-policy-artifacts';
import type { ActiveContextBlocks } from '@/lib/context/active-context-stack';

type RecentWork = {
  id: string;
  label: string;
  href: string;
  kind: string;
};

const OUTPUT_TARGETS = [
  'Policy memo',
  'Briefing note',
  'Options memo',
  'Compliance note',
  'Stakeholder map',
];

const SIDEBAR_LINKS = [
  { href: '/app', label: 'Ask PRAXIS', icon: MessageSquareText },
  { href: '/app/capsules', label: 'Your capsules', icon: Library },
  { href: '/app/capsules?lane=marketplace', label: 'Marketplace', icon: BriefcaseBusiness },
  { href: '/app/recent-work', label: 'Recent work', icon: FileText },
  { href: '/app/boardroom', label: 'Boardroom', icon: ShieldCheck },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/release-notes', label: 'Changelog', icon: History },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export function PraxisAppLaunchpad() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') ?? searchParams.get('capsulePrompt') ?? '';
  const [prompt, setPrompt] = useState(initialPrompt);
  const [recentWork, setRecentWork] = useState<RecentWork[]>([]);
  const [savingContext, setSavingContext] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const { stack, saveStack, persisted, hydrated } = useActiveContextStack();
  const capsuleLabel = useMemo(() => (
    stack.capsuleId ? `Using ${shortenContextId(stack.capsuleId)}` : 'Add a capsule'
  ), [stack.capsuleId]);
  const sourceCount = stack.sourceIds.length + stack.documentIds.length;
  const contextBlockCount = Object.values(stack.contextBlocks).reduce((sum, items) => sum + items.length, 0);
  const visibleRecentWork = recentWork.slice(0, 4);

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
          const action = isRecord(item.primaryAction) ? item.primaryAction : {};
          const id = typeof item.id === 'string' ? item.id : null;
          const label = typeof item.title === 'string' ? item.title : typeof item.label === 'string' ? item.label : null;
          const href = typeof item.href === 'string'
            ? item.href
            : typeof action.href === 'string'
              ? action.href
              : null;
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
    const params = buildContextParams(trimmed);
    router.push(`/app/capsules/builder?${params.toString()}`);
  }

  function openBoardroom() {
    const params = buildContextParams(prompt.trim());
    router.push(`/app/boardroom?${params.toString()}`);
  }

  function buildContextParams(trimmedPrompt: string) {
    const params = new URLSearchParams();
    if (trimmedPrompt) {
      params.set('prompt', trimmedPrompt);
      params.set('capsulePrompt', trimmedPrompt);
    }
    if (stack.capsuleId) params.set('capsuleId', stack.capsuleId);
    if (stack.stackId && stack.stackId !== 'default') params.set('contextStackId', stack.stackId);
    return params;
  }

  async function activateCapsule(capsuleId: string) {
    setSavingContext(true);
    try {
      await saveStack({
        stackId: capsuleId,
        capsuleId,
      });
    } finally {
      setSavingContext(false);
    }
  }

  async function setOutputTarget(target: string) {
    const outputId = target.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setSavingContext(true);
    try {
      await saveStack({
        outputGoal: target,
        contextBlocks: {
          ...stack.contextBlocks,
          output: [{
            id: outputId,
            capsuleId: stack.capsuleId,
            label: target,
            role: 'output',
            primary: true,
            order: 0,
          }],
        } satisfies ActiveContextBlocks,
      });
    } finally {
      setSavingContext(false);
    }
  }

  function applySampleArtifact(artifact: SamplePolicyArtifact) {
    setPrompt(artifact.prompt);
    window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, artifact.prompt);
  }

  return (
    <main className="civic-atelier-shell praxis-checker-constellation min-h-screen text-slate-950" data-testid="app-launchpad">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/app" className="min-w-0">
            <PraxisBrandChip compact />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-4 text-sm font-semibold text-slate-500" aria-label="Workspace navigation">
            <Link href="/learn" className="hover:text-slate-950">Learn</Link>
            <Link href="/release-notes" className="hover:text-slate-950">Changelog</Link>
            <Link href="/app/capsules" className="hover:text-slate-950">Capsules</Link>
            <Link href="/app/capsules?lane=marketplace" className="hover:text-slate-950">Marketplace</Link>
          </nav>
        </header>

        <div className="mt-6 grid min-h-[calc(100vh-7rem)] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_21rem]">
          <aside className="hidden rounded-xl border border-slate-200 bg-white/85 p-3 shadow-sm lg:block" aria-label="PRAXIS workspace">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            <nav className="mt-3 grid gap-1">
              {SIDEBAR_LINKS.map((item) => {
                const Icon = item.icon;
                const active = item.href === '/app';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
                      active ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-[color:var(--color-archive-paper-strong)]',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-5 rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3 text-xs leading-5 text-slate-600">
              Ask PRAXIS reads the active capsule first, then routes deeper work to boardroom, sources, drafts, or capsule review.
            </div>
          </aside>

          <section className="min-w-0">
            <div className="sticky top-3 z-10 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-200/50 backdrop-blur" data-testid="advanced-edit-context">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  data-testid="launchpad-capsule-chip"
                  onClick={() => router.push('/app/capsules')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  <Library className="h-3.5 w-3.5 text-[color:var(--color-oxide)]" />
                  {capsuleLabel}
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <CapsuleListPicker
                    activeCapsuleId={stack.capsuleId}
                    onSelect={(capsuleId) => void activateCapsule(capsuleId)}
                  />
                  <Link href="/app/capsules/builder" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Build capsule
                  </Link>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Guide
                  </button>
                </div>
              </div>

              <details className="mt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-2 text-sm font-semibold text-slate-800">
                  Advanced / Edit context
                  <ChevronDown className="h-4 w-4" />
                </summary>
                <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_17rem]">
                  <div className="grid gap-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <ContextSignal icon={Layers3} label="Capsule" value={stack.capsuleId ? 'Attached' : 'Add one'} />
                      <ContextSignal icon={SearchCheck} label="Sources" value={`${sourceCount} linked`} />
                      <ContextSignal icon={Target} label="Output" value={stack.outputGoal ?? 'Choose target'} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/app/capsules?lane=marketplace" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <Library className="h-3.5 w-3.5" />
                        Add from marketplace
                      </Link>
                      <button type="button" onClick={openBoardroom} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <MessageSquareText className="h-3.5 w-3.5" />
                        Discuss in boardroom
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Output target</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {OUTPUT_TARGETS.map((target) => {
                          const selected = stack.outputGoal === target;
                          return (
                            <button
                              key={target}
                              type="button"
                              onClick={() => void setOutputTarget(target)}
                              className={[
                                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition',
                                selected
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                              ].join(' ')}
                            >
                              {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                              {target}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <aside className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Context status</p>
                    <div className="mt-2 grid gap-2 text-xs leading-5 text-slate-600">
                      <p>{hydrated ? (persisted ? 'Saved to your workspace.' : 'Local context is active.') : 'Loading context...'}</p>
                      <p>{contextBlockCount} structured context block{contextBlockCount === 1 ? '' : 's'} active.</p>
                      <p>{savingContext ? 'Saving context...' : 'Capsule context carries into Ask, Boardroom, and drafts.'}</p>
                    </div>
                  </aside>
                </div>
              </details>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Ask PRAXIS
                  </p>
                  <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Ask a policy question. Build the capsule first.
                  </h1>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <article className="max-w-3xl rounded-xl border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-4">
                  <p className="text-sm font-semibold text-slate-950">PRAXIS</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    I can answer like a policy analyst, turn the answer into a cited memo pack, surface weak claims, or open a boardroom discussion with specialist lenses. Attach a capsule above when the work needs institutional context.
                  </p>
                </article>

                <form onSubmit={submitLaunchpad} className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="sr-only" htmlFor="launchpad-prompt">Ask PRAXIS</label>
                  <textarea
                    id="launchpad-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={5}
                    className="min-h-36 w-full resize-none rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-4 py-3 text-base leading-7 text-slate-950 outline-none placeholder:text-slate-400 focus:border-[color:var(--color-oxide)] focus:bg-white"
                    placeholder="Ask a policy question, paste context, or request a memo, actor map, source check, board discussion, or options analysis."
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-md bg-[color:var(--color-archive-paper-strong)] px-2 py-1">Capsule-aware</span>
                      <span className="rounded-md bg-[color:var(--color-archive-paper-strong)] px-2 py-1">Sources and gaps</span>
                      <span className="rounded-md bg-[color:var(--color-archive-paper-strong)] px-2 py-1">Draft-ready</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openBoardroom}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        Boardroom
                        <MessageSquareText className="h-4 w-4" />
                      </button>
                      <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                        Ask PRAXIS
                        <SendHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </form>
                <div className="grid gap-2 sm:grid-cols-3" aria-label="Example policy missions">
                  {POLICY_MISSION_EXAMPLES.map((mission) => (
                    <button
                      key={mission.title}
                      type="button"
                      onClick={() => {
                        setPrompt(mission.prompt);
                        window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, mission.prompt);
                      }}
                      className="rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-3 py-3 text-left text-sm hover:border-[color:var(--color-oxide)] hover:bg-white"
                    >
                      <span className="block font-semibold text-slate-950">{mission.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{mission.outcome}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="grid min-w-0 content-start gap-4">
            <section className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm" data-testid="launchpad-recent-work">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[color:var(--color-oxide)]" />
                  <h2 className="text-sm font-semibold text-slate-950">Recent work</h2>
                </div>
                <Link href="/app/recent-work" className="text-xs font-semibold text-slate-500 hover:text-slate-950">See all</Link>
              </div>
              <div className="mt-3 grid gap-2">
                {visibleRecentWork.length ? visibleRecentWork.map((item) => (
                  <Link key={item.id} href={item.href} className="rounded-lg border border-slate-100 bg-[color:var(--color-archive-paper-strong)] px-3 py-2 text-sm hover:bg-white">
                    <span className="block truncate font-semibold text-slate-800">{item.label}</span>
                    <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.kind}</span>
                  </Link>
                )) : (
                  <div className="grid gap-2">
                    {SAMPLE_POLICY_ARTIFACTS.slice(0, 2).map((artifact) => (
                      <SampleArtifactCard key={artifact.id} artifact={artifact} onUse={() => applySampleArtifact(artifact)} compact />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[color:var(--color-oxide)]" />
                <h2 className="text-sm font-semibold text-slate-950">PRAXIS sample artifacts</h2>
              </div>
              <div className="mt-3 grid gap-3">
                {SAMPLE_POLICY_ARTIFACTS.map((artifact) => (
                  <SampleArtifactCard key={artifact.id} artifact={artifact} onUse={() => applySampleArtifact(artifact)} />
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {guideOpen ? <GuideModal onClose={() => setGuideOpen(false)} /> : null}
    </main>
  );
}

function SampleArtifactCard({
  artifact,
  onUse,
  compact = false,
}: {
  artifact: SamplePolicyArtifact;
  onUse: () => void;
  compact?: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{artifact.type}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{artifact.title}</h3>
        </div>
        <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">{artifact.status}</span>
      </div>
      {!compact ? (
        <>
          <p className="mt-2 text-xs leading-5 text-slate-600">{artifact.summary}</p>
          <ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
            {artifact.bullets.slice(0, 2).map((bullet) => <li key={bullet}>- {bullet}</li>)}
          </ul>
          <div className="mt-2 grid gap-1">
            {artifact.sources.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 text-xs font-semibold text-[color:var(--color-civic-blue)] hover:text-slate-950">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{source.label}</span>
              </a>
            ))}
          </div>
        </>
      ) : null}
      <button
        type="button"
        onClick={onUse}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Use this as a prompt
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/30 px-4 py-10 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Quick guide</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">How to use Ask PRAXIS</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Close guide">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          <section className="rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-4">
            <h3 className="text-sm font-semibold text-slate-950">1. Attach context first when the question is serious.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A capsule is the policy file PRAXIS reads before it answers. Use the floating context bar to select a capsule, create one, or pull a verified starter from the marketplace.
            </p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-4">
            <h3 className="text-sm font-semibold text-slate-950">2. Ask normally, then choose the stronger workflow only when needed.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The main composer behaves like a simple policy chat. Use Boardroom when you need a chaired multi-agent discussion, dissent, risks, open questions, and a board-ready synthesis.
            </p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-4">
            <h3 className="text-sm font-semibold text-slate-950">3. Treat generated artifacts as reviewable work products.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              PRAXIS should carry sources, caveats, weak claims, evidence gaps, and output targets into the next draft. Human review still controls capsule promotion and final policy judgment.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ContextSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Library;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-[color:var(--color-oxide)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      </div>
      <p className="mt-1 truncate text-xs font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function shortenContextId(value: string): string {
  return value.length > 28 ? `${value.slice(0, 16)}...${value.slice(-8)}` : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
