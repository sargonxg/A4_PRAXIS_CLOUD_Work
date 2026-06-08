import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('SEO analytics contract', () => {
  it('loads the PRAXIS Google tag once from the root layout for all routes', () => {
    const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
    const landingPage = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');

    expect(layout).toContain('NEXT_PUBLIC_GA_MEASUREMENT_ID');
    expect(layout).toContain('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID');
    expect(layout).toContain('https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}');
    expect(layout).toContain("gtag('config', '${gaMeasurementId}', { anonymize_ip: true })");
    expect(landingPage).not.toContain('googletagmanager.com/gtag/js');
  });
});
