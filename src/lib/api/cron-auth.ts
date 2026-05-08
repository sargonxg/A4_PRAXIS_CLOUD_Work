import { NextResponse } from 'next/server';

export function getCronSecretFromRequest(request: Request): string {
  return request.headers.get('x-cron-secret')
    ?? request.headers.get('authorization')?.replace(/^bearer\s+/i, '')
    ?? '';
}

export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? '';
  return Boolean(secret) && getCronSecretFromRequest(request) === secret;
}

export function requireCronSecret(request: Request, status = 401): NextResponse | null {
  if (isCronAuthorized(request)) return null;
  return NextResponse.json({ error: status === 403 ? 'forbidden' : 'unauthorized' }, { status });
}
