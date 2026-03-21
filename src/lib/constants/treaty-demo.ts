// Treaty & Agreement Analyzer — Demo Data
// Part of the PRAXIS Conflict Intelligence Platform by TACITUS

export interface Agreement {
  id: string;
  title: string;
  type: string;
  parties: string[];
  dateAdopted: string;
  status: 'active' | 'suspended' | 'expired';
}

export interface Clause {
  number: number;
  title: string;
  text: string;
  category: 'commitment' | 'obligation' | 'condition' | 'enforcement' | 'verification';
  responsibleParty: string;
  deadline: string | null;
  complianceStatus: 'compliant' | 'partial' | 'non-compliant' | 'pending';
  complianceScore: number;
  ambiguityFlags: string[];
  historicalComplianceRate: number;
}

export interface ComplianceSummary {
  overall: number;
  byParty: Record<string, number>;
  byCategory: Record<string, number>;
  ambiguousClauses: number;
  historicalComparison: string;
}

export const DEMO_AGREEMENTS: Agreement[] = [
  {
    id: 'nordalia-ceasefire',
    title: 'Nordalia Ceasefire Agreement (September 2025)',
    type: 'Ceasefire Agreement',
    parties: ['Government of Nordalia', 'Eastern Marches Liberation Front'],
    dateAdopted: '2025-09-15',
    status: 'active',
  },
  {
    id: 'eastern-autonomy',
    title: 'Eastern Marches Autonomy Framework',
    type: 'Political Framework',
    parties: ['Government of Nordalia', 'EMLF', 'AU Mediation Team'],
    dateAdopted: '2025-11-02',
    status: 'suspended',
  },
  {
    id: 'regional-pact',
    title: 'Regional Non-Aggression Pact',
    type: 'Regional Treaty',
    parties: ['Republic of Nordalia', 'Republic of Merovia', 'Federation of Kasara'],
    dateAdopted: '2024-03-20',
    status: 'active',
  },
];

