import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    // Demo extraction results
    const entities = [
      {
        primitiveType: 'Actor',
        data: {
          id: `actor-${documentId}-1`,
          name: 'Government of Nordalia',
          type: 'state',
          description: 'The recognized government led by President Amara Osei',
        },
      },
      {
        primitiveType: 'Actor',
        data: {
          id: `actor-${documentId}-2`,
          name: 'Democratic Reform Movement',
          type: 'armed_group',
          description: 'Armed opposition movement led by Commander Kwame Asante',
        },
      },
      {
        primitiveType: 'Event',
        data: {
          id: `event-${documentId}-1`,
          description: 'Framework Agreement on power-sharing signed',
          type: 'diplomatic',
          date: '2026-01-15',
          impact: 'transformative',
          involvedActors: ['Government of Nordalia', 'Democratic Reform Movement'],
        },
      },
      {
        primitiveType: 'Commitment',
        data: {
          id: `commitment-${documentId}-1`,
          type: 'agreement',
          parties: ['Government of Nordalia', 'Democratic Reform Movement'],
          description: 'Framework Agreement on transitional power-sharing arrangements',
          dateEstablished: '2026-01-15',
          status: 'active',
          legalForce: 'non_binding',
        },
      },
      {
        primitiveType: 'Claim',
        data: {
          id: `claim-${documentId}-1`,
          actorId: 'drm',
          text: 'New elections under international supervision are necessary for legitimate governance',
          type: 'demand',
          status: 'modified',
        },
      },
      {
        primitiveType: 'Interest',
        data: {
          id: `interest-${documentId}-1`,
          actorId: 'gov-nordalia',
          description: 'Maintaining international recognition and control of state institutions',
          type: 'political',
          priority: 'vital',
          isExplicit: false,
        },
      },
      {
        primitiveType: 'Constraint',
        data: {
          id: `constraint-${documentId}-1`,
          description: 'The 18-month timeline for elections creates pressure on both parties to reach agreement on transitional arrangements',
          type: 'temporal',
          affectedActors: ['Government of Nordalia', 'Democratic Reform Movement'],
          severity: 'significant',
        },
      },
      {
        primitiveType: 'Narrative',
        data: {
          id: `narrative-${documentId}-1`,
          actorId: 'drm',
          framingText: 'The June 2025 elections were fundamentally fraudulent and their results cannot serve as a basis for legitimate governance',
          type: 'delegitimizing',
          targetAudience: 'international',
          prevalence: 'dominant',
        },
      },
    ];

    return NextResponse.json({
      documentId,
      entityCount: entities.length,
      entities,
      processingTime: '3.2s',
    });
  } catch {
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
