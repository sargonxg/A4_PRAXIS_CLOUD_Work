import { NextRequest, NextResponse } from 'next/server';
import { CASE_REGISTRY, type RegisteredCase } from '@/lib/constants/case-registry';
import { DEMO_CASES, getCaseById, type DemoCase } from '@/lib/constants/demo-cases';
import { DEMO_CONFLICT } from '@/lib/constants/demo-conflict';

// ============================================================================
// GET /api/data/conflicts
//   — Returns the full list of demo cases (for case library / scenario picker)
//
// GET /api/data/conflicts?id=<conflictId>
//   — Returns a specific conflict's full data:
//       • meta  (DemoCase)
//       • ontology (CaseOntology) when the case exists in CASE_REGISTRY
//       • raw demo-conflict data when id matches the Nordalia demo
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // ------------------------------------------------------------------
    // Single conflict lookup
    // ------------------------------------------------------------------
    if (id) {
      // Normalize "nordalia" → "nordalia-crisis" for registry lookup
      const registryId = id === 'nordalia' ? 'nordalia-crisis' : id;

      // Check CASE_REGISTRY first (contains full ontology)
      const registered: RegisteredCase | undefined = CASE_REGISTRY[registryId];
      if (registered) {
        return NextResponse.json({
          meta: registered.meta,
          ontology: registered.ontology,
          archetype: registered.archetype,
          suitableFor: registered.suitableFor,
          // Include raw demo-conflict data for Nordalia (used by dashboard)
          ...(registryId === 'nordalia-crisis' ? { demoConflict: DEMO_CONFLICT } : {}),
        });
      }

      // Fall back to DEMO_CASES (no ontology, summary only)
      const demoCase: DemoCase | undefined = getCaseById(id);
      if (demoCase) {
        return NextResponse.json({ meta: demoCase });
      }

      return NextResponse.json({ error: 'Conflict not found' }, { status: 404 });
    }

    // ------------------------------------------------------------------
    // List all conflicts
    // ------------------------------------------------------------------
    const list = DEMO_CASES.map((c) => ({
      ...c,
      // Mark whether a full ontology exists
      hasOntology: !!(CASE_REGISTRY[c.id] || CASE_REGISTRY[c.id === 'nordalia' ? 'nordalia-crisis' : c.id]),
    }));

    return NextResponse.json(list);
  } catch (error) {
    console.error('[api/data/conflicts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
