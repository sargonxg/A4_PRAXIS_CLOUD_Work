import { describe, expect, it } from 'vitest';
import {
  APP_SEARCH_COMMANDS,
  buildCapsuleSearchItem,
  getAskPraxisFallbackResult,
  rankAppSearchItems,
} from '@/lib/app-search/shared-contracts';
import { CAPSULE_STARTER_DEFINITIONS } from '@/lib/product/context-capsules';

describe('shared app search contracts', () => {
  it('ranks exact capsule and thinking-device matches above generic commands', () => {
    const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === 'starter-tool-assumption-stress-test')!;
    const results = rankAppSearchItems('Assumption Stress Test', [
      ...APP_SEARCH_COMMANDS,
      buildCapsuleSearchItem(starter),
    ]);

    expect(results[0]).toMatchObject({
      id: 'capsule:starter-tool-assumption-stress-test',
      kind: 'Thinking Device',
      label: 'Assumption Stress Test',
    });
    expect(results[0].matchedFields).toContain('title');
  });

  it('searches device method steps, review gates, sourceability, source packs, and output targets', () => {
    const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === 'starter-tool-assumption-stress-test')!;
    const sourceability = rankAppSearchItems('sourceability requirements', [buildCapsuleSearchItem(starter)]);
    const reviewGate = rankAppSearchItems('human review', [buildCapsuleSearchItem(starter)]);
    const outputTarget = rankAppSearchItems(starter.outputProductIds[0]!, [buildCapsuleSearchItem(starter)]);

    expect(sourceability[0].matchedFields).toContain('sourceability');
    expect(reviewGate[0].matchedFields).toContain('review gate');
    expect(outputTarget[0].matchedFields).toContain('output target');
  });

  it('keeps Ask PRAXIS as the first fallback action for free text', () => {
    expect(getAskPraxisFallbackResult('where are source gaps?')).toMatchObject({
      id: 'ask-query',
      label: 'Ask PRAXIS: where are source gaps?',
      kind: 'Action',
    });
  });

  it('keeps diagnostics, system settings, capsules, intellectual devices, and import/export discoverable', () => {
    expect(APP_SEARCH_COMMANDS.map((item) => item.id)).toEqual(expect.arrayContaining([
      'action:runtime-doctor',
      'diagnostic:research-runtime',
      'surface:capsules',
      'surface:intellectual-devices',
      'setting:system',
      'action:praxis-import-export',
    ]));
  });
});
