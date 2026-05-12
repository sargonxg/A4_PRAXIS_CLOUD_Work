import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';
import { getLandingCaseCards } from '@/lib/cases/landing-cards';

type ExampleCasesGalleryProps = {
  compact?: boolean;
};

export function ExampleCasesGallery({ compact = false }: ExampleCasesGalleryProps) {
  const cards = getLandingCaseCards();

  return (
    <section
      id="example-cases"
      className={compact ? '' : 'border-y border-slate-200 bg-slate-50 py-16 lg:py-24'}
      aria-labelledby={compact ? 'example-cases-modal-heading' : 'example-cases-heading'}
    >
      <div className={compact ? '' : 'mx-auto max-w-7xl px-6'}>
        {!compact ? (
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Example cases</p>
            <h2 id="example-cases-heading" className="mt-3 font-serif text-3xl font-semibold leading-tight text-navy-950 sm:text-5xl">
              Open a guest case, then build your own.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-navy-600">
              Example cases are preloaded workbench files. They demonstrate the operating room; they are not the product boundary.
            </p>
          </div>
        ) : null}

        <div className={compact ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'}>
          {cards.map((card) => (
            <article
              key={card.id}
              className="flex min-h-[220px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-diplomatic-blue">
                  {card.available ? 'Example' : 'Planned'} · {card.region}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-navy-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">{card.summary}</p>
              </div>

              <div className="mt-5">
                <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-navy-500">
                  {card.available ? (
                    <>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">Risk {card.risk}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">Glasl {card.glaslStage}</span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                      <Clock3 className="h-3 w-3" aria-hidden="true" />
                      More cases coming
                    </span>
                  )}
                  {card.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1">{tag}</span>
                  ))}
                </div>

                {card.available ? (
                  <Link
                    href={card.id === 'syria-2026' ? '/app/workbench/syria-2026' : `/app/workbench/${card.id}`}
                    prefetch={false}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-diplomatic-blue transition hover:text-navy-950"
                  >
                    Open guest session
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-navy-400">Case module not shipped yet</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
