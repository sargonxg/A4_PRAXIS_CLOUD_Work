// ============================================================================
// PRAXIS Analytical Frameworks — v4.0
// Complete reference constants for all frameworks used across the platform.
// Used by: tool "About" panels, AI prompt grounding, sidebar tooltips.
// ============================================================================

// ── Glasl 9-Stage Escalation Model ─────────────────────────────────────────

export const GLASL_ESCALATION_MODEL = {
  name: "Glasl's 9-Stage Escalation Model",
  citation:
    "Glasl, F. (1982). 'The Process of Conflict Escalation and Roles of Third Parties.' In G. B. J. Bomers & R. B. Peterson (Eds.), Conflict Management and Industrial Relations. Kluwer-Nijhoff.",
  description:
    "A diagnostic model that maps conflict intensification across 9 stages organized into three zones of increasing destructiveness. Each stage describes the logic, behavioural patterns, and appropriate interventions for conflict at that level of intensity.",
  zones: [
    {
      name: 'Win-Win',
      stages: [1, 2, 3],
      color: '#22c55e',
      description:
        'Parties can still achieve mutual gains. Dialogue and compromise are possible. Third-party facilitation is helpful but not always necessary.',
    },
    {
      name: 'Win-Lose',
      stages: [4, 5, 6],
      color: '#f59e0b',
      description:
        'Zero-sum dynamics dominate. Face-saving and reputation management become critical. Mediation or arbitration by a respected third party is required.',
    },
    {
      name: 'Lose-Lose',
      stages: [7, 8, 9],
      color: '#ef4444',
      description:
        'Destructive logic prevails. Mutual harm is accepted or even desired. Power-based intervention, separation, or coercive peace may be necessary.',
    },
  ],
  stages: [
    {
      stage: 1,
      name: 'Hardening',
      description:
        'Positions crystallize around specific issues. Occasional friction occurs but parties remain willing to cooperate. Each side becomes aware of incompatibilities.',
      indicators: [
        'Positions stated more firmly',
        'Occasional verbal clashes',
        'Cooperation still possible',
        'Goodwill largely intact',
      ],
      interventions: ['Facilitation', 'Problem-solving workshops', 'Communication training', 'Conflict coaching'],
    },
    {
      stage: 2,
      name: 'Debate & Polemic',
      description:
        'Verbal confrontation intensifies. Parties develop strategies to "win" the argument. Black-and-white thinking emerges. Distrust of the other\'s motives grows.',
      indicators: [
        'Strategic argumentation rather than genuine dialogue',
        'Attempts to pressure or outwit the other',
        'Formation of factions within organizations',
        'Increased stereotyping',
      ],
      interventions: ['Process consultation', 'Moderation', 'Joint fact-finding', 'Common ground dialogue'],
    },
    {
      stage: 3,
      name: 'Actions Not Words',
      description:
        'Talk gives way to unilateral action. Fait accompli tactics emerge. Empathy declines sharply. Communication becomes purely instrumental.',
      indicators: [
        'Unilateral actions to create facts',
        'Communication breakdown',
        'Misinterpretation increases',
        'Non-verbal signals replace dialogue',
      ],
      interventions: ['Mediation', 'Track II dialogue', 'Confidence-building measures (CBMs)'],
    },
    {
      stage: 4,
      name: 'Images & Coalitions',
      description:
        'Enemy images solidify. Allies are actively recruited. Propaganda escalates. The issue shifts from substance to reputation and identity.',
      indicators: [
        'Active coalition building',
        'Propaganda and narrative warfare',
        'Dehumanising enemy images',
        'Issue framing shifts to identity',
      ],
      interventions: [
        'Mediation with shuttle diplomacy',
        'Coalition management',
        'Narrative intervention',
        'International engagement',
      ],
    },
    {
      stage: 5,
      name: 'Loss of Face',
      description:
        'Public attacks on the opponent\'s identity and legitimacy. Moral disqualification of the other. Reputation management becomes paramount.',
      indicators: [
        'Personal and institutional attacks',
        'Moral delegitimization',
        'Isolation attempts',
        'Demand for accountability before talks',
      ],
      interventions: [
        'Arbitration',
        'International pressure',
        'Face-saving mechanisms',
        'Back-channel diplomacy',
      ],
    },
    {
      stage: 6,
      name: 'Strategies of Threats',
      description:
        'Ultimatums and coercive threats. Deterrence logic dominates. Escalation spirals as threats demand counter-threats.',
      indicators: [
        'Ultimatums with deadlines',
        'Military mobilization or show of force',
        'Sanctions threats',
        'Deadline pressure',
      ],
      interventions: [
        'Power mediation',
        'Security guarantees',
        'Sanctions and incentives package',
        'Crisis hotlines',
      ],
    },
    {
      stage: 7,
      name: 'Limited Destructive Blows',
      description:
        'Violence used instrumentally with calculated limits. Opponent is dehumanized enough for harm to feel justified. Damage is seen as an "acceptable cost."',
      indicators: [
        'Targeted attacks on combatants and infrastructure',
        'Dehumanization in official communications',
        'Calculated violence with plausible deniability',
      ],
      interventions: [
        'Ceasefire negotiation',
        'Peacekeeping deployment',
        'Humanitarian access negotiations',
      ],
    },
    {
      stage: 8,
      name: 'Fragmentation',
      description:
        'Systematic destruction of opponent capacity. Total-war logic applied to a limited theater. Population displacement and infrastructure targeting.',
      indicators: [
        'Deliberate infrastructure targeting',
        'Mass population displacement',
        'Scorched-earth tactics',
        'International human rights documentation',
      ],
      interventions: [
        'Enforcement action authorization (UNSC)',
        'Humanitarian corridors',
        'War crimes documentation and referral',
      ],
    },
    {
      stage: 9,
      name: 'Together into the Abyss',
      description:
        'Mutual destruction is accepted. No return without major external intervention. Self-sacrificial logic prevails. Existential framing dominates.',
      indicators: [
        'Self-destructive behaviour',
        'Mutual annihilation accepted',
        'Existential framing in all communications',
      ],
      interventions: [
        'Forcible separation',
        'Imposed ceasefire with enforcement',
        'Long-term reconstruction and transitional justice',
      ],
    },
  ],
} as const;

