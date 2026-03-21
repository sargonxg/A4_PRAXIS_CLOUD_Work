// Conflict Dossier Generator — Templates and Demo Content

export interface DossierType {
  id: string;
  name: string;
  description: string;
  defaultSections: string[];
}

export interface DossierSection {
  id: string;
  name: string;
  icon: string;
  estimatedTime: string;
}

export interface GenerationStep {
  message: string;
  duration: number;
  source: 'ARGUS' | 'PRAXIS' | 'CONCORDIA' | 'DIALECTICA';
}

export const DOSSIER_TYPES: DossierType[] = [
  {
    id: 'full',
    name: 'Full Intelligence Dossier',
    description: 'Comprehensive analysis covering all dimensions of the conflict — actors, dynamics, risks, and recommendations.',
    defaultSections: ['exec-summary', 'conflict-timeline', 'actor-profiles', 'power-dynamics', 'escalation-assessment', 'interest-mapping', 'batna-zopa', 'media-landscape', 'sanctions-overview', 'risk-scenarios', 'recommended-actions', 'appendices'],
  },
  {
    id: 'brief',
    name: 'Quick Situation Brief',
    description: 'Concise 4-page brief suitable for senior leadership and time-sensitive decision-making.',
    defaultSections: ['exec-summary', 'conflict-timeline', 'actor-profiles', 'recommended-actions'],
  },
  {
    id: 'negotiation',
    name: 'Negotiation Preparation Package',
    description: 'Targeted analysis of actor interests, leverage, and negotiation space for mediation teams.',
    defaultSections: ['exec-summary', 'actor-profiles', 'power-dynamics', 'interest-mapping', 'batna-zopa', 'recommended-actions'],
  },
  {
    id: 'stakeholder',
    name: 'Stakeholder Power Map',
    description: 'Deep analysis of actor relationships, influence networks, and power asymmetries.',
    defaultSections: ['exec-summary', 'actor-profiles', 'power-dynamics', 'interest-mapping'],
  },
  {
    id: 'risk',
    name: 'Risk Assessment Matrix',
    description: 'Forward-looking risk analysis with scenario modeling and probability assessments.',
    defaultSections: ['exec-summary', 'escalation-assessment', 'risk-scenarios', 'recommended-actions'],
  },
  {
    id: 'historical',
    name: 'Historical Parallel Analysis',
    description: 'Comparative analysis drawing lessons from analogous conflicts and peace processes.',
    defaultSections: ['exec-summary', 'conflict-timeline', 'escalation-assessment', 'appendices'],
  },
];

export const DOSSIER_SECTIONS: DossierSection[] = [
  { id: 'exec-summary', name: 'Executive Summary', icon: 'FileText', estimatedTime: '~15 sec' },
  { id: 'conflict-timeline', name: 'Conflict Timeline', icon: 'Clock', estimatedTime: '~12 sec' },
  { id: 'actor-profiles', name: 'Actor Profiles', icon: 'Users', estimatedTime: '~18 sec' },
  { id: 'power-dynamics', name: 'Power Dynamics Analysis', icon: 'GitBranch', estimatedTime: '~14 sec' },
  { id: 'escalation-assessment', name: 'Escalation Assessment (Glasl)', icon: 'TrendingUp', estimatedTime: '~10 sec' },
  { id: 'interest-mapping', name: 'Interest Mapping (Fisher-Ury)', icon: 'Target', estimatedTime: '~12 sec' },
  { id: 'batna-zopa', name: 'BATNA/ZOPA Analysis', icon: 'Scale', estimatedTime: '~10 sec' },
  { id: 'media-landscape', name: 'Media Landscape', icon: 'Globe', estimatedTime: '~8 sec' },
  { id: 'sanctions-overview', name: 'Sanctions Overview', icon: 'Shield', estimatedTime: '~8 sec' },
  { id: 'risk-scenarios', name: 'Risk Scenarios', icon: 'AlertTriangle', estimatedTime: '~14 sec' },
  { id: 'recommended-actions', name: 'Recommended Actions', icon: 'Lightbulb', estimatedTime: '~10 sec' },
  { id: 'appendices', name: 'Appendices', icon: 'Archive', estimatedTime: '~6 sec' },
];

