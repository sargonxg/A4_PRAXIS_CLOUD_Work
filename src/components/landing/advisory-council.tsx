"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { advisors, type Advisor } from "@/lib/constants/advisors";

function AdvisorAvatar({ advisor, size = "md" }: { advisor: Advisor; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-16 w-16 text-lg",
    lg: "h-20 w-20 text-xl",
  };

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
      {advisor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
    </div>
  );
}

function AdvisorCard({ advisor, onClick }: { advisor: Advisor; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-64 shrink-0 flex-col items-center rounded-xl border border-cream-300/60 bg-white/70 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy-950/5 hover:border-gold-600/20"
    >
      <AdvisorAvatar advisor={advisor} size="lg" />
      <h3 className="mt-4 text-base font-semibold text-navy-900">{advisor.name}</h3>
      <p className="mt-1 text-xs font-medium text-gold-700">{advisor.title}</p>
      <p className="mt-3 text-sm italic text-navy-500 leading-relaxed">
        &ldquo;{advisor.tagline}&rdquo;
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {advisor.expertise.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-cream-200 px-2.5 py-0.5 text-[10px] font-medium text-navy-600"
          >
            {tag}
          </span>
        ))}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/30 px-6 backdrop-blur-sm"
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
          className="absolute top-4 right-4 text-navy-400 hover:text-navy-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-5">
          <AdvisorAvatar advisor={advisor} size="lg" />
          <div>
            <h3 className="text-xl font-semibold text-navy-900">{advisor.name}</h3>
            <p className="text-sm font-medium text-gold-700">{advisor.title}</p>
            <p className="mt-1 text-sm italic text-navy-500">
              &ldquo;{advisor.tagline}&rdquo;
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-navy-600">
          {advisor.bio}
        </p>

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

        <div className="mt-6 flex items-center gap-2 text-xs text-sage font-medium">
          <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />
          Always Online
        </div>

        <button
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-diplomatic-blue px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-diplomatic-blue/90"
        >
          Summon in Your Workspace
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
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
            Your Advisory Council — AI Experts, Always On Call
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            Each advisor brings decades of specialized experience to your
            analysis. Ask them anything.
          </p>
        </motion.div>

        {/* Scrollable advisor cards */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12"
        >
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {advisors.map((advisor) => (
              <div key={advisor.id} className="snap-start">
                <AdvisorCard
                  advisor={advisor}
                  onClick={() => setSelectedAdvisor(advisor)}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modal */}
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
