import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('/api/capsules/assist routes', () => {
  it('keeps calibrated AI-assist actions for persona, output schema, sources, and few-shot authoring', () => {
    const route = readFileSync(path.join(root(), 'src/app/api/capsules/assist/[action]/route.ts'), 'utf8');

    expect(route).toContain("withCalibration('capsule-builder-assist'");
    expect(route).toContain('saveToolOutput');
    for (const action of ['persona', 'output-schema', 'sources', 'few-shot']) {
      expect(route).toContain(action);
    }
    expect(route).toContain('blockOnThinContext: false');
  });
});

function root() {
  return process.cwd();
}
