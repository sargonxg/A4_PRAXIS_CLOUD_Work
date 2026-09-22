import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { JevReviewControl } from '@/components/app/jev-review-control';

describe('optional JEV review control', () => {
  it('discloses unavailable integration and prevents sending content before setup', () => {
    const html = renderToStaticMarkup(<JevReviewControl />);
    expect(html).toContain('JEV review');
    expect(html).toContain('Not connected');
    expect(html).toContain('disabled=""');
    expect(html).toContain('No content is sent to TypeSafe');
    expect(html).not.toContain('checked=""');
  });
});
