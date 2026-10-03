import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { HostedCapsuleRegistry } from '@/lib/cognitive-capsule/hosted-registry';
import { RegistryNameSchema, RegistryVersionSchema } from '@/lib/cognitive-capsule/hosted-registry-contract';
import { hostedRegistryError } from '@/lib/cognitive-capsule/hosted-registry-http';

export const dynamic = 'force-dynamic';
export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sign in to inspect private dependency impact.' }, { status: 403 });
    const url = new URL(request.url);
    const name = RegistryNameSchema.parse(url.searchParams.get('name'));
    const version = RegistryVersionSchema.parse(url.searchParams.get('version'));
    return NextResponse.json(await new HostedCapsuleRegistry(user.uid).impact(name, version), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return hostedRegistryError(error); }
});
