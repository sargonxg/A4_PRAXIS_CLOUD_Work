# Hero Animation + Context Core Narrative — Ideation

Date: 2026-05-13
Status: Ideation only. No code changes yet.
Author: Claude (caveman mode), with Giulio.

---

## 0. Problem

Current hero (`src/components/landing/phase8-wow-landing.tsx`) on `/` is a static
two-column block: left headline + CTAs, right grid of six `ContextCard`s plus a
numbered workflow list. It is honest but dead. It does not show:

- What a "core" actually *is* (layered, alive, inheritable).
- Why context cores matter for **hybrid agentic teams** (humans + agents
  sharing the same posture).
- How tacit knowledge gets crystallised, packaged, and handed over.
- The trust strata underneath answers.
- The futuristic / institutional vibe TACITUS owns (broadsheet gravitas +
  operations-room control).

App home (`src/components/dashboard/ask-praxis-home.tsx`) also leans on text-
heavy headers and a static "Context coverage" sidebar. Same six-core stack
appears as pill chips with no life and no signal of health, inheritance, or
sharing.

This doc collects every animation, layout, copy, and architecture idea worth
considering, then proposes a recommended path. No code yet.

---

## 1. Conceptual Vocabulary We Are Selling

The animation has to *teach* these in roughly this order, in ~8 seconds of
ambient motion:

1. **Six Cores** — User, Situation, Source/Document, Graph, Time, Output.
   Each is a structured, inspectable object, not a prompt.
2. **Tacit → Structured** — what a senior analyst "just knows" is captured
   inside the cores (mandate, lenses, red lines, audience, frame, posture).
3. **Trust Strata** — every core exposes its own readiness: source receipts,
   temporal posture, graph coverage, calibration version, citation density.
4. **Inheritability** — a core stack travels. Pass it to a colleague, to an
   agent, to a future-you. Same context, same posture, same answer surface.
5. **Hybrid Agentic Teams** — humans and agents subscribe to the *same*
   cores. Policy reasoning is grounded because the substrate is shared.
6. **Packaging + Sharing** — cores can be bundled (a "context capsule",
   "cartridge", "core pack") and shipped, forked, versioned.

Everything below serves these six beats.

---

## 2. Animation Concepts (Hero Window)

### 2.1 Concept A — **Core Forge → Hybrid Mesh** (recommended)

A two-act WebGL/SVG animation. ~9 seconds loop, scrubbable on scroll.

**Act 1: The Forge (0–4s)**
- Background: deep navy (`#0F172A`) with subtle noise grain.
- A storm of raw input motes drifts in from the left edge: tiny rectangles
  representing PDFs, RSS items, cables, voice notes, briefing pages,
  Slack-like blips, chart fragments. Each mote carries a faint label
  ("UCDP", "FCDO brief", "Cable 2024-08", "tacit: red lines").
- A hexagonal "forge chamber" sits centre. Motes spiral inward and collapse
  into **six glowing prisms**, one per core, each a different facet:
  - User Core — a persona ring with role/lenses/red-lines etched as
    concentric arcs.
  - Situation Core — a small actor graph rotating inside a frame.
  - Source/Document Core — a vertical stack of receipt slips with stamped
    page-spans.
  - Graph Core — a 3D lattice of nodes/edges (ACO entities + relations).
  - Time Core — a bitemporal double-dial clock (valid time / record time).
  - Output Core — a folded memo with cited brackets.
- Each prism settles into a hex slot. Gold filaments (`#E8B931`) connect
  them, forming a single **Context Capsule** silhouette.

**Act 2: The Mesh (4–9s)**
- Camera pulls back. The Capsule docks at a central hub.
- Around the hub, six silhouettes light up in a ring: three human analysts,
  three agents (subtly differentiated — humans have a soft halo, agents
  have a faint dotted ring). All six pulse in sync with the Capsule.
- A new fact ("Source: ICG report 2026-04-22") streams into one human node.
  It travels back into the Capsule's Source Core stratum, then radiates
  outward to every other node in the mesh. Tacit becomes shared.
