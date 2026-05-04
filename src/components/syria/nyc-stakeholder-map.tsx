'use client';

/**
 * NYC stakeholder map for the Syria case file.
 *
 * Renders the Syria stakeholder universe from the perspective of a UN-NY
 * analyst: layered by Security Council seat, UN agency, permanent mission,
 * think tank, NGO, academic centre, and press, with relationship tone, what
 * to ask each counterpart for, and a contact-anchor URL the analyst can
 * verify in one click.
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, ChevronRight, ExternalLink, MailQuestion, Network, Sparkles } from 'lucide-react';
import {
  STAKEHOLDER_LAYER_LABELS,
  STAKEHOLDER_TONE_BADGE,
  SYRIA_NYC_STAKEHOLDERS,
  syriaNYCStakeholdersByLayer,
  type NYCStakeholder,
  type StakeholderLayer,
} from '@/lib/constants/syria-nyc-stakeholders';
import { cn } from '@/lib/utils/cn';

const LAYER_ORDER: StakeholderLayer[] = [
  'sc_p5',
  'sc_e10',
  'un_agency',
  'think_tank',
  'ngo',
  'academic',
  'press',
];

const LAYER_TONE: Record<StakeholderLayer, string> = {
  sc_p5:        'border-rose-200 bg-rose-50',
  sc_e10:       'border-amber-200 bg-amber-50',
  un_agency:    'border-blue-200 bg-blue-50',
  perm_mission: 'border-slate-200 bg-slate-50',
  think_tank:   'border-emerald-200 bg-emerald-50',
  ngo:          'border-purple-200 bg-purple-50',
  academic:     'border-teal-200 bg-teal-50',
  press:        'border-slate-200 bg-white',
};

export function SyriaNYCStakeholderMap({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const grouped = syriaNYCStakeholdersByLayer();
  const [selected, setSelected] = useState<NYCStakeholder | null>(SYRIA_NYC_STAKEHOLDERS[0] ?? null);

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-950 text-white">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Stakeholder map · UN NY perspective</p>
            <h3 className="text-sm font-semibold text-navy-950">
              {SYRIA_NYC_STAKEHOLDERS.length} counterparts · 7 layers · contact + ask-for in one click
            </h3>
          </div>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          Public-record contacts
        </span>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-2">
          {LAYER_ORDER.map((layer) => {
            const list = grouped[layer];
            if (!list || list.length === 0) return null;
            return (
              <div key={layer} className={cn('rounded-md border p-2', LAYER_TONE[layer])}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Network className="h-3.5 w-3.5 text-navy-700" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">
                      {STAKEHOLDER_LAYER_LABELS[layer]}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{list.length}</span>
                </div>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {list.map((stakeholder, idx) => (
                    <motion.button
                      key={stakeholder.id}
                      type="button"
                      onClick={() => setSelected(stakeholder)}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.03, duration: 0.24 }}
                      className={cn(
                        'rounded-md border bg-white px-2.5 py-2 text-left transition hover:border-navy-300',
                        selected?.id === stakeholder.id ? 'border-navy-400 ring-1 ring-navy-200' : 'border-slate-200',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-semibold leading-4 text-navy-900">{stakeholder.name}</p>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase',
                            STAKEHOLDER_TONE_BADGE[stakeholder.tone],
                          )}
                        >
                          {stakeholder.tone}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">{stakeholder.city}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="rounded-md border border-slate-200 bg-slate-50 p-4">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', LAYER_TONE[selected.layer])}>
                  {STAKEHOLDER_LAYER_LABELS[selected.layer]}
                </span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', STAKEHOLDER_TONE_BADGE[selected.tone])}>
                  {selected.tone}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-semibold text-navy-950">{selected.name}</h4>
              <p className="mt-0.5 text-[11px] text-slate-500">{selected.city}</p>
              <p className="mt-3 text-[11px] leading-4 text-slate-700">
                <span className="font-semibold text-navy-700">Relationship:</span> {selected.relationshipNote}
              </p>
              <p className="mt-2 rounded-md bg-emerald-50 p-2 text-[11px] leading-4 text-emerald-900">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                  <MailQuestion className="h-3 w-3" /> Ask for:
                </span>{' '}
                {selected.askForNote}
              </p>
              {selected.recentDoc ? (
                <div className="mt-3 rounded-md border border-slate-200 bg-white p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Recent doc</p>
                  <p className="mt-1 text-[11px] font-medium text-navy-950">{selected.recentDoc.title}</p>
                  <p className="text-[10px] text-slate-500">{selected.recentDoc.date}</p>
                </div>
              ) : null}
              <a
                href={selected.contactUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-navy-800 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Public contact page
              </a>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                <Sparkles className="h-3 w-3" />
                Click any other counterpart on the left to refocus
              </div>
            </motion.div>
          ) : (
            <p className="text-[11px] text-slate-500 leading-5">
              Click a counterpart to see relationship, ask-for note, recent document, and contact page.
            </p>
          )}
        </aside>
      </div>

      <p className="mt-3 text-[10px] leading-4 text-slate-500">
        <ChevronRight className="inline-block h-3 w-3 align-text-bottom" />
        PRAXIS treats this map as a living artefact: counterparts can be added or retired, and ask-for notes evolve with each
        Council cycle. The graph backbone makes it possible to reuse this same stakeholder universe for negotiation, mediation,
        and analysis modules without re-keying contacts.
      </p>
    </section>
  );
}
