import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLegalPage, legalPages } from '@/lib/legal/pages';

type LegalPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: LegalPageProps) {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.summary,
    alternates: {
      canonical: `/legal/${page.slug}`,
    },
  };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) notFound();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-5 pb-20 pt-28 text-[color:var(--color-ink)] sm:px-8 lg:px-10">
      <div className="space-y-5">
        <Link
          href="/"
          className="praxis-link font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--color-gold-700)]"
        >
          PRAXIS by TACITUS
        </Link>
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--color-ink)]/55">
            Updated {page.updatedAt}
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-normal text-[color:var(--color-diplomatic-blue)] sm:text-5xl">
            {page.title}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[color:var(--color-ink)]/72">
            {page.summary}
          </p>
          {page.pendingLegalReview ? (
            <p className="max-w-3xl rounded-md border border-[color:var(--color-rose-gold)]/45 bg-white/55 px-4 py-3 text-sm leading-6 text-[color:var(--color-ink)]/68">
              This page describes the current operating posture and is pending formal legal review.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-8">
        {page.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold tracking-normal text-[color:var(--color-diplomatic-blue)]">
              {section.heading}
            </h2>
            <div className="space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-[15px] leading-7 text-[color:var(--color-ink)]/72">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <nav className="grid gap-2 border-t border-[color:var(--color-rose-gold)]/30 pt-6 sm:grid-cols-2">
        {legalPages.map((item) => (
          <Link
            key={item.slug}
            href={`/legal/${item.slug}`}
            className="praxis-link rounded-md px-3 py-2 text-sm text-[color:var(--color-ink)]/68 transition hover:bg-white/55 hover:text-[color:var(--color-diplomatic-blue)]"
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </main>
  );
}
