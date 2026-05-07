import { expect, test } from '@playwright/test';
import { openExampleWorkbench } from '../personas/_shared/persona-fixtures';

test('ontology renders Pack 27 active lenses, validators, coverage, and recommendations', async ({ page }) => {
  await openExampleWorkbench(page, 'syria-2026', 'ontology');

  await expect(page.getByTestId('ontology-schema-viewer')).toBeVisible();
  await expect(page.getByText('Active Ontologies', { exact: true })).toBeVisible();
  await expect(page.getByTestId('ontology-active-lenses')).toBeVisible();
  await expect(page.getByTestId('ontology-validator-pass-rate')).toBeVisible();
  await expect(page.getByTestId('ontology-primitive-coverage')).toBeVisible();
  await expect(page.getByTestId('ontology-recommended-tools')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Add secondary ontology$/i })).toBeVisible();
});
