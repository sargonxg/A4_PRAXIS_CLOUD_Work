import { expect, type Page } from '@playwright/test';

export async function openExampleWorkbench(page: Page, caseId: string, tab = 'chapters') {
  await page.addInitScript(() => {
    window.localStorage.setItem('praxis-tour-seen', 'true');
  });
  await page.goto(`/login?mode=demo&example=${caseId}`);
  await page.waitForURL(new RegExp(`/app/workbench/${caseId}\\?tab=chapters`), { timeout: 30_000 });
  const exploreFreely = page.getByRole('button', { name: /Explore Freely/i });
  if (await exploreFreely.isVisible().catch(() => false)) {
    await exploreFreely.click();
  }
  await expect(page.getByText('Example case')).toBeVisible();
  await expect(page.getByText('Context health').first()).toBeVisible();

  if (tab !== 'chapters') {
    await page.goto(`/app/workbench/${caseId}?tab=${tab}`);
    await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
  }
}

export async function expectWorkbenchTab(page: Page, heading: string) {
  await expect(page.locator('h2').filter({ hasText: new RegExp(`^${heading}$`, 'i') })).toBeVisible();
  await expect(page.getByText('Risk').first()).toBeVisible();
  await expect(page.getByText('Graph nodes').first()).toBeVisible();
}
