// CONCORDIA by TACITUS — AI-Assisted Mediation Guidance Demo Data

export interface MediationFramework {
  id: string;
  name: string;
  shortDescription: string;
  bestFor: string;
  keySteps: string[];
}

export interface SessionPlan {
  title: string;
  framework: string;
  caseName: string;
  estimatedDuration: string;
  phases: {
    name: string;
    duration: string;
    objectives: string[];
    mediatorNotes: string;
  }[];
  keyQuestions: string[];
  riskFactors: string[];
}

export interface MediationTurn {
  speaker: 'mediator' | 'party_a' | 'party_b' | 'system';
  name: string;
  text: string;
}

export interface SettlementClause {
  number: number;
  title: string;
  text: string;
  responsibleParty: string;
}

export interface Settlement {
  title: string;
  preamble: string;
  clauses: SettlementClause[];
  signatures: { name: string; role: string }[];
  effectiveDate: string;
}

// ============================================================================
// Mediation Frameworks (14 frameworks)
// ============================================================================

export const MEDIATION_FRAMEWORKS: MediationFramework[] = [
  {
    id: 'fisher-ury',
    name: 'Fisher-Ury (Principled Negotiation)',
    shortDescription: 'Interest-based negotiation separating people from problems. Focuses on mutual gains through objective criteria.',
    bestFor: 'Bilateral disputes with identifiable interests, resource allocation conflicts',
    keySteps: ['Separate people from problems', 'Focus on interests not positions', 'Generate options for mutual gain', 'Insist on objective criteria'],
  },
  {
    id: 'track-ii',
    name: 'Track II Diplomacy',
    shortDescription: 'Informal, non-governmental dialogue between influential non-officials to build trust and explore solutions.',
    bestFor: 'Protracted interstate or ethnic conflicts where official channels are blocked',
    keySteps: ['Identify influential non-officials', 'Create safe dialogue space', 'Build informal consensus', 'Feed insights to Track I'],
  },
  {
    id: 'facilitative',
    name: 'Facilitative Mediation',
    shortDescription: 'Mediator facilitates communication without suggesting solutions. Empowers parties to create their own agreements.',
    bestFor: 'Workplace disputes, organizational conflicts, community disagreements',
    keySteps: ['Opening statements', 'Joint discussion', 'Private caucuses', 'Negotiation', 'Agreement drafting'],
  },
  {
    id: 'community',
    name: 'Community-Based Mediation',
    shortDescription: 'Locally-rooted process drawing on traditional dispute resolution and community elders.',
    bestFor: 'Land disputes, inter-communal tensions, resource conflicts at local level',
    keySteps: ['Community consultation', 'Elder council formation', 'Grievance hearing', 'Community agreement', 'Reconciliation ceremony'],
  },
  {
    id: 'transformative',
    name: 'Transformative Mediation',
    shortDescription: 'Focuses on empowerment and recognition rather than settlement. Aims to transform the conflict interaction itself.',
    bestFor: 'Relationship-heavy disputes, family conflicts, community reconciliation',
    keySteps: ['Empowerment opportunities', 'Recognition opportunities', 'Party-directed process', 'Micro-transformation tracking'],
  },
  {
    id: 'evaluative',
    name: 'Evaluative Mediation',
    shortDescription: 'Mediator evaluates strengths/weaknesses and proposes settlement options based on legal norms.',
    bestFor: 'Legal disputes, commercial conflicts, labor negotiations',
    keySteps: ['Case assessment', 'Reality testing', 'Proposal generation', 'Settlement conference'],
  },
  {
    id: 'narrative',
    name: 'Narrative Mediation',
    shortDescription: 'Explores the stories parties tell about the conflict to create new, shared narratives.',
    bestFor: 'Identity-based conflicts, historical grievances, reconciliation processes',
    keySteps: ['Deconstructing dominant narratives', 'Identifying alternative stories', 'Co-constructing new narratives', 'Anchoring agreements in shared story'],
  },
  {
    id: 'shuttle',
    name: 'Shuttle Diplomacy',
    shortDescription: 'Mediator moves between parties who cannot or will not meet face-to-face.',
    bestFor: 'High-hostility situations, security concerns, early-stage peace processes',
    keySteps: ['Separate party assessments', 'Interest mapping', 'Proposal shuttling', 'Incremental concession building', 'Joint session preparation'],
  },
  {
    id: 'med-arb',
    name: 'Med-Arb (Mediation-Arbitration)',
    shortDescription: 'Begins with mediation; if parties cannot agree, mediator shifts to binding arbitration.',
    bestFor: 'Commercial disputes, labor negotiations with deadlines',
    keySteps: ['Mediation phase', 'Deadline assessment', 'Arbitration notice', 'Evidence presentation', 'Binding decision'],
  },
  {
    id: 'multi-party',
    name: 'Multi-Party Negotiation',
    shortDescription: 'Structured process for complex negotiations involving three or more parties with interdependent interests.',
    bestFor: 'Multi-stakeholder environmental disputes, regional peace processes, organizational restructuring',
    keySteps: ['Stakeholder mapping', 'Coalition analysis', 'Agenda setting', 'Package dealing', 'Linked agreements'],
  },
  {
    id: 'restorative',
    name: 'Restorative Justice Dialogue',
    shortDescription: 'Brings together those harmed and those responsible for harm in a facilitated dialogue focused on repair.',
    bestFor: 'Post-violence reconciliation, transitional justice, community healing',
    keySteps: ['Preparation meetings', 'Victim impact sharing', 'Responsibility acknowledgment', 'Repair agreement', 'Follow-up support'],
  },
  {
    id: 'interest-based',
    name: 'Interest-Based Bargaining (IBB)',
    shortDescription: 'Collaborative process focusing on shared interests to solve mutual problems.',
    bestFor: 'Labor-management relations, organizational restructuring, policy negotiations',
    keySteps: ['Interest identification', 'Option generation', 'Standards development', 'Solution packaging'],
  },
  {
    id: 'conciliation',
    name: 'Conciliation',
    shortDescription: 'Third party assists in reducing tensions and improving communication, often as precursor to formal negotiation.',
    bestFor: 'Early conflict stages, confidence building, pre-negotiation phases',
    keySteps: ['Tension assessment', 'Confidence-building measures', 'Communication channel establishment', 'Pre-negotiation framework'],
  },
  {
    id: 'online-dispute',
    name: 'Online Dispute Resolution (ODR)',
    shortDescription: 'Technology-assisted mediation for remote or distributed parties.',
    bestFor: 'Cross-border disputes, diaspora engagement, pandemic/security restrictions',
    keySteps: ['Platform setup', 'Asynchronous submission', 'Virtual caucuses', 'Synchronous negotiation', 'Digital agreement'],
  },
];

