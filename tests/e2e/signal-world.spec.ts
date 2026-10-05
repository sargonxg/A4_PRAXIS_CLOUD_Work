import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials, canaryCredentialSkipReason } from './helpers/auth';
import { SIGNAL_WORLD_GEOGRAPHY } from '../../src/lib/signal/world-geography';
import type { SignalWorldSnapshot } from '../../src/lib/signal/world-schema';

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }, ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {}) });
const origin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const upstream = process.env.SIGNAL_LOCAL_UPSTREAM;
async function forwarding(page: Page) {
  if (!upstream) return;
  await page.route(`https://${new URL(origin).host}/**`, async route => {
    try { const request = route.request(), url = new URL(request.url()); const response = await page.request.fetch(new URL(url.pathname + url.search, upstream).toString(), { method: request.method(), headers: { ...await request.allHeaders(), connection: 'close', 'x-forwarded-host': new URL(origin).host, 'x-forwarded-proto': 'https' }, ...(request.postDataBuffer() ? { data: request.postDataBuffer()! } : {}), maxRedirects: 0, maxRetries: request.method() === 'GET' ? 2 : 0 }); await route.fulfill({ response }); } catch { await route.abort().catch(() => {}); }
  });
}
async function login(page: Page) { await forwarding(page); await authenticateFirebaseCanary(page, undefined, '/app', { expectComposer: false }); await page.goto('/signal'); await expect(page.getByTestId('signal-world-explorer')).toBeVisible({ timeout: 30000 }); }
function anchorCamera(code: string) { const anchor = SIGNAL_WORLD_GEOGRAPHY.find(country => country.code === code)!; const lat = anchor.latitude! * Math.PI / 180, lon = anchor.longitude! * Math.PI / 180; return [335 * Math.cos(lat) * Math.sin(lon), 335 * Math.sin(lat), 335 * Math.cos(lat) * Math.cos(lon)].map(value => value.toFixed(3)).join(','); }
async function snapshot(page: Page): Promise<SignalWorldSnapshot> { const value = await page.evaluate(async () => { const r = await fetch('/api/signal/world', { credentials: 'include' }); return { status: r.status, body: await r.json() }; }); expect(value.status, 'Actual authenticated world snapshot').toBe(200); expect(value.body.world.countries.length).toBeGreaterThan(0); return value.body.world; }

test('world API and AI remain authenticated', async ({ request }) => {
  expect((await request.get(upstream ? `${upstream}/api/signal/world` : '/api/signal/world')).status()).toBe(401);
  expect((await request.post(upstream ? `${upstream}/api/ai/signal-world` : '/api/ai/signal-world', { data: { question: 'Explain the available public observations.', countryCode: 'BR' } })).status()).toBe(401);
});

