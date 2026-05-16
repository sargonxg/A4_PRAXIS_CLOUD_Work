import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Boxes,
  Cable,
  FileText,
  Layers3,
  Network,
  Route,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const learnNav = [
  ['Start', '#start'],
  ['Capsule cores', '#cores'],
  ['Policy paths', '#paths'],
  ['Tool families', '#tools'],
  ['Outputs', '#outputs'],
  ['Connectors', '#connectors'],
  ['Planned', '#planned'],
] as const;

const coreGroups = [
  ['User Core', 'Role, mandate, audience, writing style, red lines, and review posture.'],
  ['Situation Core', 'Problem frame, geography, actors, decision context, and scope.'],
  ['Source Core', 'Receipts, links, datasets, provenance, source gaps, and freshness.'],
  ['Document Core', 'Uploaded PDFs, notes, transcripts, policies, reports, and extracted chunks.'],
  ['Graph Core', 'Actors, claims, commitments, incentives, blockers, and relationships.'],
  ['Time Core', 'Episodes, deadlines, decision windows, validity, and stale assumptions.'],
  ['Tool Core', 'Allowed tools, recommended checks, review gates, and action limits.'],
  ['Output Core', 'Audience, format, citation posture, export rules, and destination.'],
  ['Memory Core', 'Decisions, preferences, caveats, open questions, and handover notes.'],
  ['Product Core', 'Memo, brief, card, pack, map, cable, table, or handover shape.'],
] as const;

const paths = [
  ['Foreign policy analyst', 'Country read, sourceability, actor dossier, options memo.'],
  ['Conflict resolution practitioner', 'Actor interests, mediation timing, spoilers, handover.'],
  ['Defence capture lead', 'Requirements, stakeholders, approval path, board brief.'],
  ['Public affairs lead', 'Regulatory watch, narrative monitor, talking points.'],
  ['HR policy owner', 'Affected groups, legal review, rollout note, approvals.'],
  ['Legal and compliance analyst', 'Rules, sanctions exposure, contradictions, receipts.'],
  ['Crisis manager', 'Timeline, situation brief, escalation thresholds, handover.'],
  ['Strategy operator', 'Market context, scenario review, risk card, executive memo.'],
  ['Program officer', 'Implementation risk, local actors, sources, donor handover.'],
  ['Research director', 'Evidence discipline, reusable capsule library, review queue.'],
] as const;

const toolFamilies = [
  ['Research', 'Grounded research, source scout, document retrieval, source receipts.'],
  ['Sourceability', 'Claim checks, weak citations, unsupported claims, gap receipts.'],
  ['Analysis', 'ACH, scenarios, contradiction checks, stakeholder and actor reads.'],
  ['Monitoring', 'Timeline, commitments, media roundup, humanitarian and risk signals.'],
  ['Writing', 'Options memo, daily read, diplomatic cable, talking points, country pack.'],
  ['Governance', 'Approvals, export receipts, sharing rules, audit trail, handover.'],
] as const;

const outputs = [
  ['Options memo', 'Decision-ready options, tradeoffs, risks, and recommendation posture.'],
  ['Country pack', 'Country one-pager plus media, risk, and humanitarian outputs.'],
  ['Actor dossier', 'Interests, leverage, constraints, claims, and source posture.'],
  ['Risk card', 'Indicators, thresholds, confidence, and collection needs.'],
  ['Talking points', 'Meeting-ready lines with source caveats and do-not-say notes.'],
  ['Handover pack', 'Capsule, memo, gaps, receipts, decisions, and next actions.'],
] as const;

const connectors = [
  ['Live now', 'Document upload, Library sources, ContextCapsule packages, grounded source search.'],
  ['Next', 'Repository/library attachments, team capsule sharing, calendar/deadline monitors.'],
  ['Planned', 'Private MCP gateway, organization capsule marketplace, richer export pipelines.'],
] as const;

