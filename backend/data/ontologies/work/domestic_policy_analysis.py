from pydantic import BaseModel, Field, field_validator

PRIMITIVES = {
    "Actor": ["AnalystSelf", "Supervisor", "Principal", "CommitteeMember", "AdvocacyOrgPartner", "JournalistContact", "SubjectMatterExpert", "ConstituentAudience"],
    "Claim": ["PolicyPosition", "RegulatoryInterpretation", "EvidenceClaim", "PoliticalViability"],
    "Interest": ["PolicyOutcome", "ElectoralInterest", "BudgetaryInterest", "CoalitionInterest"],
    "Constraint": ["LegislativeCalendar", "BudgetCycle", "ProcessConstraint", "PartisanFraming", "LegalStandard", "EthicalRule"],
    "Leverage": ["CommitteeAssignment", "MediaAccess", "CoalitionStrength", "ConstituentBase", "EvidenceQuality"],
    "Commitment": ["HearingTestimony", "PolicyMemoCommit", "BudgetRequest", "RegulatoryCommentLetter"],
    "Event": ["HearingCycle", "BudgetCycle", "RegulatoryRulemaking", "ElectionCycle", "CommitteeMarkup", "LegislativeSession"],
    "Narrative": ["PolicyFraming", "BipartisanFraming", "ConstituentFraming", "AdministrativeFraming"],
}


class DomesticPolicyAnalysisOntology(BaseModel):
    id: str = "domestic-policy-analysis"
    primitives: dict[str, list[str]] = Field(default_factory=lambda: PRIMITIVES)

    @field_validator("primitives")
    @classmethod
    def validate_minimum_subtypes(cls, value: dict[str, list[str]]) -> dict[str, list[str]]:
        missing = [primitive for primitive, subtypes in value.items() if len(subtypes) < 4]
        if missing:
            raise ValueError(f"work ontology primitives need at least four subtypes: {missing}")
        return value
