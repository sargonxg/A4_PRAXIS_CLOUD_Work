import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('citation editor contract', () => {
  it('defines a TipTap citation mark with source and claim attributes', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/drafting/citation-mark.ts'), 'utf8');

    expect(source).toContain("name: 'citation'");
    expect(source).toContain('data-source-id');
    expect(source).toContain('data-claim-id');
    expect(source).toContain('@tiptap/core');
  });

  it('mounts StarterKit, links, placeholders, and source card context', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/drafting/citation-editor.tsx'), 'utf8');

    expect(source).toContain('@tiptap/react');
    expect(source).toContain('StarterKit');
    expect(source).toContain('CitationMark');
    expect(source).toContain('sourceCards');
  });
});
