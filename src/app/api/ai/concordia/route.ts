/**
 * CONCORDIA — Mediation Design & Peace Process Architecture
 * Blueprint §6 · AI SDK v6 · generateText + Output.object pattern
 *
 * Analytical frameworks:
 *   - Berghof mediation stages (pre-negotiation → negotiation → implementation)
 *   - Zartman Ripeness Theory (MHS + mutually enticing opportunity)
 *   - Stedman Spoiler typology (total / limited / greedy)
 *   - Fisher-Ury interests vs. positions
 *   - Zone of Possible Agreement (ZOPA) per agenda item
 */

import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getThinkingModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  situation: situationContextSchema.optional(),
});

// ---------------------------------------------------------------------------
// Output schema — ConcordiaSchema (Blueprint §6)
// ---------------------------------------------------------------------------

const ConcordiaSchema = z.object({
  processDesign: z.object({
    format: z.enum([
      'shuttle-diplomacy',
      'direct-talks',
      'proximity-talks',
      'multi-party-conference',
      'technical-working-groups',
      'track-2',
    ]).describe('Primary process format chosen based on trust level, political context, and parties\' willingness to meet'),
    venue: z.string().describe('Recommended venue with geopolitical rationale — neutral, accessible, and symbolically appropriate'),
    mediator: z.string().describe('Recommended mediator profile, institutional affiliation, and composition of the mediation team'),
    rationale: z.string().describe('Explanation of why this format, venue, and mediator combination is optimal for this specific conflict'),
  }),

  phases: z.array(z.object({
    phaseNumber: z.number().int().min(1).describe('Sequential phase number starting from 1'),
    name: z.string().describe('Phase name (e.g. "Pre-Negotiation: Confidence-Building", "Substantive Talks", "Implementation")'),
    duration: z.string().describe('Estimated duration (e.g. "8-12 weeks", "3-6 months")'),
    objectives: z.array(z.string()).min(2).describe('Primary objectives to be achieved in this phase'),
    keyActivities: z.array(z.string()).min(3).describe('Concrete activities, meetings, and deliverables in this phase'),
    confidenceBuilding: z.array(z.string()).min(1).describe('CBMs — confidence-building measures specific to this phase; must be reversible and verifiable'),
    risks: z.array(z.string()).min(2).describe('Phase-specific spoiler risks, deal-breakers, and mitigation approaches'),
    successCriteria: z.array(z.string()).min(2).describe('Measurable criteria that must be met before advancing to the next phase'),
  })).min(3).describe('Sequenced phases from pre-negotiation through implementation — minimum 3 phases required'),

  agendaItems: z.array(z.object({
    item: z.string().describe('Specific agenda item or issue cluster to be negotiated'),
    priority: z.enum(['core', 'important', 'secondary']).describe('core = must resolve for agreement; important = significant but tradeable; secondary = procedural or deferred'),
    timeframe: z.enum(['phase-1', 'phase-2', 'phase-3', 'ongoing']).describe('Phase in which this item is negotiated'),
    parties: z.array(z.string()).describe('Parties that must reach agreement on this item — may be a subset of all parties'),
    linkages: z.array(z.string()).describe('Other agenda items this is linked to or conditioned upon — package deal architecture'),
    zoneOfPossibleAgreement: z.string().describe('ZOPA analysis: identify the range within which both parties\' interests overlap; reference Fisher-Ury positions vs. underlying interests'),
  })).min(4).describe('Agenda items covering all core negotiation tracks — include ZOPA analysis for each'),

  spoilerManagement: z.array(z.object({
    spoilerName: z.string().describe('Name of the spoiler actor or group'),
    spoilerType: z.enum(['total', 'limited', 'greedy']).describe('Stedman typology: total = rejects any outcome; limited = rejects specific terms; greedy = seeks maximalist gains'),
    threat: z.string().describe('Specific threat this spoiler poses to the process — what actions could they take and when'),
    strategy: z.enum(['inclusion', 'marginalization', 'cooptation', 'deterrence']).describe('Primary strategy for managing this spoiler based on their type and leverage'),
    tacticalApproach: z.string().describe('Specific tactical steps: what the mediator and guarantors should do to implement this strategy'),
  })).min(2).describe('Spoiler analysis for each actor likely to obstruct the peace process'),

  ripeness: z.object({
    currentScore: z.number().min(0).max(10).describe('Zartman ripeness score 0-10: 0 = not ripe, 10 = maximally ripe for negotiation'),
    mutuallyHurtingStalemate: z.boolean().describe('True if both parties are in a hurting stalemate — neither can win militarily/politically at acceptable cost'),
    mutuallyEnticing: z.boolean().describe('True if a mutually enticing opportunity exists — a positive vision both parties prefer over continued conflict'),
    assessmentNote: z.string().describe('Analytical justification for the ripeness score referencing specific indicators — military balance, economic costs, political costs, leadership'),
    interventionWindow: z.string().describe('Assessment of the current intervention window — how long it is likely to remain open and what could close it'),
  }),

  guarantees: z.array(z.object({
    type: z.enum(['security', 'economic', 'political', 'international']).describe('Guarantee category'),
    mechanism: z.string().describe('Specific mechanism by which this guarantee is provided — institutional structure, legal framework, or deployment'),
    guarantor: z.string().describe('Actor(s) providing the guarantee — state, international organization, or regional body'),
  })).min(2).describe('Guarantees required to make any agreement credible and implementable'),

  exitStrategy: z.string().describe('How the mediation process ends successfully — transition from mediated process to sustainable self-governance, monitoring architecture, and handoff criteria'),
});

