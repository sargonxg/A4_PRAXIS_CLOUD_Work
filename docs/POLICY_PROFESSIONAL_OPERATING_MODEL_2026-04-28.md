# PRAXIS Policy Professional Operating Model

Status: active product direction as of 2026-04-28.

## Ambitious Goal

PRAXIS should become the operating room for policy professionals: a single
situation workspace where a diplomat, mediator, humanitarian lead, legal
analyst, researcher, or institutional team can turn messy source material into
defensible decisions, briefings, negotiation positions, and follow-up tasks.

The product should not feel like a generic AI chat sidebar. It should feel like
a disciplined policy workflow with expert agents, citations, memory, admin
visibility, and safe escalation from free exploration to paid professional use.

## Core Workflow

1. Create or select a situation.
2. Add context: mandate, actors, geography, constraints, documents, notes,
   sources, prior outputs, and preferred audience.
3. Ask PRAXIS for orientation, grounded search, source discovery, or a first
   draft.
4. Run a role-specific tool path: political desk, mediation, humanitarian,
   legal/sanctions, risk, media, election, governance, or research.
5. Use Brainstorming Table to let expert personas deliberate over a question,
   pasted text, and selected uploaded documents.
6. Red-team the output, convert it into a briefing, memo, talking points, or
   task list, then persist it back into the situation corpus.
7. Let admin and health surfaces show whether billing, provider keys,
   documents, RAG, jobs, and user entitlements are working.

## Deliverables PRAXIS Should Reliably Produce

- One-page situation readout with BLUF, change since last read, and confidence.
- Diplomatic briefing with talking points, risks, asks, and evidence links.
- Mediation design note with parties, incentives, spoilers, sequencing, and
  confidence-building measures.
- Humanitarian access snapshot with protection, logistics, displacement, and
  coordination constraints.
- Legal/sanctions memo with obligations, breach theories, authorities, and
  evidentiary gaps.
- Media and information-environment note with narratives, source diversity,
  audience effects, and escalation risks.
- Expert deliberation table with persona turns, disagreements, red-team
  critique, synthesis, options, and named next actions.
- Knowledge-base answer from approved corpora with citations and refusal rules.

## Free, Trial, and Paid Experience

- Free users must be able to create situations, upload/use limited documents,
  run some Google/open-data research, ask PRAXIS, and generate at least one
  impressive expert deliberation or briefing with citations.
- One-week full-access codes are for serious pilots. They should unlock the
  full workflow without pretending to be a billing subscription.
- Analyst should unlock deeper research, Parallel, Firecrawl, Deep Research,
  larger document/context budgets, and more exports.
- Team should unlock shared situations, shared corpora, team billing/admin,
  shared knowledge bases, and higher quotas.
- Enterprise should unlock private deployments, managed Google Cloud posture,
  public/internal ARGUS-style bots, audit logs, Model Armor policy checks, and
  procurement-ready support.

## Admin Requirements

The admin panel must work for `giulio@tacitus.me` through the server-side
allowlist and Firebase verified email state. It should show:

- user plan, subscription provider, Polar status, trial and promo expiry;
- provider key coverage for Google, Firecrawl, Parallel, Tavily, Anthropic, and
  future research providers;
- situation/document/tool-output health;
- failed jobs, degraded providers, and retry actions;
- safe diagnostics without exposing secret values or raw sensitive payloads.

## Expert Persona Requirements

Expert personas must be useful to both free and paid users:

- Free users get limited but real persona deliberation over the active
  situation and supplied working material.
- Paid users get deeper evidence retrieval, premium research handoffs, larger
  context windows, and durable sessions.
- Personas must state assumptions, cite evidence, expose uncertainty, and make
  concrete recommendations.
- The Brainstorming Table is the current visualization surface for expert
  discussion. Future durable LangGraph sessions should let analysts pause,
  edit intermediate turns, approve a synthesis, and reuse the conversation in
  Briefing Room or Report Studio.

## Next Shipping Queue

1. Move Brainstorming Table to Cloud Tasks + LangGraph with checkpointed expert
   turns and resumable synthesis.
2. Normalize tool outputs, document chunks, source saves, and research artifacts
   into one corpus envelope.
3. Store original uploads in Cloud Storage with Document AI fallback for scanned
   PDFs, while keeping extracted text/chunks in Firestore.
4. Add situation health and admin health drill-downs for documents, RAG,
   provider keys, billing, jobs, and tool outputs.
5. Complete Polar product/webhook setup and checkout-to-entitlement smoke.
6. Build knowledge-base assistant publishing behind Team/Enterprise gates.
7. Add quality evals for citation faithfulness, unsupported claims, persona
   usefulness, and tool-output persistence.
