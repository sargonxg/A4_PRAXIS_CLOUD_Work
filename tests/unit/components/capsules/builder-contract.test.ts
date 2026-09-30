import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Capsule Builder UX contract', () => {
  const root = process.cwd();

  it('keeps a three-stage private builder with package settings behind the advanced controls', () => {
    const page = readFileSync(path.join(root, 'src/app/app/capsules/builder/page.tsx'), 'utf8');
    const wizard = readFileSync(path.join(root, 'src/components/capsules/CapsuleBuilderWizard.tsx'), 'utf8');

    expect(page).toContain('CapsuleBuilderWizard');
    const stepConfiguration = wizard.slice(wizard.indexOf('const STEPS:'), wizard.indexOf('const DOMAIN_OPTIONS'));
    const stepLabels = [...stepConfiguration.matchAll(/label: '([^']+)'/g)].map((match) => match[1]);
    expect(stepLabels.slice(0, 3)).toEqual(['Purpose', 'Material', 'Review and save']);
    expect(stepLabels.slice(3)).toEqual(['Source preferences', 'Package proposals', 'Output', 'Tools', 'Package publication']);
    expect(wizard).toContain('const [showSettings, setShowSettings] = useState(false)');
    expect(wizard).toContain('const visibleSteps = showSettings ? STEPS : STEPS.slice(0, 3)');
    expect(wizard).toContain('Advanced settings');
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
    const privateSave = wizard.slice(wizard.indexOf('async function saveDraft()'), wizard.indexOf('async function saveAndUse()'));
    expect(privateSave).toContain("fetch('/api/context/capsules'");
    expect(privateSave).not.toContain('/publish');
    expect(wizard).toContain('Save and use in Ask');
    expect(wizard).toContain('Sources and generated proposals still need review.');
    expect(wizard).toContain('Package publication is a separate advanced workflow.');
    expect(wizard).toContain('Check draft structure');
    expect(wizard).not.toContain('builder-source');
    expect(wizard).not.toContain('Publish gate is ready');
  });

  it('accepts documents, ideas and conversations without replacing the single-prompt first step', () => {
    const wizard = readFileSync(path.join(root, 'src/components/capsules/CapsuleBuilderWizard.tsx'), 'utf8');

    expect(wizard).toContain('What should this capsule do?');
    expect(wizard).toContain('Capsule Architect');
    expect(wizard).toContain('Documents, ideas and conversations');
    expect(wizard).toContain('Ideas, notes or conversation');
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
