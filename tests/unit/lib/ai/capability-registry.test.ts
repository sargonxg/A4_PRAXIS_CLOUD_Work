import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CAPABILITIES,
  LEGACY_AI_ROUTE_CAPABILITY_MAP,
  ROUTE_FAMILIES,
  getCapabilityForLegacyAiRoute,
} from '@/lib/ai/capability-registry';

describe('capability registry', () => {
  it('keeps PRAXIS under the hidden-tool and route-family caps', () => {
    expect(Object.keys(ROUTE_FAMILIES)).toHaveLength(15);
    expect(Object.keys(CAPABILITIES).length).toBeLessThanOrEqual(25);
    expect(new Set(Object.values(CAPABILITIES).map((item) => item.superToolId)).size).toBeLessThanOrEqual(15);
  });

  it('maps legacy AI routes into capability families', () => {
    expect(getCapabilityForLegacyAiRoute('chat')?.routeFamily).toBe('ask');
    expect(getCapabilityForLegacyAiRoute('grounded-search')?.routeFamily).toBe('search');
    expect(getCapabilityForLegacyAiRoute('auto-structure')?.routeFamily).toBe('document');
    expect(getCapabilityForLegacyAiRoute('red-team-review')?.routeFamily).toBe('critique');
    expect(LEGACY_AI_ROUTE_CAPABILITY_MAP['extract']).toBe('ontology-extraction');
  });

  it('has first-wave canonical route wrappers', () => {
    for (const family of ['ask', 'search', 'extract', 'document', 'critique']) {
      expect(existsSync(join(process.cwd(), 'src', 'app', 'api', 'ai', family, 'route.ts'))).toBe(true);
    }
  });
});