// ── Fisher-Ury Principled Negotiation ──────────────────────────────────────

export const FISHER_URY_FRAMEWORK = {
  name: 'Fisher-Ury Principled Negotiation',
  citation:
    'Fisher, R., Ury, W., & Patton, B. (1981, rev. 1991). Getting to Yes: Negotiating Agreement Without Giving In. Penguin Books.',
  description:
    'A negotiation methodology developed at the Harvard Program on Negotiation (PON) that focuses on mutual interests rather than rigid positions, objective criteria, and BATNA management.',
  principles: [
    {
      name: 'Separate People from the Problem',
      description:
        'Address relationship and emotional issues independently from substantive interests. Treat your counterpart as a partner in problem-solving, not as an adversary.',
    },
    {
      name: 'Focus on Interests, Not Positions',
      description:
        'Explore underlying needs, concerns, fears, and desires rather than stated demands. The same interest can often be satisfied by multiple different positions.',
    },
    {
      name: 'Invent Options for Mutual Gain',
      description:
        'Generate creative alternatives before deciding. Separate inventing from deciding. Expand the pie before dividing it.',
    },
    {
      name: 'Insist on Objective Criteria',
      description:
        'Use fair standards, legal precedent, market value, scientific findings, expert opinion, or professional norms as the basis for agreement rather than pressure.',
    },
  ],
  concepts: {
    BATNA: 'Best Alternative to a Negotiated Agreement — the course of action a party will take if negotiations fail. Knowing your BATNA determines your negotiating power.',
    ZOPA: 'Zone of Possible Agreement — the range between parties\' reservation points where a deal is possible. If BATNAs are better than any achievable deal, the ZOPA does not exist.',
    reservationPoint: 'The worst deal a party will accept before walking away. Equivalent to the value of their BATNA.',
    aspirationPoint: 'The best deal a party reasonably hopes to achieve. Sets the opening anchor.',
    interests: 'Underlying needs, desires, concerns, and fears that motivate positions. Multiple positions may satisfy the same interest.',
  },
} as const;

// ── INFORM Risk Index ────────────────────────────────────────────────────────

