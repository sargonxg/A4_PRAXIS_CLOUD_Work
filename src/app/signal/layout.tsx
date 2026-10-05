import type { Metadata } from 'next';
import { AppShell } from '@/components/app/app-shell';
import { AuthProvider } from '@/lib/auth/auth-context';
import { redirect } from 'next/navigation';
import { withAuth } from '@/lib/api/with-auth';

export const metadata: Metadata = {
  title: 'SIGNAL | PRAXIS by TACITUS',
  robots: { index: false, follow: false },
};

export default async function SignalLayout({ children }: { children: React.ReactNode }) {
  const check = await withAuth(async () => new Response(null, { status: 204 }))(new Request('https://praxis.tacitus.me/api/signal'));
  if (check.status !== 204) redirect('/login?redirect=%2Fsignal');
  return <AuthProvider><AppShell>{children}</AppShell></AuthProvider>;
}
