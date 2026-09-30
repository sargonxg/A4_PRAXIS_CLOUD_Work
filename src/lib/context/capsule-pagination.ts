import { createHash } from 'node:crypto';

export class CapsulePaginationError extends Error {
  readonly status = 400;
}

export function capsulePageLimit(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 100) throw new CapsulePaginationError('Page limit must be an integer between 1 and 100.');
  return value;
}

function scopeHash(scope: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(scope)).digest('hex');
}

export function encodeCapsuleCursor(scope: unknown[], after: string): string {
  return Buffer.from(JSON.stringify({ version: 1, scope: scopeHash(scope), after }), 'utf8').toString('base64url');
}

export function decodeCapsuleCursor(scope: unknown[], cursor?: string): string | undefined {
  if (!cursor) return undefined;
  try {
    if (cursor.length > 1500 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error();
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (value.version !== 1 || value.scope !== scopeHash(scope) || typeof value.after !== 'string'
      || !value.after || value.after.length > 500 || value.after.includes('/')) throw new Error();
    return value.after;
  } catch { throw new CapsulePaginationError('Invalid cursor for this owner and library filter. Reload the first page.'); }
}
