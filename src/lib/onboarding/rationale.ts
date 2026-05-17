/**
 * Onboarding rationale messaging — Brick #51 round 5.
 *
 * Each onboarding step reads the analyst's selected role / domain /
 * working-style and surfaces a short "what this means for you" panel
 * describing how the choice flows into actual PRAXIS tools.
 *
 * Pure data + lookup helpers. No React, no Firestore, no fetch — the
 * onboarding pages import the helpers and render whatever React shape
 * suits the step.
 *
 * Spec: docs/specs/2026-04-26-improvements/09-onboarding-rationale.md.
 */

export interface OnboardingRationale {
  /** 1-sentence headline. */
  headline: string;
  /** 3-5 bullets — each names a PRAXIS tool the choice affects. */
  bullets: string[];
  /** Concrete example (named tool + observable outcome). */
  example: { tool: string; outcome: string };
}

// ---------------------------------------------------------------------------
// Identity step — keyed on (role, seniority).
// ---------------------------------------------------------------------------

const IDENTITY_FALLBACK: OnboardingRationale = {
  headline: 'PRAXIS calibrates every tool to the role you pick here.',
  bullets: [
    'Your role + seniority shape every system prompt — no generic answers.',
    'Tool recommendations re-order to match your day-to-day decisions.',
    'Briefings default to the audience your role typically writes for.',
    'Red-line phrases (set on Working Style) override role defaults.',
  ],
  example: {
    tool: 'Briefing Room',
    outcome: 'Slides default to the analytical voice your role typically uses.',
  },
};

const IDENTITY_BY_ROLE: Record<string, OnboardingRationale> = {
  un_official: {
    headline: 'PRAXIS calibrates every tool to UN editorial standards.',
    bullets: [
      'Briefings follow UN DPPA / DPPA-DPO format defaults.',
      'Source language flips to UN-style ("armed conflict", "non-State armed group").',
      'Risk Monitor + Early Warning surface UNSC-relevant trigger windows.',
      'Legal Tracker prioritises UNSC resolutions and Chapter VI/VII split.',
      'Briefing Room "UNSC informal" template is the default slide deck.',
    ],
    example: {
      tool: 'Briefing Room',
      outcome: 'Default UNSC informal-style brief with discussion-question slide.',
    },
  },
  diplomat: {
    headline: 'PRAXIS calibrates around bilateral and multilateral diplomatic work.',
    bullets: [
      'Tool tone defaults to diplomatic-cable register.',
      'Stakeholder Map highlights bilateral relationships first.',
      'Negotiation Prep emphasises ZOPA/BATNA + face-saving moves.',
      'CONCORDIA simulations adopt the mediator stance you pick on Perspective.',
    ],
    example: {
      tool: 'Stakeholder Map',
      outcome: 'Bilateral relationships rendered first; multilateral fora secondary.',
    },
  },
  mediator: {
    headline: 'PRAXIS calibrates around mediation process design.',
    bullets: [
      'Berghof process framework is the default in Mediation Designer.',
      'Negotiation Prep ZOPA/BATNA editor opens with party-cell shortcuts.',
      'Brainstorming Table prioritises the Mediator persona.',
      'CONCORDIA primes from your active situation\'s actor profiles.',
    ],
    example: {
      tool: 'Mediation Designer',
      outcome: 'Phase sequencing + CBMs + spoiler mitigation prefilled.',
    },
  },
  analyst: {
    headline: 'PRAXIS calibrates for evidence-based assessments.',
    bullets: [
      'Confidence levels (HIGH / MEDIUM / LOW) appear on every output.',
      'Source citations are surfaced inline by default.',
      'Red-Team Review is one click away from any tool result.',
      'Source Scout opens with your saved Sources Library applied.',
    ],
    example: {
      tool: 'Risk Monitor',
      outcome: 'INFORM scoring with explicit confidence + sources panel.',
    },
  },
  researcher: {
    headline: 'PRAXIS calibrates for academic-rigor research.',
    bullets: [
      'Dossiers default to long-form with footnoted citations.',
      'Deep Research Agent is one tab away from Sources Library.',
      'Documents triple-pane (paragraph / entity / graph) is default.',
      'Brainstorming Table convenes the full 6-persona panel by default.',
    ],
    example: {
      tool: 'Deep Research Agent',
      outcome: 'Multi-agent pipeline with planning + research + synthesis phases.',
    },
  },
  observer: {
    headline: 'PRAXIS calibrates for neutral monitoring.',
    bullets: [
      'Tone defaults to neutral / observational ("assessment indicates").',
      'Early Warning + Escalation Monitor are the front-page tools.',
      'Source diversity is enforced explicitly in every Briefing.',
      'Risk Monitor surfaces trend deltas vs absolute scores.',
    ],
    example: {
      tool: 'Early Warning',
      outcome: 'Glasl 9-stage tracking with de-escalation windows surfaced.',
    },
  },
  advisor: {
    headline: 'PRAXIS calibrates for policy-options work.',
    bullets: [
      'Policy Memo defaults to options-with-trade-offs structure.',
      'Game Theory + Scenarios surface alternative futures by default.',
      'Brief Builder is the default drafting surface, not Briefing Room.',
      'Brainstorming Table emphasises decision-options output shape.',
    ],
    example: {
      tool: 'Policy Memo',
      outcome: 'Options + risks + implementation-steps output by default.',
    },
  },
};

