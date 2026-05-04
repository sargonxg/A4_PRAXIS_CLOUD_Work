'use client';

/**
 * /app/methodology — PRAXIS methodology and documentation hub.
 *
 * Separate from /app/library (artifacts) and /app/docs (in-product docs).
 * This is the analyst-facing reference that explains every framework PRAXIS
 * uses, the entity grammar (ACO v2.0), source-tier model, calibration
 * contract, and the operational spine. The point: analysts can defend any
 * AI output by pointing to the framework that drove it.
 */

import { useState } from 'react';
import {
  BookOpen,
  Compass,
  Network,
  Shield,
  Layers,
  Library,
  FileBadge,
  GraduationCap,
  ScrollText,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FrameworkEntry {
  id: string;
  name: string;
  citation: string;
  summary: string;
  praxisUse: string;
  output: string;
}

const FRAMEWORKS: FrameworkEntry[] = [
  {
    id: 'glasl',
    name: 'Glasl 9-stage escalation',
    citation: 'Glasl, F. (1982). The Process of Conflict Escalation and Roles of Third Parties.',
    summary: 'Nine sequential stages from hardening (1) to "together into the abyss" (9). Stages 1–3 = win-win, 4–6 = win-lose, 7–9 = lose-lose. Each stage requires a different intervention strategy.',
    praxisUse: 'Risk Monitor labels each situation with a Glasl stage. Timeline events carry an optional glaslStage attribute. The stage drives the narrative tone of every briefing.',
    output: 'glaslStage: 1–9 (per situation, per event). Used by Risk Monitor, Timeline, Briefing.',
  },
  {
    id: 'fisher-ury',
    name: 'Fisher–Ury (positions vs interests)',
    citation: 'Fisher, R., Ury, W., & Patton, B. (1991). Getting to Yes: Negotiating Agreement Without Giving In.',
    summary: 'Distinguishes stated positions from underlying interests; recommends separating people from problems and inventing options for mutual gain.',
    praxisUse: 'Conflict Graph stores Position and Interest as distinct ACO entity types. Negotiation Prep surfaces interests behind positions. Boardroom advisors apply this discipline.',
    output: 'ACO entity types: position, interest. Used by Conflict Graph, Negotiation Prep, Mediation Designer.',
  },
  {
    id: 'inform',
    name: 'INFORM Risk Index',
    citation: 'European Commission Joint Research Centre (2014). Index for Risk Management — INFORM.',
    summary: 'Composite humanitarian risk score: Hazard × Vulnerability × Lack of Coping Capacity (geometric mean). Normalised to 0–10 with clear sub-indicator decomposition.',
    praxisUse: 'Risk Monitor renders the three components separately. Dashboard surfaces the composite. Justifies risk shifts in evidence terms rather than vibes.',
    output: 'informRiskIndex: { hazard, vulnerability, lackOfCoping, composite }. Used by Risk Monitor, Dashboard.',
  },
  {
    id: 'maw',
    name: 'Mitchell-Agle-Wood salience',
    citation: 'Mitchell, R.K., Agle, B.R., & Wood, D.J. (1997). Toward a Theory of Stakeholder Identification and Salience.',
    summary: 'Each stakeholder is scored on Power, Legitimacy, and Urgency. The triple maps to one of eight quadrants: definitive, dominant, dangerous, dependent, dormant, discretionary, demanding, non-stakeholder.',
    praxisUse: 'Stakeholder Map runs MAW scoring across actors derived from the situation graph. The 2D scatter plots any axis pair.',
    output: 'Salience score per actor. Quadrant label. Used by Stakeholder Map, Power Map.',
  },
  {
    id: 'zartman',
    name: 'Zartman ripeness',
    citation: 'Zartman, I.W. (2001). The Timing of Peace Initiatives: Hurting Stalemates and Ripe Moments.',
    summary: 'Conflicts become ripe for resolution when parties face a Mutually Hurting Stalemate AND perceive a Way Out. Both conditions must hold.',
    praxisUse: 'Mediation Designer flags ripeness. Boardroom advisors test for both conditions before recommending a track.',
    output: 'ripenessAssessment with explicit MHS and Way Out signals. Used by Mediation Designer, Advisory.',
  },
  {
    id: 'stedman',
    name: 'Stedman spoiler typology',
    citation: 'Stedman, S.J. (1997). Spoiler Problems in Peace Processes.',
    summary: 'Three spoiler types: limited (negotiable demands), greedy (expanding demands), total (uncompromising). Each requires different management: inducement, socialisation, coercion, departure.',
    praxisUse: 'Mediation Designer maps each armed actor to a spoiler type with recommended strategies. Conflict Graph stores spoilerType on actor nodes.',
    output: 'spoilerType per actor. Recommended management strategy. Used by Mediation Designer, Stakeholder Map.',
  },
  {
    id: 'cameo',
    name: 'CAMEO event ontology',
    citation: 'Schrodt, P.A. et al. (2009). Conflict and Mediation Event Observations (CAMEO) Codebook.',
    summary: 'Standardised codebook for political event coding (verb classes from VERBAL COOPERATION to MASS VIOLENCE). Powers GDELT and ICEWS event datasets.',
    praxisUse: 'Timeline events optionally carry a CAMEO root code. Geospatial Monitor uses CAMEO scales for hotspot intensity.',
    output: 'cameoCode per event. Used by Timeline, Geospatial Monitor, Risk Monitor.',
  },
  {
    id: 'galtung',
    name: 'Galtung triangle (Direct/Structural/Cultural violence)',
    citation: 'Galtung, J. (1969). Violence, Peace, and Peace Research.',
    summary: 'Three forms of violence: direct (events), structural (system), cultural (legitimising narratives). Sustainable peace addresses all three.',
    praxisUse: 'Conflict Graph models structural constraints and cultural narratives as first-class entity types. Reports surface all three layers.',
    output: 'ACO types: event (direct), constraint (structural), narrative (cultural). Used by Reports, Conflict Graph.',
  },
  {
    id: 'lederach',
    name: 'Lederach pyramid',
    citation: 'Lederach, J.P. (1997). Building Peace: Sustainable Reconciliation in Divided Societies.',
    summary: 'Three levels of peace work: top leadership, middle-range leaders, grassroots. Sustained transformation requires alignment across all three.',
    praxisUse: 'Stakeholder Map clusters actors by Lederach level. Mediation Designer designs interventions per level and across levels.',
    output: 'lederachLevel per actor. Used by Stakeholder Map, Mediation Designer.',
  },
  {
    id: 'putnam',
    name: 'Putnam two-level game',
    citation: 'Putnam, R.D. (1988). Diplomacy and Domestic Politics: The Logic of Two-Level Games.',
    summary: 'International negotiation outcomes depend on the intersection of Level 1 (international) and Level 2 (domestic) win-sets. Effective diplomats expand or contract win-sets strategically.',
    praxisUse: 'Policy Memo policy-options carry both levelOneAnalysis and levelTwoAnalysis fields. Boardroom red-teams check that recommendations are feasible at both levels.',
    output: 'levelOneAnalysis + levelTwoAnalysis + winSet. Used by Policy Memo, Advisory.',
  },
  {
    id: 'ipc',
    name: 'IPC Phase Classification',
    citation: 'IPC Global Partners (2008–). Integrated Food Security Phase Classification.',
    summary: 'Five-phase scale (Minimal → Famine) for food insecurity. Standardised cross-country and cross-time. The single most cited indicator in humanitarian briefings.',
    praxisUse: 'Humanitarian Dashboard renders IPC phases as a stacked bar with population estimates per phase.',
    output: 'foodSecurity[]: { phase, population, percentage }. Used by Humanitarian Dashboard.',
  },
  {
    id: 'ocha',
    name: 'OCHA humanitarian principles',
    citation: 'UN OCHA (2012). OCHA on Message: Humanitarian Principles.',
    summary: 'Humanity, Neutrality, Impartiality, Independence. Foundational ethical framework for humanitarian operations and funding decisions.',
    praxisUse: 'Humanitarian briefs and access analyses are framed in these terms. Cluster status reflects principled-access constraints.',
    output: 'Used by Humanitarian Dashboard, Briefing Studio.',
  },
  {
    id: 'icd203',
    name: 'ICD-203 analytic standards',
    citation: 'ODNI (2015). Intelligence Community Directive 203: Analytic Standards.',
    summary: 'US IC analytic standards: objective; independent of political consideration; timely; based on all available sources; logical argumentation; accuracy; visualisation; rigorous treatment of uncertainty; alternative analysis; describe quality and credibility of underlying sources.',
    praxisUse: 'Every AI route output carries explicit confidence levels, source basis, and visible gaps. Boardroom preserves alternative analysis. Advisor red-team enforces rigorous treatment of uncertainty.',
    output: 'Standardised across all AI route outputs.',
  },
  {
    id: 'ihl',
    name: 'IHL framework (Geneva Conventions + Additional Protocols)',
    citation: 'ICRC. The Geneva Conventions of 1949 and their Additional Protocols.',
    summary: 'Foundational law governing armed conflict — distinction, proportionality, precaution, humanity. Plus Additional Protocols on internal/international armed conflicts.',
    praxisUse: 'Legal Tracker checks events against IHL norms. Reports flag potential violations with proper legal terminology.',
    output: 'Used by Legal Tracker, Reports, Advisory (legal lens).',
  },
  {
    id: 'aco',
    name: 'PRAXIS ACO v2.0 (Agentic Conflict Ontology)',
    citation: 'PRAXIS by TACITUS (2026). Internal specification.',
    summary: 'Fourteen first-class entity types (actor, claim, interest, constraint, leverage, commitment, event, narrative, institution, norm, resource, risk, policy, grievance) with 72 typed relationships across 5 categories (causal, structural, antagonistic, cooperative, foundational). Built to compose with Glasl, Fisher-Ury, Stedman, and Galtung.',
    praxisUse: 'The single graph schema underlying every situation. Conflict Graph, GraphOps, Stakeholder Map, and AI extraction all read/write ACO.',
    output: 'graph/main + graph/analysis. Used everywhere.',
  },
];

const SOURCE_TIERS = [
  { tier: 'Tier A', label: 'Primary official + UN', examples: 'UN Security Council, OCHA, UNHCR, UNFPA, ICRC, government communiqués', reliabilityFloor: '0.90', use: 'Authoritative for facts and official positions; required for any principal-level claim.' },
  { tier: 'Tier B', label: 'Specialist + reputable wire', examples: 'Reuters, AFP, AP, Crisis Group, Chatham House, Brookings, ECFR, Carnegie', reliabilityFloor: '0.80', use: 'Strong for analysis and corroborated reporting; pair with Tier A for high-impact claims.' },
  { tier: 'Tier C', label: 'Independent local + accountability', examples: 'Enab Baladi, Syria Direct, North Press, SyriaUntold, HRW, Amnesty', reliabilityFloor: '0.70', use: 'Best for ground texture, local rights, and accountability angles. Triangulate before tactical claims.' },
  { tier: 'Tier D', label: 'Monitoring + state media', examples: 'SOHR, SANA, Al Mayadeen, regional state outlets', reliabilityFloor: '0.40', use: 'Useful as signal/discourse map. Always require corroboration from higher tier before quoting as fact.' },
  { tier: 'Tier E', label: 'Open-source + social', examples: 'Telegram channels, X/Twitter accounts, blogs, leaked documents', reliabilityFloor: '0.20', use: 'Lead generation only. Never the sole basis for any briefable claim.' },
];

const CALIBRATION_DIMENSIONS = [
  '1. Reads AnalystProfile via withCalibration',
  '2. Reads current situation context',
  '3. Uses buildCalibratedContext to compose the system prompt block',
  '4. Applies output language preference',
  '5. Applies red-line constraints',
  '6. Applies audience tone (e.g., senior_leadership)',
  '7. Uses SKC retrieval (lens-weighted)',
  '8. Persists output via saveToolOutput',
  '9. Writes Memory Bank trace',
  '10. Validates output schema (Zod)',
  '11. Deducts credits correctly via withCredits',
];

const SECTIONS = [
  { id: 'frameworks',  label: 'Frameworks',  icon: GraduationCap },
  { id: 'aco',         label: 'ACO grammar', icon: Network       },
  { id: 'sources',     label: 'Source tiers',icon: Layers        },
  { id: 'calibration', label: 'Calibration', icon: Compass       },
  { id: 'spine',       label: 'Operational spine', icon: Library },
] as const;

export default function MethodologyPage() {
  const [active, setActive] = useState<typeof SECTIONS[number]['id']>('frameworks');
  const [search, setSearch] = useState('');

  const filteredFrameworks = FRAMEWORKS.filter((f) =>
    [f.name, f.summary, f.citation].some((s) => s.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="grid gap-4 p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
            <BookOpen className="h-3 w-3" /> Methodology hub
          </p>
          <p className="mt-1 text-[11px] text-navy-500">
            Every framework, ontology, source-quality model and calibration rule that PRAXIS uses to defend its outputs.
          </p>
        </div>
        <nav className="rounded-md border border-slate-200 bg-white p-2">
          <ul className="space-y-1">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActive(s.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition',
                      active === s.id
                        ? 'bg-diplomatic-blue/10 text-diplomatic-blue'
                        : 'text-navy-600 hover:bg-slate-50 hover:text-navy-900',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Quick links</p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-navy-700">
            <li>• <a className="text-diplomatic-blue underline" href="https://www.unocha.org/" target="_blank" rel="noopener">OCHA</a></li>
            <li>• <a className="text-diplomatic-blue underline" href="https://www.icrc.org/" target="_blank" rel="noopener">ICRC</a></li>
            <li>• <a className="text-diplomatic-blue underline" href="https://www.crisisgroup.org/" target="_blank" rel="noopener">International Crisis Group</a></li>
            <li>• <a className="text-diplomatic-blue underline" href="https://www.ipcinfo.org/" target="_blank" rel="noopener">IPC global</a></li>
            <li>• <a className="text-diplomatic-blue underline" href="https://www.gdeltproject.org/" target="_blank" rel="noopener">GDELT</a></li>
            <li>• <a className="text-diplomatic-blue underline" href="https://ucdp.uu.se/" target="_blank" rel="noopener">UCDP</a></li>
          </ul>
        </div>
      </aside>

      <section className="min-w-0">
        {active === 'frameworks' && (
          <div className="space-y-3">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-navy-900">Analytical frameworks</h1>
                <p className="mt-1 text-sm text-navy-500">
                  PRAXIS does not invent methodology — it makes existing frameworks operational and citeable.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search frameworks…"
                  className="w-64 rounded-md border border-slate-200 bg-white pl-7 pr-3 py-1.5 text-xs text-navy-800 focus:border-diplomatic-blue focus:outline-none"
                />
              </div>
            </header>
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredFrameworks.map((fw) => (
                <article key={fw.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold text-navy-900">{fw.name}</h2>
                    <span className="rounded-full bg-diplomatic-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">
                      framework
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] italic text-navy-500">{fw.citation}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-navy-700">{fw.summary}</p>
                  <div className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 p-2 text-[11px] text-emerald-900">
                    <p className="font-semibold">PRAXIS use</p>
                    <p>{fw.praxisUse}</p>
                  </div>
                  <p className="mt-2 text-[11px] text-navy-500">
                    <span className="font-semibold">Output:</span> {fw.output}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}

        {active === 'aco' && (
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h1 className="font-serif text-2xl font-semibold text-navy-900">PRAXIS ACO v2.0 — Agentic Conflict Ontology</h1>
            <p className="mt-1 text-sm text-navy-500">
              The graph schema that every situation runs through. Designed to compose with Glasl, Fisher-Ury, Stedman, Galtung, and IHL.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">14 entity types</p>
                <ul className="mt-1 space-y-1 text-[12px] text-navy-700">
                  <li>actor · claim · interest · constraint · leverage · commitment · event · narrative</li>
                  <li>institution · norm · resource · risk · policy · grievance</li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">72 typed relationships</p>
                <ul className="mt-1 space-y-1 text-[12px] text-navy-700">
                  <li>Causal (10): triggered_by, escalates, de_escalates, …</li>
                  <li>Structural (7): member_of, governs, …</li>
                  <li>Antagonistic (12): opposes, contradicts, violates_norm, …</li>
                  <li>Cooperative (11): allied_with, supports_claim, addresses_grievance, …</li>
                  <li>Foundational (9): has_interest, claims, requires_resource, …</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-900">Confidence levels</p>
              <p className="mt-1 text-[12px] text-emerald-900">
                EXTRACTED (directly stated) · INFERRED (deduced) · AMBIGUOUS (uncertain) · ASSESSED (analyst judgment).
              </p>
            </div>
          </article>
        )}

        {active === 'sources' && (
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h1 className="font-serif text-2xl font-semibold text-navy-900">Source-tier model</h1>
            <p className="mt-1 text-sm text-navy-500">
              Each source carries a reliability score (0–1) and lives in a tier. The Source Scout audit, Boardroom red-team and every briefing reference the tier explicitly.
            </p>
            <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-[12px]">
                <thead className="bg-slate-50 text-navy-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Tier</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Label</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Examples</th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Reliability floor</th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {SOURCE_TIERS.map((t) => (
                    <tr key={t.tier} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold text-navy-900">{t.tier}</td>
                      <td className="px-3 py-2 text-navy-700">{t.label}</td>
                      <td className="px-3 py-2 text-navy-600">{t.examples}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">{t.reliabilityFloor}</td>
                      <td className="px-3 py-2 text-navy-600">{t.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {active === 'calibration' && (
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h1 className="font-serif text-2xl font-semibold text-navy-900">Calibration contract</h1>
            <p className="mt-1 text-sm text-navy-500">
              Every authenticated user has an AnalystProfile. Every AI route reads it via the withCalibration middleware so outputs adapt to role, mandate, lenses, regions, audience, and red lines without re-prompting.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">11 calibration dimensions</p>
                <ul className="mt-1 space-y-1 text-[12px] text-navy-700">
                  {CALIBRATION_DIMENSIONS.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Why it matters</p>
                <p className="mt-1 text-[12px] text-emerald-900">
                  Two analysts with different mandates ask the same question and get answers tuned to their decision frame, with the same source basis. The gate prevents AI calls before onboarding is complete so calibration is never optional.
                </p>
              </div>
            </div>
          </article>
        )}

        {active === 'spine' && (
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h1 className="font-serif text-2xl font-semibold text-navy-900">Operational spine</h1>
            <p className="mt-1 text-sm text-navy-500">
              Every async unit of work in PRAXIS goes through the same spine: jobs · events · notifications · semaphore. Defined in <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">docs/OPERATIONAL_SPINE.md</code>.
            </p>
            <ul className="mt-4 space-y-2 text-[12px] text-navy-700">
              <li className="flex items-start gap-2"><Shield className="mt-0.5 h-3.5 w-3.5 text-diplomatic-blue" />tool_runs — every AI/tool execution is recorded with status, evidence envelope, retries.</li>
              <li className="flex items-start gap-2"><Shield className="mt-0.5 h-3.5 w-3.5 text-diplomatic-blue" />background_jobs — long-running pipeline work (extraction, clustering, analysis).</li>
              <li className="flex items-start gap-2"><Shield className="mt-0.5 h-3.5 w-3.5 text-diplomatic-blue" />system_events — Pub/Sub integration for situation lifecycle, profile updates, GDELT pulls.</li>
              <li className="flex items-start gap-2"><Shield className="mt-0.5 h-3.5 w-3.5 text-diplomatic-blue" />notifications — analyst-facing alert center with severity + acknowledgement.</li>
              <li className="flex items-start gap-2"><Shield className="mt-0.5 h-3.5 w-3.5 text-diplomatic-blue" />semaphore states — idempotency guards so re-running a tool does not double-charge or double-write.</li>
            </ul>
            <p className="mt-4 text-[11px] text-navy-500">
              Read the design doc for retention rules, Pub/Sub topics, and the failure-mode matrix before adding new triggers, agents, or tools.
            </p>
          </article>
        )}

        <footer className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-[11px] text-navy-500">
          <span className="inline-flex items-center gap-1">
            <ScrollText className="h-3 w-3" /> Doc surfaces:
          </span>{' '}
          /app/library — generated artifacts · /app/methodology — frameworks (this page) · /app/docs — in-product docs · <a className="text-diplomatic-blue underline" href="https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work" target="_blank" rel="noopener">repo</a>
          <FileBadge className="ml-2 inline h-3 w-3" />
        </footer>
      </section>
    </div>
  );
}
