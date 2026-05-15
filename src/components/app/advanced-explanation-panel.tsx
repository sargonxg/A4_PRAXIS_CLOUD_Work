import Link from 'next/link';

interface AdvancedExplanationPanelProps {
  title?: string;
  summary?: string;
  items: readonly {
    title: string;
    body: string;
  }[];
  actionHref?: string;
  actionLabel?: string;
  defaultOpen?: boolean;
}

export function AdvancedExplanationPanel({
  title = 'Advanced details',
  summary = 'Open for taxonomy, review gates, versioning, and trust posture.',
  items,
  actionHref,
  actionLabel = 'Open Advanced',
  defaultOpen = false,
}: AdvancedExplanationPanelProps) {
  return (
    <details
      open={defaultOpen}
      className="rounded-xl border border-slate-200 bg-white/85 p-4 shadow-sm shadow-navy-950/5"
    >
      <summary className="cursor-pointer list-none text-sm font-semibold text-navy-950">
        <span className="inline-flex w-full flex-wrap items-center justify-between gap-3">
          <span>{title}</span>
          <span className="text-xs font-medium text-slate-500">{summary}</span>
        </span>
      </summary>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-navy-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.body}</p>
          </article>
        ))}
      </div>
      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50"
        >
          {actionLabel}
        </Link>
      ) : null}
    </details>
  );
}
