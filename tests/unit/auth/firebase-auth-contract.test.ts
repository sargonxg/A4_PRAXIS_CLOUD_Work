import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const authContext = readFileSync(join(root, 'src/lib/auth/auth-context.tsx'), 'utf8');
const firebaseConfig = readFileSync(join(root, 'src/lib/firebase/config.ts'), 'utf8');

describe('Firebase auth web contract', () => {
  it('keeps production authDomain on the Firebase helper domain unless reserved auth routes are proxied', () => {
    expect(firebaseConfig).toContain("authDomain: 'praxisbytacitus.firebaseapp.com'");
    expect(firebaseConfig).toContain('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    expect(firebaseConfig).not.toContain("authDomain: 'praxis.tacitus.me'");
  });

  it('uses popup-first Google sign-in with redirect fallback and explicit browser persistence', () => {
    expect(authContext).toContain('signInWithPopup');
    expect(authContext).toContain('signInWithRedirect');
    expect(authContext).toContain('setPersistence(auth, browserLocalPersistence)');
    expect(authContext).toContain('await signInWithPopup(auth, provider)');
    expect(authContext).toContain('await signInWithRedirect(auth, provider)');
    expect(authContext).toContain('isPopupFallbackError(code)');
  });

  it('syncs redirect results into the PRAXIS session cookie and reports deploy-domain setup errors clearly', () => {
    expect(authContext).toContain('const redirectResult = await getRedirectResult(auth)');
    expect(authContext).toContain('await syncTokenCookie(redirectResult.user)');
    expect(authContext).toContain('praxis.tacitus.me');
    expect(authContext).toContain('https://praxisbytacitus.firebaseapp.com/__/auth/handler');
    expect(authContext).toContain('auth/operation-not-allowed');
    expect(authContext).toContain('auth/popup-blocked');
  });
});