export const INFORM_RISK_INDEX = {
  name: 'INFORM Risk Index',
  citation:
    'Inter-Agency Standing Committee (IASC) / European Commission Joint Research Centre. INFORM Risk Index. https://drmkc.jrc.ec.europa.eu/inform-index',
  description:
    'A composite indicator for measuring risk of humanitarian crises and disasters that would overwhelm national response capacity and require international assistance. Used by OCHA, ECHO, and humanitarian planners for early warning and resource allocation.',
  formula: 'INFORM = (Hazard & Exposure)^(1/3) × (Vulnerability)^(1/3) × (Lack of Coping Capacity)^(1/3)',
  scale: '0–10, where 10 = highest humanitarian crisis risk',
  dimensions: [
    {
      name: 'Hazard & Exposure',
      weight: 0.33,
      description:
        'The probability of a hazardous event occurring (natural or human-caused) combined with the human exposure to that hazard.',
      subdimensions: [
        'Natural hazards: earthquakes, floods, droughts, cyclones',
        'Human-caused hazards: conflict intensity (UCDP), political instability (GDELT), food insecurity',
      ],
    },
    {
      name: 'Vulnerability',
      weight: 0.33,
      description:
        'The conditions of the affected population that make them susceptible to harm — socio-economic fragility and vulnerable groups.',
      subdimensions: [
        'Socio-economic vulnerability: HDI, GDP per capita, inequality (Gini)',
        'Vulnerable groups: refugees, IDPs, under-5 mortality, food insecurity prevalence',
      ],
    },
    {
      name: 'Lack of Coping Capacity',
      weight: 0.33,
      description:
        'The ability of a government and community to manage disaster risk through available resources and processes.',
      subdimensions: [
        'Institutional capacity: governance effectiveness, rule of law, anti-corruption',
        'Infrastructure: healthcare access, road density, communication infrastructure',
      ],
    },
  ],
} as const;

// ── Barnett & Duvall Power Taxonomy ─────────────────────────────────────────

export const BARNETT_DUVALL_POWER = {
  name: "Barnett & Duvall's Taxonomy of Power in International Politics",
  citation:
    "Barnett, M. & Duvall, R. (2005). 'Power in International Politics.' International Organization, 59(1), 39–75.",
  description:
    "A four-dimensional taxonomy of power that goes beyond material capabilities to include structural and discursive forms. Essential for analyzing why powerful states do not always get what they want in conflict settings.",
  faces: [
    {
      name: 'Compulsory',
      type: 'direct/interactional',
      description:
        'The direct control of one actor over the conditions of action and possibility of another through direct coercion, threats, or rewards.',
      examples: ['Military strikes or mobilization', 'Economic sanctions (OFAC, EU)', 'Aid conditionality', 'Diplomatic isolation'],
    },
    {
      name: 'Institutional',
      type: 'diffuse/interactional',
      description:
        'Indirect control mediated by formal and informal institutions — the rules of the game shape who can act, how, and with what consequences.',
      examples: ['UNSC veto power', 'WTO dispute settlement', 'IMF conditionality', 'Treaty provisions and reservations'],
    },
    {
      name: 'Structural',
      type: 'direct/constitutive',
      description:
        "Power constituted through the social positions actors occupy in hierarchically organized structures — core/periphery, creditor/debtor, supplier/consumer.",
      examples: ['Trade dependency ratios', 'Energy supply chains', 'Debt-to-GDP vulnerability', 'Remittance dependency'],
    },
    {
      name: 'Productive',
      type: 'diffuse/constitutive',
      description:
        'Power that works through the production of subjects and objects of knowledge, through discourse, norms, and categories that make certain actions thinkable and others unthinkable.',
      examples: ['Defining who is a "legitimate" actor', 'Setting humanitarian norms (R2P)', 'Framing conflicts as "terrorism" vs. "resistance"', 'Epistemic authority of international organizations'],
    },
  ],
} as const;

// ── Zartman Ripeness Theory ───────────────────────────────────────────────

