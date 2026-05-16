import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { AuthProvider } from '@/lib/auth/auth-context';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="app-light min-h-screen bg-[var(--color-app-bg)]">
        <header className="border-b border-[var(--color-app-border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <Link href="/app" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-diplomatic-blue text-white">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold tracking-wide text-navy-900">PRAXIS</span>
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-navy-400">
                    Analyst Profile
                  </span>
                </span>
              </Link>
              <nav className="flex items-center gap-3 text-xs font-medium text-navy-500">
                <Link href="/app" className="hover:text-navy-900">
                  Profile settings
                </Link>
                <Link href="/app" className="hover:text-navy-900">
                  Home
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
