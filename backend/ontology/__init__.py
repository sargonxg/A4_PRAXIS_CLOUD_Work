"""Ontology mirrors used by backend validation and audits."""

from .economic import ONTOLOGY as ECONOMIC_ONTOLOGY
from .human_rights import ONTOLOGY as HUMAN_RIGHTS_ONTOLOGY
from .humanitarian import ONTOLOGY as HUMANITARIAN_ONTOLOGY
from .legal import ONTOLOGY as LEGAL_ONTOLOGY
from .security import ONTOLOGY as SECURITY_ONTOLOGY

CASE_ONTOLOGIES = [
    HUMAN_RIGHTS_ONTOLOGY,
    ECONOMIC_ONTOLOGY,
    HUMANITARIAN_ONTOLOGY,
    LEGAL_ONTOLOGY,
    SECURITY_ONTOLOGY,
]
