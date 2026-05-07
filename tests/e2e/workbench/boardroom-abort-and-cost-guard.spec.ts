import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('boardroom exposes abort control and keeps deterministic cost under ceiling', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026');

  const startResponse = await page.request.post('/api/boardroom/deliberations/boardroom-demo/start', {
    data: { caseId: 'syria-2026' },
  });
  expect(startResponse.ok()).toBe(true);
  const started = await startResponse.json();
  expect(started.deliberation.cost.estimatedUsd).toBeLessThanOrEqual(started.deliberation.cost.ceilingUsd);
  expect(started.stream.available).toBe(true);

  const streamResponse = await page.request.get('/api/boardroom/deliberations/boardroom-demo/stream?caseId=syria-2026');
  expect(streamResponse.ok()).toBe(true);
  await expect(streamResponse.text()).resolves.toContain('event: contribution');

  await page.goto('/app/workbench/syria-2026/boardroom/boardroom-demo');
  await page.getByRole('button', { name: /^Abort$/i }).click();
  await expect(page.getByText(/Deliberation aborted/i)).toBeVisible();
});
