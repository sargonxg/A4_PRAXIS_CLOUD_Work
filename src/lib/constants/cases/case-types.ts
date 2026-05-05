/**
 * Shared case template types used by Pakistan, US-Housing, and any future
 * demo template that wants to render through the same tool surfaces (sidebar
 * stakeholder map, media compass, library, editor, briefing).
 *
 * The shapes are deliberately compatible with the existing Syria seed data so
 * the stakeholder-map renderer, media-compass renderer, and library list can
 * accept any case interchangeably.
 */

export type CaseStakeholderType =
  | 'state'
  | 'non_state_armed'
  | 'civil_society'
  | 'international_org'
  | 'external_state'
  | 'business'
  | 'minority'
  | 'legislature'
  | 'judiciary'
  | 'military'
  | 'agency'
  | 'union'
  | 'advocacy'
  | 'industry'
  | 'subnational'
  | 'donor'
  | 'principal';

export type CaseStakeholderQuadrant =
  | 'definitive'
  | 'dominant'
  | 'dangerous'
  | 'dependent'
  | 'dormant'
  | 'discretionary'
  | 'demanding'
  | 'non-stakeholder';

export interface CaseStakeholder {
  id: string;
  name: string;
  shortName: string;
  type: CaseStakeholderType;
  /** Mitchell-Agle-Wood salience scores, 0..1 */
  power: number;
  legitimacy: number;
  urgency: number;
  quadrant: CaseStakeholderQuadrant;
  /** One-line stance. */
  position: string;
  interests: string[];
  leverage: string[];
  constraints: string[];
  /** Optional source quote (real public-source). */
  quote?: { text: string; attribution: string; url?: string };
  /** Optional document references that mention this stakeholder. */
  docRefs?: string[];
  /** True if the stakeholder is on the analyst's office side rather than the situation. */
  office?: boolean;
}

export type CaseTimelineSignificance = 'critical' | 'high' | 'medium' | 'low';

export interface CaseTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  significance: CaseTimelineSignificance;
  category: string;
  sourceUrls?: string[];
}

export interface CaseDocument {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  type: 'briefing' | 'memo' | 'report' | 'statement' | 'legislation' | 'litigation' | 'data';
  summary: string;
  url?: string;
  /** Pages of extracted body content for the document viewer. */
  excerpts?: string[];
  tags?: string[];
}

export interface CaseSource {
  id: string;
  name: string;
  url: string;
  category:
    | 'official'
    | 'multilateral'
    | 'think-tank'
    | 'national-media'
    | 'local-media'
    | 'industry-data'
    | 'litigation'
    | 'opposition';
  language?: string;
  /** 0..1 trust signal used by the media compass. */
  reliability: number;
  /** Editorial lean placement on the media compass: -1 left, 0 centre, +1 right. */
  lean: number;
}

export interface CaseMediaOutlet {
  id: string;
  name: string;
  url: string;
  /** Coordinates on the media compass canvas (-1..1 axes). */
  x: number;
  y: number;
  /** Editorial bias label rendered next to dot. */
  bias: 'left' | 'centre-left' | 'centre' | 'centre-right' | 'right' | 'state' | 'industry';
  /** Reach band drives dot size. */
  reach: 'national' | 'regional' | 'sectoral' | 'global';
  language?: string;
  notes?: string;
}

export interface CaseTemplateData {
  id: string;
  /** Template id from DEMO_TEMPLATES. */
  templateId: string;
  /** Display name shown above tools when this template is active. */
  contextLabel: string;
  /** Short banner subtitle. */
  subtitle: string;
  /** Stakeholders directly inside the situation. */
  situationStakeholders: CaseStakeholder[];
  /** Stakeholders on the analyst's own office/principal side. */
  officeStakeholders: CaseStakeholder[];
  documents: CaseDocument[];
  sources: CaseSource[];
  mediaOutlets: CaseMediaOutlet[];
  timeline: CaseTimelineEvent[];
  /** Risk components for the dashboard widget. */
  risk: { score: number; trend: 'up' | 'down' | 'flat'; label: string };
  /** Headline KPIs shown on cockpit + desk. */
  kpis: Array<{ label: string; value: string; tone?: 'navy' | 'rose' | 'emerald' | 'amber' | 'blue' }>;
  /** Suggested briefing title shown in the editor when this template is active. */
  briefingTitle: string;
}
