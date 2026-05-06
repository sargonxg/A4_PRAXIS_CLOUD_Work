import type { CaseModule, LandingCaseCard } from '@/types/case-module';
import { syria2026CaseModule } from '@/lib/cases/syria-2026';
import { nordalia2026CaseModule } from '@/lib/cases/nordalia-2026';

export const EXAMPLE_CASE_MODULES: CaseModule[] = [
  syria2026CaseModule,
  nordalia2026CaseModule,
];

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
