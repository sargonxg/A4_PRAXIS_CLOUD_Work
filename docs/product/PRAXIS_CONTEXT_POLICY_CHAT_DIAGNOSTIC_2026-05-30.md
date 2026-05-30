# PRAXIS Context And Policy Chat Diagnostic

Date: 2026-05-30

## Scope

This review covers the signed-in launchpad, context/capsule building path, research entry points, and boardroom policy discussion flow. It keeps the product shape aligned with the canonical structure: public marketing at `/`, signed-in launchpad at `/app`, governed context work in Capsules, and boardroom as an action surface rather than a new primary navigation system.

## Diagnosis

| Area | Current State | Product Risk | Action |
| --- | --- | --- | --- |
| Launchpad prompt | Simple and coherent, but previously routed only to research. | Users with discussion or drafting intent had to infer where to go. | Add mode selection for Research, Boardroom, and Draft while keeping one prompt and one primary CTA. |
| Advanced context editor | Previously showed static context labels. | It looked like a model diagram, not an editor. | Make it actionable: select/create capsule, set output target, and route context into boardroom/research/draft. |
| Capsule attachment | Capsule management exists in `/app/capsules`, but not directly from launchpad context editing. | Users can miss the fact that capsules govern generation. | Add active capsule picker and build/marketplace actions inside the collapsed editor. |
| Research posture | Research is strong but entry language is generic. | Users may not distinguish quick answer, deep research, and board discussion. | Use explicit work modes and preserve prompt/capsule query params across routes. |
| Boardroom handoff | Boardroom can run durable multi-agent deliberation, but launch context was not prefilled. | Users experience a blank room after asking a question elsewhere. | Boardroom now reads `prompt`, `question`, `context`, `contextNotes`, `capsuleId`, and `contextStackId`. |
| Context persistence | Active context stack API exists and is capsule-backed. | UI did not expose the stack enough at the point of work. | Show persisted/local state, linked sources, context blocks, and output target in advanced editor. |
| Non-technical authoring | Builder exists but is not obvious from `/app`. | Users may not know how to create a capsule before asking. | Add Build capsule and Marketplace actions without adding new top-level chrome. |

## Implemented In This Pass

- `/app` keeps a light entry point but now behaves as Ask PRAXIS first: one chat-style composer, with Boardroom as the visible escalation path.
- The capsule chip reflects the active capsule instead of always saying a generic verified capsule.
- `Advanced / Edit context` is now a compact context editor:
  - activate an existing capsule,
  - create/build a capsule,
  - add from marketplace,
  - set first-class output target,
  - see source/context/output status,
  - open boardroom with the active capsule.
- `/app/boardroom` now accepts launch context via query params and pre-fills the decision question/context notes.
- The capsule picker no longer displays the first available capsule as active when no capsule has actually been selected.
- Follow-up UI pass: `/app` is now chat-first Ask PRAXIS rather than a research-run launcher, with a pinned capsule/context editor, workspace sidebar, Learn/Changelog links, recent-work cards, and PRAXIS sample policy artifacts.
- Added `/app/recent-work` so recent artifacts have a coherent route instead of relying on a query-state tab.
- Fixed created-work cards to read `primaryAction.href`, so saved PRAXIS artifacts appear when returned by `/api/created-work`.

## Next Improvements To Implement

| Priority | Improvement | Why It Matters | Acceptance Criteria |
| --- | --- | --- | --- |
| P0 | Context import tray | Users need to paste URLs, PDFs, notes, and source receipts without leaving the prompt. | Advanced editor supports Add URL, Add note, Upload file, and each becomes a reviewable source/core item. |
| P0 | Capsule diff and review queue | Capsule updates must be human-gated and understandable. | Every AI-suggested actor/rule/claim/source becomes a proposed card with approve/reject, provenance, and version impact. |
| P0 | Research run plan preview | Users should know what the agent will do before paying time/cost. | Before dispatch, show sources to search, lenses, output target, min citation requirements, and stop conditions. |
| P1 | Boardroom agenda templates | Policy teams need realistic meeting structures, not generic chat. | Boardroom offers decision memo, crisis cell, legal review, negotiation, and red-team agendas. |
| P1 | Capsule quality score drilldown | "Health" needs to teach users how to improve context. | Score expands into sources, freshness, actor coverage, ontology coverage, unsupported claims, and required fixes. |
| P1 | Capsule-aware follow-up chips | Chat should guide the next best action. | Each answer suggests attach source, update capsule, open boardroom, draft memo, or run sourceability based on gaps. |
| P1 | Ontology visualization inside capsule inspector | Users need to see the policy knowledge model without a messy graph. | Inspector shows Actors, Institutions/rules, Claims, Evidence, Risks, Options, Decisions, and Open questions. |
| P2 | Personal/team capsule handoff | Teams need shared context without leaking private notes. | Fork/share flow shows included cores, excluded private notes, version hash, and access posture before publish. |
| P2 | Cited drafting margin | Drafting should keep claims tied to evidence. | Editor margin shows paragraph sourceability, missing evidence, and date-check flags with insertable cautious rewrite. |
| P2 | Agentic run replay | Trust improves when teams can inspect how the answer was produced. | AgentRun timeline shows plan, retrieval, verification, synthesis, citations, model policy, and output capsule. |

## Product Principle

The visible app should remain calm: one prompt, one active context, one obvious next action. The advanced kernel should keep doing more: governed capsules, source receipts, ontology proposals, review cards, durable AgentRuns, and output capsules.
