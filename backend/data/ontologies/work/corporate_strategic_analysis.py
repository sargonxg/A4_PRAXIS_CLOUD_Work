from pydantic import BaseModel, Field, field_validator

PRIMITIVES = {
    "Actor": ["AnalystSelf", "ExecutiveSupervisor", "BoardAudience", "InvestorAudience", "RegulatorActor", "NGOActor", "JournalistContact", "IndustryPeer", "EmployeeAudience", "CustomerAudience"],
    "Claim": ["StrategicPosition", "RegulatoryComplianceClaim", "MaterialityAssessment", "StakeholderClaim", "FinancialClaim"],
    "Interest": ["ShareholderValue", "RegulatoryAlignment", "ReputationalProtection", "StrategicPositioning", "ESGCredibility"],
    "Constraint": ["SECDisclosure", "RegulatoryRule", "BoardMandate", "FinancialPosture", "ESGStandard", "ReputationalRisk"],
    "Leverage": ["MarketPosition", "RegulatoryRelationship", "MediaRelationship", "InvestorBacking", "CertificationCredibility"],
    "Commitment": ["SustainabilityPledge", "RegulatoryCommitment", "BoardDirective", "DisclosureCommitment", "StakeholderEngagement"],
    "Event": ["BoardMeeting", "EarningsCall", "SustainabilityReportRelease", "RegulatoryFiling", "NGOCampaignEvent", "ESGRatingEvent"],
    "Narrative": ["CorporateFraming", "ESGFraming", "ReputationalFraming", "InvestorFraming"],
}


class CorporateStrategicAnalysisOntology(BaseModel):
    id: str = "corporate-strategic-analysis"
    primitives: dict[str, list[str]] = Field(default_factory=lambda: PRIMITIVES)

    @field_validator("primitives")
    @classmethod
    def validate_minimum_subtypes(cls, value: dict[str, list[str]]) -> dict[str, list[str]]:
        missing = [primitive for primitive, subtypes in value.items() if len(subtypes) < 4]
        if missing:
            raise ValueError(f"work ontology primitives need at least four subtypes: {missing}")
        return value