export const ZARTMAN_RIPENESS = {
  name: "Zartman's Ripeness Theory",
  citation:
    "Zartman, I. W. (1985). Ripe for Resolution: Conflict and Intervention in Africa. Oxford University Press. Updated in Zartman, I. W. (2000). 'Ripeness: The Hurting Stalemate and Beyond.' In P. Stern & D. Druckman (Eds.), International Conflict Resolution After the Cold War.",
  description:
    "A theory that explains when conflicts are most amenable to negotiated settlement. Two key conditions — a mutually hurting stalemate (MHS) and a perceived way out (WO) — together create a 'ripe moment' for conflict resolution.",
  conditions: [
    {
      name: 'Mutually Hurting Stalemate (MHS)',
      description:
        "Each party recognizes that it cannot win outright and that continued conflict is more costly than resolution. The pain must be mutual — unilateral pain produces surrender, not negotiation. MHS is often catalyzed by a 'plateau': a stable deadlock where neither side sees a path to victory.",
      indicators: [
        'Declining military effectiveness on both sides',
        'Economic exhaustion indicators',
        'Elite defections or public war-weariness',
        'Backchannel contacts initiated by both sides',
      ],
    },
    {
      name: 'Perceived Way Out (WO)',
      description:
        "Parties must see a negotiated solution as both available and preferable to continued conflict. The way out may be a specific formula (territorial partition, power-sharing), a process (UN mediation, regional mechanism), or a guarantor (external security guarantees).",
      indicators: [
        'Mediator proposals received without rejection',
        'Public statements signaling flexibility on key issues',
        'Acceptance of third-party monitoring proposals',
        'Reference to comparable precedent settlements',
      ],
    },
  ],
  limitations:
    'Ripeness is a necessary but not sufficient condition for successful negotiation. Spoilers, incomplete MHS (one party still sees a military option), and poor agreement design can prevent resolution even when conditions are ripe. Ripeness must be seized — it is perishable.',
} as const;

// ── Stedman Spoiler Theory ────────────────────────────────────────────────

export const STEDMAN_SPOILER_THEORY = {
  name: 'Stedman Spoiler Management Theory',
  citation:
    "Stedman, S. J. (1997). 'Spoiler Problems in Peace Processes.' International Security, 22(2), 5–53.",
  description:
    'A framework for identifying and managing actors who use violence to undermine peace processes because they believe peace threatens their power, worldview, or interests.',
  spoilerTypes: [
    {
      type: 'Total Spoiler',
      description:
        'Pursues unlimited goals and sees the peace process as existential threat. Will not be satisfied with any deal that preserves the opposing party. Must be defeated or marginalized.',
      managementStrategy: 'Coercion, military action, exclusion from process',
      examples: ['Genocidal factions', 'maximalist religious extremists', 'warlords whose power depends entirely on conflict'],
    },
    {
      type: 'Limited Spoiler',
      description:
        "Has specific, bounded goals that, if met, would allow them to support or accept the peace process. Responds to a 'hurting' strategy that raises the cost of spoiling combined with inducements.",
      managementStrategy: 'Combination of inducements, socialization, and targeted pressure',
      examples: ['Factions excluded from power-sharing formula', 'groups with specific territorial claims'],
    },
    {
      type: 'Greedy Spoiler',
      description:
        'Goals expand or contract depending on the strength of the implementation force and the inducements offered. Opportunistic — will spoil if costs are low, comply if costs are high.',
      managementStrategy: 'Robust implementation mandate, credible enforcement, targeted inducements',
      examples: ['Warlords with economic interests in continued conflict', 'opportunistic militia commanders'],
    },
  ],
  implementationStrategies: ['Inducement', 'Socialization', 'Coercion', 'Withdrawal of consent'],
} as const;

// ── Mitchell-Agle-Wood Stakeholder Theory ──────────────────────────────────

