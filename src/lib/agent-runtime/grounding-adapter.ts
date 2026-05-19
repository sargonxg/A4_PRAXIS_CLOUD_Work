export type GroundingMode =
  | 'google_search'
  | 'vertex_ai_search'
  | 'gemini_enterprise_datastore'
  | 'internal_capsule_corpus'
  | 'uploaded_documents';

export interface GroundingPlanInput {
  selectedToolIds: string[];
  documentCount: number;
  sourceReceiptCount: number;
  env?: Record<string, string | undefined>;
}

export interface GroundingPlan {
  modes: GroundingMode[];
  deferredModes: GroundingMode[];
  requiresSearchSuggestionsDisplay: boolean;
  receiptPosture: 'praxis_canonical' | 'praxis_canonical_google_metadata_attached';
}

export function resolveGroundingPlan(input: GroundingPlanInput): GroundingPlan {
  const env = input.env ?? process.env;
  const selected = new Set(input.selectedToolIds);
  const modes = new Set<GroundingMode>(['internal_capsule_corpus']);
  const deferredModes = new Set<GroundingMode>();

  if (input.documentCount > 0 || selected.has('document-retrieve')) {
    modes.add('uploaded_documents');
  }
  if ((selected.has('grounded-search') || selected.has('deep-search-agent')) && env.VERTEX_GROUNDING_GOOGLE_SEARCH_ENABLED === 'true') {
    modes.add('google_search');
  }
  if (env.VERTEX_AI_SEARCH_DATASTORE_ID?.trim()) {
    modes.add('vertex_ai_search');
  } else {
    deferredModes.add('vertex_ai_search');
  }
  if (env.GEMINI_ENTERPRISE_DATASTORE_ID?.trim()) {
    modes.add('gemini_enterprise_datastore');
  } else {
    deferredModes.add('gemini_enterprise_datastore');
  }

  return {
    modes: Array.from(modes),
    deferredModes: Array.from(deferredModes),
    requiresSearchSuggestionsDisplay: modes.has('google_search'),
    receiptPosture: modes.has('google_search')
      ? 'praxis_canonical_google_metadata_attached'
      : 'praxis_canonical',
  };
}
