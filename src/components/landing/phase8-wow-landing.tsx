"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GitFork,
  LibraryBig,
  MessageSquareText,
  Network,
  Plus,
  Repeat2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { CoreCapsuleHero } from "./core-capsule-hero";
import { ContextCapsulePreview } from "@/components/context/context-capsule-preview";
import { PolicyTicker } from "./policy-ticker";
import { SpecimenCard, SpecimenGrid, type CoreSpecimenKind } from "@/components/cores/specimen-card";
import {
  CAPSULE_CAPABILITY_AREAS,
  CAPSULE_COMBINATION_RECIPES,
  CAPSULE_CONNECTOR_IDEAS,
  CAPSULE_OUTPUT_PRODUCTS,
  CONTEXT_CAPSULE_TEMPLATES,
  PENDING_CONTEXT_CAPSULE_OUTPUT_KEY,
  PENDING_CONTEXT_CAPSULE_PATH_KEY,
  PENDING_CONTEXT_CAPSULE_PROMPT_KEY,
  PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY,
  POLICY_PATH_PROFILES,
  contextCapsuleLoginHref,
  type ContextCapsuleTemplate,
  type PolicyPathId,
  type PolicyPathProfile,
} from "@/lib/product/context-capsules";

const SPECIMENS: ReadonlyArray<{
  kind: CoreSpecimenKind;
  serial: string;
  title: string;
  essence: string;
  state: string;
}> = [
  { kind: 'user', serial: 'PRX-CORE-USR-202604', title: 'Senior policy analyst', essence: 'Role, mandate, audience, red lines, language, preferred evidentiary standard.', state: 'inherited' },
  { kind: 'situation', serial: 'PRX-CORE-SIT-202604', title: 'Indo-Pacific 2026', essence: 'Actors, geography, live tensions, institutional constraints, domain lock.', state: 'active' },
  { kind: 'path', serial: 'PRX-CORE-PTH-202604', title: 'Diplomacy & Negotiation', essence: 'The working method: ZOPA, BATNA, ripeness, sequencing, treaty-aware voice.', state: 'swappable' },
  { kind: 'source', serial: 'PRX-CORE-SRC-202604', title: '42 receipts attached', essence: 'Briefings, datasets, cables, page spans, source posture, and open gaps.', state: 'grounded' },
  { kind: 'graph', serial: 'PRX-CORE-GRF-202604', title: 'Actor-claim lattice v3', essence: 'Claims, commitments, actors, evidence links, proposed patches awaiting review.', state: 'review' },
  { kind: 'time', serial: 'PRX-CORE-TIM-202604', title: 'Horizon: 2026-2028', essence: 'Valid-time window, freshness gates, scenario horizon, bitemporal posture.', state: 'gated' },
  { kind: 'output', serial: 'PRX-CORE-OUT-202604', title: 'Cited options memo', essence: 'Audience, format, tone, review posture, export rules, handover package.', state: 'ready' },
];

const HERO_TEMPLATES = CONTEXT_CAPSULE_TEMPLATES.slice(0, 8);
const FEATURED_PROMPTS = CONTEXT_CAPSULE_TEMPLATES.slice(0, 6);
const POLICY_PATH_PREVIEW = POLICY_PATH_PROFILES.slice(0, 8);
const COMBINATION_PREVIEW = CAPSULE_COMBINATION_RECIPES.slice(0, 4);
const DEFAULT_POLICY_PATH = POLICY_PATH_PROFILES[0]!;
const DEFAULT_OUTPUT_GOAL = CAPSULE_OUTPUT_PRODUCTS[0]?.label ?? 'Options memo';

const ACTIVE_BAR_PREVIEW = [
  'User Core',
  'Situation',
  'Sources',
  'Time',
  'Power',
  'Tools',
  'Output',
  'Handover',
] as const;

