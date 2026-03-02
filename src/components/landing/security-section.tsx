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

const securityFeatures = [
  {
    icon: ShieldCheck,
    title: "SOC 2 Type II Compliant",
    description: "Enterprise audit standards for data handling and access control.",
    badge: "Planned",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "AES-256 encryption at rest and TLS 1.3 in transit for all data.",
  },
  {
    icon: Eye,
    title: "Role-Based Access Control",
    description: "Granular permissions with comprehensive audit logging of all actions.",
  },
  {
    icon: Server,
    title: "Air-Gapped On-Premises",
    description: "Sovereign deployment option for classified environments.",
    badge: "Coming 2027",
  },
  {
    icon: Cloud,
    title: "Google Cloud Platform",
    description: "Enterprise-grade infrastructure with global availability and compliance.",
  },
  {
    icon: Shield,
    title: "Zero Data Retention",
    description: "Sensitive analysis data is never stored beyond your session by default.",
  },
];

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
            Enterprise-Grade Security for Sensitive Analysis
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-navy-500">
            Designed for environments where information security isn&apos;t
            optional — it&apos;s existential.
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
                  {feature.badge && (
                    <span className="rounded-full border border-gold-600/20 bg-gold-600/5 px-2.5 py-0.5 text-[10px] font-semibold text-gold-700">
                      {feature.badge}
                    </span>
                  )}
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

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <blockquote className="mx-auto max-w-2xl">
            <p className="font-serif text-xl italic text-navy-700 leading-relaxed">
              &ldquo;Enterprise-grade security for the world&apos;s most sensitive
              analysis. On-cloud today. On-premises tomorrow.&rdquo;
            </p>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
