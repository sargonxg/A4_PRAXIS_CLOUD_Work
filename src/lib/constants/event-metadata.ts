/**
 * Enhanced event metadata for the Nordalia Crisis
 * Provides title, glaslStage, significance, and source citations
 * to augment the base event data in demo-conflict.ts
 */

export interface EventMetadata {
  id: string;
  title: string;
  glaslStage: number; // 1-9 Glasl escalation model
  significance: 'critical' | 'major' | 'moderate' | 'minor';
  sources: string[];
  tags?: string[];
}

// Glasl Stage Reference:
// Stage 1: Hardening — Tensions and positions harden
// Stage 2: Debate & Polemics — Verbal sparring, point scoring
// Stage 3: Actions not Words — Deeds replace words; empathy lost
// Stage 4: Images & Coalitions — Coalition-building, fixed images of enemy
// Stage 5: Loss of Face — Public humiliation, zero-sum thinking
// Stage 6: Threat Strategies — Ultimatums, coercive threats
// Stage 7: Limited Destructive Blows — Deliberate harm, enemy dehumanized
// Stage 8: Fragmentation of the Enemy — Systemic destruction
// Stage 9: Together into the Abyss — Mutual annihilation accepted

export const NORDALIA_EVENT_METADATA: Record<string, EventMetadata> = {
  'evt-001': {
    id: 'evt-001',
    title: 'Disputed General Elections',
    glaslStage: 1,
    significance: 'critical',
    sources: [
      'AU Election Observation Mission Preliminary Statement, March 2024',
      'Carter Center Election Observation Report, March 2024',
      'ECOWAS Electoral Assessment Mission Statement',
    ],
  },
  'evt-002': {
    id: 'evt-002',
    title: 'Electoral Commission Certifies Results; Opposition Rejects Outcome',
    glaslStage: 2,
    significance: 'critical',
    sources: [
      'Nordalia National Electoral Commission Official Gazette, March 2024',
      'DRM Statement on Electoral Fraud, March 2024',
      'Reuters: "Nordalia opposition rejects election results, calls for protests"',
    ],
  },
  'evt-003': {
    id: 'evt-003',
    title: 'DRM Launches Armed Offensive in Eastern Provinces',
    glaslStage: 5,
    significance: 'critical',
    sources: [
      'UNMN Security Update, May 2024',
      'AFP: "Nordalia rebels seize three district capitals in 72 hours"',
      'Crisis Group Conflict Alert, May 2024',
    ],
  },
  'evt-004': {
    id: 'evt-004',
    title: 'AFN Airstrikes on DRM Positions Kill 34 Civilians',
    glaslStage: 6,
    significance: 'critical',
    sources: [
      'UN OCHA Situation Report, May 2024',
      'Human Rights Watch Preliminary Assessment, June 2024',
      'MSF Medical Report on Kessara Town Casualties',
    ],
  },
  'evt-005': {
    id: 'evt-005',
    title: 'UNSC Adopts Resolution 2847: UNMN Mandate and Arms Embargo',
    glaslStage: 5,
    significance: 'critical',
    sources: [
      'UN Security Council Resolution 2847 (2024)',
      'UN Press Release SC/15789',
      'UNMN Mandate Document, July 2024',
    ],
  },
  'evt-006': {
    id: 'evt-006',
    title: 'UNMN Advance Party Deploys; SRSG Santos Arrives',
    glaslStage: 5,
    significance: 'major',
    sources: [
      'UNMN Press Release: Mission deployment begins',
      'SRSG Santos arrival statement, July 2024',
      'UN DPO Deployment Authorization',
    ],
  },
  'evt-007': {
    id: 'evt-007',
    title: 'First Ceasefire Agreement Signed Under AU Facilitation',
    glaslStage: 4,
    significance: 'major',
    sources: [
      'AU Panel of the Wise Communiqué, September 2024',
      'Joint Ceasefire Agreement Text, September 2024',
      'UNMN Monitoring Group Deployment Order',
    ],
  },
  'evt-008': {
    id: 'evt-008',
    title: 'DRM Seizes Belara Mining Complex; Government Resumes Offensive',
    glaslStage: 6,
    significance: 'critical',
    sources: [
      'Belara Mining Corporation Statement, November 2024',
      'UNMN Security Situation Report, November 2024',
      'AU Panel Emergency Consultations Record',
    ],
  },
  'evt-009': {
    id: 'evt-009',
    title: 'ICRC Brokers Humanitarian Corridor Agreement',
    glaslStage: 5,
    significance: 'moderate',
    sources: [
      'ICRC Press Release: Humanitarian corridor established',
      'Tripartite Agreement Text, December 2024',
      'OCHA Humanitarian Access Update',
    ],
  },
  'evt-010': {
    id: 'evt-010',
    title: 'First AU Mediation Round in Abuja Ends Without Agreement',
    glaslStage: 5,
    significance: 'major',
    sources: [
      'AU Panel Chair Statement, January 2025',
      'UNMN Political Update, January 2025',
      'Crisis Group Commentary: "Abuja talks stall over prisoner issue"',
    ],
  },
  'evt-011': {
    id: 'evt-011',
    title: 'Framework Agreement of 2025 Signed at AU Headquarters',
    glaslStage: 3,
    significance: 'critical',
    sources: [
      'AU Peace and Security Council Communiqué, February 2025',
      'Framework Agreement of 2025 Full Text',
      'UNSC Presidential Statement S/PRST/2025/3',
      'Joint UNMN-AU Press Conference, February 2025',
    ],
  },
  'evt-012': {
    id: 'evt-012',
    title: 'Government Arrests Four DRM Lead Negotiators',
    glaslStage: 6,
    significance: 'critical',
    sources: [
      'DRM Statement Suspending Framework Agreement, April 2025',
      'SRSG Santos Statement of "Profound Alarm"',
      'OHCHR Expression of Concern on Arbitrary Detention',
    ],
  },
  'evt-013': {
    id: 'evt-013',
    title: 'AU Panel Declares Framework Agreement Suspended; Westmark Recalls Ambassador',
    glaslStage: 6,
    significance: 'critical',
    sources: [
      'AU Panel Formal Communiqué, April 2025',
      'Westmark Foreign Ministry Statement, April 2025',
      'UNMN Daily Monitoring Report',
    ],
  },
  'evt-014': {
    id: 'evt-014',
    title: 'OCHA: 340,000 IDPs; Humanitarian Corridor Functionally Collapsed',
    glaslStage: 6,
    significance: 'major',
    sources: [
      'OCHA Humanitarian Situation Report No. 14, May 2025',
      'ICRC Operational Update, May 2025',
      'NRC Emergency Assessment Report',
    ],
  },
  'evt-015': {
    id: 'evt-015',
    title: 'Government Blocks ICRC Access to Detention Facilities; Rare Public Statement Follows',
    glaslStage: 7,
    significance: 'major',
    sources: [
      'ICRC Public Statement on Denial of Access, June 2025',
      'UN Special Rapporteur Access Request (3 mandate-holders)',
      'Amnesty International Urgent Action Alert',
    ],
  },
  'evt-016': {
    id: 'evt-016',
    title: 'Westmark Imposes Second Sanctions Tranche; Karovia Retaliates',
    glaslStage: 6,
    significance: 'major',
    sources: [
      'Westmark Foreign Ministry Designations List, July 2025',
      'Karovia Ministry of Foreign Affairs Expulsion Notice',
      'UN Panel of Experts Working Document',
    ],
  },
  'evt-017': {
    id: 'evt-017',
    title: 'DRM Declares Unilateral 60-Day Ceasefire',
    glaslStage: 5,
    significance: 'major',
    sources: [
      'DRM Political Bureau Statement, August 2025',
      'Crisis Group Conflict Update, August 2025',
      'UNMN Military Monitoring Report',
    ],
  },
  'evt-018': {
    id: 'evt-018',
    title: 'Second AU Mediation Round: Confidence-Building Phase Agreed',
    glaslStage: 5,
    significance: 'major',
    sources: [
      'AU Panel Chair Summary, September 2025',
      'Joint Press Statement of UNMN and AU Panel',
      'UNSC Briefing by SRSG Santos, September 2025',
    ],
  },
  'evt-019': {
    id: 'evt-019',
    title: 'UNMN Convoy Ambushed; Two Ghanaian Peacekeepers Killed',
    glaslStage: 7,
    significance: 'critical',
    sources: [
      'UNMN Press Statement: Peacekeeper fatalities',
      'Secretary-General Statement of Condemnation',
      'UNSC Emergency Session Record, October 2025',
      'Ghana Ministry of Defence Confirmation',
    ],
  },
  'evt-020': {
    id: 'evt-020',
    title: 'UNSC Emergency Session Fails; Russia Alleges False-Flag Operation',
    glaslStage: 7,
    significance: 'major',
    sources: [
      'UNSC Meeting Record S/PV.9892',
      'Russia Permanent Mission Statement',
      'UN Spokesperson Daily Press Briefing',
    ],
  },
  'evt-021': {
    id: 'evt-021',
    title: 'RECONA Imposes Agricultural Export Sanctions on Nordalia',
    glaslStage: 6,
    significance: 'moderate',
    sources: [
      'RECONA Extra-Ordinary Summit Communiqué, November 2025',
      'Karovia Bilateral Compensation Package Announcement',
      'IMF Assessment of Nordalia Fiscal Position',
    ],
  },
  'evt-022': {
    id: 'evt-022',
    title: 'Government Releases Eight Detained DRM Negotiators',
    glaslStage: 5,
    significance: 'moderate',
    sources: [
      'Nordalia Government Press Release, December 2025',
      'DRM Response Statement, December 2025',
      'AU Panel Acknowledgment of Confidence-Building Measure',
    ],
  },
  'evt-023': {
    id: 'evt-023',
    title: 'Third Mediation Round: Revised Framework Parameters Agreed',
    glaslStage: 4,
    significance: 'major',
    sources: [
      'AU-UN Joint Chair Summary of Third Mediation Round, January 2026',
      'UNMN SRSG Statement',
      'Crisis Group Conflict Tracker Update, January 2026',
    ],
  },
  'evt-024': {
    id: 'evt-024',
    title: 'Belara Mining Suspends All Operations; Evacuates Staff',
    glaslStage: 6,
    significance: 'critical',
    sources: [
      'Belara Mining Corporation Operational Suspension Statement, February 2026',
      'Nordalia Finance Ministry Response',
      'Financial Times: "Mining halt intensifies Nordalia peace pressure"',
      'World Bank Fiscal Impact Assessment',
    ],
  },
  'evt-025': {
    id: 'evt-025',
    title: 'DRM Submits Revised Peace Proposal; Government Rejects Westmark Observer Role',
    glaslStage: 4,
    significance: 'major',
    sources: [
      'DRM Political Bureau Formal Proposal Text (AU Panel Record)',
      'Nordalia Government Formal Response',
      'Westmark Foreign Ministry Reaction',
    ],
  },
  'evt-026': {
    id: 'evt-026',
    title: 'Security Forces Arrest 23 Civil Society Activists in Pre-Dawn Raids',
    glaslStage: 6,
    significance: 'moderate',
    sources: [
      'CSCN Emergency Statement, February 2026',
      'SRSG Santos Condemnation Statement',
      'Human Rights Watch Urgent Action',
      'ICRC Note Verbale to Nordalia Government',
    ],
  },
  'evt-027': {
    id: 'evt-027',
    title: 'Westmark Briefs AU on Intelligence of New Karovian Arms Delivery',
    glaslStage: 6,
    significance: 'major',
    sources: [
      'AU Commission Chair Acknowledgment of Westmark Briefing',
      'UNMN Monitoring Group Investigation Launch',
      'UN Panel of Experts Interim Note',
    ],
  },
  'evt-028': {
    id: 'evt-028',
    title: 'Government Releases Final Six DRM Negotiators',
    glaslStage: 4,
    significance: 'major',
    sources: [
      'Nordalia Government Goodwill Statement, March 2026',
      'DRM Conditional Acknowledgment',
      'AU Panel Chair Welcoming Statement',
      'UNMN Human Rights Division Monitoring Report',
    ],
  },
  'evt-029': {
    id: 'evt-029',
    title: 'UNMN Monitoring Group Report: 14 Ceasefire Violations Documented',
    glaslStage: 5,
    significance: 'moderate',
    sources: [
      'UNMN Monitoring Group Quarterly Report (leaked), March 2026',
      'Security Council Informal Consultations Record',
      'Government of Nordalia Formal Objection to Attribution Methodology',
      'DRM Statement Contesting Report Findings',
    ],
  },
  'evt-030': {
    id: 'evt-030',
    title: 'Belara Mining Files 90-Day Arbitration Notice; SRSG Declares "Decisive Window"',
    glaslStage: 6,
    significance: 'critical',
    sources: [
      'Belara Mining Corporation Arbitration Notice (ICSID)',
      'AU Panel Emergency Consultations Communiqué',
      'SRSG Santos Public Statement, March 2026',
      'Nordalia Government Response to Arbitration Notice',
    ],
  },
};

/**
 * Helper to get enhanced event data by merging base event with metadata
 */
export function getEnhancedEvent<T extends { id: string }>(
  event: T
): T & Partial<EventMetadata> {
  const meta = NORDALIA_EVENT_METADATA[event.id];
  if (!meta) return event;
  return { ...event, ...meta };
}

/**
 * Get all events sorted by glaslStage for escalation analysis
 */
export function getEventsByGlaslStage(stage: number): string[] {
  return Object.values(NORDALIA_EVENT_METADATA)
    .filter((m) => m.glaslStage === stage)
    .map((m) => m.id);
}

/**
 * Get the escalation trajectory — glaslStage over time
 */
export function getEscalationTrajectory(): { eventId: string; date?: string; glaslStage: number }[] {
  return Object.values(NORDALIA_EVENT_METADATA).map((m) => ({
    eventId: m.id,
    glaslStage: m.glaslStage,
  }));
}
