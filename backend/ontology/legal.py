"""Legal / Treaty ontology mirror."""
from .base import CaseOntologyDefinition, OntologyEdgeType, OntologyNodeType, OntologyValidator

ONTOLOGY = CaseOntologyDefinition(
    id="legal",
    version="1.0.0",
    label="Legal / Treaty Ontology",
    description="Legal provisions, parties, jurisdictional claims, precedents, compliance levers, and treaty commitments.",
    domains=["legal", "treaty", "icc", "icj", "ihl", "international-law", "treaty-body-law"],
    node_types=[
        OntologyNodeType(id="party", label="Party", primitive="Actor", description="State, institution, counsel, chamber, or treaty party."),
        OntologyNodeType(id="jurisdictional_claim", label="Jurisdictional Claim", primitive="Claim", description="Claim about jurisdiction, obligation, breach, interpretation, or remedy."),
        OntologyNodeType(id="protected_legal_interest", label="Protected Legal Interest", primitive="Interest", description="Interest protected by legal rule or procedure."),
        OntologyNodeType(id="legal_provision", label="Legal Provision", primitive="Constraint", description="Treaty article, resolution, statute, reservation, or rule."),
        OntologyNodeType(id="procedural_lever", label="Procedural Lever", primitive="Leverage", description="Objection, measure, referral, reporting cycle, or procedure."),
        OntologyNodeType(id="treaty_commitment", label="Treaty Commitment", primitive="Commitment", description="Ratification, undertaking, compliance measure, or remedial pledge."),
        OntologyNodeType(id="procedural_event", label="Procedural Event", primitive="Event", description="Filing, hearing, judgment, committee review, or treaty action."),
        OntologyNodeType(id="interpretive_frame", label="Interpretive Frame", primitive="Narrative", description="Legal theory or interpretive approach."),
        OntologyNodeType(id="precedent", label="Precedent", primitive="Claim", description="Prior decision or legal authority."),
    ],
    edge_types=[
        OntologyEdgeType(id="invokes_provision", label="invokes provision", from_=["Actor", "Claim"], to=["Constraint"], description="Party or claim invokes a legal provision."),
        OntologyEdgeType(id="supports_interpretation", label="supports interpretation", from_=["Claim"], to=["Narrative"], description="Authority supports interpretive frame."),
        OntologyEdgeType(id="constrains_party", label="constrains party", from_=["Constraint"], to=["Actor"], description="Provision constrains a party."),
        OntologyEdgeType(id="enables_procedure", label="enables procedure", from_=["Constraint"], to=["Leverage"], description="Rule enables a procedural lever."),
        OntologyEdgeType(id="records_commitment", label="records commitment", from_=["Event"], to=["Commitment"], description="Event records or modifies commitment."),
        OntologyEdgeType(id="protects_interest", label="protects interest", from_=["Constraint"], to=["Interest"], description="Provision protects legal interest."),
    ],
    validators=[
        OntologyValidator(id="legal.provision-cited", label="Provision cited", severity="warn", description="Legal claims should cite authority."),
        OntologyValidator(id="legal.party-identified", label="Party identified", severity="warn", description="Party or institution should be identified."),
        OntologyValidator(id="legal.procedure-dated", label="Procedure dated", severity="info", description="Procedural events should include dates."),
        OntologyValidator(id="legal.remedy-visible", label="Remedy visible", severity="info", description="Available remedies should be visible."),
    ],
    recommended_tool_ids=["legal.provision-tracer", "legal.precedent-finder", "legal.reservation-effect-mapper", "legal.jurisdictional-analyzer", "cross.contradiction-finder", "cross.brief-exporter"],
)
