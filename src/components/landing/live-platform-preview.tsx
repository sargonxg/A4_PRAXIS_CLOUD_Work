'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, BarChart3, GitBranch, Network,
  MessageSquare, FileText, Globe, Compass, Scale,
  Shield, Search, Zap, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TOOL_CATEGORIES = [
  {
    id: 'situation-room',
    label: 'Situation Room',
    tools: [
      { name: 'Dashboard', icon: BarChart3, desc: 'Real-time situation overview with risk scores, Glasl escalation stage, and AI-generated intelligence briefs' },
      { name: 'Risk Monitor', icon: AlertTriangle, desc: 'INFORM Risk Index assessment across 5 dimensions: political, security, humanitarian, economic, social' },
      { name: 'Actor Profiles', icon: Users, desc: 'Deep stakeholder intelligence using Fisher/Ury framework: positions, interests, leverage, constraints' },
      { name: 'Conflict Graph', icon: GitBranch, desc: 'Knowledge graph with 14-entity ontology: actors, claims, interests, constraints, leverage, commitments, events, narratives' },
      { name: 'Stakeholder Map', icon: Network, desc: 'Mitchell/Agle/Wood power-legitimacy-urgency mapping with interactive positioning' },
      { name: 'Early Warning', icon: Shield, desc: 'Glasl 9-stage escalation tracking with de-escalation windows and opportunity indicators' },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis & Drafting',
    tools: [
      { name: 'PRAXIS Assistant', icon: MessageSquare, desc: '21 specialized AI tools for any conflict analysis question. Web research, document RAG, structured outputs.' },
      { name: 'Report Studio', icon: FileText, desc: 'UN-standard report generation with DOCX/PDF export. Templates for situation reports, dossiers, UNSC briefs.' },
      { name: 'Scenario Planner', icon: Zap, desc: 'Model escalation paths, ceasefire scenarios, and intervention options with probability assessments' },
      { name: 'Negotiation Prep', icon: Scale, desc: 'ZOPA/BATNA analysis grounded in Fisher/Ury methodology. Map negotiation space and value-creation opportunities.' },
      { name: 'CONCORDIA', icon: Scale, desc: 'Mediation design using Berghof framework. Process architecture, CBM sequencing, spoiler management.' },
      { name: 'Briefing Room', icon: FileText, desc: 'Auto-generated daily intelligence briefs. DPPA morning brief format with speaker notes and Q&A prep.' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence Tools',
    tools: [
      { name: 'ARGUS Intelligence', icon: Search, desc: 'Deep web research with Firecrawl. Multi-source crawling across news, think tanks, government reports.' },
      { name: 'Media Compass', icon: Compass, desc: 'Map 50+ outlets by bias and reliability. CRAAP test scoring, cross-reference recommendations.' },
      { name: 'Treaty Analyzer', icon: FileText, desc: 'Clause-by-clause analysis with ambiguity flagging. Compare against IHL/ICL frameworks.' },
      { name: 'Sanctions Tracker', icon: Shield, desc: 'UN, OFAC, EU, UK OFSI sanctions exposure scanning with escalation indicators.' },
      { name: 'UN Toolkit', icon: Globe, desc: 'UNSC resolution builder with Chapter VII language patterns. UN terminology checker with 30+ regex rules.' },
      { name: 'Commitment Tracker', icon: CheckCircle2, desc: 'Extract and monitor compliance with ceasefire terms, peace agreements, and diplomatic commitments.' },
    ],
  },
];

export function LivePlatformPreview() {
  const [activeCategory, setActiveCategory] = useState('situation-room');
  const category = TOOL_CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <section id="tools" className="relative overflow-hidden bg-gradient-to-b from-white via-navy-50/30 to-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">The Platform</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">
            40+ Tools. One Situation.
          </h2>
          <p className="mt-4 text-base text-navy-500 leading-relaxed">
            Every tool in PRAXIS is powered by your situation context. Create a situation once — AI auto-populates actor profiles, risk assessments, conflict graphs, and dozens of specialized analyses.
          </p>
        </div>

        {/* Category tabs */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex rounded-xl border border-navy-200 bg-white p-1 shadow-sm">
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
                  activeCategory === cat.id
                    ? 'bg-diplomatic-blue text-white shadow-md'
                    : 'text-navy-500 hover:text-navy-700'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {category.tools.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="group rounded-xl border border-navy-200 bg-white p-5 transition-all hover:border-diplomatic-blue/30 hover:shadow-lg hover:shadow-diplomatic-blue/5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-diplomatic-blue/8 transition-colors group-hover:bg-diplomatic-blue/15">
                    <tool.icon className="h-5 w-5 text-diplomatic-blue" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">{tool.name}</h3>
                    <p className="mt-1 text-xs text-navy-500 leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: '40', label: 'Tool Pages', suffix: '+' },
            { value: '27', label: 'AI Chat Tools', suffix: '' },
            { value: '73', label: 'API Routes', suffix: '' },
            { value: '11', label: 'Live Data Feeds', suffix: '' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-navy-200 bg-white p-4 text-center">
              <p className="font-mono text-2xl font-bold text-diplomatic-blue">{stat.value}{stat.suffix}</p>
              <p className="mt-1 text-xs text-navy-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