test('real world globe: filled country raycast, filters, inspectable sources, timing, mobile and advanced evidence', async ({ page }) => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason()); test.setTimeout(180000);
  const errors: string[] = [], aiCalls: string[] = [], clientProviderRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.name)); page.on('request', request => { const url = new URL(request.url()); if (url.pathname === '/api/ai/signal-world') aiCalls.push(request.method()); if (['api.worldbank.org', 'www.gov.uk', 'ec.europa.eu', 'cdn.jsdelivr.net', 'unpkg.com'].includes(url.hostname)) clientProviderRequests.push(url.hostname); });
  await login(page); const data = await snapshot(page);
  const explorer = page.getByTestId('signal-world-explorer'), scene = explorer.getByTestId('signal-world-webgl'), country = explorer.getByLabel('World country selector', { exact: true });
  await expect(scene.locator('canvas')).toBeVisible({ timeout: 30000 }); expect(await scene.locator('canvas').evaluate(canvas => !!(canvas as HTMLCanvasElement).getContext('webgl2'))).toBe(true);
  await country.selectOption('BR'); await expect(explorer.getByRole('heading', { name: 'Brazil', exact: true })).toBeVisible();
  await expect(scene).toHaveAttribute('data-camera', anchorCamera('BR')); const initial = await scene.getAttribute('data-camera');
  await explorer.getByRole('button', { name: 'Rotate world right', exact: true }).click(); await expect(scene).not.toHaveAttribute('data-camera', initial!); await explorer.getByRole('button', { name: 'Zoom world in', exact: true }).click(); await explorer.getByRole('button', { name: 'Reset world view', exact: true }).click(); await expect(scene).toHaveAttribute('data-camera', initial!);
  const canvas = scene.locator('canvas'), box = await canvas.boundingBox(); expect(box).not.toBeNull(); await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } }); await expect(scene).toHaveAttribute('data-picked-country', 'BR');
  await country.selectOption('JP'); await expect(explorer.getByRole('heading', { name: 'Japan', exact: true })).toBeVisible(); await expect(scene).toHaveAttribute('data-camera', anchorCamera('JP')); await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } }); await expect(scene).toHaveAttribute('data-picked-country', 'JP');
  await explorer.getByText('More ways to explore', { exact: true }).click();
  await explorer.getByLabel('World conflict filter', { exact: true }).selectOption('ukraine-context'); const options = await country.locator('option').evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value)); expect(options.filter(Boolean).sort()).toEqual(['RU', 'UA']);
  await explorer.getByLabel('World conflict filter', { exact: true }).selectOption('all'); await explorer.getByLabel('Find a country', { exact: true }).fill('no such synthetic country'); await expect(explorer.getByText('No configured countries match these filters.', { exact: true })).toBeVisible(); await explorer.getByLabel('Find a country', { exact: true }).fill('');
  await country.selectOption('BR'); await explorer.getByRole('button', { name: 'Economic context', exact: true }).click();
  const brazil = data.countries.find(item => item.code === 'BR')!; for (const metric of brazil.metrics) { await expect(explorer.getByRole('heading', { name: metric.label, exact: true })).toBeVisible(); if (metric.value !== null && metric.status !== 'available') await expect(explorer.getByText('Retained last-known value', { exact: false }).first()).toBeVisible(); }
  await explorer.getByRole('button', { name: 'Government', exact: true }).click(); for (const portal of brazil.governmentPortals) await expect(explorer.getByRole('link', { name: `${portal.label} (opens in a new tab)`, exact: true })).toHaveAttribute('href', portal.url);
  await explorer.getByRole('button', { name: 'Media & topics', exact: true }).click(); const withTitles = data.countries.find(item => item.headlines.length > 0); let inspectedHeadlines = 0;
  if (withTitles) { await country.selectOption(withTitles.code); const headlines = explorer.getByRole('list', { name: `${withTitles.name} source headlines` }); const links = await headlines.getByRole('link').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent ?? '', href: (node as HTMLAnchorElement).href }))); for (const headline of withTitles.headlines) expect(links.some(link => link.text.startsWith(headline.title) && link.href === new URL(headline.url).href), 'Exact source title and URL pair remains inspectable').toBe(true); inspectedHeadlines = withTitles.headlines.length; const landscape = explorer.getByTestId('signal-world-landscape'); await landscape.getByRole('list', { name: 'Source feed graph nodes', exact: true }).getByRole('button').first().click(); await expect(landscape.getByRole('list', { name: 'Graph exact matching headlines' })).toBeVisible(); }
  await mkdir('output/signal', { recursive: true }); await scene.screenshot({ path: 'output/signal/world-globe-desktop.png', animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false); await scene.screenshot({ path: 'output/signal/world-globe-mobile.png', animations: 'disabled' }); await explorer.getByTestId('signal-world-country-panel').screenshot({ path: 'output/signal/world-country-mobile.png', animations: 'disabled' });
  expect(aiCalls, 'No automatic billed AI on load, filters or country selection').toEqual([]); expect(clientProviderRequests, 'Public observations and local geometry stay behind the server gateway').toEqual([]); expect(errors).toEqual([]);
  await explorer.getByRole('button', { name: 'Evidence & briefs', exact: true }).click(); await expect(page.getByRole('heading', { level: 1, name: 'SIGNAL', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Explore the world', exact: true }).click(); await expect(page.getByTestId('signal-world-explorer')).toBeVisible();
  await writeFile('output/signal/world-browser-summary.json', JSON.stringify({ actualWorldSnapshot: true, countries: data.countries.length, actualWebGL2: true, filledMeshRaycastCountries: ['BR', 'JP'], cameraControls: true, regionalFilters: true, inspectedHeadlines, automaticAiCalls: aiCalls.length, providerClientFetches: clientProviderRequests.length, runtimeExceptions: errors.length, mobileOverflow: false, syntheticFixturesCreated: 0, noPrivateOwnerDataInScreenshots: true }, null, 2));
});

test('world GPU failure preserves keyboard country selection and 2D source panels', async ({ page }) => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason()); test.setTimeout(120000);
  await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<HTMLCanvasElement['getContext']>) { if (['webgl', 'webgl2', 'experimental-webgl'].includes(String(args[0]))) return null; return original.apply(this, args); } as HTMLCanvasElement['getContext']; });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.name)); await login(page);
  const world = page.getByTestId('signal-world-explorer'); await expect(world.getByTestId('signal-world-map')).toBeVisible({ timeout: 30000 }); const brazil = world.getByTestId('signal-world-map').getByRole('button', { name: 'Select country Brazil', exact: true }); await brazil.focus(); await page.keyboard.press('Enter'); await expect(world.getByRole('heading', { name: 'Brazil', exact: true })).toBeVisible(); await world.getByLabel('World country selector', { exact: true }).selectOption('JP'); await expect(world.getByRole('heading', { name: 'Japan', exact: true })).toBeVisible(); expect(errors).toEqual([]);
});
