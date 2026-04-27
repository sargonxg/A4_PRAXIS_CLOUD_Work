import { describe, it, expect } from 'vitest';
import { buildDocumentRefHref, readDocRefFromSearch } from '@/components/praxis/document-ref-chip';

describe('buildDocumentRefHref', () => {
  it('builds an /app/documents link with docId only', () => {
    expect(buildDocumentRefHref('doc-123')).toBe('/app/documents?docId=doc-123');
  });

  it('appends chunkId when provided', () => {
    expect(buildDocumentRefHref('doc-123', 'chunk-7')).toBe('/app/documents?docId=doc-123&chunkId=chunk-7');
  });

  it('honours the demo route prefix', () => {
    expect(buildDocumentRefHref('doc-x', 'chunk-y', '/demo')).toBe('/demo/documents?docId=doc-x&chunkId=chunk-y');
  });

  it('encodes dynamic ids', () => {
    const href = buildDocumentRefHref('doc with space', 'chunk?id=42');
    expect(href).toMatch(/docId=doc\+with\+space/);
    expect(href).toMatch(/chunkId=chunk%3Fid%3D42/);
  });
});

describe('readDocRefFromSearch', () => {
  it('returns null when docId absent', () => {
    expect(readDocRefFromSearch('')).toBeNull();
    expect(readDocRefFromSearch('?other=1')).toBeNull();
  });

  it('parses docId only', () => {
    expect(readDocRefFromSearch('?docId=abc')).toEqual({ docId: 'abc', chunkId: undefined });
  });

  it('parses docId + chunkId', () => {
    expect(readDocRefFromSearch('?docId=abc&chunkId=42')).toEqual({ docId: 'abc', chunkId: '42' });
  });

  it('accepts a search string without leading ?', () => {
    expect(readDocRefFromSearch('docId=abc&chunkId=42')).toEqual({ docId: 'abc', chunkId: '42' });
  });

  it('decodes URI-encoded values', () => {
    const result = readDocRefFromSearch('?docId=doc%20with%20space');
    expect(result?.docId).toBe('doc with space');
  });
});
