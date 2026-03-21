// ---------------------------------------------------------------------------
// Pre-computed AI responses for the Nordalia Crisis demo case.
// These are investor-ready, analytically rigorous outputs designed to showcase
// PRAXIS capabilities without requiring a live AI API key.
// ---------------------------------------------------------------------------

// ── Chat Responses ──────────────────────────────────────────────────────────

const CHAT_GREETING = `Welcome to PRAXIS. I'm your conflict intelligence analyst, trained in UN DPPA analytical frameworks, Glasl escalation modelling, and Fisher/Ury interest-based negotiation analysis.

I currently have the **Nordalia Crisis** loaded as the active conflict context, with structured data on 8 primary actors, 14 relationship edges, and 23 key events since March 2024.

How can I assist your analysis today? I can:
- **Brief you** on the current situation and key dynamics
- **Assess escalation risks** using the Glasl 9-stage model
- **Analyze scenarios** (e.g., ceasefire collapse, election delay, external intervention)
- **Generate talking points** for Security Council or regional body briefings
- **Map actor interests** using positional vs. interest-based frameworks

What would you like to explore?`;

const CHAT_KEY_ACTORS = `## Key Actors in the Nordalia Crisis

Based on the structured conflict graph and open-source reporting through March 2026, there are five principal actors shaping the trajectory of this conflict. I'll outline each with their stated positions, underlying interests, and key relationships.

---

### 1. Government of Nordalia (GoN)
**Type:** State actor | **Influence:** Very High

Led by President Amara Osei following the disputed March 2024 elections. The GoN controls the Armed Forces of Nordalia (AFN, ~45,000 personnel), state revenue institutions, and the capital. It retains international recognition from the AU and RECONA, though its democratic legitimacy is contested.

- **Stated position:** The elections were legitimate; the DRM is a terrorist insurgency that must disarm before any political dialogue.
- **Underlying interests:** Regime survival; continued control of rare earth revenues in the Eastern Provinces; preventing precedent of armed opposition forcing power-sharing (sources: ICG Africa Report No. 312, March 2026; UNMN SRSG briefing to UNSC, 14 Feb 2026).
- **Key relationships:** Patron-client relationship with Karovia (military support); adversarial with DRM; transactional with UNMN (accepts peacekeeping presence but constrains mandate implementation).

### 2. Democratic Reform Movement (DRM)
**Type:** Armed group | **Influence:** High

Led by Commander Kwame Asante, a former parliamentarian. The DRM fields approximately 8,000 fighters in three corps across the Eastern Provinces, with an administrative arm (Eastern Provincial Authority) governing occupied territory. The movement evolved from a peaceful pro-democracy coalition following the July 2024 government crackdown.

- **Stated position:** The 2024 elections were fraudulent; new internationally supervised elections must precede any disarmament.
- **Underlying interests:** Political inclusion for eastern communities; equitable resource-sharing; security guarantees for DRM leadership (sources: DRM communique to AU Panel, 8 Jan 2026; diaspora fundraising analysis, Nordalian Independent Media Network).
- **Key relationships:** Political and logistical support from Westmark; contested but functional communication channel with UNMN; adversarial with GoN and Karovia.

### 3. UN Mission in Nordalia (UNMN)
**Type:** International organization | **Influence:** High

Established by UNSC Resolution 2847 under Chapter VII, led by SRSG Maria Santos. Deploys ~12,000 uniformed peacekeepers from 18 TCCs. Mandated for civilian protection, ceasefire monitoring, humanitarian access, and political process facilitation.

- **Stated position:** Inclusive political dialogue leading to credible elections within the AU Roadmap framework.
- **Underlying interests:** Mandate renewal (next review: September 2026); demonstrating mission effectiveness amid Security Council fatigue; managing P5 divisions on Nordalia (sources: UNSC meeting records S/PV.9487; DPA internal planning documents referenced in Security Council Report forecast, Feb 2026).
- **Key relationships:** Coordination with AU Panel of the Wise on mediation; working relationship with both parties (strained with GoN over freedom of movement; limited access in DRM areas); dependent on Karovia and Westmark restraint for ceasefire viability.

### 4. Republic of Karovia
**Type:** State actor (regional) | **Influence:** Moderate-High

Principal external patron of the GoN, bound by the 2019 bilateral defense treaty. Provides military equipment, logistics, intelligence cooperation, and has seconded military advisors to the AFN. Widely assessed to be supplying ammunition in potential violation of the UNSC arms embargo (Panel of Experts interim report, S/2025/892).

- **Stated position:** Supports sovereignty and territorial integrity of Nordalia; opposes "external interference" in internal affairs.
- **Underlying interests:** Preserving preferential access to Nordalia's rare earth deposits under the 2021 Belara-Karovia commercial framework; preventing DRM success as a destabilizing precedent for its own restive eastern provinces; maintaining regional influence vis-a-vis Westmark (sources: Karovian parliamentary debates, Nov 2025; SIPRI arms transfer database; satellite imagery analysis by Conflict Armament Research).
- **Key relationships:** Patron of GoN; strategic rival of Westmark; obstructive posture toward UNMN mandate expansion in UNSC (supported by one P5 member).

### 5. Federal Republic of Westmark
**Type:** State actor (external) | **Influence:** Moderate-High

Principal external supporter of the DRM's political legitimacy. Hosts ~340,000 Nordalian refugees. Has imposed targeted sanctions on 23 senior GoN officials and lobbied for UNSC measures. Provides non-lethal support to the DRM including communications equipment and medical supplies; denies military assistance, though the GoN and Karovia allege otherwise.

- **Stated position:** Democratic elections are the only path to legitimacy; the GoN must accept power-sharing as a precondition for stability.
- **Underlying interests:** Containing refugee flows; countering Karovian regional influence; positioning as democratic governance champion in the sub-region (sources: Westmark Foreign Ministry statements; parliamentary committee hearings on Nordalia policy, Jan 2026; refugee agency UNHCR data).
- **Key relationships:** Political sponsor of DRM; strategic rival of Karovia; cooperative relationship with UNMN on sanctions implementation; supporter of AU mediation track.

---

**Analytical note:** The conflict dyad is not simply GoN vs. DRM. The Karovia-Westmark proxy dimension significantly complicates mediation because each external patron has sufficient leverage to enable their client's veto over peace process concessions. Any viable settlement will likely require a parallel track addressing regional security guarantees. This mirrors dynamics observed in similar proxy-mediation configurations (cf. Cunningham 2010 on veto players in civil war negotiations).

*Confidence: High. Based on structured conflict graph data, UNMN reporting, and cross-referenced open-source analysis.*`;

