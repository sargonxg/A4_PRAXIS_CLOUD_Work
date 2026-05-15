# Tasklet Research Intake For PRAXIS

Date: 2026-05-15  
Source file reviewed:
`C:\Users\giuli\Downloads\compass_artifact_wf-d85823ef-e0be-458a-8492-3fc104a0b274_text_markdown.md`

## Purpose

This note records what was incorporated from the external research document and
what was deliberately not adopted because PRAXIS already has a working stack and
product boundary.

The research is useful as a Tasklet-class browser-agent build guide. PRAXIS
should use it as an input, not as a full replacement for the current
ContextCapsule architecture.

## Incorporated

### Tasklet Product Reading

Adopt:

- Tasklet is an agent-first automation platform, not merely a browser-agent
  product.
- Browser/computer use is a fallback execution modality after integrations,
  APIs, and MCP.
- The surface should feel prompt-first and workflow-oriented.
- Long-lived/scheduled agents are a key product pattern.

PRAXIS adaptation:

- PRAXIS agents inherit ContextCapsules.
- PRAXIS starts with policy/research/memo/watchlist agents, not generic SaaS
  automation.
- Browser automation is a later fallback, not the core v1 value.

### Browser Automation Lane

Adopt as the later lane:

- `browser-use` is the preferred Python browser-agent framework candidate.
- Steel.dev is the preferred browser infrastructure candidate: managed early,
  self-hostable on GKE later.
- Stagehand is useful later for deterministic repeated workflows and cached
  action paths.
- Avoid Skyvern in the core runtime because AGPL is a licensing risk for SaaS.
- Avoid raw Playwright orchestration as the first autonomous-browser runtime.

PRAXIS adaptation:

- Wave 1 through Wave 5 do not require browser automation.
- Browser lane starts only after run ledger, dispatch, outputs, and approvals
  are stable.
- Use read-only allowlisted browser sessions first.
- Credentialed or destructive browser actions require explicit approval.

### Runtime And UX Patterns

Adopt:

- API/control plane must not run long browser/agent tasks directly.
- One run should have a durable event stream and inspectable step timeline.
- SSE over Cloud Run is the first streaming mechanism; WebSockets only if
  bidirectional intervention requires it.
- Run UI should show action timeline, status, source/tool receipts, pause/cancel,
  and approval states.
- "Skills" should start as saved prompts with structured inputs, not a visual
  flow editor.
- Use idempotency keys for schedule/webhook double-fire.
- Do not promise resumability in v1; failed runs can be retried with
  `parentRunId`.

PRAXIS adaptation:

- The first run UI lives in existing Home/Ask/Advanced surfaces.
- Agent run steps should point to PRAXIS tool calls, source receipts, gaps,
  memo outputs, graph proposals, and approvals.
- Run timeline is evidence/governance UI, not a live browser-control toy.

### Guardrails

Adopt:

- Hard caps on maximum steps, session minutes, and estimated run cost.
- Worker-side timeout watchdog.
- Human-in-the-loop gates for destructive actions, external sends, payment
  fields, cross-org email, unsupported claim resolution, graph promotion, and
  credentialed browser automation.
- No password storage. If browser contexts ever exist, store session context
  references and encrypt sensitive material with KMS.
- Audit logs are mandatory.
- Per-tenant/user action logs and timestamps are mandatory.

PRAXIS adaptation:

- These guardrails become schema fields and approval policies in the agent run
  ledger before browser automation ships.

### Observability

Adopt:

- Use Cloud Logging/Monitoring for platform telemetry.
- Add LLM/run tracing when agent execution becomes real.
- Langfuse-style traces are useful if self-hosted or deployed inside the GCP
  boundary.

PRAXIS adaptation:

- Do not block Wave 1 on Langfuse.
- Add trace ids to the run ledger now so Langfuse or equivalent can attach
  later.

## Not Adopted

### Clerk As Auth

The research recommends Clerk for greenfield speed. PRAXIS already uses
Firebase Auth and owner-scoped Firestore, with docs, audits, and runtime
contracts around that boundary.

Decision:

- Do not replace Firebase Auth with Clerk.
- Future enterprise SSO can be evaluated separately.

### Generic FastAPI-First App Split

The research assumes a greenfield split where FastAPI is the main API and
Next.js is mostly frontend. PRAXIS already has a Next.js API/control plane plus
a private Python backend.

Decision:

- Keep the current Next.js app/API gateway.
- Use Python/FastAPI workers where they fit browser-use, extraction, or
  existing backend capabilities.

### Pub/Sub Instead Of Cloud Tasks For Run Dispatch

The research leans toward Pub/Sub as primary queue. PRAXIS's canonical plan uses
Cloud Tasks for one durable task per run and Pub/Sub for event fan-out.

Decision:

- Keep Cloud Tasks as run dispatch.
- Use Pub/Sub for events, fan-out, profile events, and downstream listeners.

### Stripe/Clerk/Pricing Copy As Product Truth

The research suggests Tasklet-like pricing and Stripe. PRAXIS currently has
Polar/billing cleanup and explicit rules against exposing internal credit costs
in normal UI.

Decision:

- Do not change billing provider in this documentation pass.
- Do not expose internal cost counters in user-facing UI until billing strategy
  is decided.
- Advanced/admin can show operational spend later.

### Dark Tasklet Clone Aesthetic

The research includes useful visual patterns, but PRAXIS should not become a
Tasklet visual clone.

Decision:

- Keep PRAXIS's ContextCapsule/policy-workbench visual identity.
- Use concrete demo/workflow evidence, not generic AI-bento decoration.

## New Canonical Additions

Add these to the PRAXIS build direction:

1. Browser automation is a formal deferred lane:
   `browser-use` plus Steel.dev managed first, GKE self-host later.
2. Agent run ledger must include:
   - `maxSteps`;
   - `maxSessionMinutes`;
   - internal estimated cost fields;
   - `parentRunId`;
   - `idempotencyKey`;
   - `traceId`;
   - approval policy;
   - action/tool event timeline.
3. Run UI should eventually include:
   - step timeline;
   - tool/source receipts;
   - pause/cancel;
   - approval prompts;
   - retry-from-failed-run;
   - output diff/review.
4. Browser sessions must never be the first implementation wave.
5. Agent skills should be saved structured prompts tied to ContextCapsule
   templates before visual flow builders.

