import { redirect } from 'next/navigation';

/**
 * Legacy /app/situations route. Situations are now created and
 * managed from the Cores page (/app/contexts), which is the canonical
 * Workspace destination for the Situation Core. The standalone
 * /app/situations/new wizard remains live during the v6 transition
 * but should not be reached from the Workspace surface.
 */
export default function SituationsIndexPage() {
  redirect('/app/contexts');
}
