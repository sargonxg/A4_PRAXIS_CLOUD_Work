import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { requireAdmin } from '@/lib/auth/admin-gate';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

const AUDITS = {
  'audit:route-consolidation': 'audit:route-consolidation',
  'audit:no-normal-user-archive': 'audit:no-normal-user-archive',
  'audit:admin-only-internals': 'audit:admin-only-internals',
  'audit:next-moves': 'audit:next-moves',
  'audit:capsule-contract': 'audit:capsule-contract',
  'audit:names': 'audit:names',
} as const;

type AuditName = keyof typeof AUDITS;

interface AuditResult {
  name: AuditName;
  ok: boolean;
  exitCode: number;
  output: string;
  durationMs: number;
}

const BodySchema = z.object({
  audits: z.array(z.enum(Object.keys(AUDITS) as [AuditName, ...AuditName[]])).min(1).max(6).default(['audit:next-moves', 'audit:capsule-contract']),
});

export const POST = withAuth(async (request, user) => {
  try {
    const denied = requireAdmin(user);
    if (denied) return denied;
    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid audit request', details: parsed.error.flatten() }, { status: 400 });
    }
    const auditId = `audit-${Date.now().toString(36)}`;
    const results: AuditResult[] = [];
    for (const name of parsed.data.audits) {
      results.push(await runAudit(name));
    }
    await getAdminDbOrThrow()
      .collection('users')
      .doc(user.uid)
      .collection('audit_runs')
      .doc(auditId)
      .set({
        auditId,
        results,
        createdAt: new Date().toISOString(),
        requestedBy: user.uid,
      });
    return NextResponse.json({ auditId, results });
  } catch (err) {
    return handleRouteError(err, 'admin/audits/run');
  }
});

async function runAudit(name: AuditName): Promise<AuditResult> {
  const start = Date.now();
  try {
    const { stdout, stderr } = await execFileAsync('npm.cmd', ['run', AUDITS[name]], {
      cwd: process.cwd(),
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
    });
    return { name, ok: true, exitCode: 0, output: trimOutput(`${stdout}\n${stderr}`), durationMs: Date.now() - start };
  } catch (err) {
    const error = err as { code?: number; stdout?: string; stderr?: string; message?: string };
    return {
      name,
      ok: false,
      exitCode: typeof error.code === 'number' ? error.code : 1,
      output: trimOutput(`${error.stdout ?? ''}\n${error.stderr ?? ''}\n${error.message ?? ''}`),
      durationMs: Date.now() - start,
    };
  }
}

function trimOutput(output: string): string {
  return output.trim().slice(-12_000);
}
