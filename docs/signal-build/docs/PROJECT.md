# PRAXIS SIGNAL global narrative intelligence project

Product and implementation blueprint for TACITUS

5 October 2026

## 1 The product decision

Build SIGNAL as a global information-environment workspace inside PRAXIS, at praxis.tacitus.me/signal. A user selects a country, a region, a conflict theatre or a thematic question, defines what they need to understand, and receives a continuing evidence-linked assessment. SIGNAL should capture media and official material, identify claims and recurring interpretations, trace observable circulation, preserve disagreement, and show why an assessment changes. The deliverable is a usable country or regional desk with reviewed outputs, rather than a collection of disconnected charts.

TACITUS remains the company and context infrastructure. PRAXIS remains the workbench. SIGNAL is a focused application of the existing capsule, evidence and reasoning technology. This is a new domain within the existing product, not an invitation to rewrite PRAXIS or introduce another company brand. The name is a working product name; trademark and domain clearance have not been conducted.

The initial commercial proposition is: maintain a defensible picture of the information environment around the decisions your team faces. The useful unit is a continuing desk. It combines a curated source panel, a versioned situation capsule, a live claim ledger, narrative dossiers, and a briefing workflow. The same architecture must work for a peace process, an election, sanctions, humanitarian access, or a company's exposure to a changing political environment.

Make any country selectable from the outset. Invest editorial and collection depth in a few paid desks first. Selection availability and analytical coverage are different capabilities. A country without a curated source pack should open in discovery mode with visible collection gaps; it should not receive a fabricated expert assessment.

The strongest feature is the assessment delta: what changed in the evidence, what changed in the interpretation, what remains unresolved, and which prior conclusion now needs review. That connects SIGNAL to the user's earlier PRAXIS work on expert cognition, temporal context and source-bound reasoning. It is also a concrete feature an analyst can demonstrate to a prospective customer in five minutes.

## 2 The buyer and the job to be done

Start with research directors and small teams at geopolitical-risk consultancies, specialist advisory firms, policy research organizations and public-affairs practices. The working hypothesis is that these teams will pay for a dependable continuing dossier and a reduction in briefing preparation time. Their need should be validated through interviews and a paid trial; no willingness-to-pay evidence has yet been collected for SIGNAL.

Embassies, UN teams, humanitarian organizations and large corporate intelligence functions are relevant subsequent audiences. Their requirements may include sensitive source segregation, approved model providers, procurement review and organization-specific terminology. For a solo founder, begin with public-source analysis and clear customer deliverables, then add organizational governance when a concrete buyer requires it.

Control Risks publicly offers ongoing geopolitical and security monitoring, and Oxford Analytica's Global Risk Monitor links risk tracking to continuing analysis. These offerings establish an existing category of country intelligence work; they do not establish a market share, price benchmark or a commitment to buy SIGNAL. [23,24]

| Buyer hypothesis | Decision or workflow | First useful deliverable |
| --- | --- | --- |
| Boutique geopolitical adviser | Prepare client advice on a specific country or issue | Reviewed country desk brief and evidence dossier |
| Diplomatic or mediation team | Understand changes in positions and competing interpretations | Statement comparison and negotiation narrative map |
| Humanitarian analysis team | Understand narratives affecting access and civilian protection | Claims register with localized source context |
| Corporate political-risk team | Assess developments affecting operations or policy exposure | Decision-specific watchlist and weekly assessment delta |
| Foundation or policy institute | Follow information environments around a funded program | Reproducible narrative landscape and source coverage note |

In customer discovery, ask for the last briefing the person prepared, the source list they used, the decisions that depended on it, the steps that took longest and the mistakes they fear. Ask whether they need a tool, an analyst service, or a combined desk. Do not begin with a list of proposed AI features. The critical test is whether a customer uses a reviewed SIGNAL output in an actual workflow and pays to continue it.

## 3 What makes the product distinctive

The claim should be specific: SIGNAL links media observations to country context, an inspectable assessment and its revision history. A graph alone is not a defensible commercial distinction. Blackbird.AI already advertises narrative analysis, networks and risk prioritization. PeakMetrics describes narrative detection and interpretation across an online information environment. Their public product pages demonstrate overlapping functionality; this project has not independently tested their accuracy or established that they lack capsule-like knowledge structures. [21,22]

SIGNAL should differentiate through a workflow that preserves a customer's expertise. The country capsule stores distinctions, actor aliases, institutional constraints, interpretations, counterexamples and questions that would change an assessment. The next source is read against that reviewed context, with a receipt showing what context was used. A new diplomat or analyst can inspect the source of a judgment rather than inherit an unexplained summary.

Four demonstrable features deserve priority. First, a narrative dossier separates an event claim from the framing used to interpret it. Second, a provenance view shows independent observations, quotations and syndicated copies without treating all mentions as new evidence. Third, an assessment delta explains a revision and its decision implications. Fourth, a portable evidence bundle carries pinned sources, qualified claims, dissent and review history into another PRAXIS assignment.

A statement such as “the agreement has been welcomed” must remain distinct from “the agreement has been accepted” and “the agreement has been implemented.” This is a useful example of the kind of pragmatic language knowledge a diplomatic analyst can contribute. It is a methodological illustration, not an assertion about a current agreement. Preserve such distinctions as reviewed language rules with applicability conditions and exceptions.

The product should answer difficult questions with bounded evidence: Which accounts or publications first appeared in the monitored panel? Which framing crossed from one observed source group to another? Which official position changed? Which allegation has no independently captured support? Which conclusion is now stale? Avoid promising the original author of every narrative, hidden motives, comprehensive public opinion or reliable prediction of violence.

## 4 Global geography and configurable desks

Use a stable geography registry with country and territory identifiers, aliases, display labels and versioned provenance. ISO 3166 supplies country and subdivision code conventions; identifiers should remain distinct from political positions on recognition. Maintain display policy separately from the registry and support explicitly user-assigned identifiers for additional collection contexts. [18]

A desk is a versioned collection and analytical scope. It contains one or more country IDs, optional administrative areas, named conflict theatres, languages, source packs, watch topics and an intended decision. Keep country of publication, place mentioned in a source, claimed event location, publisher headquarters and intended audience as separate fields. A story from a French outlet about Darfur belongs to a Sudan subject desk; publisher nationality alone is not enough to route it.

Support four geography modes. Country mode opens any supported country. Administrative mode narrows to sourced subdivisions. Theatre mode uses a reviewed collection definition that may cross administrative or national borders. Thematic mode combines countries around an issue such as the Red Sea, migration, sanctions or a peace process. A scope can overlap several others; it should not force every item into one exclusive country bucket.

