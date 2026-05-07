import { expect, test } from '@playwright/test';

test('custom persona authoring saves a sandboxed persona draft in demo mode', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('praxis-tour-seen', 'true');
  });
  await page.request.post('/api/auth/session', { data: { demo: true } });
  await page.goto('/app/settings/personas');
  const exploreFreely = page.getByRole('button', { name: /Explore Freely/i });
  if (await exploreFreely.isVisible().catch(() => false)) {
    await exploreFreely.click();
  }

  await expect(page.getByRole('heading', { name: /Custom personas/i })).toBeVisible();
  await expect(page.getByText(/Corpus manifest/i)).toBeVisible();
  await expect(page.getByText(/Test deliberation/i)).toBeVisible();

  await page.getByRole('button', { name: /Save persona/i }).click();
  await expect(page.getByText(/Previewed Custom Regional Adviser|Saved Custom Regional Adviser/i)).toBeVisible();

  const apiResponse = await page.request.post('/api/boardroom/personas', {
    data: {
      displayName: 'Custom Sudan Adviser',
      shortRole: 'Sudan Adviser',
      professionalProfile: 'A workspace-authored regional adviser with field experience, local language context, and a narrow mandate to challenge assumptions using the uploaded corpus.',
      domains: ['Sudan mediation'],
      frameworks: ['elite bargain mapping'],
      signatureQuestions: ['Who can veto implementation?', 'What evidence would change the recommendation?'],
      blindSpots: ['May overweight elite bargaining signals.'],
      toolIds: ['cross.red-team'],
      corpusEntries: [{ title: 'Field note', citation: 'Workspace field note', license: 'workspace-restricted' }],
      voiceRegister: 'professional',
    },
  });
  expect(apiResponse.status()).toBe(201);
  const body = await apiResponse.json();
  expect(body.persona.id).toBe('custom:custom-sudan-adviser');
  expect(body.persona.tools.proficientToolIds).toContain('cross.red-team');
});
