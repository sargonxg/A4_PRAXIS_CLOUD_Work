# PRAXIS Persona Test Plan - 2026-04-28

Purpose: make free, trial, and paid PRAXIS feel real to policy users instead
of testing only generic analyst flows.

## Diplomat Personas

| Persona | Job-to-be-done | Free wow moment | Paid/trial wow moment |
|---|---|---|---|
| UN political officer | Prepare a 15-minute morning read before mission leadership | Live grounded search, early-warning scan, actor update | Deep Research Agent, commitments tracker, red-team assumptions |
| Bilateral country desk | Brief an ambassador before a bilateral call | Situation dashboard, talking points, stakeholder map | Negotiation prep, sanctions/legal overlay, exportable brief |
| Envoy support officer | Map negotiation space and red lines | Actor positions and claims from public sources | Brainstorming Table, ZOPA/BATNA, mediator strategy memo |
| Humanitarian access lead | Understand access constraints and protection risks | Humanitarian snapshot from open sources | Document/corpus RAG over reports, access negotiation options |
| Sanctions/compliance analyst | Track designations, ownership, and legal risk | Sanctions tool and source-backed actor profile | Deep entity enrichment, cross-source contradiction checks |
| Think-tank researcher | Build a defensible policy memo | Free grounded search and source library | Large corpus RAG, comparative cases, export/report studio |

## Smoke Scenarios

1. New free user creates a situation and asks: "What changed in eastern DRC in
   the last 72 hours?" Expected: cited live/open-source research, useful next
   actions, no upgrade wall before first value.
2. Free user opens settings and sees that provider keys are optional but can
   unlock advanced sources. Expected: Google-first defaults remain clear.
3. User redeems a one-week code. Expected: plan badge updates after reload,
   analyst/team/enterprise tools become available, expiry is stored.
4. Paid/trial user runs a high-depth research flow. Expected: Firecrawl,
   Parallel, Vertex/LangGraph paths are described or executed based on keys and
   configuration; missing keys produce settings chips, not silent failure.
5. Team admin publishes a future knowledge-base bot. Expected: corpus scope,
   citations, public/internal visibility, revocation, and audit controls are
   explicit.

## Free Tier Guardrail

Free users should never feel like every valuable action is blocked. The minimum
free promise is: create a situation, run grounded research, get a useful
dashboard, use selected core tools, add documents/notes, and understand exactly
which advanced keys or paid tiers unlock deeper workflows.
