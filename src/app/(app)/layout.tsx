import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/mock-auth';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/app/app-shell';

export const metadata: Metadata = {
  title: {
    template: '%s | PRAXIS by TACITUS',
    default: 'PRAXIS by TACITUS',
  },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <AuthProvider user={session}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
