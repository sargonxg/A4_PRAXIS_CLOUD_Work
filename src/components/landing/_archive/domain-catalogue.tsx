'use client';

/**
 * Landing page section — "Shaped to your domain".
 *
 * Presents the 11-domain taxonomy as the top-level customisation axis.
 * Sets user expectations: PRAXIS isn't one tool for every job — it's a
 * single workspace that reshapes around the domain you work in.
 */

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { DOMAIN_IDS } from '@/types/domain';
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';

type IconName = keyof typeof Icons;

function iconFor(name: string): React.ComponentType<{ className?: string }> {
  const Icon = Icons[name as IconName] as React.ComponentType<{ className?: string }> | undefined;
  return Icon ?? Icons.Circle;
}

export function DomainCatalogue() {
  const specific = DOMAIN_IDS.filter((id) => id !== 'generic');

  return (
    <section
      id="domains"
      className="relative border-t border-navy-100 bg-gradient-to-b from-white to-navy-50/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            The calibration axis
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            One workspace. Ten domains.<br className="hidden sm:inline" /> Plus the generic baseline every analyst starts on.
          </h2>
          <p className="mt-4 text-base text-navy-600">
            PRAXIS reshapes around your mandate. Pick a domain and every tool&apos;s prompts, frameworks,
            and feed priorities re-tune. Your mandate overrides the generic defaults; each situation
            can further tune on top. Admins evolve the taxonomy live — no redeploy required.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Generic — the baseline */}
          <GenericCard />

          {specific.map((id) => {
            const d = DOMAIN_SEEDS[id];
            const Icon = iconFor(d.icon);
            return (
              <motion.article
                key={id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4 }}
                className="group relative flex flex-col rounded-xl border border-navy-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${d.colorHex}14`, color: d.colorHex }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-navy-900">{d.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{d.description}</p>
                <div
                  className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: d.colorHex }}
                >
                  Extends generic →
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-12 max-w-3xl rounded-2xl border border-navy-200 bg-white/80 p-6 backdrop-blur-sm sm:p-8"
        >
          <h3 className="font-display text-xl font-semibold text-navy-900">
            Every user and every situation carries its own context.
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-navy-700">
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue/10 text-[11px] font-bold text-diplomatic-blue">
                1
              </span>
              <span>
                <strong className="text-navy-900">User profile</strong> — role, mandate, audience,
                red lines, working language, primary and secondary domains. Captured once in a
                three-minute onboarding. Editable any time from Settings.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-[11px] font-bold text-gold-600">
                2
              </span>
              <span>
                <strong className="text-navy-900">Situation frame</strong> — every new situation
                is auto-classified into one of the ten domains. You confirm or override in one
                click. The classification is stamped with version + confidence and drives feed
                and framework selection for that situation alone.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-[11px] font-bold text-teal">
                3
              </span>
              <span>
                <strong className="text-navy-900">Tool output</strong> — every tool reads the
                merged user × situation × domain context through a single calibrated context
                module. Outputs are stamped with profile version + domain version for full
                provenance.
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function GenericCard() {
  const d = DOMAIN_SEEDS.generic;
  const Icon = iconFor(d.icon);
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col rounded-xl border-2 border-diplomatic-blue bg-diplomatic-blue/5 p-5 shadow-sm"
    >
      <div className="absolute -top-2.5 right-4 rounded-full bg-diplomatic-blue px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        Baseline
      </div>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${d.colorHex}14`, color: d.colorHex }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-navy-900">{d.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-navy-700">
        The universal starting point. All lenses weighted equally, every feed eligible, all 15
        frameworks available. Every specialised domain extends this baseline — you never lose
        the generic analyst toolkit.
      </p>
      <div className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-wider text-diplomatic-blue">
        Inherited by all 10 specific domains
      </div>
    </motion.article>
  );
}
