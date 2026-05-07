"""Security / Defense ontology mirror."""
from .base import CaseOntologyDefinition, OntologyEdgeType, OntologyNodeType, OntologyValidator

ONTOLOGY = CaseOntologyDefinition(
    id="security",
    version="1.0.0",
    label="Security / Defense Ontology",
    description="Capabilities, force posture, threat vectors, doctrines, engagement rules, deterrence levers, and operational events.",
    domains=["security", "defense", "defence", "military", "nato", "force-posture", "civil-military"],
    node_types=[
        OntologyNodeType(id="military_actor", label="Military Actor", primitive="Actor", description="State force, alliance, command, unit, militia, or institution."),
        OntologyNodeType(id="threat_assessment", label="Threat Assessment", primitive="Claim", description="Claim about intent, capability, vulnerability, or risk."),
        OntologyNodeType(id="security_interest", label="Security Interest", primitive="Interest", description="Defense, deterrence, access, resilience, or assurance objective."),
        OntologyNodeType(id="engagement_rule", label="Engagement Rule", primitive="Constraint", description="ROE, mandate limit, treaty obligation, or caveat."),
        OntologyNodeType(id="deterrence_lever", label="Deterrence Lever", primitive="Leverage", description="Posture, signaling, capability deployment, or assurance measure."),
        OntologyNodeType(id="posture_commitment", label="Posture Commitment", primitive="Commitment", description="Deployment pledge, readiness commitment, or guarantee."),
        OntologyNodeType(id="operational_event", label="Operational Event", primitive="Event", description="Deployment, exercise, incursion, strike, or posture change."),
        OntologyNodeType(id="doctrine_narrative", label="Doctrine Narrative", primitive="Narrative", description="Strategic doctrine, threat frame, or deterrence story."),
        OntologyNodeType(id="capability", label="Capability", primitive="Leverage", description="Military, cyber, intelligence, logistics, or resilience capability."),
    ],
    edge_types=[
        OntologyEdgeType(id="deploys_capability", label="deploys capability", from_=["Actor"], to=["Leverage"], description="Actor deploys or controls capability."),
        OntologyEdgeType(id="threatens_interest", label="threatens interest", from_=["Claim", "Event"], to=["Interest"], description="Assessment or event threatens interest."),
        OntologyEdgeType(id="constrained_by_rule", label="constrained by rule", from_=["Actor", "Commitment"], to=["Constraint"], description="Actor or commitment is constrained by rule."),
        OntologyEdgeType(id="signals_posture", label="signals posture", from_=["Event"], to=["Commitment", "Narrative"], description="Event signals posture or doctrine."),
        OntologyEdgeType(id="deters_actor", label="deters actor", from_=["Leverage"], to=["Actor"], description="Leverage deters actor."),
        OntologyEdgeType(id="supports_doctrine", label="supports doctrine", from_=["Claim", "Event"], to=["Narrative"], description="Evidence supports doctrine narrative."),
    ],
    validators=[
        OntologyValidator(id="security.actor-identified", label="Security actor identified", severity="warn", description="Relevant actors or commands should be identified."),
        OntologyValidator(id="security.constraint-visible", label="Constraint visible", severity="warn", description="ROE, mandate, caveats, and treaty limits should be visible."),
        OntologyValidator(id="security.event-dated", label="Operational event dated", severity="info", description="Operational events should carry dates."),
        OntologyValidator(id="security.capability-sourced", label="Capability sourced", severity="info", description="Capability claims should cite evidence."),
    ],
    recommended_tool_ids=["security.posture-tracker", "security.capability-assessor", "security.escalation-modeler", "security.alliance-cohesion-map", "cross.scenario-projector", "cross.brief-exporter"],
)
