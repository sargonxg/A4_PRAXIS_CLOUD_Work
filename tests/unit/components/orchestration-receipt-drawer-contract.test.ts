import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/components/app/praxis-chat.tsx'), 'utf8');

describe('orchestration receipt drawer contract', () => {
  it('exposes stable receipt trigger and drawer sections from the existing answer activity strip', () => {
    expect(source).toContain('data-testid="orchestration-receipt-trigger"');
    expect(source).toContain('data-testid="orchestration-receipt-drawer"');
    for (const section of ['triage', 'capsule', 'tools', 'grounding', 'model', 'language', 'supervisor', 'full']) {
      expect(source).toContain(`orchestration-receipt-${section}`);
    }
    expect(source).toContain('PRAXIS augmented generation');
    expect(source).toContain('JSON.stringify(receipt, null, 2)');
  });
});