| Scope type | Example configuration | Requirement |
| --- | --- | --- |
| Country | Brazil or Japan | Stable country ID, aliases and source-coverage status |
| Administrative area | A named province or district | Versioned boundary source and place disambiguation |
| Conflict theatre | Darfur, eastern DR Congo, Donbas | Editorial definition and limits; no implied sovereign boundary |
| Cross-border issue | Red Sea shipping or a regional peace process | Multiple country IDs and explicit inclusion rules |
| Customer-specific question | Narratives around a policy negotiation | Mandate, actors, sources and output contract |

geoBoundaries publishes administrative boundary data under CC BY 4.0 with attribution requirements. Its country files and global composites use different approaches to disputed areas. Choose the appropriate dataset, retain its version and license, and explain the displayed geometry. HDX datasets have dataset-specific licenses; access to HDX does not provide uniform redistribution permission. [19,25]

For countries without editorial packs, provide discovery and user-supplied intake immediately. Offer a source-pack builder that asks an analyst to add local media, official institutions, languages, aliases and blind spots. Regional templates are conveniences, not a fixed list of countries in conflict. Users must be able to create or correct a regional scope anywhere.

The included reference package supplies 249 assigned country and territory codes plus a separately labeled Kosovo entry, regional presets for seven settings, and a custom regional phrase. It does not import comprehensive administrative polygons or implement multi-country theatre selection. Those are production milestones below.

## 5 The daily experience at signal

The first screen should expose the country or theatre selector, the analytical question, the time window and the most useful current changes. Keep the existing PRAXIS authentication, navigation and design system. Use a dense but readable working surface. Do not open with an animated world graph or a promotional page.

Within a desk, provide six connected views: Overview, Coverage, Narratives, Evidence, Context and Briefs. Overview shows changes that met configured review or alert rules. Coverage exposes the monitored panel and failed collectors. Narratives opens a dossier with claims, frame, observed actors, circulation and alternatives. Evidence shows the source representation, translation and exact locators. Context opens the pinned country or theatre capsule. Briefs records draft, revised and approved outputs.

A first-time user chooses a country, adds a question and an output audience, then enables a source pack or uploads material. The interface shows what can be collected and what is missing before a run begins. The user can explore incoming material without approval, but factual extraction remains proposed until reviewed. The reviewer can correct an actor, qualify a claim, attach contrary evidence or reject an interpretation.

A returning user should see an assessment delta since their last approved brief. Clicking a change opens the affected claim, the old and new source spans, the model proposal, the country rule applied and the review decision. Source updates must not overwrite an earlier approved briefing. The old artifact stays pinned to its inputs, while a new draft identifies changed or withdrawn evidence.

Keep graph inspection available alongside a list, source text and timeline. Graph selection must answer a question, such as “which statements depend on this source revision?” or “which mentions share a citation root?” Each visual edge needs a typed predicate and evidence or an explicit inference status. A list alternative must expose the same relationships for keyboard and screen-reader use.

Do not label collector failures as “no activity.” Distinguish no matching material, interrupted collection, saturated discovery results, insufficient language coverage and not-yet-configured sources. Every statistic needs its time window, denominator, source panel version and uncertainty where appropriate.

## 6 Collection sources and access constraints

The initial source strategy combines inexpensive discovery, curated direct sources and customer-supplied material. GDELT should be one collector, not the system of record and not the sole basis of a country's analytical coverage. Its DOC API supports article discovery and timeline modes, documents a 250-result ceiling for article lists and a recent search window. The returned discovery list is not a license to retain the publisher's full article. [3]

GDELT's published 2.0 description presents a metadata stream operating in 15-minute intervals with multilingual processing. Treat that as a provider design description rather than a guaranteed publication-to-SIGNAL service level. Instrument actual latency, failures and capture gaps for the customer's monitored panel. [4]

| Source | Role in SIGNAL | Practical initial treatment |
| --- | --- | --- |
| GDELT DOC | Broad news discovery | Save URLs and metadata; fetch permitted source representations separately |
| Curated RSS and sitemaps | Stable panel of specific publishers | Collect conditionally with ETag and Last-Modified; monitor omissions |
| Official statements and reports | Positions, mandates and primary evidence | Preserve original version, date, language and exact source locators |
| Customer documents and exports | Private organizational evidence | Use existing intake and authorization; isolate from public collections |
| Media Cloud | Source directory and complementary research | Validate API access, rate limits and commercial rights before dependence |
| ReliefWeb | Humanitarian reports and metadata | Configure an approved appname and comply with its current API contract |
| YouTube metadata | Selected public channel discovery | Separate metadata from authorized media analysis and caption access |
| Licensed social data | Measured cross-platform observations | Add only with a paid desk and an explicit collection entitlement |

Media Cloud offers a source directory, news search and API-based research workflows. Use it to improve source-panel selection and to cross-check coverage; verify the applicable commercial use and redistribution terms before offering its data to customers. [6]

ReliefWeb now requires a pre-approved appname for API access. Do not ship an integration that assumes an arbitrary appname works. The reference package therefore does not pretend to have a connected ReliefWeb collector. [7]

X's published pricing uses paid resource reads, with post reads listed at $0.005 each when checked. At that rate, 100,000 charged post reads represent $500, before additional resource types. Set a hard cap and retrieve only narrowly defined watchlists once a customer funds the requirement. [8]

The YouTube Data API's caption-download method requires permission to edit the video. Public availability of a video does not make every caption downloadable through that API. Telegram's current terms explicitly restrict scraping and use of its platform data for AI development and deployment, subject to limited consent exceptions. Do not base the first product on an assumed unrestricted Telegram pipeline. [9,10]

A connector registry should record access state, owner, source terms, permitted retention, deletion obligations, authentication method, expected cadence and failure handling. “Configured,” “collecting,” “degraded,” “access pending” and “disabled” are useful operational states. An unavailable connector should never be silently replaced by model knowledge.

## 7 Capture before interpretation

Separate discovery, source capture and derived analysis. A discovery hit stores its provider, query, raw metadata, URL, language and discovery timestamp. A captured source revision stores the representation actually retrieved or supplied, its content hash, rights basis and available publication date. Derived artifacts contain extraction proposals, translations, embeddings and analysis, each linked to that exact revision and its generating tool or model.

Original bytes should be preserved where retention is permitted. Parsed text, page images and timed media segments are derived representations. A change to parsing or OCR must create a new derived revision, not silently move an old citation. For inaccessible articles, keep the discovery reference and mark full text unavailable; do not reconstruct a plausible article from its headline.

