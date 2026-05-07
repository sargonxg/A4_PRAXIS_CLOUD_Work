import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('AI-first case creation scaffold route returns a reviewable Pack 28 proposal', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026');

  const result = await page.evaluate(async () => {
    const response = await fetch('/api/cases/scaffold', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        objective: 'Track ceasefire compliance in Sudan over Q3 2026, focusing on Khartoum and West Darfur.',
        userRole: 'mediator',
      }),
    });
    return {
      status: response.status,
      payload: await response.json(),
    };
  });

  expect(result.status).toBe(200);
  expect(result.payload.proposal.suggestedCaseName).toContain('Sudan');
  expect(result.payload.proposal.initialActors.length).toBeGreaterThanOrEqual(3);
  expect(result.payload.proposal.initialClaims.length).toBeGreaterThanOrEqual(1);
  expect(result.payload.proposal.suggestedSourceIds.length).toBeGreaterThanOrEqual(3);
  expect(result.payload.audit.firewallNote).toContain('normal case persistence validation');
});
