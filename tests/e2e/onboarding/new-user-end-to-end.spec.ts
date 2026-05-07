import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('activation proxy covers scaffold, tools, memos, and draft export surfaces', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026');

  const scaffold = await page.evaluate(async () => {
    const response = await fetch('/api/cases/scaffold', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        objective: 'Create a mediation-ready case on ceasefire compliance and humanitarian access.',
        userRole: 'mediator',
      }),
    });
    return { ok: response.ok, payload: await response.json() };
  });
  expect(scaffold.ok).toBe(true);
  expect(scaffold.payload.proposal.primaryOntologyId).toBeTruthy();

  await page.getByRole('button', { name: /^Tools$/i }).click();
  await expect(page.getByTestId('tool-marketplace')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Run$/i }).first()).toBeVisible();

  await page.getByRole('button', { name: /^Memos$/i }).click();
  await expect(page.getByRole('heading', { name: /Memo Studio/i })).toBeVisible();

  await page.getByRole('button', { name: /^Draft$/i }).click();
  await expect(page.getByTestId('workbench-draft-surface')).toBeVisible();
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^Export package$/i }).click(),
  ]).then(([file]) => file);
  expect(download.suggestedFilename()).toContain('briefing-package');
});
