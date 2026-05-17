import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Ask source preview panel contract', () => {
  const source = readFileSync(join(process.cwd(), 'src/components/ask/AskStreamPanel.tsx'), 'utf8');

  it('renders source locators, source receipt links, and extraction fallback labels', () => {
    expect(source).toContain('locatorLabel');
    expect(source).toContain('sourceReceiptHref');
    expect(source).toContain('extractionFallbackLabel');
    expect(source).toContain('Source receipt');
  });

  it('renders follow-up chips as composer actions', () => {
    expect(source).toContain('onFollowUp');
    expect(source).toContain('setPrompt(followUp)');
    expect(source).toContain('<button');
    expect(source).not.toContain('<span key={followUp}');
  });
});
