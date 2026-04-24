# Stakeholder Map

**Purpose.** Visualises situation actors on the Mitchell-Agle-Wood (MAW) salience dimensions — Power, Legitimacy, Urgency — with quadrant classification and per-stakeholder cards.

**Methodology.** `src/lib/analytics/salience-engine.ts` scores each Actor node on three graph-edge heuristics:
- **Power** — counts outbound `has_leverage`, `controls_resource`, `commands`, `funds` edges.
- **Legitimacy** — counts inbound `recognised_by`, `member_of`, `mandated_by`, `allied_with` edges.
- **Urgency** — counts outbound `claims_urgency`, `escalates`, `triggered_by`, `violates_norm` edges.

Each attribute is normalised to [0, 1] (cap at 5 edges = 1.0). Quadrants per MAW 1997:
Definitive (all three), Dominant (P+L), Dangerous (P+U), Dependent (L+U), Dormant (P only), Discretionary (L only), Demanding (U only), Non-stakeholder (none).

**Inputs.** Graph nodes and edges from `users/{uid}/situations/{sid}/graph/main`.

**Outputs.** Salience table + 2D scatter with axis-pair toggle. "AI explain" posts the selected actor id to a calibrated analysis route.

**Frameworks.** Mitchell-Agle-Wood salience (primary), Barnett-Duvall power (secondary), Stedman spoiler theory (qualitative overlay).

**Citation.** Mitchell, R. K., Agle, B. R., & Wood, D. J. (1997). Toward a theory of stakeholder identification and salience: Defining the principle of who and what really counts. *Academy of Management Review*, 22(4), 853-886.
