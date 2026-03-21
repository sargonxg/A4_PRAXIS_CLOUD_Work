// Actor Intelligence Profiles — Nordalia Crisis

export interface ActorProfile {
  id: string;
  name: string;
  type: 'state' | 'armed_group' | 'international_org' | 'ngo' | 'individual' | 'private_sector' | 'civil_society' | 'media';
  affiliation: string;
  caseId: string;
  photo: null;
  classification: string;
  bio: string;
  mandate: string;
  leadership: string[];
  interests: { description: string; type: string; priority: 'critical' | 'high' | 'medium' | 'low'; isExplicit: boolean }[];
  leverageHeld: { target: string; type: string; description: string; effectiveness: string }[];
  leverageFacing: { holder: string; type: string; description: string; effectiveness: string }[];
  commitments: { description: string; date: string; status: 'active' | 'suspended' | 'violated' | 'fulfilled'; complianceScore: number }[];
  riskAssessment: { spoilerPotential: 'high' | 'medium' | 'low'; willingnessToNegotiate: 'high' | 'medium' | 'low'; summary: string };
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
  leverageScore: number;
  lastActivity: string;
}

export const ACTOR_PROFILES: ActorProfile[] = [
  {
    id: 'gov-nordalia',
    name: 'Government of Nordalia',
    type: 'state',
    affiliation: 'Republic of Nordalia',
    caseId: 'nordalia-crisis',
    photo: null,
    classification: 'RESTRICTED',
    bio: 'The Government of the Republic of Nordalia, led by President Elara Mabara since 2021, commands the Nordalia Armed Forces (~45,000 active personnel). The moderate executive branch has authorized negotiations with the EMLF, but faces significant internal resistance from the military establishment, particularly General Korvac\'s Patriotic Front faction which controls three strategic border garrisons.',
    mandate: 'Sovereign governance of the Republic of Nordalia including territorial integrity, national security, and international representation.',
    leadership: ['President Elara Mabara', 'PM David Asante', 'Gen. Korvac (Military Chief)', 'FM Catherine Ndogo'],
    interests: [
      { description: 'Territorial integrity and national sovereignty', type: 'security', priority: 'critical', isExplicit: true },
      { description: 'Domestic political survival for Mabara administration', type: 'political', priority: 'critical', isExplicit: false },
      { description: 'Restoration of state authority in Eastern Marches', type: 'political', priority: 'high', isExplicit: true },
      { description: 'Prevention of precedent for other separatist movements', type: 'strategic', priority: 'high', isExplicit: false },
    ],
    leverageHeld: [
      { target: 'EMLF', type: 'military', description: 'Conventional military superiority with 45,000 troops and air assets', effectiveness: 'high' },
      { target: 'Eastern Marches Population', type: 'economic', description: 'Control of customs revenue, international borrowing, and resource concessions', effectiveness: 'medium' },
      { target: 'AUNM', type: 'diplomatic', description: 'Host nation consent required for peacekeeping operations', effectiveness: 'medium' },
    ],
    leverageFacing: [
      { holder: 'International Community', type: 'sanctions', description: 'Targeted sanctions on 6 government-affiliated individuals', effectiveness: 'medium' },
      { holder: 'AUNM', type: 'normative', description: 'International monitoring and reporting on human rights compliance', effectiveness: 'medium' },
    ],
    commitments: [
      { description: 'September 2025 Ceasefire Agreement — cessation of offensive operations', date: '2025-09-15', status: 'active', complianceScore: 58 },
      { description: 'Prisoner exchange under Annex II — release of 150 EMLF detainees', date: '2025-10-01', status: 'active', complianceScore: 62 },
    ],
    riskAssessment: {
      spoilerPotential: 'medium',
      willingnessToNegotiate: 'medium',
      summary: 'The moderate executive is willing to negotiate but faces internal constraints from the Patriotic Front faction. General Korvac\'s independent command authority over border garrisons creates a dual-authority problem that could undermine any agreement reached at the negotiating table.',
    },
    threatLevel: 'high',
    leverageScore: 82,
    lastActivity: '2026-03-19',
  },
  {
    id: 'emlf',
    name: 'Eastern Marches Liberation Front',
    type: 'armed_group',
    affiliation: 'Eastern Marches Self-Governance Movement',
    caseId: 'nordalia-crisis',
    photo: null,
    classification: 'RESTRICTED',
    bio: 'The EMLF is an ethno-nationalist armed movement commanding approximately 12,000 fighters with effective control over 40% of the Eastern Marches territory. Under Commander Berhanu Teshome, the movement combines legitimate grievances regarding political marginalization with armed struggle. Internal cohesion is strained by the Eastern Dawn Brigade splinter group (~800 fighters) which rejects ceasefire terms.',
    mandate: 'Self-determination and political representation for the Marchian people, including regional autonomy, cultural recognition, and economic development.',
    leadership: ['Cmdr. Berhanu Teshome', 'Political Dir. Miriam Desta', 'Ato Kebede (Eastern Dawn, splinter)'],
    interests: [
      { description: 'Physical security for combatants and Marchian communities', type: 'security', priority: 'critical', isExplicit: true },
      { description: 'Political representation and regional self-governance', type: 'political', priority: 'critical', isExplicit: true },
      { description: 'Cultural recognition and Marchian language rights', type: 'identity', priority: 'high', isExplicit: true },
      { description: 'Economic development and resource equity for Eastern Marches', type: 'economic', priority: 'high', isExplicit: true },
    ],
    leverageHeld: [
      { target: 'Government of Nordalia', type: 'territorial', description: 'Effective control of 40% of Eastern Marches including Eastport border crossing', effectiveness: 'high' },
      { target: 'International Community', type: 'narrative', description: 'International sympathy for self-determination cause and humanitarian framing', effectiveness: 'medium' },
    ],
    leverageFacing: [
      { holder: 'Government of Nordalia', type: 'military', description: 'Conventional military superiority and potential for large-scale offensive', effectiveness: 'high' },
      { holder: 'International Community', type: 'sanctions', description: 'Targeted sanctions on 4 EMLF-affiliated individuals', effectiveness: 'low' },
      { holder: 'Eastern Dawn Brigade', type: 'spoiler', description: 'Splinter faction undermines EMLF leadership authority and ceasefire compliance', effectiveness: 'high' },
    ],
    commitments: [
      { description: 'September 2025 Ceasefire — cessation of offensive operations', date: '2025-09-15', status: 'active', complianceScore: 45 },
      { description: 'Cantonment of forces at designated sites', date: '2025-10-15', status: 'suspended', complianceScore: 15 },
    ],
    riskAssessment: {
      spoilerPotential: 'high',
      willingnessToNegotiate: 'medium',
      summary: 'EMLF leadership under Teshome is willing to negotiate but cannot guarantee compliance from the Eastern Dawn Brigade splinter group. The movement\'s internal fragmentation creates a significant spoiler risk — Teshome cannot deliver commitments that require Eastern Dawn cooperation.',
    },
    threatLevel: 'high',
    leverageScore: 68,
    lastActivity: '2026-03-20',
  },
  {
    id: 'unsg-envoy',
    name: 'UNSG Special Envoy Amb. Delacroix',
    type: 'individual',
    affiliation: 'United Nations',
    caseId: 'nordalia-crisis',
    photo: null,
    classification: 'UNCLASSIFIED',
    bio: 'Ambassador Jean-Pierre Delacroix, a veteran French diplomat with 30 years of experience in African peace processes, was appointed UNSG Special Representative for Nordalia in March 2025. He previously served as ASG for Peacekeeping Operations and led mediation efforts in the Central African Republic.',
    mandate: 'Good offices of the Secretary-General; coordination of international mediation efforts; reporting to the Security Council on implementation of Resolution 2847.',
    leadership: ['Amb. Jean-Pierre Delacroix', 'Deputy SRSG Maria Santos', 'Political Affairs Chief Thomas Eriksen'],
    interests: [
      { description: 'Sustainable peace agreement acceptable to all parties', type: 'diplomatic', priority: 'critical', isExplicit: true },
      { description: 'Protection of civilian populations', type: 'humanitarian', priority: 'critical', isExplicit: true },
      { description: 'Preservation of UN credibility and mandate relevance', type: 'institutional', priority: 'high', isExplicit: false },
    ],
    leverageHeld: [
      { target: 'Both Parties', type: 'normative', description: 'International legitimacy and UNSC reporting authority', effectiveness: 'medium' },
      { target: 'Government of Nordalia', type: 'diplomatic', description: 'Ability to shape UNSC discussions and sanctions recommendations', effectiveness: 'medium' },
    ],
    leverageFacing: [
      { holder: 'P5 Members', type: 'political', description: 'UNSC dynamics and P5 divergent interests constrain mandate', effectiveness: 'medium' },
    ],
    commitments: [
      { description: 'Quarterly reporting to UNSC on ceasefire implementation', date: '2025-04-01', status: 'active', complianceScore: 95 },
    ],
    riskAssessment: {
      spoilerPotential: 'low',
      willingnessToNegotiate: 'high',
      summary: 'Amb. Delacroix is a committed mediator with strong institutional backing. Primary risk is mandate fatigue and declining Security Council attention as competing global crises emerge.',
    },
    threatLevel: 'low',
    leverageScore: 45,
    lastActivity: '2026-03-18',
  },
  {
    id: 'au-mediation',
    name: 'AU Mediation Team',
    type: 'international_org',
    affiliation: 'African Union',
    caseId: 'nordalia-crisis',
    photo: null,
    classification: 'UNCLASSIFIED',
    bio: 'The African Union Mediation Team, led by Special Envoy H.E. Ambassador Fatima Al-Rashid, operates under the AU Peace and Security Council mandate. The team coordinates with the UN mission (AUNM) and maintains direct communication channels with both parties. Al-Rashid brings experience from the Ethiopia-Eritrea and Mozambique peace processes.',
    mandate: 'AU Peace and Security Council mandate for mediation, confidence-building, and political dialogue facilitation in the Nordalia crisis.',
    leadership: ['Amb. Fatima Al-Rashid (Special Envoy)', 'Dr. Kwame Mensah (Deputy)', 'Col. Ibrahim Diop (Security Advisor)'],
    interests: [
      { description: 'African-led solution demonstrating AU institutional capacity', type: 'institutional', priority: 'high', isExplicit: false },
      { description: 'Regional stability and prevention of conflict spillover', type: 'security', priority: 'critical', isExplicit: true },
    ],
    leverageHeld: [
      { target: 'Both Parties', type: 'diplomatic', description: 'Regional legitimacy and ability to convene AU PSC sessions', effectiveness: 'medium' },
      { target: 'Government of Nordalia', type: 'institutional', description: 'AUNM deployment authorization and mandate renewal recommendations', effectiveness: 'high' },
    ],
    leverageFacing: [
      { holder: 'AU Member States', type: 'political', description: 'Competing priorities and resource constraints among AU members', effectiveness: 'medium' },
    ],
    commitments: [
      { description: 'Facilitation of Track I negotiations between parties', date: '2025-06-01', status: 'active', complianceScore: 80 },
    ],
    riskAssessment: {
      spoilerPotential: 'low',
      willingnessToNegotiate: 'high',
      summary: 'The AU team is a constructive mediator with regional credibility. Coordination gaps with the UN Special Envoy occasionally create confusion about lead mediation responsibility.',
    },
    threatLevel: 'low',
    leverageScore: 55,
    lastActivity: '2026-03-17',
  },
  {
    id: 'merovia',
    name: 'Republic of Merovia',
    type: 'state',
    affiliation: 'Neighboring State',
    caseId: 'nordalia-crisis',
    photo: null,
    classification: 'CONFIDENTIAL',
    bio: 'The Republic of Merovia shares a 400km border with Nordalia\'s Eastern Marches. While publicly supporting the peace process, Merovian intelligence services have facilitated cross-border arms transfers to both hardliner factions. An estimated 78,000 Nordalia refugees reside in Merovia, creating domestic political pressures.',
    mandate: 'Sovereign governance. Regional interest in managing refugee flows and preventing conflict spillover.',
    leadership: ['President Kofi Ansah', 'FM Grace Okonkwo', 'Intelligence Dir. Col. Samuel Kwarteng'],
    interests: [
      { description: 'Preventing refugee crisis and border instability', type: 'security', priority: 'critical', isExplicit: true },
      { description: 'Maintaining strategic influence in Eastern Marches', type: 'strategic', priority: 'high', isExplicit: false },
      { description: 'Accessing Eastern Marches mineral resources through aligned factions', type: 'economic', priority: 'medium', isExplicit: false },
    ],
    leverageHeld: [
      { target: 'EMLF', type: 'logistic', description: 'Control of cross-border supply routes and refugee camp access', effectiveness: 'high' },
      { target: 'Eastern Dawn Brigade', type: 'military', description: 'Covert arms supply through Merovian intelligence channels', effectiveness: 'high' },
    ],
    leverageFacing: [
      { holder: 'International Community', type: 'diplomatic', description: 'Risk of sanctions designation for arms trafficking facilitation', effectiveness: 'medium' },
      { holder: 'UNHCR', type: 'normative', description: 'Monitoring of refugee protection standards', effectiveness: 'low' },
    ],
    commitments: [
      { description: 'Regional Non-Aggression Pact — border security cooperation', date: '2024-03-20', status: 'violated', complianceScore: 25 },
    ],
    riskAssessment: {
      spoilerPotential: 'high',
      willingnessToNegotiate: 'low',
      summary: 'Merovia is a significant spoiler actor through covert support for hardliner factions. Public commitment to peace is contradicted by intelligence-level facilitation of arms flows. Sanctions threat is the primary lever for behavior modification.',
    },
    threatLevel: 'medium',
    leverageScore: 40,
    lastActivity: '2026-03-15',
  },
  {
    id: 'marchian-heritage',
    name: 'Marchian Heritage Foundation',
    type: 'civil_society',
    affiliation: 'Marchian Diaspora',
    caseId: 'nordalia-crisis',
    photo: null,
    classification: 'RESTRICTED',
    bio: 'The Marchian Heritage Foundation is the largest diaspora organization representing ethnic Marchians abroad, with chapters in 14 countries and an estimated 2 million global reach. While officially focused on cultural preservation and humanitarian aid, FATF assessment identified the MHF as a significant conduit for diaspora funding to EMLF-aligned groups ($12-15M annually).',
    mandate: 'Cultural preservation, humanitarian support, and political advocacy for the Marchian diaspora community.',
    leadership: ['Chair Dr. Selam Haile (London)', 'Deputy Chair Tesfaye Bekele (Washington)', 'Treasurer Miriam Gebremedhin (Geneva)'],
    interests: [
      { description: 'International recognition of Marchian self-determination', type: 'political', priority: 'critical', isExplicit: true },
      { description: 'Humanitarian support for displaced Marchians', type: 'humanitarian', priority: 'high', isExplicit: true },
      { description: 'Financial support to EMLF-aligned groups', type: 'strategic', priority: 'high', isExplicit: false },
    ],
    leverageHeld: [
      { target: 'EMLF', type: 'financial', description: 'Estimated $12-15M annually in diaspora funding through opaque channels', effectiveness: 'high' },
      { target: 'International Media', type: 'narrative', description: 'Social media amplification of Liberation Discourse to global audience', effectiveness: 'medium' },
    ],
    leverageFacing: [
      { holder: 'FATF/Western Governments', type: 'regulatory', description: 'Financial monitoring and potential designation for terrorism financing', effectiveness: 'medium' },
    ],
    commitments: [],
    riskAssessment: {
      spoilerPotential: 'medium',
      willingnessToNegotiate: 'low',
      summary: 'The MHF\'s hardline diaspora constituency is less amenable to compromise than EMLF field leadership. Financial flows sustain the armed struggle and reduce EMLF incentives to negotiate. Engagement through Track II dialogue with moderate diaspora leaders is recommended.',
    },
    threatLevel: 'medium',
    leverageScore: 35,
    lastActivity: '2026-03-12',
  },
  {
    id: 'korvac-security',
    name: 'Korvac Security Solutions',
    type: 'private_sector',
    affiliation: 'Patriotic Front (Government-adjacent)',
    caseId: 'nordalia-crisis',
    photo: null,
    classification: 'CONFIDENTIAL',
    bio: 'Korvac Security Solutions is a private military company with close ties to General Korvac\'s Patriotic Front faction. Operating under the guise of "security consulting," the firm provides training, logistics, and intelligence support to government hardliners. It has an estimated 500 personnel and controls three border garrison supply contracts.',
    mandate: 'Private security services. De facto: military support infrastructure for the Patriotic Front faction.',
    leadership: ['CEO Maj. (Ret.) Viktor Osei', 'Operations Dir. Capt. (Ret.) Thomas Mensah'],
    interests: [
      { description: 'Continuation of conflict as revenue source', type: 'economic', priority: 'critical', isExplicit: false },
      { description: 'Preservation of border garrison contracts', type: 'economic', priority: 'high', isExplicit: false },
      { description: 'Support for Patriotic Front political agenda', type: 'political', priority: 'high', isExplicit: false },
    ],
    leverageHeld: [
      { target: 'Government Military', type: 'logistic', description: 'Control of supply chains to three border garrisons', effectiveness: 'high' },
      { target: 'General Korvac', type: 'operational', description: 'Provides intelligence and operational capacity outside formal command', effectiveness: 'high' },
    ],
    leverageFacing: [
      { holder: 'International Community', type: 'sanctions', description: 'Risk of targeted sanctions and asset freezes', effectiveness: 'medium' },
      { holder: 'Government of Nordalia', type: 'legal', description: 'Formal authority to revoke contracts, though enforcement is complicated', effectiveness: 'low' },
    ],
    commitments: [],
    riskAssessment: {
      spoilerPotential: 'high',
      willingnessToNegotiate: 'low',
      summary: 'KSS is a key enabler of the Patriotic Front\'s spoiler capacity. The firm profits directly from conflict continuation and has no incentive to support peace. Targeted sanctions on KSS leadership and contract revocation are recommended.',
    },
    threatLevel: 'high',
    leverageScore: 30,
    lastActivity: '2026-03-16',
  },
  {
    id: 'nbc',
    name: 'Nordalia Broadcasting Corporation',
    type: 'media',
    affiliation: 'State-Aligned Media',
    caseId: 'nordalia-crisis',
    photo: null,
    classification: 'UNCLASSIFIED',
    bio: 'The Nordalia Broadcasting Corporation is the primary state-aligned media outlet, reaching approximately 60% of the Nordalia population through television, radio, and digital platforms. NBC maintains a "National Unity" editorial line that frames the EMLF as terrorist/separatist insurgents and opposes territorial concessions.',
    mandate: 'Public broadcasting. De facto: government narrative dissemination and information operations.',
    leadership: ['Director-General Adeola Bankole', 'Chief Editor Paul Kagiso', 'Political Desk Chief Rebecca Asare'],
    interests: [
      { description: 'Maintaining government editorial alignment for institutional survival', type: 'institutional', priority: 'critical', isExplicit: false },
      { description: 'Audience retention through nationalist narrative framing', type: 'commercial', priority: 'high', isExplicit: false },
    ],
    leverageHeld: [
      { target: 'Nordalia Public Opinion', type: 'informational', description: 'Controls dominant national narrative reaching 60% of population', effectiveness: 'high' },
      { target: 'Government of Nordalia', type: 'political', description: 'Shapes domestic political constraints on negotiation positions', effectiveness: 'medium' },
    ],
    leverageFacing: [
      { holder: 'Government of Nordalia', type: 'institutional', description: 'State funding and editorial direction', effectiveness: 'high' },
      { holder: 'International Media', type: 'competitive', description: 'Alternative framing from international correspondents challenges NBC narrative', effectiveness: 'medium' },
    ],
    commitments: [
      { description: 'Media provisions under ceasefire — balanced reporting commitment', date: '2025-09-15', status: 'violated', complianceScore: 20 },
    ],
    riskAssessment: {
      spoilerPotential: 'medium',
      willingnessToNegotiate: 'low',
      summary: 'NBC is a narrative spoiler that constrains government negotiating flexibility by reinforcing hardline public expectations. Engagement should focus on media confidence-building measures and international journalist access provisions.',
    },
    threatLevel: 'medium',
    leverageScore: 25,
    lastActivity: '2026-03-21',
  },
];
