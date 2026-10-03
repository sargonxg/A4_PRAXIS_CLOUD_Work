import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { HostedCapsuleRegistry } from '@/lib/cognitive-capsule/hosted-registry';
import { HostedRegistryRequestSchema } from '@/lib/cognitive-capsule/hosted-registry-contract';
import { hostedRegistryError, readHostedRegistryBody, registryArtifactResponse } from '@/lib/cognitive-capsule/hosted-registry-http';

export const dynamic = 'force-dynamic';
export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sign in to open your private registry.' }, { status: 403 });
    const url = new URL(request.url);
    const limit = z.coerce.number().int().min(1).max(100).parse(url.searchParams.get('limit') ?? 50);
    const result = await new HostedCapsuleRegistry(user.uid).list({ limit, cursor: url.searchParams.get('cursor') ?? undefined });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return hostedRegistryError(error); }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sign in to save private registry versions.' }, { status: 403 });
    const input = HostedRegistryRequestSchema.parse(await readHostedRegistryBody(request));
    const registry = new HostedCapsuleRegistry(user.uid);
    if (input.operation === 'fork') {
      const result = await registry.fork(input.name, input.version, input.newName);
      return registryArtifactResponse(result.bytes, result.name, result.version, result.digest);
    }
    const result = input.operation === 'publish' ? await registry.publish(input)
      : input.operation === 'install' ? await registry.install(input.name, input.version)
      : input.operation === 'update' ? await registry.update(input.name, input.version, input.expectedDigest)
      : await registry.deprecate(input.name, input.version, input.reason);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return hostedRegistryError(error); }
});
