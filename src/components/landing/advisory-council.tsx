"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, MessageSquareQuote, Database, Network, Wrench } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { advisors, type Advisor } from "@/lib/constants/advisors";

function AdvisorAvatar({ advisor, size = "md" }: { advisor: Advisor; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-16 w-16 text-lg",
    lg: "h-20 w-20 text-xl",
  };
  const initials = advisor.name.replace(/^(Dr\.|Gen\.|Amb\.|Col\.)\s*/, "").split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-serif font-semibold",
        sizeClasses[size]
      )}
      style={{
        backgroundColor: `${advisor.color}15`,
        color: advisor.color,
        border: `2px solid ${advisor.color}40`,
      }}
    >
      {initials}
    </div>
  );
}

function AdvisorCard({ advisor, onClick }: { advisor: Advisor; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex h-full flex-col items-start rounded-2xl border border-cream-300/60 bg-white/80 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-gold-600/30 hover:shadow-lg hover:shadow-navy-950/5"
    >
      <div className="flex items-center gap-4">
        <AdvisorAvatar advisor={advisor} size="md" />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-navy-900">{advisor.name}</h3>
          <p className="truncate text-xs font-medium text-gold-700">{advisor.title}</p>
        </div>
      </div>

      <p className="mt-4 text-sm italic leading-relaxed text-navy-500">
        &ldquo;{advisor.tagline}&rdquo;
      </p>

      <p className="mt-4 text-xs leading-relaxed text-navy-600 line-clamp-3">
        {advisor.boardroomRole}
      </p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {advisor.expertise.slice(0, 3).map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-cream-200 px-2.5 py-0.5 text-[10px] font-medium text-navy-600"
          >
            {tag}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-2 text-xs text-navy-500 group-hover:text-diplomatic-blue">
        <MessageSquareQuote className="h-3.5 w-3.5" />
        <span className="line-clamp-1">{advisor.signature}</span>
      </div>
    </button>
  );
}

function AdvisorModal({ advisor, onClose }: { advisor: Advisor; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-lg rounded-2xl border border-cream-300 bg-cream-100 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-navy-400 hover:text-navy-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-5">
          <AdvisorAvatar advisor={advisor} size="lg" />
          <div>
            <h3 className="text-xl font-semibold text-navy-900">{advisor.name}</h3>
            <p className="text-sm font-medium text-gold-700">{advisor.title}</p>
            <p className="mt-1 text-sm italic text-navy-500">&ldquo;{advisor.tagline}&rdquo;</p>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-navy-600">{advisor.bio}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {advisor.expertise.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-cream-300 bg-white px-3 py-1 text-xs font-medium text-navy-600"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/5 p-3 text-xs text-navy-700">
          <p className="font-semibold text-diplomatic-blue">How {advisor.name.split(" ").slice(-1)[0]} reasons</p>
          <p className="mt-1 leading-relaxed">
            {advisor.method}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <CapabilityBlock
            icon={Wrench}
            title="Tools"
            items={advisor.toolAccess}
          />
          <CapabilityBlock
            icon={Database}
            title="Data"
            items={advisor.dataAccess}
          />
        </div>

        <div className="mt-4 rounded-lg border border-gold-600/20 bg-gold-600/5 p-3 text-xs text-navy-700">
          <div className="flex items-center gap-2 font-semibold text-gold-800">
            <Network className="h-3.5 w-3.5" />
            Dialectica-ready graph layer
          </div>
          <p className="mt-1 leading-relaxed">{advisor.dialecticaLayer}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-diplomatic-blue px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-diplomatic-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40"
          >
            Open in your workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/demo/advisory"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-diplomatic-blue/20 px-5 py-3 text-sm font-semibold text-diplomatic-blue transition-all hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
          >
            Try in the demo
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CapabilityBlock({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Wrench;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-cream-300 bg-white/70 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-diplomatic-blue">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <ul className="mt-2 space-y-1">
        {items.slice(0, 4).map((item) => (
          <li key={item} className="text-[11px] leading-snug text-navy-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GraphMemoryCallout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
      className="mx-auto mt-16 max-w-4xl rounded-2xl border border-diplomatic-blue/15 bg-diplomatic-blue/5 p-8"
    >
      <p className="text-overline text-diplomatic-blue">Graph memory, not token soup</p>
      <h3 className="mt-2 font-serif text-2xl text-navy-900 sm:text-3xl">
        Every advisor reasons inside your situation&rsquo;s knowledge graph — not in a vacuum.
      </h3>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-navy-600">
        Off-the-shelf LLMs forget what they said yesterday. PRAXIS wires each advisor into the
        Situation Knowledge Core: actors, claims, interests, commitments, events — extracted
        from your documents and data feeds into a living ACO graph with 14 entity types and 72
        typed relationships. Queries resolve through the graph first, so answers are grounded,
        citable, and consistent across turns.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-navy-600">
        Your analyst profile — mandate, lenses, red lines, preferred sources — calibrates every
        response. Your rolling advisor summary keeps conversations coherent across weeks.
        That is the shift: from stateless chat to persistent analytical context that compounds
        over time.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-navy-600">
        The premium backbone is designed to plug into Dialectica dynamic ontologies: expert-specific
        layers for actors, capabilities, claims, fiscal flows, commitments, and precedents that can
        be queried, audited, and reused across boardroom deliberations.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Callout title="Per-user profile" body="11-dimension calibration, typed into every prompt." />
        <Callout title="Per-situation graph" body="ACO v2: 14 entity types, 72 relationships." />
        <Callout title="Per-session memory" body="Rolling summaries + last-turns recall per advisor." />
      </div>
    </motion.div>
  );
}

function Callout({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-cream-300 bg-white/60 p-3">
      <p className="text-xs font-semibold text-diplomatic-blue">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-navy-600">{body}</p>
    </div>
  );
}

export function AdvisoryCouncil() {
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);

  return (
    <section id="advisory" className="relative px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Advisory Council</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 text-center"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Four specialists. One persistent brief.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            Four AI advisors, each with a distinct method, source diet, tool contract, and
            boardroom role. They remember your situation and reason from your context.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {advisors.map((advisor) => (
            <AdvisorCard
              key={advisor.id}
              advisor={advisor}
              onClick={() => setSelectedAdvisor(advisor)}
            />
          ))}
        </motion.div>

        <GraphMemoryCallout />
      </div>

      <AnimatePresence>
        {selectedAdvisor && (
          <AdvisorModal
            advisor={selectedAdvisor}
            onClose={() => setSelectedAdvisor(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