A source receipt should identify the exact text span, PDF page and bounding box, image region, or media start and end time supporting a claim. W3C Web Annotation provides a useful model for quote and position selectors, while PROV-O provides concepts for recording derivation and attribution. Neither establishes the correctness of what a source reports. [16,17]

Store at least four clocks: claimed event time, publication time, observation or capture time, and system-record time. Statements about rules or positions may also have a validity interval. Unknowns remain null. In particular, GDELT seendate must not be relabeled as a verified publication date. Keep date extraction method and uncertainty alongside inferred dates.

Implement URL normalization conservatively. Remove known tracking parameters, but preserve parameters that identify the article or its version. Preserve redirects as provenance. De-duplicate exact content before inference. Treat approximate text or image similarity as a proposed match until confirmed. A shared wire story is one observation root even if many publications repeat it.

For a solo founder, immutable source metadata and inexpensive storage matter more than indexing every document into several databases. Retain the minimum permitted representation that makes a claim reproducible, with a clear expiry policy. A paid source contract may permit internal use but restrict export; enforce that at the artifact and capsule boundary.

## 8 Five levels of media understanding

Use separate processing tiers so the customer can buy the depth they need and the founder can control cost. A record's tier describes the available representation and processing, not its reliability. A high-resolution video can be misleading; a short official text can be highly relevant.

| Tier | Input and processing | Analytical output | Promotion rule |
| --- | --- | --- | --- |
| T0 Discovery | URL, headline, metadata and provider tags | Collection relevance and triage | No substantive verification from headlines |
| T1 Text | Permitted article text, statements, PDF or supplied material | Anchored claims, quotations, frame and stance proposals | Exact spans; language and scope checks |
| T2 Images | Retained image, OCR, image region and duplicate search | Caption versus visible-content comparison; reuse candidate | Human verification for identity, location and date |
| T3 Audio | Permitted audio, timestamped transcript and translation | Attributed speech claims and wording changes | Check critical names, quantities and negation |
| T4 Video | Permitted video, aligned audio and selected frames | Time-linked discrepancy and narrative sequence dossier | Review important moments in the original media |

Start with T0 and T1. Add T2 when a paying desk needs visual allegation analysis. T3 and T4 should initially be analyst-requested escalations with duration limits, rather than always-on broadcast processing. Store transcripts, translations and model descriptions separately from the original representation.

Gemini's documented video-understanding interface supports audio and visual interpretation, timestamps, clipping and sampling controls. Its public documentation also describes a YouTube URL feature in preview. These capabilities are candidates for bounded experiments; confirm availability in the existing Vertex provider path before implementation. A developer API preview is not automatically a production Vertex capability or a source-retention entitlement. [11]

At T2 and above, distinguish the visible scene from the caption's asserted location and date. A model may describe uniforms, vehicles or buildings but should not automatically identify a named person, attribute an event to a faction, or infer ethnicity. Verify critical claims with multiple appropriate observations and record what the image itself cannot establish.

C2PA credentials can be retained as provenance signals when present. Successful credential validation does not establish that an depicted event is true, and absence of credentials does not establish manipulation. Avoid a single “AI-generated” label based on an uncalibrated detector. Record the test, result, limitations and human assessment separately. [15]

## 9 An analytical model that preserves disagreement

Distinguish Topic, Event, Claim, Narrative and Campaign. A topic is an indexing category. An event is a proposed or established occurrence with time and place. A claim is an attributed assertion. A narrative is a recurring interpretation connecting actors, responsibility, values, causes and desired outcomes. A campaign is a hypothesis about coordinated activity, requiring behavioral or infrastructure evidence beyond shared wording.

An extraction proposal should identify who is speaking, what is asserted, whether the statement is affirmative or negative, how certain it is, the relevant time and location, and whether the source endorses, quotes, criticizes or merely reports it. Use both the original wording and a carefully qualified normalized proposition. Keep translations labeled as translations and link them to the original span.

For every narrative dossier, store its organizing question, central propositions, actor roles, problem definition, attribution of responsibility, moral vocabulary, proposed remedy, target or addressed audience when explicit, supporting observations, contradictory observations, alternatives and invalidators. Narrative IDs should persist across time; new wording does not automatically mean a new narrative.

Truth, authenticity, coordination and intent are separate assessment dimensions. “Unverified allegation,” “contradicted by captured evidence,” “misleading contextualization,” “fabricated identity,” “suspected coordination” and “deceptive intent evidenced” require different observations. A propaganda message may contain accurate factual statements. An incorrect claim may be an error. A unpopular position or official nationality is not enough to label content disinformation.

DISARM supplies a shared vocabulary for documenting influence-operation techniques. The EEAS FIMI framework and its 2026 threat report provide additional operational context for examining behavior and infrastructure. Use these as optional mappings on evidence-backed incident records; a model-assigned technique tag is a proposal rather than an attribution finding. [13,14]

For consequential allegations, the interface should ask what evidence would falsify the assessment, whether another account explains the observations, and which sources are actually independent. A reviewable uncertainty is more useful than a confident paragraph that conceals the lack of an original source.

## 10 The graph and canonical record

Keep assertions and their evidence canonical. Graph nodes and edges are inspection and retrieval projections of a versioned ledger. Graph rendering is replaceable; the qualified claim record must survive changes of database or visualization library.

| Object | Essential fields | Important distinction |
| --- | --- | --- |
| Source and revision | ID, provider, URL, hash, language, rights, clocks | A source identity can have several captured revisions |
| Evidence span | Revision ID, locator, original text, representation | OCR or translation is derived evidence |
| Actor or publisher | Stable ID, aliases, dated affiliation assertions | Attribution requires evidence; names are not identities |
| Claim | Proposition, speaker, polarity, modality, scope, evidence | Reported allegation is distinct from analyst endorsement |
| Narrative | Frame, linked claims, alternatives and version history | A narrative groups interpretations, not just keywords |
| Event | Claimed time, place, participants and evidence | Media attention is not proof an event occurred |
| Assessment | Conclusion, basis, alternatives, confidence, reviewer | A human judgment can be revised without deleting history |
| Review decision | Exact content and evidence revision, identity, rationale | Approval applies to a pinned version |

Useful predicates include UTTERS, QUOTES, REPORTS, SUPPORTS, CONTRADICTS, CITES, SYNDICATED_FROM, POSSIBLY_REUSES, APPLIES_TO, REVISES and INVALIDATES. Do not store AMPLIFIES, COORDINATES_WITH, CONTROLS or CAUSES merely because two nodes appear together. Edge records carry source locators, time, method and epistemic status. Identity merges need reversible provenance and a human decision for ambiguous cases.

