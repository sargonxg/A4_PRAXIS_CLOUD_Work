import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const proxySource = readFileSync(join(process.cwd(), 'src/proxy.ts'), 'utf8');

describe('proxy onboarding gate contract', () => {
  it('allows explicitly skipped onboarding sessions through authenticated app routes', () => {
    expect(proxySource).toContain('onboardingSkipped?: boolean');
    expect(proxySource).toContain('sessionData?.onboardingSkipped !== true');
  });
});
