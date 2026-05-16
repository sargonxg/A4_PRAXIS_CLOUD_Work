# PRAXIS ContextCapsule Product Rebuild Plan

Date: 2026-05-15  
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`  
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## North Star

PRAXIS is the ContextCapsule platform for policy teams and the AI agents that
work with them.

A ContextCapsule is the shareable working context behind serious policy,
conflict, statecraft, defence, HR, public-sector, risk, and corporate analysis
work. It packages the sources, timeline, episodes, stakeholders, power
dynamics, rules, assumptions, drafts, decisions, review state, and handover
instructions that a human or AI agent needs before doing useful work.

The product loop should be simple:

```text
Build capsule -> Ask capsule -> Use tools -> Write from capsule -> Share capsule -> Hand it to agents
```

The bar is the center of the product. It should not be a decorative search
field. It is the entry point for scaffolded context creation, AI discussion,
tool routing, signup, and the handoff into the authenticated capsule workbench.

The deep TACITUS engines should stay mostly invisible:

- PRAXIS is the human-facing tool and app.
- DIALECTICA structures source knowledge and ingestion.
- KAIROS adds temporality: episodes, changes, stale assumptions, decision windows.
- AGON adds human friction: actors, power, incentives, blockers, approvals, conflict dynamics.

The user does not need to learn those names on the first screen. The user needs
to understand that PRAXIS gets humans and AI agents up to speed on the real
context of serious work.

## Product Promise

Most policy-producing work does not fail because teams lack a chatbot. It fails
because context is scattered across documents, email, meetings, notes,
dashboards, old memos, and people's heads.

PRAXIS turns that context into a managed object:

- context for which user or team;
- context for which situation;
- context from which sources;
- context across which time;
- context around which power dynamics;
- context under which rules or specifications;
- context for which output;
- context safe enough for a human or AI agent to inherit.

The capsule can start as a scaffold. A user may only know a name and a rough
question on day one. PRAXIS should still create a useful object:

```text
Thin capsule:
name + user role + situation sketch + output goal

Developing capsule:
sources + links + documents + notes + actors + episodes + rules

Operational capsule:
sourceability + temporality + power map + tools + review gates + draft outputs

