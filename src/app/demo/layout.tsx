import type { Metadata } from 'next';
import { AppShell } from '@/components/app/app-shell';
import { AuthProvider } from '@/lib/auth/auth-context';

export const metadata: Metadata = {
  title: {
    template: '%s — PRAXIS Demo',
    default: 'PRAXIS Demo',
  },
  robots: 'noindex, nofollow',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  // Demo uses the same AppShell — it already handles demo mode via auth context.
  // The middleware ensures only demo-cookie users reach /demo/* routes.
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