const AI_BAR_RUN_PLAN = [
  ['Understand', 'Classify the question into research, review, drafting, or handover.'],
  ['Attach', 'Pull User, Situation, Source, Time, Power, Tool, and Output cores into one capsule.'],
  ['Run tools', 'Recommend Sourceability Check, temporal review, power map, or memo drafting from the same bar.'],
  ['Ship', 'Send the answer, gaps, and receipts to Memo Studio or a handover package.'],
] as const;

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    line: 'Solo researcher · capped flows.',
    features: ['1 capsule', '5 paths', '50 flows / mo', 'Community support'],
    cta: { label: 'Start free', href: '/login' },
    accent: false,
  },
  {
    name: 'Practitioner',
    price: '$49',
    cadence: '/ analyst / month',
    line: 'Working analyst · all paths, full readiness.',
    features: ['Unlimited capsules', '10 operator paths', '500 flows / mo', 'Memory Bank', 'Capsule fork + share'],
    cta: { label: 'Upgrade', href: '/app/billing/upgrade' },
    accent: true,
  },
  {
    name: 'Team',
    price: '$199',
    cadence: '/ seat / month',
    line: 'Hybrid teams · governance + audit.',
    features: ['Everything in Practitioner', 'Shared capsule library', 'Audit ledger export', 'SAML SSO', 'SLA support'],
    cta: { label: 'Talk to sales', href: '/pricing' },
    accent: false,
  },
] as const;

const workflow = [
  ["Build the capsule", "Start with a name and a few details, then let PRAXIS scaffold the User, Situation, Source, Time, Power, Tool, and Output cores."],
  ["Make context explicit", "DIALECTICA, KAIROS, and AGON stay behind the scenes to structure source knowledge, episodes, power dynamics, and tacit relations."],
  ["Ask and use tools", "The AI bar reasons from the active capsule and recommends capsule-aware tools instead of dropping the user into a raw marketplace."],
  ["Share the handover", "Fork, lock, combine, or hand the capsule to a teammate, director, or AI agent with sources and review gates intact."],
] as const;

const proofPanels = [
  {
    label: "Library",
    href: "/app/workbench/indo-pacific-2026?tab=library",
    icon: LibraryBig,
    title: "Sourceability for serious work.",
    detail: "Upload PDFs, DOCX, links, notes, and source sets. PRAXIS keeps receipts, weak claims, contradictions, and gaps visible before AI writes.",
  },
  {
    label: "Temporality + Power",
    href: "/app/workbench/indo-pacific-2026?tab=graph",
    icon: Network,
    title: "Show what changed and who matters.",
    detail: "KAIROS-style episodes and AGON-style power maps help PRAXIS model deadlines, stale assumptions, approvers, blockers, incentives, and conflict dynamics.",
  },
  {
    label: "Memo Studio",
    href: "/app/write",
    icon: FileText,
    title: "Write from the capsule.",
    detail: "Draft memos, briefs, talking points, board notes, and handover packs from a managed capsule instead of a blank prompt or scattered transcript.",
  },
] as const;

const trustItems = [
  ["Inheritable capsules", "User, Situation, Sources, Temporality, Power, Tools, Output, and Handover travel together."],
  ["Temporal readiness", "Date-sensitive claims, episodes, and scenario windows stay explicit instead of hidden in prose."],
  ["Sourceability", "Every serious claim points to a receipt, a gap, a contradiction, or a human review action."],
  ["Human gates", "Graph changes, external actions, exports, and agent handovers stay approval-aware."],
] as const;

const assemblySteps = [
  { icon: Plus, label: 'Scaffold', detail: 'Create a capsule from a bar prompt, even if you only know the name, user, situation, and output goal.' },
  { icon: Repeat2, label: 'Deepen', detail: 'Add documents, links, episodes, rules, tacit notes, tools, and inferred relationships over time.' },
  { icon: GitFork, label: 'Combine', detail: 'Merge capsules for bigger policy work while preserving sources, timelines, graph conflicts, and provenance.' },
  { icon: FileText, label: 'Hand over', detail: 'Send a director, teammate, or AI agent the working context, allowed actions, and review gates.' },
] as const;

type ToolbarPathPreview = {
  path: PolicyPathProfile;
  confidence: number;
  source: 'registry' | 'route';
};

function persistCapsulePrompt(prompt: string, templateId?: string, pathId?: string, outputGoal?: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_PROMPT_KEY, prompt);
  if (templateId) window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY, templateId);
  if (pathId) window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_PATH_KEY, pathId);
  if (outputGoal?.trim()) window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_OUTPUT_KEY, outputGoal.trim());
}

