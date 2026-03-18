import { DEMO_CONFLICT } from '@/lib/constants/demo-conflict';
import { getConflict, createConflictWithId, updateConflict } from '@/lib/services/conflict-service';
import type { ConflictGraph } from '@/lib/ai/schemas/conflict-grammar';

// Track initialization to avoid repeated work
let initialized = false;

/**
 * Ensures the Nordalia Crisis demo data is loaded into the conflict service.
 * Maps all DEMO_CONFLICT data (actors, events, relationships, claims, interests,
 * constraints, leverage, commitments, narratives) into the ConflictGraph schema.
 *
 * This is idempotent — calling it multiple times is safe.
 */
export function ensureNordaliaData(conflictId: string = 'nordalia-crisis'): void {
  if (initialized && getConflict(conflictId)) return;

  const existing = getConflict(conflictId);
  if (existing) {
    initialized = true;
    return;
  }

  // Create the conflict with a well-known ID
  const created = createConflictWithId(conflictId, DEMO_CONFLICT.name, DEMO_CONFLICT.description, DEMO_CONFLICT.region);

  // Build the full graph data mapped to conflict-grammar schema
  const graphData: Partial<Omit<ConflictGraph, 'id'>> = {
    name: DEMO_CONFLICT.name,
    description: DEMO_CONFLICT.description,
    region: DEMO_CONFLICT.region,
    status: DEMO_CONFLICT.status,
    lastUpdated: DEMO_CONFLICT.lastUpdated,

    // ── Actors ──────────────────────────────────────────────────
    actors: DEMO_CONFLICT.actors.map((a) => ({
      type: 'actor' as const,
      id: a.id,
      name: a.name,
      actorType: mapActorType(a.type),
      description: a.description,
      // Map relationships from the demo relationships array
      relationships: DEMO_CONFLICT.relationships
        .filter((r) => r.source === a.id)
        .map((r) => ({
          targetActorId: r.target,
          type: r.type as 'ally' | 'adversary' | 'neutral' | 'mediator' | 'patron' | 'proxy' | 'competitor' | 'dependent',
          description: r.label,
        })),
    })),

    // ── Claims ──────────────────────────────────────────────────
    claims: DEMO_CONFLICT.claims.map((c) => ({
      type: 'claim' as const,
      id: c.id,
      actorId: c.actorId,
      claimType: mapClaimType(c.claimType),
      title: c.title,
      description: c.description,
      basis: c.basis,
      status: mapClaimStatus(c.status),
      legitimacyScore: c.legitimacyScore,
      internationalRecognition: mapRecognition(c.internationalRecognition),
      competingClaimIds: c.competingClaimIds,
    })),

    // ── Interests ───────────────────────────────────────────────
    interests: DEMO_CONFLICT.interests.map((int) => ({
      type: 'interest' as const,
      id: int.id,
      actorId: int.actorId,
      interestType: mapInterestType(int.type),
      title: getInterestTitle(int),
      description: int.description,
      priority: mapPriority(int.priority),
      visibility: int.isExplicit ? 'stated' as const : 'unstated' as const,
    })),

    // ── Constraints ─────────────────────────────────────────────
    constraints: DEMO_CONFLICT.constraints.map((con) => ({
      type: 'constraint' as const,
      id: con.id,
      actorId: con.affectedActors[0] ?? 'unknown',
      constraintType: mapConstraintType(con.type),
      title: getConstraintTitle(con),
      description: con.description,
      severity: mapSeverity(con.severity),
      source: 'Nordalia Crisis context',
    })),

    // ── Leverage ────────────────────────────────────────────────
    leverage: DEMO_CONFLICT.leverage.map((lev) => ({
      type: 'leverage' as const,
      id: lev.id,
      actorId: lev.holderId,
      targetActorId: lev.targetId,
      leverageType: mapLeverageType(lev.type),
      title: getLeverageTitle(lev),
      description: lev.description,
      effectiveness: mapEffectiveness(lev.effectiveness),
      sustainability: 'medium_term' as const,
      isActive: true,
    })),

    // ── Commitments ─────────────────────────────────────────────
    commitments: DEMO_CONFLICT.commitments.map((com) => ({
      type: 'commitment' as const,
      id: com.id,
      actorId: com.parties[0] ?? 'unknown',
      commitmentType: mapCommitmentType(com.type),
      title: getCommitmentTitle(com),
      description: com.description,
      status: mapCommitmentStatus(com.status),
      counterpartyIds: com.parties.slice(1),
      dateCommitted: com.dateEstablished,
    })),

    // ── Events ──────────────────────────────────────────────────
    events: DEMO_CONFLICT.events.map((evt) => ({
      type: 'event' as const,
      id: evt.id,
      title: getEventTitle(evt),
      description: evt.description,
      eventType: mapEventType(evt.type),
      date: evt.date,
      actorIds: evt.involvedActors,
      impact: mapImpact(evt.impact),
      escalatoryDirection: evt.escalatoryDirection as 'escalatory' | 'de_escalatory' | 'neutral' | 'ambiguous',
    })),

    // ── Narratives ──────────────────────────────────────────────
    narratives: DEMO_CONFLICT.narratives.map((nar) => ({
      type: 'narrative' as const,
      id: nar.id,
      actorId: nar.actorId,
      title: nar.title,
      description: nar.description,
      narrativeType: mapNarrativeType(nar.type),
      keyMessages: nar.keyMessages,
      targetAudience: mapTargetAudience(nar.targetAudience),
      effectiveness: nar.effectiveness,
      reach: nar.reach as 'local' | 'national' | 'regional' | 'global' | undefined,
    })),
  };

  // Populate the conflict with all demo data
  updateConflict(created.id, graphData);

  initialized = true;
}

