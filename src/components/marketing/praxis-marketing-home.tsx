import Link from 'next/link';
import { ArrowRight, BadgeCheck, BrainCircuit, FileSearch, Library, LockKeyhole, ShieldCheck } from 'lucide-react';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import { POLICY_MISSION_EXAMPLES } from '@/lib/product/policy-missions';

const verifiedCapsules = [
  'Conflict Analysis',
  'Sanctions Impact',
  'Humanitarian Access',
  'Rule of Law',
  'Mediation Strategy',
  'Stakeholder Map',
];

const plans = [
  ['Free', 'Start with sample capsules and one private workspace.'],
  ['Practitioner', 'Build cited briefs and reusable ContextCapsules.'],
  ['Team', 'Share capsule libraries, sources, and review gates.'],
  ['Institution', 'Governed deployment for policy teams and partners.'],
] as const;

export function PraxisMarketingHome() {
  return (
    <main className="civic-atelier-shell praxis-checker-constellation min-h-screen text-slate-950" data-testid="marketing-home">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-y-3 px-4 py-5 sm:px-6 lg:px-8" aria-label="Public navigation">
        <Link href="/" className="min-w-0">
          <PraxisBrandChip compact />
        </Link>
        <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <a href="#capsules" className="hover:text-slate-950">Capsules</a>
          <a href="#pricing" className="hover:text-slate-950">Pricing</a>
          <Link href="/learn" className="hover:text-slate-950">Learn</Link>
          <Link href="/guide" className="hover:text-slate-950">Guide</Link>
          <Link href="/release-notes" className="hover:text-slate-950">Changelog</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            Sign in
          </Link>
          <Link href="/login?mode=signup" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50">
            Start free
          </Link>
        </div>
        <div className="flex basis-full items-center gap-3 overflow-x-auto text-sm font-semibold text-slate-600 md:hidden">
          <a href="#capsules" className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2">Capsules</a>
          <a href="#pricing" className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2">Pricing</a>
          <Link href="/learn" className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2">Learn</Link>
          <Link href="/guide" className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2">Guide</Link>
          <Link href="/release-notes" className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2">Changelog</Link>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(22rem,0.76fr)] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-clay)]/25 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            ContextCapsule AI for policy teams
          </p>
          <h1 className="mt-6 max-w-4xl font-serif text-5xl font-semibold tracking-normal text-slate-950 sm:text-6xl">
            Ask a policy question. Build the capsule first.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Start with a mission, create a ContextCapsule, then use PRAXIS to produce sourced work with receipts, claim posture, and review gates attached.
          </p>
          <form action="/login" method="get" className="mt-8 max-w-2xl rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/60">
            <input type="hidden" name="mode" value="signup" />
            <input type="hidden" name="redirect" value="/app/capsules/builder" />
            <label className="sr-only" htmlFor="marketing-hero-prompt">Ask a policy question</label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id="marketing-hero-prompt"
                name="capsulePrompt"
                data-testid="marketing-hero-prompt"
                className="min-h-12 min-w-0 rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-4 text-base text-slate-950 outline-none placeholder:text-slate-400 focus:border-[color:var(--color-oxide)] focus:bg-white"
                placeholder="Ask a policy question..."
              />
              <button
                type="submit"
                data-testid="marketing-primary-cta"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
          <div className="mt-5 grid gap-2 sm:grid-cols-3" aria-label="Example policy missions">
            {POLICY_MISSION_EXAMPLES.map((mission) => (
              <button
                key={mission.title}
                type="submit"
                form="marketing-mission-form"
                name="capsulePrompt"
                value={mission.prompt}
                className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-left text-sm shadow-sm hover:border-[color:var(--color-oxide)]"
              >
                <span className="block font-semibold text-slate-950">{mission.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{mission.outcome}</span>
              </button>
            ))}
          </div>
          <form id="marketing-mission-form" action="/login" method="get" className="hidden">
            <input type="hidden" name="mode" value="signup" />
            <input type="hidden" name="redirect" value="/app/capsules/builder" />
          </form>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">What PRAXIS produces</p>
          <div className="mt-4 grid gap-3">
            {['Source-backed answer', 'Claim ledger', 'Open evidence gaps', 'Draft-ready brief'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-[color:var(--color-archive-paper-strong)] px-3 py-3 text-sm font-semibold text-slate-800">
                <BadgeCheck className="h-4 w-4 text-[color:var(--color-oxide)]" />
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section id="capsules" className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <CapabilityCard icon={Library} title="Context Capsules" text="Reusable policy context: actors, rules, sources, caveats, templates, and review gates in one governed file." />
        <CapabilityCard icon={BrainCircuit} title="Agentic research" text="Durable research runs plan, gather, verify, synthesize, and leave visible proof for the team." />
        <CapabilityCard icon={FileSearch} title="Capsule marketplace" text="Start from verified capsules for common policy workflows, then adapt them to your institution." />
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8" data-testid="marketing-marketplace-teaser">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-oxide)]">Marketplace preview</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-950">Verified capsules for real policy work.</h2>
          </div>
          <Link href="/login?mode=signup&redirect=%2Fapp%2Fcapsules" className="text-sm font-semibold text-slate-700 hover:text-slate-950">
            Browse after sign-in
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {verifiedCapsules.map((name) => (
            <article key={name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-950">{name}</h3>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">Verified</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Includes source posture, review gates, suggested outputs, and evidence gaps.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/75">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          <TrustItem icon={FileSearch} label="Every claim cited" />
          <TrustItem icon={LockKeyhole} label="Private workspace; no training on your work" />
          <TrustItem icon={ShieldCheck} label="Trust, billing, and data posture stay visible" />
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8" data-testid="marketing-pricing-strip">
        <div className="grid gap-3 md:grid-cols-4">
          {plans.map(([name, text]) => (
            <Link key={name} href="/pricing" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300">
              <p className="text-sm font-semibold text-slate-950">{name}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <Link href="/" className="font-semibold text-slate-800">PRAXIS by TACITUS</Link>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-slate-950">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-slate-950">Terms</Link>
            <Link href="/legal/security" className="hover:text-slate-950">Security</Link>
            <Link href="/release-notes" className="hover:text-slate-950">Release notes</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Library;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[color:var(--color-oxide)]" />
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function TrustItem({
  icon: Icon,
  label,
}: {
  icon: typeof FileSearch;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
      <Icon className="h-4 w-4 text-[color:var(--color-oxide)]" />
      {label}
    </div>
  );
}
