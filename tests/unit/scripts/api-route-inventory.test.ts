import { describe, expect, it } from 'vitest';
import { buildApiRouteInventory, formatApiRouteInventoryMarkdown } from '../../../scripts/audit-api-route-inventory';

describe('API route inventory', () => {
  it('categorizes every API route with auth, calibration, caller evidence, and action', () => {
    const inventory = buildApiRouteInventory();
    expect(inventory.length).toBe(207);
    expect(inventory.every((route) => route.category)).toBe(true);
    expect(inventory.every((route) => route.authPosture)).toBe(true);
    expect(inventory.every((route) => route.calibrationStatus)).toBe(true);
    expect(inventory.every((route) => route.callerEvidence.length > 0)).toBe(true);
    expect(inventory.every((route) => route.recommendedAction)).toBe(true);
  });

  it('renders the inventory as an audit markdown table', () => {
    const markdown = formatApiRouteInventoryMarkdown(buildApiRouteInventory());
    expect(markdown).toContain('# API Route Inventory');
    expect(markdown).toContain('| Route | Category | Auth posture | Calibration | Caller evidence | Recommended action |');
    expect(markdown).toContain('/api/agents/runs');
  });
});
