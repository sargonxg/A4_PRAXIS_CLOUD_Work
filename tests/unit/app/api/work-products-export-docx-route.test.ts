import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; name: string; email: string }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, { uid: 'user-1', name: 'Analyst', email: 'analyst@example.test' }),
}));

describe('work product DOCX export route', () => {
  it('blocks policy memo export while unsupported paragraphs remain', async () => {
    const { POST } = await import('@/app/api/work-products/export-docx/route');

    const response = await POST(new Request('http://localhost/api/work-products/export-docx', {
      method: 'POST',
      body: JSON.stringify({
        productType: 'policy-memo',
        title: 'Treaty analysis memo',
        sections: [{ heading: 'Analysis', body: 'Unsupported operational claim.' }],
        unsupportedClaims: ['Unsupported operational claim.'],
        claimChecks: [{ paragraphId: 'p1', status: 'unsupported', claim: 'Unsupported operational claim.' }],
      }),
      headers: { 'content-type': 'application/json' },
    }));

    const payload = await response.json();
    expect(response.status).toBe(409);
    expect(payload).toMatchObject({
      error: 'Unsupported paragraphs block export for policy memos and board executive packs.',
      exportBlocked: true,
      unsupportedClaimCount: 1,
      unsupportedParagraphIds: ['p1'],
    });
  });

  it('allows lower-stakes working draft export with unsupported notes preserved', async () => {
    const { POST } = await import('@/app/api/work-products/export-docx/route');

    const response = await POST(new Request('http://localhost/api/work-products/export-docx', {
      method: 'POST',
      body: JSON.stringify({
        productType: 'source-note',
        title: 'Working source note',
        sections: [{ heading: 'Note', body: 'Needs verification.' }],
        unsupportedClaims: ['Needs verification.'],
      }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument');
  });
});