function classifyPromptFromRegistry(prompt: string): ToolbarPathPreview {
  const words = prompt.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const uniqueWords = Array.from(new Set(words.filter((word) => word.length > 2)));
  let best = DEFAULT_POLICY_PATH;
  let bestScore = 0;

  for (const path of POLICY_PATH_PROFILES) {
    const profileText = [
      path.id,
      path.label,
      path.userFrame,
      ...path.suggestedTools,
      ...path.suggestedOutputs,
      ...path.defaultTemplates,
    ].join(' ').toLowerCase();
    const score = uniqueWords.reduce((total, word) => total + (profileText.includes(word) ? 1 : 0), 0);
    if (score > bestScore) {
      best = path;
      bestScore = score;
    }
  }

  return {
    path: best ?? DEFAULT_POLICY_PATH,
    confidence: bestScore ? Math.min(0.88, 0.52 + bestScore * 0.09) : 0.42,
    source: 'registry',
  };
}

function useCapsuleLaunch() {
  const [prompt, setPrompt] = useState('Prepare a director briefing on a regulatory change.');
  const [selectedPathId, setSelectedPathId] = useState<PolicyPathId>(DEFAULT_POLICY_PATH.id);
  const [outputGoal, setOutputGoal] = useState(DEFAULT_OUTPUT_GOAL);
  const [routePathPreview, setRoutePathPreview] = useState<ToolbarPathPreview | null>(null);

  const registryPathPreview = useMemo(() => classifyPromptFromRegistry(prompt), [prompt]);
  const pathPreview = routePathPreview?.path.id === registryPathPreview.path.id ? routePathPreview : registryPathPreview;
  const selectedPath = POLICY_PATH_PROFILES.find((path) => path.id === selectedPathId) ?? pathPreview.path;

  useEffect(() => {
    if (!prompt.trim()) return;
    const preview = classifyPromptFromRegistry(prompt);
    setSelectedPathId((current) => (current === DEFAULT_POLICY_PATH.id ? preview.path.id : current));
  }, [prompt]);

  useEffect(() => {
    if (!prompt.trim() || prompt.trim().length < 18) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch('/api/paths/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedText: prompt }),
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((result: { policyPathId?: PolicyPathId; confidence?: number } | null) => {
          const path = POLICY_PATH_PROFILES.find((item) => item.id === result?.policyPathId);
          if (!path) return;
          setRoutePathPreview({ path, confidence: result?.confidence ?? 0.5, source: 'route' });
          setSelectedPathId((current) => (current === registryPathPreview.path.id ? path.id : current));
        })
        .catch(() => {
          // Public visitors normally cannot call the authenticated route; keep the registry preview.
        });
    }, 650);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [prompt, registryPathPreview.path.id]);

  function launch(nextPrompt = prompt, templateId?: string) {
    const clean = nextPrompt.trim();
    if (!clean) return;
    persistCapsulePrompt(clean, templateId, selectedPath.id, outputGoal);
    window.location.href = contextCapsuleLoginHref(clean, templateId, selectedPath.id, outputGoal);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    launch();
  }

  function selectTemplate(template: ContextCapsuleTemplate) {
    setPrompt(template.prompt);
    const nextPath = classifyPromptFromRegistry(template.prompt).path;
    const nextOutput = template.output || nextPath.suggestedOutputs[0] || outputGoal;
    setSelectedPathId(nextPath.id);
    setOutputGoal(nextOutput);
    persistCapsulePrompt(template.prompt, template.id, nextPath.id, nextOutput);
  }

  return {
    prompt,
    setPrompt,
    submit,
    launch,
    selectTemplate,
    pathPreview,
    selectedPath,
    selectedPathId,
    setSelectedPathId,
    outputGoal,
    setOutputGoal,
  };
}

