/**
 * GET / POST /api/intelligence/dev-backlog
 *
 * GET — admin-only query of the developer backlog. Filter by kind,
 *       severity, status, toolId, situationId, sinceDays, limit.
 *       Used by code agents (Claude / Codex) to plan their next lane.
 *
 * POST — server-side / agent-submitted publish. Demo and unauth callers
 *        cannot publish (the backlog is internal, not user-facing).
 *
 * Spec: docs/IMPROVEMENT_15_2026-04-26.md round-4 brick.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { publishBacklogEntry, queryBacklog } from '@/lib/dev-backlog/service';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';

const QuerySchema = z.object({
  kind: z
    .enum([
      'error.route',
      'error.calibration',
      'perf.slow-tool',
      'corpus.empty',
      'ux.friction',
      'idea.agent',
      'idea.user',
      'data.gap',
    ])
    .optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  status: z
    .enum(['open', 'investigating', 'queued', 'in-progress', 'resolved', 'wontfix', 'duplicate'])
    .optional(),
  toolId: z.string().max(120).optional(),
  situationId: z.string().max(200).optional(),
  sinceDays: z.coerce.number().int().positive().max(365).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

const PublishSchema = z.object({
  kind: z.enum([
    'error.route',
    'error.calibration',
    'perf.slow-tool',
    'corpus.empty',
    'ux.friction',
    'idea.agent',
    'idea.user',
    'data.gap',
  ]),
  source: z.enum(['auto', 'agent', 'user']).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  message: z.string().min(3).max(600),
  detail: z.string().max(4000).optional(),
  toolId: z.string().max(120).optional(),
  situationId: z.string().max(200).optional(),
  uid: z.string().max(200).optional(),
  route: z.string().max(200).optional(),
  httpStatus: z.number().int().min(100).max(599).optional(),
  suggestedFix: z.string().max(1500).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    if (!isAdminPrincipal(user)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 });
    }
    const result = await queryBacklog(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err, 'intelligence/dev-backlog/get');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (!isAdminPrincipal(user)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));
    const parsed = PublishSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const id = await publishBacklogEntry(parsed.data);
    return NextResponse.json({ id });
  } catch (err) {
    return handleRouteError(err, 'intelligence/dev-backlog/post');
  }
});
