import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/components/app/app-shell.tsx'), 'utf8');

describe('AppShell search contract', () => {
  it('opens global search from one-page cockpit custom events', () => {
    expect(source).toContain("'open-praxis-search'");
    expect(source).toContain('SearchOpenEvent');
    expect(source).toContain('openSearch(searchEvent.detail?.query)');
  });

  it('renders global search outside the legacy shell branch', () => {
    const overlayIndex = source.indexOf('{searchOpen && (');
    const onePageIndex = source.indexOf('data-testid="praxis-one-page-app-shell"');

    expect(overlayIndex).toBeGreaterThan(onePageIndex);
    expect(source).toContain('data-testid="praxis-one-page-app-shell"');
    expect(source).toContain('<GlobalSearch');
  });
});
