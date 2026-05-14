import { redirect } from 'next/navigation';

/**
 * Legacy /app/cases route. The case library has been folded into the
 * workbench so the everyday surface stays Apple-simple. Server
 * redirect preserves bookmarked URLs.
 */
export default function CasesIndexPage() {
  redirect('/app/workbench');
}
