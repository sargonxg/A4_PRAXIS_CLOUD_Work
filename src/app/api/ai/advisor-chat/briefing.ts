import { searchWeb, formatResultsAsContext } from '@/lib/ai/grounded-research';
import type { AdvisorConfig } from '@/types/advisor';
import type { Situation } from '@/types/situation';

/**
 * Runs a small burst of source-category-weighted web searches for the active
 * situation and returns a single `<advisor-briefing>` XML block ready to
 * prepend to the advisor's system prompt. Returns an empty string when the
 * user has no active situation or when every query fails.
 */
export async function buildAdvisorBriefing(
  cfg: AdvisorConfig,
  situation: Situation | null,
): Promise<string> {
  if (!situation) return '';

  const year = new Date().getFullYear();
  const queries = cfg.sourceCategories
    .slice(0, 2)
    .map((cat) => `${situation.name} ${situation.region ?? ''} ${cat.replace(/-/g, ' ')} ${year}`);

  const settled = await Promise.allSettled(queries.map((q) => searchWeb(q, { numResults: 3 })));
  const results = settled
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof searchWeb>>> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  if (results.length === 0) return '';

  return `\n<advisor-briefing advisor="${cfg.id}" generated="${new Date().toISOString()}">\n${formatResultsAsContext(
    results.slice(0, 6),
  )}\n</advisor-briefing>`;
}