export const GENERATION_STEPS: GenerationStep[] = [
  { message: 'Querying ARGUS knowledge graph...', duration: 1200, source: 'ARGUS' },
  { message: 'Analyzing 847 entities across 12,400 relationships...', duration: 1500, source: 'ARGUS' },
  { message: 'Running Glasl escalation assessment...', duration: 1000, source: 'PRAXIS' },
  { message: 'Mapping Fisher-Ury interest positions...', duration: 1000, source: 'PRAXIS' },
  { message: 'Cross-referencing historical parallels...', duration: 800, source: 'ARGUS' },
  { message: 'Generating executive summary...', duration: 1200, source: 'PRAXIS' },
  { message: 'Applying Conflict Grammar ontology...', duration: 800, source: 'DIALECTICA' },
  { message: 'Compiling dossier...', duration: 500, source: 'PRAXIS' },
];

export const DEMO_DOSSIER_CONTENT: Record<string, string> = {
  'exec-summary': `The Nordalia Crisis represents a complex intrastate armed conflict with significant regional dimensions, currently assessed at Glasl Stage 6 ("Threats") with an escalating trajectory. The conflict principally involves the Government of the Republic of Nordalia, led by President Elara Mabara, and the Eastern Marches Liberation Front (EMLF) under Commander Berhanu Teshome. Since the breakdown of the September 2025 ceasefire, approximately 340,000 persons have been displaced, with 78,000 seeking refuge across the Merovian border.

The conflict's escalation dynamics are driven by three interlocking factors: (1) the Patriotic Front faction led by General Korvac, which opposes territorial concessions and controls three key border garrisons; (2) the EMLF splinter group "Eastern Dawn Brigade," which rejects ceasefire terms and maintains an estimated 800 fighters outside the command structure; and (3) cross-border arms trafficking via Merovia that sustains both spoiler factions. The March 2025 ceasefire's cantonment provisions are only 15% implemented, while the humanitarian corridor remains operational but severely restricted.

International engagement through AUNM (authorized strength: 8,500) provides limited monitoring capacity. UNSC Resolution 2847 extended the mission mandate but stopped short of Chapter VII enforcement provisions. The African Union and UN Special Envoy maintain parallel mediation tracks, though coordination gaps persist. This dossier assesses the probability of ceasefire collapse at 73% within 90 days absent significant intervention, while identifying three potential de-escalation pathways.`,

  'conflict-timeline': `The Nordalia conflict evolved through distinct phases over 30 months. The crisis originated in January 2024 when the Eastern Marches Regional Assembly passed a unilateral autonomy declaration, triggering the deployment of Nordalia Armed Forces to the regional capital of Marchville. The EMLF, which had maintained a political wing since 2019, mobilized its armed faction in response.

Phase I (January–August 2024): Escalation from political crisis to armed confrontation. Key events include the Marchville Garrison Incident (March 2024), which resulted in 47 civilian casualties and prompted international condemnation; the EMLF's capture of the Eastport border crossing (May 2024); and the initial AU-brokered ceasefire (August 2024), which collapsed within six weeks due to verification failures.

Phase II (September 2024–September 2025): Intensification and international response. The conflict expanded to include cross-border dimensions as Merovia provided covert support to both factions. The UN Security Council adopted Resolution 2847 authorizing AUNM deployment. The September 2025 ceasefire was brokered under combined AU-UN mediation.

Phase III (October 2025–Present): Fragile ceasefire with declining compliance. The March 2025 agreement established three sub-commitments: prisoner exchange (62% complete), humanitarian corridor (operational but restricted), and cantonment of forces (stalled at 15%). Government compliance peaks during UNSC review periods. The Eastern Dawn Brigade's emergence as a spoiler faction has fundamentally complicated implementation prospects.`,

  'actor-profiles': `Government of Nordalia: Led by President Elara Mabara (in office since 2021), the government commands the Nordalia Armed Forces (~45,000 active personnel) and controls the formal security apparatus. Internal tensions exist between the moderate executive branch, which has authorized negotiations, and the military establishment, where General Korvac's Patriotic Front faction opposes territorial concessions. The government's negotiating position emphasizes security-first sequencing — demanding verifiable disarmament before governance discussions.

Eastern Marches Liberation Front (EMLF): Under Commander Berhanu Teshome, the EMLF maintains approximately 12,000 fighters with effective control over 40% of the Eastern Marches territory. The movement combines ethno-nationalist liberation ideology with legitimate grievances regarding political marginalization and economic underdevelopment. Internal cohesion is strained by the Eastern Dawn Brigade splinter group (~800 fighters) led by former EMLF commander Ato Kebede, which rejects ceasefire terms.

African Union Mission in Nordalia (AUNM): Authorized at 8,500 military personnel, currently deployed at 6,200. Mandated to monitor ceasefire compliance, protect civilians, and support the peace process. Effectiveness constrained by capability gaps, particularly in air surveillance and rapid response.

Regional Actors: Merovia provides covert support to hardliner factions through arms trafficking networks. The Federation of Kasara has offered to host negotiations. The Marchian Heritage Foundation, a diaspora organization, channels financial resources to EMLF-aligned groups.`,

  'power-dynamics': `The power structure in the Nordalia conflict exhibits a classic asymmetric configuration with significant spoiler dynamics. The Government of Nordalia holds conventional military superiority, international legal standing, and control of formal economic levers (customs revenue, international borrowing, natural resource concessions). However, its power is constrained by internal fragmentation — General Korvac's Patriotic Front faction controls three strategic border garrisons and has demonstrated willingness to act independently of presidential authority.

The EMLF compensates for conventional military inferiority through territorial control, popular legitimacy in the Eastern Marches, and asymmetric capabilities including knowledge of terrain and community-based intelligence networks. Its leverage is enhanced by international sympathy for the Marchian self-determination narrative and diaspora funding networks.

The critical power dynamic is the "double spoiler" problem: hardliner factions on both sides (Patriotic Front within the government, Eastern Dawn Brigade within the EMLF) possess sufficient capability to undermine any agreement reached by moderate leaderships. This creates a negotiation paradox where the parties at the table cannot guarantee implementation of commitments they make.

AUNM's leverage is primarily normative and symbolic — its presence signals international attention but its operational capacity is insufficient for enforcement. The most significant external leverage lies with international donors who condition humanitarian and development assistance on compliance.`,

  'escalation-assessment': `Applying Friedrich Glasl's nine-stage escalation model, the Nordalia conflict is currently assessed at Stage 6 ("Threats") with indicators of potential progression to Stage 7 ("Destructive Blows"). This assessment is based on the following indicators:

Stage 5 characteristics (established): Loss of face dynamics between government and EMLF leadership have become entrenched. Public rhetoric has shifted from policy disagreements to personal attacks. Both sides have mobilized identity-based narratives that frame compromise as betrayal.

Stage 6 characteristics (current): The Eastern Dawn Brigade's cross-border raid on 15 February 2026 represents a qualitative shift toward threat-based interaction. Government forces' subsequent closure of three humanitarian corridors was explicitly framed as punitive action. Communication between parties has deteriorated to shuttle diplomacy only.

Stage 7 risk indicators: Military movements suggest preparation for offensive operations in the northern corridor. Intelligence reporting indicates arms stockpiling by both the Patriotic Front and Eastern Dawn Brigade. Media narratives on both sides increasingly frame the conflict in existential terms.

The Glasl model predicts that without intervention, the conflict will likely transition to Stage 7 within 60-90 days, at which point destructive actions become primary strategy and conflict resolution becomes exponentially more difficult. The critical intervention window is narrowing.`,

  'interest-mapping': `Applying the Fisher-Ury framework of principled negotiation, we map the underlying interests beneath stated positions for all principal parties:

Government of Nordalia — Stated position: "Security first, disarmament before governance." Underlying interests: (1) Territorial integrity and national sovereignty (existential), (2) Domestic political survival for President Mabara's administration (critical), (3) Restoration of state authority in Eastern Marches (important), (4) Prevention of precedent for other regional separatist movements (important), (5) Economic recovery and international investment (significant).

EMLF — Stated position: "Governance framework before disarmament." Underlying interests: (1) Physical security for combatants and communities (existential), (2) Political representation and self-governance (critical), (3) Cultural recognition and language rights (important), (4) Economic development and resource equity (important), (5) Accountability for past human rights violations (significant).

Overlapping interests identified: Both parties share interests in (a) civilian protection and humanitarian access, (b) economic development of the Eastern Marches, (c) marginalization of spoiler factions that threaten both leaderships, and (d) international legitimacy. These shared interests provide the foundation for a zone of possible agreement centered on a parallel-track approach.`,

  'batna-zopa': `Best Alternative to Negotiated Agreement (BATNA) analysis reveals significant asymmetry that paradoxically favors compromise:

Government BATNA: Military reconquest of Eastern Marches. Assessment: Feasible within 6-12 months but at enormous cost — estimated 15,000-25,000 casualties, international sanctions escalation, economic collapse, and long-term insurgency risk. BATNA quality: Poor.

EMLF BATNA: Continuation of armed struggle with territorial consolidation. Assessment: Sustainable for 2-3 years given diaspora funding and Merovian support, but cannot achieve stated political objectives through military means alone. Risks progressive fragmentation and loss of international sympathy. BATNA quality: Poor to Moderate.

Zone of Possible Agreement (ZOPA): Analysis identifies a viable ZOPA centered on a phased autonomy framework: (1) Enhanced regional self-governance within a unitary state framework (addresses both sovereignty and self-determination interests), (2) Parallel security-governance implementation with international verification (resolves sequencing deadlock), (3) Joint economic development authority with international donor support (creates mutual incentives), (4) Transitional security arrangements integrating EMLF fighters into reformed security forces.

The ZOPA is narrowing as hardliner factions on both sides raise the perceived cost of compromise. Fisher-Ury's principle of "expanding the pie" through economic development commitments and international guarantees remains the most promising approach to maintaining negotiation viability.`,

  'media-landscape': `The media ecosystem surrounding the Nordalia conflict exhibits three dominant narrative clusters with increasing divergence. State-aligned outlets (Nordalia Broadcasting Corporation, The National Standard, 5 regional radio stations) maintain a "National Unity" narrative emphasizing territorial integrity and framing the EMLF as terrorist/separatist insurgents. This narrative reaches approximately 60% of the Nordalia population and shapes the government's domestic political constraints.

EMLF-aligned and Eastern Marches media (Marches Daily, Radio Liberte, social media networks) promote a "Liberation Discourse" framing the conflict as a struggle for ethnic Marchian self-determination against state oppression. This narrative is amplified by the Marchian diaspora, reaching an estimated 2 million people globally through social media.

International media coverage has shifted from a "two-sides" framing to an increasingly humanitarian crisis frame, driven by OCHA reporting and high-profile displacement statistics. This narrative is strategically valuable for the EMLF, as it generates international pressure on the government while avoiding engagement with the armed struggle dimensions of the conflict.

A 47% narrative divergence gap exists between state and international media coverage of Eastern Marches events, creating significant perception disparities that complicate mediation. Cross-pollination between the Liberation Discourse and humanitarian framing is accelerating.`,

  'sanctions-overview': `Current sanctions architecture affecting the Nordalia conflict includes:

UNSC Sanctions Regime: Resolution 2847 established a targeted sanctions framework including asset freezes and travel bans on 12 designated individuals (6 government-affiliated, 4 EMLF-affiliated, 2 arms trafficking facilitators). The UN Panel of Experts (Report S/2025/412) documented violations by both parties and recommended expanded designations.

Regional Sanctions: The AU Peace and Security Council has authorized targeted measures against spoiler factions, though enforcement remains inconsistent. ECOWAS has maintained observer status without independent sanctions action.

Arms Embargo: A comprehensive arms embargo was established under Resolution 2847, though the Panel of Experts documented significant violations including cross-border transfers via Merovia. Estimated 3,400 small arms and light weapons have entered the conflict zone since the embargo was imposed.

Sanctions Review Triggers: Under the ceasefire agreement, sanctions review is triggered by verified compliance with cantonment provisions. Current compliance at 15% is well below the 60% threshold required for sanctions relief. The next UNSC review is scheduled for April 2026.

Financial Flows: FATF assessment identified the Marchian Heritage Foundation as a significant conduit for diaspora funding to EMLF-aligned groups, with an estimated $12-15 million annually passing through opaque financial channels.`,

  'risk-scenarios': `Scenario 1 — Ceasefire Collapse (Probability: 45%): Triggered by Eastern Dawn Brigade provocation or Patriotic Front unilateral military action. Sequence: major incident → government declares ceasefire void → military offensive in northern corridor → EMLF full mobilization → humanitarian crisis escalation. Impact: 50,000+ additional displacements, AUNM withdrawal to defensive positions, international sanctions escalation. Timeline: 30-60 days.

Scenario 2 — Managed De-escalation (Probability: 25%): Requires successful Track II dialogue feeding into Track I negotiations. Sequence: civil society statement → humanitarian corridor expansion → prisoner exchange completion → cantonment acceleration → formal negotiations resume. Impact: Gradual stabilization, donor conference, phased autonomy discussions. Timeline: 90-180 days.

Scenario 3 — Frozen Conflict (Probability: 20%): Neither full collapse nor resolution. Ceasefire technically holds but with minimal compliance. Eastern Marches becomes de facto divided territory. International attention shifts. Impact: Protracted humanitarian crisis, generation of displacement, spoiler factions consolidate. Timeline: 6-24 months.

Scenario 4 — Spoiler Cascade (Probability: 10%): Simultaneous actions by Patriotic Front and Eastern Dawn Brigade destabilize both party leaderships. Sequence: military coup attempt or EMLF fragmentation → loss of command authority → uncoordinated violence → regional spillover via Merovia. Impact: Catastrophic escalation, potential regional conflict. Timeline: Unpredictable.`,

  'recommended-actions': `Immediate Actions (0-30 days):

1. Emergency Track II Dialogue: Convene influential civil society figures from both sides under Chatham House rules. Priority: establish informal communication channel and develop joint humanitarian statement. Lead: Dr. Amara Osei (Nordalia University) and Prof. Demetrios Kastani (Marchville Institute).

2. Spoiler Containment: Coordinate with Merovian authorities to disrupt arms trafficking routes supplying both the Patriotic Front and Eastern Dawn Brigade. Request UNSC designation of additional individuals facilitating cross-border arms flows.

3. Humanitarian Corridor Expansion: Negotiate incremental expansion of humanitarian access as a confidence-building measure. Frame as technical humanitarian arrangement rather than political concession.

Medium-term Actions (30-90 days):

4. Parallel-Track Negotiation Framework: Propose simultaneous security and governance tracks with AUNM verification. Neither side required to move first. Use Mozambique RENAMO integration and Northern Ireland GFA as reference models.

5. Economic Incentive Package: Prepare international donors conference for Eastern Marches Development Fund ($200M initial capitalization). Make funding contingent on implementation milestones.

6. Targeted Sanctions Action: Recommend expanded UNSC designations against identified spoiler actors. Simultaneously, define clear compliance benchmarks for sanctions relief.

Strategic Priority: The window for diplomatic intervention is narrowing. The transition from Glasl Stage 6 to Stage 7 would fundamentally alter the conflict dynamics and dramatically reduce the probability of negotiated settlement. Action within the next 60 days is critical.`,

  'appendices': `Appendix A — Key Documents Referenced: UNSC Resolution 2847 (2025); Nordalia Ceasefire Agreement (September 2025), Annexes I-IV; AUNM Situation Reports #38-#47; UN Panel of Experts Report S/2025/412; OCHA Situation Reports (Oct 2025-Mar 2026); ICG Briefing "Nordalia at the Crossroads" (February 2026); FATF Nordalia Financial Flows Assessment (January 2026).

Appendix B — Methodology: This dossier was compiled using PRAXIS Conflict Grammar (ACO v2.0) ontological framework, ARGUS knowledge graph analysis (847 entities, 12,400 relationships), Glasl nine-stage escalation model assessment, Fisher-Ury principled negotiation framework for interest mapping, and historical parallel analysis engine (referencing 340+ post-Cold War conflict cases). Confidence scores reflect the convergence of multiple analytical methods and source triangulation.

Appendix C — Source Assessment: Primary sources include AUNM field reporting (reliability: high), UN Panel of Experts documentation (reliability: high), TACITUS media monitoring (47 outlets, reliability: moderate-high), civil society interlocutor reporting (reliability: moderate), and open-source intelligence (reliability: variable). All assessments are current as of the dossier generation date.

Appendix D — Acronyms: AUNM (African Union Mission in Nordalia), BATNA (Best Alternative to Negotiated Agreement), EMLF (Eastern Marches Liberation Front), ZOPA (Zone of Possible Agreement), ACO (Analytical Conflict Ontology), DDR (Disarmament, Demobilization, and Reintegration).`,
};
