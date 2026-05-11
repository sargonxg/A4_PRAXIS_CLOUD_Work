"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  FileText,
  FileOutput,
  GitBranch,
  GripVertical,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  Play,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { ContextGraphPreview } from "@/components/graph/ContextGraphPreview";
import { cn } from "@/lib/utils/cn";

type PersonaId = "foreign-policy-analyst" | "domestic-policy-analyst" | "corporate-strategic-analyst";
type ContextId = "indo-pacific-2026" | "ai-regulation-2026" | "fb-sustainability-2026";

const personas: Array<{ id: PersonaId; label: string; short: string; answer: string }> = [
  {
    id: "foreign-policy-analyst",
    label: "Foreign Policy Analyst",
    short: "FP analyst",
    answer: "Focus on alliance credibility, escalation control, and where diplomatic language is masking operational risk.",
  },
  {
    id: "domestic-policy-analyst",
    label: "Domestic Policy Analyst",
    short: "Policy analyst",
    answer: "Separate the formal rule path from coalition incentives, state capacity, and the implementation fights still ahead.",
  },
  {
    id: "corporate-strategic-analyst",
    label: "Corporate Strategy Analyst",
    short: "Strategy analyst",
    answer: "Translate policy movement into board-level exposure, claims risk, supplier pressure, and practical next moves.",
  },
];

const contexts: Array<{
  id: ContextId;
  label: string;
  region: string;
  stats: string;
  questions: Array<{ question: string; answer: string; targetPath: string }>;
}> = [
  {
    id: "indo-pacific-2026",
    label: "Indo-Pacific Strategic Competition",
    region: "Asia-Pacific",
    stats: "30 sources, 11 episodes, 157 graph objects",
    questions: [
      {
        question: "What changed in Indo-Pacific dynamics this month?",
        answer:
          "Alliance signaling is outpacing institutional absorption. Quad public-goods language remains stable, while AUKUS coordination and Philippine maritime risk make deterrence credibility the near-term watchpoint.",
        targetPath: "/demo/indo-pacific-2026",
      },
      {
        question: "Show me the stakeholder power-interest map.",
        answer:
          "The United States, Japan, Australia, India, China, Taiwan, the Philippines, and ASEAN split across deterrence, autonomy, trade resilience, and escalation-management interests.",
        targetPath: "/methods/stakeholder-power-interest-map",
      },
      {
        question: "Draft a country card on Taiwan dynamics.",
        answer:
          "The country card should lead with leadership continuity, gray-zone coercion, semiconductor exposure, and alliance signaling as the core analytic watchpoints.",
        targetPath: "/draft/new?caseId=indo-pacific-2026&template=country-card",
      },
    ],
  },
  {
    id: "ai-regulation-2026",
    label: "AI Regulation 2026",
    region: "United States",
    stats: "30 sources, 11 episodes, 189 graph objects",
    questions: [
      {
        question: "What is the state of US federal AI regulation?",
        answer:
          "The United States remains a federal-guidance plus state-law patchwork. NIST and agency guidance anchor governance while Congress and the White House contest state preemption.",
        targetPath: "/demo/ai-regulation-2026",
      },
      {
        question: "Map industry positions versus interests.",
        answer:
          "Industry positions cluster around uniform federal rules and liability predictability. Civil society emphasizes rights, discrimination controls, transparency, and durable enforcement.",
        targetPath: "/methods/position-interest-decoder",
      },
      {
        question: "Draft a legislative briefing on AI preemption.",
        answer:
          "The briefing should define the preemption question, map state-law stakes, identify constitutional and implementation risks, and offer options that preserve child-safety and civil-rights safeguards.",
        targetPath: "/draft/new?caseId=ai-regulation-2026&template=talking-points",
      },
    ],
  },
  {
    id: "fb-sustainability-2026",
    label: "Food & Beverage Sustainability",
    region: "Global markets",
    stats: "30 sources, 11 episodes, 170 graph objects",
    questions: [
      {
        question: "Track sustainability commitments and compliance.",
        answer:
          "Separate climate, packaging, water, sourcing, and nutrition claims. Investor and regulator pressure is strongest where disclosures meet consumer-facing claims.",
        targetPath: "/demo/fb-sustainability-2026",
      },
      {
        question: "Map positions on FDA labeling reform.",
        answer:
          "Stakeholder positions split across consumer transparency, compliance burden, public-health evidence, and brand-risk management. Retailers can amplify pressure faster than formal rules.",
        targetPath: "/methods/stakeholder-power-interest-map",
      },
      {
        question: "Draft a board briefing on regulatory exposure.",
        answer:
          "Lead with material regulatory exposure, then show claims risk, disclosure risk, supplier risk, and governance actions with source posture visible.",
        targetPath: "/draft/new?caseId=fb-sustainability-2026&template=executive-summary",
      },
    ],
  },
];

