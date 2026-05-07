"""Economic / Sanctions ontology mirror."""
from .base import CaseOntologyDefinition, OntologyEdgeType, OntologyNodeType, OntologyValidator

ONTOLOGY = CaseOntologyDefinition(
    id="economic",
    version="1.0.0",
    label="Economic / Sanctions Ontology",
    description="Designated entities, sanctions instruments, ownership networks, payment channels, leverage, and compliance commitments.",
    domains=["economic", "economic-sanctions", "sanctions", "financial-intelligence", "export-control", "trade"],
    node_types=[
        OntologyNodeType(id="designated_entity", label="Designated Entity", primitive="Actor", description="Individual, organization, vessel, or network subject to designation."),
        OntologyNodeType(id="beneficial_owner", label="Beneficial Owner", primitive="Actor", description="Person or entity exercising ownership or control."),
        OntologyNodeType(id="designation_claim", label="Designation Claim", primitive="Claim", description="Claim that conduct satisfies a criterion."),
        OntologyNodeType(id="economic_interest", label="Economic Interest", primitive="Interest", description="Revenue, market access, assets, or financial objective."),
        OntologyNodeType(id="sanction_instrument", label="Sanction Instrument", primitive="Constraint", description="Legal regime, license condition, asset freeze, or embargo."),
        OntologyNodeType(id="economic_leverage", label="Economic Leverage", primitive="Leverage", description="Instrument that changes economic incentives."),
        OntologyNodeType(id="compliance_commitment", label="Compliance Commitment", primitive="Commitment", description="Due-diligence, reporting, remediation, or licensing undertaking."),
        OntologyNodeType(id="transaction_event", label="Transaction Event", primitive="Event", description="Payment, shipment, corporate transfer, or designation update."),
        OntologyNodeType(id="evasion_narrative", label="Evasion Narrative", primitive="Narrative", description="Pattern explaining ownership opacity or sanctions evasion."),
    ],
    edge_types=[
        OntologyEdgeType(id="owns_or_controls", label="owns or controls", from_=["Actor"], to=["Actor"], description="Actor owns or controls another actor."),
        OntologyEdgeType(id="triggers_instrument", label="triggers instrument", from_=["Claim", "Event"], to=["Constraint"], description="Claim or event activates a control."),
        OntologyEdgeType(id="routes_payment", label="routes payment", from_=["Event"], to=["Actor"], description="Transaction routes value through an actor."),
        OntologyEdgeType(id="pressures_entity", label="pressures entity", from_=["Leverage"], to=["Actor"], description="Leverage changes incentives."),
        OntologyEdgeType(id="requires_compliance", label="requires compliance", from_=["Constraint"], to=["Commitment"], description="Instrument requires compliance."),
        OntologyEdgeType(id="supports_evasion_pattern", label="supports evasion pattern", from_=["Event", "Claim"], to=["Narrative"], description="Evidence supports evasion narrative."),
    ],
    validators=[
        OntologyValidator(id="economic.designated-entity-identified", label="Designated entity identified", severity="warn", description="Entity or network should be identified."),
        OntologyValidator(id="economic.instrument-cited", label="Instrument cited", severity="warn", description="Claims should cite the relevant legal instrument."),
        OntologyValidator(id="economic.ownership-evidence", label="Ownership evidence present", severity="info", description="Ownership edges should cite evidence."),
        OntologyValidator(id="economic.transaction-dated", label="Transaction dated", severity="info", description="Transaction events should carry dates."),
    ],
    recommended_tool_ids=["economic.designation-risk-scorer", "economic.ownership-unwrapper", "economic.sanctions-impact-brief", "economic.export-control-check", "cross.contradiction-finder", "cross.brief-exporter"],
)
