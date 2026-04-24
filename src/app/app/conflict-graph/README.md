# Conflict Graph

**Purpose.** ACO v2-aligned visualisation of the situation's 14 entity types and 72 typed relationships. Lets the analyst see actor-claim-interest-leverage-event structure at a glance and drill into any node for attributes, confidence, and trust score.

**Methodology.** Entities are coloured from `src/lib/constants/entity-colors.ts` (14 types). Edges are styled by relationship category (5 groups: causal, structural, antagonistic, cooperative, foundational). Confidence levels (EXTRACTED / INFERRED / AMBIGUOUS / ASSESSED) map to edge opacity.

**Inputs.** Firestore `users/{uid}/situations/{sid}/graph/main` (nodes[] + edges[]). Optional analyses at `graph/analysis` (pivot actors, faction map, hidden linkages, escalation).

**Outputs.** Interactive force-directed graph. "AI explain" on a selected node calls `POST /api/ai/claude-analyze` with `{ targetEntityId }`. Export buttons: SVG (visual) + JSON (structural).

**Frameworks referenced in analyses.** Stedman spoiler dynamics, Fisher-Ury positions/interests, Zartman ripeness, Galtung triangle, Barnett-Duvall power.