// ── Mapping helpers ─────────────────────────────────────────────────

function mapActorType(t: string): 'state' | 'non_state_armed_group' | 'international_organization' | 'regional_organization' | 'civil_society' | 'private_sector' | 'individual' | 'coalition' | 'diaspora' | 'media' {
  const map: Record<string, string> = {
    state: 'state',
    armed_group: 'non_state_armed_group',
    international_org: 'international_organization',
    civil_society: 'civil_society',
    individual: 'individual',
  };
  return (map[t] ?? 'civil_society') as ReturnType<typeof mapActorType>;
}

function mapClaimType(t: string): 'territorial' | 'sovereignty' | 'self_determination' | 'resource' | 'historical' | 'legal' | 'political' | 'economic' | 'security' | 'humanitarian' | 'cultural' | 'religious' {
  const valid = ['territorial', 'sovereignty', 'self_determination', 'resource', 'historical', 'legal', 'political', 'economic', 'security', 'humanitarian', 'cultural', 'religious'];
  // Map custom types
  if (t === 'legitimacy') return 'political';
  if (t === 'power_sharing') return 'political';
  if (t === 'humanitarian_access') return 'humanitarian';
  if (t === 'indigenous_rights') return 'cultural';
  return (valid.includes(t) ? t : 'political') as ReturnType<typeof mapClaimType>;
}

function mapClaimStatus(s: string): 'active' | 'dormant' | 'resolved' | 'escalating' | 'de_escalating' | 'contested' {
  const valid = ['active', 'dormant', 'resolved', 'escalating', 'de_escalating', 'contested'];
  return (valid.includes(s) ? s : 'active') as ReturnType<typeof mapClaimStatus>;
}

function mapRecognition(r?: string): 'broad' | 'limited' | 'none' | 'disputed' | undefined {
  if (!r) return undefined;
  const valid = ['broad', 'limited', 'none', 'disputed'];
  // Map 'divided' and 'moderate' to 'disputed'
  if (r === 'divided' || r === 'moderate') return 'disputed';
  return (valid.includes(r) ? r : 'disputed') as 'broad' | 'limited' | 'none' | 'disputed';
}

function mapInterestType(t: string): 'security' | 'economic' | 'political' | 'ideological' | 'territorial' | 'resource' | 'prestige' | 'survival' | 'domestic_legitimacy' | 'regional_influence' | 'global_influence' | 'humanitarian' | 'cultural' | 'religious' {
  const valid = ['security', 'economic', 'political', 'ideological', 'territorial', 'resource', 'prestige', 'survival', 'domestic_legitimacy', 'regional_influence', 'global_influence', 'humanitarian', 'cultural', 'religious'];
  return (valid.includes(t) ? t : 'political') as ReturnType<typeof mapInterestType>;
}

function mapPriority(p: string): 'vital' | 'important' | 'significant' | 'minor' {
  const valid = ['vital', 'important', 'significant', 'minor'];
  return (valid.includes(p) ? p : 'significant') as ReturnType<typeof mapPriority>;
}

function mapConstraintType(t: string): 'legal' | 'institutional' | 'military' | 'economic' | 'political' | 'social' | 'geographic' | 'normative' | 'resource' | 'alliance' | 'domestic' | 'international' {
  const map: Record<string, string> = {
    legal: 'legal',
    political: 'political',
    temporal: 'economic', // fiscal crisis is economic constraint
    military: 'military',
    economic: 'economic',
  };
  return (map[t] ?? 'political') as ReturnType<typeof mapConstraintType>;
}

