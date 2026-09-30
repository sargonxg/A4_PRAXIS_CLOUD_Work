import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { legalPages } from '@/lib/legal/pages';
import { metadata as loginMetadata } from '@/app/(auth)/login/layout';

const root = process.cwd();

describe('SEO analytics contract', () => {
  it('lists canonical public destinations and dates legal pages from their actual content', () => {
    const routes = sitemap();
    const urls = routes.map((route) => route.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).not.toContain('https://praxis.tacitus.me/changelog');
    expect(urls).not.toContain('https://praxis.tacitus.me/login');
    expect(urls).toContain('https://praxis.tacitus.me/guide');
    for (const page of legalPages) {
      expect(routes.find((route) => route.url.endsWith(`/legal/${page.slug}`))?.lastModified)
        .toEqual(new Date(page.updatedAt));
    }
    expect(routes.find((route) => route.url === 'https://praxis.tacitus.me')?.lastModified).toBeUndefined();
  });

  it('keeps login crawlable but out of search results', () => {
    expect(loginMetadata.alternates?.canonical).toBe('/login');
    expect(loginMetadata.robots).toMatchObject({
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    });
  });

  it('renders the public heading before the client-only chat without duplicating it', () => {
    const shell = readFileSync(join(root, 'src/components/app/praxis-chat-first-shell.tsx'), 'utf8');
    const chat = readFileSync(join(root, 'src/components/app/praxis-chat.tsx'), 'utf8');
    expect(shell).toMatch(/<h1[^>]*>\s*Policy analysis you can inspect\.\s*<\/h1>/);
    expect(shell.indexOf('<h1')).toBeLessThan(shell.indexOf('<PraxisChat', shell.indexOf('<h1')));
    expect(shell).toContain('showHomeHeading={!isPublic}');
    expect(chat).toContain("variant === 'home' && showHomeHeading");
    expect(chat).toContain('showHomeHeading = true');
  });

  it('keeps optional visit analytics disabled before a consent interface exists', () => {
    const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
    const landingPage = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
    const firebaseClient = readFileSync(join(root, 'src/lib/firebase/config.ts'), 'utf8');

    expect(layout).not.toContain('googletagmanager.com/gtag/js');
    expect(layout).not.toContain("gtag('config'");
    expect(landingPage).not.toContain('googletagmanager.com/gtag/js');
    expect(firebaseClient).toContain('analytics: Analytics | null = null');
    expect(firebaseClient).not.toContain('getAnalytics(');
    expect(firebaseClient).toContain('getAuth(app)');
    expect(firebaseClient).toContain('getFirestore(app)');
  });
});