const methods = [
  ["Stakeholder Power-Interest Map", "Ranks actors by influence and stake so engagement choices are explicit."],
  ["Grounded Research", "Builds a sourced research answer and keeps unresolved questions visible."],
  ["Position-vs-Interest Decoder", "Separates public positions from likely underlying interests."],
  ["Scenario Projector", "Turns current evidence into likely, high-risk, and opportunity paths."],
  ["Analysis of Competing Hypotheses", "Tests explanations against evidence that weakens each claim."],
  ["Contradiction Finder", "Flags conflicts across sources, notes, and prior outputs before export."],
  ["Frame & Narrative Analyzer", "Shows which messages, messengers, and audiences are moving the case."],
  ["Coalition Detector", "Maps supportive, blocking, and swing actors around a decision."],
  ["Commitment Tracker", "Checks whether promises are monitorable, attributable, and enforceable."],
  ["Memo Drafter", "Turns selected findings into a reviewable memo with citation gaps visible."],
] as const;

const trustItems = [
  ["Source receipts", "Every demo answer links back to public material."],
  ["Review-first drafting", "Outputs are proposals for analysts to accept, revise, or reject."],
  ["Google Cloud + Firebase", "The production path uses the connected PRAXIS cloud project."],
  ["No signup wall", "The public demo opens before account creation."],
] as const;

const realAppSurfaces = [
  {
    label: "Ask PRAXIS",
    href: "/app/dashboard",
    icon: MessageSquareText,
    detail: "The authenticated first screen for cited answers, open questions, and next-step routing.",
    signal: "live dashboard",
  },
  {
    label: "Context Workbench",
    href: "/app/workbench/syria-2026?openChapter=context",
    icon: Target,
    detail: "Frame, sources, lenses, work process, timeline, graph, drafts, and methods in one shell.",
    signal: "case shell",
  },
  {
    label: "Graph Intelligence",
    href: "/app/workbench/syria-2026?tab=graph",
    icon: GitBranch,
    detail: "Actors, claims, evidence, events, and provenance stay visible before analysis moves downstream.",
    signal: "review gated",
  },
  {
    label: "Memo Studio",
    href: "/app/workbench/syria-2026?openChapter=memos",
    icon: FileOutput,
    detail: "Turn findings into reviewable memos with versions, exports, evidence, and gaps visible.",
    signal: "exports",
  },
  {
    label: "Boardroom",
    href: "/app/workbench/syria-2026/boardroom",
    icon: Users,
    detail: "Run advisor deliberation and promote synthesis only after review.",
    signal: "multi-agent",
  },
  {
    label: "ACH",
    href: "/app/workbench/syria-2026/ach",
    icon: ClipboardCheck,
    detail: "Stress-test hypotheses against evidence that supports and weakens each explanation.",
    signal: "structured method",
  },
] as const;