Begin with typed relationship tables and the existing database. Ordinary SQL joins and bounded recursive queries can answer initial provenance questions. Add or reuse a Neo4j projection only when a measured query or analyst workflow justifies it. Do not simultaneously require Neo4j, Qdrant, a second graph engine and a new event platform to achieve the first desk.

A retrieval operation should return a small authorized evidence subgraph with receipts, not a whole country graph pasted into a model prompt. Include contradicting evidence and relevant exceptions alongside supporting passages. Pin the graph projection and capsule versions used for each output.

## 11 How context capsules make SIGNAL useful

Preserve the four PRAXIS capsule roles: User, Situation, Tool and Output. A country pack and a regional dossier are Situation profiles, rather than new incompatible top-level capsule types. Collection source packs are referenced evidence assets. Reasoning methods belong in Tool profiles; generated desk products become Output work products. Keep an output recipe distinct from the artifact it produces.

A Situation capsule should carry actor and place aliases, historical conditions, current propositions, contested claims, institutional constraints, known narrative frames and collection gaps. An expert's contribution should include cues, distinctions, exceptions, recurring language, causal assumptions, cases, questions and revision triggers. Record applicability and provenance, not just free-form “expert context.”

For example, a reviewed rule may say that an announced ceasefire proposal is not an implemented ceasefire. Its conditions refer to proposal language and lack of implementation evidence; its invalidator is a later verified implementation observation. The capsule compiler should activate that distinction when a new source or a briefing question concerns ceasefire status. This is a fictional reasoning example and can be tested across countries.

Bind model proposals to exact capsule and source versions. Review cards must identify the proposed object, the change, its evidence and the applicable context. An edited or materially updated record needs renewed review. Rejected proposals and dissent remain retrievable. An artifact cannot inherit approval from a differently worded predecessor.

Keep capsule portability focused on an auditable bundle: manifest, typed records, source references and authorized representations, qualified graph, expert knowledge, temporal fields, review history, dependencies and compilation receipt. A hash proves content identity, not truth or approval. Export rights must be checked for each source-derived item.

The reference package's JSON export is an explicitly labeled SIGNAL extension profile. Native PRAXIS import requires a compatibility adapter and round-trip tests against the current active envelope and cognitive schema. No native compatibility is claimed merely because the export uses the word capsule.

## 12 Metrics and alerts that can be defended

Compute descriptive measures against a declared panel and interval. Store both the raw observations and the source-panel version. A source arriving late, a collector failing or a new publisher joining the panel can change counts without any change in the world. Display those effects and permit stable-panel comparisons.

Measure observed coverage, distinct publishers, distinct independent citation roots, language distribution, claim stance, semantic frame prevalence and changes in reviewed actor positions. “Frame prevalence” should mean the proportion of eligible classified items in a stated sample; it must include the classified denominator and unknown bucket. Do not silently calculate it from every retrieved headline.

For a preliminary burst alert, compare a narrative's current independent-source count with a matched historical interval. Median and median absolute deviation can provide a robust screening statistic; calibrate the window and threshold against a labeled desk benchmark. Require a minimum count and show the baseline, current count, panel health and deduplication method. A burst establishes unusual observed coverage, not manipulation.

An observed transfer alert can identify a phrase or claim appearing in a new source group after an earlier observed group, with explicit citation or near-copy evidence when available. Use “first observed in the monitored panel” rather than “originated here.” Temporal precedence and lexical similarity are insufficient to establish control or covert coordination.

An assessment-change alert should identify the affected prior conclusion, the new evidence, its support or contradiction, any activated capsule rule, and the analyst's decision. This is the priority paid feature because it relates the monitoring work to a continuing customer judgment.

Route novelty, repetition, authenticity and coordination into different review queues. Rank the queues using configured customer relevance and evidence quality. Do not collapse them into a universal risk or disinformation score. Alert delivery through email or messaging should be an opt-in customer feature, with quiet hours and thresholds; the present work has not sent external messages.

## 13 The production architecture

Use the existing PRAXIS Next.js and Google Cloud/Firebase/Vertex architecture. Keep authentication and organization authorization in the current trusted layers. Preserve the active Firestore capsule envelope and cognitive adapters. Use the existing Cloud SQL/Postgres job and evidence infrastructure where appropriate; audit actual storage ownership before adding tables.

The current remote main inspected for this project is commit 276d9cbb62c2cd6a212770c4fa78547c901ee82b. It is newer than the 2 October project notes. The live graph report inspected was built from an earlier commit, so its structural map should not be treated as fresh code validation. The analysis here is based on read-only source inspection, not an authenticated production test. [1]

Verified source contracts include src/lib/cognitive-capsule/compiler.ts, which exposes compileContext and compiler version cognitive-compiler/0.3.0; src/lib/cognitive-capsule/types.ts, which exposes typed expert knowledge categories; src/lib/context/capsule-v3.ts, which includes claim-ledger and review-card concepts; src/types/source-receipt.ts; and src/lib/agent-runtime/schema.ts. The runtime uses existing triggers including schedule, source_update and capsule_change, plus idempotency and bounded session fields. Older suggested src/lib/projects paths were absent in the inspected current tree; re-resolve the active workspace surfaces before implementation. [1]

| Responsibility | Production placement | Reuse or add |
| --- | --- | --- |
| SIGNAL UI | Existing Next.js application at /signal | Add a route and desk components; reuse current shell |
| Country and desk configuration | Existing authorized app store | Add versioned scope and source-pack contracts |
| Source and analysis ledger | Existing approved Postgres/evidence plane | Add tenant-scoped revisions and relations |
| Original permitted media | Existing private object storage | Reuse upload, retention and access controls |
| Collection dispatch | Existing Cloud Tasks and trusted worker | Add bounded collectors and collection checkpoints |
| Model interpretation | Existing centralized Vertex provider | Reuse calibration, logging and budget enforcement |
| Context composition | Existing cognitive compiler | Add SIGNAL profiles and receipt adapter |
| Review and artifacts | Existing capsule review and memo/output services | Reuse version-bound decisions and export gates |

Collection processing and analytical AgentRuns are different workloads. Extend the trusted worker with lightweight collection tasks; do not create one expensive full analytical run per headline. A collection checkpoint can publish a source_update event. The existing AgentRun then executes a bounded extraction or desk update when relevance and budget rules permit.

