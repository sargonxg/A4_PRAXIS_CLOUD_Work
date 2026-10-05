# Phase 01 - canonical contracts and durable storage

Additional required reading: [research/TEMPORAL_CONTEXT_GRAPH.md](../../research/TEMPORAL_CONTEXT_GRAPH.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

Read phase 00's integration map and decisions, `DATA_CONTRACTS.md` and `IMPLEMENTATION.md`. Implement native validated contracts for desk scopes, source packs, collection runs, source identities/revisions, representations, evidence locators, claim proposals, review decisions and versioned assessments. Keep future narrative/media fields compatible, but do not create empty services solely for future phases.

Use the approved existing storage/data plane. Reuse tenant/workspace ownership helpers and transactions. Keep source revisions and review records immutable except controlled retention/deletion metadata. Derive source revision identity from its source and exact representation hash; preserve capture occurrences separately when the same revision is observed repeatedly. Put large permitted media in private object storage, with restricted references in the ledger.

Define a global geography registry adapter, including stable country/territory codes, aliases, administrative IDs and user-assigned collection scopes. Display policy must be separate from recognition and boundary claims. Define country, administrative, theatre and thematic scopes with one or more country IDs, optional geometry references and explicit inclusion rules. Do not make country mandatory for a cross-border issue through a forced single-country shortcut.

Create additive migrations, constraints and indexes where required. Test owner-derived tenant access, uniqueness, revision guards, append-only decisions, transaction retries and query pagination. New Firestore collections need corresponding access rules and indexes. The local reference SQLite implementation illustrates invariants; it is not a migration for production.

Acceptance: records survive reopening, two tenants cannot read or write each other's records, a changed source creates a new revision, identical capture is idempotent, a review binds its proposal and evidence digests, and all supported scope types validate. Include fixtures for missing publication time, conflicting aliases and a multi-country theatre. Document migration and rollback behavior before moving on.
