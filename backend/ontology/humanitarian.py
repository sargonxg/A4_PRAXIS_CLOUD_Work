"""Humanitarian ontology mirror."""
from .base import CaseOntologyDefinition, OntologyEdgeType, OntologyNodeType, OntologyValidator

ONTOLOGY = CaseOntologyDefinition(
    id="humanitarian",
    version="1.0.0",
    label="Humanitarian Ontology",
    description="Affected populations, needs assessments, access constraints, responders, assistance commitments, and humanitarian narratives.",
    domains=["humanitarian", "ocha", "icrc", "protection-cluster", "needs-assessment", "access"],
    node_types=[
        OntologyNodeType(id="affected_population", label="Affected Population", primitive="Actor", description="Population group affected by crisis or displacement."),
        OntologyNodeType(id="responding_actor", label="Responding Actor", primitive="Actor", description="UN agency, NGO, authority, or community responder."),
        OntologyNodeType(id="needs_assessment", label="Needs Assessment", primitive="Claim", description="Claim about needs, severity, gaps, or estimates."),
        OntologyNodeType(id="humanitarian_interest", label="Humanitarian Interest", primitive="Interest", description="Protected humanitarian objective."),
        OntologyNodeType(id="access_constraint", label="Access Constraint", primitive="Constraint", description="Barrier to assistance."),
        OntologyNodeType(id="access_lever", label="Access Lever", primitive="Leverage", description="Negotiation, funding, deconfliction, or pressure."),
        OntologyNodeType(id="response_commitment", label="Response Commitment", primitive="Commitment", description="Pledge, convoy plan, service restoration, or agreement."),
        OntologyNodeType(id="shock_event", label="Shock Event", primitive="Event", description="Displacement, attack, outbreak, flood, or corridor closure."),
        OntologyNodeType(id="humanitarian_narrative", label="Humanitarian Narrative", primitive="Narrative", description="Frame shaping response priorities or donor attention."),
    ],
    edge_types=[
        OntologyEdgeType(id="affects_population", label="affects population", from_=["Event"], to=["Actor"], description="Shock affects a population."),
        OntologyEdgeType(id="documents_need", label="documents need", from_=["Claim"], to=["Interest"], description="Assessment documents an interest."),
        OntologyEdgeType(id="blocks_access", label="blocks access", from_=["Constraint"], to=["Interest"], description="Constraint blocks access."),
        OntologyEdgeType(id="improves_access", label="improves access", from_=["Leverage", "Commitment"], to=["Interest"], description="Leverage or commitment improves access."),
        OntologyEdgeType(id="responds_to", label="responds to", from_=["Actor"], to=["Event", "Claim"], description="Responder acts in response to a shock or need."),
        OntologyEdgeType(id="frames_response", label="frames response", from_=["Narrative"], to=["Commitment", "Leverage"], description="Narrative shapes response."),
    ],
    validators=[
        OntologyValidator(id="humanitarian.population-identified", label="Affected population identified", severity="warn", description="Affected populations should be identified."),
        OntologyValidator(id="humanitarian.needs-evidenced", label="Needs evidenced", severity="warn", description="Needs assessments should cite evidence."),
        OntologyValidator(id="humanitarian.access-constraint-visible", label="Access constraint visible", severity="info", description="Access constraints make recommendations operational."),
        OntologyValidator(id="humanitarian.response-monitorable", label="Response monitorable", severity="info", description="Response commitments should be monitorable."),
    ],
    recommended_tool_ids=["humanitarian.needs-aggregator", "humanitarian.access-map", "humanitarian.cluster-coordinator", "humanitarian.aa-trigger-monitor", "cross.brief-exporter", "cross.context-health-explainer"],
)
