'use client';

import Link from 'next/link';
import { ArrowRight, FilePlus2, FolderOpen } from 'lucide-react';
import { listExampleCases } from '@/lib/cases/registry';
import { useSituationStore } from '@/stores/situation-store';

export function WorkbenchCasePicker() {
  const situations = useSituationStore((state) => state.situations);
  const exampleCases = listExampleCases();

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-navy-950/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">PRAXIS Workbench</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950">Choose a case to work.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Each case opens in the same operating room: context first, tools second, with graph provenance and decision products
            scoped to the active case.
          </p>
          <Link
            href="/app/situations/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            <FilePlus2 className="h-4 w-4" />
            Create a new case
          </Link>
        </header>

        {situations.length ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">My cases</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {situations.map((situation) => (
                <CaseCard
                  key={situation.id}
                  href={`/app/workbench/${situation.id}?tab=chapters`}
                  label="User case"
                  title={situation.name}
                  region={situation.region}
                  summary={situation.description}
                  risk={Math.round(situation.riskScore * 10)}
                  glasl={situation.glaslStage ?? 0}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Example cases</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {exampleCases.map((caseModule) => (
              <CaseCard
                key={caseModule.id}
                href={`/app/workbench/${caseModule.id}?tab=chapters`}
                label="Example"
                title={caseModule.manifest.name}
                region={caseModule.manifest.region}
                summary={caseModule.manifest.summary}
                risk={caseModule.manifest.risk}
                glasl={caseModule.manifest.glaslStage}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
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
}: {
  href: string;
  label: string;
  title: string;
  region: string;
  summary: string;
  risk: number;
  glasl: number;
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
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>Risk {risk}</span>
        <span>Glasl {glasl || '-'}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-navy-800">
          Open <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