Cloud Tasks supports queued HTTP work and configurable dispatch/retry controls. Use authenticated service-to-service calls and the existing queue discipline. Add an outbox or equivalent durable change marker if the current cross-store write path needs it. At-least-once delivery requires idempotent source revisions, job keys and artifact commits. [20]

The pipeline is: configured sources produce captured revisions; deterministic normalization creates candidate events and matches; a bounded model proposes claims, frames and entity links; a validator checks structure and evidence locators; the reviewer promotes exact objects; the context compiler assembles the approved situation and relevant counterevidence; the existing runtime produces a reviewed artifact. This describes responsibilities, not a requirement for eight new services.

## 14 Real time operations without a global collection bill

For launch, define near-real-time as scheduled collection for watched desks, with measured latency and source availability. Design toward a 15-minute discovery check and a reviewed update within 30 to 60 minutes for eligible T1 sources, but publish no service-level guarantee until it is measured. Deep media investigations can take longer. Editorial review is not instantaneous.

A global selector does not mean a global always-on collector. Every user can inspect any country, but only configured watched desks consume scheduled collection. Share public source ingestion across entitled tenants where terms permit, and retain tenant-specific assessments, private sources and mandates separately. A customer's private capsule must never enter a shared extraction cache.

Use persistent checkpoints, overlap windows and content deduplication. On a cap hit, record saturation. Production collection should try smaller time windows or reviewed language/domain partitions within a per-run request budget. Stop at the provider's practical minimum granularity and retain a coverage-gap record if saturation remains. Do not turn a capped API result into an assumed census.

Maintain a collector health ledger: scheduled and actual start times, last successful capture, request count, bytes, parser version, output count, duplicate count, saturation and error. Alerts about collection health are distinct from alerts about a country's political information environment. Backfills are separate bounded jobs, with an explicit timeframe and retention policy.

Cache extraction against source hash, model version, prompt version and applicable profile revision. Recompute when semantics or context relevant to the task changes; do not repeat every model call merely because a user reopened a page. Schedule low-urgency work through batch processing where supported, while keeping urgent targeted interpretation in the standard runtime.

The reference harness supports manual discovery and an optional 15-minute loop for explicitly named country codes. It lacks durable production scheduling, per-tenant authorization and distributed leases. Its local SQLite implementation is a test adapter, not a replacement for PRAXIS's production services.

## 15 Deliverables customers can use

The core offer should include a weekly reviewed desk brief, an evidence-backed daily delta where warranted, and a continuously inspectable narrative dossier. A customer should be able to retrieve the exact cited source revision and see why an analyst made a judgment. Set an editorial cadence that a solo founder can sustain before selling daily human review for many countries.

| Work product | Content | Likely use |
| --- | --- | --- |
| Country or theatre brief | Key changes, significance, alternatives, evidence and gaps | Client advice or morning policy meeting |
| Narrative dossier | Core claims, frames, observable circulation and assessment | Investigation or continued monitoring |
| Actor position comparison | Quotations, translations, scope and time-qualified changes | Diplomacy and negotiation preparation |
| Visual allegation review | Claimed context, media observations and verification steps | Crisis communication or source verification |
| Assessment delta | Prior conclusion, new evidence, revised judgment and invalidators | Continuing risk or policy decision |
| Capsule and evidence bundle | Pinned records, graph, reasoning and review lineage | Handover and reuse in PRAXIS |

A brief should distinguish what happened, what sources allege, the interpretations in circulation, what we assess, what we do not know, and the decision implications. Recommendations belong to the customer's mandate; the source material alone does not supply permission to act. A diplomatic output may emphasize positional ambiguity. A corporate output may emphasize operational exposure. Neither should distort the underlying evidence.

A usable export includes analytical cutoff, source panel, review state, reviewer, unresolved high-impact claims, working citations and material collection gaps. Briefs that are still drafts should be exportable with a conspicuous draft status. Only an approved exact artifact version may be labeled reviewed or final.

## 16 Pricing hypotheses and a solo founder cost model

Treat pricing as an experiment. A reasonable opening test is a paid 30-day desk pilot at $1,500 to $3,000, covering one defined country or theatre, one principal question, a reviewed weekly briefing and a limited evidence dossier. These are proposed SIGNAL prices, not observed market averages. Separate license charges and exceptional media investigations from the basic scope.

After a successful pilot, test a tool subscription around $500 to $1,000 per month for limited monitored scopes and customer-led review, and a managed desk around $2,000 to $4,000 per month with a defined founder review allowance. Do not sell an unlimited geography, data or analyst-time promise. Three retained managed desks would yield $6,000 to $12,000 in monthly revenue at those proposed prices; that is scenario arithmetic, not a forecast.

Published Google rates checked for an illustrative Gemini 2.5 standard-tier costing baseline list Flash-Lite text input/output at $0.10/$0.40, Flash at $0.30/$2.50 and Pro at $1.25/$10 per million tokens within the stated context band. Actual configured model availability, tokenization, region, media inputs, grounding and pricing must be verified before a run. [12]

| Illustrative monthly workload | Input and output assumptions | Calculated model cost |
| --- | --- | --- |
| 30,000 text extraction calls | 2,000 input and 400 output tokens using Flash-Lite baseline | $10.80 |
| 5,000 selected interpretation calls | 8,000 input and 1,500 output tokens using Flash baseline | $30.75 |
| 500 escalation calls | 12,000 input and 2,000 output tokens using Pro baseline | $17.50 |
| Combined text model baseline | Excludes audio, video, search, retries and infrastructure | $59.05 |

This deliberately narrow calculation illustrates selective processing; it is not the cost of full global intelligence. Allow a 3x model reserve of $177.15, then budget separately for cloud services, storage, transcription, data licenses and monitoring. A planning envelope of $250 to $700 per month for a small text-led pilot is an estimate to test, not a quoted provider bill. Existing PRAXIS fixed costs and production configuration may materially change the marginal cost. Cloud Run and Cloud Storage pricing depend on resources, location and usage. [26,27]

Founder time is likely to be more expensive than initial text tokens. For illustration, three managed desks at six review hours per week each consume 18 hours; at an internal planning value of $75 per hour, four weeks represent $5,400 of labor. Add sales, engineering and administration before judging the margin. The pilot must establish a repeatable review workload, not merely a cheap inference bill.

Meter the number of watched desks, full-text items processed, media minutes, analyst review hours and exported products. Enforce a maximum budget before dispatch, and downgrade eligible background work to batch or discovery-only when the cap is reached. Account for retries and partially completed jobs in the same spending ledger.

