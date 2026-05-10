from typing import Literal
from pydantic import BaseModel

SourceTier = Literal["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7"]


class SourceTierDefinition(BaseModel):
    tier: SourceTier
    label: str
    description: str
    confidence_cap: float
    citation_weight: float
    can_promote_to_verdict: bool


TIER_DEFINITIONS: dict[SourceTier, SourceTierDefinition] = {
    "T0": SourceTierDefinition(tier="T0", label="Direct upload", description="User-provided primary material awaiting review.", confidence_cap=0.90, citation_weight=0.90, can_promote_to_verdict=True),
    "T1": SourceTierDefinition(tier="T1", label="Primary authority", description="Official record, statute, filing, transcript, or signed primary-source material.", confidence_cap=0.95, citation_weight=1.00, can_promote_to_verdict=True),
    "T2": SourceTierDefinition(tier="T2", label="Structured dataset", description="Reputable structured dataset or validated institutional data feed.", confidence_cap=0.85, citation_weight=0.85, can_promote_to_verdict=True),
    "T3": SourceTierDefinition(tier="T3", label="Expert analysis", description="Credible expert, academic, or research-organization analysis.", confidence_cap=0.75, citation_weight=0.70, can_promote_to_verdict=True),
    "T4": SourceTierDefinition(tier="T4", label="Reported source", description="Journalistic or NGO reporting with identifiable provenance.", confidence_cap=0.65, citation_weight=0.55, can_promote_to_verdict=False),
    "T5": SourceTierDefinition(tier="T5", label="Open web", description="Open-web material that needs corroboration before strong claims.", confidence_cap=0.55, citation_weight=0.40, can_promote_to_verdict=False),
    "T6": SourceTierDefinition(tier="T6", label="Unreviewed extraction", description="Machine extraction or weakly attributed source not yet reviewed.", confidence_cap=0.40, citation_weight=0.20, can_promote_to_verdict=False),
    "T7": SourceTierDefinition(tier="T7", label="AI assessment", description="AI-generated assessment or synthesis; never sufficient for verdict-layer writes.", confidence_cap=0.25, citation_weight=0.10, can_promote_to_verdict=False),
}


def confidence_cap_for_tier(tier: SourceTier) -> float:
    return TIER_DEFINITIONS[tier].confidence_cap