// ── Scenario Analysis ───────────────────────────────────────────────────────

const SCENARIO_CEASEFIRE_COLLAPSE = `## Scenario Analysis: Collapse of the September 2025 Ceasefire

**Scenario trigger:** The September 2025 ceasefire agreement, brokered by UNMN and the AU Panel of the Wise, collapses due to either a deliberate military offensive or an escalatory incident that neither party can walk back from.

**Baseline assessment:** The ceasefire is currently assessed as **fragile but holding** (UNMN SRSG briefing, 14 Feb 2026). There have been 47 documented violations since September, predominantly localized skirmishes and freedom-of-movement restrictions. A full collapse remains a medium-probability, high-impact scenario.

---

### Political Dimension

A ceasefire collapse would **immediately polarize the Security Council**. Karovia would frame it as DRM aggression justifying GoN self-defense; Westmark would attribute it to GoN provocation. The resulting P5 deadlock would likely delay UNMN mandate renewal (due September 2026) and could trigger a drawdown debate.

Domestically, President Osei would face pressure from AFN hardliners to pursue a military solution in the Eastern Provinces. The DRM's political wing would lose influence to field commanders, narrowing the space for negotiated outcomes.

The AU Roadmap for Elections — the agreed political framework — would be effectively dead. Reconstituting a political process after ceasefire collapse typically requires 12-18 months in comparable cases (cf. South Sudan 2013-2015, CAR 2012-2014).

### Security Dimension

**Most likely military scenario:** GoN launches limited offensive operations to recapture the Kessara corridor, the strategic chokepoint controlling eastern supply routes. DRM responds with asymmetric operations targeting AFN logistics in the central plateau.

- **AFN capabilities:** Numerical superiority (~45,000 vs. ~8,000), armour, and air assets. However, limited capacity for sustained operations in the eastern terrain without Karovian logistics support.
- **DRM capabilities:** Territorial knowledge, popular support in eastern communities, cross-border supply lines via Westmark. Capable of protracted insurgency but unlikely to hold fixed positions against concentrated AFN assault.

UNMN peacekeepers would face acute protection-of-civilians demands with insufficient troop strength. The mission's 12,000 uniformed personnel are already stretched across a country the size of France. A ceasefire collapse could generate multiple simultaneous PoC crises exceeding mission capacity.

### Humanitarian Dimension

Current displacement: **1.2 million IDPs** and **340,000 refugees** in Westmark (OCHA situation report, 28 Feb 2026).

Ceasefire collapse would likely trigger:
- An additional **200,000-400,000 new displacements** within 60 days (based on displacement modelling from comparable conflict escalations)
- Closure of the three humanitarian corridors negotiated under the ceasefire, cutting access to approximately 680,000 people in DRM-controlled areas
- Refugee surge into Westmark, further straining host community capacity and politically complicating Westmark's mediation role
- Food security crisis in the Eastern Provinces, where the next planting season (April-May) would be disrupted

### Economic Dimension

Nordalia's rare earth mining operations in the Eastern Provinces — accounting for approximately 18% of GDP and 40% of export revenues — would cease. This would:
- Collapse government fiscal revenues within 3-4 months, accelerating currency depreciation (the Nordalian krone has already lost 34% since March 2024)
- Disrupt global rare earth supply chains, drawing additional international attention but potentially complicating mediation by raising the economic stakes for external actors
- Eliminate the economic incentive structure underlying a resource-sharing settlement

### Regional Dimension

A ceasefire collapse would **escalate the Karovia-Westmark proxy competition**. Karovia would likely increase military supplies to the AFN (further violating the arms embargo). Westmark would face domestic pressure to move beyond non-lethal support.

RECONA (the regional economic community) would be forced to activate its conflict prevention mechanism, but its capacity for deployment is limited and politically constrained by Karovian influence.

There is a **low but non-trivial risk** (assessed at 10-15%) that direct Karovian military intervention — framed as "stabilization support" under the 2019 bilateral treaty — could occur if the GoN faces existential military pressure in the capital approaches.

---

### Probabilistic Outcome Assessment

| Scenario | Probability | Description |
|----------|------------|-------------|
| **Most likely** | 50% | Limited escalation followed by international pressure producing a new, weaker ceasefire within 4-6 months. Political process delayed by 12+ months. Humanitarian costs significant but contained. |
| **Best case** | 20% | Escalatory incident is contained through rapid UNMN/AU intervention. Ceasefire is reinforced with improved monitoring mechanisms. Crisis creates political will for accelerated negotiations. |
| **Worst case** | 30% | Full-scale military offensive triggers mass displacement, humanitarian catastrophe, and regional proxy escalation. Conflict enters Glasl Stage 6-7 (Threats/Destructive Blows). UNMN mandate becomes untenable. Recovery timeline: 3-5 years. |

---

### Policy Implications

1. **Prevention is critical.** The cost differential between ceasefire reinforcement and post-collapse stabilization is estimated at 1:8 (based on UN Peacebuilding Fund methodology).
2. **Early warning indicators to monitor:** AFN troop movements near the Kessara corridor; DRM arms procurement patterns; Karovian military logistics flights to Nordalia City; diplomatic signalling in UNSC informal consultations.
3. **Contingency planning:** UNMN should pre-position PoC assets in the three most vulnerable eastern population centres. OCHA should activate Level 3 emergency preparedness protocols.

*Confidence: Medium-High. Assessment draws on UNMN reporting, OCHA data, arms embargo monitoring, and comparative case analysis. Key uncertainty: the role of domestic political dynamics within both the GoN and DRM leadership that may not be visible in open-source reporting.*`;