## 17 Commercial validation and the first ninety days

In the first two weeks, use the reference package and one reviewed desk example to conduct 8 to 12 discovery conversations. Test a country beyond Syria and one regional scope so the global architecture is real. Ask for permission to analyze a bounded public-source question and present a source-linked assessment delta. A sample output should demonstrate utility before asking a prospect to configure a platform.

In weeks three and four, seek two paid pilot agreements with explicit scope, output cadence and evaluation criteria. Potential organizations named in this document are market examples, not leads with established interest. No outreach has been sent. Avoid building custom integrations until a paying customer can explain why their existing workflow needs them.

In the following month, measure briefing preparation time, source-opening behavior, corrections, false alerts, actual review hours and output reuse. Continue only if the deliverable is used and the operating cost is sustainable. A customer saying a graph looks impressive is weaker evidence than a renewed desk subscription or a report incorporated into a meeting.

In month three, improve the source packs and the recurring output customers actually use. Add a second language review partner or a domain reviewer if the desk needs expertise the founder does not have. Productize the reliable parts of the managed process. Delay a capsule marketplace, universal social ingestion and autonomous campaign attribution until core retention and accuracy justify expansion.

A proposed pilot success condition is two retained paying desks, no unresolved critical evidence or authorization defect, a useful reviewed output each week, and measured review time compatible with the contracted allowance. Failure conditions include repeated unsupported claims, inability to cite retained source representations, or analyst labor exceeding the commercial scope. These thresholds are managerial proposals rather than empirical results.

## 18 Implementation phases and acceptance gates

A credible sequence for a solo founder working with coding assistance is roughly six to eight weeks for a text-first paid-pilot candidate, conditional on the current PRAXIS baseline, authorized source access and available review capacity. This is an estimate, not a guarantee. The broad multimodal vision should follow successful text-led desks.

| Phase | Scope | Evidence required before moving on |
| --- | --- | --- |
| P0 Baseline and contracts | Current repo audit, global scopes, source representation and profile compatibility | Active models and storage verified; no incompatible capsule rewrite |
| P1 Capture and review | /signal shell, GDELT and curated intake, immutable revisions and claim review | Authenticated capture, refresh, review and export journey |
| P2 Useful analysis | T1 extraction, entity proposals, frame/stance and contradiction candidates | Gold source spans and language fidelity benchmark |
| P3 Continuing desk | Revision triggers, assessment delta, saved briefs and watched-scope jobs | Reopen/retry/cancel and source-update acceptance |
| P4 Pilot operations | Source health, limits, customer scope and editorial cadence | Paid-pilot metrics and sustained measured costs |
| P5 Targeted media | Image/OCR, selected audio and video workflows | Timed evidence validation and licensed input access |

P0 should resolve the latest active UI and storage contracts, inspect applicable AGENTS.md and local skills, and run the repository's existing baseline checks before edits. Preserve unrelated work and use a separate branch or worktree where needed. The read-only observations in this plan are not a substitute for that implementation preflight.

For P1, first deliver one complete real persisted journey in the existing app: select any country, create a desk, capture one permitted source, propose an anchored claim, review it, reopen it after refresh and export the saved version. Add a regional scope outside the initial flagship country. Do not mark this done because a sample graph renders.

For P2, run model extraction through the existing calibrated provider and record model, prompt and profile versions. Validate locators, names, negation, quantities, dates and attribution before creating a review card. A model failure must produce a terminal state with the original material intact. Human acceptance should be selective at the record level.

For P3, configure watched scopes through the existing trusted runtime. Prove idempotent collection and bounded analysis under duplicate delivery, worker restart, provider timeout and source changes. A scheduled source update should create a proposed desk delta and a draft artifact, never silently approve a new country assessment.

## 19 Evaluation and operational trust

Maintain a small gold set of approximately 200 source representations across at least three countries, two languages and several representation types. Include contradictory reports, reused headlines, negation, ambiguous actors, quotations a publisher rejects, inaccessible full text, translation traps and temporal corrections. Real material requires a valid retention and evaluation basis. Synthetic fixtures are useful for deterministic lifecycle checks but do not establish model quality.

Compare at least three analytical conditions under matched model and cost budgets: sources alone, simple retrieval, and retrieval with the reviewed SIGNAL country capsule. Judge whether the capsule improves attribution, temporal precision, contradiction recall and useful decision context. Do not assume the graph or capsule wins because it is more elaborate.

Proposed gates include at least 95% precision for substantive claim-to-span support, no critical negation or actor-attribution error in the tested release set, and zero fabricated quotations. Establish and report the measured denominator. Human reviewers should examine high-impact claims separately even if the average metric passes. These are acceptance targets, not completed results.

Measure entity-resolution precision with deliberately ambiguous names. Prefer unresolved identity to a false merge. Test source-dependency roots so syndicated copies do not appear as independent corroboration. Evaluate alerts through a replay of a fixed corpus before sending them to customers. “False-positive rate” requires a defined labeled event set; do not infer it from a few attractive examples.

Test tenant isolation, source access revocation, hostile instructions embedded in media, output rights, stale approvals, concurrent edits and imported capsule permissions. Source text and uploaded files are evidence, not instructions to the runtime. Retain an audit trail but avoid logging confidential question text or full private documents by default.

The reference implementation has 29 passing automated reference tests (17 core and 12 additional analytical guards), including a local HTTP capture-to-review-to-export journey. It validates deterministic behavior, not AI accuracy, live GDELT uptime, production PRAXIS integration, human reviewer expertise, accessibility compliance or customer utility. Browser visual and interaction QA remains to be completed in the supported PRAXIS environment.

## 20 What the implementation package already does

The code folder contains a dependency-light Node reference domain and a local SQLite adapter. It includes a global geography registry, regional and custom scope definitions, GDELT discovery URL construction, a bounded collector, immutable source representations, exact text-span anchoring, append-only review decisions, a derived graph and JSON/Markdown exports. The prototype folder contains the local working surface served by the reference harness.

The harness binds only to a loopback address, checks the expected host, rejects foreign-origin changes and never fetches arbitrary user source links. It is intended for local acceptance and adaptation, not internet exposure. Its single local owner is not a substitute for PRAXIS's real identity and tenant authorization. Production must replace the local store and scheduling with the existing approved adapters.

Discovery retains only a headline and metadata. It cannot promote a discovery headline into a substantive claim. Supplied text requires a declared retention basis; reference excerpts are capped at 600 characters in the harness. That product cap is not a legal safe-harbor determination. Exact quotes and hashes identify the captured representation, rather than certifying the original publisher or event.

