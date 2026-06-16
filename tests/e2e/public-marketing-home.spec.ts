import { expect, test } from '@playwright/test';

test('public / renders the light marketing hero and not the cockpit', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/')) requests.push(url);
  });

  await page.goto('/');
  await expect(page.getByTestId('marketing-home')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ask\. Get a sourced brief\./i })).toBeVisible();
  await expect(page.getByTestId('marketing-hero-prompt')).toBeVisible();
  await expect(page.getByTestId('marketing-primary-cta')).toHaveCount(1);

  await expect(page.getByTestId('tasklet-praxis-workbench')).toHaveCount(0);
  await expect(page.getByTestId('capsule-context-bar')).toHaveCount(0);
  await expect(page.getByText(/Diagnostics|red flags|systems ready|Search app|catalogued/i)).toHaveCount(0);

  expect(requests.filter((url) => /\/api\/(app|context|created-work|agents|conversations|memos)/.test(url))).toEqual([]);
});