// ── Escalation Assessment ───────────────────────────────────────────────────

const ESCALATION_ASSESSMENT = `## Glasl Escalation Model Assessment: Nordalia Crisis

**Current Stage: 5 — Loss of Face** (out of 9 stages)
**Assessment date:** March 2026
**Trend:** Volatile with intermittent regression to Stage 4 behaviours

---

### Model Framework

Friedrich Glasl's 9-stage escalation model describes conflict intensification across three thresholds:
- **Stages 1-3 (Win-Win):** Hardening, Debates, Actions — parties still seek mutual solutions
- **Stages 4-6 (Win-Lose):** Coalitions, Loss of Face, Threats — parties seek to prevail at the other's expense
- **Stages 7-9 (Lose-Lose):** Destructive Blows, Fragmentation, Abyss — parties accept self-harm to destroy the opponent

The Nordalia conflict has crossed the second threshold (Win-Lose) and is firmly at Stage 5 with concerning indicators of Stage 6 dynamics.

---

### Stage 5 Indicators Present

**Systematic dehumanization and delegitimization campaigns:**
- GoN state media consistently refers to the DRM as "terrorists" and "foreign puppets," refusing to acknowledge their domestic political origins (Nordalian State Broadcasting transcripts, monitored by NIMN, Jan-Mar 2026)
- DRM propaganda characterizes President Osei as a "war criminal" and the GoN as an "illegitimate junta," rejecting any framework that includes the current government (DRM Radio Free East broadcasts; diaspora social media analysis)
- Both parties have invested heavily in international reputation warfare, making compromise politically costly for leaders who have publicly committed to maximalist positions

**Public moral framing and identity entrenchment:**
- The conflict has shifted from a dispute over electoral outcomes (a negotiable interest) to a contest over identity, legitimacy, and historical justice (non-negotiable values) — a classic Stage 5 marker
- The GoN frames concessions as "rewarding terrorism"; the DRM frames concessions as "betraying the martyrs of the July 2024 crackdown"
- Civil society actors who advocate dialogue face accusations of treachery from both sides (three CSCN leaders arrested; DRM has expelled two moderate eastern chiefs)

**Coalition hardening with external patrons:**
- Karovia and Westmark have locked into patron-client relationships that reinforce each party's sense of righteousness and reduce their perception of risk from escalation
- The P5 split in the Security Council mirrors and amplifies the domestic polarization

---

### Escalation Drivers (Pushing Toward Stage 6)

1. **Arms embargo erosion.** The Panel of Experts' interim report (S/2025/892) documents continued arms flows to both parties. Military capability accumulation lowers the barrier to escalation beyond the ceasefire framework.

2. **Spoiler dynamics.** Hardliners within both the AFN officer corps and the DRM field command structure have incentives to provoke escalation. At least two documented ceasefire violations appear to have been initiated by mid-level commanders acting without central authorization (UNMN ceasefire monitoring reports, Oct-Dec 2025).

3. **Economic pressure.** The 34% currency depreciation and fiscal contraction create domestic political pressure on President Osei to "resolve" the crisis through military means, as economic recovery is impossible without control of eastern mineral resources.

4. **Election timeline.** The AU Roadmap calls for transitional elections by Q2 2027. As this deadline approaches without progress, both parties face incentives to establish military facts on the ground.

5. **Diaspora radicalization.** The Nordalian diaspora in Westmark (~340,000) is a significant funding source for the DRM and has become increasingly radicalized, creating bottom-up pressure against compromise.

---

### De-escalation Opportunities (Pulling Back Toward Stage 4)

1. **Economic interdependence.** Both parties recognize that the rare earth sector requires stability to function. A resource-sharing framework could provide a material incentive for restraint that transcends the identity-based framing (cf. Fisher/Ury: shift from positions to interests).

2. **War weariness.** There are credible reports of declining DRM recruitment in the eastern provinces and growing AFN desertion rates. Neither side's constituency has unlimited tolerance for the costs of continued conflict (CSCN survey data, Dec 2025; UNMN human rights monitoring).

3. **SRSG Santos's back-channel.** The SRSG maintains a private communication channel with both President Osei and Commander Asante. This channel survived the November 2025 crisis and represents the most viable pathway for confidence-building measures.

4. **AU Panel credibility.** The AU Panel of the Wise retains unique access and credibility with both parties and has successfully facilitated two prisoner exchanges, demonstrating that cooperation on practical issues remains possible.

5. **Civil society resilience.** Despite repression, the CSCN's network of 47 organizations continues to advocate for dialogue and has documented the human costs of conflict in ways that create accountability pressure on both parties.

---

### Trigger Risks (Events That Could Catalyze Stage 6 Transition)

| Trigger | Probability (90 days) | Impact |
|---------|----------------------|--------|
| Major ceasefire violation at Kessara corridor | 35% | Would likely trigger retaliatory cycle and full ceasefire collapse |
| Assassination of senior political/military figure | 10% | Extreme escalatory potential; would likely push immediately to Stage 6-7 |
| Karovian military advisors killed in DRM operation | 15% | Could trigger Karovian escalation under bilateral defense treaty |
| UNSC mandate renewal failure | 10% (by Sep 2026) | Would remove primary constraint on both parties' military ambitions |
| Mass atrocity event documented on social media | 20% | Would harden international positions and reduce space for diplomatic ambiguity |

---

### Stage 6 Characteristics (Threats) — Early Warning Indicators

If the conflict transitions to Stage 6, we would expect to observe:
- **Ultimatums** framed as final offers with explicit consequences for non-compliance
- **Demonstrative military actions** designed to signal capability and resolve (e.g., AFN air strikes on DRM-adjacent civilian infrastructure; DRM attacks on government economic assets)
- **Coercive diplomacy** replacing negotiation — threats of sanctions escalation, military intervention, or political recognition withdrawal
- **Complete breakdown of direct communication** between parties, with all interaction mediated through third parties

**Current assessment:** Two of these four indicators are partially present (demonstrative actions and increasing reliance on mediated communication). The Nordalia conflict is at the **upper boundary of Stage 5** with a meaningful risk of Stage 6 transition within 3-6 months if current trends continue.

---

### Recommendations

1. **Reinforce the ceasefire monitoring mechanism** with additional UNMN observers at the three highest-risk contact points
2. **Establish a joint economic working group** on rare earth revenue-sharing to create a practical cooperation track parallel to the political process
3. **Expand the SRSG's private channel** to include senior military representatives from both sides, creating a military-to-military de-escalation mechanism
4. **Press for Panel of Experts report implementation** to constrain arms flows that are lowering the escalation threshold
5. **Support CSCN documentation efforts** as an accountability and deterrence mechanism against mass atrocity triggers

*Confidence: High for current stage assessment; Medium for trigger probability estimates. Based on Glasl framework application, UNMN reporting, open-source conflict monitoring, and comparative analysis of 14 analogous intrastate conflicts at Stage 5.*`;

