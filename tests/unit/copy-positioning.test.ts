import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_COPY_FILES = [
  'src/components/landing/phase8-wow-landing.tsx',
  'src/components/assistant/suggested-prompts.tsx',
  'src/components/app/floating-praxis.tsx',
  'src/components/app/header.tsx',
  'src/components/praxis/tool-info-from-registry.tsx',
  'src/lib/constants/tool-registry.ts',
  'src/lib/constants/templates.ts',
];

const PROHIBITED_POSITIONING = [
  'Built on the practice of UN Political Affairs',
  'UN Political Affairs',
  'UN DPPA',
  'UN Toolkit',
  'UN-template',
  'UN-formatted',
  'UN Editorial Manual',
  'Security Council',
];

describe('PRAXIS product positioning copy', () => {
  it('uses practitioner multilateral diplomacy framing instead of institutional UN branding', () => {
    const combined = PRODUCT_COPY_FILES
      .map((file) => readFileSync(join(process.cwd(), file), 'utf8'))
      .join('\n');

    for (const phrase of PROHIBITED_POSITIONING) {
      expect(combined).not.toContain(phrase);
    }

    expect(combined).toContain('practitioner experience in multilateral diplomacy');
  });
});
