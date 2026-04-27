import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/admin-session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession();
  if (!admin) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Administrator</p>
        <h1 className="mt-2 text-xl font-semibold">Admin session required</h1>
        <p className="mt-2 text-sm leading-relaxed">
          Sign in with a verified admin account to open the PRAXIS control panel. Giulio admin access
          is allowed by verified email as well as uid allowlist.
        </p>
        <Link
          href="/login?redirect=/app/admin"
          className="mt-4 inline-flex rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800"
        >
          Sign in again
        </Link>
      </div>
    );
  }

  return (
    <div data-admin-uid={admin.uid} data-admin-email={admin.email}>
      {children}
    </div>
  );
}
