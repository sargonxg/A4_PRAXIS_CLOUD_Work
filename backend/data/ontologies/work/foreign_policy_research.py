from pydantic import BaseModel, Field, field_validator

PRIMITIVES = {
    "Actor": ["ResearcherSelf", "ResearchInstitution", "EditorialBoard", "FundingSource", "MediaContact", "AcademicPeer", "PolicymakerAudience", "ExternalSource"],
    "Claim": ["ResearchHypothesis", "EditorialPosition", "MethodologicalChoice", "EvidenceClaim"],
    "Interest": ["PublicationGoal", "IntellectualPositioning", "FundingAlignment", "PolicyInfluence"],
    "Constraint": ["PublicationDeadline", "EthicalReview", "EditorialStandards", "FundingScope", "AcademicStandards"],
    "Leverage": ["PublicationVenue", "CitationCapital", "NetworkAccess", "MethodologicalCredibility"],
    "Commitment": ["PublicationDeliverable", "ConferencePresentation", "EditorialOutput", "PeerReviewResponse"],
    "Event": ["ResearchCycle", "PeerReviewMilestone", "PublicationLaunch", "ConferenceParticipation"],
    "Narrative": ["AnalyticalFraming", "PolicyRecommendationFraming", "MethodologyNarrative", "LiteraturePositioning"],
}


class ForeignPolicyResearchOntology(BaseModel):
    id: str = "foreign-policy-research"
    primitives: dict[str, list[str]] = Field(default_factory=lambda: PRIMITIVES)

    @field_validator("primitives")
    @classmethod
    def validate_minimum_subtypes(cls, value: dict[str, list[str]]) -> dict[str, list[str]]:
        missing = [primitive for primitive, subtypes in value.items() if len(subtypes) < 4]
        if missing:
            raise ValueError(f"work ontology primitives need at least four subtypes: {missing}")
        return value
