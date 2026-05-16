import type { Page } from '@playwright/test';

export async function openExampleWorkbench(page: Page, caseId = 'user-case', tab?: string) {
  const params = new URLSearchParams({ caseId });
  if (tab) params.set('tab', tab);
  await page.goto(`/app?${params.toString()}`);
}

export async function openSeededDemoWorkbench(page: Page, caseId = 'user-case', tab?: string) {
  await openExampleWorkbench(page, caseId, tab);
}

export async function openWorkbenchChapter(page: Page, chapterName: string) {
  const tab = page.getByRole('tab', { name: new RegExp(chapterName, 'i') }).first();
  if (await tab.count()) {
    await tab.click();
    return;
  }
  const link = page.getByRole('link', { name: new RegExp(chapterName, 'i') }).first();
  if (await link.count()) await link.click();
}

export async function expectWorkbenchTab(page: Page, heading: string) {
  await page.getByRole('heading', { name: new RegExp(heading, 'i') }).first().waitFor();
}
