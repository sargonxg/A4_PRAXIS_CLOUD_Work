import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CapsuleMethodInspection } from '@/components/capsules/CapsuleMethodInspection';
import { getCapsuleStarterDefinition } from '@/lib/product/context-capsules';

describe('CapsuleMethodInspection', () => {
  it('exposes the saved inputs, procedure, graph template and limits', () => {
    const html = renderToStaticMarkup(<CapsuleMethodInspection snapshot={getCapsuleStarterDefinition('starter-tool-institutional-logic-lens')} />);
    for (const phrase of ['Ostrom', 'source_id', 'rules-in-use', 'Graph and ontology template', 'not evidence']) expect(html).toContain(phrase);
  });
  it('handles an absent or malformed profile without inventing a method', () => {
    expect(renderToStaticMarkup(<CapsuleMethodInspection snapshot={null} />)).toBe('');
    expect(renderToStaticMarkup(<CapsuleMethodInspection snapshot={{ deviceProfile: { methodSteps: null } }} />)).toContain('Saved method');
  });
});