function mapSeverity(s: string): 'binding' | 'significant' | 'moderate' | 'minor' {
  const valid = ['binding', 'significant', 'moderate', 'minor'];
  return (valid.includes(s) ? s : 'moderate') as ReturnType<typeof mapSeverity>;
}

function mapLeverageType(t: string): 'military' | 'economic' | 'diplomatic' | 'informational' | 'institutional' | 'normative' | 'energy' | 'trade' | 'financial' | 'technological' | 'demographic' {
  const valid = ['military', 'economic', 'diplomatic', 'informational', 'institutional', 'normative', 'energy', 'trade', 'financial', 'technological', 'demographic'];
  return (valid.includes(t) ? t : 'diplomatic') as ReturnType<typeof mapLeverageType>;
}

function mapEffectiveness(e: string): number {
  const map: Record<string, number> = { high: 0.8, medium: 0.5, low: 0.3 };
  return map[e] ?? 0.5;
}

function mapCommitmentType(t: string): 'treaty' | 'ceasefire' | 'agreement' | 'declaration' | 'resolution' | 'unilateral' | 'bilateral' | 'multilateral' | 'conditional' | 'unconditional' {
  const valid = ['treaty', 'ceasefire', 'agreement', 'declaration', 'resolution', 'unilateral', 'bilateral', 'multilateral', 'conditional', 'unconditional'];
  return (valid.includes(t) ? t : 'agreement') as ReturnType<typeof mapCommitmentType>;
}

function mapCommitmentStatus(s: string): 'proposed' | 'active' | 'suspended' | 'violated' | 'expired' | 'withdrawn' | 'fulfilled' {
  const valid = ['proposed', 'active', 'suspended', 'violated', 'expired', 'withdrawn', 'fulfilled'];
  // Map custom statuses
  if (s === 'partially_implemented') return 'active';
  return (valid.includes(s) ? s : 'active') as ReturnType<typeof mapCommitmentStatus>;
}

function mapEventType(t: string): 'military' | 'political' | 'diplomatic' | 'economic' | 'humanitarian' | 'legal' | 'social' | 'environmental' | 'election' | 'protest' | 'negotiation' | 'ceasefire' | 'violation' | 'escalation' | 'de_escalation' {
  const valid = ['military', 'political', 'diplomatic', 'economic', 'humanitarian', 'legal', 'social', 'environmental', 'election', 'protest', 'negotiation', 'ceasefire', 'violation', 'escalation', 'de_escalation'];
  return (valid.includes(t) ? t : 'political') as ReturnType<typeof mapEventType>;
}

function mapImpact(i: string): 'critical' | 'major' | 'moderate' | 'minor' {
  const map: Record<string, string> = {
    transformative: 'critical',
    significant: 'major',
    moderate: 'moderate',
    minor: 'minor',
  };
  return (map[i] ?? 'moderate') as ReturnType<typeof mapImpact>;
}

function mapNarrativeType(t: string): 'justification' | 'victimhood' | 'historical' | 'legal' | 'moral' | 'security' | 'economic' | 'religious' | 'nationalist' | 'humanitarian' | 'counter_narrative' | 'propaganda' {
  const map: Record<string, string> = {
    legitimizing: 'justification',
    strategic: 'economic',
    delegitimizing: 'counter_narrative',
  };
  return (map[t] ?? 'justification') as ReturnType<typeof mapNarrativeType>;
}

function mapTargetAudience(t: string): 'domestic' | 'international' | 'regional' | 'specific_actor' | 'diaspora' | 'media' {
  const valid = ['domestic', 'international', 'regional', 'specific_actor', 'diaspora', 'media'];
  return (valid.includes(t) ? t : 'international') as ReturnType<typeof mapTargetAudience>;
}

// ── Title extraction helpers ────────────────────────────────────────

function getInterestTitle(int: { id: string; description: string }): string {
  // Extract a short title from the description
  const desc = int.description;
  if (desc.startsWith('[UNSTATED]')) {
    return desc.slice(10, 60).trim() + '...';
  }
  return desc.slice(0, 50).trim() + (desc.length > 50 ? '...' : '');
}

function getConstraintTitle(con: { id: string; description: string }): string {
  return con.description.slice(0, 50).trim() + (con.description.length > 50 ? '...' : '');
}

function getLeverageTitle(lev: { id: string; description: string }): string {
  return lev.description.slice(0, 50).trim() + (lev.description.length > 50 ? '...' : '');
}

function getCommitmentTitle(com: { id: string; description: string }): string {
  return com.description.slice(0, 50).trim() + (com.description.length > 50 ? '...' : '');
}

function getEventTitle(evt: { id: string; description: string }): string {
  return evt.description.slice(0, 60).trim() + (evt.description.length > 60 ? '...' : '');
}