export const NORDALIA_CEASEFIRE_CLAUSES: Clause[] = [
  {
    number: 1,
    title: 'Cessation of Hostilities',
    text: 'All parties shall immediately cease all offensive military operations, including aerial bombardment, artillery shelling, and ground force advances, effective 00:00 hours local time on 16 September 2025. Defensive positions may be maintained but no new fortifications shall be constructed within 5 kilometres of the Line of Contact. Any violation of this provision shall be reported to the Joint Monitoring Committee within 24 hours.',
    category: 'commitment',
    responsibleParty: 'All Parties',
    deadline: '2025-09-16',
    complianceStatus: 'partial',
    complianceScore: 72,
    ambiguityFlags: ['Definition of "defensive positions" not specified', '"Offensive operations" lacks enumeration of prohibited activities'],
    historicalComplianceRate: 65,
  },
  {
    number: 2,
    title: 'Withdrawal of Heavy Weapons',
    text: 'Within 30 days of the ceasefire entering into force, both parties shall withdraw all heavy weapons systems — including artillery above 100mm calibre, multiple-launch rocket systems, and armoured vehicles — to a distance of no less than 25 kilometres from the Line of Contact. Withdrawal routes shall be agreed in advance with the Joint Monitoring Committee and verified by international observers.',
    category: 'obligation',
    responsibleParty: 'Government of Nordalia; EMLF',
    deadline: '2025-10-16',
    complianceStatus: 'non-compliant',
    complianceScore: 38,
    ambiguityFlags: ['No provision for weapons already in transit', 'Unclear whether technical/support vehicles are included'],
    historicalComplianceRate: 42,
  },
  {
    number: 3,
    title: 'Humanitarian Corridor Establishment',
    text: 'The parties shall establish and maintain three humanitarian corridors connecting Kessara, Belara, and the eastern border crossing at Vostok Gate within 14 days. These corridors shall be demilitarised and open for unimpeded passage of humanitarian aid, medical supplies, and civilian movement at all times. UN OCHA shall coordinate logistics and the parties shall provide security guarantees to all humanitarian personnel.',
    category: 'obligation',
    responsibleParty: 'All Parties',
    deadline: '2025-09-29',
    complianceStatus: 'compliant',
    complianceScore: 91,
    ambiguityFlags: [],
    historicalComplianceRate: 78,
  },
  {
    number: 4,
    title: 'Prisoner and Detainee Exchange',
    text: 'Both parties commit to the release and exchange of all prisoners of war and civilian detainees within 60 days under ICRC supervision. The exchange shall proceed on an "all-for-all" basis with medical screening provided by ICRC prior to transfer. Each party shall provide a complete list of detainees within 10 days of this agreement entering into force.',
    category: 'commitment',
    responsibleParty: 'Government of Nordalia; EMLF',
    deadline: '2025-11-14',
    complianceStatus: 'partial',
    complianceScore: 55,
    ambiguityFlags: ['"All-for-all" does not address disputed detainee classifications'],
    historicalComplianceRate: 51,
  },
  {
    number: 5,
    title: 'Cantonment of Forces',
    text: 'Within 45 days, EMLF forces shall report to designated cantonment sites as identified in Annex B for registration, biometric recording, and initial disarmament processing. The Government of Nordalia shall withdraw national army units from a 15-kilometre buffer zone surrounding each cantonment site. Security at cantonment sites shall be provided jointly by a reconstituted local police force and UN peacekeepers.',
    category: 'obligation',
    responsibleParty: 'EMLF; Government of Nordalia',
    deadline: '2025-10-30',
    complianceStatus: 'non-compliant',
    complianceScore: 25,
    ambiguityFlags: ['Annex B cantonment sites not yet formally agreed', 'Composition of "reconstituted local police" undefined'],
    historicalComplianceRate: 35,
  },
  {
    number: 6,
    title: 'Joint Monitoring Committee',
    text: 'A Joint Monitoring Committee (JMC) composed of three representatives from each party and two international co-chairs shall be established within 7 days. The JMC shall meet weekly in a neutral location and maintain a 24-hour hotline for ceasefire violation reports. Decisions of the JMC shall be taken by consensus, with dispute escalation to the AU Mediation Team.',
    category: 'enforcement',
    responsibleParty: 'All Parties',
    deadline: '2025-09-22',
    complianceStatus: 'compliant',
    complianceScore: 88,
    ambiguityFlags: ['Consensus requirement may create deadlock without tie-breaking mechanism'],
    historicalComplianceRate: 72,
  },
  {
    number: 7,
    title: 'Political Dialogue Timeline',
    text: 'The parties commit to commencing formal political dialogue within 90 days of the ceasefire, addressing root causes of the conflict including governance arrangements for the Eastern Marches, revenue-sharing, and security sector reform. An agenda for the first round of talks shall be submitted to the AU Mediation Team within 60 days. Both parties shall designate chief negotiators within 30 days.',
    category: 'condition',
    responsibleParty: 'Government of Nordalia; EMLF',
    deadline: '2025-12-14',
    complianceStatus: 'pending',
    complianceScore: 45,
    ambiguityFlags: ['"Root causes" is open-ended and not enumerated', 'No fallback if agenda cannot be agreed'],
    historicalComplianceRate: 40,
  },
  {
    number: 8,
    title: 'Resource-Sharing Framework',
    text: 'Pending the outcome of political dialogue, an interim resource-sharing arrangement shall govern revenues from coltan, copper, and timber extraction in the Eastern Marches. A 60/40 split favouring the central government shall apply, with 15% of the regional share earmarked for community reconstruction. An independent auditor acceptable to both parties shall be appointed within 45 days.',
    category: 'condition',
    responsibleParty: 'Government of Nordalia; EMLF',
    deadline: '2025-10-30',
    complianceStatus: 'partial',
    complianceScore: 50,
    ambiguityFlags: ['60/40 split basis (gross vs. net revenue) not specified', '"Acceptable to both parties" auditor selection may deadlock'],
    historicalComplianceRate: 38,
  },
  {
    number: 9,
    title: 'Media and Information Provisions',
    text: 'Both parties shall refrain from broadcasting or disseminating content that incites violence, hatred, or undermines the peace process through state-controlled media outlets. An independent media monitoring body shall be established within 30 days to review complaints. Restrictions on press freedom shall not extend to independent journalists covering the peace process.',
    category: 'commitment',
    responsibleParty: 'All Parties',
    deadline: '2025-10-15',
    complianceStatus: 'partial',
    complianceScore: 60,
    ambiguityFlags: ['"Content that undermines the peace process" is subjective', 'Definition of "state-controlled media" may be disputed'],
    historicalComplianceRate: 55,
  },
  {
    number: 10,
    title: 'International Observer Access',
    text: 'The parties shall grant full, unrestricted, and immediate access to all areas under their control for international observers, including UN monitoring teams, ICRC, and accredited human rights investigators. Any denial of access must be justified in writing to the JMC within 48 hours. Systematic denial of access shall constitute a material breach of this agreement.',
    category: 'verification',
    responsibleParty: 'All Parties',
    deadline: null,
    complianceStatus: 'compliant',
    complianceScore: 85,
    ambiguityFlags: [],
    historicalComplianceRate: 70,
  },
  {
    number: 11,
    title: 'Sanctions Review Trigger',
    text: 'Upon verified compliance with Articles 1 through 5 by both parties, the Government of Nordalia shall formally request that the UNSC Sanctions Committee initiate a review of existing sanctions regimes applicable to the conflict. The AU Mediation Team shall submit a compliance certification to the UNSC within 14 days of verification. Partial compliance may trigger a phased sanctions relief process.',
    category: 'enforcement',
    responsibleParty: 'Government of Nordalia; AU Mediation Team',
    deadline: null,
    complianceStatus: 'pending',
    complianceScore: 30,
    ambiguityFlags: ['Threshold for "verified compliance" not quantified', '"Phased sanctions relief" criteria undefined'],
    historicalComplianceRate: 28,
  },
  {
    number: 12,
    title: 'Implementation Timeline and Review',
    text: 'This agreement shall be implemented in three phases: Phase I (Immediate, Days 1-30) covering cessation of hostilities and humanitarian access; Phase II (Consolidation, Days 31-90) covering disarmament and cantonment; Phase III (Transition, Days 91-180) covering political dialogue and institutional reform. A comprehensive review shall be conducted at the end of each phase by the JMC with AU oversight.',
    category: 'verification',
    responsibleParty: 'Joint Monitoring Committee',
    deadline: '2026-03-14',
    complianceStatus: 'partial',
    complianceScore: 62,
    ambiguityFlags: ['Phase transition criteria not specified', 'Consequences of failed phase review not addressed'],
    historicalComplianceRate: 58,
  },
];

export const COMPLIANCE_SUMMARY: ComplianceSummary = {
  overall: 58,
  byParty: {
    'Government of Nordalia': 62,
    'Eastern Marches Liberation Front': 48,
    'Joint Monitoring Committee': 75,
    'AU Mediation Team': 80,
  },
  byCategory: {
    commitment: 62,
    obligation: 51,
    condition: 48,
    enforcement: 59,
    verification: 74,
  },
  ambiguousClauses: 10,
  historicalComparison:
    'Compliance at the 6-month mark (58%) tracks below the historical median of 64% for ceasefire agreements in Sub-Saharan Africa (1990-2024, N=47). Heavy weapons withdrawal and cantonment provisions show the greatest divergence from comparable agreements, while humanitarian corridor compliance exceeds the regional average by 13 percentage points. The pattern most closely resembles the Abyei Protocol (2004), which experienced similar delays in cantonment before eventual implementation at month 14.',
};
