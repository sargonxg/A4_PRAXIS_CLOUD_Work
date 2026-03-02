"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Bell, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const institutions = [
  { id: "unsc", name: "UN Security Council", color: "#4B92DB", short: "UNSC" },
  { id: "unga", name: "UN General Assembly", color: "#4B92DB", short: "UNGA" },
  { id: "unhrc", name: "UN Human Rights Council", color: "#4B92DB", short: "UNHRC" },
  { id: "aupsc", name: "African Union PSC", color: "#E8B931", short: "AU PSC" },
  { id: "eucouncil", name: "EU Council", color: "#3D5A80", short: "EU" },
  { id: "osce", name: "OSCE Permanent Council", color: "#5B8C5A", short: "OSCE" },
  { id: "arab-league", name: "Arab League", color: "#C75B39", short: "AL" },
  { id: "asean", name: "ASEAN Regional Forum", color: "#7B6D8D", short: "ASEAN" },
];

const events = [
  { time: "10:00", title: "Open Debate: Protection of Civilians in Armed Conflict", institution: "unsc", topics: ["Humanitarian access", "IHL compliance", "Civilian harm tracking"], hasAIBrief: true },
  { time: "11:30", title: "1187th Meeting: Situation in the Sahel Region", institution: "aupsc", topics: ["MINUSMA withdrawal", "Counter-terrorism", "Governance gaps"], hasAIBrief: true },
  { time: "14:00", title: "Foreign Affairs Council: Eastern Partnership", institution: "eucouncil", topics: ["Sanctions review", "Energy security", "Democratic backsliding"], hasAIBrief: true },
  { time: "15:30", title: "Special Session: Human Rights in Sudan", institution: "unhrc", topics: ["RSF atrocities", "Humanitarian corridor", "ICC referral"], hasAIBrief: false },
  { time: "16:00", title: "Permanent Council Meeting: Mediterranean Situation", institution: "osce", topics: ["Migration routes", "Maritime security", "CSBMs"], hasAIBrief: true },
];

export function CalendarPreview() {
  const [selectedInst, setSelectedInst] = useState<string | null>(null);

  const filteredEvents = selectedInst
    ? events.filter((e) => e.institution === selectedInst)
    : events;

  return (
    <section className="relative px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Calendar Monitor</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Never Miss a Critical Session
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            Track every major institutional body in one unified calendar with
            AI-powered agenda previews and pre-briefing generation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="overflow-hidden rounded-xl border border-cream-300/60 bg-white/70 shadow-sm"
        >
          {/* Institution filter bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-cream-300/60 px-5 py-4">
            <button
              onClick={() => setSelectedInst(null)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                !selectedInst
                  ? "bg-diplomatic-blue text-white"
                  : "bg-cream-200/50 text-navy-600 hover:bg-cream-200"
              )}
            >
              All
            </button>
            {institutions.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setSelectedInst(selectedInst === inst.id ? null : inst.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  selectedInst === inst.id
                    ? "text-white"
                    : "bg-cream-200/50 text-navy-600 hover:bg-cream-200"
                )}
                style={selectedInst === inst.id ? { backgroundColor: inst.color } : undefined}
              >
                {inst.short}
              </button>
            ))}
          </div>

          {/* Date header */}
          <div className="flex items-center gap-3 border-b border-cream-300/40 px-5 py-3">
            <Calendar className="h-4 w-4 text-gold-600" />
            <span className="text-sm font-semibold text-navy-900">Today — 2 March 2026</span>
            <span className="text-xs text-navy-400">{filteredEvents.length} events</span>
          </div>

          {/* Events */}
          <div className="divide-y divide-cream-300/40">
            {filteredEvents.map((event, i) => {
              const inst = institutions.find((ins) => ins.id === event.institution)!;
              return (
                <div key={i} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-cream-50/50">
                  <div className="shrink-0 pt-0.5">
                    <span className="font-mono text-xs text-navy-400">{event.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: `${inst.color}10`, color: inst.color }}
                      >
                        {inst.name}
                      </span>
                      {event.hasAIBrief && (
                        <span className="rounded-full bg-gold-600/10 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
                          AI Brief Available
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-navy-900">{event.title}</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {event.topics.map((topic) => (
                        <span key={topic} className="rounded-full bg-cream-200/60 px-2 py-0.5 text-[10px] text-navy-500">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="shrink-0 text-navy-400 hover:text-navy-600">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