export const MITCHELL_AGLE_WOOD = {
  name: 'Mitchell-Agle-Wood Stakeholder Salience Theory',
  citation:
    "Mitchell, R. K., Agle, B. R., & Wood, D. J. (1997). 'Toward a Theory of Stakeholder Identification and Salience: Defining the Principle of Who and What Really Counts.' Academy of Management Review, 22(4), 853–886.",
  description:
    "A theory for identifying and prioritizing stakeholders based on three attributes: Power (ability to impose will), Legitimacy (socially accepted authority), and Urgency (time-sensitive claims). Combinations of these three attributes create seven stakeholder types.",
  attributes: [
    {
      name: 'Power',
      description: 'The ability to impose one\'s will on others through coercive, normative, or utilitarian means.',
    },
    {
      name: 'Legitimacy',
      description: 'A generalized perception that the actor\'s actions are desirable, proper, or appropriate within accepted social norms or values.',
    },
    {
      name: 'Urgency',
      description: 'The degree to which stakeholder claims call for immediate attention — combining time sensitivity and criticality.',
    },
  ],
  stakeholderTypes: [
    { type: 'Dormant', attributes: ['Power'], salience: 'Low', description: 'Has power but lacks legitimacy and urgency. Potential threat if legitimacy is acquired.' },
    { type: 'Discretionary', attributes: ['Legitimacy'], salience: 'Low', description: 'Legitimate but lacks power and urgency. May receive charitable attention but not prioritized.' },
    { type: 'Demanding', attributes: ['Urgency'], salience: 'Low', description: 'Urgent claims but lacks power and legitimacy. "Mosquito" stakeholder — annoying but not dangerous.' },
    { type: 'Dominant', attributes: ['Power', 'Legitimacy'], salience: 'Moderate', description: 'Influential and recognized. Has formal mechanisms for engagement. Expects to be consulted.' },
    { type: 'Dangerous', attributes: ['Power', 'Urgency'], salience: 'Moderate', description: 'May resort to coercive action. Potentially violent. Monitor closely.' },
    { type: 'Dependent', attributes: ['Legitimacy', 'Urgency'], salience: 'Moderate', description: 'Relies on others to carry out its will. Often allied with more powerful actors.' },
    { type: 'Definitive', attributes: ['Power', 'Legitimacy', 'Urgency'], salience: 'High', description: 'All three attributes. Must be engaged as a priority. Core party in any peace process.' },
  ],
} as const;

// ── OCHA Humanitarian Principles ─────────────────────────────────────────

export const OCHA_HUMANITARIAN_PRINCIPLES = {
  name: 'Humanitarian Principles (UNOCHA)',
  citation:
    'UN General Assembly Resolutions 46/182 (1991) and 58/114 (2004). OCHA, "OCHA on Message: Humanitarian Principles" (2012).',
  description:
    'Four core principles that guide humanitarian action, protect the independence of humanitarian actors, and ensure access to affected populations.',
  principles: [
    {
      name: 'Humanity',
      description: 'Human suffering must be addressed wherever it is found. The purpose of humanitarian action is to protect life and health and to ensure respect for human beings.',
    },
    {
      name: 'Neutrality',
      description: 'Humanitarian actors must not take sides in hostilities or engage in controversies of a political, racial, religious or ideological nature.',
    },
    {
      name: 'Impartiality',
      description: 'Humanitarian action must be carried out on the sole basis of need, giving priority to the most urgent cases of distress and making no distinctions on the basis of nationality, race, gender, religious belief, class or political opinion.',
    },
    {
      name: 'Independence',
      description: 'Humanitarian action must be autonomous from the political, economic, military or other objectives that any actor may hold with regard to the areas where humanitarian action is being implemented.',
    },
  ],
} as const;

// ── IPC Food Security Phases ─────────────────────────────────────────────

export const IPC_FOOD_SECURITY_PHASES = {
  name: 'Integrated Food Security Phase Classification (IPC)',
  citation:
    'Integrated Food Security Phase Classification (IPC) Global Partners (2021). IPC Technical Manual Version 3.1. Rome: FAO.',
  description:
    'A five-phase scale for classifying the severity and magnitude of acute food insecurity. Used by OCHA, WFP, FAO, and NGOs for resource allocation and early warning.',
  scale: '1–5, where 5 = Famine/Humanitarian Catastrophe',
  phases: [
    { phase: 1, name: 'None/Minimal', color: '#80cc28', description: 'Households able to meet essential food and non-food needs.' },
    { phase: 2, name: 'Stressed', color: '#f3c609', description: 'At least one in five households faces minimally adequate food consumption but is unable to afford non-food essentials.' },
    { phase: 3, name: 'Crisis', color: '#e7730a', description: 'At least one in five households faces food consumption gaps with high or above usual acute malnutrition OR is marginally able to meet minimum food needs only by depleting essential livelihood assets.' },
    { phase: 4, name: 'Emergency', color: '#c60a00', description: 'At least one in five households has extreme food consumption gaps with very high acute malnutrition and excess mortality. Immediate action required to save lives.' },
    { phase: 5, name: 'Famine/Catastrophe', color: '#640000', description: 'At least one in five households faces extreme food deprivation with starvation, death, destitution, and extremely critical acute malnutrition levels.' },
  ],
} as const;

