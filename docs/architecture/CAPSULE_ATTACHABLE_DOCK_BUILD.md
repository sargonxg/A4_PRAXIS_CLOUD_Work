# ContextCapsule — Attachable Capsule & Dock: Technical Build Recommendation

> Written 2026-07-08. Owner: Giulio Catanzariti. Audience: Fable/Codex build
> sessions. Companion doc: `CAPSULE_ONTOLOGY_SEMANTIC_STRUCTURE.md`.
> Grounded in the shipped V3 schema (`src/lib/context/capsule-v3.ts`), the
> dock helpers (`src/lib/context/active-context-stack.ts`), and the injection
> pipeline (`src/lib/context/context-injection.ts`).

## 1. What "attachable capsule" must mean technically

A capsule is attachable when a user (or agent) can take a self-contained,
versioned context object and bind it to a generation surface in one action,
and the generation pipeline treats that binding as **governing**, not
advisory. The system already has the right primitives; this doc fixes the
target architecture so future work composes instead of forking.

The four-layer contract (keep, do not reinvent):

| Layer | Canonical artifact | Rule |
|---|---|---|
| **Storage** | Firestore `ContextCapsules` (V3 doc) | Single source of truth. `identity.canonicalStore` is a literal for a reason. |
| **Binding** | `ActiveContextStackState.capsuleRefs` + four typed dock slots (`user` / `situation` / `tool` / `output`) | All attach/detach flows write through `assignCapsuleToDockSlot` / `clearCapsuleDockSlot`. One dock, one truth. No component keeps its own attached-capsule state. |
| **Compilation** | `resolveInjectableContext` → `[capsule_dock]` prompt layer with per-role contracts | The only place capsule content becomes prompt text. Boardroom, Ask, memos, agents all call this — never inline capsule text themselves. |
| **Proof** | AgentRun ledger rows carry `dockCapsuleIds` + compiled prompt block metadata | Every run records exactly which capsule versions governed it. |

**Invariant to enforce in review:** any new surface that "attaches" a capsule
must be expressible as *a write to the active context stack followed by a read
through `resolveInjectableContext`*. If it needs anything else, the design is
wrong.

## 2. The dock: recommended target architecture

### 2.1 Slot semantics (already shipped — freeze them)

- `user` — who is asking: perspective, mandate, voice.
- `situation` — the case: actors, claims, sources, graph context. Governs the
  stack pointer (primary capsule).
- `tool` — how to think: methods, frameworks, agent permissions.
- `output` — what to produce: memo/brief/handover contract.

Exactly four slots, ordered, each 0..1 capsule, plus an overflow list for
legacy refs. Do not add slot kinds; new capsule *types* map onto existing
slots via taxonomy (`type:*` facet → default slot), which keeps the UI stable
while the catalog grows.

### 2.2 Pinning and versioning

Attachments must be **version-addressable**: `{capsuleId, version | 'latest'}`.
- Default: track latest (current behavior, `versionLabel: 'latest'`).
- Add (near-term): explicit pin at attach time for regulated workflows —
  a briefing built in June must be reproducible against the June capsule.
  The ref shape already carries `version: number | null`; the work is a
  pin/unpin affordance in the dock chip and honoring the pin in
  `resolveInjectableContext` (load `profile_versions`-style snapshot).

### 2.3 Attach flows (all write through the same helpers)

1. **Repository card → slot-aware Add** — card proposes the slot from the
   capsule's `type:*` facet, writes `assignCapsuleToDockSlot`.
2. **Inspect panel → Add to dock** — same call, explicit slot choice.
3. **Boardroom sidebar → inline picker** — same call; run request already
   compiles the dock, so no backend change.
4. **Agent proposal** — an agent may *propose* a dock change as a review card;
   only human confirmation calls the helper (invariant: agents propose,
   humans mutate).
5. **Deep link** — `?dock=<slot>:<capsuleId>` on cockpit URLs for shareable
   pre-docked workspaces (small parser, still calls the same helper).

### 2.4 Compilation budget

The `[capsule_dock]` layer must stay inside a fixed token budget with
deterministic truncation order (output contract > tacit red lines > claim
ledger top-N by load-bearing rank > source spine tier-1 > graph summary >
the rest). Truncation must emit a receipt (`dockCompilation.truncated: [...]`)
so the run ledger shows what the model did *not* see. This is the single
most important reliability improvement for capsule-governed generation.

## 3. Capsule portability (the "attachable anywhere" story)

Capsules should travel: DIALECTICA → PRAXIS today; PRAXIS → export, fork,
marketplace, other TACITUS apps tomorrow. Recommendation:

- **Interchange format = the V3 JSON document itself**, wrapped in a signed
  envelope: `{ format: 'tacitus.capsule.v3', payload: ContextCapsuleV3,
  provenance: { origin, exportedAt, parentCapsuleId?, contentHash } }`.
  No second schema. Import validates with `CapsuleAnyVersionSchema` and
  upgrades V1/V2 → V3 through the existing migration path.
- **Lossless import invariant** (already a hard rule for DIALECTICA): ontology
  bindings, embedded graph, claim ledger are preserved verbatim and rendered;
  never flattened to prose.
- **Fork = copy + provenance reset**: new `capsuleId`, `capsuleVersion: 1`,
  `marketplaceProfile.parentCapsuleId` link, review states downgraded
  (`canonical` → `reviewed`) because the forker's org has not re-approved
  them. Trust semaphores recompute on the fork, not inherited.
- **Later (only when a second consumer exists):** expose capsules as MCP
  resources (`capsule://{id}@{version}`) from a thin read-only server, so
  external agent runtimes can dock PRAXIS capsules. The envelope above is
  already the right payload; do not build this before there is a consumer.

## 4. Build sequence (maps to HANDOVER P-queue)

1. **P4** Repository facets + slot-aware Add — makes attach a one-click,
   type-correct action from the library.
2. **P6** Boardroom inline dock picker — dock parity across surfaces.
3. **P2/P8** Inspect depth + fork provenance — trust before adoption.
4. Dock compilation budget + truncation receipts (§2.4).
5. Version pinning (§2.2), deep-link docking (§2.3.5).
6. Signed export envelope (§3) when marketplace/sharing lane opens.

## 5. Anti-patterns (refuse in review)

- A component storing "its" attached capsule in local state or a new store.
- A route building capsule prompt text without `resolveInjectableContext`.
- A second capsule schema "just for transport/import".
- New dock slot kinds for new capsule categories.
- Agent code mutating dock or capsule content without a human gate.
