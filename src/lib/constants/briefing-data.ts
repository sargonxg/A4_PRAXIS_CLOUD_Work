export interface BriefingSlide {
  id: string;
  type: 'title' | 'summary' | 'map' | 'timeline' | 'risk' | 'actions' | 'discussion';
  title: string;
  content: string;
  speakerNotes: string;
  sources?: string[];
}

export const DEMO_MORNING_BRIEF: BriefingSlide[] = [
  {
    id: 'slide-1-title',
    type: 'title',
    title: 'NORDALIA CRISIS — Morning Intelligence Brief',
    content: `21 March 2026

PRAXIS Intelligence Platform

RESTRICTED`,
    speakerNotes:
      'Good morning. This briefing covers overnight developments in the Nordalia Crisis as of 0600 UTC. All information is classified RESTRICTED and should not be shared outside authorized channels. Please hold questions until the discussion segment.',
    sources: ['PRAXIS Intelligence Platform', 'TACITUS Analytical Division'],
  },
  {
    id: 'slide-2-summary',
    type: 'summary',
    title: 'Executive Summary',
    content: `- **Ceasefire under strain:** Overnight EMLF troop movements detected near the Kelvara Corridor suggest preparations for a possible repositioning, raising the risk of a ceasefire breach within 48–72 hours.

- **Risk level elevated to 87/100:** The Glasl escalation model now indicates Stage 6 (threat strategies), up from Stage 5 yesterday. Diplomatic back-channels remain active but fragile.

- **Immediate priority — humanitarian corridor:** AUNM convoy carrying medical supplies is stalled at Checkpoint Bravo pending government clearance. Failure to deliver within 24 hours will trigger a public health emergency in the Vostara enclave.`,
    speakerNotes:
      'Emphasize that the ceasefire has not yet been violated, but indicators are trending negative. Leadership should be aware that the humanitarian corridor issue is time-sensitive and may require direct intervention with the Nordalia government today.',
    sources: [
      'PRAXIS Early Warning System',
      'AUNM OCHA Field Report #247',
      'Glasl Escalation Model Assessment',
    ],
  },
  {
    id: 'slide-3-map',
    type: 'map',
    title: 'Situation Overview',
    content: `The Nordalia ceasefire, brokered on 14 March, remains nominally in effect but is under increasing strain. Government forces have consolidated positions along the eastern ridge line while the EMLF has moved reserve units forward to staging areas near the Kelvara Corridor — a pattern consistent with pre-offensive preparations observed in the January escalation.

The AUNM peacekeeping contingent (2,400 personnel) has completed deployment to Sector 3 but remains under-resourced for its mandate. Patrol coverage along the line of contact is approximately 60% of what the mission plan requires.

The humanitarian corridor between Meridia and the Vostara enclave processed 12 aid trucks yesterday, down from 18 the day before. Government checkpoints are imposing additional inspection delays citing security concerns. An estimated 45,000 civilians in the enclave depend on this corridor for essential supplies.

International diplomatic engagement remains active: the Special Envoy held separate calls with both parties yesterday evening, and a trilateral session is tentatively scheduled for 23 March in Geneva.`,
    speakerNotes:
      'The map data is derived from satellite imagery analysis and AUNM field reports as of 0400 UTC. Note that the EMLF repositioning does not yet constitute a ceasefire violation under the agreed terms, but it significantly narrows the margin for miscalculation.',
    sources: [
      'AUNM Force Commander Daily Sitrep',
      'Satellite Imagery Analysis — 20 March 2026',
      'OCHA Humanitarian Access Report',
    ],
  },
  {
    id: 'slide-4-timeline',
    type: 'timeline',
    title: 'Key Developments — Last 24 Hours',
    content: `- **Military movements (HIGH significance):** EMLF 3rd Brigade reserve elements observed moving from rear bases to forward staging areas near Kelvara Corridor. Estimated 800–1,200 personnel with light armored vehicles. Government forces responded by reinforcing eastern ridge positions with additional artillery assets.

- **Diplomatic contacts (MEDIUM significance):** Special Envoy Mariana Solberg held 45-minute call with EMLF political leader Darian Voss, followed by a 30-minute call with Nordalia Foreign Minister Aleksi Rohn. Both parties reaffirmed commitment to the ceasefire framework but raised mutual accusations of violations. Geneva trilateral session confirmed for 23 March.

- **Humanitarian update (HIGH significance):** AUNM medical convoy (6 trucks, carrying antibiotics and surgical supplies) halted at Checkpoint Bravo since 1400 UTC yesterday. Government authorities cite intelligence about possible weapons smuggling. OCHA has formally protested the delay. Vostara Central Hospital reports 48 hours of critical supply reserves remaining.

- **Narrative shift (MEDIUM significance):** Nordalia state media ran prime-time segment accusing EMLF of using humanitarian corridors for military resupply — framing that could be used to justify further access restrictions. EMLF-aligned social media channels responded with claims of government atrocities in Sector 2. Information environment is deteriorating.`,
    speakerNotes:
      'The military movements and humanitarian blockage are the two most time-sensitive items. The narrative shift in state media may signal that the government is preparing domestic opinion for a harder line on humanitarian access, which would have cascading effects.',
    sources: [
      'PRAXIS SIGINT Analysis',
      'Special Envoy Office Readout',
      'OCHA Access Monitoring',
      'PRAXIS Media Compass — Narrative Tracking',
    ],
  },
  {
    id: 'slide-5-risk',
    type: 'risk',
    title: 'Risk Assessment',
    content: `**Overall Risk Score: 87/100** — Trend: ↑ Escalating

**Key Indicators:**

- **Ceasefire durability:** 32/100 (critical) — Down from 45 yesterday. Forward military deployments by both parties significantly reduce buffer zones and increase the probability of accidental or intentional engagement.

- **Humanitarian access:** 28/100 (critical) — Checkpoint blockages threaten supply continuity. If the Vostara corridor is closed for >48h, OCHA triggers emergency protocols and the crisis enters a new phase.

- **Diplomatic momentum:** 54/100 (moderate) — The Geneva session on 23 March provides a window, but mutual accusations are eroding trust. The Special Envoy's shuttle diplomacy is the primary stabilizing factor.

- **Information environment:** 41/100 (concerning) — State media narratives are hardening. Social media polarization index increased 23% overnight. Disinformation campaigns risk undermining public support for negotiations.

**Glasl Escalation Stage:** 6 of 9 (Threat Strategies) — Parties are issuing implicit threats through military positioning while maintaining diplomatic engagement. The transition to Stage 7 (Limited Destructive Blows) would represent a qualitative shift requiring immediate crisis response.`,
    speakerNotes:
      'The 87/100 overall score places this in the "critical" band. The most concerning single indicator is humanitarian access at 28 — this is the issue most likely to trigger a cascade in the next 24 hours. Recommend highlighting the Glasl stage assessment for leadership context.',
    sources: [
      'PRAXIS Early Warning Model v2.3',
      'Glasl Escalation Framework Analysis',
      'OCHA Humanitarian Access Index',
    ],
  },
  {
    id: 'slide-6-actions',
    type: 'actions',
    title: 'Recommended Actions',
    content: `- **IMMEDIATE — Humanitarian corridor (next 6 hours):** Engage Nordalia government at ministerial level to secure release of the stalled medical convoy at Checkpoint Bravo. Propose a joint inspection mechanism as a compromise that addresses government security concerns while restoring supply flow. Escalate to Security Council President if no movement by 1200 UTC.

- **URGENT — Military de-escalation (next 24 hours):** Request AUNM Force Commander to increase patrol frequency along the Kelvara Corridor and establish additional observation posts. Propose to both parties a mutual 5km pullback from forward positions as a confidence-building measure ahead of the Geneva session.

- **PRIORITY — Geneva preparation (next 48 hours):** Brief the Special Envoy on updated risk assessment and recommend the Geneva agenda prioritize: (1) humanitarian access guarantees with verification, (2) mutual withdrawal timeline, (3) ceasefire monitoring mechanism strengthening. Prepare option papers for each agenda item.

- **ONGOING — Information environment (continuous):** Task PRAXIS Media Compass to monitor state media and social channels for escalatory narratives. Prepare a strategic communications advisory for AUNM spokesperson to counter disinformation about humanitarian corridor misuse. Coordinate with Platform moderation teams on identified bot networks.`,
    speakerNotes:
      'The humanitarian corridor action is the most time-sensitive. Recommend the briefing recipient authorize the ministerial engagement immediately after this briefing. The Geneva preparation timeline is tight — option papers should be commissioned today.',
    sources: [
      'PRAXIS Scenario Planning Module',
      'AUNM Mission Planning Office',
      'DPPA Best Practices — Crisis De-escalation',
    ],
  },
  {
    id: 'slide-7-discussion',
    type: 'discussion',
    title: 'Discussion Points',
    content: `- **What is our red line on the humanitarian corridor?** If the Nordalia government does not release the medical convoy within the next 12 hours, do we escalate to a formal Security Council briefing? What are the implications for the broader relationship with the government if we do?

- **How do we assess EMLF intentions?** The forward troop movements could represent genuine offensive preparation, a negotiating tactic to strengthen their position ahead of Geneva, or defensive repositioning in response to government reinforcements. Which interpretation should guide our response, and what additional intelligence would help clarify?

- **Is the Geneva timeline still viable?** With the ceasefire under increasing strain and trust eroding, is the 23 March trilateral session likely to produce meaningful outcomes, or should we consider whether an earlier emergency session — or a different format — would be more effective?`,
    speakerNotes:
      'These questions are designed to elicit strategic guidance from leadership. There are no clear right answers — the goal is to surface assumptions and ensure alignment on priorities before the next action cycle. Allow at least 10 minutes for this discussion.',
    sources: [
      'PRAXIS Analytical Framework',
      'Historical Parallel Analysis — Ceasefire Dynamics',
    ],
  },
];
