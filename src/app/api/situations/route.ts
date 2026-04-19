import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  createSituationAdmin,
  listSituations,
} from '@/lib/firebase/situations';
import { classifyDomain } from '@/lib/domain/classifier';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { isDomainId } from '@/types/domain';

export const GET = withAuth(async (_req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ situations: [] });
  }
  try {
    const situations = await listSituations(user.uid);
    return NextResponse.json({ situations });
  } catch (err) {
    console.error('[situations] List failed:', err);
    return NextResponse.json({ situations: [] });
  }
});

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json(
      { error: 'Demo users cannot create situations' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, type, description, region, actors, userRole, status, sourceUrls, contextNotes, initialDocumentIds, ontology, domain: clientDomain, domainOverriddenByUser } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Filter out empty URL strings
    const filteredUrls = (sourceUrls as string[] | undefined)?.filter((u: string) => u.trim()) || [];

    // Resolve domain:
    //   1. If the wizard already ran a preview and the user confirmed a domain,
    //      trust the client pick (marked as `domainOverriddenByUser`).
    //   2. Otherwise, classify server-side using profile hint + description.
    //   3. On any failure, fall back to 'generic'.
    let domain = 'generic';
    let domainConfidence = 0;
    let overridden = false;

    if (typeof clientDomain === 'string' && isDomainId(clientDomain)) {
      domain = clientDomain;
      domainConfidence = 1;
      overridden = domainOverriddenByUser === true;
    } else {
      let userPrimaryDomain: string | undefined;
      try {
        const profile = await getAnalystProfile(user.uid);
        userPrimaryDomain = profile?.perspective?.primaryDomain;
      } catch {
        /* ignore */
      }
      const classification = await classifyDomain({
        name,
        description: description ?? '',
        sourceUrls: filteredUrls,
        hints: userPrimaryDomain ? { userPrimaryDomain } : undefined,
      });
      domain = classification.domainId;
      domainConfidence = classification.confidence;
    }

    const situation = await createSituationAdmin(user.uid, {
      name: name.trim(),
      type: type || 'custom',
      description: description?.trim() || '',
      region: region?.trim() || '',
      actors: actors || [],
      userRole: userRole || 'analyst',
      status: status || 'active',
      ...(filteredUrls.length ? { sourceUrls: filteredUrls } : {}),
      ...(contextNotes?.trim() ? { contextNotes: contextNotes.trim() } : {}),
      ...(initialDocumentIds?.length ? { initialDocumentIds } : {}),
      ...(ontology ? { ontology } : {}),
      domain,
      domainConfidence,
      domainOverriddenByUser: overridden,
    });

    // Fire-and-forget: auto-extract Episodes (chronology) so Timeline tab is
    // populated within ~60s of situation creation. Never block the response.
    // Spec §6: auto-extraction pipeline.
    try {
      const origin = new URL(req.url).origin;
      const cookie = req.headers.get('cookie') ?? '';
      const extractUrl = `${origin}/api/ai/extract-episodes`;
      void fetch(extractUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify({ situationId: situation.id }),
      }).catch((err) => {
        console.warn('[situations] extract-episodes fire-and-forget failed:', err);
      });
    } catch (err) {
      console.warn('[situations] extract-episodes dispatch failed:', err);
    }

    return NextResponse.json({ situation });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[situations] Create failed:', message, err);
    return NextResponse.json(
      { error: `Failed to create situation: ${message}` },
      { status: 500 }
    );
  }
});
