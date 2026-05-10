#!/usr/bin/env tsx
/**
 * v4-readiness stub: Source-tier discipline.
 *
 * When implemented, will check that every source registered in the Source Core
 * carries a tier in {T0..T7} and that every citation in tool outputs and
 * memos references a tiered source.
 */
const PHASE = "v4 Phase 2 (Module M2 Context / Source Tier)";
console.error(
  `[audit:source-tier-discipline] not yet implemented — see ${PHASE}. ` +
    `Will enforce T0-T7 tiers on sources and tier references on citations.`,
);
process.exit(2);

export {};
