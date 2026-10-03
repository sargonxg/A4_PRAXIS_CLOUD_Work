import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CapsuleExpertisePanel } from '@/components/capsules/CapsuleExpertisePanel';

describe('Capsule expertise panel', () => {
  it('provides critical case, distinction, language and correction capture inside the capsule', () => {
    const html = renderToStaticMarkup(<CapsuleExpertisePanel capsuleId="owned" />);
    for (const text of ['Expertise', 'Critical case', 'Distinction', 'Language rule', 'Save lesson from correction', 'What would a beginner miss?', 'Scope', 'Propose for review', 'Search expert knowledge']) expect(html).toContain(text);
    for (const kind of ['cue', 'pattern', 'heuristic', 'distinction', 'exception', 'redFlag', 'question', 'languageRule', 'procedure', 'case', 'unknown', 'revisionTrigger']) expect(html).toContain(`value="${kind}"`);
    expect(html).not.toContain('Mark accepted');
  });
  it('shows saved knowledge with provenance and review state', () => {
    const html = renderToStaticMarkup(<CapsuleExpertisePanel capsuleId="owned" initialKnowledge={[{
      id: 'rule-1', kind: 'heuristic', label: 'Check disbursement records', scope: ['funding'], reviewState: 'proposed', body: 'Authorization alone is insufficient.',
      provenance: { generatedBy: { type: 'human', id: 'expert-1', at: '2026-10-03T00:00:00.000Z' }, sourceRefs: ['receipt-1'] },
    }]} />);
    for (const text of ['Check disbursement records', 'proposed', 'expert-1', 'receipt-1', 'funding']) expect(html).toContain(text);
  });
});
