import { describe, expect, it } from 'vitest';

import {
  buildShareableWorkProductLink,
  exportGoogleDocDisabledResponse,
  normalizeWorkProductExportInput,
} from '@/lib/drafting/export';

describe('work product export helpers', () => {
  it('normalizes export input without raw chat transcript framing', () => {
    const normalized = normalizeWorkProductExportInput({
      title: 'Policy memo',
      format: 'docx',
      outputTarget: 'memo',
      sections: [
        { heading: 'Bottom Line', body: 'A sourced judgment.' },
      ],
      sourceCards: [{ id: 's1', title: 'Source', url: 'https://example.com' }],
    });

    expect(normalized.sections[0].heading).toBe('Bottom Line');
    expect(normalized.sourceCards[0].id).toBe('s1');
    expect(normalized.filename).toMatch(/Policy_memo/);
  });

  it('keeps Google Docs export disabled-safe unless configured', () => {
    expect(exportGoogleDocDisabledResponse()).toEqual({
      status: 'disabled',
      reason: 'Set GOOGLE_DOCS_EXPORT_ENABLED=true and configure Drive credentials to enable Google Docs export.',
    });
  });

  it('builds shareable app links for saved drafts', () => {
    expect(buildShareableWorkProductLink({ memoId: 'memo-1' })).toBe('/app/write?memoId=memo-1');
  });
});
