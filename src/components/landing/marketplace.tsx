"use client";

import { motion } from "framer-motion";
import { FileText, BarChart3, Globe, Mail } from "lucide-react";

const categories = [
  {
    icon: FileText,
    title: "Report Templates",
    description:
      "Pre-built structures for SITREP, SG Reports, Briefing Notes, Cables, and Options Papers.",
    count: "24 templates",
  },
  {
    icon: BarChart3,
    title: "Analytical Frameworks",
    description:
      "Conflict analysis methodologies, risk matrices, stakeholder mapping templates, and assessment tools.",
    count: "18 frameworks",
  },
  {
    icon: Globe,
    title: "Institutional Briefing Packs",
    description:
      "Country briefs, regional overviews, and thematic deep-dives maintained by the PRAXIS community.",
    count: "40+ briefs",
  },
];

export function Marketplace() {
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
          <span className="text-overline text-gold-700">Marketplace</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            The PRAXIS Marketplace
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            Templates, briefings, and frameworks — built by practitioners, for
            practitioners.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category, i) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="rounded-xl border border-cream-300/60 bg-white/70 p-7 transition-all duration-200 hover:shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-diplomatic-blue/5 text-diplomatic-blue">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <span className="rounded-full bg-gold-600/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700">
                    Coming Soon
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-navy-900">
                  {category.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-navy-500">
                  {category.description}
                </p>
                <p className="text-xs font-medium text-diplomatic-blue">
                  {category.count}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Early access signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-navy-500">
            Contribute your own templates and frameworks to the community.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
