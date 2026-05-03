# PRAXIS Syria Case Recording Runbook

## Canonical Entry

Use one Syria case inside the real app:

- Local: `http://localhost:3100/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria`
- Production: `https://praxis.tacitus.me/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria`
- Direct app desk after sign-in: `/app/syria-case?recording=1&case=syria`
- Source Scout research modes: `/app/source-scout?recording=1&case=syria`
- Deep Research Agent research contract: `/app/deep-search-agent?case=syria`
- Direct tool links also enter the populated Syria case in no-account mode:
  - `https://praxis.tacitus.me/app/brainstorming-table`
  - `https://praxis.tacitus.me/app/policy-memo`
  - `https://praxis.tacitus.me/app/briefing`

The no-account mode is only access plumbing. User-facing copy should describe this as a populated public-source Syria case file in the real PRAXIS app, not as a separate demo product.

For the cleanest recording, use the canonical production entry above. It opens the real app, loads the calibrated Syria analyst profile, suppresses the first-time welcome tour for `recording=1&case=syria`, and shows the floating 45-second director.

## Product Structure

The Syria case proves the PRAXIS loop:

1. Situation room: risk, readiness, sources, graph health, actors, and next actions.
2. Context Builder: known facts, thin assumptions, missing evidence, research handoff.
3. Source Scout: checkable UN, humanitarian, local media, and think-tank receipts with reliability tiers.
4. Media Compass / Media Roundup: local Syrian media, state messaging, economic reporting, monitoring sources, and narrative divergence.
5. Deep Research Agent: explicit research modes and a graph-grounded response contract for live, very specific policy questions.
6. GraphOps: Firestore graph health, provenance coverage, temporal anchors, repair suggestions, and staged graph proposals.
7. Conflict Graph: visual actor/event/claim/commitment network for human exploration.
8. Advisor Table: structured disagreement across mediator, humanitarian, legal, security, media, and red-team views.
9. Briefing Studio: decision-ready slides with BLUF, risk triggers, sources, and next actions.
10. Work Products: editable policy memo and decision brief screens with local library save, DOCX import, and LibreOffice-compatible DOCX export.

## Methodologies To Show

- ACO v2.0 typed conflict graph: actors, claims, interests, constraints, leverage, commitments, events, narratives.
- Glasl escalation staging and PRAXIS volatility scoring.
- INFORM-style hazard, vulnerability, and coping-capacity decomposition.
- Source receipt hierarchy: primary public institutions first, then humanitarian reporting, then corroboration.
- ICD-203-style discipline: assumptions, uncertainty, dissent, and evidence gaps remain visible.
- Firestore-first GraphOps: staged graph changes, provenance, temporal anchors, and analyst review.
- GraphRAG / neuro-symbolic reasoning: LLMs read and draft; the graph stores actors, claims, commitments, exact wording, dates, source receipts, contradictions, and ontology rules.

## Live Research Modes To Show

The app now models research modes that can be run live in `Source Scout` and
the `Deep Research Agent`:

1. Latest-source sweep.
2. Think-tank discrepancy review.
3. Commitment and communique monitor.
4. Local media and narrative divergence.
5. Graph-grounded policy question.
6. Economic and HLP scenario research.

Each mode should be described as a specific policy-research loop:

- search targeted source families;
- extract typed graph candidates;
- compare discrepancies in claims, wording, timing, omissions, and confidence;
- stage graph updates through GraphOps;
- return a brief-ready answer with source receipts and next searches.

## Structured Research Answer Contract

Every deep research response should return:

1. Question and scope.
2. Source receipts.
3. Findings by confidence.
4. Discrepancy table.
5. Graph grounding.
6. Policy implications.
7. Next searches.

This is the bridge between "AI research" and the PRAXIS moat: search output is
not just text. It becomes graph-ready institutional memory.

## 45-Second Click Flow

1. `00-06` `/app/dashboard?recording=1&case=syria`
   Show the situation room: 78/100 risk, actor roster, source coverage, graph readiness, and next actions.

2. `06-12` `/app/context-builder?recording=1&case=syria`
   Show context health and missing local governance / field-verification gaps.

3. `12-18` `/app/source-scout?recording=1&case=syria`
   Show source receipts and the live research modes: latest UN, local media,
   think-tank discrepancy, commitment monitor, and graph-grounded policy question.

4. `18-23` `/app/media-compass?recording=1&case=syria`
   Show local Syrian media, state messaging, economic reporting, monitoring
   sources, reliability/proximity posture, and briefing handoff.

