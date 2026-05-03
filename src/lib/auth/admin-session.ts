import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/auth/cookie-signer';
import { verifyIdToken } from '@/lib/firebase/admin';
import { getAdminPrincipalAccess, isAdminPrincipal } from '@/lib/auth/admin-gate';

interface SessionUserSnapshot {
  uid?: unknown;
  email?: unknown;
  name?: unknown;
  emailVerified?: unknown;
}

interface AuthSessionPayload {
  demo?: boolean;
  token?: string;
  user?: SessionUserSnapshot;
}

export async function getAdminSession(): Promise<{
  uid: string;
  email: string;
  name: string;
  accessReason: string;
} | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tacitus-auth-session');
  if (!sessionCookie?.value) return null;

  const verified = verifyCookie(sessionCookie.value);
  if (!verified) return null;

  try {
    const sessionData = JSON.parse(verified) as AuthSessionPayload;
    if (sessionData.demo === true || !sessionData.token) return null;

    try {
      const user = await verifyIdToken(sessionData.token);
      const access = getAdminPrincipalAccess(user);
      if (!access.admin) return null;

      return {
        uid: user.uid,
        email: user.email,
        name: user.name,
        accessReason: access.reason,
      };
    } catch {
      const snapshot = sessionData.user;
      if (!snapshot || typeof snapshot.uid !== 'string' || typeof snapshot.email !== 'string') {
        return null;
      }

      const user = {
        uid: snapshot.uid,
        email: snapshot.email,
        name: typeof snapshot.name === 'string' && snapshot.name.length > 0
          ? snapshot.name
          : snapshot.email.split('@')[0] || 'User',
        emailVerified: snapshot.emailVerified === true,
      };

      if (!isAdminPrincipal(user)) return null;

      return {
        uid: user.uid,
        email: user.email,
        name: user.name,
        accessReason: getAdminPrincipalAccess(user).reason,
      };
    }
  } catch {
    return null;
  }
}
