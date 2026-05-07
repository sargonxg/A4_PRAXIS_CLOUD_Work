export interface ReportTemplateSection {
  id: string;
  title: string;
  description: string;
  guidance?: string;
  exampleContent?: string;
  wordTarget?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  category: 'political' | 'humanitarian' | 'security' | 'analytical' | 'diplomatic';
  description: string;
  estimatedLength?: string;
  audience?: string;
  sections: ReportTemplateSection[];
  formatting?: {
    tone: string;
    hedgingLevel: 'high' | 'medium' | 'low';
    attributionStyle: string;
  };
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  // ============================================================
  // 1. SITUATION REPORT (SITREP)
  // ============================================================
  {
    id: 'situation-report',
    name: 'Situation Report (SITREP)',
    category: 'analytical',
    description:
      'Standard situation report for tracking evolving conflict or crisis developments with structured sections for analysis and recommendations.',
    estimatedLength: '3-5 pages',
    audience: 'Senior management, mission leadership, member states',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        description: 'High-level overview of the current situation and key developments.',
        guidance: 'Write a 3-5 sentence summary covering: (1) overall situation assessment, (2) most significant development this period, (3) trajectory — improving/deteriorating/stable, (4) recommended action or key decision point.',
        exampleContent: 'The security situation in the Eastern Provinces remains critically volatile following the resumption of DRM offensive operations near Kessara on 10 March. The ceasefire framework is under severe strain, with UNMN monitoring teams unable to verify frontline positions for 48 hours. Immediate consultations with both parties are required to prevent irreversible collapse of the September 2025 ceasefire.',
        wordTarget: 150,
      },
      {
        id: 'situation-overview',
        title: 'Situation Overview',
        description: 'Detailed assessment of political, security, and humanitarian conditions.',
        guidance: 'Structured in three sub-sections: (a) Political — negotiation status, governance dynamics; (b) Security — frontline situation, ceasefire status, armed group activities; (c) Humanitarian — IDP figures, access constraints, key needs.',
        wordTarget: 400,
      },
      {
        id: 'key-developments',
        title: 'Key Developments',
        description: 'Chronological account of significant events since the last reporting period.',
        guidance: 'List 5-8 key developments in chronological order. Each entry: date, actor(s), event, significance. Focus on events that materially affect the conflict trajectory.',
        wordTarget: 300,
      },
      {
        id: 'stakeholder-analysis',
        title: 'Stakeholder Analysis',
        description: 'Assessment of key actors, their positions, interests, and influence.',
        guidance: 'Focus on actors where position has changed since last report. Note: (1) stated position, (2) inferred interest behind the position, (3) leverage they hold, (4) constraint limiting their options.',
        wordTarget: 250,
      },
      {
        id: 'risk-assessment',
        title: 'Risk Assessment',
        description: 'Identification and evaluation of risks to peace, stability, and humanitarian operations.',
        guidance: 'Identify 3-5 key risks. For each: risk description, likelihood (high/medium/low), potential impact, and early warning indicators to watch. Use traffic light assessment where appropriate.',
        wordTarget: 200,
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        description: 'Proposed actions and policy recommendations based on the analysis.',
        guidance: 'List 3-5 specific, actionable recommendations. Each should be: addressee-specific (who should act), time-bound, and linked to the risk or opportunity identified in the analysis.',
        wordTarget: 200,
      },
    ],
    formatting: {
      tone: 'Analytical and objective. Active voice. No editorial commentary.',
      hedgingLevel: 'medium',
      attributionStyle: 'Source attribution in text where assessments are based on single sources.',
    },
  },

  // ============================================================
  // 2. BRIEFING NOTE
  // ============================================================
  {
    id: 'briefing-note',
    name: 'Briefing Note',
    category: 'political',
    description:
      'Concise briefing document for senior leadership summarizing key issues and providing actionable recommendations.',
    estimatedLength: '2-3 pages',
    audience: 'Senior leadership, ministers, SRSG-level',
    sections: [
      {
        id: 'purpose',
        title: 'Purpose',
        description: "Statement of the briefing's objective and intended audience.",
        guidance: 'One sentence: "This note briefs [audience] on [issue] ahead of [event/decision/meeting] and recommends [key action]."',
        wordTarget: 50,
      },
      {
        id: 'background',
        title: 'Background',
        description: 'Essential context and historical background for the issue.',
        guidance: 'Minimum essential context only — assume the reader knows the conflict but needs the specific issue framed. 3-4 sentences maximum.',
        wordTarget: 150,
      },
      {
        id: 'current-situation',
        title: 'Current Situation',
        description: 'Up-to-date assessment of the present state of affairs.',
        guidance: 'Focus on developments in the last 2-4 weeks. Prioritize facts over analysis. What has changed and why does it matter?',
        wordTarget: 200,
      },
      {
        id: 'options-analysis',
        title: 'Options Analysis',
        description: 'Evaluation of available courses of action with pros and cons.',
        guidance: 'Present 2-3 options (not more). For each: brief description, key advantages, key disadvantages/risks, and resource/time requirements.',
        wordTarget: 200,
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        description: 'Recommended course of action with supporting rationale.',
        guidance: 'Single clear recommendation with brief rationale. Include: the recommended action, the actor who should take it, the timeline, and what success looks like.',
        wordTarget: 100,
      },
    ],
    formatting: {
      tone: 'Crisp and direct. Decision-oriented. No waffle or hedging unless essential.',
      hedgingLevel: 'low',
      attributionStyle: 'No in-text citations. Background sources in annex if needed.',
    },
  },

  // ============================================================
  // 3. CONFLICT ANALYSIS
  // ============================================================
  {
    id: 'conflict-analysis',
    name: 'Conflict Analysis',
    category: 'analytical',
    description:
      'In-depth analysis of conflict dynamics including root causes, drivers, and potential pathways to resolution.',
    estimatedLength: '8-15 pages',
    audience: 'Policy audiences, donors, academic and think-tank contexts',
    sections: [
      {
        id: 'conflict-profile',
        title: 'Conflict Profile',
        description: 'Overview of the conflict including geography, timeline, and key statistics.',
        guidance: 'Include: type of conflict, geographic scope, start date and major phases, current status, estimated casualties/displacement, key actors in 2-3 sentences each.',
        wordTarget: 350,
      },
      {
        id: 'root-causes',
        title: 'Root Causes',
        description: 'Analysis of structural, political, and socio-economic root causes.',
        guidance: 'Distinguish between structural root causes (historical, systemic) and proximate triggers. Use the UNDP root cause categories: political exclusion, economic grievance, social fragmentation, security vacuum.',
        wordTarget: 400,
      },
      {
        id: 'conflict-dynamics',
        title: 'Conflict Dynamics',
        description: 'Assessment of escalation patterns, triggers, and feedback loops.',
        guidance: 'Map the Glasl escalation stage and explain how the conflict has moved through stages. Identify feedback loops: what actions by one actor trigger responses from another that deepen the conflict.',
        wordTarget: 350,
      },
      {
        id: 'actor-mapping',
        title: 'Actor Mapping',
        description: 'Detailed mapping of conflict actors, alliances, and power relations.',
        guidance: 'For each key actor: role, stated vs. unstated interests, leverage they hold and over whom, constraints limiting their options, BATNA. Include a power/interest 2x2 matrix summary.',
        wordTarget: 500,
      },
      {
        id: 'scenarios',
        title: 'Scenarios',
        description: 'Possible future trajectories ranging from best to worst case.',
        guidance: 'Three scenarios: best case (positive trajectory), baseline (continuation of current dynamics), worst case (further escalation). For each: preconditions, likelihood, key indicators, and implications.',
        wordTarget: 400,
      },
      {
        id: 'peacebuilding-entry',
        title: 'Peacebuilding Entry Points',
        description: 'Identified opportunities for intervention and conflict resolution.',
        guidance: 'Identify 3-5 specific entry points: specific actions, by specific actors, within a realistic timeframe, that could shift the conflict trajectory. Link each to an actor\'s interest or constraint identified in the analysis.',
        wordTarget: 300,
      },
    ],
    formatting: {
      tone: 'Analytical and nuanced. Present multiple perspectives fairly. Acknowledge uncertainty.',
      hedgingLevel: 'high',
      attributionStyle: 'Full source citations. Distinguish between documented facts, informed assessments, and speculative analysis.',
    },
  },

  // ============================================================
  // 4. EARLY WARNING ALERT
  // ============================================================
  {
    id: 'early-warning',
    name: 'Early Warning Alert',
    category: 'security',
    description:
      'Rapid alert document flagging emerging threats or escalation indicators requiring immediate attention. 1-page format.',
    estimatedLength: '1 page',
    audience: 'Operations teams, mission leadership, SRSG',
    sections: [
      {
        id: 'alert-summary',
        title: 'Alert Summary',
        description: 'Concise description of the emerging threat or indicator.',
        guidance: 'BLUF (Bottom Line Up Front): 2-3 sentences. Include: what is happening, where, when detected, and the specific risk it poses. Traffic light assessment: RED/AMBER/GREEN.',
        exampleContent: '[RED] DRM offensive elements advancing on Kessara (10 Mar). If Kessara falls, humanitarian access to 14,000 displaced civilians will be severed and the ceasefire framework will collapse irreversibly.',
        wordTarget: 80,
      },
      {
        id: 'indicators',
        title: 'Escalation Indicators',
        description: 'Specific observable indicators that triggered this alert.',
        guidance: 'List 3-5 specific, verified indicators with source and date. Distinguish: confirmed (documented), probable (high confidence assessment), possible (intelligence-based). Avoid vague language.',
        wordTarget: 150,
      },
      {
        id: 'context',
        title: 'Context',
        description: 'Background information necessary to understand the alert.',
        guidance: 'Maximum 3-4 sentences. Essential context only — the reader needs the minimum to understand why this indicator matters.',
        wordTarget: 100,
      },
      {
        id: 'immediate-actions',
        title: 'Recommended Immediate Actions',
        description: 'Urgent steps recommended to mitigate the identified risk.',
        guidance: 'Number 3-5 actions. Each: action verb + specific action + addressee + deadline. Example: "SRSG Santos to convene emergency consultations with DRM political bureau within 12 hours."',
        wordTarget: 120,
      },
    ],
    formatting: {
      tone: 'Urgent. Direct. Unambiguous. No diplomatic hedging on risk severity.',
      hedgingLevel: 'low',
      attributionStyle: 'Source and date for each indicator. Single-source indicators flagged.',
    },
  },

  // ============================================================
  // 5. MISSION REPORT
  // ============================================================
  {
    id: 'mission-report',
    name: 'Mission Report',
    category: 'political',
    description:
      'Post-mission report documenting findings, observations, and recommendations from field visits or diplomatic missions.',
    estimatedLength: '4-6 pages',
    audience: 'Mission leadership, capitals, donors',
    sections: [
      {
        id: 'mission-overview',
        title: 'Mission Overview',
        description: 'Purpose, dates, locations visited, and personnel involved.',
        guidance: 'State: mission purpose in one sentence, date range, locations visited (with security classification if needed), team composition, and the mandate authority for the mission.',
        wordTarget: 100,
      },
      {
        id: 'findings',
        title: 'Key Findings',
        description: 'Principal observations and findings from the field mission.',
        guidance: 'Numbered list of 5-8 key findings. Each finding: what was observed, significance, confidence level (confirmed observation / credible source report / assessment). Organize by theme or location.',
        wordTarget: 400,
      },
      {
        id: 'meetings-consultations',
        title: 'Meetings & Consultations',
        description: 'Summary of meetings held and key points from consultations.',
        guidance: 'For each meeting: who met, date/location, key messages delivered, key messages received, notable quotes (paraphrased, attributed), follow-up commitments. List in chronological order.',
        wordTarget: 400,
      },
      {
        id: 'observations',
        title: 'Field Observations',
        description: 'Direct observations on conditions, challenges, and needs.',
        guidance: 'Describe what was directly observed (not reported). Include: physical conditions, civilian behavior, security environment, infrastructure status, humanitarian situation. First-person observational voice.',
        wordTarget: 300,
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        description: 'Recommendations for follow-up action based on mission findings.',
        guidance: 'Specific, actionable, addressee-specific recommendations linked to findings. Include: recommended action, responsible actor, timeline, resource requirements, and expected outcome.',
        wordTarget: 200,
      },
    ],
    formatting: {
      tone: 'Factual and observational. Clearly distinguish observed facts from reported information from assessments.',
      hedgingLevel: 'medium',
      attributionStyle: 'Attribute quotes to title/role, not name (e.g., "the Minister stated..."). Direct quotes paraphrased.',
    },
  },

  // ============================================================
  // 6. POLICY BRIEF
  // ============================================================
  {
    id: 'policy-brief',
    name: 'Policy Brief',
    category: 'political',
    description:
      'Targeted policy document presenting evidence-based analysis and specific policy recommendations on a focused issue.',
    estimatedLength: '3-5 pages',
    audience: 'Policymakers, government officials, legislators',
    sections: [
      {
        id: 'issue-statement',
        title: 'Issue Statement',
        description: 'Clear articulation of the policy issue being addressed.',
        guidance: 'Define the issue precisely. Include: what the issue is, why it is a policy problem now, who is affected, and what happens if no action is taken. Set up the rest of the brief.',
        wordTarget: 150,
      },
      {
        id: 'evidence-base',
        title: 'Evidence Base',
        description: 'Data, research, and evidence supporting the analysis.',
        guidance: 'Present the key evidence. Prioritize quantitative data (statistics, incident counts, economic figures) over qualitative. Acknowledge uncertainty and contested evidence.',
        wordTarget: 300,
      },
      {
        id: 'policy-options',
        title: 'Policy Options',
        description: 'Range of policy options with comparative assessment.',
        guidance: 'Present 3 options: minimum action, moderate action, maximum action. For each: what it involves, estimated cost/resource requirement, key advantages, key disadvantages, and probability of achieving the objective.',
        wordTarget: 350,
      },
      {
        id: 'recommended-policy',
        title: 'Recommended Policy',
        description: 'Preferred policy option with implementation considerations.',
        guidance: 'State a single recommendation clearly. Justify the choice against the alternatives. Address the most likely objection. Specify: who implements, what resources are needed, what the success metric is.',
        wordTarget: 200,
      },
      {
        id: 'implementation',
        title: 'Implementation Roadmap',
        description: 'Steps, timeline, and resources required for implementation.',
        guidance: 'Phased implementation plan: short (0-30 days), medium (30-90 days), long-term (90+ days). Key milestones, responsible actors, resource requirements, and decision points.',
        wordTarget: 200,
      },
    ],
    formatting: {
      tone: 'Evidence-based and objective. Acknowledge political constraints. Concise policy language.',
      hedgingLevel: 'medium',
      attributionStyle: 'Source citations for all data claims. UN and government reports preferred.',
    },
  },

  // ============================================================
  // 7. OPTIONS PAPER
  // ============================================================
  {
    id: 'options-paper',
    name: 'Options Paper',
    category: 'political',
    description:
      'Structured 3-option analysis paper for senior decision-makers, presenting minimum, moderate, and maximum international response options.',
    estimatedLength: '4-6 pages',
    audience: 'Senior decision-makers, senior diplomatic decision-makers, mission leadership',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        description: 'One-page summary of the issue and the three options.',
        guidance: 'Summarize the decision required, the timeframe, and the three options at a high level. Note the staff-preferred option if applicable.',
        wordTarget: 200,
      },
      {
        id: 'issue-and-context',
        title: 'Issue and Context',
        description: 'Background on the decision environment.',
        guidance: 'Frame the specific decision being addressed. What is the triggering event or deadline? What is at stake if no decision is made? What decisions have already been taken that constrain the options?',
        wordTarget: 200,
      },
      {
        id: 'option-1-minimum',
        title: 'Option A: Minimum Action',
        description: 'Minimum international response — diplomatic engagement without enhanced measures.',
        guidance: 'Describe the option precisely. What changes from the status quo? What does NOT change? Pros: advantages and likelihood of success. Cons: disadvantages and risks. Resource requirements. Legal/mandate basis.',
        wordTarget: 250,
      },
      {
        id: 'option-2-moderate',
        title: 'Option B: Moderate Action',
        description: 'Moderate international response — targeted measures with conditions.',
        guidance: 'As per Option A. This is typically the staff-preferred option. Additional sub-options and variants can be noted here.',
        wordTarget: 300,
      },
      {
        id: 'option-3-maximum',
        title: 'Option C: Maximum Action',
        description: 'Maximum international response — enhanced coercive or interventionary measures.',
        guidance: 'As per Option A and B. Address: legal basis for enhanced action, coalition-building requirements, escalation risks, exit strategy.',
        wordTarget: 250,
      },
      {
        id: 'comparative-assessment',
        title: 'Comparative Assessment',
        description: 'Side-by-side evaluation of all three options.',
        guidance: 'Matrix comparing options across: probability of success, risk of failure, resource cost, political feasibility, implementation timeline, impact on humanitarian situation.',
        wordTarget: 200,
      },
    ],
    formatting: {
      tone: 'Balanced and objective. Present all options fairly even if staff have a preference. Decision-ready format.',
      hedgingLevel: 'medium',
      attributionStyle: 'Source attribution for factual claims. Clearly label assessments vs. established facts.',
    },
  },

  // ============================================================
  // 8. CEASEFIRE MONITORING REPORT
  // ============================================================
  {
    id: 'ceasefire-monitoring',
    name: 'Ceasefire Monitoring Report',
    category: 'security',
    description:
      'Structured violation tracking report for ceasefire/armistice monitoring missions. Based on standard monitoring mission format.',
    estimatedLength: '3-5 pages',
    audience: 'Truce monitoring mission, senior diplomatic forum, parties to the agreement',
    sections: [
      {
        id: 'monitoring-summary',
        title: 'Monitoring Period Summary',
        description: 'Overview of the monitoring period and overall ceasefire status.',
        guidance: 'State: monitoring period, overall assessment (holding/under strain/collapsed), total violations documented, trend vs. prior period, and the most significant single incident.',
        wordTarget: 150,
      },
      {
        id: 'violation-log',
        title: 'Violation Log',
        description: 'Documented violations by date, type, location, and attributed party.',
        guidance: 'Tabular format: date | time | location | violation type | attributed party | confidence | witnesses | response/outcome. Organize by most serious first within each period. Note: "attributed to" not "committed by" — maintain monitoring language.',
        wordTarget: 400,
      },
      {
        id: 'compliance-assessment',
        title: 'Compliance Assessment by Party',
        description: 'Individual assessment of each party\'s compliance with ceasefire obligations.',
        guidance: 'For each party: overall compliance rating (full/partial/non-compliant), violations attributed, explanation of any context or mitigating factors noted by the party, trend over time.',
        wordTarget: 250,
      },
      {
        id: 'access-constraints',
        title: 'Monitoring Access Constraints',
        description: 'Limitations on monitoring capacity and their impact on assessment.',
        guidance: 'Document: areas inaccessible to monitors, instances of denial of access, remote monitoring methods used in lieu of ground observation, and the impact of constraints on assessment reliability.',
        wordTarget: 150,
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        description: 'Recommendations for the parties and the senior diplomatic forum.',
        guidance: 'Specific recommendations to: (a) parties to address specific violations, (b) oversight body on mandate or measures, (c) mission on monitoring methodology adjustments.',
        wordTarget: 150,
      },
    ],
    formatting: {
      tone: 'Factual, impartial, and precise. Use monitoring language ("attributed to", "observed by monitors at"). No inflammatory language.',
      hedgingLevel: 'high',
      attributionStyle: 'Strict source citation for all violations. Confidence levels noted for each incident.',
    },
  },

  // ============================================================
  // 9. HUMAN RIGHTS ASSESSMENT
  // ============================================================
  {
    id: 'human-rights-assessment',
    name: 'Human Rights Assessment',
    category: 'humanitarian',
    description:
      'OHCHR-style human rights situation assessment documenting incidents, patterns, and accountability gaps.',
    estimatedLength: '5-8 pages',
    audience: 'OHCHR, UN Special Rapporteurs, human rights organizations, senior diplomatic forum',
    sections: [
      {
        id: 'hr-overview',
        title: 'Human Rights Situation Overview',
        description: 'Summary of the overall human rights environment.',
        guidance: 'Overall characterization of the HR environment: severe/deteriorating/stable/improving. Main categories of violations. Affected population estimates. Responsible actors.',
        wordTarget: 200,
      },
      {
        id: 'incident-documentation',
        title: 'Incident Documentation',
        description: 'Documented violations with IHL/IHRL basis.',
        guidance: 'For each category: number of incidents documented, description of pattern, individual incident illustrative examples (location, date, victims, perpetrators where established, source, confidence). Reference applicable IHL/IHRL provisions.',
        wordTarget: 500,
      },
      {
        id: 'protection-of-civilians',
        title: 'Protection of Civilians',
        description: 'Specific civilian protection situation.',
        guidance: 'Distinguish: IDP situation, civilian targeting patterns, humanitarian access to affected civilians, sexual violence as weapon of war, child protection, attacks on civilian infrastructure.',
        wordTarget: 300,
      },
      {
        id: 'accountability-gaps',
        title: 'Accountability Gaps',
        description: 'Assessment of accountability mechanisms and their effectiveness.',
        guidance: 'Document: domestic accountability mechanisms and their effectiveness, international accountability mechanisms engaged, obstacles to accountability (command immunity, witness protection, evidence preservation), recommendations for accountability action.',
        wordTarget: 250,
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        description: 'Specific recommendations to states, relevant institutions, and monitoring missions.',
        guidance: 'Addressed to specific bodies (senior diplomatic forum, General Assembly, OHCHR, parties to the conflict). Include: cessation of violations, accountability measures, protection of witnesses and HR defenders, humanitarian access.',
        wordTarget: 200,
      },
    ],
    formatting: {
      tone: 'Precise and evidence-based. Note documentation methodology. Distinguish confirmed violations from credible allegations.',
      hedgingLevel: 'high',
      attributionStyle: 'Full documentation methodology in annex. Individual incidents attributed by standard of evidence: confirmed / credible allegations / unverified.',
    },
  },

  // ============================================================
  // 10. SANCTIONS COMPLIANCE REPORT
  // ============================================================
  {
    id: 'sanctions-compliance',
    name: 'Sanctions Compliance Report',
    category: 'political',
    description:
      'Panel of Experts-style report documenting sanctions evasion, enforcement gaps, and compliance status. Based on multilateral forum Panel of Experts methodology.',
    estimatedLength: '6-10 pages',
    audience: 'multilateral forum Sanctions Committee, member states, enforcement authorities',
    sections: [
      {
        id: 'regime-overview',
        title: 'Sanctions Regime Overview',
        description: 'Summary of applicable sanctions measures and legal basis.',
        guidance: 'Cite the applicable multilateral forum Resolution(s) precisely. List all sanctions measures in effect (arms embargo, targeted financial sanctions, travel bans, other). Note the Committee structure and Panel mandate.',
        wordTarget: 150,
      },
      {
        id: 'compliance-assessment',
        title: 'Overall Compliance Assessment',
        description: 'Assessment of compliance by member states and parties.',
        guidance: 'For each measure: overall compliance level (high/medium/low), primary compliance concerns, actors of concern, member state enforcement record. Note: Panel cannot determine state responsibility — report evidence and pattern.',
        wordTarget: 250,
      },
      {
        id: 'violation-documentation',
        title: 'Documented Violation Incidents',
        description: 'Specific incidents of sanctions violation with evidence.',
        guidance: 'For each incident: date, description, parties involved, evidence (documentary, financial, intelligence), chain of custody, Panel assessment of credibility. Follow PoE evidentiary standards: documentary evidence preferred over witness testimony.',
        wordTarget: 500,
      },
      {
        id: 'evasion-networks',
        title: 'Evasion Networks and Methods',
        description: 'Analysis of sanctions evasion methods and networks.',
        guidance: 'Map the evasion network: intermediaries, financial channels, shipping routes, documentation fraud methods. Identify gaps in current enforcement that enable evasion.',
        wordTarget: 300,
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        description: 'Recommendations to the Committee and member states.',
        guidance: 'Specific recommendations: designations (with supporting evidence meeting Committee standards), enforcement actions, member state technical assistance needs, mandate adjustments.',
        wordTarget: 200,
      },
    ],
    formatting: {
      tone: 'Legal and evidentiary. Panel of Experts standard: conclusions must be supported by documented evidence. No speculation without evidence base.',
      hedgingLevel: 'high',
      attributionStyle: 'Strict evidentiary standards. Primary source documentation preferred. Annex structure: evidence referenced in text.',
    },
  },

  // ============================================================
  // 11. DDR ASSESSMENT
  // ============================================================
  {
    id: 'ddr-assessment',
    name: 'DDR Assessment',
    category: 'security',
    description:
      'Disarmament, Demobilization, and Reintegration progress assessment following UN DDR Reference Manual framework.',
    estimatedLength: '5-8 pages',
    audience: 'DDR program managers, senior diplomatic forum, donors, implementing partners',
    sections: [
      {
        id: 'ddr-overview',
        title: 'DDR Program Overview',
        description: 'Summary of the DDR program mandate, scope, and implementation status.',
        guidance: 'State: legal basis (peace agreement / multilateral forum mandate), program components, target caseload, implementing partners, funding status, overall implementation rate.',
        wordTarget: 200,
      },
      {
        id: 'disarmament-status',
        title: 'Disarmament Status',
        description: 'Assessment of weapons collection and verification.',
        guidance: 'Weapons collected by type and quantity vs. estimate. Geographic coverage vs. mandate area. Verification methodology and gaps. Concerns about parallel weapon retention. Spoilers to disarmament.',
        wordTarget: 250,
      },
      {
        id: 'demobilization-status',
        title: 'Demobilization Status',
        description: 'Assessment of combatant processing and separation from armed forces.',
        guidance: 'Numbers demobilized vs. target. Cantonment capacity and conditions. Vulnerable group participation (women, children, disabled). Compliance of all armed groups with process. Payment/incentive delivery status.',
        wordTarget: 250,
      },
      {
        id: 'reintegration-status',
        title: 'Reintegration Status',
        description: 'Assessment of economic and social reintegration outcomes.',
        guidance: 'Reintegration pathways taken (livelihoods, education, security forces). Employment/livelihood outcomes at 6 and 12 months. Community acceptance indicators. Recidivism rates where trackable. Remaining population in process.',
        wordTarget: 300,
      },
      {
        id: 'obstacles-recommendations',
        title: 'Obstacles and Recommendations',
        description: 'Key obstacles to DDR completion and recommended remedial actions.',
        guidance: 'For each obstacle: description, actors responsible for resolution, recommended action, and timeline. Distinguish: political obstacles (requiring high-level engagement) vs. operational obstacles (programmatic solutions).',
        wordTarget: 200,
      },
    ],
    formatting: {
      tone: 'Technical and programmatic. Reference UN DDR Reference Manual standards. Quantitative data where available.',
      hedgingLevel: 'medium',
      attributionStyle: 'Program data attributed to implementing agencies. Community assessments attributed to field surveys.',
    },
  },

  // ============================================================
  // 12. CONFLICT ANALYSIS FRAMEWORK (UNDP)
  // ============================================================
  {
    id: 'undp-conflict-analysis',
    name: 'Conflict Analysis Framework',
    category: 'analytical',
    description:
      'UNDP-style root cause, trigger, and driver analysis for programming and peacebuilding entry point identification.',
    estimatedLength: '6-10 pages',
    audience: 'UNDP program officers, peacebuilding practitioners, development donors',
    sections: [
      {
        id: 'conflict-context',
        title: 'Conflict Context',
        description: 'Historical and geographic context of the conflict.',
        guidance: 'Brief historical narrative leading to the current conflict. Focus on context that is directly relevant to programming, not exhaustive history.',
        wordTarget: 250,
      },
      {
        id: 'root-causes',
        title: 'Root Causes',
        description: 'Structural factors that create conditions for conflict.',
        guidance: 'Use UNDP root cause categories: (1) Exclusionary political systems, (2) Economic inequality and grievance, (3) Social fragmentation and discrimination, (4) Security vacuums and weak rule of law, (5) External interference. Each cause: description, evidence, how it links to the conflict.',
        wordTarget: 400,
      },
      {
        id: 'triggers',
        title: 'Triggers',
        description: 'Specific events or actions that sparked or accelerated the conflict.',
        guidance: 'List and analyze the main triggers. Distinguish between the proximate trigger (immediate spark) and enabling conditions (what made the trigger effective). Note: triggers are symptoms, not causes.',
        wordTarget: 200,
      },
      {
        id: 'conflict-drivers',
        title: 'Conflict Drivers',
        description: 'Ongoing factors that perpetuate and sustain the conflict.',
        guidance: 'What keeps the conflict going? Include: war economy factors (who benefits economically?), spoiler interests, narrative and identity dynamics, external interference, institutional failure. This is distinct from root causes — it is about what sustains the conflict today.',
        wordTarget: 350,
      },
      {
        id: 'resilience-capacities',
        title: 'Peace Capacities and Resilience',
        description: 'Existing capacities for peace and conflict prevention.',
        guidance: 'Identify: local peace mechanisms, inter-community relationships that have survived the conflict, institutions with legitimacy across divides, civil society organizations with peacebuilding roles, connectors (shared interests, identity, economic links).',
        wordTarget: 250,
      },
      {
        id: 'programming-implications',
        title: 'Programming Implications',
        description: 'Implications for UNDP/peacebuilding program design.',
        guidance: 'For each root cause / driver: what programming approaches address it, what existing programs already address it, gaps in current programming, entry points for new interventions. Do-no-harm assessment.',
        wordTarget: 300,
      },
    ],
    formatting: {
      tone: 'Analytical and development-oriented. Avoid security framing. Focus on structural factors amenable to programmatic intervention.',
      hedgingLevel: 'high',
      attributionStyle: 'Academic and development source citation style.',
    },
  },

  // ============================================================
  // 13. STAKEHOLDER MAPPING BRIEF
  // ============================================================
  {
    id: 'stakeholder-mapping',
    name: 'Stakeholder Mapping Brief',
    category: 'analytical',
    description:
      'Actor-centric analysis mapping the power and interest landscape for a specific conflict or issue.',
    estimatedLength: '4-6 pages',
    audience: 'Mediators, program officers, diplomatic missions',
    sections: [
      {
        id: 'stakeholder-overview',
        title: 'Stakeholder Landscape Overview',
        description: 'Summary map of the key actor ecosystem.',
        guidance: 'Characterize the stakeholder environment: number and type of key actors, main cleavages (political, ethnic, economic, geographic), coalition patterns, and the dynamics that shape actor behavior.',
        wordTarget: 200,
      },
      {
        id: 'actor-profiles',
        title: 'Actor Profiles',
        description: 'Individual profiles for each key actor.',
        guidance: 'For each actor: (1) Identity and role, (2) Stated position, (3) Underlying interests (stated, unstated, inferred), (4) BATNA, (5) Leverage they hold over others, (6) Constraints limiting their options, (7) Internal divisions / spoiler risk, (8) Relationship to process — supporter / neutral / spoiler.',
        wordTarget: 600,
      },
      {
        id: 'power-interest-matrix',
        title: 'Power/Interest Matrix',
        description: 'Two-by-two analysis of actor power and interest in the outcome.',
        guidance: 'Categorize actors: (HIGH power/HIGH interest): manage closely, (HIGH power/LOW interest): keep satisfied, (LOW power/HIGH interest): keep informed, (LOW power/LOW interest): monitor. Note: power and interest in what specific outcome?',
        wordTarget: 200,
      },
      {
        id: 'coalitions-alliances',
        title: 'Coalitions and Alliances',
        description: 'Mapping of current and potential actor coalitions.',
        guidance: 'Identify existing coalitions and the interests that bind them. Identify potential coalitions that could be built to support or oppose specific outcomes. Note: coalitions for a process are different from coalitions for an outcome.',
        wordTarget: 200,
      },
      {
        id: 'engagement-strategy',
        title: 'Engagement Strategy',
        description: 'Recommended engagement approaches for key actors.',
        guidance: 'For each actor or actor group: recommended engagement approach (direct engagement, back channel, third party), key messages, incentives to engage, potential obstacles, and sequencing considerations.',
        wordTarget: 250,
      },
    ],
    formatting: {
      tone: 'Analytical and strategic. Present interests not just positions. Avoid personal characterizations.',
      hedgingLevel: 'medium',
      attributionStyle: 'Distinguish publicly stated positions from analytical assessments of interests.',
    },
  },

  // ============================================================
  // 14. PEACE PROCESS STATUS UPDATE
  // ============================================================
  {
    id: 'peace-process-update',
    name: 'Peace Process Status Update',
    category: 'diplomatic',
    description:
      'Periodic update on peace process status, tracking commitments against implementation, spoiler dynamics, and key milestones.',
    estimatedLength: '3-5 pages',
    audience: 'Guarantors, facilitators, donors, senior diplomatic forum',
    sections: [
      {
        id: 'process-status',
        title: 'Process Status',
        description: 'Overall assessment of the peace process health.',
        guidance: 'Traffic light assessment (ON TRACK / AT RISK / STALLED / COLLAPSED) with brief rationale. Note the most significant positive development and most significant negative development since last update.',
        wordTarget: 150,
      },
      {
        id: 'commitment-tracker',
        title: 'Commitment Implementation Tracker',
        description: 'Status of commitments made by each party.',
        guidance: 'Tabular format: commitment | party responsible | deadline | status (fulfilled/on track/delayed/violated) | notes. Cover: ceasefire commitments, humanitarian commitments, political process commitments, confidence-building measure commitments.',
        wordTarget: 350,
      },
      {
        id: 'spoiler-analysis',
        title: 'Spoiler Dynamics',
        description: 'Assessment of actors seeking to derail the process.',
        guidance: 'For each spoiler: who, what they are doing to undermine the process, their motivation (what they lose from peace), leverage over them, and recommended countermeasures.',
        wordTarget: 200,
      },
      {
        id: 'next-milestones',
        title: 'Next Key Milestones',
        description: 'Critical upcoming events and decision points in the process.',
        guidance: 'List upcoming milestones with dates. For each: what needs to happen, which parties need to act, risk if the milestone is missed, and what preparatory steps are required now.',
        wordTarget: 200,
      },
      {
        id: 'support-needs',
        title: 'International Support Needs',
        description: 'What international support is needed and from whom.',
        guidance: 'Specific asks: political (statements, pressure), financial (funding gaps for process support), technical (capacity needed), and security (protection arrangements). Addressed to specific actors.',
        wordTarget: 150,
      },
    ],
    formatting: {
      tone: 'Process-focused and solutions-oriented. Maintain confidence in the process where possible. Be frank about risks.',
      hedgingLevel: 'medium',
      attributionStyle: 'Commitment tracker based on documented agreements. Attribution for violations conservative.',
    },
  },

  // ============================================================
  // 15. EXECUTIVE SUMMARY / DECISION MEMO
  // ============================================================
  {
    id: 'executive-summary',
    name: 'Executive Summary / Decision Memo',
    category: 'political',
    description:
      '1-page decision memo for senior leadership. Maximum information density with minimum reading time. Designed for SRSG, Minister, or senior diplomatic leadership level.',
    estimatedLength: '1 page',
    audience: 'SRSG, ministers, senior diplomatic decision-makers, heads of state',
    sections: [
      {
        id: 'situation',
        title: 'Situation',
        description: 'Where things stand — current status in 2-3 sentences.',
        guidance: 'Three sentences maximum. Focus on what has changed since the last memo, not background.',
        wordTarget: 60,
      },
      {
        id: 'key-issue',
        title: 'Key Issue / Decision Required',
        description: 'The specific decision or action required from the reader.',
        guidance: 'One sentence: "You are asked to decide whether to [action] in response to [situation] by [deadline]."',
        wordTarget: 40,
      },
      {
        id: 'options-summary',
        title: 'Options and Staff Recommendation',
        description: 'Options summary with a clear staff recommendation.',
        guidance: 'Three bullet options maximum. Bold the recommended option. For each: option in 5 words, key advantage, key risk. This is not a full options analysis — see attached for detail.',
        wordTarget: 120,
      },
      {
        id: 'implications',
        title: 'If No Action / If Delayed',
        description: 'Consequences of inaction or delay.',
        guidance: 'One sentence on the consequence of no decision or delayed decision. This creates urgency for the reader.',
        wordTarget: 40,
      },
    ],
    formatting: {
      tone: 'Extremely concise. Decision-ready. No background the reader already knows. Lead with the ask.',
      hedgingLevel: 'low',
      attributionStyle: 'No footnotes on the memo itself. Detailed support material in attached annexes.',
    },
  },
];

// ============================================================
// Helper functions
// ============================================================

export function getTemplateById(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: ReportTemplate['category']
): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.category === category);
}

export const TEMPLATE_CATEGORIES: ReportTemplate['category'][] = [
  'political',
  'humanitarian',
  'security',
  'analytical',
  'diplomatic',
];
