import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CapsuleLessonCapture, lessonCaptureInput } from '@/components/capsules/CapsuleLessonCapture';

describe('teach from an answer correction', () => {
  it('captures the distinction and explicit correction without asserting an accepted review', () => {
    const payload = lessonCaptureInput({ conceptA: 'authorization', conceptB: 'expenditure', scope: 'finance', correction: 'Spending is not established.', explanation: 'Require expenditure records.' });
    expect(payload).toMatchObject({ kind: 'distinction', terms: ['authorization', 'expenditure'], scope: ['finance'], body: 'Spending is not established.', rationale: 'Require expenditure records.' });
    expect(payload).not.toHaveProperty('reviewState');
    expect(payload).not.toHaveProperty('provenance');
    expect(() => lessonCaptureInput({ conceptA: '', conceptB: 'expenditure', scope: '', correction: 'No.', explanation: '' })).toThrow();
  });
  it('offers a review-required lesson action for the answer capsule', () => {
    const html = renderToStaticMarkup(<CapsuleLessonCapture capsuleId="answer-capsule" answerId="turn1" />);
    expect(html).toContain('Save lesson');
    expect(html).not.toContain('automatically accepted');
  });
});
