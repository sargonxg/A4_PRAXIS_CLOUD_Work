"""Ontology taxonomy and runtime composition for PRAXIS.

The monolith only composes ontology metadata and data-point classes. Live RDF
resolution remains owned by the isolated Cognee service through
``services.cognee_memory``.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from importlib import import_module
from pathlib import Path
from typing import Any


ONTOLOGY_VERSION = "2026.05.07"
BASE_ONTOLOGY_FILE = "praxis_aco_base.owl"
BASE_ONTOLOGY_PATH = Path("backend/data/ontologies") / BASE_ONTOLOGY_FILE
SPECIALIZATION_ROOT = Path("backend/data/ontologies/specializations")


@dataclass(frozen=True)
class CaseTypeSpec:
    slug: str
    label: str
    module_name: str
    classes: tuple[str, ...]
    anchors: tuple[str, ...]

    @property
    def ontology_path(self) -> Path:
        return SPECIALIZATION_ROOT / f"{self.slug}.owl"

    @property
    def changelog_path(self) -> Path:
        return SPECIALIZATION_ROOT / f"{self.slug}.CHANGELOG.md"


CASE_TYPES: tuple[CaseTypeSpec, ...] = (
    CaseTypeSpec(
        slug="active-conflict",
        label="Active Conflict",
        module_name="active_conflict",
        classes=("State", "NonStateArmedGroup", "Frontline", "TerritorialClaim", "CeasefireCommitment"),
        anchors=("EscalationEvent", "HumanitarianAccessConstraint"),
    ),
    CaseTypeSpec(
        slug="frozen-conflict",
        label="Frozen Conflict",
        module_name="frozen_conflict",
        classes=("DeFactoAuthority", "AdministrativeBoundary", "FrozenLineOfContact", "RecognitionClaim"),
        anchors=("StatusNegotiation", "MonitoringMechanism"),
    ),
    CaseTypeSpec(
        slug="negotiation-mediation",
        label="Negotiation & Mediation",
        module_name="negotiation_mediation",
        classes=("Party", "Mediator", "Position", "Interest", "BATNA", "ZOPA", "AgendaItem"),
        anchors=("ConfidenceBuildingMeasure", "MediationSession"),
    ),
    CaseTypeSpec(
        slug="counter-terrorism",
        label="Counter-Terrorism",
        module_name="counter_terrorism",
        classes=("Cell", "NetworkNode", "ThreatClaim", "FinancingChannel", "OperationalCapability"),
        anchors=("DesignationEvent", "DisruptionOperation"),
    ),
    CaseTypeSpec(
        slug="humanitarian-crisis",
        label="Humanitarian Crisis",
        module_name="humanitarian_crisis",
        classes=("AffectedPopulation", "AccessCorridor", "ProtectionRisk", "NeedsAssessment", "DeliveryConstraint"),
        anchors=("DisplacementEvent", "AidDeliveryCommitment"),
    ),
    CaseTypeSpec(
        slug="political-transition",
        label="Political Transition",
        module_name="political_transition",
        classes=("TransitionalAuthority", "ElectoralActor", "LegitimacyClaim", "ConstitutionalMilestone"),
        anchors=("PowerSharingCommitment", "InstitutionalReformEvent"),
    ),
    CaseTypeSpec(
        slug="sanctions-economic-statecraft",
        label="Sanctions & Economic Statecraft",
        module_name="sanctions_economic_statecraft",
        classes=("SanctionedActor", "SanctionsMeasure", "EvasionRoute", "EconomicPressureClaim"),
        anchors=("DesignationEvent", "ComplianceCommitment"),
    ),
    CaseTypeSpec(
        slug="strategic-competition",
        label="Strategic Competition",
        module_name="strategic_competition",
        classes=("StrategicActor", "InfluenceAsset", "RedLine", "DeterrenceClaim", "AllianceCommitment"),
        anchors=("SignalingEvent", "EscalationLadder"),
    ),
    CaseTypeSpec(
        slug="cyber-hybrid",
        label="Cyber & Hybrid",
        module_name="cyber_hybrid",
        classes=("ThreatActor", "MalwareCampaign", "InfrastructureNode", "AttributionClaim", "HybridOperation"),
        anchors=("IntrusionEvent", "ResilienceCommitment"),
    ),
    CaseTypeSpec(
        slug="forced-displacement",
        label="Forced Displacement",
        module_name="forced_displacement",
        classes=("DisplacedGroup", "HostCommunity", "ReturnConstraint", "ProtectionClaim", "Route"),
        anchors=("CrossingEvent", "DurableSolutionCommitment"),
    ),
)

CASE_TYPE_BY_SLUG = {spec.slug: spec for spec in CASE_TYPES}


def normalize_case_type(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().lower().replace("_", "-")
    if normalized in CASE_TYPE_BY_SLUG:
        return normalized
    raise ValueError(f"Unknown PRAXIS case_type={value!r}")


def available_case_types() -> tuple[str, ...]:
    return tuple(spec.slug for spec in CASE_TYPES)


def ontology_stack_for_case_types(
    case_type: str | None = None,
    case_type_secondary: str | None = None,
) -> tuple[str, ...]:
    """Return the ordered base + specialization OWL stack for a case."""
    stack = [BASE_ONTOLOGY_PATH.as_posix()]
    for raw in (case_type, case_type_secondary):
        slug = normalize_case_type(raw)
        if slug and CASE_TYPE_BY_SLUG[slug].ontology_path.as_posix() not in stack:
            stack.append(CASE_TYPE_BY_SLUG[slug].ontology_path.as_posix())
    return tuple(stack)


@lru_cache(maxsize=50)
def ontology_resolver_descriptor(
    case_type: str | None = None,
    case_type_secondary: str | None = None,
) -> dict[str, Any]:
    stack = ontology_stack_for_case_types(case_type, case_type_secondary)
    return {
        "kind": "rdflib_ontology_resolver",
        "cacheKey": "|".join(stack),
        "ontologyFilePaths": list(stack),
        "version": ONTOLOGY_VERSION,
    }


def data_point_modules_for_case_types(
    case_type: str | None = None,
    case_type_secondary: str | None = None,
) -> tuple[str, ...]:
    modules = ["services.cognee_aco_models.base"]
    for raw in (case_type, case_type_secondary):
        slug = normalize_case_type(raw)
        if not slug:
            continue
        module = f"services.cognee_aco_models.specializations.{CASE_TYPE_BY_SLUG[slug].module_name}"
        if module not in modules:
            modules.append(module)
    return tuple(modules)


@lru_cache(maxsize=50)
def data_point_classes_for_case_types(
    case_type: str | None = None,
    case_type_secondary: str | None = None,
) -> tuple[type[Any], ...]:
    classes: list[type[Any]] = []
    for module_name in data_point_modules_for_case_types(case_type, case_type_secondary):
        module = import_module(module_name)
        for name in getattr(module, "__all__", ()):
            candidate = getattr(module, name)
            if isinstance(candidate, type) and hasattr(candidate, "metadata"):
                classes.append(candidate)
    return tuple(classes)


def data_point_class_names(
    case_type: str | None = None,
    case_type_secondary: str | None = None,
) -> tuple[str, ...]:
    return tuple(cls.__name__ for cls in data_point_classes_for_case_types(case_type, case_type_secondary))


def ontology_cache_snapshot() -> dict[str, Any]:
    """Expose resolver/data-point cache state for admin diagnostics."""
    return {
        "resolver": ontology_resolver_descriptor.cache_info()._asdict(),
        "dataPoints": data_point_classes_for_case_types.cache_info()._asdict(),
        "caseTypes": [
            {
                "slug": spec.slug,
                "label": spec.label,
                "module": spec.module_name,
                "ontologyPath": spec.ontology_path.as_posix(),
                "classes": list(spec.classes),
                "anchors": list(spec.anchors),
            }
            for spec in CASE_TYPES
        ],
    }