Synthetic training material is explicitly labeled in source records, claims and exports. It can demonstrate an unadopted proposal and a review decision without inventing current political findings. No fabricated news, customer, production readiness or source verification appears in the implementation.

Production AI extraction, narrative clustering, entity resolution, complete administrative maps, multi-country theatres, timed media processing and unattended cloud collection remain planned work. No change was made to the live PRAXIS application in this task. The implementation brief in the package identifies the route and adapter work required to make /signal real.

## 21 The first demonstration to build in PRAXIS

Use a continuing question such as how an announced policy proposal is being presented across selected local, official and international sources. Show one original-language source, its translation, an attributed claim, a frame proposal and the relevant country distinction. Include one contrary or qualifying source so disagreement is part of the demonstration.

Then introduce a later source that changes the proposal's status. SIGNAL should identify the affected old claim and briefing, assemble relevant reviewed context, propose an assessment delta and ask for human review. The reviewer should be able to reject an exaggerated interpretation and preserve a narrower one. Export the revised brief and a capsule carrying both versions and the reason for the change.

Repeat the same journey in another country and in a regional scope. That proves the country architecture is configurable. The persuasive moment is the visible change in a defensible judgment, with sources and review history attached. It should leave a customer with a product they can use in their next briefing, not a promise to understand the world's media perfectly.

## 22 Codex development handoff

Start with Codex on the founder's Windows laptop in a separate worktree of the existing PRAXIS repository. This uses the current checkout and authorized development setup. The supplied build kit can also be committed on a feature branch and used in Codex Cloud. Native Windows and Cloud setup instructions were checked against official documentation; the supplied PowerShell scripts have not been executed on Windows here. [28,29]

The kit provides twelve ordered phase prompts: repository audit, canonical contracts, global UI, collection, text analysis, review/graph/native capsules, assessments and briefs, watched desks, pilot operations, targeted media, staging/release and operator handoff. Each phase requires working behavior and explicit acceptance evidence. A controller and durable progress template preserve decisions across sessions. Runtime model instruction templates are kept separate from coding prompts, with a text-extraction proposal schema and clearly synthetic acceptance seeds.

The first coding prompt tells Codex to read the current repository instructions and map the actual auth, storage, compiler, model and worker contracts before editing. The kit does not overwrite AGENTS.md, manufacture production credentials, install another framework or require a new graph service. Current repository code and its required checks govern integration. A reference package can demonstrate an invariant without proving its production adapter.

Only a small documentation MCP is recommended initially. The official OpenAI Docs MCP is read-only; it helps with Codex or an optional OpenAI integration and does not perform product inference. Existing repository Playwright tests, Git and the model gateway are sufficient for the initial development workflow. Browser/GitHub tools can be added when a specific task requires them. [30]

No Codex Cloud development environment or production SIGNAL route was created during this preparation. The Cloud setup file gives the account-side creation prompt and required access checks. Once its environment is ready, the same phase files and progress log can be used there. Production remains the existing PRAXIS application at praxis.tacitus.me/signal and must pass a distinct staging/release gate.

## 23 Additional research and portable implementation

The expanded kit has a portable BOOTSTRAP.md entry point. Unzip into any folder Codex can access and supply that location together with the existing PRAXIS checkout. The PowerShell launcher resolves its own location and starts Codex against the repository. The bootstrap installs/reconciles the kit, preserves existing instructions and durable progress, and begins with a current-code integration audit. No private production repository or account credentials are included.

The research supplement distinguishes genre, political framing and persuasion technique from truth and deceptive intent. It recommends multilingual retrieval through the existing model gateway, compatible versioned embedding indexes, validated attributed claims and a stable reviewed narrative ledger. Topic evolution can support exploration but does not define a persistent narrative identity. These are implementation choices to evaluate, not a claim of universal analytical accuracy. [R01-R05,R16]

Access research keeps GDELT as bounded discovery and treats permitted capture as a separate operation. Provider country identifiers must be mapped rather than confused with subject/event geography. ReliefWeb, Media Cloud and UCDP have their own access and dataset constraints. ACLED remains optional until a commercial entitlement covers the intended use. The inspected non-commercial NLLB checkpoint is excluded from the default paid-product plan. [R06-R12,R21,R22]

The new documents specify an original-language evaluation protocol, four separate clocks for temporal context, pinned artifact manifests, transitive invalidation, a reviewable customer brief and a capacity-limited solo-founder pilot. References to public benchmarks guide component evaluation; the ZIP contains no external datasets or model weights and does not establish permission to redistribute them. [R13,R14,R17-R20,R23]

Twelve additional synthetic reference tests exercise exact/repeated Unicode locators, embedding namespace incompatibility, scoped candidate ranking, panel/health-qualified descriptive changes, zero baselines, manifest revisions/withdrawals and cycle-safe dependency invalidation. Those pure utilities do not implement provider inference, production authorization, complete clustering or the native compiler. Together with the original seventeen domain/HTTP tests, they make the intended invariants inspectable before production adaptation.

The complete supplement is under research/, with primary references in research/SOURCE_REGISTER.md and a machine-readable access plan. Each build phase names its relevant research files. The commercial test remains a buyer using a reviewed brief and its correction delta in a recurring decision workflow. Code preparation can proceed without creating a paid account or deploying the module.

## 24 Source register

References were checked on 5 October 2026. Provider pages and terms may change. Repository observations are dated source inspection, and commercial prices and workload assumptions proposed for SIGNAL are explicitly identified above.

[1] PRAXIS repository and inspected commit. https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/tree/276d9cbb62c2cd6a212770c4fa78547c901ee82b . Private code contracts inspected through authorized access; relevant files are named in section 13.

[2] TACITUS, Context Capsules. https://www.tacitus.me/capsules . Public product positioning and distinction between context, sources and reusable artifacts.

[3] GDELT, DOC 2.0 API documentation. https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ . Discovery modes, result ceilings and recent search-window documentation.

[4] GDELT, GDELT 2.0 Our Global World in Realtime. https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/ . Provider description of multilingual metadata and update design.

[5] GDELT, Context 2.0 API. https://blog.gdeltproject.org/announcing-the-gdelt-context-2-0-api/ . Sentence-level contextual discovery; not a full-text archive entitlement.

[6] Media Cloud, FAQs and Directory. https://www.mediacloud.org/documentation/faqs and https://www.mediacloud.org/media-cloud-directory . Source research and API access; confirm commercial reuse separately.

