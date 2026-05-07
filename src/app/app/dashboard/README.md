# Dashboard

**Purpose.** First-touch app command center. It tells an analyst, mediator, or policy user which case is active and routes them into the real workbench surfaces: context, graph, tools, memo studio, boardroom, ACH, and settings.

**Methodology.** No blocking AI call on mount. The page uses the local case store plus example-case registry data, then links into case-scoped workbench routes so context and tool execution stay together.

**Inputs.** Active situation, example-case registry, marketplace tool registry, analyst profile, user preferences, cached tool outputs, recent advisor turns.

**Outputs.** A real app landing surface with quick actions, active-case metrics, live-workbench graph visualization, and status notes that do not overstate backend readiness.

**Frameworks used.** INFORM Risk Index (risk gauge widget), Glasl escalation scale (escalation widget), MAW salience (stakeholder widget).
