# PRAXIS Syria Case Recording Runbook

## Canonical Entry

Use one Syria case inside the real app:

- Local: `http://localhost:3100/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria`
- Production: `https://praxis.tacitus.me/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria`
- Direct app desk after sign-in: `/app/syria-case?recording=1&case=syria`
- Direct tool links also enter the populated Syria case in no-account mode:
  - `https://praxis.tacitus.me/app/brainstorming-table`
  - `https://praxis.tacitus.me/app/policy-memo`
  - `https://praxis.tacitus.me/app/briefing`

The no-account mode is only access plumbing. User-facing copy should describe this as a populated public-source Syria case file in the real PRAXIS app, not as a separate demo product.

## Product Structure

The Syria case proves the PRAXIS loop:

1. Situation room: risk, readiness, sources, graph health, actors, and next actions.
2. Context Builder: known facts, thin assumptions, missing evidence, research handoff.
3. Source Scout: checkable UN and humanitarian receipts with reliability tiers.
4. GraphOps: Firestore graph health, provenance coverage, temporal anchors, repair suggestions.
5. Conflict Graph: visual actor/event/claim network for human exploration.
6. Advisor Table: structured disagreement across mediator, humanitarian, legal, security, media, and red-team views.
7. Briefing Studio: decision-ready slides with BLUF, risk triggers, sources, and next actions.
8. Work Products: editable policy memo and decision brief screens with local library save, DOCX import, and LibreOffice-compatible DOCX export.

## Methodologies To Show

- ACO v2.0 typed conflict graph: actors, claims, interests, constraints, leverage, commitments, events, narratives.
- Glasl escalation staging and PRAXIS volatility scoring.
- INFORM-style hazard, vulnerability, and coping-capacity decomposition.
- Source receipt hierarchy: primary public institutions first, then humanitarian reporting, then corroboration.
- ICD-203-style discipline: assumptions, uncertainty, dissent, and evidence gaps remain visible.
- Firestore-first GraphOps: staged graph changes, provenance, temporal anchors, and analyst review.

## 45-Second Click Flow

1. `00-06` `/app/dashboard?recording=1&case=syria`
   Show the situation room: 78/100 risk, actor roster, source coverage, graph readiness, and next actions.

2. `06-12` `/app/context-builder?recording=1&case=syria`
   Show context health and missing local governance / field-verification gaps.

3. `12-18` `/app/source-scout?recording=1&case=syria`
   Show source receipts: UN Geneva, OCHA, UN Syria CCA, UNFPA, UNHCR.

4. `18-24` `/app/graphops?recording=1&case=syria`
   Show graph health, provenance, temporal coverage, and repair suggestions.

5. `24-31` `/app/conflict-graph?recording=1&case=syria`
   Click the January agreement, SDF, displacement, and regional spillover nodes.

6. `31-38` `/app/brainstorming-table?recording=1&case=syria`
   Show the expert disagreement table and red-team warning.

7. `38-45` `/app/briefing?recording=1&case=syria`
   End on the decision brief. Show BLUF, graph readout, risk triggers, and sources.

Optional product-save insert: open `/app/policy-memo?recording=1&case=syria`, show the Work Document panel, click `Improve`, `Save`, and `Export DOCX`. This proves PRAXIS is producing office-ready work products, not only screen visualizations.

## Editable Work Products

Policy Memo and Briefing now include a PRAXIS Work Document panel:

- `Save` stores the structured product in the browser work-product library for the current session.
- `Improve` performs a local structure polish without spending cloud or model credits.
- `Import DOCX` parses uploaded DOCX files through the server-side Mammoth route and converts them into editable sections.
- `Export DOCX` generates a LibreOffice Writer / Microsoft Word compatible DOCX through the server-side `docx` route.

The official LibreOffice GitHub `core` repository is the full desktop suite source, not a lightweight browser editor. A future collaborative editor should use a Collabora Online / WOPI deployment. The current PRAXIS implementation is intentionally lighter: structured in-app editing plus DOCX import/export now, with no always-on office server cost.

## Voiceover Prompt

Generate a serious, high-trust investor-demo voiceover in 45 seconds. Tone: calm, authoritative, fast but clear, like a senior policy technology founder briefing investors.

Script:

PRAXIS opens a real Syria public-source case file: risk, actors, sources, graph health, and next actions in one operating room. Before any model answer, Context Builder shows what is known, what is thin, and which evidence gaps block confidence. Source Scout turns the Syria question into checkable UN and humanitarian receipts with reliability tiers and explicit gaps. GraphOps shows the Firestore graph as a production asset: provenance, temporal anchors, repair suggestions, and review gates. The visual graph makes the case legible: the January agreement links to the SDF, Kurdish rights, displacement, aid, and regional spillover. Then the advisor table preserves structured disagreement: mediator, humanitarian, legal, security, media, and red-team views stay separate. The final output is not a chat. It is a briefable decision product: facts, assessment, triggers, source basis, and next actions.

## Source Basis

- UN Geneva, 13 February 2026: Syria transition, 30 January Damascus-SDF agreement, rights provisions, southern violence, Israeli incursions, humanitarian strain.
- UN Geneva / OCHA, 18 March 2026: regional escalation risks undermining Syria recovery; humanitarian operations constrained by funding, liquidity, airspace, and security risks.
- UN Syria Common Country Analysis, 31 March 2026: integrated transition analysis, recovery risks, and trust-building as a cross-cutting priority.
- UNHCR, 12 December 2025: large-scale returns and urgent shelter, services, and protection challenges.

## Recording Rules

- Say public-source case file, not classified intelligence.
- Show uncertainty and evidence gaps as product strength.
- Do not imply graph mutations bypass analyst review.
- Do not show private customer material.
- The goal is to prove PRAXIS is a structured operating system for live analysis, not a chat wrapper.
