import { NextResponse } from 'next/server';

const IDENTITY_REJECTION_CODES = new Set([
  'auth/id-token-revoked', 'auth/id-token-expired', 'auth/invalid-id-token',
  'auth/invalid-user-token', 'auth/user-not-found', 'auth/user-disabled',
  'auth/argument-error', 'auth/invalid-argument',
]);

export function isIdentityRejection(error: unknown): boolean {
  return IDENTITY_REJECTION_CODES.has(error && typeof error === 'object' && 'code' in error ? String(error.code) : '');
}

export function authenticationFailure(error: unknown): NextResponse {
  if (isIdentityRejection(error)) {
    const response = NextResponse.json({
      user: null, authenticated: false,
      error: 'Your session is no longer valid. Sign in again.', code: 'session_invalid',
    }, { status: 401 });
    response.cookies.delete('tacitus-auth-session');
    return response;
  }
  return NextResponse.json({
    error: 'Authentication is temporarily unavailable. Please try again.',
    code: 'authentication_unavailable',
  }, { status: 503 });
}
