import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

// Explicit opt-in: these checks use real hosted services and may consume AI quota.
test('live policy services answer without supplied capsules and flag missing evidence', async ({ page }) => {
  test.skip(process.env.PRAXIS_LIVE_AI_SMOKE !== '1' || !hasFirebaseCanaryCredentials(), 'requires explicit live-service opt-in and disposable credentials');
  test.setTimeout(180_000);
  await authenticateFirebaseCanary(page, BASE, '/app', { finishOnboardingLater: true });
  const answer = await page.request.post(`${BASE}/api/ai/ask-praxis`, {
    timeout: 90_000,
    data: {
      messages: [{ role: 'user', content: 'Explain what a counterfactual is in policy evaluation in two sentences. This is a general methods question; no case evidence is supplied.' }],
      activeContextStack: { capsuleId: null, capsuleRefs: [], sourceIds: [], documentIds: [], situationId: null },
      currentPath: '/app',
    },
  });
  expect(answer.status()).toBe(200);
  const stream = await answer.text();
  const text = stream.split('\n').flatMap((line) => {
    if (!line.startsWith('0:')) return [];
    try { const token = JSON.parse(line.slice(2)); return typeof token === 'string' ? [token] : []; } catch { return []; }
  }).join('');
  expect(stream).not.toMatch(/^3:/m);
  expect(text.length).toBeGreaterThan(40);
  expect(text).toMatch(/counterfactual/i);

  const checked = await page.request.post(`${BASE}/api/ai/sourceability`, {
    timeout: 60_000,
    data: { claimText: 'The fictional Example Council policy reduced unemployment by 73 percent.', sourceSnippets: [] },
  });
  expect(checked.status()).toBe(200);
  const verdict = await checked.json();
  expect(['weak', 'unsupported', 'needs_date_check']).toContain(verdict.status);
  expect(verdict.supportingSourceIds).toEqual([]);
  expect(verdict.missingEvidence.length).toBeGreaterThan(0);
});