[7] ReliefWeb API documentation and parameters. https://apidoc.reliefweb.int/ and https://apidoc.reliefweb.int/parameters . Pre-approved appname requirement and current access guidance.

[8] X API pricing. https://docs.x.com/x-api/getting-started/pricing . Published resource-read pricing and spending controls.

[9] Google, YouTube Captions download. https://developers.google.com/youtube/v3/docs/captions/download . Caption access and edit-permission requirement.

[10] Telegram, Terms of Service for Content Licensing. https://telegram.org/tos/content-licensing . Collection and AI-related restrictions and consent exceptions.

[11] Google, Video understanding. https://ai.google.dev/gemini-api/docs/video-understanding . Candidate media capabilities; developer and Vertex paths must be verified separately.

[12] Google Cloud, Generative AI pricing. https://cloud.google.com/vertex-ai/generative-ai/pricing . Published model-rate baseline used for the illustrative cost arithmetic.

[13] DISARM Foundation, Framework. https://www.disarm.foundation/framework . Shared vocabulary for documenting influence operations.

[14] EEAS, Fourth Annual Report on Foreign Information Manipulation and Interference Threats. https://www.eeas.europa.eu/eeas/4th-eeas-annual-report-foreign-information-manipulation-and-interference-threats_en . Operational FIMI framework and 2026 report context.

[15] C2PA technical specification version 2.2. https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html . Provenance credential structure; this citation does not imply its version is the latest or that credentials establish truth.

[16] W3C, PROV-O. https://www.w3.org/TR/prov-o/ . Derivation and attribution vocabulary.

[17] W3C, Web Annotation Data Model. https://www.w3.org/TR/annotation-model/ . Source representation and quote/position locator concepts.

[18] ISO, ISO 3166 country codes. https://www.iso.org/iso-3166-country-codes.html . Identifier conventions and maintenance; display and collection policy remain separate.

[19] geoBoundaries. https://www.geoboundaries.org/ . Administrative geography, dataset choices and CC BY 4.0 attribution requirements.

[20] Google Cloud, Understand Cloud Tasks and HTTP target tasks. https://docs.cloud.google.com/tasks/docs/dual-overview and https://docs.cloud.google.com/tasks/docs/creating-http-target-tasks . Existing queue-compatible implementation pattern.

[21] Blackbird.AI. https://blackbird.ai/ . Vendor's public descriptions of narrative and network intelligence; capabilities not independently benchmarked here.

[22] PeakMetrics. https://www.peakmetrics.com/ . Vendor's public narrative-intelligence positioning; capabilities not independently benchmarked here.

[23] Control Risks, Risk Monitoring. https://www.controlrisks.com/our-services/security-risk-management/risk-monitoring . Example of the continuing-monitoring work category.

[24] Oxford Analytica, Global Risk Monitor. https://grm.oxan.com/About . Example of risk tracking connected to continuing geopolitical analysis.

[25] OCHA Centre for Humanitarian Data, Data-sharing licenses. https://centre.humdata.org/ufaqs/what-are-the-different-licenses-available-for-data-sharing-and-what-do-they-cover/ . Dataset-specific licensing on HDX.

[26] Google Cloud, Cloud Run pricing. https://cloud.google.com/run/pricing . Usage- and configuration-dependent infrastructure cost.

[27] Google Cloud, Cloud Storage pricing. https://cloud.google.com/storage/pricing . Location, capacity and operation-dependent storage cost.

[28] OpenAI, Windows sandbox. https://learn.chatgpt.com/docs/windows/windows-sandbox . Current native Windows execution guidance.

[29] OpenAI, Cloud environments. https://learn.chatgpt.com/docs/environments/cloud-environments . Current account-side environment setup and configuration.

[30] OpenAI, Docs MCP. https://developers.openai.com/learn/docs-mcp . Read-only documentation access and Codex connection command.

Additional research references for section 23 and the research supplement:

[R01] ACL Anthology, SemEval-2023 Task 3 overview. https://aclanthology.org/2023.semeval-1.317/ .

[R02] Google Cloud, Google text embedding model documentation. https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/embeddings/get-text-embeddings .

[R03] intfloat, multilingual-e5-base model card. https://huggingface.co/intfloat/multilingual-e5-base .

[R04] BERTopic, BERTopic online topic modeling. https://maartengr.github.io/BERTopic/getting_started/online/online.html .

[R05] BERTopic, BERTopic topics over time. https://maartengr.github.io/BERTopic/getting_started/topicsovertime/topicsovertime.html .

[R06] ACLED, ACLED end user licence agreement. https://acleddata.com/eula .

[R07] ACLED, ACLED content usage terms. https://acleddata.com/contentusage .

[R08] Uppsala University, UCDP API documentation. https://ucdp.uu.se/apidocs/index.html .

[R09] Uppsala University, UCDP dataset downloads. https://ucdp.uu.se/downloads/ .

[R10] Media Cloud, Media Cloud frequently asked questions. https://www.mediacloud.org/documentation/faqs .

[R11] ReliefWeb/OCHA, ReliefWeb API parameters. https://apidoc.reliefweb.int/parameters .

[R12] Meta, NLLB-200 distilled 600M model card. https://huggingface.co/facebook/nllb-200-distilled-600M .

[R13] ACL Anthology/WANLP, Arabic propaganda detection shared-task overview. https://aclanthology.org/2022.wanlp-1.11/ .

[R14] ACL Anthology/TACL, MIRACL multilingual retrieval benchmark. https://aclanthology.org/2023.tacl-1.63/ .

[R15] OpenAI, Codex developer commands. https://learn.chatgpt.com/docs/developer-commands?surface=cli .

[R16] Sentence Transformers, Sentence Transformers semantic search. https://sbert.net/examples/sentence_transformer/applications/semantic-search/README.html .

[R17] W3C, Web Annotation Data Model. https://www.w3.org/TR/annotation-model/ .

[R18] W3C, Inline bidirectional text markup. https://www.w3.org/International/articles/inline-bidi-markup/ .

[R19] PostgreSQL, PostgreSQL range types. https://www.postgresql.org/docs/current/rangetypes.html .

[R20] geoBoundaries, geoBoundaries. https://www.geoboundaries.org/ .

[R21] GDELT, GDELT DOC 2.0 API announcement. https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ .

[R22] GDELT, GDELT DOC/GEO search update. https://blog.gdeltproject.org/doc-geo-2-0-api-updates-full-year-searching-and-more/ .

[R23] DISARM Foundation, DISARM framework. https://www.disarm.foundation/framework .

