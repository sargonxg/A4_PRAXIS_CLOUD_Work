import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getCustomPersonaSpec } from '@/lib/boardroom/custom-personas-store';
import { CANONICAL_PERSONAS } from '@/lib/boardroom/personas';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ personaId: string }> };

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { personaId } = await context.params;
    const canonical = CANONICAL_PERSONAS.find((persona) => persona.id === personaId);
    if (canonical) return NextResponse.json({ persona: canonical, source: 'canonical' });

    if (user.isDemo) {
      return NextResponse.json({ error: 'Custom persona not found in demo mode' }, { status: 404 });
    }

    const persona = await getCustomPersonaSpec(user.uid, personaId);
    if (!persona) return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    return NextResponse.json({ persona, source: 'custom' });
  } catch (err) {
    return handleRouteError(err, 'boardroom/personas/get');
  }
});