// ============================================================================
// Demo Session Plans
// ============================================================================

export const DEMO_SESSION_PLANS: Record<string, SessionPlan> = {
  'nordalia-crisis+fisher-ury': {
    title: 'Nordalia Ceasefire Implementation — Principled Negotiation Session',
    framework: 'Fisher-Ury (Principled Negotiation)',
    caseName: 'Nordalia Crisis',
    estimatedDuration: '3 days (6 sessions)',
    phases: [
      {
        name: 'Phase 1: Interest Mapping',
        duration: 'Day 1, Sessions 1-2 (4 hours)',
        objectives: [
          'Separate positional demands from underlying interests',
          'Map Government security interests vs. EMLF autonomy interests',
          'Identify overlapping interests (economic development, civilian protection)',
        ],
        mediatorNotes: 'Begin with humanitarian corridor discussion — lowest-stakes entry point. Avoid sovereignty framing in opening session.',
      },
      {
        name: 'Phase 2: Options Generation',
        duration: 'Day 2, Sessions 3-4 (4 hours)',
        objectives: [
          'Brainstorm mutual-gain options without commitment',
          'Explore phased autonomy models from comparative cases',
          'Develop joint economic development proposals for Eastern Marches',
        ],
        mediatorNotes: 'Use Mozambique RENAMO integration as reference. Anticipate hardliner objections to power-sharing language.',
      },
      {
        name: 'Phase 3: Objective Criteria & Agreement',
        duration: 'Day 3, Sessions 5-6 (4 hours)',
        objectives: [
          'Apply international precedents as objective criteria',
          'Draft framework agreement on humanitarian corridor',
          'Establish verification mechanism acceptable to both sides',
        ],
        mediatorNotes: 'AUNM verification mechanism provides neutral standard. President Mabara needs face-saving language for domestic audience.',
      },
    ],
    keyQuestions: [
      'What are your security concerns if the humanitarian corridor is fully opened?',
      'What form of regional governance would address your community\'s core needs?',
      'What would a successful outcome look like for your constituents in 5 years?',
      'Which commitments from the March 2025 agreement are you most willing to accelerate?',
    ],
    riskFactors: [
      'General Korvac\'s Patriotic Front may undermine Government delegation authority',
      'Eastern Dawn Brigade provocations could collapse process at any phase',
      'Media leaks from sessions could trigger hardliner backlash on both sides',
    ],
  },
  'nordalia-crisis+track-ii': {
    title: 'Nordalia Track II Dialogue — Civil Society Bridge-Building',
    framework: 'Track II Diplomacy',
    caseName: 'Nordalia Crisis',
    estimatedDuration: '2 days (4 sessions)',
    phases: [
      {
        name: 'Phase 1: Participant Selection & Preparation',
        duration: 'Pre-session (2 weeks prior)',
        objectives: [
          'Identify influential academics, business leaders, and civil society figures from both sides',
          'Secure Chatham House Rule commitment',
          'Brief participants on current Track I status without revealing negotiation positions',
        ],
        mediatorNotes: 'Dr. Amara Osei (Nordalia University) and Prof. Demetrios Kastani (Marchville Institute) are ideal co-chairs. Avoid anyone with active political party affiliations.',
      },
      {
        name: 'Phase 2: Informal Dialogue',
        duration: 'Day 1 (6 hours)',
        objectives: [
          'Share personal narratives of conflict impact',
          'Explore perceptions of the "other side"',
          'Identify shared concerns about civilian welfare and economic decline',
        ],
        mediatorNotes: 'Small-group breakouts work better than plenary for first session. Shared meal is critical for trust-building.',
      },
      {
        name: 'Phase 3: Consensus Building',
        duration: 'Day 2 (4 hours)',
        objectives: [
          'Develop joint civil society statement on humanitarian priorities',
          'Draft recommendations for Track I negotiators',
          'Establish ongoing informal communication channel',
        ],
        mediatorNotes: 'Focus on actionable humanitarian asks — prisoner family visits, medical supply corridors. Avoid constitutional status discussions.',
      },
    ],
    keyQuestions: [
      'What do people in your community say privately that leaders cannot say publicly?',
      'Where do you see the strongest potential for cross-community cooperation?',
      'What would make you personally trust the peace process?',
    ],
    riskFactors: [
      'Participants may face retaliation for perceived collaboration',
      'Track I negotiators may dismiss Track II outputs',
      'Media exposure could compromise participant safety',
    ],
  },
  'techcorp-restructuring+facilitative': {
    title: 'TechCorp Restructuring — Facilitative Mediation Session',
    framework: 'Facilitative Mediation',
    caseName: 'TechCorp Restructuring Dispute',
    estimatedDuration: '1 day (3 sessions)',
    phases: [
      {
        name: 'Phase 1: Opening & Joint Discussion',
        duration: 'Session 1 (90 minutes)',
        objectives: [
          'Each party presents their perspective uninterrupted',
          'Identify common ground and contested issues',
          'Agree on mediation ground rules',
        ],
        mediatorNotes: 'Management team should present first — they proposed the restructuring. Union representatives tend to be more responsive when they feel heard.',
      },
      {
        name: 'Phase 2: Private Caucuses',
        duration: 'Session 2 (2 hours)',
        objectives: [
          'Explore each party\'s underlying concerns confidentially',
          'Reality-test unrealistic expectations',
          'Develop movement toward compromise positions',
        ],
        mediatorNotes: 'Union\'s core concern is job security, not opposing change. Management needs cost reduction but has flexibility on timeline.',
      },
      {
        name: 'Phase 3: Negotiation & Agreement',
        duration: 'Session 3 (90 minutes)',
        objectives: [
          'Present refined proposals from each side',
          'Negotiate specific terms (timeline, severance, retraining)',
          'Draft memorandum of understanding',
        ],
        mediatorNotes: 'Phased implementation over 18 months is likely landing zone. Include retraining budget as key sweetener for union buy-in.',
      },
    ],
    keyQuestions: [
      'What outcomes from this restructuring are you most concerned about?',
      'If we could guarantee job retraining, would the timeline become more flexible?',
      'What would a fair transition look like for affected employees?',
    ],
    riskFactors: [
      'Board pressure for faster timeline may undermine management flexibility',
      'Rank-and-file may reject union leadership\'s agreement',
      'Media coverage of "mass layoffs" narrative could escalate',
    ],
  },
  'riverside-land-dispute+community': {
    title: 'Riverside Land Dispute — Community-Based Mediation',
    framework: 'Community-Based Mediation',
    caseName: 'Riverside Land Dispute',
    estimatedDuration: '2 days (community sessions)',
    phases: [
      {
        name: 'Phase 1: Community Consultation',
        duration: 'Day 1, Morning (3 hours)',
        objectives: [
          'Meet with each community group separately',
          'Understand historical land use claims and grievances',
          'Identify respected community elders for council',
        ],
        mediatorNotes: 'The Riverside Farmers Cooperative and the Indigenous Peoples Council have overlapping historical claims. Meet elders at their preferred locations — do not summon them to a government building.',
      },
      {
        name: 'Phase 2: Elder Council & Grievance Hearing',
        duration: 'Day 1, Afternoon (4 hours)',
        objectives: [
          'Form joint elder council from both communities',
          'Conduct structured grievance hearing with community witnesses',
          'Document oral histories and land use patterns',
        ],
        mediatorNotes: 'Traditional opening ceremony is essential for legitimacy. Allow time for oral testimony — rushing undermines trust.',
      },
      {
        name: 'Phase 3: Agreement & Reconciliation',
        duration: 'Day 2 (4 hours)',
        objectives: [
          'Develop shared land-use agreement with community input',
          'Establish joint management committee',
          'Plan reconciliation ceremony and community celebration',
        ],
        mediatorNotes: 'Joint water management may be the bridge issue — both communities need irrigation access. Written agreement must be read aloud in both languages.',
      },
    ],
    keyQuestions: [
      'How has your family used this land across generations?',
      'What shared resources do both communities depend on?',
      'What would a respectful arrangement look like for your elders?',
    ],
    riskFactors: [
      'External developer interests may undermine community agreement',
      'Younger generation may not accept elder council authority',
      'Government land registry records may contradict customary claims',
    ],
  },
};

