import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_COPY_FILES = [
  'src/app/layout.tsx',
  'src/app/opengraph-image.tsx',
  'src/app/page.tsx',
  'src/app/(landing)/learn/page.tsx',
  'src/components/landing/phase8-wow-landing.tsx',
  'src/components/marketing/praxis-marketing-home.tsx',
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

  it('leads public copy with the user job before capsule mechanics', () => {
    const combined = PRODUCT_COPY_FILES
      .map((file) => readFileSync(join(process.cwd(), file), 'utf8'))
      .join('\n');

    expect(combined).not.toMatch(/turns? .*ContextCapsules, documents, and .*tools into grounded analysis/i);
    expect(combined).not.toContain('Turn documents, sources, and policy tools into grounded analysis');
    expect(combined).toContain('Compose your reasoning and policy products from expert ContextCapsules.');
    expect(combined).toContain('Ask the question, attach sources when it matters, and leave with work your team can review.');
    expect(combined).toContain('Turn a hard policy question into sourced work your team can review.');
  });
});
