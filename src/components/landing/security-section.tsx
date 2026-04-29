"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Server,
  Cloud,
  ShieldCheck,
} from "lucide-react";

type BadgeKind = "live" | "planned" | "roadmap";

const securityFeatures: Array<{
  icon: typeof Shield;
  title: string;
  description: string;
  badge: BadgeKind;
  badgeLabel: string;
}> = [
  {
    icon: Lock,
    title: "Encrypted Storage and Transport",
    description: "Firestore and Cloud Storage encryption at rest with Google-managed infrastructure controls, plus HTTPS/TLS transport for application traffic.",
    badge: "live",
    badgeLabel: "Live",
  },
  {
    icon: Shield,
    title: "Owner-Scoped Data Access",
    description: "Firestore security rules enforce owner-scoped reads and writes on user records and situation data, limiting access paths across tenants.",
    badge: "live",
    badgeLabel: "Live",
  },
  {
    icon: Eye,
    title: "Role Gates and Admin Allowlist",
    description: "Admin surfaces are gated by explicit allowlist configuration. Profile versions and domain edits keep reviewable history.",
    badge: "live",
    badgeLabel: "Live",
  },
  {
    icon: ShieldCheck,
    title: "SOC 2 Type II",
    description: "Enterprise audit standards for data handling and access control.",
    badge: "planned",
    badgeLabel: "Planned",
  },
  {
    icon: Cloud,
    title: "GDPR & Data Residency",
    description: "EU-region deployment option and data-residency controls aligned with GDPR.",
    badge: "planned",
    badgeLabel: "Planned",
  },
  {
    icon: Server,
    title: "Air-Gapped On-Premises",
    description: "Sovereign deployment option for classified environments.",
    badge: "roadmap",
    badgeLabel: "2027 Roadmap",
  },
];

function badgeClasses(kind: BadgeKind): string {
  if (kind === "live") return "border-sage/30 bg-sage/10 text-sage";
  if (kind === "planned") return "border-gold-600/20 bg-gold-600/5 text-gold-700";
  return "border-navy-200 bg-navy-50 text-navy-600";
}

const demoDisclaimer = "SOC 2 and formal GDPR/data-residency controls are planned features. Until an enterprise agreement is in place, do not process classified, export-controlled, or highly sensitive operational information in PRAXIS.";

export function SecuritySection() {
  return (
    <section id="security" className="relative px-6 py-24 lg:py-32">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-center"
        >
          <span className="text-overline text-gold-700">Security</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 text-center"
        >
          <h2 className="mb-4 font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
            Security You Can Audit. A Roadmap You Can Verify.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            PRAXIS states security posture plainly: what ships now, what is
            planned, and what belongs behind an enterprise deployment and
            review process.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl border border-cream-300/60 bg-white/80 p-6 transition-all duration-200 hover:shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-diplomatic-blue/5 text-diplomatic-blue">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badgeClasses(feature.badge)}`}
                  >
                    {feature.badge === "live" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                    )}
                    {feature.badgeLabel}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-semibold text-navy-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-navy-500">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Demo security disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 rounded-xl border border-gold-600/20 bg-gold-600/5 px-6 py-4 text-center"
        >
          <p className="text-xs text-navy-500">
            <span className="font-semibold text-gold-700">Demo Disclaimer:</span>{" "}
            {demoDisclaimer}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
