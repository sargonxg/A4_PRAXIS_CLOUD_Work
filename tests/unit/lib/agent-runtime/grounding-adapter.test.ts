import { describe, expect, it } from 'vitest';
import { resolveGroundingPlan } from '@/lib/agent-runtime/grounding-adapter';

describe('agent runtime grounding adapter', () => {
  it('selects Google Search grounding and internal capsule corpus for deep current asks', () => {
    const plan = resolveGroundingPlan({
      selectedToolIds: ['context-resolve', 'grounded-search', 'deep-search-agent'],
      documentCount: 0,
      sourceReceiptCount: 2,
      env: {
        VERTEX_GROUNDING_GOOGLE_SEARCH_ENABLED: 'true',
      },
    });

    expect(plan.modes).toEqual(['internal_capsule_corpus', 'google_search']);
    expect(plan.requiresSearchSuggestionsDisplay).toBe(true);
    expect(plan.receiptPosture).toBe('praxis_canonical_google_metadata_attached');
  });

  it('keeps enterprise datastore modes deferred until explicitly configured', () => {
    const plan = resolveGroundingPlan({
      selectedToolIds: ['context-resolve', 'document-retrieve'],
      documentCount: 3,
      sourceReceiptCount: 0,
      env: {},
    });

    expect(plan.modes).toEqual(['internal_capsule_corpus', 'uploaded_documents']);
    expect(plan.deferredModes).toEqual([
      'vertex_ai_search',
      'gemini_enterprise_datastore',
    ]);
  });
});
