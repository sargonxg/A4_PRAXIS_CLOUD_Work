# PRAXIS Agent Registry

> Authored 2026-04-26. Single source of truth for every persona PRAXIS can
> invoke. Every consumer (route, page, orchestrator, doc) must import
> `AGENT_REGISTRY` from `src/lib/agents/registry.ts`. This document and the
> code file evolve together — never edit one without the other.

## Why a registry

Before this lane, persona definitions were duplicated across the
Brainstorming Table route, agent-system specs, and the docs. A single typo
or behavioural drift in one place would silently corrupt deliberation
output. The registry collapses persona vocabulary, role prompts,
frameworks, and tool handoffs into one canonical record per persona.

## Anatomy of a persona

| Field | Meaning |
|---|---|
| `id` | Stable lowercase-hyphen identifier. Never renamed once shipped. |
| `label` | Display label (UI rows, pills, table columns). |
| `rolePrompt` | Paragraph injected into system prompts. Methodology-anchored, not just a job title. |
| `frameworks` | Methodologies the persona is anchored on. Surfaced in `<OutputProvenancePanel />` once tool envelopes carry agent metadata. |
| `handoffTools` | PRAXIS tool ids this persona will recommend invoking. |
| `critic` | True if this persona is required to challenge another row in a deliberation. |
| `active` | False on stubs that exist for forward-compatibility but aren't wired yet. `getPersona()` returns null for inactive ids. |

## Active personas (six)

| id | Label | Anchor frameworks | Handoff tools |
|---|---|---|---|
| `mediator` | Mediator | Berghof Process Design, Zartman Ripeness, Fisher-Ury, Stedman Spoiler | negotiation-prep, mediation-design, concordia |
| `humanitarian` | Humanitarian Lead | OCHA Principles, IPC, SPHERE, IASC | humanitarian, sources-library, briefing |
| `legal` | Legal Analyst | UN Charter VI/VII, Rome Statute, Geneva, ICJ Statute, Customary IHL | legal-tracker, un-toolkit, treaty-analyzer |
| `media` | Media Analyst | Entman Framing, Galtung Cultural Violence, Reliability Spectrum | media-compass, media-roundup, argus |
| `security` | Security/Risk Analyst | INFORM Risk, Glasl, ICD 203, Fearon Rationalist | risk-monitor, early-warning, scenarios |
| `red-team` | Red Team Critic | Heuer SAT, ICD 203, Devil's Advocacy | sat |
| `synthesis-chair` | Synthesis Chair | UN DPPA Brief Writing, ICD 203 | n/a (orchestrator) |

The Synthesis Chair is the orchestrator that writes the BLUF, consensus,
divergences, decision options, open questions, and next actions block at
the end of every deliberation. It does not contribute a row to the
deliberation table — it composes the synthesis below it.

## Stub personas (forward-compatibility)

These are codified now so the rest of the system (UI registries, tests,
docs) can reference them without breaking, but they are not yet wired to
routes:

| id | Label | When it goes live | Tracking brick |
|---|---|---|---|
| `source-scout` | Source Scout | After `/api/ai/source-scout` lands | BIG #19 |
| `graph-cartographer` | Graph Cartographer | After backend extraction emits `graph_updates` | BIG #20 |
| `timeline-editor` | Timeline Editor | After `timeline_updates` collection lands | BIG #21 |

When activating a stub, set `active: true` in the registry and add a
unit-test row asserting the persona resolves through `getPersona(id)`.

## How to add a new persona

1. Add the entry to `AGENT_REGISTRY` in `src/lib/agents/registry.ts`.
2. If active, declare at least one handoff tool unless it is an
   orchestrator (synthesis-chair-class personas can omit handoffs).
3. Update the table above.
4. Add a one-line test in `tests/services/agent-registry.test.ts`.
5. Update `docs/AGENTIC_SYSTEM.md` "Agent Types" table.
6. If the persona contributes to Brainstorming Table panels, add it to
   `DEFAULT_BRAINSTORMING_PANEL` in code.

## How agents get invoked

```
caller (chat route / Brainstorming Table / future agent runner)
  └─ buildCalibratedContext({uid, situationId, toolId, retrievalQuery})
     └─ writes <analyst-profile>, <situation-frame>, <output-constraints> XML
  └─ load AGENT_REGISTRY
     └─ select personas (default panel or analyst-supplied)
     └─ render persona role prompts into the system prompt
  └─ searchSituationCorpus({uid, situationId, query, layers, limit})
     └─ inject corpus items as ## CORPUS EVIDENCE block
  └─ callProModel({system, prompt, output: Output.object({schema})})
  └─ saveToolOutput({toolId, output, profileVersion, metadata})
```

## Operating principles

1. **Methodology-anchored prompts.** A persona's rolePrompt names
   frameworks the analyst recognises — not "you are an expert".
2. **Citations or gaps.** Every persona must cite a corpus item or mark
   `sourceType="reasoning"`. The Brainstorming Table schema enforces this.
3. **At least one critic per deliberation.** The default panel always
   includes `red-team`. Custom panels must include at least one
   `critic: true` persona.
4. **No silent persona drift.** Adding/changing a persona requires
   touching this doc, the registry, and a test.
5. **Stubs are public.** Stub personas appear in this doc so future
   agents know what's queued — they're not hidden until activation.

## Where this fits in the bigger picture

- `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` Bricks 18–22 are the
  durable agentic work (Cloud Tasks, source scout, graph cartographer,
  timeline editor, red-team auto-review).
- `docs/AGENTIC_SYSTEM.md` describes the agent execution model
  (synchronous → Cloud Tasks fan-out).
- `docs/CORPUS_ARCHITECTURE.md` is the retrieval contract every agent
  reasons over.
- `docs/CODEX_HANDOFF_2026-04-26.md` lists who's working on what so
  ownership doesn't collide.