// ── Talking Points ──────────────────────────────────────────────────────────

const TALKING_POINTS_UNSC = `## Security Council Briefing: Talking Points on the Situation in Nordalia

**Prepared for:** [Senior Official] | **Date:** March 2026
**Classification:** PRAXIS-generated analytical support — verify against current reporting before use

---

### Point 1: The ceasefire is holding but fragile — the window for political progress is narrowing

"The September 2025 ceasefire continues to hold in its broad contours, but the 47 documented violations since its inception reflect a pattern of testing rather than commitment. Both parties are using the ceasefire to consolidate military positions rather than advance political negotiations. The AU Roadmap for Elections, which envisages a transitional process leading to credible elections by Q2 2027, has produced no substantive progress since the second mediation round in November 2025. Without a political breakthrough in the next 90-120 days, we assess a medium-to-high probability that the ceasefire framework will collapse under the weight of accumulated violations and political disillusionment."

### Point 2: The humanitarian situation demands urgent attention regardless of political progress

"The conflict has displaced 1.2 million people internally and generated 340,000 refugees in Westmark. Humanitarian access to the Eastern Provinces remains constrained — three corridors negotiated under the ceasefire agreement are operating below capacity due to administrative obstacles imposed by both parties. Food insecurity affects approximately 2.8 million people, with the approaching planting season (April-May) representing a critical window. If agricultural activity is disrupted for a second consecutive year, we face the prospect of a protracted food crisis requiring sustained international response. We urge all parties to implement their humanitarian access commitments immediately and without conditions."

### Point 3: Arms embargo compliance remains a serious concern

"The Panel of Experts' interim report documents continued arms transfers to both parties in probable violation of the sanctions regime established by this Council. Military capability accumulation is lowering the threshold for escalation and undermining confidence in the ceasefire. We note in particular the pattern of military logistics flights to Nordalia City that require further investigation, and the documented presence of foreign military advisors operating outside the framework notified to the Committee. Effective embargo implementation is not peripheral to the peace process — it is a precondition for it."

### Point 4: Regional dynamics require a parallel diplomatic track

"The Nordalia conflict cannot be resolved in isolation from the regional security competition between Karovia and Westmark. Both states have legitimate interests in Nordalia's stability, but their current patron-client relationships with the conflict parties are reinforcing polarization and enabling maximalist positions. We encourage this Council to consider how the broader regional dynamic can be addressed, whether through a dedicated envoy, a contact group mechanism, or enhanced engagement with RECONA's conflict prevention architecture. A settlement that does not address regional security guarantees is unlikely to prove durable."

### Point 5: UNMN requires sustained support and a realistic mandate

"UNMN operates in an increasingly complex environment with a force ceiling that was established before the current conflict dynamics crystallized. The mission's mandate renewal in September 2026 must be informed by a sober assessment of what is achievable with available resources. We urge Council members to resist the temptation to add mandated tasks without corresponding capability, and to ensure that the mission's political strategy, military posture, and resource allocation are aligned. The SRSG's mediation efforts deserve this Council's active support, including unified messaging to the parties."

---

### Anticipated Questions and Suggested Responses

**Q: Why hasn't the ceasefire produced political progress?**
A: Both parties calculate that time favours their position. The GoN believes economic pressure on eastern communities will erode DRM support; the DRM believes international pressure on the GoN will eventually force concessions. Breaking this mutual stalemate requires changing both parties' cost-benefit calculations — through a combination of incentives for engagement and consequences for obstruction.

**Q: Is UNMN achieving its mandate?**
A: UNMN has prevented large-scale civilian harm and maintained a framework for humanitarian access under extremely difficult conditions. However, the political track — which is ultimately the mission's exit strategy — is stalled. The mission cannot create political will where it does not exist; it can only create space for it.

**Q: What is the risk of the conflict spreading regionally?**
A: Currently assessed as low-to-moderate. The primary risk vector is a Karovian military intervention triggered by a perceived existential threat to its client government. We assess this as a low-probability scenario in the near term but one that could materialize rapidly if the ceasefire collapses and DRM forces threaten strategic government positions.

**Q: Should sanctions be expanded?**
A: The existing sanctions architecture is sound but under-implemented. Priority should be on enforcement of current measures — particularly the arms embargo — rather than expansion. However, targeted sanctions on specific spoilers obstructing the peace process should remain an option if the political track remains blocked.

---

### Avoid List

- **Do not characterize either party as the sole obstacle to peace.** Both the GoN and DRM have taken actions that undermine the political process. Perceived bias toward either side would compromise the UN's mediator credibility.
- **Do not speculate on the timeline for elections.** The Q2 2027 target in the AU Roadmap is politically sensitive and increasingly unrealistic. Acknowledge the framework without endorsing the specific timeline.
- **Do not reference classified intelligence assessments.** Frame arms embargo concerns in terms of the Panel of Experts' published findings only.
- **Do not pre-judge the mandate renewal outcome.** Council dynamics on Nordalia are fluid and premature positioning could constrain negotiating space.
- **Do not use the term "failed state" or "civil war."** The GoN is sensitive to these characterizations, and the DRM objects to framing that implies equivalence between government and insurgent. Use "armed conflict" and "political crisis."`;