export const metadata = {
  title: 'Learn PRAXIS',
  description: 'Short guide to PRAXIS Context Capsules, policy paths, tools, outputs, and planned connectors.',
};

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f1] bg-[linear-gradient(90deg,rgba(26,51,43,0.045)_1px,transparent_1px),linear-gradient(180deg,rgba(26,51,43,0.045)_1px,transparent_1px)] bg-[size:56px_56px] text-slate-950">
      <PublicHeader />
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-2xl border border-black/10 bg-white/85 p-3 shadow-sm shadow-slate-900/5 backdrop-blur">
            <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Learn</p>
            <nav className="grid gap-1" aria-label="Learn sections">
              {learnNav.map(([label, href]) => (
                <a key={href} href={href} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-8">
          <section id="start" className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-sage/10 px-3 py-1.5 text-sm font-semibold text-sage">
              <Sparkles className="h-4 w-4" />
              Context Capsule first
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              PRAXIS keeps policy work, sources, tools, and outputs in one reusable capsule.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">
              Start with a question, attach the relevant context, then produce a sourceable memo, brief, card, map, or handover. The visible app stays simple; deeper tools and approval gates sit behind the active capsule.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                Open cockpit
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-sm">
                Plans
              </Link>
            </div>
          </section>

          <LearnSection id="cores" icon={Layers3} title="Capsule Cores" intro="A Context Capsule can start light and become richer as sources, documents, graph structure, tool choices, and handover memory are added.">
            <div className="grid gap-3 md:grid-cols-2">
              {coreGroups.map(([name, detail]) => (
                <InfoCard key={name} title={name} detail={detail} />
              ))}
            </div>
          </LearnSection>

          <LearnSection id="paths" icon={Route} title="Ten Policy Paths" intro="Paths suggest the right capsule defaults, tool families, output products, and review gates for different users.">
            <div className="grid gap-3 md:grid-cols-2">
              {paths.map(([name, detail]) => (
                <InfoCard key={name} title={name} detail={detail} />
              ))}
            </div>
          </LearnSection>

          <LearnSection id="tools" icon={Network} title="Tool Families" intro="PRAXIS avoids a raw marketplace as the first screen. Tools are recommended from the active capsule and the policy path.">
            <div className="grid gap-3 md:grid-cols-3">
              {toolFamilies.map(([name, detail]) => (
                <InfoCard key={name} title={name} detail={detail} />
              ))}
            </div>
          </LearnSection>

          <LearnSection id="outputs" icon={FileText} title="Output Capsules" intro="Outputs are separate from context so the same capsule can produce several sourceable products without flattening provenance.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {outputs.map(([name, detail]) => (
                <InfoCard key={name} title={name} detail={detail} />
              ))}
            </div>
          </LearnSection>

          <LearnSection id="connectors" icon={Cable} title="Connectors" intro="Connectors are shown by readiness. Anything that sends externally, writes to a graph, or touches private systems stays approval-gated.">
            <div className="grid gap-3 md:grid-cols-3">
              {connectors.map(([name, detail]) => (
                <InfoCard key={name} title={name} detail={detail} />
              ))}
            </div>
          </LearnSection>

          <LearnSection id="planned" icon={Boxes} title="Scaffolded And Planned" intro="These are product directions, not default live controls. They become visible only when the runtime, permissions, and receipts are ready.">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard title="Premium capsule builds" detail="Larger capsules with deeper source libraries, ontologies, repositories, and specialist instructions." />
              <InfoCard title="Community capsules" detail="Reusable public, organization, team, or private capsules with clone, favorite, rating, and share rules." />
              <InfoCard title="Agent handover" detail="Capsules that can safely brief another human or AI agent with clear allowed actions and blockers." />
              <InfoCard title="Governed exports" detail="DOCX, PDF, PPTX, HTML, and JSON exports with provenance and approval receipts attached." />
            </div>
          </LearnSection>

          <section className="rounded-2xl border border-black/10 bg-[#17231d] p-6 text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-[#ffc56b]" />
              <div>
                <h2 className="text-xl font-semibold">Simple surface, serious review path.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
                  PRAXIS can answer conversationally, but source gaps, unsupported claims, sensitive exports, and external actions are kept visible and reviewable.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function LearnSection({
  id,
  icon: Icon,
  title,
  intro,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 rounded-2xl border border-black/10 bg-white/90 p-5 shadow-sm shadow-slate-900/5 backdrop-blur sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-[#ff714d]" />
            <h2 className="text-2xl font-semibold">{title}</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{intro}</p>
        </div>
        <a href="#start" className="text-sm font-semibold text-sage hover:text-slate-950">Top</a>
      </div>
      {children}
    </section>
  );
}

function InfoCard({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-sage/30 hover:bg-white hover:shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-black/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl font-semibold text-diplomatic-blue">PRAXIS</Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/learn">Learn</Link>
          <Link href="/tacitus">TACITUS</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <Link href="/login" className="text-sm font-semibold text-gold-700">Sign in</Link>
      </div>
    </header>
  );
}
