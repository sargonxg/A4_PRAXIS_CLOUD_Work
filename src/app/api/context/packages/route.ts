import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  activateContextPackage,
  createContextPackage,
  listContextPackages,
} from '@/lib/knowledge/context-engine';

const CoreRefsSchema = z.object({
  userCoreId: z.string().optional(),
  teamCoreId: z.string().optional(),
  situationCoreId: z.string().min(1),
  sourceCoreIds: z.array(z.string()).optional(),
  documentCoreIds: z.array(z.string()).optional(),
  graphCoreId: z.string().optional(),
  outputCoreIds: z.array(z.string()).optional(),
});

const RetrievalPolicySchema = z.object({
  layers: z.array(z.enum(['argus', 'sources', 'documents', 'graph', 'tool-output'])).optional(),
  limit: z.number().int().positive().max(50).optional(),
  checkFreshness: z.boolean().optional(),
  freshnessWindowDays: z.number().int().positive().max(3650).optional(),
}).optional();

const CreateSchema = z.object({
  label: z.string().min(1).max(160).optional(),
  ownerScope: z.enum(['user', 'team', 'situation']).optional(),
  coreRefs: CoreRefsSchema,
  retrievalPolicy: RetrievalPolicySchema,
  active: z.boolean().optional(),
});

const SwitchSchema = z.object({
  contextPackageId: z.string().min(1),
  active: z.literal(true),
});

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ packages: [] });
    const url = new URL(request.url);
    const situationId = url.searchParams.get('situationId') || undefined;
    const packages = await listContextPackages(user.uid, situationId);
    return NextResponse.json({ packages });
  } catch (err) {
    return handleRouteError(err, 'context/packages');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Demo mode cannot create private context packages' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));
    const switchParsed = SwitchSchema.safeParse(raw);
    if (switchParsed.success) {
      const pack = await activateContextPackage(user.uid, switchParsed.data.contextPackageId);
      if (!pack) return NextResponse.json({ error: 'Context package not found' }, { status: 404 });
      return NextResponse.json({ package: pack });
    }

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const pack = await createContextPackage(user.uid, {
      label: parsed.data.label,
      ownerScope: parsed.data.ownerScope,
      coreRefs: {
        ...parsed.data.coreRefs,
        sourceCoreIds: parsed.data.coreRefs.sourceCoreIds ?? [],
        documentCoreIds: parsed.data.coreRefs.documentCoreIds ?? [],
        outputCoreIds: parsed.data.coreRefs.outputCoreIds ?? [],
      },
      retrievalPolicy: parsed.data.retrievalPolicy,
      active: parsed.data.active,
    });
    return NextResponse.json({ package: pack }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/packages');
  }
});
