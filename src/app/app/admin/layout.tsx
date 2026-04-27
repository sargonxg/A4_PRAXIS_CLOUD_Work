import { notFound } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/admin-session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession();
  if (!admin) notFound();

  return (
    <div data-admin-uid={admin.uid} data-admin-email={admin.email}>
      {children}
    </div>
  );
}
