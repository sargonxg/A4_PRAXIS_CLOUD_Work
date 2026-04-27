'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  disabled: boolean;
  emailVerified: boolean;
  providerIds: string[];
  createdAt: string;
  lastSignInAt: string | null;
  profile: {
    credits: number | null;
    subscription: string | null;
    totalCreditsUsed: number | null;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users?limit=100', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-diplomatic-blue">Administrator</p>
          <h1 className="mt-1 text-2xl font-semibold text-navy-900">Users</h1>
          <p className="mt-1 text-sm text-navy-500">
            Firebase Auth users with profile, provider, and credit summary. User data remains owner-scoped.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 disabled:opacity-60"
        >
          <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
          Refresh
        </button>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load users: {error}. Confirm your account is in the admin allowlist.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-navy-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-xs uppercase tracking-wider text-navy-500">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">User</th>
              <th className="px-3 py-2 text-left font-semibold">Providers</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Plan</th>
              <th className="px-3 py-2 text-right font-semibold">Credits</th>
              <th className="px-3 py-2 text-left font-semibold">Last sign-in</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-navy-400">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-navy-400">No users returned.</td></tr>
            ) : users.map((u) => (
              <tr key={u.uid} className="border-t border-navy-100">
                <td className="px-3 py-2">
                  <div className="font-medium text-navy-900">{u.displayName || u.email || 'Unnamed user'}</div>
                  <div className="font-mono text-[10px] text-navy-400">{u.uid}</div>
                  {u.email ? <div className="text-xs text-navy-500">{u.email}</div> : null}
                </td>
                <td className="px-3 py-2 text-xs text-navy-600">{u.providerIds.join(', ') || '-'}</td>
                <td className="px-3 py-2 text-xs">
                  <span className={u.disabled ? 'text-red-700' : 'text-emerald-700'}>
                    {u.disabled ? 'disabled' : 'active'}
                  </span>
                  <span className="ml-2 text-navy-400">{u.emailVerified ? 'verified' : 'unverified'}</span>
                </td>
                <td className="px-3 py-2 text-xs text-navy-600">{u.profile?.subscription ?? 'no profile'}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-navy-700">{u.profile?.credits ?? '-'}</td>
                <td className="px-3 py-2 text-xs text-navy-500">{u.lastSignInAt ?? 'never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
