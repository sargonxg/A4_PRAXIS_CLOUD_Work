# Capsule Backfill Readiness Audit

- PASS merge-only-dossier-write: research dossier detail record is seeded
- PASS merge-only-claim-ledger-write: claim ledger detail record is seeded
- PASS merge-only-workflow-write: human workflow example detail record is seeded
- PASS merge-only-refresh-write: starter refresh docket detail record is seeded
- PASS merge-flag: detail writes are merge-only
- PASS rules-research-dossiers: Firestore rules cover research dossiers
- PASS rules-claim-ledgers: Firestore rules cover claim ledgers
- PASS rules-workflows: Firestore rules cover workflow examples
- PASS rules-refresh-dockets: Firestore rules cover refresh dockets
- PASS runtime-audit-dossiers: runtime data-plane audit samples research dossiers
- PASS runtime-audit-refresh: runtime data-plane audit samples starter refresh dockets
- PASS script-registered: diagnostic backfill script is registered
- PASS ui-dossier-panel: workbench inspector surfaces research dossier proof
- PASS ui-vnext-proof: capsule cards show catalog vNext proof
