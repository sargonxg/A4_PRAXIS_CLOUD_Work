import type { Metadata } from 'next';
import { AppShell } from '@/components/app/app-shell';
import { OnboardingBanner } from '@/components/shared/onboarding-banner';
import { AuthProvider } from '@/lib/auth/auth-context';

export const metadata: Metadata = {
  title: {
    template: '%s | PRAXIS by TACITUS',
    default: 'PRAXIS by TACITUS',
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth is now handled client-side by Firebase.
  // The middleware checks for the session cookie to gate access.
  // AuthProvider is scoped here so public routes do not ship Firebase auth.
  return (
    <AuthProvider>
      <AppShell>
        <OnboardingBanner />
        {children}
      </AppShell>
    </AuthProvider>
  );
}
