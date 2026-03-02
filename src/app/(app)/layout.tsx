import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/mock-auth';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/app/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <AuthProvider user={session}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
