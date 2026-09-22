import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Capsule Builder UX contract', () => {
  const root = process.cwd();

  it('keeps the builder under the signed-in capsules surface with the grounding-aware nontechnical wizard', () => {
    const page = readFileSync(path.join(root, 'src/app/app/capsules/builder/page.tsx'), 'utf8');
    const wizard = readFileSync(path.join(root, 'src/components/capsules/CapsuleBuilderWizard.tsx'), 'utf8');

    expect(page).toContain('CapsuleBuilderWizard');
    for (const label of ['Job', 'Sources', 'Grounding', 'Output', 'Tools', 'Test & evaluate', 'Publish']) {
      expect(wizard).toContain(label);
    }
    for (const expected of [
      'Timeline anchors',
      'Causal link',
      'Domain taxonomy',
      'ACO primitives',
      'ONTOLOGY_IDS',
      'DOMAIN_SEEDS',
      'TACITUS_CORE_PRIMITIVES',
      'embeddedGraph',
    ]) {
      expect(wizard).toContain(expected);
    }
    expect(wizard).toContain('/api/capsules');
    expect(wizard).toContain('/publish');
    expect(wizard).toContain('Check draft structure');
    expect(wizard).not.toContain('builder-source');
    expect(wizard).not.toContain('Publish gate is ready');
  });

  it('adds Capsule Architect as a progressive, document-first action without replacing the single-prompt first step', () => {
    const wizard = readFileSync(path.join(root, 'src/components/capsules/CapsuleBuilderWizard.tsx'), 'utf8');

    expect(wizard).toContain('What should this capsule do?');
    expect(wizard).toContain('Capsule Architect');
    expect(wizard).toContain('Document-first intake');
    expect(wizard).toContain('/api/capsules/assist/architect');
    expect(wizard).toContain('ingestArchitectDocuments');
    expect(wizard).not.toContain('webkitdirectory');
  });

  it('seeds a non-empty GraphLite advisory projection from the required grounding inputs', () => {
    const wizard = readFileSync(path.join(root, 'src/components/capsules/CapsuleBuilderWizard.tsx'), 'utf8');

    for (const expected of [
      'id: `capsule:${safeCapsuleId}`',
      'id: `domain:${safeDomainId}`',
      "id: 'causal-link:primary'",
      'bound_to_domain',
      'grounded_by_causal_link',
      'nodeCount: nodes.length',
      'edgeCount: edges.length',
    ]) {
      expect(wizard).toContain(expected);
    }
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