// ── Dashboard AI Insight (Morning Brief) ────────────────────────────────────

const DASHBOARD_BRIEF = `**Key Flashpoints Requiring Immediate Attention**

The Nordalia Crisis remains the priority situation this morning. UNMN ceasefire monitors reported two new violations overnight in the Kessara corridor — an AFN forward observation post was established 2.3km inside the buffer zone, and DRM forces conducted a patrol in the demilitarized sector near Belara. While both incidents were localized and did not result in casualties, they represent the third consecutive week of buffer-zone incursions, suggesting a pattern of deliberate testing rather than isolated lapses. The SRSG has requested urgent consultations with both parties' military liaison officers.

Separately, the Nordalian Independent Media Network reports that the GoN has detained two additional journalists in Nordalia City in connection with their coverage of AFN operations in the Eastern Provinces. This brings the total number of detained NIMN journalists to five since 2024 and may complicate the upcoming Universal Periodic Review session.

**Upcoming Events and Priority Actions (Next 24 Hours)**

The UNSC open debate on Protection of Civilians begins at 10:00 — three draft resolutions are on the agenda, including one with language on humanitarian access corridors that references the Nordalia precedent. The AU PSC 1187th meeting at 11:30 will review the Sahel situation but may include margins discussion on the stalled Nordalia mediation round. Today's priority actions: (1) finalize briefing materials for the PoC debate incorporating overnight Nordalia reporting; (2) coordinate with the AU Panel secretariat on the proposed March mediation session agenda; (3) review the Panel of Experts' updated arms flow analysis received yesterday for potential UNSC Committee referral. The Nordalian krone fell a further 2.1% yesterday, bringing cumulative depreciation to 36.4% since March 2024 — fiscal pressure on the GoN is intensifying, which historically correlates with both increased repression and increased willingness to negotiate (monitor for signals in either direction).`;