export function rationaleForIdentity(role: string, _seniority?: string): OnboardingRationale {
  return IDENTITY_BY_ROLE[role] ?? IDENTITY_FALLBACK;
}

// ---------------------------------------------------------------------------
// Perspective step — keyed on primaryDomain.
// ---------------------------------------------------------------------------

const PERSPECTIVE_FALLBACK: OnboardingRationale = {
  headline: 'Your domain defaults shape every analytical lens.',
  bullets: [
    'Tool defaults adapt to the frameworks your domain typically uses.',
    'Preferred data feeds re-rank to your domain (e.g. humanitarian web reporting for humanitarian).',
    'Per-tool prompt overrides emphasise your domain\'s priorities.',
  ],
  example: { tool: 'Risk Monitor', outcome: 'Generic INFORM scoring without domain emphasis.' },
};

const PERSPECTIVE_BY_DOMAIN: Record<string, OnboardingRationale> = {
  humanitarian: {
    headline: 'Humanitarian domain — IPC, displacement, protection, access first.',
    bullets: [
      'Risk Monitor weights humanitarian dimension above security.',
      'Briefing Room leads with cluster impact + funding gap.',
      'Source Scout boosts humanitarian web reporting / OCHA / displacement reporting / humanitarian data.',
      'Humanitarian tool is your dashboard front door.',
    ],
    example: {
      tool: 'Humanitarian',
      outcome: 'IPC phases + displacement + funding + protection on first load.',
    },
  },
  'armed-conflict-security': {
    headline: 'Armed conflict / security — escalation indicators + force posture.',
    bullets: [
      'Risk Monitor leans into Glasl 9-stage + INFORM hazard pillar.',
      'Early Warning is the front-page tool.',
      'Source Scout boosts event-data OSINT (source-linked event reporting, expert conflict analysis, security research).',
      'Brainstorming Table prioritises the Security/Risk Analyst persona.',
    ],
    example: {
      tool: 'Early Warning',
      outcome: 'Glasl stage transitions + de-escalation windows surfaced.',
    },
  },
  'diplomacy-negotiation': {
    headline: 'Diplomacy and negotiation — ZOPA, BATNA, mediation process.',
    bullets: [
      'Negotiation Prep + CONCORDIA + Mediation Designer are first-class.',
      'Stakeholder Map renders bilateral lines before multilateral fora.',
      'Briefing Room defaults to UN DPPA mediation-process slide deck.',
      'Brainstorming Table prioritises Mediator persona.',
    ],
    example: { tool: 'Negotiation Prep', outcome: 'ZOPA + BATNA editor with party cells prefilled.' },
  },
  'human-rights': {
    headline: 'Human rights — IHL, IHRL, accountability tracks.',
    bullets: [
      'Legal Tracker emphasises ICC / ICJ / customary law obligations.',
      'Briefing Room leads with violation + accountability angle.',
      'Source Scout boosts OHCHR / Human Rights Watch / Amnesty.',
      'Brainstorming Table prioritises Legal Analyst persona.',
    ],
    example: { tool: 'Legal Tracker', outcome: 'Per-resolution compliance + ICC/ICJ tracks.' },
  },
  'governance-rule-of-law': {
    headline: 'Governance and rule of law — institutions, transitions, treaties.',
    bullets: [
      'Briefing Room emphasises institutional context + legal track.',
      'Treaty Analyzer is the front-page legal tool.',
      'Source Scout boosts economic institution governance + IDEA + V-Dem.',
      'Risk Monitor weights political dimension above other axes.',
    ],
    example: { tool: 'Treaty Analyzer', outcome: 'Per-instrument compliance status + signatories.' },
  },
  'economic-sanctions': {
    headline: 'Economic and sanctions — designations, trade, financial flows.',
    bullets: [
      'Sanctions Tracker is the front-page tool.',
      'Briefing Room leads with sanctions + trade + financial flows.',
      'Source Scout boosts OFAC / EU / UN designations + IMF / economic institution.',
      'Risk Monitor weights economic dimension above other axes.',
    ],
    example: { tool: 'Sanctions Tracker', outcome: 'Per-actor sanctions exposure + secondary effects.' },
  },
  'development-stabilization': {
    headline: 'Development and stabilisation — conflict-sensitive programming.',
    bullets: [
      'Briefing Room leads with stabilisation theory of change.',
      'Source Scout boosts economic institution / OECD DAC / ALNAP.',
      'Risk Monitor weights social + economic dimensions higher.',
    ],
    example: { tool: 'Risk Monitor', outcome: 'Stabilisation-flavoured scoring with conflict-sensitive overlays.' },
  },
  'climate-environmental-security': {
    headline: 'Climate and environmental security — resource conflict, displacement.',
    bullets: [
      'Risk Monitor adds climate exposure indicators.',
      'Source Scout boosts IPCC / NOAA / FAO climate datasets.',
      'Briefing Room emphasises resource scarcity + adaptation.',
    ],
    example: { tool: 'Risk Monitor', outcome: 'Climate-driven risk indicators added to INFORM.' },
  },
  'information-cyber': {
    headline: 'Information and cyber — narrative, propaganda, info ops.',
    bullets: [
      'Media Compass + Media Roundup are first-class.',
      'Briefing Room leads with narrative + framing analysis.',
      'Source Scout boosts EUvsDisinfo / DFRLab / Stanford Internet Observatory.',
      'Brainstorming Table prioritises Media Analyst persona.',
    ],
    example: { tool: 'Media Compass', outcome: 'Outlet bias + reliability + frame divergence on first load.' },
  },
  'transnational-threats': {
    headline: 'Transnational threats — terrorism, organised crime, illicit flows.',
    bullets: [
      'Briefing Room emphasises network + financial-flow analysis.',
      'Source Scout boosts UNODC / GI-TOC / FATF.',
      'Risk Monitor weights security + governance dimensions higher.',
    ],
    example: { tool: 'Briefing Room', outcome: 'Network-flow + designations + cross-border exposure.' },
  },
  generic: PERSPECTIVE_FALLBACK,
};

