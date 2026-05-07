import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('agentic boardroom convenes, streams, synthesizes, promotes, and exports in demo mode', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026');
  await page.goto('/app/workbench/syria-2026/boardroom');
  await expect(page.getByRole('heading', { name: /Agentic Boardroom/i })).toBeVisible();

  await page.getByRole('link', { name: /Convene/i }).click();
  await expect(page.getByRole('heading', { name: /Convene the boardroom/i })).toBeVisible();
  await page.getByRole('button', { name: /Convene now/i }).click();
  await page.waitForURL(/\/app\/workbench\/syria-2026\/boardroom\/[^/]+$/);
  await expect(page.getByText(/Agentic Boardroom/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^Start$/i }).click();
  await expect(page.getByText(/Synthesis ready|Streaming boardroom turns/i)).toBeVisible();

  await page.getByRole('link', { name: /Synthesis/i }).click();
  await expect(page.getByText(/Consensus claims/i)).toBeVisible();
  await page.getByRole('button', { name: /Review/i }).first().click();
  await expect(page.getByText(/Demo promotion prepared|Review queue item created/i)).toBeVisible();

  const exportResponse = await page.request.get('/api/boardroom/deliberations/boardroom-demo/export?caseId=syria-2026&format=md');
  expect(exportResponse.ok()).toBe(true);
  await expect(exportResponse.text()).resolves.toContain('Boardroom output is synthesized and advisory');
});