// ── AI Insights (JSON format for dashboard cards) ───────────────────────────

const DASHBOARD_INSIGHTS = JSON.stringify([
  {
    type: 'urgent',
    title: 'Kessara Corridor Ceasefire Violations Accelerating',
    summary: 'Third consecutive week of buffer-zone incursions by both AFN and DRM forces. Pattern analysis indicates deliberate testing of ceasefire limits rather than isolated incidents. Escalation probability has increased to 35% over 90 days. Recommend immediate review of UNMN monitoring deployment.',
    link: '/conflict-graph',
  },
  {
    type: 'action',
    title: 'UNSC PoC Debate — Nordalia Language in Draft Resolution',
    summary: 'Draft resolution A/3 includes humanitarian corridor language referencing Nordalia. Briefing materials should address GoN objections to "imposed access" framing and DRM concerns about corridor militarization. Three P5 delegations have requested bilateral consultations.',
    link: '/reports',
  },
  {
    type: 'pattern',
    title: 'Karovian Logistics Flights Pattern Shift Detected',
    summary: 'Open-source flight tracking shows 40% increase in Karovian military transport flights to Nordalia City over past 21 days, correlating with AFN forward positioning in the Kessara corridor. Consistent with pre-offensive logistics buildup in comparable cases. Confidence: 72%.',
    link: '/early-warning',
  },
]);

