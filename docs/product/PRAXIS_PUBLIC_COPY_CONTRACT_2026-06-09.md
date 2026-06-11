# PRAXIS Public Copy Contract - 2026-06-09

Status: accepted
Owner: PRAXIS product surface
Scope: public Home, login handoff, Learn, Guide, Pricing, Release notes, legal summaries, metadata, and public-surface tests.

## Context

The public and pre-login PRAXIS surface had drifted toward explaining internal machinery first: ContextCapsules, capsule chains, agent timelines, memo handoffs, and ecosystem components. That made the first experience harder to understand for new users.

The product direction is now clearer:

- Show the human job first.
- Keep the visible product simple.
- Keep the deeper ContextCapsule/runtime system available behind saved context, Learn, and signed-in work.
- Avoid adding new top-level public or signed-in surfaces for this copy layer.

## Decision

Lead public copy with the practical user workflow:

```text
Ask the question.
Attach sources or saved context when the work needs proof.
Leave with reviewable work.
```

Use "saved context" for first-impression and public support copy. Use "ContextCapsule" when the page is intentionally explaining the underlying system, developer/runtime contracts, or capsule repository behavior.

## Current User-Facing Contract

- Home headline: "Ask anything. Leave with a sourced brief."
- Home helper: "Attach context capsules when the work has to hold up."
- Public primary CTA: "Continue".
- Public top nav: Home, Pricing, Learn, Guide, Release notes, Sign in, Start work.
- Public left rail: Ask and Saved context only. Do not expose Boardroom, Memo/Drafts, or internal tools before login.
- Login handoff: "Pick up the work where you left it.", "PRAXIS | Ask. Source. Review.", and "Free workspace includes Ask PRAXIS, saved context, source receipts, and draft tools."
- Guide headline: "Ask the question. Check the evidence. Save the work."
- Pricing headline: "Plans for people who need sourced policy work."
- Pricing tier language should use policy workspace, saved context, shared context library, and reviewable work before internal capsule vocabulary.
- OpenGraph and metadata should describe sourced policy work from hard questions, not capsule machinery first.

## Where Deeper Terms Belong

ContextCapsule language remains correct and should stay in:

- `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`
- capsule repository and builder surfaces
- capsule schema, runtime, and agent-contract code
- Learn sections explicitly marked for technical readers
- release history entries about historical capsule work

Do not remove technical terms from runtime contracts just to make public copy softer. The goal is simpler first contact, not erasing the hidden kernel.

## Test And Audit Guards

The copy contract is guarded by:

- `scripts/audit-public-surface.ts`
- `tests/unit/app/marketing-home-contract.test.ts`
- `tests/unit/copy-positioning.test.ts`
- `tests/unit/components/ask-context-bar-contract.test.ts`
- `tests/unit/components/futurist-ai-lab-contract.test.ts`
- `tests/e2e/capabilities-api.spec.ts`
- `tests/e2e/mobile-landing.spec.ts`

When changing public copy, update these contracts in the same commit. Run at least:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run audit:surface
npm run smoke:public
npm run test:mobile
```

## Ship Checklist

For live public-copy waves:

```powershell
git status --short --branch
git rev-list --left-right --count origin/main...HEAD
npm run typecheck
npm run lint
npm test
npm run build
npm run audit:surface
git push origin main
npm run deploy:frontend:cloud
```

Then verify:

- `https://praxis.tacitus.me/`
- `https://praxis.tacitus.me/pricing`
- `https://praxis.tacitus.me/guide`
- `https://praxis.tacitus.me/learn`
- `https://praxis.tacitus.me/release-notes`
- `https://praxis.tacitus.me/api/health`

Protected routes returning `401` without a session are expected.