// ============================================================================
// Live Mediation Demo Sequence
// ============================================================================

export const DEMO_MEDIATION_SEQUENCE: MediationTurn[] = [
  {
    speaker: 'system',
    name: 'CONCORDIA',
    text: 'Session initiated: Nordalia Ceasefire Implementation — Principled Negotiation. Framework: Fisher-Ury. Participants: Government delegation (Amb. Kariuki), EMLF delegation (Cmdr. Teshome), Mediator (Dr. Osei). Session 1 of 6.',
  },
  {
    speaker: 'mediator',
    name: 'Dr. Osei',
    text: 'Thank you both for being here. Before we begin, I want to remind everyone that today we focus on interests, not positions. Our goal is to find solutions that address both sides\' legitimate concerns. Ambassador Kariuki, would you like to start by sharing what outcomes matter most to your government?',
  },
  {
    speaker: 'party_a',
    name: 'Amb. Kariuki',
    text: 'Thank you, Dr. Osei. The Government of Nordalia\'s primary concern is restoring security in the Eastern Marches. Our citizens have been displaced, our infrastructure damaged. We need a verifiable disarmament process before we can discuss governance arrangements. Security first — that is our foundation.',
  },
  {
    speaker: 'system',
    name: 'CONCORDIA',
    text: '[Analysis] Government position anchored on security-first sequencing. Underlying interests detected: territorial integrity, domestic political credibility, infrastructure restoration. Recommend exploring: Can security guarantees be designed to run parallel to governance discussions?',
  },
  {
    speaker: 'mediator',
    name: 'Dr. Osei',
    text: 'Thank you, Ambassador. Commander Teshome, what outcomes are most important to your movement and the communities you represent?',
  },
  {
    speaker: 'party_b',
    name: 'Cmdr. Teshome',
    text: 'With respect, we cannot disarm while our people have no political voice. For 30 years, the Eastern Marches have been marginalized — no representation, no development investment, no cultural recognition. We need a governance framework that guarantees our community\'s future before we lay down arms. Security without justice is just another form of occupation.',
  },
  {
    speaker: 'system',
    name: 'CONCORDIA',
    text: '[Analysis] EMLF position anchored on governance-first sequencing. Underlying interests: political representation, economic development, cultural recognition, security guarantees for combatants. Key tension: Both sides demand sequencing priority. Recommend: Explore parallel-track approach with mutual confidence-building measures.',
  },
  {
    speaker: 'mediator',
    name: 'Dr. Osei',
    text: 'I hear both of you clearly. Ambassador, your people need security. Commander, your communities need political voice. These are both legitimate. Let me ask this: Could we explore a parallel approach — security steps and governance steps moving together, each contingent on the other? Neither side goes first; both move simultaneously.',
  },
  {
    speaker: 'party_a',
    name: 'Amb. Kariuki',
    text: 'We are... open to discussing what that might look like. But we need concrete verification mechanisms. The March agreement\'s cantonment provisions are only 15% implemented. Words without action erode trust.',
  },
  {
    speaker: 'party_b',
    name: 'Cmdr. Teshome',
    text: 'And governance discussions without a clear timeline become a delaying tactic. We have seen that before. If there is a parallel track, we need binding milestones, not aspirational language.',
  },
  {
    speaker: 'mediator',
    name: 'Dr. Osei',
    text: 'Excellent — both of you want verifiable, concrete steps with clear timelines. That is shared ground. Let me propose we spend the next 90 minutes mapping out what a parallel framework could look like — security milestones paired with governance milestones, each with AUNM verification. Would that be acceptable?',
  },
  {
    speaker: 'system',
    name: 'CONCORDIA',
    text: '[Session Progress] Breakthrough: Both parties accepted parallel-track framing. Fisher-Ury principle "focus on interests, not positions" successfully applied. Next recommended action: Map specific paired milestones. Risk: Hardliner factions on both sides may reject parallel approach — prepare contingency framing.',
  },
];