// ── TACITUS Ecosystem Responses ──────────────────────────────────────────────

const ARGUS_QUERY_RESPONSE = `## ARGUS Knowledge Graph: Commitment Chains — Government of Nordalia ↔ EMLF

**Query executed:** \`MATCH (a:Actor)-[:COMMITTED_TO]->(c:Commitment)-[:BINDS]->(b:Actor) WHERE a.name IN ['Government of Nordalia', 'EMLF'] RETURN path\`

ARGUS has identified **7 active commitment chains** between the Government of Nordalia and the EMLF, spanning the period September 2025 to March 2026. Here are the most significant:

### 1. September Ceasefire Agreement (Confidence: 94%)
**GoN → Ceasefire Commitment → EMLF** (bilateral, mediated by AUNM)
- Commitment: Cessation of offensive operations along the Line of Contact
- Status: **Strained** — 47 documented violations, but framework intact
- Linked entities: AUNM Verification Commission, Kessara Corridor Buffer Zone
- Connected claims: GoN Claim #12 (territorial integrity), EMLF Claim #7 (political recognition)

### 2. Humanitarian Corridor Protocol (Confidence: 89%)
**GoN → Access Commitment → OCHA/EMLF**
- Commitment: Three designated corridors for humanitarian access to Eastern Provinces
- Status: **Partially implemented** — Checkpoint Bravo blockage ongoing
- Risk factor: GoN Constraint #4 (security concerns re: corridor misuse)

### 3. Prisoner Exchange Framework (Confidence: 91%)
**GoN ↔ EMLF** (facilitated by AU Panel of the Wise)
- Two successful exchanges completed (November 2025, January 2026)
- 34 individuals exchanged total
- **Strongest trust-building chain** in the current graph

### Cross-Reference Insights
- The commitment graph reveals a **structural gap**: no commitment chains exist on the core dispute — revenue sharing from the Belara Mining Complex. This absence correlates with the stalled political track.
- Actor leverage analysis shows Karovia holds **indirect veto power** over GoN commitments through the 2019 bilateral defense treaty (Leverage edge, weight: 0.82).
- The EMLF's commitment reliability score is **67/100**, constrained by field commander autonomy in Sectors 2 and 4.

*This analysis was generated by ARGUS graph-augmented retrieval across 847 indexed entities. Confidence scores reflect entity resolution quality and source corroboration levels.*`;

const CONCORDIA_QUERY_RESPONSE = `## CONCORDIA Mediation Recommendation: Next Nordalia Round

Based on the current conflict dynamics and the Glasl Stage 5 assessment, CONCORDIA recommends the following approach for the next mediation round:

### Recommended Framework: **Interest-Based Negotiation (Fisher/Ury)**
The current impasse stems from positional entrenchment on both sides. A Fisher/Ury framework would redirect focus from stated positions to underlying interests, where overlap exists on economic recovery, civilian protection, and international legitimacy.

### Key Issues to Address (Priority Order)
1. **Humanitarian corridor guarantees** — Lowest-hanging fruit with humanitarian urgency. Both parties have reputational incentives to cooperate.
2. **Belara Mining Complex revenue-sharing** — The core economic driver. CONCORDIA's ZOPA analysis identifies a potential agreement zone at 35-45% revenue allocation to eastern provinces.
3. **Ceasefire verification strengthening** — Additional AUNM monitoring capacity at the three highest-risk contact points.
4. **DDR framework principles** — Not full disarmament, but agreement on principles to guide the detailed negotiation.

### Proposed Session Structure
- **Day 1 (4 hours):** Separate caucuses with each party to identify moveable positions. Use the "one-text procedure" to develop a single negotiating document.
- **Day 2 (6 hours):** Joint session focused on humanitarian corridor protocol and revenue-sharing formula. Use objective criteria (comparable peace agreements, international standards) to depersonalize the negotiation.
- **Day 3 (3 hours):** Review of draft commitments and next-steps timeline. Establish a technical working group for detailed DDR discussions.

### Risk Factors
- **Spoiler alert:** CONCORDIA flags a 40% probability that hardliners on either side will attempt to derail progress through a provocative incident in the 48 hours surrounding the session.
- **Recommended mitigation:** Pre-session commitment from both parties to a 72-hour "quiet period" with enhanced AUNM monitoring.

*Recommendation generated by CONCORDIA's mediation intelligence engine using 14 mediation frameworks. Framework selection based on conflict stage, party characteristics, and comparative case analysis across 230 historical mediation processes.*`;

