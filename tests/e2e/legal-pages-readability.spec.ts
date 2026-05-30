import { expect, test, type Page } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

const legalPages = [
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'cookies', title: 'Cookie Notice' },
  { slug: 'gdpr', title: 'GDPR and Privacy Rights' },
  { slug: 'data-processing', title: 'Data Processing Addendum' },
  { slug: 'terms', title: 'Terms of Service' },
  { slug: 'security', title: 'Security' },
  { slug: 'sub-processors', title: 'Sub-processors' },
  { slug: 'data-retention', title: 'Data Retention' },
] as const;

test.describe('legal pages readability', () => {
  for (const legalPage of legalPages) {
    test(`${legalPage.slug} is structured and readable`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE}/legal/${legalPage.slug}`);

      await expect(page.getByRole('heading', { level: 1, name: legalPage.title })).toBeVisible();
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.locator('h2').count(), `${legalPage.slug} section headings`).toBeGreaterThan(1);
      await expect(page.getByRole('navigation').last().getByRole('link')).toHaveCount(legalPages.length);
      await expectNoDocumentOverflow(page, `/legal/${legalPage.slug}`, 390);

      const mobileContrastFailures = await collectTextContrastFailures(page);
      expect(mobileContrastFailures, `/legal/${legalPage.slug} mobile contrast failures`).toEqual([]);

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.reload();
      await expectNoDocumentOverflow(page, `/legal/${legalPage.slug}`, 1280);

      const desktopContrastFailures = await collectTextContrastFailures(page);
      expect(desktopContrastFailures, `/legal/${legalPage.slug} desktop contrast failures`).toEqual([]);
    });
  }
});

async function expectNoDocumentOverflow(page: Page, path: string, width: number) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${path} document overflow at ${width}px`).toBeLessThanOrEqual(2);
}

async function collectTextContrastFailures(page: Page) {
  return page.evaluate(() => {
    type Rgba = [number, number, number, number];

    function parseColor(value: string): Rgba | null {
      const trimmed = value.trim();
      if (trimmed === 'transparent') return [0, 0, 0, 0];
      const match = trimmed.match(/^rgba?\(([^)]+)\)$/i);
      if (!match) return null;
      const parts = match[1]
        .split(',')
        .map((part) => part.trim())
        .map((part) => part.endsWith('%') ? String(Number(part.slice(0, -1)) * 2.55) : part);
      const [r, g, b] = parts.slice(0, 3).map((part) => Number.parseFloat(part));
      const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
      if ([r, g, b, alpha].some((part) => Number.isNaN(part))) return null;
      return [r, g, b, alpha];
    }

    function composite(top: Rgba, bottom: Rgba): Rgba {
      const alpha = top[3] + bottom[3] * (1 - top[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / alpha,
        (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / alpha,
        (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / alpha,
        alpha,
      ];
    }

    function relativeLuminance(color: Rgba) {
      const [r, g, b] = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrastRatio(foreground: Rgba, background: Rgba) {
      const fg = relativeLuminance(foreground);
      const bg = relativeLuminance(background);
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    }

    function effectiveBackground(element: Element): Rgba {
      const ancestry: Element[] = [];
      let cursor: Element | null = element;
      while (cursor) {
        ancestry.unshift(cursor);
        cursor = cursor.parentElement;
      }

      let background: Rgba = [255, 255, 255, 1];
      for (const ancestor of ancestry) {
        const color = parseColor(getComputedStyle(ancestor).backgroundColor);
        if (color) background = composite(color, background);
      }
      return background;
    }

    function directVisibleText(element: Element) {
      return Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter(Boolean)
        .join(' ');
    }

    function selectorFor(element: Element) {
      const tag = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : '';
      const testId = element.getAttribute('data-testid');
      return testId ? `${tag}[data-testid="${testId}"]` : `${tag}${id}`;
    }

    return Array.from(document.querySelectorAll('body *'))
      .flatMap((element) => {
        const text = directVisibleText(element);
        if (!text) return [];
        if (element.closest('[aria-hidden="true"], [hidden]')) return [];

        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return [];

        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return [];

        const foreground = parseColor(style.color);
        if (!foreground) return [];
        const background = effectiveBackground(element);
        const paintedForeground = composite(foreground, background);
        const ratio = contrastRatio(paintedForeground, background);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const threshold = largeText ? 3 : 4.5;

        if (ratio + 0.01 >= threshold) return [];
        return [{
          selector: selectorFor(element),
          text: text.slice(0, 80),
          ratio: Number(ratio.toFixed(2)),
          threshold,
          color: style.color,
          background: getComputedStyle(element).backgroundColor,
        }];
      });
  });
}
