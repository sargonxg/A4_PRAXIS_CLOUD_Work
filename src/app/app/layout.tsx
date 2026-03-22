import type { Metadata } from 'next';
import { AppShell } from '@/components/app/app-shell';

export const metadata: Metadata = {
  title: {
    template: '%s | PRAXIS by TACITUS',
    default: 'PRAXIS by TACITUS',
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth is now handled client-side by Firebase.
  // The middleware checks for the session cookie to gate access.
  // The AuthProvider in the root layout manages user state.
  return <AppShell>{children}</AppShell>;
}