- A second pulse: an agent proposes a graph patch. It travels into Graph
  Core, gets flagged "proposed", glows amber until a human node taps it
  approved. Then it goes green and ripples back.
- Final frame: Capsule pulses once. Subtitle fades in beside it:
  "One core stack. Many minds. Same posture."

**Why this works:**
- Teaches all six concepts in order: structuring, packaging, inheritance,
  hybrid teams, proposal/approval trust loop.
- Uses the existing palette (navy / gold / cream) — looks like TACITUS not
  generic SaaS gradient slop.
- Loop-friendly: Capsule reset back to the storm is graceful.

**Implementation tech:**
- React + Framer Motion for choreography, SVG for cores (vector-clean at
  any size), tiny WebGL canvas for the mote storm only (heavier).
- Respect `prefers-reduced-motion`: collapse to a static composed frame
  showing the final mesh state.

### 2.2 Concept B — **Trust Strata Drill** (alternative)

Vertical "core sample" drilled into the earth, geology style. Six bands top
to bottom, each labeled and textured differently:
1. Tacit layer (gold flecks in dark substrate — "what a senior just knows")
2. Sources (paper-strata, page-span numbers visible on the side)
3. Graph (lattice substrate with edges)
4. Time (concentric tree-ring annual cycles)
5. Persona (etched analyst silhouette)
6. Output (folded memo paper at base)

