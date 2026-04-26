# PRAXIS Persona Walkthroughs

This directory holds scenario-driven user-side testing artefacts. Every
brick that ships to `main` should trigger at least one persona walkthrough
in here so future agents can see how PRAXIS feels for real users at every
release boundary.

## Layout

```
docs/personas/
├── README.md                              # This file.
├── PERSONA_WALKTHROUGHS_<YYYY-MM-DD>.md   # Dated walkthrough bundle.
└── ...                                    # Future bundles by date.
```

## How to write a walkthrough

1. **Pick a scenario** — name a real decision the persona is trying to
   make. Avoid generic "explore the app" walkthroughs.
2. **Walk the path** — open PRAXIS as that persona for 8-10 minutes.
   Include screenshots / clipboard quotes where useful.
3. **Capture friction** — three to five concrete points. Tag them
   🔴 high / 🟡 medium / 🟢 low impact.
4. **Map to bricks** — every friction point maps to a brick in
   `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` or
   `docs/NEXT_BRICKS_2026-04-26.md`. If no brick exists, propose one.
5. **Note what was tested today** — green-tick the bricks that already
   improved this persona's experience this week.
6. **Append** — add the walkthrough as a new section in the most recent
   dated bundle, or start a new dated bundle if the previous is older
   than a week.

## The five canonical personas

These are the personas every walkthrough should rotate through:

| Persona | Anchor scenario |
|---|---|
| UN/OSCE diplomat | Morning brief before a UNSC informal consultation |
| Humanitarian lead | Cluster meeting at 15:00 with IPC + funding gap |
| Legal analyst | Steering committee on UNSC/ICC/ICJ tracks |
| Mediator | Dry-run for tomorrow's mediation session |
| Researcher / policy analyst | End-of-quarter dossier with source provenance |

These are documented in detail in
`docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` (Persona Test Matrix) and
in the latest walkthrough bundle.

## Why this matters

- Two themes hit **every** persona: citation/provenance gap and
  persistence vocabulary drift. Lane D (shared primitives) and Codex's
  brick #1 (tool id canonicalization) close these themes.
- A walkthrough caught the legal-tracker calibration bug that shipped
  the same week. Walking the personas is faster than reading code.
- This is also the artefact that turns into product copy, sales
  collateral, and onboarding playbooks. Capture it once, reuse it
  many times.
