# PRAXIS Real App Critical Roadmap - 2026-05-01

## Product Rule

The production app must only populate real user workspaces from:

1. user-created situation metadata;
2. user-uploaded documents and notes;
3. user-selected source URLs and source libraries;
4. AI/tool outputs generated against that user's active situation;
5. approved graph updates derived from the same situation context.

Demo content remains useful for `/demo` and explicit demo users, but it must not
fill empty states, prompt suggestions, saved outputs, graphs, reports, or
exports for a real account.

## Shipped In This Follow-Up

- Ask PRAXIS no longer falls back to Nordalia/DRM demo prompts for a real user
  with no active situation. It now shows neutral setup, context quality,
  workflow, and graph-backbone prompts.
- Added regression coverage so demo prompts stay isolated to demo mode.
- Documented the real-app content boundary and the future Dialectica backbone
  architecture.

## Critical P0 List

1. Authenticated golden path with seeded credentials
   - Need: repeatable login -> onboarding -> situation creation -> dashboard
     -> first 3 tools -> report export.
   - Impact: proves a real user can use the app end to end.

2. Demo isolation audit as a CI gate
   - Need: static check that real `/app` routes do not show demo case content
     unless `user.isDemo` or `/demo` is active.
   - Impact: prevents sample content from polluting paid-user trust.

3. First-situation success path
   - Need: after creating a situation, immediately show context quality, graph
     seeding status, source ingestion status, and the top 3 useful tools.
   - Impact: the user understands what happened and what to run next.

4. Saved-output hydration across every core tool
   - Need: if a tool has saved output, load it before showing generation
     prompts or empty states.
   - Impact: users see their work instead of thinking the app lost data.

5. Tool output provenance everywhere
   - Need: every generated result should expose situation id, tool id,
     profile version, source mode, source receipts, graph version, and generated
     time.
   - Impact: professional users can trust, cite, regenerate, and audit output.

6. Ask PRAXIS writeback
   - Need: Ask PRAXIS should update the correct saved tool output when users
     correct a fact, actor, source, or assumption.
   - Impact: the workspace improves through normal conversation.

7. Context gap questions per tool package
   - Need: risk tools ask for escalation indicators; drafting tools ask for
     audience and desired stance; graph tools ask for actors/sources; source
     tools ask for languages and regions.
   - Impact: tools stop producing generic output when required context is thin.

8. Graph proposal review loop
   - Need: AI/document/source extraction writes graph proposals, not silent
     canonical mutations; analysts approve, reject, or edit.
   - Impact: graph-backed reasoning remains auditable.

9. Production onboarding analytics
   - Need: track drop-off at account creation, onboarding, situation creation,
     first tool generation, saved output, and export.
   - Impact: shows where real users fail before they churn.

10. Failure recovery for expensive AI routes
    - Need: if a route times out or returns weak output, save a failed tool-run
      record with retry affordance and context diagnostics.
    - Impact: users can recover instead of hitting a dead end.

## High-Impact P1 List

11. Package-level "Run the next best action" buttons in `/app/tools`.
12. A situation health sidebar that follows the user across tool pages.
13. Document ingestion status with extraction confidence and entity coverage.
14. Source library seeding from situation region, actors, language, and domain.
15. Report Studio connected to saved tool outputs, not templates alone.
16. Source Scout to Sources Library one-click approval.
17. GraphOps warnings pushed into every graph-dependent tool page.
18. A "why this answer" drawer for AI outputs.
19. Workspace export bundle: situation, sources, documents, graph, tool outputs,
    and report artifacts.
20. Admin/operator view for failed user journeys and broken tool routes.

## Demo Separation Checklist

- Demo routes: may use Nordalia, static documents, and synthetic graph data.
- Demo users in `/app`: may use the demo scenario, clearly labeled.
- Real users in `/app`: may see only empty states, onboarding guidance,
  user-provided content, persisted user data, or fresh AI/tool output generated
  from the active situation.
- Real exports: must never include sample/demo text unless the user explicitly
  pasted it or generated it from their situation.
- Prompt suggestions: must be situation-specific or neutral setup guidance.
- Tool pages: must show "generate/import/add context" empty states rather than
  sample dashboards when real situation output is missing.

## Immediate Engineering Backlog

1. Add `audit:real-app-content` and wire it into the deploy gate.
2. Rename demo-backed shared components to neutral names when they are safe for
   real mode, so future reviewers can distinguish presentation components from
   demo data sources.
3. Add a typed `ContentOrigin` field to saved tool outputs:
   `user_input`, `ai_generated`, `document_extracted`, `source_ingested`,
   `graph_approved`, `demo_only`.
4. Add a production-only assertion before saving reports/exports: reject
   `demo_only` content for non-demo users.
5. Add an authenticated test account secret for local and Cloud Build golden
   path smoke tests.