// ── Lederach Peacebuilding Pyramid ──────────────────────────────────────

export const LEDERACH_PEACEBUILDING_PYRAMID = {
  name: "Lederach's Peacebuilding Pyramid",
  citation:
    "Lederach, J. P. (1997). Building Peace: Sustainable Reconciliation in Divided Societies. United States Institute of Peace Press.",
  description:
    "A three-tier model of peacebuilding actors that identifies the different roles and capacities for peacebuilding at different levels of society. Each tier requires distinct engagement strategies.",
  tiers: [
    {
      tier: 1,
      name: 'Top-Level Leadership',
      actors: 'Government officials, military commanders, top rebel leaders, heads of international organizations',
      focus: 'Formal negotiations, ceasefire agreements, framework agreements',
      approach: 'High-level negotiations, often shuttle diplomacy or direct talks under international auspices',
      limitations: 'Highly visible, constrained by domestic constituencies, vulnerable to spoilers',
    },
    {
      tier: 2,
      name: 'Middle-Range Leadership',
      actors: 'Religious leaders, academic institutions, NGOs, business sector, ethnic/community leaders',
      focus: 'Problem-solving workshops, training, peace commissions, dialogue facilitation',
      approach: 'Track II diplomacy, people-to-people dialogue, capacity building',
      limitations: 'Less politically visible, can build constituency for peace but lack formal authority',
    },
    {
      tier: 3,
      name: 'Grassroots Leadership',
      actors: 'Local leaders, community organizations, women\'s groups, youth, displaced populations',
      focus: 'Local reconciliation, trauma healing, inter-community dialogue',
      approach: 'Grassroots mobilization, local peace mechanisms, social healing',
      limitations: 'Most directly affected by conflict, often excluded from formal processes',
    },
  ],
  coreInsight:
    'Sustainable peace requires transformation at all three levels. Elite agreements without grassroots reconciliation produce fragile peace. Bottom-up reconciliation without elite agreements leaves communities vulnerable to renewed violence.',
} as const;

// ── Galtung Conflict Triangle ──────────────────────────────────────────

export const GALTUNG_CONFLICT_TRIANGLE = {
  name: "Galtung's Conflict Triangle (ABC Model)",
  citation:
    "Galtung, J. (1969). 'Violence, Peace, and Peace Research.' Journal of Peace Research, 6(3), 167–191. Galtung, J. (1996). Peace by Peaceful Means. SAGE/PRIO.",
  description:
    "A model for diagnosing conflicts across three interconnected dimensions: Attitudes, Behaviour, and Contradiction. Sustainable resolution requires addressing all three dimensions simultaneously.",
  dimensions: [
    {
      name: 'Attitudes',
      description: 'The subjective, psychological dimension: perceptions, emotions, misperceptions, stereotypes, dehumanization, and fears that parties hold about each other and the conflict.',
      interventions: ['Dialogue and reconciliation', 'Narrative change', 'Trauma healing', 'Education for peace'],
    },
    {
      name: 'Behaviour',
      description: 'The observable actions of parties: threats, coercion, violence, ceasefire violations, or cooperative gestures. The most visible dimension but not necessarily the root cause.',
      interventions: ['Ceasefire agreements', 'Disarmament', 'Peacekeeping', 'Confidence-building measures'],
    },
    {
      name: 'Contradiction',
      description: 'The objective, structural dimension: the incompatibility of goals, interests, and needs that lies at the root of the conflict. Often involves structural violence (inequality, exclusion, discrimination).',
      interventions: ['Political reform', 'Power-sharing agreements', 'Resource redistribution', 'Transitional justice'],
    },
  ],
  violenceTypes: [
    { name: 'Direct Violence', description: 'Physical harm inflicted by an identifiable actor on another. Tip of the iceberg.' },
    { name: 'Structural Violence', description: 'Harm embedded in social structures: poverty, inequality, political exclusion, discrimination. No single perpetrator.' },
    { name: 'Cultural Violence', description: 'Aspects of culture (religion, ideology, language, art) used to legitimize direct or structural violence.' },
  ],
} as const;

// ── UN DPPA Morning Brief Format ─────────────────────────────────────────