const WINDTUNNEL_QUERY_RESPONSE = `## Wind Tunnel Scenario Simulation: Ceasefire Collapse

**Scenario:** Complete collapse of the September 2025 ceasefire following a major military incident at the Kessara Corridor.
**Model:** CiviSphere v2.0 — Psychographic impact analysis across 27 population tribes.

### High-Impact Tribe Responses

**Tribe: Urban Professional Class (Nordalia City)**
- Population segment: ~420,000 | Current alignment: GoN-leaning neutral
- **Predicted response:** Shift toward anti-war sentiment. Economic disruption from ceasefire collapse (currency depreciation, supply chain disruption) would erode support for military solution. Probability of protest mobilization: **62%**.
- Risk: Government crackdown on urban dissent could push this tribe toward DRM sympathy.

**Tribe: Eastern Rural Communities**
- Population segment: ~680,000 | Current alignment: EMLF-sympathetic
- **Predicted response:** Entrenchment of EMLF support. Renewed military operations would confirm the narrative of government aggression. DRM recruitment surge predicted at **+35% within 60 days**.
- Risk: Humanitarian crisis would create dependency on EMLF governance structures, making future reintegration harder.

**Tribe: Karovian Border Communities**
- Population segment: ~150,000 | Current alignment: Mixed / security-focused
- **Predicted response:** Increased demand for Karovian military intervention. Cross-border refugee flows would strain social services and amplify anti-EMLF sentiment. Support for direct Karovian involvement: **rising from 28% to 51%**.

**Tribe: Diaspora (Westmark-based)**
- Population segment: ~340,000 | Current alignment: Strongly pro-DRM
- **Predicted response:** Radicalization acceleration. Fundraising for DRM military operations would surge. Social media narrative warfare would intensify, complicating international mediation efforts.

### Scenario Probability
- Ceasefire collapse within 90 days: **35%**
- Escalation to Glasl Stage 7 if collapse occurs: **55%**
- Regional spillover (Karovian intervention): **18%**

### Key Insight
The psychographic model reveals that ceasefire collapse would **eliminate the moderate center** across all 27 tribes. The Urban Professional Class — currently the largest constituency for negotiated settlement — would fracture, with segments radicalizing in both directions. This makes ceasefire preservation the single highest-priority objective for conflict resolution.

*Scenario modeled by Wind Tunnel's CiviSphere psychographic engine across 27 population tribes. Model calibrated against 14 comparable conflict escalation cases with documented population response data.*`;

// ---------------------------------------------------------------------------
// Exported cache map
// ---------------------------------------------------------------------------
// Keys follow the pattern: "route:inputHash" where inputHash is a simplified
// match string derived from the user's input.

export const CACHED_RESPONSES = new Map<string, string>([
  // Chat responses
  ['chat:greeting', CHAT_GREETING],
  ['chat:key_actors', CHAT_KEY_ACTORS],

  // Scenario analysis
  ['scenario:ceasefire_collapse', SCENARIO_CEASEFIRE_COLLAPSE],

  // Escalation assessment
  ['escalation:glasl_assessment', ESCALATION_ASSESSMENT],

  // Talking points
  ['talking_points:unsc_briefing', TALKING_POINTS_UNSC],

  // Dashboard
  ['dashboard:morning_brief', DASHBOARD_BRIEF],
  ['dashboard:insights', DASHBOARD_INSIGHTS],

  // TACITUS Ecosystem cached responses
  ['chat:argus_query', ARGUS_QUERY_RESPONSE],
  ['chat:concordia_query', CONCORDIA_QUERY_RESPONSE],
  ['chat:windtunnel_query', WINDTUNNEL_QUERY_RESPONSE],
]);