A glowing analysis ring travels up and down the core, illuminating each
band and showing its trust score on the right (e.g. "Source: 14 receipts,
2 gaps", "Time: 2026-04 horizon set"). Red bands flash where gaps exist.

**Why this works:** very visceral metaphor for "we expose substrate other
products hide". Photo-realistic-ish, broadsheet-feeling.

**Why not primary:** less about *sharing/hybrid* and more about
*inspection*. Better as the **trust section** scroll-stop, not the hero.

### 2.3 Concept C — **Cartridge Pack** (alternative)

Six 3D cartridges (think SNES cartridges meets museum specimen drawer)
labeled with their core name. They float in formation. User can hover/drag
to reorder. Each cartridge has a transparent window showing its inner
structure (mini-graph, mini-clock, etc.). A "Pack" button slides them into
a slot in a device labeled `praxis://capsule/indo-pacific-2026`. Then the
device emits the pack across a wire to a second device labeled
`praxis://team/jane.doe`.

**Why this works:** literal "package and share" metaphor. Tactile.
**Why not primary:** risks feeling toyish / gamey for a diplomacy product.
Better as a **secondary section animation** for "Packaging & Sharing".

### 2.4 Concept D — **Bitemporal Constellation**

A starfield where each star is a claim. Stars are connected by lines (the
graph). Two time axes drift across the field (valid time pan + record-time
zoom). Source receipts orbit each star. Tacit-knowledge motes weave between
them. Camera does a slow Ken-Burns.

**Why this works:** beautiful, instantly futuristic, fits "policy as
constellation".
**Why not primary:** harder to read. Save it for the **Situation
Intelligence** section.

### 2.5 Concept E — **The Compaction Sequence**

Left third: chaos column. RSS items, PDFs, chat logs, briefings raining
down. Middle third: a compaction wheel (think pasta extruder x policy
ops) grinds them into six neat cores. Right third: split-screen of analyst
+ agent both drafting from the same docked cores.

**Why this works:** clearly states "we compress huge mess into structured
context that humans + agents share".
**Why not primary:** the wheel metaphor is funny but a bit literal /
manufacturing. Could work for an explainer scrollytell.

### 2.6 Concept F — **Inheritance Tree**

A persona at the root. A "Senior Diplomat: Latin America Desk" core
crystallises out of them. The core forks: a junior analyst inherits it; a
research agent inherits it; a memo studio inherits it. Each fork shows
slightly different output (junior's memo is more cautious; agent's draft
has more receipts; memo studio has the final cited version). A pulse runs
back up the tree showing learnings travelling home.

**Why this works:** literalises the "inheritable" promise.
**Why not primary:** more of a *feature explainer* than a hero hook.

### 2.7 Concept G — **The Capsule X-Ray** (subtle ambient option)

Static-ish hero. A single semi-transparent ampoule/capsule centred. Inside,
six layered strata gently breathe. On scroll, the capsule rotates
slightly. On hover, a layer separates and labels itself. No big motion;
quiet authority.

**Why this works:** maximum institutional restraint. Lets the copy do the
work.
**Why not primary:** Giulio said current hero is "bad" and wants something
"really animated / really showing futuristic". G is the opposite end.

---

## 3. Recommended Animation Plan

**Primary hero:** Concept A — *Core Forge → Hybrid Mesh*.
**Trust section:** Concept B — *Strata Drill* as the scroll-stop visual
where today the static "Trust is visible" grid sits.
**Packaging section (new):** Concept C — *Cartridge Pack* as the explainer
for shareable / forkable cores.
**Situation Intelligence section (existing):** Concept D — *Bitemporal
Constellation* in the "Make reasoning structure visible" panel.

Concepts E, F, G live in the parking lot.

---

## 4. Landing Page Structure Revision

Current order: hero → 4-step workflow → 3 proof panels → trust grid →
pricing nudge. Proposed:

1. **Hero — Core Forge → Hybrid Mesh.** Headline + capsule animation.
2. **What a Core Is.** Six expandable cards (one per core) with their
   inner structure preview. Hover = zoom into that core's mini-visual.
3. **Hybrid Teams Share Context, Not Prompts.** Side-by-side: traditional
   "everyone prompts from blank" vs PRAXIS "everyone inherits the same
   core stack". Animated comparison.
4. **Trust Strata.** Concept B drill, with the four trust items from the
   existing `trustItems` array re-rendered as drill labels.
5. **Package, Share, Fork.** Concept C cartridge pack, with three real
   product moves: *share with team*, *fork for new desk*, *version
   snapshot for the record*.
6. **One Loop.** Keep the four-step workflow but render as a horizontal
   timeline under the cartridge section.
7. **Open the Workspace.** Existing CTA strip.

Total: 7 scrolls. Each scroll has one animated focal element + one
sentence + one CTA. Broadsheet rhythm, not infinite-scroll marketing soup.

---

## 5. Copy Rewrites

### Hero

Current H1: *"PRAXIS builds inheritable policy cores."*
Options, ranked:
1. **"Context cores. Inherited, not improvised."**
2. *"Policy work runs on tacit knowledge. Now it inherits."*
3. *"Six cores in. One memo out. Shared with your team — human or agent."*
4. *"The substrate underneath policy answers."*

Recommended: **#1**, with subhead from #3.

Current subhead: long. Cut to:
> *"Package the User, Situation, Source, Graph, Time, and Output that
> make your judgement work. Hand it to a teammate, an agent, or your
> future self."*

### Hybrid Teams section (new)

> *"Hybrid teams don't fail at access. They fail at posture. PRAXIS gives
> humans and agents the same six cores so reasoning, citations, and red
> lines travel with the work — not with the person."*

### Trust section

Replace *"Trust is visible before PRAXIS reasons."* with:
> *"Trust has strata. We expose every one."*

### Packaging section (new)

> *"A core stack is a working artefact. Ship it, fork it, version it."*

### App home (`ask-praxis-home.tsx`) headline

Current: *"Ask, research, stress-test, draft, and hand over from the
active core stack."*
Replace with:
> **"Six cores attached. Ask anything."**
> *"Your User, Situation, Source, Graph, Time, and Output cores are live.
> PRAXIS reasons from them, exposes their gaps, and keeps them in sync
> with every teammate or agent on this Situation."*

---

## 6. App-Side Animations

### 6.1 Live Core Stack chips (top of Ask PRAXIS)

Today: static pill row.
Proposal: each pill becomes a **breathing core**:
- Pulse rate = freshness (a stale Source Core breathes slowly + cool tint).
- Inner halo intensity = trust score (a thin Source Core = pale; a thick
  one = saturated gold).
- Click = "core panel" slides in from right showing inner structure
  (graph mini-view for Graph Core, etc.).
- Hover = ghost outline of *what would change* in the next answer if this
  core were swapped.

### 6.2 Hybrid presence indicator

Tiny avatar cluster under the chips: who else is subscribed to this core
stack right now (collaborators + active agents). Agent dots have a dotted
ring. When an agent proposes a graph patch, the Graph Core chip glows
amber until reviewed. This is the *hybrid agentic* UI cue.

### 6.3 Inheritance trail on memo open

When user opens a memo derived from a core stack, briefly animate (~600ms)
the six cores flowing from the header into the document body. Visceral
cue: this draft *inherits*, it doesn't *prompt*.

### 6.4 Capsule export / share

In the situation header, an "Export capsule" affordance opens a small
modal showing the cartridge animation (Concept C). User picks scope
(strip secrets / include receipts / freeze graph version) and ships.

### 6.5 Context coverage strip → Trust Strata mini

Replace the right-hand `Context coverage` sidebar list with a vertical
mini-drill (Concept B at 240px). Same labels, but the bands fill in real
time. Click a band = jump to that core's editor.

---

## 7. Technical Notes

- **Performance:** hero animation must stay under 250kb gz JS and hit 60fps
  on M-series + mid-range Windows laptops. SVG-first with one small WebGL
  pass for the mote storm only.
- **Reduced motion:** every concept needs a static "end state" frame as
  fallback. Capture the Capsule + Mesh final composition as an SVG.
- **Server component boundary:** keep `(landing)/page.tsx` server, push
  animations into a single `"use client"` island. JSON-LD stays server.
- **Asset budget:** prefer inline SVG for cores; ship one 30kb webp for
  the mote-storm noise tile. No Lottie (locks us to After Effects).
- **A11y:** every animated label must also be present as ordered DOM text
  for screen readers. Animation is decorative on top of legible content.
- **Telemetry:** instrument a single `hero_animation_phase` event (forge
  start, capsule complete, mesh complete) so we can A/B against a static
  control.

---

## 8. Open Questions for Giulio

1. Is the **hybrid agentic** narrative (humans + agents inheriting same
   cores) ready to be the headline promise on the public landing, or does
   it still feel ahead of where we can demo? If yes, Concept A as
   designed. If "almost", we trim the agent silhouettes from Act 2 and
   keep it human-only for v1, then add agents in v2.
2. Should the hero loop, or play once and freeze on the Mesh final
   frame? (Recommend: play once on first view, freeze; replay on scroll-
   back-to-top.)
3. Do we want a third visual register beyond navy + cream + gold for the
   six cores (each core a distinct accent tint), or keep mono-gold to
   stay institutional? (Recommend: each core gets a *very* desaturated
   distinct tint inside its prism, but the connecting filaments are all
   gold so the system reads as one.)
4. Packaging vocabulary: **capsule**, **cartridge**, **core pack**,
   **dossier**, **kit**, **bundle**? Pick one and ride it everywhere.
   (Recommend: **capsule** for the artefact, **pack** for an assembled
   shareable bundle of capsules.)
5. Where does Cognee / memory layer surface in the animation? Currently
   absent. Option: a seventh quiet stratum inside the Capsule labelled
   "Memory" that *only appears for authenticated workspaces*, not on the
   public landing. (Recommend.)

---

## 9. Out of Scope For This Doc

- Pricing page redesign.
- `/app/workbench` graph view (separate ideation).
- Demo mode storytelling.
- Mobile-specific reductions (will follow once desktop is locked).

---

## 10. Next Step

Wait for Giulio to react to: (a) recommended Concept A, (b) section order
in §4, (c) copy in §5, (d) packaging vocabulary in §8.4. Then convert the
agreed subset into an implementation plan via `writing-plans`.