// ---------------------------------------------------------------------------
// Demo response — Nordalia conflict scenario (realistic 3-phase process)
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  processDesign: {
    format: 'proximity-talks' as const,
    venue: 'Geneva, Switzerland (Palais des Nations, UN Office) — neutral, well-resourced, and symbolically aligned with international humanitarian law. The AU Peace and Security Council provides co-convening authority. Secondary track-2 channels hosted in Nairobi under Rift Valley Institute auspices.',
    mediator: 'Joint UN-AU mediation team led by a UN DPPA Senior Mediation Adviser (P5 level) as process facilitator, co-chaired by the AU High Representative for the Nordalia Process. Supported by a technical secretariat comprising economic affairs specialists (World Bank secondee), security sector reform advisers (DCAF), and a human rights legal adviser (OHCHR). A senior woman mediator should co-lead in line with UNSCR 1325 commitments.',
    rationale: 'Proximity talks are appropriate given the deep mutual distrust between the Government of Nordalia (GoN) and the Democratic Reform Movement (DRM): direct talks would be premature and would hand GoN leverage to walk out theatrically, while shuttle diplomacy is too slow given the humanitarian emergency. Geneva sends a neutral signal without favouring either party\'s regional patrons. The UN-AU co-convening structure distributes legitimacy across both the global and regional levels, insulating the process from any single external actor\'s interference. The joint mediation team ensures no single personality becomes the bottleneck.',
  },
  phases: [
    {
      phaseNumber: 1,
      name: 'Pre-Negotiation: Foundation-Setting and Confidence-Building',
      duration: '10-14 weeks',
      objectives: [
        'Obtain written commitment from both GoN and DRM to negotiate in good faith under the mediation framework',
        'Achieve a durable cessation of hostilities with third-party monitoring (UNMN verification mandate)',
        'Open full humanitarian access to all conflict-affected districts (OCHA verification)',
        'Secure Karovia\'s commitment to suspend material support to DRM as a process-enabling precondition',
      ],
      keyActivities: [
        'Bilateral back-channel consultations with GoN and DRM leadership through existing intermediaries (Rift Valley Institute, ICRC)',
        'Mediation team visits to Nordalia capital and DRM-controlled territories to assess negotiating mandates',
        'ICRC-facilitated prisoner exchange: minimum 25 per side as first CBM',
        'Technical working group on ceasefire monitoring architecture (military experts, UNMN)',
        'Humanitarian access negotiations with GoN Ministry of Interior and DRM military command',
        'High-level diplomatic engagement with Karovia: bilateral meeting between UN SRSG and Karovian Foreign Minister to frame non-interference as in Karovia\'s long-term interest',
        'Signing of a Process Framework Agreement (PFA) by both parties — commits to negotiation without prejudicing any substantive outcome',
      ],
      confidenceBuilding: [
        'ICRC-mediated prisoner exchange (25+ per side) verified by UNMN observers — first test of reciprocal good faith',
        'Joint humanitarian corridor announcement by GoN and DRM — signals to domestic audiences that the parties can cooperate on non-controversial issues',
        'Karovian public statement of support for the process (at minimum non-interference commitment)',
        'Release of three long-held civilian detainees on each side as humanitarian gesture',
      ],
      risks: [
        'GoN may insist on DRM disarmament as precondition — resist vigorously; frame as process outcome, not precondition',
        'DRM leadership may demand formal political recognition before joining any talks — offer process legitimacy without prejudicing status',
        'Karovian spoiler behaviour: covert arms supply continues — maintain intelligence monitoring and activate UNSC targeted sanctions threat',
        'Internal DRM fragmentation: field commanders may reject what political leadership agrees — require multi-level DRM buy-in before Phase 2',
      ],
      successCriteria: [
        'Process Framework Agreement signed by all principal parties',
        'Cessation of hostilities in effect for minimum 21 consecutive days with less than 5 verified violations',
        'Humanitarian convoys reaching all six blocked districts (OCHA verified)',
        'Karovia has ceased verified arms transfers to DRM',
      ],
    },
    {
      phaseNumber: 2,
      name: 'Substantive Talks: Economic, Security, and Political Tracks',
      duration: '16-22 weeks',
      objectives: [
        'Reach agreement in principle on Belara Mining revenue-sharing formula (strongest ZOPA — economic track first)',
        'Negotiate phased DDR sequencing with security guarantees for DRM leadership and fighters',
        'Establish the framework for transitional governance and electoral arrangements',
        'Agree on a transitional justice mechanism acceptable to both parties and affected communities',
      ],
      keyActivities: [
        'Economic track: World Bank-facilitated revenue-sharing negotiations on Belara concession revenues (target: 30-40% to eastern provinces via autonomous Provincial Development Fund)',
        'Security track: DDR framework negotiations — phased cantonment linked to political benchmarks; security sector reform roadmap; UNMN monitoring mandate expansion',
        'Political track: Transitional governance arrangements including DRM participation in interim bodies; constitutional reform roadmap for eastern autonomy; internationally supervised election timeline',
        'Transitional justice track: Hybrid tribunal architecture (national-international), truth commission mandate, reparations framework',
        'Belara Mining escrow account operationalised with World Bank and African Development Bank as joint administrators',
        'Two international pledging conferences for Nordalia reconstruction to create positive economic incentives',
        'Monthly plenary sessions in Geneva with inter-sessional working group meetings in Nairobi',
      ],
      confidenceBuilding: [
        'Belara escrow account activated with first revenue deposit — demonstrates economic track is producing tangible results',
        'Joint technical committee on security sector reform: GoN military and DRM commanders in same room for the first time',
        'ICRC-facilitated family tracing programme for missing persons — humanitarian dividend visible to affected communities',
        'Interim economic relief package for eastern provinces funded by international donors — reduces DRM incentive to continue fighting',
      ],
      risks: [
        'GoN military hardliners will resist any DDR pathway that includes DRM integration into national security forces — manage through MoD parallel dialogue track',
        'DRM will not agree to cantonment without ironclad security guarantees and clear political pathway — sequencing must link DDR to political benchmarks, not precede them',
        'Economic negotiations may get linked to security track by GoN to slow process — enforce track separation by mediation team',
        'President Osei faces domestic elections within 18 months — political incentive to appear tough may cause backsliding',
        'International donor fatigue if Phase 2 extends beyond 22 weeks — maintain momentum through regular pledging signals',
      ],
      successCriteria: [
        'Revenue-sharing framework agreed in writing with International Monetary Fund technical endorsement',
        'DDR timeline framework agreed (24-36 month phased programme) with international verification mechanism',
        'Electoral framework agreed including DRM participation rights and timeline',
        'Transitional justice mechanism design agreed with OHCHR endorsement',
      ],
    },
    {
      phaseNumber: 3,
      name: 'Implementation Architecture and Agreement Signature',
      duration: '8-12 weeks',
      objectives: [
        'Finalise comprehensive peace agreement text integrating all Phase 2 frameworks',
        'Establish Joint Implementation Commission with international co-chairs and monitoring authority',
        'Operationalise security arrangements and begin phased DDR',
        'Secure international guarantor commitments and international community pledges',
      ],
      keyActivities: [
        'Legal drafting of comprehensive peace agreement — UN treaty legal experts and parties\' legal counsels',
        'International Contact Group ministerial meeting to secure guarantor commitments (AU, UN, EU, World Bank)',
        'UNSC resolution endorsing the agreement and expanding UNMN monitoring mandate with enforcement authority',
        'Formal agreement signature ceremony at Palais des Nations — international political endorsement',
        'Joint Implementation Commission (JIC) stood up: AU-UN co-chairs, quarterly UNSC reporting obligation',
        'Phase 1 DDR cantonment sites established and operational',
        'International pledging conference: minimum USD 2.4 billion reconstruction package',
        'Benchmarked election date set with UNDP electoral support mission deployed',
      ],
      confidenceBuilding: [
        'DRM political leadership publicly affirms the agreement and commits to transitional process — test of internal legitimacy',
        'GoN Armed Forces Chief of Staff endorses DDR framework publicly — signals military buy-in',
        'First tranche of reconstruction funding disbursed to eastern provinces within 30 days of signature',
        'First cantonment of DRM fighters completed with UNMN verification',
      ],
      risks: [
        'Last-minute linkage demands from either party to reopen agreed frameworks — mediation team must hold the package deal principle',
        'UNSC veto threat from permanent member aligned with GoN or Karovia — pre-position P5 engagement throughout Phase 2',
        'DRM internal split at signature stage: hardline commanders refuse to endorse — require DRM to demonstrate internal consensus before signature date',
        'GoN constitutional court challenge to agreed autonomy provisions — pre-position through consultations with Constitutional Court President',
      ],
      successCriteria: [
        'Comprehensive peace agreement signed by all principal parties and witnessed by international guarantors',
        'UNSC resolution adopted endorsing the agreement (minimum procedural vote, no veto)',
        'Joint Implementation Commission operational with verified international co-chair appointments',
        'First verified DDR cantonment completed within 45 days of signature',
      ],
    },
  ],
  agendaItems: [
    {
      item: 'Belara Mining Revenue-Sharing and Eastern Provincial Development Fund',
      priority: 'core' as const,
      timeframe: 'phase-2' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement'],
      linkages: ['Security and DDR framework', 'Eastern provincial autonomy arrangements'],
      zoneOfPossibleAgreement: 'Fisher-Ury analysis: GoN\'s stated position is maximum 15% revenue to eastern provinces; DRM\'s stated position is 60%. Underlying interests: GoN needs fiscal stability and international investor confidence; DRM needs a tangible economic dividend to justify demobilisation. ZOPA is likely 28-42% revenue share administered through an internationally supervised Provincial Development Fund. World Bank modelling suggests 35% is fiscally sustainable for GoN while meeting DRM\'s minimum economic threshold. Package: couple revenue share with an international investment guarantee scheme that increases GoN\'s overall mining revenue, making the relative share less politically costly.',
    },
    {
      item: 'Disarmament, Demobilisation and Reintegration (DDR) and Security Guarantees',
      priority: 'core' as const,
      timeframe: 'phase-2' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'UNMN'],
      linkages: ['Political transitional arrangements', 'International guarantees package', 'Eastern provincial autonomy'],
      zoneOfPossibleAgreement: 'GoN position: immediate disarmament before political talks conclude. DRM position: political settlement first, then conditional disarmament with full security guarantees. Underlying interests: GoN needs security sector control; DRM needs physical survival guarantees for leadership and fighters. ZOPA: phased DDR where cantonment is linked to political milestones, not front-loaded. Fighters enter cantonment in tranches tied to political benchmarks (revenue agreement, autonomy framework, elections). International peacekeeping force expansion provides security guarantee. UNMN Chapter VII enforcement authority resolves GoN\'s credible commitment problem.',
    },
    {
      item: 'Eastern Province Autonomy and Constitutional Reform',
      priority: 'core' as const,
      timeframe: 'phase-2' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'Eastern Provincial Council'],
      linkages: ['Electoral framework', 'Revenue-sharing arrangement', 'Transitional justice'],
      zoneOfPossibleAgreement: 'GoN position: decentralisation within unitary state, no constitutional change. DRM position: federal status or self-determination referendum. Underlying interests: GoN needs territorial integrity and sovereignty signal; DRM needs meaningful self-governance and protection from future resource exploitation. ZOPA: asymmetric autonomy model (e.g., Mindanao Bangsamoro or South Tyrol precedent) — substantial administrative autonomy with constitutional protection, without federalism label. Framing as "special status" rather than federalism allows GoN to claim territorial integrity victory while DRM gains substantive self-governance.',
    },
    {
      item: 'Transitional Justice and Accountability Mechanism',
      priority: 'important' as const,
      timeframe: 'phase-2' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'Civil Society', 'OHCHR'],
      linkages: ['International guarantees', 'DDR security guarantees for DRM leadership'],
      zoneOfPossibleAgreement: 'GoN position: no accountability mechanism; at most a truth commission without criminal jurisdiction. DRM position: international criminal tribunal for GoN military abuses. DRM leadership privately fears accountability for their own conduct. ZOPA: hybrid tribunal with OHCHR-endorsed mandate focused on most serious violations by all parties; truth commission with conditional amnesty for lower-level actors; reparations fund. Key lever: guarantee to DRM political and military leadership that truth commission participation is differentiated from criminal prosecution — creates incentive for voluntary disclosure.',
    },
    {
      item: 'Ceasefire Compliance and Monitoring Architecture',
      priority: 'core' as const,
      timeframe: 'phase-1' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'UNMN'],
      linkages: ['DDR framework', 'Humanitarian access', 'Karovia non-interference'],
      zoneOfPossibleAgreement: 'Strongest ZOPA of any agenda item — both parties are suffering from continued fighting and both face rising economic costs. GoN needs international legitimacy; DRM needs a breathing space. Agreement range: Joint Ceasefire Monitoring Committee with UNMN chair; daily incident reporting; 48-hour investigation protocol for violations; clear escalation ladder to UNSC. Karovia non-interference is the key variable — if Karovia continues arms supply, DRM has less incentive to observe ceasefire. Manage through UNSC targeted sanctions threat against Karovian officials.',
    },
    {
      item: 'International Guarantees and Implementation Monitoring Framework',
      priority: 'important' as const,
      timeframe: 'phase-3' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'AU', 'UN', 'EU', 'World Bank'],
      linkages: ['All core agenda items', 'DDR', 'Electoral framework'],
      zoneOfPossibleAgreement: 'Both parties need credible international guarantees — GoN to lock in international investment and legitimacy; DRM to ensure any agreement is enforced against GoN if commitments are breached. ZOPA: International Contact Group with binding reporting obligations to UNSC; phased release of reconstruction funds conditioned on implementation benchmarks; AU-deployed monitoring mission with enforcement authority. The World Bank and African Development Bank as co-administrators of the Provincial Development Fund provides the economic guarantee architecture.',
    },
    {
      item: 'Electoral Framework and Political Participation',
      priority: 'important' as const,
      timeframe: 'phase-2' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'UNDP', 'AU Election Observer Mission'],
      linkages: ['Eastern provincial autonomy', 'DDR framework', 'Transitional governance'],
      zoneOfPossibleAgreement: 'GoN position: elections on existing constitutional timeline with DRM disarmed and excluded from political participation. DRM position: transitional authority period with DRM included before elections. ZOPA: transitional period of 18-24 months with UNDP-supervised electoral commission; DRM political wing registers as party after signing agreement; internationally supervised elections with AU observation; interim power-sharing in national unity transitional cabinet. Timing linked to DDR milestones — elections only proceed when minimum cantonment benchmarks met.',
    },
  ],
  spoilerManagement: [
    {
      spoilerName: 'Karovia (regional patron of DRM)',
      spoilerType: 'greedy' as const,
      threat: 'Karovia continues covert arms supply and financial transfers to DRM, sustaining DRM\'s military capacity and reducing DRM\'s incentive to make concessions. If Karovia perceives a GoN-favourable settlement emerging, it may escalate materiel support to collapse the process and reset conditions. Karovia\'s primary interest is regional influence and access to Belara mining revenues — it will spoil any agreement that excludes it from economic gains.',
      strategy: 'cooptation' as const,
      tacticalApproach: 'Transform Karovia from external spoiler to vested process stakeholder. Offer Karovia a formal observer seat in the International Contact Group (legitimacy gain). Negotiate with Karovia a bilateral investment framework for post-settlement Belara Mining participation (economic cooptation). Simultaneously, prepare a UNSC targeted sanctions package against Karovian officials and entities involved in arms transfers — present as a credible deterrent in bilateral UN-Karovia diplomatic channel. The combination of economic inclusion offer and sanctions threat is the optimal cooptation-deterrence hybrid given Karovia\'s greedy profile.',
    },
    {
      spoilerName: 'GoN Military Hardliners (Armed Forces factions opposing any DRM political pathway)',
      spoilerType: 'limited' as const,
      threat: 'GoN military hardliners could undermine GoN political leadership\'s negotiating mandate by leaking sensitive concessions, conducting unauthorised military operations to derail ceasefire, or pressuring President Osei to withdraw from talks. Their primary objection is to any DDR framework that includes DRM integration into the security forces or grants political immunity to DRM commanders responsible for attacks on the military.',
      strategy: 'inclusion' as const,
      tacticalApproach: 'Include GoN Armed Forces Chief of Staff in the technical security track as a non-negotiating observer — gives military visibility without veto. Commission a separate Military Professional Development Programme (World Bank/DCAF funded) as a post-settlement benefit for GoN security forces, creating institutional interest in a successful settlement. Frame DDR as a security sector strengthening exercise for GoN, not a concession to DRM. Conduct private briefings to GoN military leadership on the economic costs of continued conflict (GDP impact, donor conditionality) to shift their calculus.',
    },
    {
      spoilerName: 'DRM Hardline Field Commanders (rejecting political leadership\'s concessions)',
      spoilerType: 'limited' as const,
      threat: 'DRM field commanders who have built parallel economic networks through resource extraction in controlled territories have an economic interest in continued conflict. They may reject any DDR framework that disrupts these networks, and could fracture the DRM militarily, creating a spoiler faction. The risk peaks at Phase 2 when DDR terms are being discussed.',
      strategy: 'cooptation' as const,
      tacticalApproach: 'Require DRM political leadership to demonstrate commander-level endorsement before advancing to Phase 3 — makes commanders necessary process participants. Design DDR economic package to include commander-level vocational pathways with above-average reintegration stipends (ILO and World Bank co-design). Offer a confidential legal opinion from OHCHR that commanders who voluntarily participate in the truth commission process face a different legal exposure than those who continue fighting. UNMN should maintain intelligence on commander networks and flag any fragmentation to the mediation team.',
    },
    {
      spoilerName: 'Eastern Province Civil Society and Local Armed Militias',
      spoilerType: 'greedy' as const,
      threat: 'Local militia leaders and community leaders in eastern provinces may reject any settlement that does not include direct civil society participation in negotiations, particularly on transitional justice and local governance. If excluded, they could organise community resistance to DDR implementation and undermine the electoral process by running spoiler candidates or encouraging boycotts.',
      strategy: 'inclusion' as const,
      tacticalApproach: 'Establish a Civil Society Consultative Forum (CSCF) running parallel to the main negotiating track — not a negotiating party, but formally consulted on transitional justice, electoral, and local governance items before they are finalised. The mediation team chairs CSCF monthly meetings and reports CSCF positions to the plenary. This provides legitimacy input without fragmenting the negotiating structure. Local militia leaders should be included in the DDR technical working group as observers.',
    },
  ],
  ripeness: {
    currentScore: 6.5,
    mutuallyHurtingStalemate: true,
    mutuallyEnticing: false,
    assessmentNote: 'Zartman\'s mutually hurting stalemate (MHS) is present: GoN has failed to achieve military victory despite 18 months of operations; mounting casualties and economic costs (estimated 4.2% GDP impact per IMF) are eroding domestic support. DRM cannot translate military holding capacity into territorial control or political leverage; Karovia\'s support is increasingly conditional. Both parties are "ripe" in the negative sense — neither can win, and the costs of continued fighting are rising. However, Zartman\'s mutually enticing opportunity (MEO) is NOT yet present: neither party has articulated a positive vision of a negotiated future that their constituents would accept. Ripeness score: 6.5/10. The window is open but fragile. Key indicators to monitor: GoN election calendar (pressure to resolve before elections reduces GoN\'s incentive to make concessions after them); Karovia\'s economic situation (declining oil revenues increasing Karovia\'s own cost-benefit calculation); DRM leadership cohesion (any fragmentation reduces DRM\'s negotiating authority and ripeness).',
    interventionWindow: 'The current intervention window is estimated at 9-15 months. It is most likely to close in the downward direction if: (1) GoN elections occur without a settlement, removing the electoral incentive that currently motivates GoN to resolve; (2) Karovia escalates support to DRM following the failure of diplomatic overtures; or (3) DRM splinters into negotiating and non-negotiating factions. The window could be extended by: early economic dividends visible to both communities, sustained international financial pressure on Karovia, and a high-profile international political initiative (UNSC ministerial session on Nordalia) that raises the cost of non-engagement.',
  },
  guarantees: [
    {
      type: 'security' as const,
      mechanism: 'UNMN mandate expansion to Chapter VII enforcement authority covering ceasefire monitoring, DDR verification, and protection of civilians in cantonment sites. Joint Implementation Commission with authority to report violations directly to UNSC, triggering automatic sanctions review. AU-deployed rapid reaction force (brigade-strength) pre-positioned in neighbouring territory as deterrent against agreement collapse.',
      guarantor: 'United Nations Security Council (UNMN mandate), African Union Peace and Security Council (AU force), with contributing troop nations from Rwanda, Ghana, and Tanzania (confirmed as acceptable to both parties).',
    },
    {
      type: 'economic' as const,
      mechanism: 'Belara Mining Provincial Development Fund administered jointly by World Bank and African Development Bank with quarterly independent audits. All fund disbursements conditional on implementation benchmarks verified by JIC. International investment guarantee scheme (MIGA) covering private investment in eastern provinces. USD 2.4 billion international reconstruction pledge managed through a Nordalia Recovery Trust Fund.',
      guarantor: 'World Bank Group, African Development Bank, International Monetary Fund (fiscal monitoring), European Union (largest bilateral reconstruction donor), International Contact Group member states.',
    },
    {
      type: 'political' as const,
      mechanism: 'International Contact Group (ICG) comprising AU, UN, EU, and key bilateral actors meets quarterly at Ministerial level. ICG has authority to publicly name parties failing to implement agreed commitments. UNSC reporting cycle: Joint Implementation Commission reports every 90 days; UNSC holds a dedicated Nordalia session every 6 months for the 3-year implementation period.',
      guarantor: 'UN Security Council (permanent political anchor), African Union Commission, European Union External Action Service, International Contact Group member states (France, Germany, UK, Kenya, Nigeria, Norway).',
    },
    {
      type: 'international' as const,
      mechanism: 'Comprehensive peace agreement registered with the UN Treaty Collection under Article 102 UN Charter, conferring legal status and creating an international legal obligation on all parties. Agreement includes an ICSID arbitration clause for disputes over the economic provisions. OHCHR field presence in Nordalia with human rights monitoring mandate for the 5-year implementation period.',
      guarantor: 'United Nations Secretariat (treaty registration and OHCHR deployment), International Centre for Settlement of Investment Disputes (economic arbitration), International Criminal Court (deterrent role — situation already under preliminary examination).',
    },
  ],
  exitStrategy: 'CONCORDIA\'s mediation engagement concludes successfully when four interconnected conditions are met: (1) the Comprehensive Peace Agreement has been in verified implementation for 24 consecutive months with JIC certification that over 80% of agreed benchmarks are on track; (2) the first internationally supervised post-conflict elections have been held with AU and UN certification of credibility, and an elected government has taken office; (3) DDR Phase 1 and Phase 2 cantonment targets are met (minimum 70% of DRM fighters processed), with reintegration stipends in payment and vocational training enrolled; (4) the Provincial Development Fund has made at least two annual disbursements to eastern provinces with independent audit sign-off. At that point, the UN DPPA mediation team transitions its mandate to a lighter-touch UNDP governance support programme. UNMN downsizes from an enforcement mandate to a monitoring mandate. The International Contact Group reduces to six-monthly political consultations. Full exit requires a specific UNSC resolution terminating or transforming the UNMN mandate, which should be timed to coincide with the second post-conflict election cycle. Premature exit — before the two-election cycle — is the single greatest structural risk to durable peace and must be resisted despite donor pressure to close the file.',
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: Request, user) => {
  try {
    const creditCheck = await checkAndDeductCredits('ai_concordia', 'CONCORDIA mediation design');
    if (!creditCheck.allowed) return creditCheck.response!;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    const body = await request.json();

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;

    const { situation } = validation.data;

    const sitContext = situation
      ? buildToolContext(situation as unknown as Situation)
      : '';

    const situationId = (situation as unknown as Situation)?.id ?? '';

    // Graph context — loads negotiation_prep, stakeholder_map, commitment_scan
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'mediation_design')
      : '';

    // Web-grounded context — live intelligence to ground the analysis
    const webCtx = situation
      ? await buildWebGroundedContext(
          {
            name: (situation as unknown as Situation).name,
            region: (situation as unknown as Situation).region,
            actors: (situation as unknown as Situation).actors as string[] | undefined,
            description: (situation as unknown as Situation).description,
          },
          'concordia',
          user.uid,
        )
      : '';

    const result = await generateText({
      model: getThinkingModel(),
      output: Output.object({ schema: ConcordiaSchema }),
      system: `You are CONCORDIA — the PRAXIS Mediation Design and Peace Process Architecture engine. You are a senior-level peace process architect with experience designing mediation processes for UN DPPA, the African Union, and the Carter Center across intrastate, interstate, and hybrid conflict contexts.

Your analytical framework integrates five foundational bodies of theory:

**1. Berghof Mediation Stages Framework**
Apply the Berghof pre-negotiation → negotiation → implementation stage model. Pre-negotiation focuses on procedural commitments and CBMs. Negotiation moves from less contested to most contested issues. Implementation requires front-loaded monitoring architecture — design it at the start, not as an afterthought. Each phase has clear handoff criteria.

**2. Zartman Ripeness Theory**
Assess whether the conflict is "ripe" for negotiation through two lenses:
- Mutually Hurting Stalemate (MHS): neither party can achieve its goals at acceptable cost; the pain of continuing exceeds the expected gain.
- Mutually Enticing Opportunity (MEO): a positive vision of a negotiated future that both parties prefer over continued conflict.
Score ripeness 0-10. If the conflict is not ripe (below 4), recommend ripening strategies before process design. Identify the intervention window and what could close it.

**3. Stedman Spoiler Typology**
Classify every potential spoiler as:
- Total: rejects any settlement that does not achieve their maximalist objective; cannot be appeased.
- Limited: objects to specific terms; can be included if terms change.
- Greedy: seeks to maximise gains from the peace process itself; responds to incentives.
Match the management strategy to the spoiler type: inclusion for limited, cooptation for greedy, marginalization or deterrence for total.

**4. Fisher-Ury Interests vs. Positions**
For every agenda item, distinguish stated positions from underlying interests. The ZOPA always lies at the intersection of underlying interests, not positions. Surface the real interests driving each party's stated demands. Design agenda sequencing to start with issues where ZOPA is widest (usually economic or technical) before moving to core political and identity issues where ZOPA is narrowest.

**5. Zone of Possible Agreement (ZOPA)**
For each agenda item: identify the outer bounds of each party's acceptable range, find the overlap, and characterise the ZOPA. If no ZOPA currently exists, identify what would need to change (external pressure, new information, leadership change) to create one. Use package deal architecture to link items with narrow ZOPAs to items with wide ZOPAs.

**Process Design Principles**
- Format selection: match to trust level (shuttle < proximity < direct < multilateral)
- Venue: neutral, accessible, symbolically appropriate
- Sequencing: economic/technical → security → political (Lax/Sebenius momentum principle)
- CBMs: reversible, verifiable, confidence-generating, sequenced before phase transitions
- Nothing is agreed until everything is agreed (single undertaking principle)
- Implementation architecture must be designed from day one
- Gender: apply UNSCR 1325 in mediator composition and agenda item design

Write to UN diplomatic professional standards. Be specific to the actual parties and conflict context provided. Produce analysis that a working mediation team can use operationally.`,
      prompt: `${webCtx ? `${webCtx}\n\n` : ''}${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Design a comprehensive CONCORDIA mediation architecture for this conflict situation.

## YOUR TASK

Apply all five analytical frameworks (Berghof stages, Zartman ripeness, Stedman spoilers, Fisher-Ury interests, ZOPA analysis) to produce a complete, operationally deployable peace process design.

**Process Design**
Select the appropriate mediation format based on current trust levels and political context. Identify the optimal venue and mediator profile. Explain your choices with reference to the specific conflict dynamics.

**Phase Architecture (minimum 3 phases)**
Design sequenced phases covering: (1) Pre-negotiation and confidence-building; (2) Substantive negotiation (all core tracks); (3) Implementation architecture and agreement signature. For each phase: specific objectives, concrete activities, phase-specific CBMs, risks, and measurable success criteria that must be met before advancing.

**Agenda Architecture**
Identify all core agenda items. For each item: priority classification, negotiating phase, which parties must agree, linkages to other items, and a full ZOPA analysis applying Fisher-Ury (distinguish positions from interests; identify the realistic zone of agreement).

**Spoiler Management**
Identify all actors likely to obstruct the process. For each: classify using Stedman typology (total/limited/greedy), describe the specific threat they pose, select the appropriate management strategy, and provide tactical guidance.

**Ripeness Assessment**
Apply Zartman: is a mutually hurting stalemate (MHS) present? Is a mutually enticing opportunity (MEO) present? Score ripeness 0-10. Assess the intervention window — how long is it open and what could close it?

**Guarantees**
Design the guarantee architecture required to make any agreement credible: security guarantees (international presence/enforcement), economic guarantees (fund administration, conditionality), political guarantees (Contact Group, UNSC reporting), and international legal guarantees (treaty registration, dispute resolution).

**Exit Strategy**
Define the specific conditions under which the mediation mandate concludes successfully. What benchmarks must be met? What monitoring architecture remains after the mediation team withdraws? How is the handoff managed?

Be specific, operationally grounded, and analytically rigorous. Reference actors by their exact names from the situation context.`,
    });

    if (situationId) {
      await writeToolDataServer(
        user.uid,
        situationId,
        'concordia',
        result.output as Record<string, unknown>,
      );
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'concordia');
  }
});