export function rationaleForPerspective(primaryDomain: string, _audience?: string): OnboardingRationale {
  return PERSPECTIVE_BY_DOMAIN[primaryDomain] ?? PERSPECTIVE_FALLBACK;
}

// ---------------------------------------------------------------------------
// Working style step — keyed on outputLanguage + audience pairing.
// ---------------------------------------------------------------------------

const WORKING_STYLE_FALLBACK: OnboardingRationale = {
  headline: 'Working style choices control output tone, language, and red lines.',
  bullets: [
    'Output language flips every AI route to your working language.',
    'Red-line phrases override anywhere in the platform.',
    'Audience tone aligns Briefing Room slide voice.',
    'Preferred sources lift in Source Scout proposals.',
  ],
  example: { tool: 'Source Scout', outcome: 'Tier-A / preferred publishers float to the top.' },
};

const WORKING_STYLE_BY_LANG: Record<string, OnboardingRationale> = {
  fr: {
    headline: 'Sortie en français — chaque route IA répond dans votre langue de travail.',
    bullets: [
      'Briefings, mémos et tableaux de délibération sortent en français.',
      'Citations sources préservées dans la langue d\'origine.',
      'Phrases interdites prises en compte avant chaque génération.',
      'Source Scout privilégie les publications francophones (avec préférences).',
    ],
    example: { tool: 'Briefing Room', outcome: 'Slides en français avec ton diplomatique.' },
  },
  ar: {
    headline: 'إخراج باللغة العربية — كل أداة ذكاء اصطناعي ستتحدث بلغة عملك.',
    bullets: [
      'الإحاطات والمذكرات وجداول المداولة تخرج باللغة العربية.',
      'الاستشهادات بالمصادر تحتفظ بلغتها الأصلية.',
      'الجمل المحظورة (الخطوط الحمراء) تعمل قبل كل توليد.',
      'مستكشف المصادر يرفع أولوية الناشرين باللغة العربية.',
    ],
    example: { tool: 'Briefing Room', outcome: 'إحاطات باللغة العربية بنبرة دبلوماسية.' },
  },
  es: {
    headline: 'Salida en español — cada ruta de IA responde en tu idioma de trabajo.',
    bullets: [
      'Briefings, memos y tablas de deliberación salen en español.',
      'Las citas a fuentes se conservan en su idioma original.',
      'Frases prohibidas (líneas rojas) actúan antes de cada generación.',
      'Source Scout prioriza publicaciones en español si están en tu lista.',
    ],
    example: { tool: 'Briefing Room', outcome: 'Diapositivas en español con tono diplomático.' },
  },
};

export function rationaleForWorkingStyle(outputLanguage: string, _audience?: string): OnboardingRationale {
  if (outputLanguage in WORKING_STYLE_BY_LANG) return WORKING_STYLE_BY_LANG[outputLanguage];
  return WORKING_STYLE_FALLBACK;
}

export const __test__ = {
  IDENTITY_BY_ROLE,
  PERSPECTIVE_BY_DOMAIN,
  WORKING_STYLE_BY_LANG,
};
