import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Eye,
  Languages,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
} from 'lucide-react';

export const metadata = {
  title: 'User Core | PRAXIS',
  description: 'Build and maintain the analyst model PRAXIS uses for policy analysis.',
};

const readiness = [
  { label: 'Role and institution', state: 'ready', detail: 'Who is asking, from what seat, and for what institutional purpose.' },
  { label: 'Audience and output style', state: 'ready', detail: 'How briefings, memos, and recommendations should sound.' },
  { label: 'Analytic lenses', state: 'partial', detail: 'Preferred frameworks, red lines, and confidence posture.' },
  { label: 'Source and language posture', state: 'partial', detail: 'What to prefer, translate, avoid, or treat as sensitive.' },
] as const;

const builderSteps = [
  {
    label: 'Define the analyst',
    href: '/app/settings/profile',
    icon: UserCircle,
    detail: 'Role, organization, seniority, region, and policy domains.',
    cta: 'Edit profile',
  },
  {
    label: 'Set working preferences',
    href: '/app/settings/preferences',
    icon: SlidersHorizontal,
    detail: 'Recommendation depth, default formats, rhythm, and app behavior.',
    cta: 'Tune preferences',
  },
  {
    label: 'Set language and model posture',
    href: '/app/settings/model-preferences',
    icon: Languages,
    detail: 'Preferred tone, translation needs, and model posture without provider clutter.',
    cta: 'Set language',
  },
  {
    label: 'Inspect prompt impact',
    href: '/app/profile',
    icon: Eye,
    detail: 'Review what PRAXIS will carry into Ask, tools, and drafting.',
    cta: 'Inspect core',
  },
] as const;

const promptCards = [
  'Answer as a foreign policy analyst preparing a concise options note.',
  'Keep confidence, assumptions, and evidence gaps visible before recommendations.',
  'Use my preferred memo style and audience constraints before drafting.',
] as const;

export default function UserCorePage() {
  const readyCount = readiness.filter((item) => item.state === 'ready').length;
  const readinessScore = Math.round((readyCount / readiness.length) * 100);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 pb-16">
      <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-navy-950/5 backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">User Core Builder</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold text-navy-950 sm:text-4xl">
              Build the analyst model PRAXIS carries into every answer.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              User Core turns role, audience, lenses, writing style, source posture, and red lines into reusable context. Ask PRAXIS should not guess who you are or how your team works.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/app/settings/profile"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-950/15 hover:bg-navy-800"
              >
                Maintain User Core
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app/dashboard#ask-praxis"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-diplomatic-blue/30 bg-white px-5 py-3 text-sm font-semibold text-diplomatic-blue hover:bg-diplomatic-blue/5"
              >
                Attach to Ask PRAXIS
                <MessageSquareText className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <aside className="border-t border-navy-100 bg-navy-950 p-6 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Readiness</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-semibold">{readinessScore}</span>
              <span className="pb-2 text-sm text-navy-200">/ 100</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-navy-100">
              Strong enough for Ask PRAXIS. Improve lenses and source posture before sensitive drafting.
            </p>
            <div className="mt-5 space-y-2">
              {readiness.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/8 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className={item.state === 'ready' ? 'text-xs font-semibold text-gold-300' : 'text-xs font-semibold text-amber-200'}>
                      {item.state}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-navy-200">{item.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {builderSteps.map((section, index) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm shadow-navy-950/5 backdrop-blur transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-950 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Step {index + 1}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-navy-950">{section.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{section.detail}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-diplomatic-blue">
                {section.cta}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)]">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-gold-700" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Prompt effects</p>
              <h2 className="text-lg font-semibold text-navy-950">What this changes inside AI work</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {promptCards.map((card) => (
              <div key={card} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <BadgeCheck className="h-4 w-4 text-diplomatic-blue" />
                <p className="mt-3 text-sm leading-6 text-slate-700">{card}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-gold-800" />
            <h2 className="text-lg font-semibold text-navy-950">Guardrail</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-800">
            User Core improves relevance, but it does not replace source review, case evidence, or owner scoping. Sensitive outputs should still run through the Situation Core and graph checks before export.
          </p>
        </div>
      </section>
    </main>
  );
}
