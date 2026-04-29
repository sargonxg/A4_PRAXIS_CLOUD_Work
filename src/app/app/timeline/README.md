# Timeline

**Purpose.** Chronological narrative of a situation's episodes (user-annotated) and events (feed-ingested), grouped by day.

**Methodology.** Server-side aggregation via `aggregateEpisodesByDay` in `src/lib/firebase/episodes.ts`. Client filters by actor, event type, source, and confidence level. **Narrate this period** button posts the filtered event set to `POST /api/ai/briefing-generate` which produces a calibrated narrative in the user's preferred language and citation style.

**Inputs.** Episodes from `users/{uid}/situations/{sid}/episodes/*` (importance 1-5, deletedAt null), events from grounded search and public feed layers, user preferences (language, report length).

**Outputs.** Timeline UI + optional AI narration persisted at `tools/timeline`.

**Frameworks.** Glasl escalation ladder (stage annotations), CAMEO event coding (event type taxonomy).
