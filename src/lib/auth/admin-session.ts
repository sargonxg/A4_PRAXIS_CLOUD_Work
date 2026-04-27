import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/auth/cookie-signer';
import { verifyIdToken } from '@/lib/firebase/admin';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';

export async function getAdminSession(): Promise<{
  uid: string;
  email: string;
  name: string;
} | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tacitus-auth-session');
  if (!sessionCookie?.value) return null;

  const verified = verifyCookie(sessionCookie.value);
  if (!verified) return null;

  try {
    const sessionData = JSON.parse(verified) as { demo?: boolean; token?: string };
    if (sessionData.demo === true || !sessionData.token) return null;

    const user = await verifyIdToken(sessionData.token);
    if (!isAdminPrincipal(user)) return null;

    return {
      uid: user.uid,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}
