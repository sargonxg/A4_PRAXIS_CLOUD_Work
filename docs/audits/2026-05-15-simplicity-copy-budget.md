# PRAXIS Simplicity Copy Budget

Date: 2026-05-15

## Primary Surface Contract

Visible navigation should stay focused on six user-facing rooms:

- Home: choose or create context, then ask.
- Ask PRAXIS: ask from the active core stack.
- Library: upload documents and sources into knowledge cores.
- Memo Studio: write from the active context.
- Canvas: inspect or arrange context when needed.
- Advanced: detailed tools, graph review, ACH, Boardroom, settings, diagnostics, and admin.

## Current Pass

| Route | Tier | Budget | Status |
| --- | --- | --- | --- |
| `/` | Primary public | One clear hero message, one primary CTA above fold, simple context animation | Updated |
| `/app/dashboard` | Primary app | Ask box, active context, create context, 2-3 next actions | Updated first viewport; dense workbench remains below |
| `/app/assistant` | Primary app | Ask from active stack, suggested actions only | Needs future copy pass |
| `/app/workbench` | Primary app | Operational Library for sources/documents/cores | Covered by Library workstream; needs visual pass |
| `/app/write` | Primary app | Draft from active context | Needs future copy pass |
| `/app/canvas` | Primary app | Inspect/arrange context | Needs future copy pass |
| `/app/contexts` | Secondary management | Compact Core Library, manage stack on demand | Updated |
| `/app/cores/user` | Secondary maintenance | Concise status and edit actions | Updated |
| `/app/cores/context` | Secondary maintenance | Create context, attach sources, open Ask | Updated |
| `/app/tools` | Advanced | Deep controls and diagnostics | Existing Advanced destination |

## Remaining Flags

- `/app/assistant`, `/app/write`, `/app/canvas`, and nested workbench chapters still need the same one-H1, one-sentence, max-three-action budget applied.
- Some legacy tests and helper names still use `Tools` and `Cores` internally for keyboard shortcuts and compatibility routes. User-facing primary nav now labels the visible destination as `Advanced`.
- Advanced explanations should continue to use the shared collapsed panel pattern instead of page-level architecture prose.