const corePreview = [
  { id: "user", label: "User Core", detail: "Role, preferences, audience, language, and working style.", tone: "border-[#4A90A4] bg-[#EAF5F7]" },
  { id: "context", label: "Context Core", detail: "The case frame, actors, assumptions, timeline, and gaps.", tone: "border-[#E8B931] bg-[#FFF7D6]" },
  { id: "source", label: "Source Core", detail: "Receipts, credibility posture, fragments, and coverage gaps.", tone: "border-[#2F8F83] bg-[#E9F7F3]" },
  { id: "graph", label: "Graph Core", detail: "Claims, events, edges, provenance, and graph health.", tone: "border-[#5967D8] bg-[#EEF0FF]" },
  { id: "output", label: "Output Core", detail: "Memos, briefs, handovers, exports, and review state.", tone: "border-[#C75B39] bg-[#FFF0EA]" },
] as const;

type CorePreviewId = typeof corePreview[number]["id"];

const graphStatsByContext: Record<ContextId, Array<{ label: string; value: string }>> = {
  "indo-pacific-2026": [
    { label: "sources", value: "30" },
    { label: "episodes", value: "11" },
    { label: "actors", value: "8" },
    { label: "objects", value: "157" },
  ],
  "ai-regulation-2026": [
    { label: "sources", value: "30" },
    { label: "episodes", value: "11" },
    { label: "actors", value: "9" },
    { label: "objects", value: "189" },
  ],
  "fb-sustainability-2026": [
    { label: "sources", value: "30" },
    { label: "episodes", value: "11" },
    { label: "actors", value: "8" },
    { label: "objects", value: "170" },
  ],
};

function trackLandingEvent(eventName: string, params: Record<string, string>) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: params }));
  const withAnalytics = window as Window & {
    gtag?: (command: "event", eventName: string, params: Record<string, string>) => void;
    dataLayer?: unknown[];
  };
  withAnalytics.dataLayer?.push({ event: eventName, ...params });
  withAnalytics.gtag?.("event", eventName, params);
}

