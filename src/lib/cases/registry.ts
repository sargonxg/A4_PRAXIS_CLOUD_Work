import type { CaseModule, LandingCaseCard } from '@/types/case-module';

/**
 * Example-case registry.
 *
 * The demo case modules (Syria 2026, Nordalia 2026, v5 demo contexts) were
 * removed during MVP cleanup. The registry now returns an empty list; landing
 * cards fall back to the "coming soon" placeholders in landing-cards.ts.
 *
 * To add a real case module, push it onto EXAMPLE_CASE_MODULES below.
 */

export const EXAMPLE_CASE_MODULES: CaseModule[] = [];

export function listExampleCases(): CaseModule[] {
  return EXAMPLE_CASE_MODULES;
}

export function getCaseModule(id: string): CaseModule | null {
  return EXAMPLE_CASE_MODULES.find((caseModule) => caseModule.id === id) ?? null;
}

export function listLandingCaseCards(): LandingCaseCard[] {
  return listExampleCases().map((caseModule) => ({
    id: caseModule.id,
    title: caseModule.manifest.name,
    region: caseModule.manifest.region,
    summary: caseModule.manifest.summary,
    risk: caseModule.manifest.risk,
    glaslStage: caseModule.manifest.glaslStage,
    tags: caseModule.manifest.tags,
  }));
}
