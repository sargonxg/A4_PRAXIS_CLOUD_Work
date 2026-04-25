# PRAXIS Strategy And Roadmap

This document keeps Codex, Claude Code, and human maintainers aligned on where PRAXIS is heading.

## Product North Star

PRAXIS is the conflict operating system for policy, diplomacy, politics, humanitarian coordination, legal/sanctions work, mediation, and research teams. The app should feel like a serious professional workspace, not a generic AI chatbot.

Primary users:

- Policy Officer
- Political Affairs Desk
- Research Analyst
- Mediator or Envoy Team
- Humanitarian Coordinator
- Legal or Sanctions Analyst
- Institutional or Enterprise Team

## Strategic Priorities

1. Deployability and operational trust
   - Clean clone installs and builds.
   - Cloud Run deploys are repeatable.
   - GCP/Firebase audits pass.
   - Production health and auth diagnostics are easy to check.

2. Situation-centered workspace
   - Every tool should use the active situation.
   - Onboarding should shape dashboards, defaults, tool paths, and AI prompts.
   - Dashboard should show role, situation, risks, recommended actions, active tools, and missing context.

3. Pricing and entitlements
   - Public pricing remains monthly and plan-based.
   - Internal credit metering stays private.
   - Plan IDs, subscription fields, Stripe lookup keys, and entitlement checks must use one model: `free`, `analyst`, `team`, `enterprise`.

4. Tool quality
   - Every visible tool needs clear inputs, useful outputs, error states, persistence, and tests.
   - Route IDs, registry IDs, and stored tool IDs must match.
   - Placeholder tools should be hidden or completed.

5. Agent expertise
   - Build concrete expert pages, prompts, docs, and knowledge pathways for:
     Policy Analyst, Diplomatic Advisor, Conflict Analyst, Media/Disinformation Analyst, Sanctions/Legal Analyst, Humanitarian Access Analyst, Scenario Planner, Negotiation/Mediation Advisor.
   - Agents must read canonical situation context, AnalystProfile, source preferences, and workspace constraints.

6. Canonical data and graph
   - Firestore remains the near-term source of truth.
   - Define canonical entities for actors, organizations, places, issues, claims, events, relationships, sources, and situations.
   - Add canonical naming/entity resolution before adding more storage systems.
   - Neo4j/Falkor/TrustGraph/Spanner are optional only when integration value is concrete and testable.

7. MCP and agentic operations
   - MCP is future work after production stability.
   - Candidate safe MCP tools: situation retrieval, actor graph retrieval, source search, canonical entity lookup, report generation, workspace usage status.

## Infrastructure Strategy

Current target stack:

- Cloud Run: `praxis-frontend`, `praxis-backend`
- Firebase Auth and Firestore: identity and primary app data
- Secret Manager: Firebase service account, Google AI key, cron secret, cookie secret, user key master
- Cloud Build: container build and deploy
- Artifact Registry: frontend, backend, and GDELT worker images
- Pub/Sub: profile and pipeline event topics
- Cloud Scheduler: scheduled intelligence and briefing jobs
- BigQuery: analytics and pipeline logging
- Cloud Storage: document uploads

Required operational checks:

- `npm run audit:gcp`
- `curl -s https://praxis.tacitus.me/api/health`
- `curl -s https://praxis.tacitus.me/api/auth/test-firebase`
- Cloud Run latest ready revisions for frontend and backend
- Firebase Auth authorized domains include `praxis.tacitus.me`

## Six-Week Roadmap

Week 1: production hardening
- Keep Cloud Run deployment healthy.
- Verify domain, auth, health, and onboarding routing after each deploy.
- Reduce shared-hook React Compiler warnings that can hide real bugs.
- Migrate from `middleware.ts` to the Next.js 16 `proxy.ts` convention after tests confirm auth behavior.

Week 2: pricing and entitlement alignment
- Audit pricing constants, Stripe checkout, settings UI, Firestore subscription fields, and credit checks.
- Create one entitlement helper consumed by UI and API routes.
- Ensure public pages never expose internal per-tool costs.

Week 3: onboarding and dashboard
- Make onboarding role and situation choices drive tool recommendations.
- Reorganize dashboard around user role, active situation, current intelligence, and recommended next actions.
- Add clearer empty states for missing situation/profile/source context.

Week 4: tool registry and route audit
- Reconcile tool registry IDs, route IDs, sidebar IDs, persisted Firestore tool docs, and audit script expectations.
- Hide or finish placeholder tools.
- Add tests for high-value tool routes and persistence helpers.

Week 5: canonical entity model
- Define canonical entity schema and resolution rules.
- Add migration/read adapters for existing graph fragments.
- Keep Firestore-first until graph traversal requirements justify Neo4j/Falkor/TrustGraph.

Week 6: agent docs and MCP design
- Write agent-specific knowledge pages and prompts.
- Design a minimal read-safe MCP server.
- Add a test plan before implementing MCP tools.

## Definition Of Done

A change is done when:

- Build passes.
- Core tests pass.
- Relevant audits pass.
- Production deploy is verified if infra or runtime behavior changed.
- Documentation reflects what changed, what passed, what failed, and what remains.
- Commit is pushed when credentials are available.

