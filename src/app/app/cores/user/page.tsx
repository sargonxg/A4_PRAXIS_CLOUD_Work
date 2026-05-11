import Link from 'next/link';
import { ArrowRight, Eye, Languages, SlidersHorizontal, UserCircle } from 'lucide-react';

export const metadata = {
  title: 'User Core | PRAXIS',
  description: 'Maintain the analyst model PRAXIS uses for policy analysis.',
};

const userCoreSections = [
  {
    label: 'Working profile',
    href: '/app/profile',
    icon: Eye,
    detail: 'See exactly what PRAXIS knows about your role, lenses, audience, and analytic style.',
  },
  {
    label: 'Edit profile',
    href: '/app/settings/profile',
    icon: UserCircle,
    detail: 'Maintain role, domain, seniority, language posture, and the user model used in prompts.',
  },
  {
    label: 'Preferences',
    href: '/app/settings/preferences',
    icon: SlidersHorizontal,
    detail: 'Tune defaults for recommendations, work rhythm, product style, and app behavior.',
  },
  {
    label: 'Model language',
    href: '/app/settings/model-preferences',
    icon: Languages,
    detail: 'Control model posture without exposing provider complexity in the main workflow.',
  },
];

export default function UserCorePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 pb-16">
      <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-navy-950/5 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">User Core</p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold text-navy-950 sm:text-4xl">The analyst model PRAXIS carries into every answer.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              User Core is where role, audience, lenses, writing style, red lines, and preferences become explicit. Ask PRAXIS should use this quietly in the background, while you can inspect and repair it here.
            </p>
          </div>
          <Link
            href="/app/settings/profile"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-950/15 hover:bg-navy-800"
          >
            Maintain User Core
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {userCoreSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm shadow-navy-950/5 backdrop-blur transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-950 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-navy-950">{section.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{section.detail}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-diplomatic-blue">
                Open
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