export const UN_DPPA_BRIEF_FORMAT = {
  name: 'UN DPPA Situation Report Format',
  citation:
    'United Nations Department of Political and Peacebuilding Affairs (DPPA). Operational Guidance Note: Situation Reports and Political Analysis.',
  description:
    'The standard format used by UN Political Affairs Officers for daily and weekly political situation reports on conflict-affected areas.',
  sections: [
    { name: 'Situation Overview', content: 'Key developments in past 24–72 hours (3–5 bullet points maximum). Most critical facts first.' },
    { name: 'Political Track', content: 'Peace process status, negotiations, diplomatic contacts, UNSC activity, electoral developments.' },
    { name: 'Security Situation', content: 'Armed incidents (UCDP source), displacement, ceasefire compliance, force postures.' },
    { name: 'Humanitarian', content: 'IPC phase, displacement figures (UNHCR), funding gaps (OCHA FTS), access constraints.' },
    { name: 'Human Rights', content: 'Protection incidents, OHCHR alerts, accountability developments, SGBV.' },
    { name: 'International Response', content: 'UNSC resolutions, regional organization actions, bilateral demarches, sanctions.' },
    { name: 'Outlook', content: '3–5 day forecast. Risk flags. Recommended actions for senior management.' },
  ],
  languageStandards: [
    'British English spelling (Organisation, not Organization)',
    'UN canonical entity names (Türkiye, not Turkey; Democratic Republic of the Congo in full)',
    'Passive voice for sensitive attributions ("Reports indicate..." not "Government sources say...")',
    'Conditional phrasing for unverified information ("Reportedly," "According to...")',
    'Avoid loaded terms: use "armed group" not "terrorist" unless UNSC-designated; "conflict" not "war" unless legally declared',
  ],
} as const;

// ── Berghof Mediation Process Framework ──────────────────────────────────

export const BERGHOF_MEDIATION_FRAMEWORK = {
  name: 'Berghof Mediation Process Framework',
  citation:
    'Berghof Foundation (2012). Berghof Glossary on Conflict Transformation. Berlin: Berghof Foundation Operations GmbH. Wehr, P. & Lederach, J. P. (1991). "Mediating Conflict in Central America." Journal of Peace Research, 28(1).',
  description:
    'A comprehensive framework for designing and managing peace mediation processes from initial contact through implementation.',
  phases: [
    {
      phase: 'Pre-Negotiation',
      description: 'Ripeness assessment, trust-building, process design, ground rules, confidence-building measures (CBMs). Mediator accreditation with all parties.',
      keyActivities: ['MHS assessment (Zartman)', 'Stakeholder mapping', 'Shuttle diplomacy', 'Back-channel contacts', 'Preliminary agenda setting'],
    },
    {
      phase: 'Proximity Talks',
      description: 'Separate conversations with each party to develop minimum consensus on process design. Parties do not meet directly.',
      keyActivities: ['BATNA assessment for each party', 'Interest mapping', 'Process design consultation', 'Ground rules drafting'],
    },
    {
      phase: 'Substantive Negotiations',
      description: 'Direct or mediated negotiations on core issues. Issue decomposition, sequencing (easy issues first), and option generation.',
      keyActivities: ['Issue bundling and sequencing', 'Joint fact-finding', 'Option development', 'Draft framework agreement'],
    },
    {
      phase: 'Agreement Drafting',
      description: 'Legal drafting of agreement text. Implementation sequencing, monitoring mechanisms, guarantor roles, spoiler management provisions.',
      keyActivities: ['Legal review (Vienna Convention)', 'Implementation roadmap', 'Verification mechanism design', 'International guarantors'],
    },
    {
      phase: 'Implementation',
      description: 'DDR (Disarmament, Demobilization, Reintegration), SSR (Security Sector Reform), transitional justice, power-sharing operationalization.',
      keyActivities: ['DDR/SSR sequencing', 'Transitional justice (TRC, ICC)', 'Electoral support', 'International monitoring'],
    },
    {
      phase: 'Consolidation',
      description: 'Long-term peacebuilding, reconciliation, and development. Spoiler management, relapse prevention.',
      keyActivities: ['Grassroots reconciliation (Lederach)', 'Economic reconstruction', 'Constitution-building', 'Regional integration'],
    },
  ],
} as const;

// ── Putnam Two-Level Games ────────────────────────────────────────────────