Handover capsule:
locked version + open questions + allowed actions + escalation rules + agent brief
```

This supports the strongest commercial message:

```text
When an analyst leaves, a director joins, a crisis changes, or an AI agent takes over,
do not start from zero. Open the ContextCapsule.
```

## What Already Exists

This plan should reuse the current PRAXIS architecture rather than replace it.

Existing repo anchors:

- Landing page: `src/components/landing/phase8-wow-landing.tsx`
- App shell and sidebar: `src/components/app/app-shell.tsx`, `src/components/app/app-sidebar.tsx`
- Active capsule strip: `src/components/app/capsule-strip-header.tsx`
- Context strip: `src/components/app/core-context-strip.tsx`
- Ask workspace: `src/components/ask/AskWorkspacePage.tsx`
- Dashboard home: `src/components/dashboard/ask-praxis-home.tsx`
- Capsule service: `src/lib/context/capsule-service.ts`
- Core contracts: `src/lib/context/core-objects.ts`
- Context engine types and APIs: `src/types/context-engine.ts`, `src/app/api/context/*`
- Tool marketplace: `src/components/cores/ContextBuilderRoom.tsx`
- Tool recommendation: `src/lib/tools/recommend.ts`
- Canonical tools: `src/lib/tools/canonical.ts`, `src/lib/tools/contract.ts`
- Memo handover package API: `src/app/api/memos/[id]/handover-package/route.ts`

Current concepts map cleanly into the ContextCapsule model:

| Existing PRAXIS concept | ContextCapsule framing |
|---|---|
| Ask PRAXIS | Ask the active capsule |
| User Core | Context for who |
| Situation Core | Context for the situation |
| Source / Document Core | Sourceability layer |
| Time Core | Temporality layer |
| Graph Core | Power dynamics and claims map |
| Output Core | Memo, brief, handover, report target |
| Context health | Capsule readiness |
| Evidence gaps | Sourceability gaps |
| Memo Studio | Knowledge product studio |
| Canvas | Timeline, power map, claims, gaps |
| Tool marketplace | Capsule-aware capability library |
| Share / fork / lock | Capsule inheritance lifecycle |

## Canonical Policy Users

The first app experience should work for a generic user and for ten concrete
policy-producing roles. Each user type should receive a small default subset of
capsule templates, tool recommendations, and context-core prompts.

1. Generic policy worker: memo, brief, sourceability, handover.
2. Foreign policy analyst: conflict analysis, diplomatic brief, source posture.
3. Conflict resolution practitioner: actor interests, commitments, mediation timing.
4. Defence capture lead: procurement timeline, requirements, approval path.
5. Public affairs lead: regulatory watch, stakeholder map, narrative posture.
6. HR policy owner: internal rules, affected groups, legal/comms review.
7. Legal and compliance analyst: rule/spec checks, entity exposure, evidence gates.
8. Crisis manager: episodes, decision windows, escalation rules, executive brief.
9. Strategy operator: board context, market/regulatory shifts, risk notes.
10. Program officer: implementation context, local actors, source gaps.
11. Research director: team handover, review quality, reusable capsule library.

These are not separate apps. They are default capsule presets over the same
PRAXIS surfaces.

## Capsule Anatomy

Every ContextCapsule should make these dimensions explicit:

| Dimension | User-facing label | Internal PRAXIS mapping |
|---|---|---|
| User modality | User | User Core, analyst profile, audience, tone |
| Situation | Situation | Situation Core, case frame, goals, risks |
| Sources | Sourceability | Source/Document Cores, receipts, evidence gaps |
| Time | Temporality | Time Core, KAIROS episodes, stale-claim checks |
| Human friction | Power Dynamics | Graph Core, AGON actor/friction/approval map |
| Rules | Rules / Specs | Specification Core, review checklist, standards |
| Capabilities | Tools | Tool Cores, canonical tools, marketplace readiness |
| Output | Output | Output Core, Memo Studio, export and handover |
| Memory | Handover | Memory Core, decisions, caveats, agent instructions |

The user should see the simple label first. The deeper core name can appear in
inspectors, Advanced, docs, and tooltips.

## Landing Page Direction

The new homepage should be Tasklet-like: one clear prompt bar, category chips,
example cards, and a direct signup path. The page should feel action-first, not
like a product brochure.

### Hero

Headline:

```text
Build a ContextCapsule for the policy work in front of you.
```

Subcopy:

```text
PRAXIS turns sources, timelines, stakeholders, rules, drafts, and decisions into
shareable working context that humans and AI agents can safely inherit.
```

Primary prompt bar:

```text
What issue, decision, or analysis are you working on?
```

Category chips under the bar:

```text
Conflict analysis
Director handover
Defence opportunity
HR policy review
Regulatory watch
Crisis brief
Public sector memo
Agent handover
```

Primary CTA:

```text
Build ContextCapsule
```

Secondary CTA:

```text
Open Ask PRAXIS
```

### Example Cards Below The Bar

Each card should behave like Tasklet's "Try it" examples: clicking it prefills
the prompt bar and routes the user into signup or the authenticated app.

Examples:

- Prepare a director briefing on a regulatory change.
- Build a conflict capsule with sources, episodes, actors, and power dynamics.
- Track a defence procurement opportunity and map who approves, blocks, and influences.
- Review an HR policy change against internal rules and employee impact.
- Create an agent handover capsule before I go on leave.
- Turn these documents into a sourced policy memo with gaps visible.

### Unauthenticated Flow

If the visitor types in the bar or clicks an example card:

1. Store the pending capsule prompt in URL state or local storage.
2. Route to signup/login.
3. After signup, create or hydrate a starter ContextCapsule from the prompt.
4. Grant the initial free/promo allowance.
5. Route to the authenticated capsule workbench or Ask PRAXIS.

Implemented first-pass handoff path:

```text
Landing prompt / example card
-> /login?mode=signup&redirect=/app/assistant&capsulePrompt=...
-> pending prompt stored in localStorage
-> login page shows "ContextCapsule queued"
-> Ask workspace surfaces "Continue in Ask"
```

Next pass should turn that queued prompt into a persisted starter capsule via
the existing capsule/context-stack APIs.

Do not expose internal provider or credit-cost details in normal UI. User-facing
copy should say "starter allowance" or "initial runs" rather than internal costs.

### Public Sections

Keep the page short:

1. Build the capsule: sources, notes, rules, user role, situation, output goal.
2. Understand what changed: KAIROS-style episodes, timelines, stale assumptions.
3. Map who matters: AGON-style power dynamics, approvals, blockers, incentives.
4. Work with humans and agents: ask, draft, run checks, use tools, combine, share, hand over.

## Authenticated App Direction

Keep the simple primary navigation:

```text
Home
Ask PRAXIS
Library
Memo Studio
Canvas
Advanced
```

Reframe the surfaces:

- Home: your ContextCapsules and active capsule.
- Ask PRAXIS: ask the selected capsule, not a blank chat.
- Library: sources, documents, and rules/specifications.
- Memo Studio: write knowledge products from the capsule.
- Canvas: timeline, actors, claims, power dynamics, approvals, evidence gaps.
- Advanced: tools, marketplace, traces, audits, provider/model settings.

The sidebar should make Context Core management visible without overwhelming the
user. Use capsule anatomy labels:

```text
Active ContextCapsule
- User
- Situation
- Sources
- Temporality
- Power Dynamics
- Rules / Specs
- Tools
- Output
- Handover
```

Internally, this maps to existing capsule/core refs:

- `userCoreId`
- `situationCoreId`
- `sourceCoreIds`
- `documentCoreIds`
- `timeCoreId`
- `graphCoreId`
- `toolCoreIds`
- `objectiveCoreIds`
- `productCoreIds`
- `outputCoreIds`
- `memoryCoreId`

Add or formalize:

- `specificationCoreIds`
- `agentHandoverCoreId`

## Tool Marketplace

Keep the tool marketplace, but stop making it feel like the product. Tools are
capabilities the active capsule can invoke.

Recommended capability categories:

- Sourceability: source checker, citation repair, evidence gap finder.
- Temporality: episode extractor, what-changed review, stale-claim checker.
- Power dynamics: stakeholder map, approval path, blocker map, conflict/friction read.
- Analysis: ACH, scenario review, contradiction finder, red team.
- Writing: memo drafter, talking points, board brief, handover pack.
- Governance: review receipt, export manifest, agent handover check.

The marketplace should feel like Tasklet's connected capability layer, but in
PRAXIS language. The user does not browse a pile of generic automations. The
active capsule says: sources are thin, time is missing, power map is weak,
rules are unclear, output is ready, or handover is risky, and then PRAXIS
recommends the right capability.

Tool recommendation should be capsule-aware:

```text
Thin sources -> recommend Source Checker / Find Sources
Missing time horizon -> recommend Temporality Check
Missing actors or approvers -> recommend Power Map
Output goal set -> recommend Memo Drafter
Leaving/transition scenario -> recommend Agent Handover
```

## ContextCapsule Types

Seed templates for broad policy-producing teams:

- Conflict Analysis Capsule
- Director Handover Capsule
- Defence Opportunity Capsule
- HR Policy Review Capsule
- Regulatory Watch Capsule
- Crisis Brief Capsule
- Public Sector Memo Capsule
- Board Brief Capsule
- Sanctions / Compliance Capsule
- Agent Handover Capsule

Each template should set defaults for:

- source posture;
- timeline/episode expectations;
- power map labels;
- specification/rule requirements;
- suggested tools;
- output templates;
- review gates.

## Capsule Combination

Capsule combination is a major differentiator.

Product language:

```text
Combine ContextCapsules without losing provenance.
```

Examples:

- HR policy capsule + legal review capsule -> rollout recommendation.
- Defence procurement capsule + stakeholder capsule -> capture strategy.
- Conflict capsule + humanitarian access capsule -> operations brief.
- Regulatory watch capsule + market entry capsule -> board memo.
- Director handover capsule + active crisis capsule -> executive briefing.

Technical behavior:

```text
Combine capsules
-> reconcile duplicate actors
-> align timelines
-> detect contradictions
-> merge sources
-> preserve source receipts
-> create a new capsule version
```

## Agent Handover

Agent handover should become a flagship feature.

Button:

```text
Prepare Agent Handover
```

The handover packet should include:

- objective;
- source scope;
- active timeline and recent episodes;
- power map and approval path;
- open questions;
- evidence gaps;
- allowed actions;
- approval-required actions;
- prohibited actions;
- escalation rules;
- expected outputs.

Example policy:

```text
Allowed:
- monitor approved sources
- summarize changes
- update evidence gaps
- draft internal notes

Requires approval:
- mark claims as resolved
- change graph facts
- send external messages
- export final memo

Escalate:
- new leadership change
- contradiction between sources
- deadline within 48 hours
- actor status change
```

## Suggested Technical Additions

Create these modules incrementally. Do not move existing code until the new
surface is stable.

```text
src/lib/context-capsules/
  types.ts
  templates.ts
  merge.ts
  handover.ts
  readiness.ts

src/lib/specifications/
  specification-core.ts
  policy-spec-templates.ts
  clause-coverage.ts

src/lib/episodes/
  episode-types.ts
  kairos-adapter.ts
  stale-claim-check.ts

src/lib/power-dynamics/
  power-edge-types.ts
  agon-adapter.ts
  approval-paths.ts

src/lib/capsule-agents/
  sourceability-check.ts
  temporality-check.ts
  power-check.ts
  spec-check.ts
  red-team-check.ts
  handover-check.ts
```

Initial types:

```ts
export type ContextCapsuleType =
  | 'conflict_analysis'
  | 'director_handover'
  | 'defence_opportunity'
  | 'hr_policy_review'
  | 'regulatory_watch'
  | 'crisis_brief'
  | 'public_sector_memo'
  | 'board_brief'
  | 'sanctions_compliance'
  | 'agent_handover';

export type CapsuleReadiness = {
  context: number;
  sourceability: number;
  temporality: number;
  powerDynamics: number;
  specification: number;
  output: number;
  overall: number;
};

export type AgentHandover = {
  capsuleId: string;
  objective: string;
  allowedActions: string[];
  approvalRequiredActions: string[];
  prohibitedActions: string[];
  escalationRules: string[];
  outputTargets: string[];
};
```

## Context Injection And Generation Contract

Generation should never be "prompt -> model -> answer" for serious work. The
Ask PRAXIS flow should converge on:

```text
user request
-> active ContextCapsule
-> user role/audience
-> situation frame
-> sourceable claim set
-> episode/time frame
-> power/approval graph
-> applicable rules/specs
-> recommended tools
-> draft or answer
-> source/gap/review receipt
```

The app already has the beginning of this through `src/lib/ai/ask-praxis-context.ts`,
`src/app/api/ai/chat/route.ts`, active context stacks, capsule ids, and
context-package ids. Future backend work should add explicit
`specificationCoreIds`, episode summaries, power-map deltas, and agent-handover
rules to the injectable context block.

## Human Gates

The capsule is not only a better prompt. It is a governance object.

Human approval should remain required for:

- graph fact mutation;
- marking unsupported claims as resolved;
- external messages or notifications;
- final export for sensitive policy work;
- agent handover permissions;
- capsule merges that contain contradictions;
- changing the active rules/specification set.

This is how PRAXIS reduces hallucination risk: it turns tacit policy judgment
into explicit reviewable structure before AI acts.

## Build Sequence

1. Landing copy and hero prompt bar:
   - Update `src/components/landing/phase8-wow-landing.tsx`.
   - Preserve the existing visual components where possible.
   - Add category chips and example cards under the prompt bar.

2. Signup handoff:
   - Persist pending prompt locally or in query state.
   - Route unauthenticated users to login/signup.
   - On completion, hydrate the first capsule prompt in the app.

3. Home capsule framing:
   - Update Home/dashboard copy to "Your ContextCapsules".
   - Keep the current active stack, next moves, and context health logic.

4. Sidebar and context strip:
   - Keep primary nav unchanged.
   - Add a compact "Active ContextCapsule" anatomy panel or improve the existing capsule strip.

5. Specification Core:
   - Add spec templates and UI affordance in Library/Core management.
   - Start with static templates before deeper ingestion.

6. Capsule-aware tool marketplace:
   - Group tools by Sourceability, Temporality, Power, Analysis, Writing, Governance.
   - Recommend tools from capsule gaps and output goal.

7. Agent handover:
   - Reuse the memo handover package route and extend with allowed/prohibited/escalation rules.

8. Capsule combination:
   - Start as a plan/preview UI with provenance-safe merge receipts.
   - Defer destructive or irreversible merges until review gates exist.

9. Validation:
   - Run scoped lint for touched files.
   - Run `npx tsc --noEmit`.
   - Run `npm run build`.
   - Run the relevant PRAXIS audits for capsule and route shape.
   - Browser-smoke landing, signup redirect, and authenticated capsule entry.

## Claude Code Implementation Prompt

Paste the following into Claude Code from the PRAXIS repo root.

```text
You are working in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Remote:
https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git

Read first:
- AGENTS.md
- CLAUDE.md
- README.md
- DESIGN.md
- docs/product/CONTEXT_CAPSULE_PRODUCT_REBUILD_PLAN.md
- STATUS.md
- TODO.md

Goal:
Recenter PRAXIS around the ContextCapsule product model while preserving the
existing simplified app structure and reusing as much current code as possible.

Product direction:
PRAXIS is the human-facing ContextCapsule platform for policy teams and AI
agents. DIALECTICA, KAIROS, and AGON are internal/context engines. Do not make
those internal engine names the main public UX. The user-facing promise is:
Build capsule -> Ask capsule -> Use tools -> Write from capsule -> Share capsule
-> Hand it to agents.

Scope for the first implementation pass:
1. Landing page, Tasklet-style:
   - Update src/components/landing/phase8-wow-landing.tsx.
   - Keep the current visual identity and existing reusable components where they help.
   - Add a clear hero prompt bar:
     "What issue, decision, or analysis are you working on?"
   - Headline:
     "Build a ContextCapsule for the policy work in front of you."
   - Add category chips:
     Conflict analysis, Director handover, Defence opportunity, HR policy review,
     Regulatory watch, Crisis brief, Public sector memo, Agent handover.
   - Add example cards with "Try it" behavior that pre-fills the bar.
   - Primary CTA: Build ContextCapsule.
   - Secondary CTA: Open Ask PRAXIS.
   - If unauthenticated, CTA/example actions should route toward login/signup while
     preserving the prompt in query state or localStorage.

2. App wording and entry:
   - Reframe Home/dashboard copy around "Your ContextCapsules".
   - Reframe Ask copy around "Ask the active capsule".
   - Do not add new primary nav items. Keep Home, Ask PRAXIS, Library, Memo Studio,
     Canvas, Advanced.
   - Keep current route structure unless there is already a canonical equivalent.

3. Sidebar/context strip:
   - Keep the sidebar primary nav unchanged.
   - Add or improve a compact Active ContextCapsule anatomy view using existing
     capsule/core refs:
     User, Situation, Sources, Temporality, Power Dynamics, Rules / Specs, Tools,
     Output, Handover.
   - Reuse src/components/app/capsule-strip-header.tsx and
     src/components/app/core-context-strip.tsx where possible.

4. Tool marketplace:
   - Keep the tool marketplace.
   - Reframe tools as capsule capabilities.
   - Group or label capability areas:
     Sourceability, Temporality, Power Dynamics, Analysis, Writing, Governance.
   - Tool recommendations should remain attached to context/capsule gaps, not a raw marketplace.

5. Technical restraint:
   - Do not rewrite backend architecture in this first pass.
   - Do not delete existing routes.
   - Do not expose internal credit costs or provider internals in normal UI.
   - Gemini/Vertex/model details belong in Advanced/settings, not on the public landing page.
   - Preserve withCalibration and existing AI route contracts.

6. Validation:
   - Run scoped lint for touched frontend files if full lint is noisy.
   - Run npx tsc --noEmit.
   - Run npm run build.
   - Run any relevant audits already present for simplified route/capsule shape.
   - Browser smoke the landing page, the prompt/example flow to signup/login, and
     the authenticated app entry if credentials/session are available.

Deliverables:
- Code changes for the landing and app wording/shell only.
- A short implementation summary.
- A list of files changed.
- Exact validation commands and results.
- Any follow-up items for Specification Core, Agent Handover, capsule merge, or
  deeper KAIROS/AGON/DIALECTICA integration.
```
