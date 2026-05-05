/**
 * Case template barrel — central resolver that maps a case id (from `?case=`)
 * to its seed data. All non-Syria templates live here in unified shape so
 * tools can swap context with one helper.
 */

import { getDemoTemplate } from '@/lib/constants/demo-templates';
import { PAKISTAN_CASE_DATA, PAKISTAN_TEMPLATE_ID } from './pakistan-political-risk';
import { US_HOUSING_CASE_DATA, US_HOUSING_TEMPLATE_ID } from './us-housing';
import type { CaseTemplateData } from './case-types';

export type { CaseTemplateData } from './case-types';
export {
  PAKISTAN_CASE_DATA,
  PAKISTAN_TEMPLATE_ID,
} from './pakistan-political-risk';
export {
  US_HOUSING_CASE_DATA,
  US_HOUSING_TEMPLATE_ID,
} from './us-housing';

const TEMPLATE_BY_ID: Record<string, CaseTemplateData> = {
  [PAKISTAN_TEMPLATE_ID]: PAKISTAN_CASE_DATA,
  [US_HOUSING_TEMPLATE_ID]: US_HOUSING_CASE_DATA,
};

/** Resolve case template data by id or alias. Returns null for Syria (which has its own seed) and unknown ids. */
export function resolveCaseTemplate(idOrAlias: string | null | undefined): CaseTemplateData | null {
  if (!idOrAlias) return null;
  const tpl = getDemoTemplate(idOrAlias);
  if (!tpl) return null;
  return TEMPLATE_BY_ID[tpl.id] ?? null;
}

/** True if the case param resolves to a non-Syria template that lives in this folder. */
export function isGenericCaseTemplate(idOrAlias: string | null | undefined): boolean {
  return resolveCaseTemplate(idOrAlias) != null;
}
