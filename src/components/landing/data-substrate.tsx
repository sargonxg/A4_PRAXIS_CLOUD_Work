"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Database, Globe, Layers, Radar, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Source {
  name: string;
  role: string;
  tier: "free" | "freemium" | "premium" | "platform";
}

const FREE_SOURCES: Source[] = [
  { name: "Google Search (grounded)", role: "Live web intelligence via Gemini grounding", tier: "platform" },
  { name: "GDELT", role: "Global media event stream + tone", tier: "free" },
  { name: "GDELT Knowledge Graph", role: "Entity mention volume + tone", tier: "free" },
  { name: "Wikipedia", role: "Actor and institution enrichment", tier: "free" },
  { name: "ReliefWeb", role: "OCHA humanitarian situation reports", tier: "free" },
  { name: "HDX", role: "Displacement / food-security / funding", tier: "free" },
  { name: "UNHCR", role: "Refugee population statistics", tier: "free" },
  { name: "UCDP", role: "Uppsala conflict dataset", tier: "free" },
  { name: "World Bank WDI + WGI", role: "Economic + governance indicators", tier: "free" },
  { name: "SIPRI", role: "Arms transfer register", tier: "free" },
  { name: "Crisis Group", role: "Monthly CrisisWatch outlook", tier: "free" },
  { name: "UN News", role: "Secretary-General + agency statements", tier: "free" },
];

const PREMIUM_SOURCES: Source[] = [
  { name: "ACLED", role: "Event-by-event conflict dataset", tier: "freemium" },
  { name: "Tavily", role: "Parallel AI-optimised web search", tier: "freemium" },
  { name: "Parallel.ai", role: "Agentic web research & monitoring", tier: "premium" },
  { name: "Firecrawl", role: "JS-rendered page scraping", tier: "freemium" },
  { name: "Anthropic Claude", role: "Second AI voice for deep reasoning", tier: "premium" },
];

const TIER_CHIP: Record<Source["tier"], string> = {
  platform: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  free: "bg-sky-500/15 text-sky-700 ring-sky-500/30",
  freemium: "bg-amber-500/15 text-amber-700 ring-amber-500/30",
  premium: "bg-indigo-500/15 text-indigo-700 ring-indigo-500/30",
};

const TIER_LABEL: Record<Source["tier"], string> = {
  platform: "Platform default",
  free: "Free",
  freemium: "Freemium",
  premium: "Premium",
};

function SourceRow({ source }: { source: Source }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-cream-300 bg-white/80 p-3 hover:border-gold-600/30 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy-900">{source.name}</p>
        <p className="mt-0.5 text-xs text-navy-500">{source.role}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
          TIER_CHIP[source.tier],
        )}
      >
        {TIER_LABEL[source.tier]}
      </span>
    </div>
  );
}

export function DataSubstrate() {
  return (
    <section id="data" className="relative px-6 py-24 lg:py-28 bg-cream-50/50">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center"
        >
          <span className="text-overline text-gold-700">Data Substrate</span>
          <h2 className="mt-2 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Real sources. Real context. Free to start.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-500">
            PRAXIS ships with a dozen authoritative feeds wired in out of the box.
            Bring your own keys to unlock ACLED event-level data, Tavily parallel search,
            Parallel.ai agents, and Firecrawl ingestion.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-cream-300 bg-white/70 p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Free tier — always on
              </h3>
            </div>
            <div className="space-y-2">
              {FREE_SOURCES.map((s) => <SourceRow key={s.name} source={s} />)}
            </div>
            <p className="mt-4 text-xs italic text-navy-500">
              No credit card required. Works from the moment you sign in.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-cream-300 bg-white/70 p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
                Premium — BYO keys
              </h3>
            </div>
            <div className="space-y-2">
              {PREMIUM_SOURCES.map((s) => <SourceRow key={s.name} source={s} />)}
            </div>
            <p className="mt-4 text-xs italic text-navy-500">
              Your keys are encrypted at rest with AES-256-GCM. Server-side only — never shared.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 rounded-2xl border border-diplomatic-blue/15 bg-diplomatic-blue/5 p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-diplomatic-blue" />
            <h3 className="font-serif text-xl text-navy-900">
              Everything flows into your situation&rsquo;s knowledge graph
            </h3>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Bullet
              icon={<Globe className="h-4 w-4" />}
              title="Ingest"
              body="Documents are chunked and passed through the ACO v2 extractor — 14 entity types, 72 typed relationships, 4 confidence levels."
            />
            <Bullet
              icon={<Radar className="h-4 w-4" />}
              title="Enrich"
              body="Every Actor node gets a live Wikipedia summary plus GDELT mention volume and tone — the graph knows who is loud right now."
            />
            <Bullet
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Recall"
              body="Tools query the graph first, then feeds, then the model. Answers are grounded, citable, and consistent across sessions."
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-navy-600">
              Full methodology is published in-product under every tool&rsquo;s
              <span className="mx-1 font-semibold">About this tool</span>panel.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1 rounded-md bg-diplomatic-blue px-4 py-2 text-xs font-semibold text-white hover:bg-diplomatic-blue/90"
            >
              See it live in the demo →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Bullet({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-diplomatic-blue">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-navy-600">{body}</p>
    </div>
  );
}