// ============================================================================
// Demo Settlement
// ============================================================================

export const DEMO_SETTLEMENT: Settlement = {
  title: 'Framework Agreement on the Nordalia Eastern Marches Transition',
  preamble:
    'The Government of the Republic of Nordalia and the Eastern Marches Liberation Front, recognizing the suffering of civilian populations on all sides, committed to the territorial integrity of Nordalia within internationally recognized borders, and acknowledging the legitimate aspirations of all communities for political representation, economic development, and cultural recognition, hereby agree to the following framework for a peaceful transition:',
  clauses: [
    {
      number: 1,
      title: 'Parallel Implementation Framework',
      text: 'Security and governance provisions shall advance simultaneously through paired milestones, verified by the African Union Monitoring Mission (AUNM). Neither track shall be conditioned on completion of the other; both tracks shall maintain equivalent pace.',
      responsibleParty: 'Joint Implementation Commission',
    },
    {
      number: 2,
      title: 'Immediate Humanitarian Measures',
      text: 'Within 14 days of signing, all parties shall ensure unimpeded humanitarian access to all affected areas. The humanitarian corridor connecting Marchville to the international border shall be demilitarized and placed under AUNM supervision.',
      responsibleParty: 'Government of Nordalia + EMLF',
    },
    {
      number: 3,
      title: 'Phased Cantonment and Integration',
      text: 'EMLF combatants shall report to designated cantonment sites within 60 days. A Joint Security Committee shall develop an integration plan offering EMLF fighters pathways into reformed national security forces or civilian reintegration programs with international funding.',
      responsibleParty: 'EMLF + Joint Security Committee',
    },
    {
      number: 4,
      title: 'Regional Governance Framework',
      text: 'The Eastern Marches shall receive enhanced regional autonomy through a new Regional Assembly with defined legislative competencies in education, cultural affairs, local economic development, and natural resource management, consistent with the national constitution.',
      responsibleParty: 'Government of Nordalia',
    },
    {
      number: 5,
      title: 'Economic Development Fund',
      text: 'An international donors conference shall be convened within 90 days to establish an Eastern Marches Development Fund, with initial capitalization of $200 million. Fund governance shall include equal representation from national and regional authorities.',
      responsibleParty: 'International Partners + Joint Commission',
    },
    {
      number: 6,
      title: 'Prisoner Exchange and Amnesty',
      text: 'All prisoners of war and political detainees shall be released within 30 days. A conditional amnesty shall apply to conflict-related offenses, excluding international crimes as defined by the Rome Statute.',
      responsibleParty: 'Government of Nordalia + EMLF',
    },
    {
      number: 7,
      title: 'Truth and Reconciliation Commission',
      text: 'A Truth and Reconciliation Commission shall be established within 120 days with a mandate to document human rights violations by all parties, provide a platform for victim testimony, and recommend reparations.',
      responsibleParty: 'Joint Implementation Commission',
    },
    {
      number: 8,
      title: 'Verification and Compliance Mechanism',
      text: 'AUNM shall serve as the primary verification body. Quarterly compliance reviews shall be submitted to the UN Security Council. Material breach by either party shall trigger emergency consultation under Chapter VII provisions.',
      responsibleParty: 'AUNM + UNSC',
    },
    {
      number: 9,
      title: 'Timeline and Review',
      text: 'Full implementation shall be achieved within 24 months. A mid-term review at 12 months shall assess progress and adjust timelines. Extension may be granted by mutual consent with AUNM recommendation.',
      responsibleParty: 'Joint Implementation Commission',
    },
    {
      number: 10,
      title: 'Dispute Resolution',
      text: 'Any dispute arising from interpretation or implementation of this Agreement shall be referred first to the Joint Implementation Commission, and if unresolved within 30 days, to binding arbitration by a panel appointed by the African Union.',
      responsibleParty: 'African Union',
    },
  ],
  signatures: [
    { name: 'H.E. President Elara Mabara', role: 'Government of the Republic of Nordalia' },
    { name: 'Cmdr. Berhanu Teshome', role: 'Eastern Marches Liberation Front' },
    { name: 'Dr. Amara Osei', role: 'Chief Mediator' },
    { name: 'H.E. Amb. Fatima Al-Rashid', role: 'African Union Special Envoy' },
    { name: 'H.E. Amb. Jean-Pierre Delacroix', role: 'UN Special Representative' },
  ],
  effectiveDate: 'Upon signature by all parties, witnessed by the African Union and United Nations',
};
