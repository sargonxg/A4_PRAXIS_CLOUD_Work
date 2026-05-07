"""Human Rights ontology mirror."""
from .base import CaseOntologyDefinition, OntologyEdgeType, OntologyNodeType, OntologyValidator

ONTOLOGY = CaseOntologyDefinition(
    id="human-rights",
    version="1.0.0",
    label="Human Rights Ontology",
    description="Violations, rights-holders, duty-bearers, legal obligations, remedies, and pattern evidence.",
    domains=["human-rights", "human_rights", "protection", "upr", "treaty-body", "special-procedures"],
    node_types=[
        OntologyNodeType(id="rights_holder", label="Rights Holder", primitive="Actor", description="Individual or group whose rights are at stake."),
        OntologyNodeType(id="duty_bearer", label="Duty Bearer", primitive="Actor", description="Actor responsible for rights obligations."),
        OntologyNodeType(id="violation_claim", label="Violation Claim", primitive="Claim", description="Asserted breach of an enumerated right."),
        OntologyNodeType(id="protected_interest", label="Protected Interest", primitive="Interest", description="Interest protected by a right."),
        OntologyNodeType(id="legal_obligation", label="Legal Obligation", primitive="Constraint", description="Treaty, customary, or domestic rule."),
        OntologyNodeType(id="accountability_lever", label="Accountability Lever", primitive="Leverage", description="Mechanism for inducing compliance."),
        OntologyNodeType(id="remedial_measure", label="Remedial Measure", primitive="Commitment", description="Reparation or guarantee of non-repetition."),
        OntologyNodeType(id="incident_event", label="Incident Event", primitive="Event", description="Documented rights incident."),
        OntologyNodeType(id="pattern_narrative", label="Pattern Narrative", primitive="Narrative", description="Pattern frame connecting incidents."),
    ],
    edge_types=[
        OntologyEdgeType(id="violates", label="violates", from_=["Actor"], to=["Constraint"], description="Actor violates a legal obligation."),
        OntologyEdgeType(id="protects", label="protects", from_=["Constraint"], to=["Interest"], description="Legal obligation protects an interest."),
        OntologyEdgeType(id="evidences_pattern", label="evidences pattern", from_=["Event"], to=["Narrative"], description="Incident evidences a pattern."),
        OntologyEdgeType(id="targets", label="targets", from_=["Actor"], to=["Actor"], description="Actor targets a rights holder."),
        OntologyEdgeType(id="requires_remedy", label="requires remedy", from_=["Claim"], to=["Commitment"], description="Claim requires a remedy."),
        OntologyEdgeType(id="engages_lever", label="engages lever", from_=["Actor"], to=["Leverage"], description="Monitoring actor engages a lever."),
    ],
    validators=[
        OntologyValidator(id="human-rights.has-rights-holder", label="Rights holder identified", severity="warn", description="At least one rights holder should be present."),
        OntologyValidator(id="human-rights.has-duty-bearer", label="Duty bearer identified", severity="warn", description="Violation claims should identify a duty bearer."),
        OntologyValidator(id="human-rights.violation-cites-obligation", label="Violation cites legal basis", severity="warn", description="Claims should cite a legal obligation."),
        OntologyValidator(id="human-rights.pattern-evidenced", label="Pattern narrative evidenced", severity="info", description="Patterns should be supported by multiple incidents."),
    ],
    recommended_tool_ids=["human-rights.violation-tracker", "human-rights.upr-cycle-mapper", "human-rights.treaty-body-engagement", "human-rights.pattern-detector", "cross.contradiction-finder", "cross.brief-exporter", "cross.scenario-projector"],
)