export const PUTNAM_TWO_LEVEL_GAMES = {
  name: "Putnam's Two-Level Games Theory",
  citation:
    "Putnam, R. D. (1988). 'Diplomacy and Domestic Politics: The Logic of Two-Level Games.' International Organization, 42(3), 427–460.",
  description:
    "A theory explaining how international negotiations are simultaneously games at two levels: the international table (where diplomats bargain with foreign counterparts) and domestic politics (where governments must ratify agreements with their domestic constituencies). The interaction between these two levels shapes negotiation outcomes.",
  keyConceptsAndConcepts: [
    {
      name: 'Win-Set',
      description: 'The set of all possible Level I agreements that would be ratified at Level II. Larger win-sets make agreement more likely but reduce bargaining power.',
    },
    {
      name: 'Level I',
      description: 'The international negotiation — bargaining between national governments or armed parties at the table.',
    },
    {
      name: 'Level II',
      description: 'The domestic ratification process — securing approval from domestic constituents, legislature, party bases, military, or armed group rank-and-file.',
    },
    {
      name: 'Involuntary Defection',
      description: 'When a negotiator agrees to a deal they cannot deliver domestically. Understanding win-sets prevents this failure mode.',
    },
    {
      name: 'Synergistic Issue Linkage',
      description: 'Linking issues across levels in ways that expand domestic win-sets — offering domestic benefits (jobs, security) in exchange for international concessions.',
    },
  ],
} as const;

// ── Fearon Rationalist War Causes ─────────────────────────────────────────

export const FEARON_RATIONALIST_WAR = {
  name: "Fearon's Rationalist Explanations for War",
  citation:
    "Fearon, J. D. (1995). 'Rationalist Explanations for War.' International Organization, 49(3), 379–414.",
  description:
    "An influential model explaining why rational states (or parties) start wars that are ex-post inefficient, given war's costs. Three mechanisms explain the rationalist puzzle: information asymmetry, commitment problems, and issue indivisibility.",
  mechanisms: [
    {
      name: 'Information Asymmetry',
      description: "Parties have private information about their capabilities and resolve that they have incentives to misrepresent. War reveals information that negotiation cannot, because threats and demands are cheap talk. Solution: information revelation mechanisms (monitoring, transparency measures, international verification).",
    },
    {
      name: 'Commitment Problems',
      description: "Even when parties could reach a deal, they cannot credibly commit to it if the expected shift in power gives one side an incentive to attack later. Arms control, security guarantees, and third-party enforcement address commitment problems.",
    },
    {
      name: 'Issue Indivisibility',
      description: "Some issues (holy cities, ethnic homelands, symbolic capitals) cannot be divided without losing their value to both sides. Rare but intractable. Alternative: convert indivisible issues into divisible ones through creative deal design (access rights, time-sharing, symbolic gestures).",
    },
  ],
  implications: 'Peace negotiations must address whichever mechanism is driving conflict. Confidence-building measures address information asymmetry; security guarantees and enforcement address commitment problems; creative deal design addresses indivisibility.',
} as const;

// ── Master Export ────────────────────────────────────────────────────────

export const ALL_FRAMEWORKS = {
  glaslEscalation: GLASL_ESCALATION_MODEL,
  fisherUry: FISHER_URY_FRAMEWORK,
  informRisk: INFORM_RISK_INDEX,
  barnettDuvall: BARNETT_DUVALL_POWER,
  zartmanRipeness: ZARTMAN_RIPENESS,
  stedmanSpoiler: STEDMAN_SPOILER_THEORY,
  mitchellAgleWood: MITCHELL_AGLE_WOOD,
  ochaHumanitarian: OCHA_HUMANITARIAN_PRINCIPLES,
  ipcFoodSecurity: IPC_FOOD_SECURITY_PHASES,
  lederachPyramid: LEDERACH_PEACEBUILDING_PYRAMID,
  galtungTriangle: GALTUNG_CONFLICT_TRIANGLE,
  unDppaBrief: UN_DPPA_BRIEF_FORMAT,
  berghofMediation: BERGHOF_MEDIATION_FRAMEWORK,
  putnamTwoLevel: PUTNAM_TWO_LEVEL_GAMES,
  fearonRationalist: FEARON_RATIONALIST_WAR,
} as const;

export type FrameworkKey = keyof typeof ALL_FRAMEWORKS;
