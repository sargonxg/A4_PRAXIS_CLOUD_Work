import { expect, test } from '@playwright/test';

test('v7 command shell renders behind the feature flag', async ({ page }) => {
  test.skip(
    process.env.PRAXIS_V7_BACKEND !== 'true' && process.env.NEXT_PUBLIC_PRAXIS_V7 !== 'true',
    'v7 command shell smoke runs only when the v7 flag is enabled',
  );

  await page.addInitScript(() => {
    window.localStorage.setItem('praxis-tour-seen', 'true');
    window.localStorage.setItem('praxis:aco-overlay-dismissed:demo-user-001', new Date().toISOString());
  });
  await page.goto('/login?mode=demo&example=syria-2026');
  await expect(page).toHaveURL(/\/app\/workbench\/syria-2026/);

  await page.goto('/app/dashboard');

  const shell = page.getByTestId('v7-command-shell');
  await expect(shell).toBeVisible();
  await expect(page.getByRole('heading', { name: /Select a workspace, ask PRAXIS/i })).toBeVisible();
  await expect(shell.getByRole('button', { name: /^Ask PRAXIS$/i })).toBeVisible();
  await expect(shell.getByText(/Understand this Situation/i)).toBeVisible();
  await expect(shell.getByText(/Generate handover/i)).toBeVisible();

  await page.goto('/app/home');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('v7-home-surface')).toBeVisible();
  await page.getByRole('button', { name: /New Situation/i }).click();
  await expect(page.getByTestId('v7-new-situation-popover')).toBeVisible();
  await page.getByLabel('Name').fill('Inline Test Situation');
  await page.getByLabel('Suggested ontology').selectOption('governance');
  await page.getByRole('button', { name: /^Create$/i }).click();
  await expect(page.getByTestId('v7-core-drawer')).toHaveAttribute('data-core-kind', 'situation');
  await expect(page.getByTestId('v7-core-drawer').getByRole('heading', { name: /Inline Test Situation/i })).toBeVisible();
  await page.getByLabel("What's happening").fill('A new policy file needs a concise Situation Core.');
  await page.getByLabel('Policy question').fill('What should the analyst verify first?');
  await page.getByRole('button', { name: /Save Case Core/i }).click();
  await expect(page.getByTestId('v7-core-drawer').getByText(/^Saved$/i)).toBeVisible();
  await page.getByLabel('User email or uid').fill('analyst@example.org');
  await page.getByRole('button', { name: /^Share$/i }).click();
  await expect(page.getByText(/Shared with analyst@example.org as viewer/i)).toBeVisible();
  await page.getByLabel('New name').fill('Inline Test Situation fork');
  await page.getByRole('button', { name: /Fork Case Core/i }).click();
  await expect(page.getByRole('heading', { name: /You're working on Inline Test Situation fork/i })).toBeVisible();
  await page.getByTestId('v7-core-drawer').getByRole('button', { name: 'Close Core drawer' }).click();
  await page.getByTestId('v7-core-chip-user').click();
  await expect(page.getByTestId('v7-core-drawer')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Who PRAXIS is answering for/i })).toBeVisible();
  await expect(page.getByText(/Loaded from your saved User Core|Using local defaults/i)).toBeVisible();
  await page.getByTestId('v7-core-drawer').getByRole('button', { name: 'Close Core drawer' }).click();
  await page.getByTestId('v7-core-chip-situation').click();
  await expect(page.getByTestId('v7-core-drawer')).toHaveAttribute('data-core-kind', 'situation');
  await expect(page.getByRole('tab', { name: 'Sources' })).toBeVisible();
  await page.getByTestId('v7-core-drawer').getByRole('button', { name: 'Close Core drawer' }).click();
  await page.getByPlaceholder(/Ask PRAXIS about/i).fill('What should I verify first?');
  await page.getByTestId('v7-home-surface').getByRole('button', { name: /^Ask PRAXIS$/i }).click();
  await expect(page).toHaveURL(/\/app\/ask\/home-/);
  await expect(page.getByText(/Thread home-/i)).toBeVisible();

  await page.goto('/app/ask');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('v7-ask-surface')).toBeVisible();
  await page.getByRole('button', { name: /\+ attach core/i }).click();
  await expect(page.getByTestId('v7-attach-core-picker')).toBeVisible();
  await page.getByTestId('v7-core-chip-user').click();
  await expect(page.getByTestId('v7-core-drawer')).toHaveAttribute('data-core-kind', 'user');
  await page.getByTestId('v7-core-drawer').getByRole('button', { name: 'Close Core drawer' }).click();
  const skillRouter = page.getByTestId('v7-ask-skill-router-panel');
  await expect(skillRouter).toBeVisible();
  await expect(skillRouter.getByText(/Suggested skills for this question/i)).toBeVisible();
  const runtimePanel = page.getByTestId('v7-ask-runtime-panel');
  await expect(runtimePanel).toBeVisible();
  await runtimePanel.getByPlaceholder(/Ask PRAXIS using the attached Context Cores/i).fill('What should I verify first?');
  await runtimePanel.getByRole('button', { name: /Ask PRAXIS/i }).click();
  await expect(runtimePanel.getByText(/Ask turn saved/i)).toBeVisible();
  await expect(runtimePanel.getByText(/Routing:/i)).toBeVisible();
  await expect(runtimePanel.getByText(/Candidate skills:/i)).toBeVisible();
  await expect(runtimePanel.getByText(/Context:/i)).toBeVisible();

  await page.goto('/app/ask?skill=briefing-studio');
  await page.waitForLoadState('networkidle');
  const stagedSkill = page.getByTestId('v7-staged-skill-card');
  await expect(stagedSkill).toBeVisible();
  await expect(stagedSkill.getByText(/Staged Analyst Skill/i)).toBeVisible();
  await expect(page.getByTestId('v7-skill-contract').getByText(/Input PRAXIS will stage/i)).toBeVisible();
  const stagedRuntime = page.getByTestId('v7-ask-runtime-panel');
  await stagedRuntime.getByPlaceholder(/Ask PRAXIS using the attached Context Cores/i).fill('Draft the first briefing outline.');
  await stagedRuntime.getByRole('button', { name: /Ask PRAXIS/i }).click();
  await expect(stagedRuntime.getByText(/Ask turn saved/i)).toBeVisible();
  await expect(stagedRuntime.getByText(/Routing: run skill -> briefing-studio/i)).toBeVisible();

  await page.goto('/app/cores');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('v7-cores-surface')).toBeVisible();
  await expect(page.getByText(/Materialized cores/i)).toBeVisible();
  await expect(page.getByText(/Seven-chapter spine/i)).toBeVisible();
  const sourceDocumentPanel = page.getByTestId('v7-source-document-core-panel');
  await expect(sourceDocumentPanel).toBeVisible();
  await expect(sourceDocumentPanel.getByText('Coverage gaps', { exact: true })).toBeVisible();
  const analystSkillsPanel = page.getByTestId('v7-analyst-skills-panel');
  await expect(analystSkillsPanel).toBeVisible();
  await expect(analystSkillsPanel.getByText('Stage in Ask', { exact: true }).first()).toBeVisible();

  await page.goto('/app/outputs');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('v7-outputs-surface')).toBeVisible();
  await expect(page.getByText(/Provenance before polish/i)).toBeVisible();

  await page.goto('/app/cores/me');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('v7-user-core-editor')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Who PRAXIS is answering for/i })).toBeVisible();
  await page.getByLabel('Role').fill('Senior policy analyst');
  await page.getByRole('button', { name: /Save User Core/i }).click();
  await expect(page.getByText(/Saved/i).first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/home');
  await page.waitForLoadState('networkidle');
  const mobileNav = page.getByTestId('mobile-bottom-nav');
  await expect(mobileNav).toHaveAttribute('data-v7', 'true');
  for (const label of ['Home', 'Ask', 'Cores', 'Outputs']) {
    await expect(mobileNav.getByText(label, { exact: true })).toBeVisible();
  }
});
