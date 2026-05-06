import { createHash } from 'node:crypto';
import type { AuthenticatedUser } from '@/lib/api/with-auth';
import { withContextAware } from '@/lib/api/with-context-aware';

export async function withContextHealthGate({
  req,
  user,
  situationId,
  threshold = 60,
}: {
  req: Request;
  user: AuthenticatedUser;
  situationId?: string;
  threshold?: number;
}): Promise<Response | null> {
  await withContextAware({ req, user, situationId, spec: { minHealthScore: threshold, graceful: true } });
  return null;
}

export function hashContextHealthOverride(justification: string): string {
  return createHash('sha256').update(justification.trim(), 'utf8').digest('hex');
}