5. `23-29` `/app/graphops?recording=1&case=syria`
   Show graph health, provenance, temporal coverage, and repair suggestions.

6. `29-35` `/app/conflict-graph?recording=1&case=syria`
   Click the January agreement, SDF, displacement, and regional spillover nodes.

7. `35-40` `/app/brainstorming-table?recording=1&case=syria`
   Show the expert disagreement table and red-team warning.

8. `40-45` `/app/briefing?recording=1&case=syria`
   End on the decision brief. Show BLUF, graph readout, risk triggers, and sources.

Optional product-save insert: open `/app/policy-memo?recording=1&case=syria`, show the Work Document panel, click `Improve`, `Save`, and `Export DOCX`. This proves PRAXIS is producing office-ready work products, not only screen visualizations.

## Editable Work Products

Policy Memo and Briefing now include a PRAXIS Work Document panel:

- `Save` stores the structured product in the browser work-product library for the current session.
- `Improve` performs a local structure polish without spending cloud or model credits.
- `Preview` shows the office-style memo or brief as a readable product before export.
- `Audit` shows review checklist, source basis, situation context, and analyst calibration.
- `Sharpen Draft` adds local review prompts to each section so the analyst can quickly turn a draft into a decision-ready product.
- `Import DOCX` parses uploaded DOCX files through the server-side Mammoth route and converts them into editable sections.
- `Export DOCX` generates a LibreOffice Writer / Microsoft Word compatible DOCX through the server-side `docx` route.

The official LibreOffice GitHub `core` repository is the full desktop suite source, not a lightweight browser editor. A future collaborative editor should use a Collabora Online / WOPI deployment. The current PRAXIS implementation is intentionally lighter: structured in-app editing plus DOCX import/export now, with no always-on office server cost.

## Voiceover Prompt

Generate a serious, high-trust investor-demo voiceover in 45 seconds. Tone: calm, authoritative, fast but clear, like a senior policy technology founder briefing investors.

Script:

PRAXIS opens a real Syria public-source case file: risk, actors, sources, graph health, and next actions in one operating room. Before any model answer, Context Builder shows what is known, what is thin, and which evidence gaps block confidence. Source Scout turns the Syria question into checkable UN and humanitarian receipts with reliability tiers and explicit gaps. GraphOps shows the Firestore graph as a production asset: provenance, temporal anchors, repair suggestions, and review gates. The visual graph makes the case legible: the January agreement links to the SDF, Kurdish rights, displacement, aid, and regional spillover. Then the advisor table preserves structured disagreement: mediator, humanitarian, legal, security, media, and red-team views stay separate. The final output is not a chat. It is a briefable decision product: facts, assessment, triggers, source basis, and next actions.

Alternative research-heavy script:

PRAXIS opens a real Syria public-source case file and shows the research work
before the answer. Source Scout can run a latest-source sweep, compare think
tank claims, monitor commitments, and map local Syrian media. Each search
returns receipts, confidence, discrepancies, graph paths, and next searches.
The graph is the difference: actors, claims, commitments, dates, exact wording,
and source provenance become reusable memory, not one-off chat text. GraphOps
then stages updates for analyst review, and the final output becomes a brief or
memo with facts, assessment, gaps, triggers, and source basis.

## Source Basis

- UN Geneva, 13 February 2026: Syria transition, 30 January Damascus-SDF agreement, rights provisions, southern violence, Israeli incursions, humanitarian strain.
- UN Geneva / OCHA, 18 March 2026: regional escalation risks undermining Syria recovery; humanitarian operations constrained by funding, liquidity, airspace, and security risks.
- UN Syria Common Country Analysis, 31 March 2026: integrated transition analysis, recovery risks, and trust-building as a cross-cutting priority.
- UNHCR, 12 December 2025: large-scale returns and urgent shelter, services, and protection challenges.
- Microsoft GraphRAG and recent GraphRAG / neuro-symbolic AI research: graph
  communities, knowledge graphs, and ontologies improve multi-hop reasoning,
  global sensemaking, explanations, and hallucination repair compared with
  flat vector retrieval alone.

## Recording Rules

- Say public-source case file, not classified intelligence.
- Show uncertainty and evidence gaps as product strength.
- Do not imply graph mutations bypass analyst review.
- Do not show private customer material.
- The goal is to prove PRAXIS is a structured operating system for live analysis, not a chat wrapper.
