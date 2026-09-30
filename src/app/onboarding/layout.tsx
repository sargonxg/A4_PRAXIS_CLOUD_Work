import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { AuthProvider } from '@/lib/auth/auth-context';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="app-light min-h-screen bg-[var(--color-app-bg)]">
        <header className="border-b border-[var(--color-app-border)] bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <Link href="/app" className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700" aria-label="PRAXIS chat">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-diplomatic-blue text-white">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold tracking-wide text-navy-900">PRAXIS</span>
                </span>
              </Link>
              <nav aria-label="Quick start navigation" className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <Link href="/app" className="inline-flex min-h-11 items-center rounded-lg px-3 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
                  Go to chat
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}
