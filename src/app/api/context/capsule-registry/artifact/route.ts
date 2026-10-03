import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { HostedCapsuleRegistry } from '@/lib/cognitive-capsule/hosted-registry';
import { RegistryNameSchema, RegistryVersionSchema } from '@/lib/cognitive-capsule/hosted-registry-contract';
import { hostedRegistryError, registryArtifactResponse } from '@/lib/cognitive-capsule/hosted-registry-http';

export const dynamic = 'force-dynamic';
export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sign in to download private registry versions.' }, { status: 403 });
    const url = new URL(request.url);
    const name = RegistryNameSchema.parse(url.searchParams.get('name'));
    const version = RegistryVersionSchema.parse(url.searchParams.get('version'));
    const result = await new HostedCapsuleRegistry(user.uid).pull(name, version);
    return registryArtifactResponse(result.bytes, name, version, result.entry.digest);
  } catch (error) { return hostedRegistryError(error); }
});
