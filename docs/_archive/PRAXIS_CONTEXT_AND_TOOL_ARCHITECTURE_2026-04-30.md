# PRAXIS Context And Tool Architecture - 2026-04-30

This note defines the next product-engineering spine for PRAXIS tools. The goal
is that every tool behaves like a real micro-app, while sharing one knowledge
context contract instead of creating one-off prompt and storage patterns.

## Current Architecture Decision

PRAXIS now has three explicit layers for every tool:

1. Tool registry: `src/lib/constants/tool-registry.ts`
   - id, route, category, schema, methods, sources, stale window, related tools.
2. Operating contract: `src/lib/tools/tool-operating-contracts.ts`
   - why the tool exists, what it asks, what it produces, how Ask PRAXIS can edit
     it, and what quality bar it must meet.
3. Context blueprint: `src/lib/tools/tool-context-blueprints.ts`
   - what context layers it requires, which Firestore paths it reads/writes, how
     it participates in the graph backbone, whether it is a document-production
     tool, and how it should degrade when evidence is weak.

Generated documentation now exists for every registered tool:

- `docs/tools/generated/INDEX.md`
- `docs/tools/generated/{toolId}.md`

Regenerate with:

```powershell
npm run generate:tool-docs
```

## Shared Context Layers

Every tool should be wired against these layers, not against bespoke local
state:

- `analyst-profile`: role, audience, language, red lines, preferences.
- `user-preferences`: citation style, preferred advisor, source ordering.
- `situation-record`: name, region, actors, description, domain, workflow path.
- `source-library`: saved sources, blocked/preferred sources, reliability notes.
- `document-corpus`: uploaded files, extracted chunks, entity links, checksums.
- `prior-tool-outputs`: canonical `tool-data/{toolId}` outputs.
- `live-web-research`: grounded search receipts and fetched snippets.
- `external-feeds`: UCDP, GDELT, ReliefWeb, HDX, World Bank, etc.
- `graph-backbone`: current ACO graph and future Dialectica ontology graph.
- `drafting-constraints`: audience, mandate, red lines, style, format.
- `advisor-memory`: prior advisor turns and analyst memory patterns.
- `team-workspace`: collaboration, permissions, ownership, handoff state.

## Database Contract

Canonical output path:

```text
users/{uid}/situations/{situationId}/tool-data/{toolId}
```

Version history:

```text
users/{uid}/situations/{situationId}/tool-data/{toolId}/versions/{version}
```

Legacy compatibility path while migration completes:

```text
users/{uid}/situations/{situationId}/tools/{toolId}
```

Graph proposals:

```text
users/{uid}/situations/{situationId}/graph_updates/{proposalId}
```

Document chunks:

```text
users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}
```

Source corpus:

```text
users/{uid}/situations/{situationId}/sources/{sourceId}
```

Audit trail target:

```text
users/{uid}/situations/{situationId}/tool-runs/{toolRunId}
```

## Active Product Paths

The app is now coded for generic core plus ten specialized paths, but the active
implementation focus is deliberately narrow:

- Generic PRAXIS Core
- Conflict / Political Analyst

Everything else remains codified for future activation and should not distract
from making the generic and conflict/political tools excellent.

## Dialectica Backbone Plan

The current graph model is ACO-oriented and supports actors, claims, interests,
constraints, leverage, commitments, events, narratives, institutions, norms,
resources, risks, policies, and grievances.

The future premium Dialectica backbone should add:

- ontology-governed node and edge types;
- provenance-first graph mutations staged for analyst approval;
- graph retrieval as a first-class LLM context layer;
- contradiction and uncertainty tracking;
- reusable cross-situation patterns;
- role-specific views over the same graph.

Current implementation rule: tools may read graph context and propose graph
updates, but should not silently mutate the canonical graph without analyst
approval.

## Document Production And LibreOffice

Drafting tools should first produce structured sections and metadata, not only
plain text. That keeps exports deterministic:

- Policy Memo: decision memo, options paper, implementation roadmap.
- Talking Points: key messages, Q&A, red lines, bridge language.
- Briefing/Dossier: executive brief, case file, actor or situation packet.
- UN Toolkit: clauses, mandate language, resolution-style language.
- Legal/Sanctions/Treaty tools: legal or compliance notes with caveats.

LibreOffice/DOCX/PDF export should render saved structured outputs from
`tool-data/{toolId}`. Export should not require a second model call.

## Next Implementation Wave

1. Promote dashboard, conflict graph, source scout, deep search, policy memo,
   talking points, sources library, and documents to full context-blueprint UI.
2. Add route helpers that include `buildToolContextBlueprintPrompt(toolId)` in
   AI routes before bespoke prompt instructions.
3. Make `saveToolOutput` the only canonical server persistence helper and
   complete migration from legacy `tools/{toolId}` reads.
4. Add source/provenance panels to every active generic/political tool.
5. Add demo situation showcase data that exercises real UI states without
   leaking demo content into real user situations.
6. Build a document export adapter that maps saved structured drafting outputs
   into DOCX/PDF/LibreOffice-compatible sections.
7. Add browser smoke flows for first-time user, power user, skeptical user,
   technical user, and professional policy user.

## Admin And Operator Readiness

Admin access is allowed through either:

- explicit Firebase uid in `ADMIN_ALLOWLIST`; or
- verified email in `ADMIN_EMAIL_ALLOWLIST`.

The default verified admin emails are:

- `giulio@tacitus.me`
- `giuliocatanzariti@gmail.com`

Production Cloud Build sets the same emails explicitly. Local verification:

```powershell
npm run admin:check -- giulio@tacitus.me
```

Expected result: `admin: true` and `reason: verified-email-allowlist`.

The `/api/admin/me` endpoint returns the current principal, gate reason,
verified-email status, configured email allowlist, and UID allowlist count so
the admin panel can explain failures without exposing secrets.
