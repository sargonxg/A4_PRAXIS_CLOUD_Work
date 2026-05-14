# PRAXIS Design Rules — locked

Date: 2026-05-14
Status: Active. Every new PR must comply.

These seven rules exist so PRAXIS reads like a foreign-affairs
publication that happens to be software, not like the generic
gradient-and-emoji output of an off-the-shelf coding agent. Audits
in `audit:simplification` already enforce some of these; visual
ones are enforced by review.

---

## Rule 1 — Two actions per page

Every user-facing page has exactly one primary action and at most
one secondary action above the fold. If a screen needs more, the
extras live behind an "Advanced" disclosure.

Enforcement: future `audit:two-actions` script. Manual until then.

## Rule 2 — No emoji icons

Icons are Lucide line icons only. Mono colour. No emoji glyphs in
labels, buttons, or any user-facing copy. Emoji in code comments is
acceptable.

Enforcement: `audit:no-emoji-icons` script (planned).

## Rule 3 — Typographic register

| Surface | Family |
|---|---|
| Headings (H1, H2, H3) | EB Garamond, serif |
| UI text (labels, buttons, body) | Inter, sans-serif |
| Receipts, citations, IDs, page-spans, machine output | JetBrains Mono |

Never use a sans for a heading or a serif for a button. Receipts
(`[§4, p.12]`, `UCDP·CY-2026`) are always mono.

## Rule 4 — Empty states ≤ 6 words

Short, warm, declarative. Never apologetic. Examples:

- "No capsule yet. Build one."
- "Nothing here. Try Ask."
- "No receipts attached."

Anti-examples (do not ship):

- "It looks like you haven't created any capsules yet. Click the
  button below to get started."
- "We couldn't find any results matching your search."

## Rule 5 — No gradient blobs, no neon, no glow buttons

No multi-stop background gradients on hero / feature surfaces. No
saturated neons. No drop-shadow "glow" on action buttons. The only
accent in the system is `gold #E8B931` on a single primary action.
Everything else is grayscale, navy, or cream.

Vignettes inside SVG illustrations (the hero capsule animation) are
permitted because they read as photographic depth, not as marketing
blob.

## Rule 6 — Receipt-card pattern for citations

A cited claim never renders as a generic chip or pill. It renders as
a **receipt slip**: dark navy background, gold left border, page-span
stamp in mono on the right. Example:

```
┌────────────────────────────────────────┐
│  CLAIM · ICG report 2026-04-22 · §4    │ p.12 │
└────────────────────────────────────────┘
```

Component: `src/components/shared/receipt-card.tsx` (to be built; for
now the pattern is established by the SVG slips inside the hero
animation).

## Rule 7 — Specimen-card pattern for cores

A core (User / Situation / Source / Graph / Time / Output) never
renders as a Material Design tile or generic card. It renders as a
**museum specimen**: a glass-square frame with a serial number in
mono and a single line of essence inside. Example:

```
┌──────────────────────┐
│  PRX-CORE-USR-202604 │
│                      │
│   Senior Analyst     │
│   Indo-Pacific desk  │
└──────────────────────┘
```

Component: `src/components/cores/specimen-card.tsx` (to be built).

---

## Anti-patterns we will refuse

- Three-column "Features" grid with check-mark bullets
- Hero with a giant gradient blob behind the headline
- "Sign up free!" CTA with a colour gradient
- Decorative emoji in a section header ("✨ AI-powered ✨")
- Floating chat bubble in the bottom-right that pulses

If you see any of these in a PR, request changes citing this doc.

---

## How to apply

When in doubt:

1. Open `praxis.tacitus.me` and the landing hero. The vibe there is
   the vibe everywhere.
2. Strip everything until the screen says one thing.
3. Add the gold accent only on the single action the user is most
   likely to take.
4. Re-read your text and cut it in half.
