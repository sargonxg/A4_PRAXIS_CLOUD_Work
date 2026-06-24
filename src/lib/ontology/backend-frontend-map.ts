import {
  CASE_TYPE_DEFINITIONS,
  type CaseTypeId,
} from '@/lib/ontology/case-types';
import type { OntologyId } from '@/lib/ontology/types';

export interface BackendFrontendOntologyMapping {
  primaryOntologyId: OntologyId;
  compatibleOntologyIds: OntologyId[];
}

export const BACKEND_CASE_SPECIALIZATION_IDS = CASE_TYPE_DEFINITIONS.map((definition) => definition.id);

export const BACKEND_CASE_SPECIALIZATION_TO_FRONTEND_ONTOLOGIES: Record<CaseTypeId, BackendFrontendOntologyMapping> =
  Object.fromEntries(
    CASE_TYPE_DEFINITIONS.map((definition) => [
      definition.id,
      {
        primaryOntologyId: definition.primaryOntologyId,
        compatibleOntologyIds: definition.compatibleOntologyIds,
      },
    ]),
  ) as Record<CaseTypeId, BackendFrontendOntologyMapping>;

export function getFrontendOntologiesForBackendSpecialization(
  caseTypeId: CaseTypeId,
): BackendFrontendOntologyMapping {
  return BACKEND_CASE_SPECIALIZATION_TO_FRONTEND_ONTOLOGIES[caseTypeId];
}
