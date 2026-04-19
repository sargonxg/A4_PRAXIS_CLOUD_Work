import type { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-navy-50/30 to-gold-50/20">
      <header className="border-b border-navy-100 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gold-500" />
            <h1 className="text-sm font-semibold tracking-wide text-navy-900">PRAXIS · Analyst Profile</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
