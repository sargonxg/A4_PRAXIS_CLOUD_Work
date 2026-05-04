'use client';

/**
 * /app/sanctions-explorer — Sanctions Monitor explainer + Syria deep-dive.
 *
 * Companion to /app/sanctions (which is the per-situation AI scan). This page
 * exists so analysts can walk a non-specialist principal through the entire
 * sanctions regime: what sanctions are, the types, the imposing bodies, the
 * legal basis, the live data sources to consult, and a Syria-specific
 * deep-dive on the post-Assad delisting track.
 *
 * Designed to work for any situation: when sanctions data is present in the
 * active situation it gets surfaced here; when not, the encyclopedia content
 * is still useful on its own. Sized for the recording walkthrough.
 */

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  ChevronDown,
  ExternalLink,
  Filter,
  Gavel,
  Globe,
  Library,
  Newspaper,
  Plane,
  Scale,
  Scroll,
  Shield,
  ShieldOff,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { PraxisLink } from '@/components/shared/praxis-link';
import { isSyriaWorkspaceCase } from '@/lib/constants/syria-demo-case';
import { cn } from '@/lib/utils/cn';

interface SanctionType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  short: string;
  description: string;
  examples: string[];
  effects: string;
  evasionRisk: string;
}

const SANCTION_TYPES: SanctionType[] = [
  {
    id: 'asset-freeze',
    label: 'Asset freeze',
    icon: Banknote,
    short: 'Block financial assets within jurisdiction.',
    description:
      'Property and economic resources owned, held, or controlled by the designated person are frozen. Counterparties are prohibited from making funds or economic resources available, directly or indirectly.',
    examples: [
      'OFAC Specially Designated Nationals (SDN) list freezing US-jurisdiction assets',
      'EU Council Regulation freezing EU-jurisdiction assets',
      'UK OFSI consolidated list',
    ],
    effects: 'Cuts target off from formal financial system; signals reputational stigma to correspondents.',
    evasionRisk: 'Use of nominees, shell companies in non-implementing jurisdictions, virtual assets, and trade-based money laundering.',
  },
  {
    id: 'travel-ban',
    label: 'Travel ban',
    icon: Plane,
    short: 'Deny entry / transit to listed individuals.',
    description:
      'Member states are required to prevent entry into or transit through their territories of listed individuals, with limited humanitarian and judicial exemptions.',
    examples: ['UN 1267/2253 ISIL-Da\'esh + Al-Qaida sanctions list', 'EU restrictive measures on Russia, Belarus, Myanmar'],
    effects: 'Limits diplomatic engagement; restricts access to international fora.',
    evasionRisk: 'Use of alternate identity documents, transit through non-aligned jurisdictions.',
  },
  {
    id: 'arms-embargo',
    label: 'Arms embargo',
    icon: ShieldOff,
    short: 'Prohibit supply of military goods + services.',
    description:
      'Comprehensive prohibition on supply, sale, transfer, or brokering of arms, related materiel, training, and technical assistance. Often paired with end-use monitoring requirements.',
    examples: ['UN arms embargo on Libya (Resolution 1970)', 'EU arms embargo on Syria (Council Decision 2013/255/CFSP)'],
    effects: 'Constrains military capability; creates licensing burden for legitimate transfers.',
    evasionRisk: 'Third-country brokering, dual-use mislabelling, parallel trade.',
  },
  {
    id: 'financial',
    label: 'Financial sanctions',
    icon: Building2,
    short: 'Restrict access to capital markets + banking.',
    description:
      'Prohibitions on debt/equity financing, correspondent banking relationships, SWIFT access, and dealings with sectoral entities (often banks, defence firms, energy companies).',
    examples: ['US Sectoral Sanctions Identifications (SSI) list', 'EU sectoral measures on Russia (Regulation 833/2014)', 'UK financial sanctions on Iran'],
    effects: 'Cuts target sectors off from international capital and clearing.',
    evasionRisk: 'Front banks, ruble/yuan settlement, crypto on-ramps.',
  },
  {
    id: 'sectoral',
    label: 'Sectoral sanctions',
    icon: Workflow,
    short: 'Restrict trade / activity in named sectors.',
    description:
      'Targets specific industries (oil, gas, defence, dual-use tech, gold, diamonds) rather than individuals. Includes service prohibitions: insurance, classification, technical assistance.',
    examples: ['EU oil price cap on Russian crude', 'US oil services prohibitions in Venezuela', 'UN diamond embargoes on Liberia, Sierra Leone'],
    effects: 'Reduces revenue + technological capacity in named sector while preserving humanitarian flows.',
    evasionRisk: 'Ship-to-ship transfers, AIS spoofing, disguised destinations, parallel insurance markets.',
  },
  {
    id: 'secondary',
    label: 'Secondary sanctions',
    icon: Globe,
    short: 'Penalise non-US persons for dealing with primary targets.',
    description:
      'Extraterritorial measures that designate non-US persons that engage in significant transactions with primary-sanctioned parties. Most associated with US (CAATSA, Caesar Act, Iran).',
    examples: ['Caesar Syria Civilian Protection Act 2019', 'CAATSA s. 231 (Russia defence/intel sector)', 'Iran ITRA / ITRRA secondary sanctions'],
    effects: 'Forces non-US firms to choose between US market and dealings with target.',
    evasionRisk: 'Cited as the most consequential for Syria reconstruction decisions in 2026; chilling effect on Gulf and EU firms.',
  },
  {
    id: 'smart',
    label: 'Smart / targeted sanctions',
    icon: Scale,
    short: 'Narrow designations to specific individuals + entities.',
    description:
      'Shift from comprehensive country sanctions to targeted listings. Doctrinal evolution since UN reviews of comprehensive sanctions on Iraq (1990s).',
    examples: ['UN 1267 ISIL/Al-Qaida', 'Magnitsky-style human-rights designations (US/UK/EU/CAN)'],
    effects: 'Limits humanitarian impact while increasing political precision.',
    evasionRisk: 'Designation circumvention via family members and proxies; designation arbitrage between regimes.',
  },
  {
    id: 'export-controls',
    label: 'Export controls',
    icon: Scroll,
    short: 'License + control dual-use and military exports.',
    description:
      'Distinct from sanctions but operationally adjacent: Wassenaar Arrangement, EU Dual-Use Regulation 2021/821, US EAR. Covers tech transfer, including AI compute and semiconductors.',
    examples: ['US Foreign Direct Product Rule on advanced semiconductors', 'EU Regulation 2021/821 dual-use list'],
    effects: 'Controls access to high-end technology; key in great-power competition.',
    evasionRisk: 'Tech transfer through joint ventures, third-country resellers, smuggling.',
  },
];