function StaggerSpecimens() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
      }}
    >
      <SpecimenGrid className="mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SPECIMENS.map((s) => (
          <motion.div
            key={s.kind}
            variants={{
              hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 28 } },
            }}
          >
            <SpecimenCard
              kind={s.kind}
              serial={s.serial}
              title={s.title}
              essence={s.essence}
              trailing={
                <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {s.state}
                </span>
              }
            />
          </motion.div>
        ))}
      </SpecimenGrid>
    </motion.div>
  );
}

export function Phase8WowLanding() {
  const {
    prompt,
    setPrompt,
    submit,
    launch,
    selectTemplate,
    pathPreview,
    selectedPath,
    selectedPathId,
    setSelectedPathId,
    outputGoal,
    setOutputGoal,
  } = useCapsuleLaunch();
  const outputOptions = useMemo(
    () => Array.from(new Set([outputGoal, ...selectedPath.suggestedOutputs, ...CAPSULE_OUTPUT_PRODUCTS.map((product) => product.label)])).slice(0, 8),
    [outputGoal, selectedPath.suggestedOutputs],
  );
  const suggestedTools = selectedPath.suggestedTools.slice(0, 3);

  return (
    <main className="bg-[#F6F8FB] text-[#111827]">
      <section id="core-stack" className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(440px,1.05fr)] lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8A5A00]">
              <span className="font-mono text-[10px] tracking-[0.2em] text-slate-400">vol. VI · No. 1</span>
              <span aria-hidden className="h-px w-6 bg-slate-300" />
              <span>PRAXIS by TACITUS</span>
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Build a ContextCapsule for the policy work in front of you.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              PRAXIS turns sources, timelines, stakeholders, rules, drafts, and decisions into shareable working context that humans and AI agents can safely inherit.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              The bar is the center: describe the serious work, scaffold the capsule, then deepen it with documents, links, KAIROS temporality, AGON power dynamics, policy tools, and human review gates.
            </p>
            <form onSubmit={submit} className="mt-7 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-navy-950/10">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="context-capsule-prompt">
                  What issue, decision, or analysis are you working on?
                </label>
                <div className="flex min-h-14 flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4">
                  <Sparkles className="h-5 w-5 shrink-0 text-[#8A5A00]" />
                  <textarea
                    id="context-capsule-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={2}
                    className="min-h-12 flex-1 resize-none bg-transparent py-3 text-sm leading-5 text-slate-950 outline-none placeholder:text-slate-500"
                    placeholder="What issue, decision, or analysis are you working on?"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#243244]"
                >
                  Build ContextCapsule
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
                {HERO_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => selectTemplate(template)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#8A5A00]/50 hover:text-[#8A5A00]"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-3 border-t border-slate-200 px-1 pt-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Suggested path
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {pathPreview.source === 'route' ? 'classified' : 'registry preview'} · {Math.round(pathPreview.confidence * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {POLICY_PATH_PROFILES.slice(0, 7).map((path) => (
                      <button
                        key={path.id}
                        type="button"
                        onClick={() => setSelectedPathId(path.id)}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          selectedPathId === path.id
                            ? 'border-[#8A5A00] bg-[#FFF8E6] text-[#6B4400]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-[#8A5A00]/50'
                        }`}
                      >
                        {path.label.replace(' analyst', '').replace(' practitioner', '')}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Output goal
                  <select
                    value={outputGoal}
                    onChange={(event) => setOutputGoal(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-900 outline-none focus:border-[#8A5A00]"
                  >
                    {outputOptions.map((output) => (
                      <option key={output} value={output}>
                        {output}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => launch()}
                className="inline-flex items-center gap-2 rounded-md bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#243244]"
              >
                Save preview after signup
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/app/assistant"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
              >
                Open Ask workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  After signup, this becomes the active bar
                </p>
                <Link href="/login?mode=signup&redirect=%2Fapp" className="text-xs font-semibold text-[#8A5A00]">
                  Log in or sign up
                </Link>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {ACTIVE_BAR_PREVIEW.map((item) => (
                  <span
                    key={item}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-2">
                {AI_BAR_RUN_PLAN.slice(0, 2).map(([label, detail]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-950">{label}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">{detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-950">No agent run before login</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">
                  This only preserves the prompt, path, and output goal so the authenticated app can build the capsule.
                </p>
              </div>
            </div>
            <dl className="mt-9 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200 pt-6 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <div>
                <dt className="font-semibold text-[#8A5A00]">Context</dt>
                <dd className="mt-1 normal-case tracking-normal text-slate-700">User, situation, output, tacit knowledge.</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8A5A00]">Time + power</dt>
                <dd className="mt-1 normal-case tracking-normal text-slate-700">Episodes, actors, approvers, blockers.</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8A5A00]">Sourceability</dt>
                <dd className="mt-1 normal-case tracking-normal text-slate-700">Receipts, gaps, review gates.</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <CoreCapsuleHero />
            <ContextCapsulePreview
              userLabel={selectedPath.label}
              situationLabel={prompt.trim() || 'New policy situation'}
              pathLabel={selectedPath.label}
              sourceCount={0}
              documentCount={0}
              sourcesLabel="Sources pending"
              graphState={selectedPath.userFrame}
              toolsLabel={suggestedTools.join(', ')}
              timeHorizon="Set after signup"
              outputGoal={outputGoal}
              healthScore={44}
              href="/app/assistant"
              className="mt-4"
            />
          </div>
        </div>
      </section>

      <section id="capsule-examples" className="border-b border-slate-200 bg-[#F6F8FB] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">Start from a policy responsibility</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                One click scaffolds a capsule the user can deepen after signup.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A new capsule can start thin: a name, user, situation, and output goal. It becomes serious as sources, rules, episodes, power maps, and tools are attached.
              </p>
            </div>
            <Link href="/login?mode=signup&redirect=%2Fapp%2Fassistant" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              Sign up for initial runs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {FEATURED_PROMPTS.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => launch(template.prompt, template.id)}
                className="group min-h-[12rem] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#8A5A00]/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{template.audience}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">{template.label}</h3>
                  </div>
                  <span className="rounded-full bg-[#111827] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    Try it
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{template.prompt}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {template.contextCores.slice(0, 5).map((core) => (
                    <span key={core} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold capitalize text-slate-600">
                      {core}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="policy-paths" className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">Generic first, path-specific when ready</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                A user can start generally, then bind the capsule to a policy path.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                PRAXIS should work for an undecided user with one problem and a deadline. As the capsule gets clearer, it can inherit path suggestions for tools, outputs, source posture, and review gates.
              </p>
              <div className="mt-5 rounded-lg border border-slate-200 bg-[#F9FBFC] p-4">
                <p className="text-sm font-semibold text-slate-950">{POLICY_PATH_PROFILES[0]?.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{POLICY_PATH_PROFILES[0]?.userFrame}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {POLICY_PATH_PROFILES[0]?.suggestedOutputs.map((output) => (
                    <span key={output} className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {output}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {POLICY_PATH_PREVIEW.slice(1).map((path) => (
                <article key={path.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-950">{path.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{path.userFrame}</p>
                  <div className="mt-3 grid gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">Tools</span>
                      <p className="mt-1">{path.suggestedTools.slice(0, 3).join(', ')}</p>
                    </div>
                    <div>
                      <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">Outputs</span>
                      <p className="mt-1">{path.suggestedOutputs.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="methods" className="border-b border-slate-200 bg-[#F6F8FB] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Build the capsule. Ask from it. Hand it over.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              PRAXIS keeps the first workflow short and pushes deeper graph, review, model, and tool controls into Advanced.
            </p>
          </div>
          <div className="mt-7 grid gap-4 lg:grid-cols-4">
            {workflow.map(([label, detail]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-3 text-sm font-semibold text-slate-950">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PolicyTicker />

      <section id="specimens" className="border-b border-slate-200 bg-[#FAF8F2] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">Six cores, packaged as one capsule</p>
              <h2 className="mt-2 max-w-3xl font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">
                Context is built brick by brick, then inherited.
              </h2>
              <div className="mt-4 max-w-3xl space-y-3 text-sm leading-6 text-slate-700">
                <p>
                  A capsule is the durable policy artifact: who is asking, what situation they mean, which evidence is attached, what graph is under review, what time horizon applies, and what output should be produced.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {assemblySteps.map((step) => (
                <div key={step.label} className="rounded-lg border border-[#D8C38A]/60 bg-white/70 p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#111827] text-white">
                      <step.icon className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-slate-950">{step.label}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <StaggerSpecimens />
        </div>
      </section>

      <section id="combine-capsules" className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">Combine without losing provenance</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Larger policy work is built by combining capsules, not flattening them.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The merge keeps receipts, graph conflicts, timelines, source freshness, caveats, and approval rules visible so a stronger brief does not erase uncertainty.
              </p>
            </div>
            <Link href="/app/contexts" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              Open capsule workbench
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-4 lg:grid-cols-4">
            {COMBINATION_PREVIEW.map((recipe) => (
              <article key={recipe.id} className="rounded-lg border border-slate-200 bg-[#F9FBFC] p-4">
                <GitFork className="h-5 w-5 text-[#0B3B4A]" />
                <h3 className="mt-3 text-sm font-semibold text-slate-950">{recipe.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{recipe.output}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recipe.mergeRules.slice(0, 2).map((rule) => (
                    <span key={rule} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {rule}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="drafting" className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {proofPanels.map((panel) => (
            <Link key={panel.label} href={panel.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#8A5A00]/40 hover:shadow-md">
              <panel.icon className="h-5 w-5 text-[#0B3B4A]" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{panel.label}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">{panel.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{panel.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="capabilities" className="border-b border-slate-200 bg-[#F6F8FB] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">Capsule-aware tools</p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">
                The marketplace stays, but the capsule chooses what matters.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                PRAXIS keeps the tool library available, then recommends the few capabilities that fit the active capsule: weak sources, missing timeline, thin power map, output goal, or handover risk.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {CAPSULE_CAPABILITY_AREAS.map((area) => (
                <div key={area.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">{area.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{area.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Outputs the capsule can produce</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {CAPSULE_OUTPUT_PRODUCTS.map((product) => (
                  <div key={product.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-950">{product.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{product.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Connectors staged by trust posture</p>
              <div className="mt-3 grid gap-2">
                {CAPSULE_CONNECTOR_IDEAS.map((connector) => (
                  <div key={connector.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-950">{connector.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{connector.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 ring-1 ring-slate-200">
                      {connector.posture}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="border-b border-slate-200 bg-[#FAF8F2] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">Subscriptions</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">
              Three plans. One capsule contract.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Free to start. Upgrade when capsules ship to teammates and Memory Bank lights up.
              No per-token credit math — just monthly flow quotas tied to the capsule contract.
            </p>
          </div>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <article
                key={tier.name}
                className={[
                  'flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm transition',
                  tier.accent
                    ? 'border-[#8A5A00] ring-2 ring-[#E8B931]/30'
                    : 'border-slate-200',
                ].join(' ')}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-950">{tier.name}</h3>
                  {tier.accent ? (
                    <span className="rounded-full bg-[#8A5A00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      most chosen
                    </span>
                  ) : null}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-semibold text-slate-950">{tier.price}</span>
                  <span className="text-xs text-slate-500">{tier.cadence}</span>
                </div>
                <p className="text-sm leading-snug text-slate-700">{tier.line}</p>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.cta.href}
                  className={[
                    'mt-auto inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition',
                    tier.accent
                      ? 'bg-[#111827] text-white hover:bg-[#243244]'
                      : 'border border-slate-300 bg-white text-slate-900 hover:border-slate-400',
                  ].join(' ')}
                >
                  {tier.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="real-app" className="border-b border-slate-200 bg-[#101827] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <ShieldCheck className="h-6 w-6 text-[#E8B931]" />
            <h2 className="mt-3 text-2xl font-semibold">Trust is visible before PRAXIS reasons.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              PRAXIS does not present generic certainty. It keeps inherited cores, temporal readiness, source receipts, graph proposals, and analyst review explicit.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map(([label, detail]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-lg border border-slate-200 bg-[#F9FBFC] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A5A00]">Start with context</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Ask PRAXIS from the active context.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/assistant" className="inline-flex items-center gap-2 rounded-md bg-[#111827] px-5 py-3 text-sm font-semibold text-white">
              Open Ask workspace
              <MessageSquareText className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900">
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

