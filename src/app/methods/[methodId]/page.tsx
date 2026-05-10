import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { MethodFitBadge } from '@/components/methods/MethodFitBadge';
import { MethodRuntimePanel } from '@/components/methods/MethodRuntimePanel';
import { CATEGORY_LABELS, getMethodById, getMethodSourceTool } from '@/lib/methods/catalog';

interface MethodDetailPageProps {
  params: Promise<{ methodId: string }>;
}

export async function generateStaticParams() {
  const { MVP_METHODS } = await import('@/lib/methods/catalog');
  return MVP_METHODS.map((method) => ({ methodId: method.id }));
}

export async function generateMetadata({ params }: MethodDetailPageProps) {
  const { methodId } = await params;
  const method = getMethodById(methodId);
  return {
    title: method ? `${method.name} | PRAXIS Methods` : 'Method | PRAXIS',
  };
}

export default async function MethodDetailPage({ params }: MethodDetailPageProps) {
  const { methodId } = await params;
  const method = getMethodById(methodId);
  if (!method) notFound();

  const sourceTool = getMethodSourceTool(method);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <header className="border-b border-slate-200 pb-4">
        <Link href="/methods" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-700 hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" />
          Methods
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase text-navy-500">{CATEGORY_LABELS[method.category]}</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy-900">{method.name}</h1>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">{method.summary}</p>
          </div>
          <MethodFitBadge status={method.status} />
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex flex-col gap-4">
          <section className="grid gap-4 md:grid-cols-3">
            <DetailPanel title="Best for" items={method.bestFor} />
            <DetailPanel title="Inputs" items={method.inputs} />
            <DetailPanel title="Outputs" items={method.outputs} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-navy-900">Context required</h2>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-navy-700 sm:grid-cols-2">
              {method.contextNeeds.map((need) => (
                <li key={need} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  {need}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-navy-900">Runtime contract</h2>
            <div className="mt-3 grid gap-3 text-sm text-navy-700 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-navy-900">Endpoint:</span> {method.runPath ?? 'Not assigned'}
              </p>
              <p>
                <span className="font-semibold text-navy-900">Mapped tool:</span> {sourceTool?.name ?? 'Grounded research route'}
              </p>
              <p>
                <span className="font-semibold text-navy-900">Persistence:</span> Reviewable output when authenticated and scoped.
              </p>
              <p>
                <span className="font-semibold text-navy-900">Fallback:</span> Honest unavailable state when runtime or context is missing.
              </p>
            </div>
          </section>
        </main>

        <aside className="flex flex-col gap-4">
          <MethodRuntimePanel method={method} />
        </aside>
      </div>
    </div>
  );
}

function DetailPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-navy-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
