import { describe, expect, it } from 'vitest';

import {
  POLICY_OUTPUT_TARGETS,
  inferPolicyOutputTargetFromText,
  outputCapsuleTemplateIdForTarget,
  outputTargetRequiresSourceability,
  outputTargetReviewGate,
  outputTargetStarterHeadings,
  normalizePolicyOutputTarget,
} from '@/lib/policy-work-file/output-targets';

describe('policy work file output targets', () => {
  it('defines the five first-class policy deliverables', () => {
    expect(POLICY_OUTPUT_TARGETS.map((target) => target.id)).toEqual([
      'policy-memo',
      'briefing-note',
      'options-memo',
      'compliance-note',
      'stakeholder-map-brief',
    ]);
  });

  it('normalizes legacy Ask targets without exposing a tool marketplace', () => {
    expect(normalizePolicyOutputTarget('memo')).toBe('policy-memo');
    expect(normalizePolicyOutputTarget('brief')).toBe('briefing-note');
    expect(normalizePolicyOutputTarget('docx-pdf')).toBe('policy-memo');
    expect(normalizePolicyOutputTarget('handover')).toBe('briefing-note');
  });

  it('maps targets to existing OutputCapsule templates and distinct starter headings', () => {
    const headings = new Map(POLICY_OUTPUT_TARGETS.map((target) => [
      target.id,
      outputTargetStarterHeadings(target.id),
    ]));

    expect(outputCapsuleTemplateIdForTarget('policy-memo')).toBe('principals-decision-memo');
    expect(outputCapsuleTemplateIdForTarget('options-memo')).toBe('options-memo');
    expect(outputCapsuleTemplateIdForTarget('compliance-note')).toBe('legal-mandate-compliance-note');
    expect(headings.get('policy-memo')).toContain('Bottom line');
    expect(headings.get('briefing-note')).toContain('Key points');
    expect(headings.get('options-memo')).toContain('Options');
    expect(headings.get('compliance-note')).toContain('Controlling authority');
    expect(headings.get('stakeholder-map-brief')).toContain('Actor map');
    expect(new Set([...headings.values()].map((items) => items.join('|'))).size).toBe(5);
  });

  it('infers deliverables and exposes review gates for export readiness', () => {
    expect(inferPolicyOutputTargetFromText('Prepare an options memo comparing three tradeoffs.')).toBe('options-memo');
    expect(inferPolicyOutputTargetFromText('Map stakeholders, leverage, incentives, and coalition risks.')).toBe('stakeholder-map-brief');
    expect(outputTargetRequiresSourceability('policy-memo')).toBe(true);
    expect(outputTargetRequiresSourceability('compliance-note')).toBe(true);
    expect(outputTargetReviewGate('policy-memo')).toMatchObject({
      requiresSourceabilityBeforeExport: true,
      statusLabel: 'Sourceability required',
    });
  });
});
