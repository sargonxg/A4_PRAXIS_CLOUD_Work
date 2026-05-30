import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Capsule Builder UX contract', () => {
  const root = process.cwd();

  it('keeps the builder under the signed-in capsules surface with the 6-step nontechnical wizard', () => {
    const page = readFileSync(path.join(root, 'src/app/app/capsules/builder/page.tsx'), 'utf8');
    const wizard = readFileSync(path.join(root, 'src/components/capsules/CapsuleBuilderWizard.tsx'), 'utf8');

    expect(page).toContain('CapsuleBuilderWizard');
    for (const label of ['Job', 'Sources', 'Output', 'Tools', 'Test & evaluate', 'Publish']) {
      expect(wizard).toContain(label);
    }
    expect(wizard).toContain('/api/capsules');
    expect(wizard).toContain('/publish');
  });

  it('exposes advanced Monaco JSON mode with a live preview', () => {
    const editor = readFileSync(path.join(root, 'src/components/capsules/CapsuleJsonMonacoEditor.tsx'), 'utf8');
    const preview = readFileSync(path.join(root, 'src/components/capsules/CapsuleLivePreview.tsx'), 'utf8');

    expect(editor).toContain('@monaco-editor/react');
    expect(editor).toContain('language="json"');
    expect(preview).toContain('Live preview');
    expect(preview).toContain('ContextCapsuleSchema');
  });
});
