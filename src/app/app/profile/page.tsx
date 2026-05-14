import { redirect } from 'next/navigation';

/**
 * Legacy /app/profile (read-only working profile) is folded into
 * /app/settings/profile so identity, mandate, lenses, and other
 * editable persona fields live in one place. The previous read-only
 * inspector is gone; settings/profile renders the same data with
 * edit affordances.
 */
export default function ProfileIndexPage() {
  redirect('/app/settings/profile');
}
