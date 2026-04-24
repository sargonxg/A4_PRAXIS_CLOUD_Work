# Dashboard

**Purpose.** First-touch situation overview — tells an analyst in ~10 seconds where a situation stands and what to do next.

**Methodology.** Widget grid composed from cached SKC reads. No blocking AI call on mount. An optional **Daily read** button invokes `POST /api/ai/dashboard-summary`, a calibrated (withCalibration) route that produces a 2-4 sentence summary and up to 4 suggested next tools.

**Inputs.** Active situation, analyst profile, user preferences, cached tool outputs, recent advisor turns.

**Outputs.** Widget render (client-side, real-time via onSnapshot). On-demand Daily read persisted at `users/{uid}/situations/{sid}/tools/dashboard`.

**Frameworks used.** INFORM Risk Index (risk gauge widget), Glasl escalation scale (escalation widget), MAW salience (stakeholder widget).
