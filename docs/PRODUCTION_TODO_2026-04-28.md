# PRAXIS Production TODO — TACITUS System Of Record

Status: active backlog.
Last updated: 2026-04-28.

This is the long-form improvement backlog for turning PRAXIS into the TACITUS
system of record for conflict: a governed data layer for actors, claims,
interests, constraints, leverage, commitments, events, narratives, provenance,
and decision intelligence.

## Tier 1 — Critical

1. Replace all browser-to-backend calls with Next.js API bridges.
   - Why: the Python backend is private Cloud Run and should never depend on
     browser access to backend URLs.
   - Impact: cleaner auth, fewer CORS issues, stronger Cloud Run IAM posture.
   - Status: done for known in-repo call sites. `/api/backend/*` allowlisted
     proxy and graph test-connection admin bridge are shipped; legacy
     `/backend/:path*` rewrite removed.

2. Rotate local workstation secrets.
   - Why: `.env.local` has contained live Firebase, Polar, Firecrawl, and
     Parallel credentials.
   - Impact: reduces blast radius if local state was copied or logged.
   - Owner action: rotate provider keys and update Secret Manager.

3. Enforce GCP audit gate in Cloud Build.
   - Why: `_AUDIT_GCP_SKIP=1` lets IAM/Secret/PubSub drift miss deploy gates.
   - Impact: fewer broken deploys and safer infrastructure changes.
   - Next: grant Cloud Build audit SA viewer roles, then set skip to `0`.

4. Automate Firestore rules/index deployment.
   - Why: manual Firebase CLI deploys can drift from app deploys.
   - Impact: rules changes ship atomically with app changes.
   - Next: grant Firebase/Service Usage permissions or add a blocking drift
     preflight.

5. Remove or hard-gate destructive admin credit reset.
   - Why: `/api/admin/set-all-credits` still relies on shared cron secret.
   - Impact: smaller admin blast radius.
   - Next: require both admin session and a dedicated one-time operation token,
     or remove the endpoint after bootstrap.

## Tier 2 — High Impact

6. Surface Core-8 coverage throughout graph workflows.
   - Why: analysts need to know whether the graph contains Actor, Claim,
     Interest, Constraint, Leverage, Commitment, Event, and Narrative before
     trusting analysis.
   - Impact: makes TACITUS primitives operational, not just schema-level.
   - Status: graph writes and Conflict Graph panel shipped; next add corpus
     trace and Ask PRAXIS warning.

7. Canonicalize graph mutation through proposals.
   - Why: agents should propose changes, not silently mutate canonical graph
     state.
   - Impact: higher trust, reviewable provenance, safer agent workflows.
   - Next: unify `graph_updates`, staged graph, and approval UI.

8. Complete tool-output storage migration.
   - Why: `tool-data/{toolId}` and `tools/{toolId}` still coexist.
   - Impact: fewer retrieval misses, clearer corpus provenance.
   - Next: migrate legacy docs and make `ToolOutputEnvelope` the canonical
     write path.

9. Make document binaries durable in Cloud Storage.
   - Why: text/chunks alone are insufficient for legal-grade provenance.
   - Impact: source auditability and export defensibility.
   - Next: store original uploads, checksum them, and reference storage URI in
     document metadata.

10. Move paid-grade agents to durable async execution.
    - Why: Deep Research, Brainstorming Table, Source Scout, red-team review,
      and graph cartography are too important for request/response only.
    - Impact: resumability, retries, visible failures, better paid workflows.
    - Next: Cloud Tasks + LangGraph checkpoints + `background_jobs`.

11. Mount Vertex AI Agent Engine after engine deployment.
    - Why: managed deep research currently falls back when
      `VERTEX_AGENT_ENGINE_ID` is absent.
    - Impact: better long-running Google-native research.
    - Owner action: create/deploy engine and store numeric ID in Secret Manager.

12. Configure Polar production billing.
    - Why: checkout remains `unconfigured`.
    - Impact: monetization, trials, subscriptions.
    - Owner action: provide Polar access token, webhook secret, and product IDs.

## Tier 3 — Medium

13. Add Situation Health dashboard.
    - Why: users need a single quality score for graph coverage, source
      freshness, retrieval health, tool failures, and missing evidence.
    - Impact: clearer trust cues and onboarding.

14. Add provenance panels to generated outputs.
    - Why: every AI result should show inputs, profile version, corpus hits,
      model, confidence, and storage path.
    - Impact: trust and enterprise reviewability.

15. Expand Core-8 extraction QA.
    - Why: extraction can over-index actors/events and miss commitments or
      constraints.
    - Impact: better graph completeness.
    - Next: post-extraction validator that proposes missing primitive queries.

16. Add source whitelist/blocklist per situation.
    - Why: media, ARGUS, and source discovery need user-governed source policy.
    - Impact: better organizational trust and less noisy research.

17. Add BigQuery operational marts.
    - Why: operators need aggregate tool-run, feed freshness, model cost, and
      error trends.
    - Impact: cost control and observability.

18. Add budget alerts and BigQuery byte caps.
    - Why: GDELT/Vertex/Firecrawl usage can grow quickly.
    - Impact: cost predictability.

19. Improve storage rules.
    - Why: current read/write rules should separate read logic from
      write-time `request.resource` checks.
    - Impact: fewer unexpected file access failures.

20. Replace deprecated Next middleware convention.
    - Why: Next.js now warns that `middleware` should become `proxy`.
    - Impact: future Next compatibility.

## Tier 4 — Long Term

21. Dedicated `praxis-agents` Cloud Run service.
    - Why: separates long-running agent orchestration from web/API latency.
    - Impact: clearer scaling and IAM.

22. Enterprise audit console.
    - Why: organizations need reviewable logs of data access, AI outputs,
      approvals, and exports.
    - Impact: SOC 2 / procurement readiness.

23. Managed RAG path with Vertex AI Search / RAG Engine.
    - Why: large corpora need managed retrieval beyond Firestore vectors.
    - Impact: scale and enterprise search quality.

24. Graph analytics upgrade path.
    - Why: Firestore is the canonical baseline, but large cross-situation graph
      analytics may require Spanner Graph or Neo4j.
    - Impact: organization-level reasoning.

25. Persona-specific workflows.
    - Enterprise legal counsel: source audit, obligations, export defensibility.
    - Policy / UN analyst: source freshness, situation brief, diplomatic
      terminology.
    - Mediator / negotiator: interests, leverage, concessions, ripeness.
    - Startup founder / operator: customer/partner risk, market/regulatory
      conflict mapping.
    - Technical AI builder: agent runs, corpus traces, schema diagnostics.

## Recently Completed

- Dashboard pricing route hardening.
- Evidence-envelope retrieval across mixed tool-output paths.
- Integration readiness health for Firecrawl, Parallel, Vertex ADK, and Polar.
- Admin gate for credit top-up and advisor-feed reads.
- Cookie signing fail-closed behavior.
- Firestore user-create protected-field restrictions.
- Backend OIDC audience + service-account allowlist.
- Admin-bridged graph connection testing.
- Core-8 graph coverage persisted and surfaced on Conflict Graph.