export function Phase8WowLanding() {
  const [personaId, setPersonaId] = useState<PersonaId>("foreign-policy-analyst");
  const [contextId, setContextId] = useState<ContextId>("indo-pacific-2026");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [coreOrder, setCoreOrder] = useState<CorePreviewId[]>(corePreview.map((core) => core.id));
  const [draggingCore, setDraggingCore] = useState<CorePreviewId | null>(null);

  const persona = personas.find((item) => item.id === personaId) ?? personas[0];
  const context = contexts.find((item) => item.id === contextId) ?? contexts[0];
  const activeQuestion = context.questions[questionIndex % context.questions.length];

  const personaAnswers = useMemo(
    () =>
      personas.map((item) => ({
        ...item,
        active: item.id === personaId,
      })),
    [personaId],
  );

  function runDemoQuestion() {
    trackLandingEvent("demo_question_asked", {
      persona: persona.id,
      context: context.id,
      question: activeQuestion.question,
    });
  }

  function trackMethod(methodName: string) {
    trackLandingEvent("method_run", { method: methodName, source: "landing_phase8" });
  }

  function trackSignup() {
    trackLandingEvent("sign_up_clicked", { source: "landing_phase8" });
  }

  function dropLandingCore(targetId: CorePreviewId) {
    if (!draggingCore || draggingCore === targetId) return;
    setCoreOrder((current) => {
      const withoutDragged = current.filter((id) => id !== draggingCore);
      const targetIndex = withoutDragged.indexOf(targetId);
      if (targetIndex < 0) return current;
      const next = [...withoutDragged];
      next.splice(targetIndex, 0, draggingCore);
      return next;
    });
    setDraggingCore(null);
  }

  const orderedCorePreview = coreOrder
    .map((id) => corePreview.find((core) => core.id === id))
    .filter(Boolean) as typeof corePreview[number][];

  return (
    <div className="bg-[#F4F7FA] text-[#111827]">
      <section className="relative overflow-hidden border-b border-[#C6D2DD] bg-[linear-gradient(135deg,#F8FBFD_0%,#EEF6F6_46%,#F9F0D5_100%)]">
        <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-8 px-4 pb-8 pt-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-12 lg:pt-12">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a5a00]">PRAXIS by TACITUS</p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-[1.02] text-[#111827] sm:text-6xl lg:text-7xl">
              Ask better questions of live policy work.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#374151] sm:text-lg">
              PRAXIS turns a situation, a role, and a task into sourced analysis, tool runs, and drafts that fit the work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/demo/${context.id}`}
                prefetch={false}
                onClick={runDemoQuestion}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#243244]"
              >
                Try the demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/app"
                prefetch={false}
                onClick={trackSignup}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#4A90A4] bg-white px-5 py-3 text-sm font-semibold text-[#0B3B4A] transition hover:bg-[#EAF5F7]"
              >
                Open real app <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/pricing"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-md border border-[#9f8d61] bg-white/70 px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-white"
              >
                View pricing
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl gap-2 sm:grid-cols-3">
              {[
                ["57", "tool contracts"],
                ["8", "context panels"],
                ["10", "primary methods"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-[#C6D2DD] bg-white/75 px-3 py-3">
                  <p className="text-2xl font-semibold text-[#0B3B4A]">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#5C6975]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-lg border border-[#d7c89f] bg-white shadow-2xl shadow-[#111827]/10">
              <div className="border-b border-[#e5dcc2] px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a5a00]">Live demo bar</p>
                    <p className="mt-1 text-sm font-medium text-[#4b5563]">No login required. Cached demo responses load instantly.</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#eef7f1] px-3 py-1 text-xs font-semibold text-[#166534]">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    ready
                  </span>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">User model</span>
                  <select
                    value={personaId}
                    onChange={(event) => setPersonaId(event.target.value as PersonaId)}
                    className="mt-2 w-full rounded-md border border-[#d7c89f] bg-[#fffaf0] px-3 py-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#8a5a00]"
                  >
                    {personas.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Context</span>
                  <select
                    value={contextId}
                    onChange={(event) => {
                      setContextId(event.target.value as ContextId);
                      setQuestionIndex(0);
                    }}
                    className="mt-2 w-full rounded-md border border-[#d7c89f] bg-[#fffaf0] px-3 py-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#8a5a00]"
                  >
                    {contexts.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="border-y border-[#e5dcc2] bg-[#fbf7ed] p-4 sm:p-5">
                <div className="flex flex-wrap gap-2">
                  {context.questions.map((item, index) => (
                    <button
                      key={item.question}
                      type="button"
                      onClick={() => setQuestionIndex(index)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${index === questionIndex ? "bg-[#111827] text-white" : "bg-white text-[#374151] hover:bg-[#f3ead1]"}`}
                    >
                      {item.question}
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-[#d7c89f] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-[#8a5a00]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{activeQuestion.question}</p>
                      <p className="mt-3 text-sm leading-6 text-[#374151]">{activeQuestion.answer}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                        {persona.short} · {context.region} · {context.stats}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={activeQuestion.targetPath}
                    prefetch={false}
                    onClick={runDemoQuestion}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#8a5a00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#714900]"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Run cached answer
                  </Link>
                  <Link
                    href={`/demo/${context.id}`}
                    prefetch={false}
                    className="inline-flex items-center justify-center rounded-md border border-[#d7c89f] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#fffaf0]"
                  >
                    Open read-only context
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="two-contexts" className="border-b border-[#d7c89f] bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a5a00]">Two contexts, one engine</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-[#111827] sm:text-5xl">The same question changes by role.</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {personaAnswers.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPersonaId(item.id)}
                className={`rounded-lg border p-5 text-left transition ${item.active ? "border-[#8a5a00] bg-[#fff8e5] shadow-lg shadow-[#8a5a00]/10" : "border-[#e5dcc2] bg-[#fbfaf7] hover:border-[#c4b37f]"}`}
              >
                <p className="text-sm font-semibold text-[#111827]">{item.label}</p>
                <p className="mt-3 text-sm leading-6 text-[#4b5563]">{item.answer}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="graph-intelligence" className="border-b border-[#d7c89f] bg-[#111827] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f6c85f]">Graph intelligence</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-5xl">The answer is only useful if the graph behind it is legible.</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-300 sm:text-base">
              Each demo context carries a visible operating picture: source receipts, actors, claims, evidence, and drafts stay connected instead of disappearing into a chat transcript.
            </p>
          </div>
          <ContextGraphPreview
            title={`${context.label} graph`}
            summary={`${persona.label} view for ${context.region}: the public demo keeps the graph path visible from source intake through drafting.`}
            stats={graphStatsByContext[context.id]}
          />
        </div>
      </section>

      <section id="real-app" className="border-b border-[#C6D2DD] bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B6F70]">Inside the real app</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-[#111827] sm:text-5xl">
                Not a chat box. A working console for policy analysis.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#4B5563] sm:text-base">
                The public demo is a window into shipped app surfaces: dashboard, workbench, graph, memo studio, boardroom, ACH, and context creation. Sign in to create private contexts and keep the core stack attached to the work.
              </p>
              <Link
                href="/app"
                prefetch={false}
                onClick={trackSignup}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-[#0B3B4A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#155C6F]"
              >
                Open real app <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {realAppSurfaces.map((surface) => {
                const Icon = surface.icon;
                return (
                  <Link
                    key={surface.label}
                    href={surface.href}
                    prefetch={false}
                    className="group min-h-[184px] rounded-lg border border-[#D9E2E8] bg-[#F8FBFD] p-4 transition hover:-translate-y-0.5 hover:border-[#4A90A4] hover:bg-white hover:shadow-lg hover:shadow-[#0B3B4A]/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#0B6F70] ring-1 ring-[#D9E2E8]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="rounded-full border border-[#C6D2DD] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#5C6975]">
                        {surface.signal}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#111827]">{surface.label}</p>
                    <p className="mt-2 text-sm leading-5 text-[#4B5563]">{surface.detail}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0B6F70]">
                      Open surface <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="core-stack" className="border-b border-[#C6D2DD] bg-[#07131F] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7DD3C7]">User Core + Context Cores</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-5xl">
              Drag the work stack before the tool runs.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
              PRAXIS keeps the user model, active context, source receipts, graph, and output package separate enough to inspect, but connected enough to move together. The authenticated dashboard now includes the same draggable core stack.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["User Core", persona.label],
                ["Context Core", context.label],
                ["Graph Core", graphStatsByContext[context.id][3].value + " objects"],
                ["Output Core", activeQuestion.question.includes("Draft") ? "Drafting" : "Memo-ready"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/8 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/8 p-4 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7DD3C7]">Core priority builder</p>
                <p className="mt-1 text-sm text-slate-300">Drag a core card, or open the real app to work with the live stack.</p>
              </div>
              <Settings2 className="h-5 w-5 text-[#F6C85F]" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-3">
              {orderedCorePreview.map((core, index) => (
                <div
                  key={core.id}
                  draggable
                  onDragStart={() => setDraggingCore(core.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropLandingCore(core.id)}
                  onDragEnd={() => setDraggingCore(null)}
                  className={cn(
                    "grid cursor-grab gap-3 rounded-lg border p-4 text-[#111827] transition sm:grid-cols-[auto_1fr_auto] sm:items-center active:cursor-grabbing",
                    core.tone,
                    draggingCore === core.id && "scale-[0.99] opacity-60",
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0B3B4A]">{index + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold">{core.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#4B5563]">{core.detail}</span>
                  </span>
                  <GripVertical className="h-5 w-5 text-[#5C6975]" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="methods" className="border-b border-[#d7c89f] bg-[#f7f3e8] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a5a00]">The right tools for the work</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-[#111827] sm:text-5xl">Ten methods, one workspace.</h2>
            </div>
            <Link href="/methods" prefetch={false} className="inline-flex items-center gap-2 text-sm font-semibold text-[#8a5a00]">
              See methods <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {methods.map(([name, summary]) => (
              <Link
                key={name}
                href="/methods"
                prefetch={false}
                onClick={() => trackMethod(name)}
                className="rounded-lg border border-[#d7c89f] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#8a5a00] hover:shadow-lg hover:shadow-[#111827]/10"
              >
                <Sparkles className="h-4 w-4 text-[#8a5a00]" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-[#111827]">{name}</p>
                <p className="mt-2 text-sm leading-5 text-[#4b5563]">{summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="drafting" className="border-b border-[#d7c89f] bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a5a00]">Drafting that fits the work</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-[#111827] sm:text-5xl">A draft should know the meeting it is for.</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <DraftPanel
              title="Generic draft"
              icon={FileText}
              items={[
                "Broad summary with unsupported claims.",
                "No audience, decision moment, or source posture.",
                "Useful language, but weak handoff value.",
              ]}
            />
            <DraftPanel
              title="PRAXIS draft"
              icon={ShieldCheck}
              items={[
                "Briefing goal, audience, and decision path are explicit.",
                "Claims carry visible source posture and gaps.",
                "Sections are ready for analyst review and export.",
              ]}
              highlighted
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-[#d7c89f] bg-[#111827] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f6c85f]">Pricing</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-5xl">Start with the demo. Scale when the workflow is real.</h2>
            <Link
              href="/pricing"
              prefetch={false}
              onClick={trackSignup}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-[#f6c85f] px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#ffd980]"
            >
              Compare plans <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Demo", "Analyst", "Team"].map((plan) => (
              <div key={plan} className="rounded-lg border border-white/15 bg-white/8 p-5">
                <p className="text-lg font-semibold">{plan}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {plan === "Demo" ? "Read-only contexts and cached answers." : plan === "Analyst" ? "Private situations, methods, and drafts." : "Shared contexts, handoffs, and review."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="bg-[#f7f3e8] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
            <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4" aria-hidden="true" /> Policy teams</span>
            <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" aria-hidden="true" /> Institutions</span>
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" /> Research desks</span>
            <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Private workspaces</span>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {trustItems.map(([title, summary]) => (
              <div key={title} className="rounded-lg border border-[#d7c89f] bg-white p-4">
                <p className="text-sm font-semibold text-[#111827]">{title}</p>
                <p className="mt-2 text-sm leading-5 text-[#4b5563]">{summary}</p>
              </div>
            ))}
          </div>
          <footer className="mt-10 flex flex-col gap-4 border-t border-[#d7c89f] pt-6 text-sm text-[#4b5563] sm:flex-row sm:items-center sm:justify-between">
            <p>PRAXIS by TACITUS</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/docs" prefetch={false}>Docs</Link>
              <Link href="/privacy" prefetch={false}>Privacy</Link>
              <Link href="/terms" prefetch={false}>Terms</Link>
              <Link href="/legal/security" prefetch={false}>Security</Link>
              <a href="mailto:hello@tacitus.me">Contact</a>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}

function DraftPanel({
  title,
  icon: Icon,
  items,
  highlighted = false,
}: {
  title: string;
  icon: typeof FileText;
  items: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-5 ${highlighted ? "border-[#8a5a00] bg-[#fff8e5]" : "border-[#e5dcc2] bg-[#fbfaf7]"}`}>
      <Icon className="h-5 w-5 text-[#8a5a00]" aria-hidden="true" />
      <p className="mt-4 text-lg font-semibold text-[#111827]">{title}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-[#374151]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a5a00]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
