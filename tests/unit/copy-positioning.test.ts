import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_COPY_FILES = [
  'src/app/layout.tsx',
  'src/app/opengraph-image.tsx',
  'src/app/(landing)/page.tsx',
  'src/app/(landing)/learn/page.tsx',
  'src/components/landing/phase8-wow-landing.tsx',
  'src/components/assistant/suggested-prompts.tsx',
  'src/components/app/floating-praxis.tsx',
  'src/components/app/header.tsx',
  'src/components/praxis/tasklet-praxis-workbench.tsx',
  'src/lib/constants/tool-registry.ts',
  'src/lib/memo/templates/registry.ts',
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

    expect(combined).toContain('multilateral diplomacy');
  });

  it('positions ContextCapsules as reusable expert-thinking blocks', () => {
    const combined = PRODUCT_COPY_FILES
      .map((file) => readFileSync(join(process.cwd(), file), 'utf8'))
      .join('\n');

    expect(combined).not.toMatch(/turns? .*ContextCapsules, documents, and .*tools into grounded analysis/i);
    expect(combined).not.toContain('Turn documents, sources, and policy tools into grounded analysis');
    expect(combined).toContain('Compose your reasoning and policy products from expert ContextCapsules.');
    expect(combined).toContain(
      'PRAXIS lets you compose reasoning and policy products from expert ContextCapsules: reusable blocks that capture how analysts think, frame issues, and structure decisions.',
    );
  });
});
