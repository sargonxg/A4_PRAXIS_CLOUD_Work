import { expect, test } from '@playwright/test';

test.describe('Capsule Studio', () => {
  test('create from a sentence, inspect graph, propose an edit, and approve it', async ({ page }) => {
    test.skip(!process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD, 'requires disposable Firebase credentials');

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_FIREBASE_EMAIL!);
    await page.getByRole('button', { name: /continue|sign in|log in/i }).click();

    await page.goto('/app');
    await page.getByRole('button', { name: /create from a question/i }).click();
    await page.getByLabel(/question|policy work/i).fill('Build a capsule for reviewing AI procurement sourceability.');
    await page.getByRole('button', { name: /create capsule/i }).click();

    await expect(page.getByTestId('capsule-workbench-panel')).toBeVisible();
    await expect(page.getByTestId('capsule-knowledge-graph')).toBeVisible();
    await page.getByTestId('capsule-studio-graph-search').fill('sourceability');
    await expect(page.getByTestId('capsule-graph-detail-panel')).toBeVisible();

    await page.getByRole('button', { name: /propose node/i }).click();
    await page.getByLabel(/node label/i).fill('Procurement authority');
    await page.getByRole('button', { name: /save proposal/i }).click();
    await expect(page.getByText(/Proposed changes/i)).toBeVisible();

    await page.getByRole('button', { name: /approve/i }).first().click();
    await expect(page.getByText(/Version/i)).toBeVisible();
  });
});