interface SanctionRegime {
  id: string;
  label: string;
  authority: string;
  legalBasis: string[];
  url: string;
  description: string;
  deepLinks: { label: string; url: string }[];
}

const REGIMES: SanctionRegime[] = [
  {
    id: 'un',
    label: 'UN Security Council sanctions',
    authority: 'UN Security Council under Charter Chapter VII',
    legalBasis: ['UN Charter Article 41', 'Specific Council resolutions (e.g., 1267, 1718, 1970, 2231)'],
    url: 'https://www.un.org/securitycouncil/sanctions/information',
    description:
      'Binding on all UN member states. Imposed by Council resolution; administered via dedicated sanctions committees and a Monitoring Team / Panel of Experts model.',
    deepLinks: [
      { label: 'Consolidated UN Sanctions List', url: 'https://www.un.org/securitycouncil/content/un-sc-consolidated-list' },
      { label: '1267 ISIL/Al-Qaida list', url: 'https://www.un.org/securitycouncil/sanctions/1267' },
      { label: 'Office of the Ombudsperson', url: 'https://www.un.org/securitycouncil/ombudsperson' },
    ],
  },
  {
    id: 'us-ofac',
    label: 'US Treasury OFAC',
    authority: 'US Treasury, Office of Foreign Assets Control',
    legalBasis: ['IEEPA (50 U.S.C. §§ 1701–1708)', 'TWEA (50 U.S.C. App. §§ 1–44)', 'Country-specific statutes (e.g., Caesar Act, CAATSA, Iran statutes)'],
    url: 'https://ofac.treasury.gov/',
    description:
      'Most operational sanctions agency globally. Maintains the SDN list, sectoral lists, country programs, and issues general/specific licences for permitted transactions.',
    deepLinks: [
      { label: 'SDN consolidated list', url: 'https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists' },
      { label: 'OFAC sanctions programs', url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information' },
      { label: 'Caesar Syria Sanctions', url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information/syria-sanctions' },
      { label: 'Recent actions feed', url: 'https://ofac.treasury.gov/recent-actions' },
    ],
  },
  {
    id: 'eu',
    label: 'EU restrictive measures',
    authority: 'Council of the EU (CFSP) + European Commission',
    legalBasis: ['TEU Article 29 (Council Decision)', 'TFEU Article 215 (Council Regulation)'],
    url: 'https://www.sanctionsmap.eu/',
    description:
      'Two-step legal architecture: Council Decision under CFSP, then Council Regulation giving direct legal effect. Implemented and enforced by member states.',
    deepLinks: [
      { label: 'EU Sanctions Map', url: 'https://www.sanctionsmap.eu/' },
      { label: 'Consolidated EU Financial Sanctions List', url: 'https://webgate.ec.europa.eu/fsd/fsf' },
      { label: 'EU Syria sanctions (Reg 36/2012)', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02012R0036-20240226' },
    ],
  },
  {
    id: 'uk',
    label: 'UK OFSI',
    authority: 'HM Treasury, Office of Financial Sanctions Implementation',
    legalBasis: ['Sanctions and Anti-Money Laundering Act 2018 (SAMLA)', 'Country-specific UK regulations'],
    url: 'https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation',
    description:
      'Post-Brexit UK regime. Maintains the consolidated UK sanctions list and licences exemptions; operational arm of HM Treasury.',
    deepLinks: [
      { label: 'UK sanctions list', url: 'https://www.gov.uk/government/publications/the-uk-sanctions-list' },
      { label: 'OFSI Annual Review', url: 'https://www.gov.uk/government/publications/ofsi-annual-review-2023-to-2024' },
    ],
  },
  {
    id: 'switzerland',
    label: 'Swiss SECO',
    authority: 'State Secretariat for Economic Affairs',
    legalBasis: ['Federal Act on the Implementation of International Sanctions (Embargo Act)'],
    url: 'https://www.seco.admin.ch/seco/en/home/Aussenwirtschaftspolitik_Wirtschaftliche_Zusammenarbeit/Wirtschaftsbeziehungen/exportkontrollen-und-sanktionen.html',
    description:
      'Switzerland generally aligns with EU/UN sanctions but applies them under domestic law; significant for banking compliance.',
    deepLinks: [
      { label: 'Swiss sanctions list (SECO)', url: 'https://www.seco.admin.ch/seco/en/home/Aussenwirtschaftspolitik_Wirtschaftliche_Zusammenarbeit/Wirtschaftsbeziehungen/exportkontrollen-und-sanktionen/sanktionen-embargos/sanktionsmassnahmen.html' },
    ],
  },
];

interface SyriaSanctionEvent {
  date: string;
  title: string;
  body: string;
  impact: string;
  source: string;
  url: string;
  category: 'Designation' | 'Delisting' | 'Licence' | 'Legal' | 'Investigation';
}

const SYRIA_TIMELINE: SyriaSanctionEvent[] = [
  {
    date: '2025-01-06',
    title: 'OFAC issues Syria General License 24',
    body: 'Allows US transactions with new transitional government bodies and energy/water/sanitation services for six months, easing post-Assad humanitarian flows.',
    impact: 'Opens narrow corridor for service delivery and limited financial activity.',
    source: 'US Treasury OFAC',
    url: 'https://ofac.treasury.gov/recent-actions/20250106',
    category: 'Licence',
  },
  {
    date: '2025-02-19',
    title: 'EU lifts asset freezes on Syrian Central Bank, energy and transport',
    body: 'Council suspends measures targeting CBS, banks, oil sector and transport authorities; retains targeted sanctions on individuals tied to former regime atrocities.',
    impact: 'Re-opens correspondent banking conversations; signals conditional engagement.',
    source: 'EU Council Decision (CFSP) 2025/302',
    url: 'https://eur-lex.europa.eu/eli/dec/2025/302/oj',
    category: 'Delisting',
  },
  {
    date: '2025-04-30',
    title: 'UK OFSI updates Syria sanctions list — 24 individual delistings',
    body: 'Removes 24 names connected to former regime where designations no longer met UK threshold; retains Caesar-aligned individual measures.',
    impact: 'Reduces overhang for legitimate UK-jurisdiction engagement; legal-aid groups note remaining due-process concerns.',
    source: 'UK OFSI / HM Treasury',
    url: 'https://www.gov.uk/government/publications/the-uk-sanctions-list',
    category: 'Delisting',
  },
  {
    date: '2025-08-12',
    title: 'OFAC designations: ten coastal-violence perpetrators',
    body: 'Treasury designates ten named perpetrators of March 2025 coastal violence under Magnitsky-style human-rights authority (E.O. 13818).',
    impact: 'Signals that delisting track is conditional on accountability outcomes.',
    source: 'US Treasury OFAC',
    url: 'https://ofac.treasury.gov/recent-actions/20250812',
    category: 'Designation',
  },
  {
    date: '2026-02-25',
    title: 'EU lifts core sanctions package — Council Decision 2026/355',
    body: 'Decouples state-institution sanctions from Assad-era restrictions; retains targeted designations on former regime actors. Conditioned on six-month rights-protection benchmarks.',
    impact: 'Most consequential delisting since transition. EU-Syria reconstruction track formally opens.',
    source: 'EU Council / EEAS',
    url: 'https://eur-lex.europa.eu/eli/dec/2026/355/oj',
    category: 'Legal',
  },
  {
    date: '2026-03-11',
    title: 'OFAC issues Caesar Act forward-looking guidance',
    body: 'Treasury publishes guidance clarifying that transactions by transitional authorities, when consistent with rights and humanitarian benchmarks, will not trigger Caesar Act secondary sanctions.',
    impact: 'Reduces chilling effect on Gulf and Türkiye reconstruction firms.',
    source: 'US Treasury OFAC',
    url: 'https://ofac.treasury.gov/syria-caesar-guidance-202603',
    category: 'Licence',
  },
  {
    date: '2026-04-22',
    title: 'UN Security Council debate — Syria sanctions delisting under 1267',
    body: 'Council members debate maintenance of 1267 listings on individuals associated with the previous regime; Russia and China block vote on broader review.',
    impact: 'Highlights continuing UN-level designation overhang separate from EU/US tracks.',
    source: 'UN Security Council',
    url: 'https://www.ungeneva.org/en/news-media/news/2026/04/117901/security-council-live-regional-war-threatens-syrias-fragile',
    category: 'Investigation',
  },
];

const RESEARCH_LINKS = [
  { label: 'OFAC SDN search', url: 'https://sanctionssearch.ofac.treasury.gov/' },
  { label: 'EU consolidated financial sanctions search', url: 'https://webgate.ec.europa.eu/fsd/fsf' },
  { label: 'UN consolidated list', url: 'https://scsanctions.un.org/' },
  { label: 'UK OFSI consolidated list', url: 'https://www.gov.uk/government/publications/the-uk-sanctions-list' },
  { label: 'Sanctions Lawyers blog', url: 'https://sanctionsnews.bakermckenzie.com/' },
  { label: 'Lawfare sanctions coverage', url: 'https://www.lawfaremedia.org/topics/sanctions' },
  { label: 'CSIS sanctions research', url: 'https://www.csis.org/topics/sanctions-export-controls-and-enforcement' },
  { label: 'CNAS sanctions / economic statecraft', url: 'https://www.cnas.org/research/economic-statecraft' },
  { label: 'King\'s Centre for the Study of Terrorism', url: 'https://www.kcl.ac.uk/icsr' },
];

export default function SanctionsExplorerPage() {
  const guard = useSituationGuard();
  const searchParams = useSearchParams();
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), guard.isDemo);
  const [activeRegime, setActiveRegime] = useState<string>('us-ofac');
  const [openTypeId, setOpenTypeId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const regime = REGIMES.find((r) => r.id === activeRegime) ?? REGIMES[0];

  const filteredSyriaTimeline = useMemo(() => {
    if (categoryFilter === 'all') return SYRIA_TIMELINE;
    return SYRIA_TIMELINE.filter((e) => e.category === categoryFilter);
  }, [categoryFilter]);

  if (guard.needsOnboarding) return <OnboardingRequiredState />;

  return (
    <div className="space-y-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
            <Shield className="h-3.5 w-3.5" /> Sanctions explorer
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-navy-900">Sanctions monitor + encyclopedia</h1>
          <p className="mt-1 text-sm text-navy-500 max-w-3xl">
            What sanctions do, who imposes them, the legal basis, the live data sources to consult, and the post-Assad
            Syria delisting track. Designed to brief a non-specialist principal in five minutes and to generalise to any
            situation that triggers a sanctions question.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PraxisLink
            href="/sanctions"
            className="inline-flex items-center gap-1.5 rounded-md bg-diplomatic-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-diplomatic-blue/90"
          >
            Open AI sanctions scan <ArrowRight className="h-3.5 w-3.5" />
          </PraxisLink>
        </div>
      </header>

      {/* Sanction types */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Types of sanctions</h2>
            <p className="text-[11px] text-navy-500">Eight categories analysts encounter in conflict files. Click for description, examples, effects, and evasion risks.</p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-navy-400">8 types</span>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {SANCTION_TYPES.map((t) => {
            const open = openTypeId === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setOpenTypeId(open ? null : t.id)}
                className={cn(
                  'rounded-md border p-3 text-left transition',
                  open ? 'border-diplomatic-blue ring-2 ring-diplomatic-blue/15' : 'border-slate-200 hover:border-diplomatic-blue/40',
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-diplomatic-blue" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-navy-900">{t.label}</p>
                      <ChevronDown className={cn('h-3.5 w-3.5 text-navy-400 transition', open && 'rotate-180')} />
                    </div>
                    <p className="mt-1 text-[11px] text-navy-600">{t.short}</p>
                  </div>
                </div>
                {open && (
                  <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                    <p className="text-[12px] leading-relaxed text-navy-700">{t.description}</p>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Examples</p>
                      <ul className="mt-1 space-y-0.5">
                        {t.examples.map((ex) => (
                          <li key={ex} className="text-[11px] text-navy-700">• {ex}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md bg-emerald-50 px-2 py-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Intended effect</p>
                        <p className="text-[11px] text-emerald-900">{t.effects}</p>
                      </div>
                      <div className="rounded-md bg-rose-50 px-2 py-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Evasion risk</p>
                        <p className="text-[11px] text-rose-900">{t.evasionRisk}</p>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Regimes */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Sanctioning bodies + legal basis</h2>
            <p className="text-[11px] text-navy-500">Five regimes account for 95% of operationally relevant designations. Each has a distinct legal architecture.</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {REGIMES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRegime(r.id)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition',
                  activeRegime === r.id
                    ? 'border-diplomatic-blue bg-diplomatic-blue/10 text-diplomatic-blue'
                    : 'border-slate-200 bg-white text-navy-600 hover:border-diplomatic-blue/40',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <article className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-navy-900">{regime.label}</h3>
          <p className="mt-1 text-[11px] text-navy-500">{regime.authority}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-navy-700">{regime.description}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Legal basis</p>
              <ul className="mt-1 space-y-0.5">
                {regime.legalBasis.map((l) => (
                  <li key={l} className="text-[11px] text-navy-700">• {l}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Live resources</p>
              <ul className="mt-1 space-y-0.5">
                <li>
                  <a href={regime.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[11px] text-diplomatic-blue underline">
                    {regime.url} <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                {regime.deepLinks.map((d) => (
                  <li key={d.url}>
                    <a href={d.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[11px] text-diplomatic-blue underline">
                      {d.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>

      {/* Syria deep dive */}
      <section className="rounded-xl border border-diplomatic-blue/30 bg-diplomatic-blue/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Newspaper className="h-3.5 w-3.5 text-diplomatic-blue" />
              Syria post-Assad sanctions track
            </h2>
            <p className="text-[11px] text-navy-500">
              Since the December 2024 transition, four regimes have moved on Syria designations. The cumulative effect is conditional re-engagement, not blanket relief.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-navy-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-navy-800 focus:border-diplomatic-blue focus:outline-none"
            >
              <option value="all">All categories</option>
              <option value="Delisting">Delisting</option>
              <option value="Designation">Designation</option>
              <option value="Licence">Licence</option>
              <option value="Legal">Legal</option>
              <option value="Investigation">Investigation</option>
            </select>
          </div>
        </div>
        <ol className="mt-4 space-y-3">
          {filteredSyriaTimeline.map((e) => (
            <li key={e.date + e.title} className="rounded-md border border-white bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gavel className="h-3.5 w-3.5 text-diplomatic-blue" />
                  <span className="font-mono text-[11px] text-navy-500">{e.date}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    e.category === 'Delisting' ? 'bg-emerald-100 text-emerald-700' :
                    e.category === 'Designation' ? 'bg-rose-100 text-rose-700' :
                    e.category === 'Licence' ? 'bg-amber-100 text-amber-700' :
                    e.category === 'Legal' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-navy-100 text-navy-700')}>{e.category}</span>
                </div>
                <a href={e.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[11px] text-diplomatic-blue underline">
                  Source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-1 text-sm font-semibold text-navy-900">{e.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-navy-700">{e.body}</p>
              <div className="mt-2 rounded-md bg-emerald-50 px-2 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">PRAXIS read</p>
                <p className="text-[11px] text-emerald-900">{e.impact}</p>
              </div>
              <p className="mt-1 text-[10px] text-navy-500">Source: {e.source}</p>
            </li>
          ))}
        </ol>

        {isSyriaCase && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
            <p className="flex items-center gap-1 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" /> Watch the next 90 days
            </p>
            <ul className="mt-1 space-y-0.5">
              <li>• EU sanctions benchmark review (2026-08-25) — first conditional renewal moment.</li>
              <li>• Coastal accountability commitment: investigative outputs will shape OFAC + UK posture.</li>
              <li>• Türkiye energy/reconstruction MoU: monitor secondary-sanctions exposure for European insurers.</li>
              <li>• UN 1267 listings remain — the most under-reported overhang on transitional figures.</li>
            </ul>
          </div>
        )}
      </section>

      {/* Research links */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Library className="h-3.5 w-3.5 text-diplomatic-blue" />
          <h2 className="text-sm font-semibold text-navy-900">Live research links</h2>
        </div>
        <p className="mt-1 text-[11px] text-navy-500">
          PRAXIS does not replace these primary sources. Use Source Scout to capture receipts; use the Sanctions Monitor in /sanctions to run AI-assisted scans grounded in your active situation.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {RESEARCH_LINKS.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noopener" className="inline-flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-navy-700 hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5">
                <span className="truncate">{r.label}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-navy-400" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
          <Sparkles className="h-3.5 w-3.5 text-gold-600" /> Connect this to your situation
        </h2>
        <p className="mt-1 text-[11px] text-navy-500">
          When a situation has sanctions in scope, the AI Sanctions Scan in <PraxisLink href="/sanctions" className="text-diplomatic-blue underline">/sanctions</PraxisLink> ingests recent OFAC, EU and UN actions and writes a per-situation tracker (designations, delistings, evasion signals, humanitarian impact). News alerts feed back into Source Scout and the Library so the scan stays current without leaving the case file.
        </p>
      </section>
    </div>
  );
}
