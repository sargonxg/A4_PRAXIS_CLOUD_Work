import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const chatSource = readFileSync(join(process.cwd(), 'src/components/app/praxis-chat.tsx'), 'utf8');

describe('PraxisChat onboarding recovery contract', () => {
  it('offers onboarding or skip-and-retry when Ask PRAXIS receives the onboarding gate', () => {
    expect(chatSource).toContain('onboarding_required');
    expect(chatSource).toContain('Complete onboarding');
    expect(chatSource).toContain('Continue without onboarding');
    expect(chatSource).toContain('/api/onboarding/skip');
    expect(chatSource).toContain('await sendWithText(prompt)');
  });
});
