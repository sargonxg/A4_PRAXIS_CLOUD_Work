import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/components/memo/memo-desk.tsx'), 'utf8');

describe('memo red-team export contract', () => {
  it('runs the calibrated red-team route and renders annotations without rewrite controls', () => {
    expect(source).toContain('/api/ai/red-team-review');
    expect(source).toContain('data-testid="memo-red-team-action"');
    expect(source).toContain('data-testid="memo-red-team-export-status"');
    expect(source).toContain('data-testid="memo-red-team-annotations"');
    expect(source).toContain('data-testid="memo-red-team-annotation"');
    expect(source).toContain('red-teamed ✓');
    expect(source).toContain('annotations only, no rewrite');
  });
});
