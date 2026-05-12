'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowRight, FilePlus2, FolderOpen, Loader2, Sparkles } from 'lucide-react';
import { listExampleCases } from '@/lib/cases/registry';
import { useSituationStore } from '@/stores/situation-store';

export function WorkbenchCasePicker() {
  const situations = useSituationStore((state) => state.situations);
  const loading = useSituationStore((state) => state.loading);
  const fetchSituations = useSituationStore((state) => state.fetchSituations);
  const exampleCases = listExampleCases();

  useEffect(() => {
    void fetchSituations();
  }, [fetchSituations]);

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">Context repository</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">Open the context PRAXIS should use.</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
              Contexts hold the actors, sources, ontology, graph, drafts, and methods that make Ask PRAXIS useful for a policy team.
            </p>
          </div>
          <Link
            href="/app/situations/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
          >
            <FilePlus2 className="h-4 w-4" />
            New context
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">My contexts</h2>
          {loading ? (
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing
            </span>
          ) : null}
        </div>

        {situations.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {situations.map((situation) => (
              <CaseCard
                key={situation.id}
                href={`/app/workbench/${situation.id}`}
                label="User context"
                title={situation.name}
                region={situation.region}
                summary={situation.description}
                risk={normalizeRisk(situation.riskScore)}
                glasl={situation.glaslStage ?? 0}
                sources={situation.sourceUrls?.length || situation.documentCount || 0}
                actors={situation.actors?.length || situation.actorCount || 0}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-navy-950">No user contexts yet</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Start with one situation. PRAXIS will turn it into the context Ask, tools, and memo drafting use.
              </p>
            </div>
            <Link
              href="/app/situations/new"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-navy-900 bg-white px-3 text-sm font-semibold text-navy-950 hover:bg-navy-50"
            >
              <Sparkles className="h-4 w-4" />
              Build one
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Examples</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {exampleCases.map((caseModule) => (
            <CaseCard
              key={caseModule.id}
              href={`/app/workbench/${caseModule.id}`}
              label="Example context"
              title={caseModule.manifest.name}
              region={caseModule.manifest.region}
              summary={caseModule.manifest.summary}
              risk={caseModule.manifest.risk}
              glasl={caseModule.manifest.glaslStage}
              sources={caseModule.sources.length}
              actors={caseModule.situation.actors.length}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function CaseCard({
  href,
  label,
  title,
  region,
  summary,
  risk,
  glasl,
  sources,
  actors,
}: {
  href: string;
  label: string;
  title: string;
  region: string;
  summary: string;
  risk: number;
  glasl: number;
  sources: number;
  actors: number;
}) {
  return (
    <Link href={href} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5 hover:border-navy-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">{label} · {region}</p>
          <h3 className="mt-2 text-lg font-semibold text-navy-950">{title}</h3>
        </div>
        <FolderOpen className="h-5 w-5 text-slate-400 group-hover:text-navy-700" />
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-650">{summary}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>Risk {risk}</span>
        <span>Glasl {glasl || '-'}</span>
        <span>{actors} actors</span>
        <span>{sources} sources</span>
        <span className="inline-flex items-center gap-1 font-semibold text-navy-800">
          Open <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function normalizeRisk(riskScore: number): number {
  if (!Number.isFinite(riskScore)) return 0;
  return riskScore <= 1 ? Math.round(riskScore * 10) : Math.round(riskScore);
}
