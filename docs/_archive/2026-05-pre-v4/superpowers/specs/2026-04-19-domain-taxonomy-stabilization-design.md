# PRAXIS — Domain Taxonomy + Dashboard Stabilization

**Date:** 2026-04-19
**Status:** Approved (user grant: "I trust you — keep building")
**Owner:** @Sargonx
**Supersedes nothing.** **Extends:** `2026-04-18-user-onboarding-tool-calibration-design.md`
**Implements:** Sub-projects #0 (stabilize) and #1 (domain taxonomy) from session 2026-04-19.

---

## 1. Problem

PRAXIS has three blockers to shipping:

1. **Dashboard is broken for real users.** `/app/dashboard` throws React minified error #300 for authenticated non-demo users. Root cause is a re-render loop from unmemoised context values and un-selected Zustand subscriptions, not the `GlaslStageMeter` NaN guard already added.
2. **No domain classification.** User profiles carry a list of `lenses[]`, but there is no top-level domain categorisation for users OR situations. Tools cannot route prompts, feeds, or frameworks by domain context. A humanitarian analyst investigating a climate-displacement event and a diplomat tracking a treaty negotiation get the same generic prompt scaffolding.
3. **Taxonomy frozen in code.** The 9-entry `LENSES` enum lives in `src/types/analyst-profile.ts`. Changing it requires a deploy. No admin path. No versioning. No per-situation override.

This design fixes all three in one pass: stabilise the dashboard, then ship a **domain taxonomy stored as live Firestore configuration** with a prototypal-inheritance resolver so every domain extends a shared `generic` baseline. All downstream tools read the merged result through the existing `buildCalibratedContext` — no new middleware, no per-tool wiring.

---

## 2. Goals and non-goals

### Goals

1. Dashboard renders without error for onboarded non-demo users — root cause fixed, not patched.
2. 11 domains live in `config/domains/*` (generic + 10 specific). Each is a single Firestore document editable via admin UI with zero deploy.
3. `generic` doc is the baseline every other domain inherits from. A user or situation with no domain set silently resolves to `generic`. Today's behaviour is preserved byte-for-byte for un-tagged entities.
4. Users tag themselves with `primaryDomain` (+ up to 3 `secondaryDomains`) during onboarding Step 2. Editable from Settings at any time. Version bump on change.
5. Situations are auto-classified into a single `domain` at creation by a Gemini Flash classifier. User confirms or overrides in the wizard.
6. `buildCalibratedContext` merges user × situation × domain into `<domain-frame>` inside `systemPromptBlock`. Every calibrated AI route inherits this automatically.
7. Zero hardcoded domain identifiers outside `config/domains/`, `scripts/seed-domains.ts`, types, and tests. CI guard enforces.
8. Frontend redeployed within the spec's merge-to-main window.

### Non-goals

- Migrating Plan B tools in this pass (Sub-project #3, separate spec).
- Multi-profile-per-user (one `primaryDomain` per user, consistent with existing single-profile contract).
- Cross-situation domain inheritance (each situation classified independently).
- Auto-domain-assignment for existing situations (lazy — next `buildCalibratedContext` call classifies).
- Translating domain labels into UN six languages at v1 (English source of truth; i18n layer comes with Tier 4 polish).

---

## 3. Architectural spine

```
config/domains/generic              ← Firestore, source of truth, baseline
config/domains/armed-conflict-security
config/domains/diplomacy-negotiation
config/domains/humanitarian
config/domains/human-rights
config/domains/governance-rule-of-law
config/domains/economic-sanctions
config/domains/development-stabilization
config/domains/climate-environmental-security
config/domains/information-cyber
config/domains/transnational-threats

         │ read
         ▼
src/lib/domain/resolve.ts          ← resolveDomain(domainId) → merged DomainConfig
         │ (5-min Runtime Cache, per-region)
         ▼
src/lib/context/profile-context.ts ← buildCalibratedContext (existing)
     pulls:
       - user.profile.perspective.primaryDomain
       - situation.domain
     resolves BOTH to merged DomainConfig
     emits <domain-frame> into systemPromptBlock

         │
         ▼
All 40 AI tools — already wrapped in withCalibration — automatic pickup.
```

### Invariants

1. **Generic is a domain, not a special case.** Its document in Firestore has `parentId: null`. Every other domain has `parentId: 'generic'`. Resolution is `Object.assign({}, generic, specific)` with deep merge on `lensWeights` and `promptOverrides` only.
2. **No route, tool, or component references a specific domain id by string literal.** All domain-aware logic reads `domain.id`, `domain.preferredFeeds`, `domain.frameworks`, `domain.promptOverrides[toolId]` — never `if (domainId === 'humanitarian')`.
3. **Every tool output already stamps `profileVersion`.** Adds: `domainVersion` (from the domain doc at calibration time) and `situationDomain` (the domain string itself, for BigQuery querying). Profile + domain versions together let the audit reconstruct calibration state for any historical output.
4. **Resolution is cached but bypassed on mutation.** `updatedAt` on any `config/domains/*` doc triggers a `config.domain.changed` Pub/Sub message. Consumers bust the Runtime Cache for that domain id.
5. **Dashboard hook contract is immutable.** After the stabilisation fix, `DashboardPage` calls exactly the same ordered set of hooks on every render regardless of profile/situation state. Conditional branches live below the hook fence.

---

## 4. Data model

### 4.1 Firestore schema

```
config/domains/{domainId}
  id                 string                     // machine id, kebab-case, matches doc id
  name               string                     // display
  description        string                     // 1-2 sentences, shown in UI pickers
  parentId           string | null              // null ONLY for 'generic'; all others = 'generic'
  lensWeights        { [Lens]: number }         // deep-merged over parent; 0.0-2.0 range
  preferredFeeds     string[]                   // subset of FEED_REGISTRY ids; empty = inherit
  frameworks         string[]                   // preferred framework ids from frameworks.ts
  promptOverrides    { [toolId]: string }       // domain-specific prompt fragment; missing = parent
  defaultAudience    Audience | null            // optional hint for fresh profiles
  colorHex           string                     // for UI
  icon               string                     // lucide icon name
  version            number                     // bumps on structural edit
  schemaVersion      number                     // increments when DomainConfig shape changes
  updatedAt          Timestamp
  updatedBy          string                     // uid of last editor

config/domains_meta/current                      // single doc
  schemaVersion      number                     // must match code's DOMAIN_SCHEMA_VERSION
  migrations         string[]                   // applied migration ids
  lastSeededAt       Timestamp
```

### 4.2 Extension of AnalystProfile

`src/types/analyst-profile.ts`:

```ts
perspective: {
  ...existing fields,
  primaryDomain:    DomainId;    // 'generic' is the default, always valid
  secondaryDomains: DomainId[];  // 0-3 items, must not contain primaryDomain
}
```

`isProfileComplete` unchanged — domain has a valid default, so it cannot block completion. Migration: existing profiles without `primaryDomain` lazily upgraded to `'generic'` on first read.

### 4.3 Extension of Situation

`users/{uid}/situations/{sitId}`:

```
domain                     DomainId        // 'generic' if not yet classified
domainConfidence           number          // 0-1 from classifier, 1 if user-set
domainOverriddenByUser     boolean         // true once user changes the classifier's pick
domainVersion              number          // version of config/domains/{domain} at write time
domainClassifiedAt         Timestamp
```

Situations predating this release are read as `domain: 'generic'` without write. Next situation edit triggers a classifier run if `domainClassifiedAt` is missing.

### 4.4 Firestore security rules

```
match /config/domains/{domainId} {
  allow read: if request.auth != null;
  allow write: if false;   // admin-only via Admin SDK through /api/admin/domains
}
match /config/domains_meta/current {
  allow read: if request.auth != null;
  allow write: if false;
}
```

Admin writes go through Admin SDK in `/api/admin/domains/[id]` PATCH; the route gates on an `ADMIN_ALLOWLIST` env var (comma-separated uid list), not client-side claims.

### 4.5 BigQuery additions

Extend existing `praxis_analytics.tool_outputs` (from 2026-04-18 spec) with:

```
domain_id          STRING
domain_version     INT64
```

New table:

```
praxis_analytics.domain_changes
  event_id         STRING
  domain_id        STRING
  prev_version     INT64
  new_version      INT64
  changed_fields   ARRAY<STRING>
  changed_by       STRING     -- uid
  changed_at       TIMESTAMP
```

---

## 5. The 11 domains — initial seed

All extend `generic`. All `lensWeights`, `preferredFeeds`, `frameworks`, `promptOverrides` values below are **overrides**; unspecified fields inherit from `generic`.

### 5.1 `generic` (the baseline)

```yaml
id: generic
parentId: null
lensWeights:
  diplomatic: 1.0
  security: 1.0
  humanitarian: 1.0
  economic: 1.0
  legal_ihl: 1.0
  human_rights: 1.0
  development: 1.0
  mediation: 1.0
  climate_security: 1.0
preferredFeeds: []                 # empty = all feeds eligible, no down-ranking
frameworks:                        # all 15, analyst chooses
  - glasl_escalation
  - fisher_ury
  - inform_risk
  - barnett_duvall_power
  - zartman_ripeness
  - stedman_spoilers
  - mitchell_agle_wood
  - ocha_humanitarian
  - ipc_food_security
  - lederach_pyramid
  - galtung_triangle
  - un_dppa_brief
  - berghof_mediation
  - putnam_two_level
  - fearon_rationalist
promptOverrides: {}                # tools use their unmodified base prompt
defaultAudience: myself
colorHex: '#0F172A'                # navy (platform default)
icon: Compass
```

### 5.2 `armed-conflict-security`

Overrides — `lensWeights: { security: 1.8, diplomatic: 1.3, humanitarian: 1.2, mediation: 1.3, legal_ihl: 1.3 }` · `preferredFeeds: ['acled', 'ucdp', 'gdelt', 'unhcr']` · `frameworks` led by `glasl_escalation, stedman_spoilers, fearon_rationalist` · `colorHex: '#A63D40'` · `icon: Shield`.

### 5.3 `diplomacy-negotiation`

`lensWeights: { diplomatic: 2.0, mediation: 1.8, legal_ihl: 1.3 }` · `preferredFeeds: ['un_news', 'reliefweb', 'crisis_group']` · `frameworks` led by `fisher_ury, zartman_ripeness, berghof_mediation, putnam_two_level` · `colorHex: '#1B3A5C'` · `icon: Users`.

### 5.4 `humanitarian`

`lensWeights: { humanitarian: 2.0, development: 1.3, human_rights: 1.3 }` · `preferredFeeds: ['reliefweb', 'unhcr', 'hdx', 'ocha']` · `frameworks` led by `ocha_humanitarian, ipc_food_security, galtung_triangle` · `colorHex: '#E8B931'` · `icon: HeartHandshake`.

### 5.5 `human-rights`

`lensWeights: { human_rights: 2.0, legal_ihl: 1.6, humanitarian: 1.3 }` · `preferredFeeds: ['ohchr', 'amnesty', 'hrw', 'reliefweb']` · `frameworks` led by `galtung_triangle, lederach_pyramid` · `colorHex: '#F72585'` · `icon: Scale`.

### 5.6 `governance-rule-of-law`

`lensWeights: { diplomatic: 1.3, legal_ihl: 1.5, development: 1.3 }` · `preferredFeeds: ['un_news', 'world_bank', 'crisis_group']` · `frameworks` led by `putnam_two_level, mitchell_agle_wood` · `colorHex: '#4CC9F0'` · `icon: Landmark`.

### 5.7 `economic-sanctions`

`lensWeights: { economic: 2.0, diplomatic: 1.5, security: 1.2 }` · `preferredFeeds: ['world_bank', 'sipri', 'ofac', 'un_news']` · `frameworks` led by `barnett_duvall_power, fearon_rationalist` · `colorHex: '#59A14F'` · `icon: TrendingUp`.

### 5.8 `development-stabilization`

`lensWeights: { development: 2.0, humanitarian: 1.4, economic: 1.3, mediation: 1.2 }` · `preferredFeeds: ['world_bank', 'undp', 'reliefweb']` · `frameworks` led by `lederach_pyramid, galtung_triangle` · `colorHex: '#86BCB6'` · `icon: Sprout`.

### 5.9 `climate-environmental-security`

`lensWeights: { climate_security: 2.0, security: 1.3, humanitarian: 1.3, development: 1.2 }` · `preferredFeeds: ['unep', 'reliefweb', 'acled', 'hdx']` · `frameworks` led by `galtung_triangle, inform_risk` · `colorHex: '#4A90A4'` · `icon: Wind`.

### 5.10 `information-cyber`

`lensWeights: { security: 1.5, diplomatic: 1.3, human_rights: 1.3 }` · `preferredFeeds: ['gdelt', 'crisis_group', 'eu_disinfo']` · `frameworks` led by `barnett_duvall_power, fearon_rationalist` · `colorHex: '#9C755F'` · `icon: Network`.

### 5.11 `transnational-threats`

`lensWeights: { security: 1.8, legal_ihl: 1.5, diplomatic: 1.3 }` · `preferredFeeds: ['unodc', 'interpol', 'sipri', 'acled']` · `frameworks` led by `stedman_spoilers, mitchell_agle_wood, fearon_rationalist` · `colorHex: '#FF6B6B'` · `icon: AlertTriangle`.

The seed script `scripts/seed-domains.ts` writes all 11 documents idempotently (merge on existing, create if missing) and is safe to re-run.

---

## 6. Resolution — `resolveDomain`

`src/lib/domain/resolve.ts`:

```ts
export async function resolveDomain(domainId: DomainId): Promise<MergedDomainConfig> {
  // 1. Try Runtime Cache (5-minute TTL, keyed by domainId)
  // 2. Read config/domains/generic (always) + config/domains/{domainId}
  // 3. If specific missing, log warn, return generic
  // 4. Deep-merge: lensWeights union with specific override, arrays replaced by specific if non-empty
  // 5. Cache, return
}
```

- Merge strategy: `generic` provides every key; `specific` overrides any key it sets. `lensWeights` is deep-merged (per-lens override). `preferredFeeds` and `frameworks` are full-replace when non-empty, inherit when `[]`. `promptOverrides` is shallow-merged.
- Unknown `domainId` → warn log, return `generic`. Never throws.
- Cache bust triggered by Pub/Sub `config.domain.changed`.

Public API:

```ts
export async function listDomains(): Promise<MergedDomainConfig[]>
export async function resolveDomain(id: DomainId): Promise<MergedDomainConfig>
export async function resolveUserDomain(profile: AnalystProfile): Promise<MergedDomainConfig>
```

The third form is a convenience: reads `profile.perspective.primaryDomain`, resolves, attaches secondary influences as weight boosts on lens weights (0.5× each secondary).

---

## 7. Classifier

`src/lib/domain/classifier.ts`:

```ts
export async function classifyDomain(input: {
  name: string
  description: string
  sourceUrls?: string[]
  hints?: { userPrimaryDomain?: DomainId }
}): Promise<{ domainId: DomainId; confidence: number; rationale: string }>
```

- Model: Gemini Flash (`getModel()`), structured output via `Output.object()` + Zod.
- Prompt: enumerates the 11 domains with one-line descriptions; asks the model to return the best fit + confidence (0-1) + one-sentence rationale.
- If confidence < 0.55, returns `generic` with the original picks kept as `rationale` (the wizard shows alternatives).
- Hint: if `userPrimaryDomain` is provided, it is passed in as "the analyst's usual lens" — the classifier is told it **may** bias toward this, **not** required to.
- Fallback: on any error, returns `{ domainId: 'generic', confidence: 0, rationale: 'classifier unavailable' }`.

Cost: ~1 credit per classification. Debited as part of situation creation, not a separate charge.

---

## 8. Middleware surface — delta only

`src/lib/context/profile-context.ts` — `buildCalibratedContext` gets three additions:

1. **Resolve user domain** — `resolveUserDomain(profile)` → `userDomain`.
2. **Resolve situation domain** — if `situationId`, read situation, `resolveDomain(situation.domain)` → `situationDomain`.
3. **Merge** — `effectiveDomain = mergeDomains(userDomain, situationDomain)` — situation wins on `frameworks` and `preferredFeeds` (case-specific); user wins on `audience` default; `lensWeights` are element-wise max (user mandate + situation signal both amplify).

Injected into `ContextBlock`:

```ts
calibration.domain = effectiveDomain           // full merged config
calibration.systemPromptBlock                   // now includes <domain-frame> with:
  // - domain.id, domain.name, domain.description (one line)
  // - top-3 frameworks the analyst should reach for
  // - domain-specific prompt override for this toolId if present
calibration.outputConstraints.frameworks = effectiveDomain.frameworks  // tools can suggest one of these
calibration.provenance.domainId = effectiveDomain.id
calibration.provenance.domainVersion = effectiveDomain.version
```

**No new middleware.** `withCalibration` signature unchanged. 50 existing route wrappings pick up the domain without per-route edits.

---

## 9. Admin + evolution path

- **Admin UI** — `src/app/app/admin/domains/page.tsx`. List + edit form. Reads via `listDomains()`, writes via `PATCH /api/admin/domains/[id]`. Role gate: uid must be in `ADMIN_ALLOWLIST` env var.
- **Add a domain** — admin clicks "New". Seed template pre-fills from `generic`. Save → new Firestore doc. Cache-bust fires. No deploy needed.
- **Schema changes** — bump `DOMAIN_SCHEMA_VERSION` constant. Write migration in `src/lib/domain/migrations/{n}.ts` with `up(doc) => newDoc`. Cloud Function `on_domain_schema_change` (new, gated by Secret Manager) runs migrations across every `config/domains/*` doc + every `users/{uid}/profile/analyst` + every situation's `domain` field on a schedule.
- **Rollback** — each domain doc's `version` number is append-only in a `config/domains_history/{domainId}_{version}` collection. Admin UI shows version history, click-to-restore.

---

## 10. Onboarding + situation-wizard integration

### Onboarding Step 2 (perspective)

Add a new subsection **between** mandate and lenses:

- **Domain picker**: 11 cards (generic first + 10 specific), single-select for `primaryDomain`. Clicking shows the domain description + default lens emphasis preview.
- **Secondary domains** (optional, collapsible): multi-select, max 3.
- Selection **does not lock lenses** — it biases their order. User can still reorder freely on the next subsection.

### Situation wizard

After the existing "name + description + source URLs" step, insert:

- **Auto-classification call** on step transition: `POST /api/situations/classify-domain` with `{ name, description, sourceUrls }` → returns `{ domainId, confidence, rationale, alternatives }`.
- **Confirmation card**: shows "PRAXIS classified this as `{domain.name}` ({confidence}% confident). [Confirm] [Change]". If the user clicks Change, a picker opens with the same 11 cards.
- Stored on the situation doc on "Create".

---

## 11. Dashboard React #300 — root cause + fix

### Root cause (confirmed by diagnostic agent)

Three interacting issues in `src/app/app/dashboard/page.tsx` + `src/hooks/use-situation-guard.ts` + `src/lib/auth/auth-context.tsx`:

1. **`AuthContext.Provider` value not memoised** (`auth-context.tsx:529-546`) — every AuthProvider render produces a fresh object, forcing every child that reads auth to re-render.
2. **`useSituationStore()` called without a selector** (`page.tsx:1053`) — subscribes the component to every store slice update; `fetchSituations`'s internal `set({ loading: true })` → `set({ loading: false, situations })` fires two cascading re-renders of every destructured field, amplified by (1).
3. **`useSituationGuard()` returns a fresh object literal** on every call (`use-situation-guard.ts:27-46`) — when the returned object is used as a dependency of `useEffect` or passed to memoised children, referential equality fails and loops.

Individually none of these is a bug. Combined, and with `onboardingCompletedAt` being resolved asynchronously (flipping `onboardingComplete` from `undefined` → `false` → `true` within the first ~500ms), the render cycle exceeds React 19's re-render limit and React throws minified error #300 ("Rendered more hooks than during the previous render") — because the conditional branch at `page.tsx:1062-1074` swaps between two sibling subtrees with different hook footprints during the loop window.

### Fix

1. **Memoise the AuthContext value** — `auth-context.tsx:529`: wrap the provider value in `useMemo` with explicit dependency list covering every field.
2. **Select from Zustand** — `page.tsx:1053`: replace `const { situations, fetchSituations } = useSituationStore()` with per-field selectors.
3. **Memoise `useSituationGuard` return** — wrap each of the two return branches in `useMemo` keyed to their input primitives.
4. **Split the dashboard** into five focused components under `src/components/dashboard/`:
   - `dashboard-header.tsx` — greeting, calendar, quick actions.
   - `active-conflict-snapshot.tsx` — already an inline component, extracted.
   - `demo-dashboard.tsx` — lines 1081–1297 extracted.
   - `app-dashboard-content.tsx` — lines 1000–1079 extracted.
   - `glasl-stage-meter.tsx` — the existing inline component.

   Target: `page.tsx` ≤ 200 lines, one clear render tree.
5. **Add a minimal unit test** at `tests/unit/app/dashboard-hook-stability.test.tsx` that renders `DashboardPage` under `@testing-library/react`, flips the auth state from loading → authenticated → onboarded, and asserts no `console.error` containing `"Minified React error #300"` fires.

The existing `GlaslStageMeter` NaN guard stays — it prevented a *different* error class and remains correct.

---

## 12. Build sequence

**P0 — Stabilise (today, ~3 hours):**
- Fix AuthContext memoisation.
- Switch `useSituationStore` to selectors in dashboard.
- Memoise `useSituationGuard` return.
- Split `page.tsx` into components.
- Ship hook-stability test.
- Local dev server smoke test: login, land on dashboard, navigate to one tool, create a situation.

**P1 — Domain types + Firestore seed (~2 hours):**
- `src/types/domain.ts` — `DomainId`, `DomainConfig`, `MergedDomainConfig`, Zod validator, `DOMAIN_SCHEMA_VERSION = 1`.
- Extend `AnalystProfile` type with `primaryDomain`, `secondaryDomains`.
- `scripts/seed-domains.ts` — idempotent writer for 11 docs using the values from §5.
- Run seed against dev Firestore, verify.

**P2 — Resolver + classifier (~3 hours):**
- `src/lib/domain/resolve.ts` + Runtime Cache integration.
- `src/lib/domain/classifier.ts` with Gemini Flash + Zod.
- Unit tests: resolver inheritance, unknown id → generic, classifier fallback.

**P3 — Middleware integration (~2 hours):**
- Extend `buildCalibratedContext` — §8 delta only.
- Update `renderSystemPromptBlock` to include `<domain-frame>`.
- Regenerate one tool's prompt preview and eyeball the XML block.

**P4 — Onboarding + situation wizard updates (~3 hours):**
- Onboarding Step 2 domain picker.
- Situation wizard classification confirmation.
- `/api/situations/classify-domain` route.
- Firestore write paths include new fields.

**P5 — Admin UI (~2 hours):**
- `/app/admin/domains` list + edit.
- `/api/admin/domains/[id]` GET + PATCH with Zod validation, version bump, history write.
- `ADMIN_ALLOWLIST` env var wiring.

**P6 — Landing page + deploy (~2 hours):**
- Landing page: add "10 Domains" section below existing features.
- Run `./infrastructure/deploy.sh`.
- Smoke test on the deployed URL.

Total: ~17 hours of focused work.

---

## 13. Success criteria

1. Loading `/app/dashboard` as an onboarded non-demo user never surfaces React minified error #300, measured by Sentry zero-count over 48h post-deploy.
2. `config/domains/*` returns exactly 11 documents. `config/domains/generic.parentId === null`. All others `parentId === 'generic'`.
3. Seeding is idempotent — re-running `scripts/seed-domains.ts` against a seeded DB produces zero writes (verified via Firestore audit log).
4. `resolveDomain('humanitarian')` returns a merged config with `lensWeights.humanitarian === 2.0` AND every lens from `generic` present. `resolveDomain('nonexistent')` returns `generic` without throwing.
5. A new-situation flow run against the dev env produces a situation doc with `domain`, `domainConfidence`, `domainClassifiedAt` all populated, and the confirmation UI displays correctly.
6. An existing tool's system prompt, rendered via `renderSystemPromptBlock` for a humanitarian-domain user on a climate-environmental situation, visibly contains `<domain-frame>` with both domains referenced.
7. Changing `primaryDomain` from Settings bumps `profile.meta.version` and writes an immutable `profile_versions/{vN}` snapshot.
8. Admin UI at `/app/admin/domains` lists all 11. Editing `armed-conflict-security.lensWeights.security` and saving bumps that doc's `version`, busts the cache, writes history, and the next `resolveDomain` call picks up the new value within 6 seconds.
9. Cloud Run `praxis-frontend` shows a deploy timestamp newer than this spec's commit.
10. CI lint guard fails the build when any file outside `config/domains/`, `scripts/seed-domains.ts`, `src/types/domain.ts`, or `tests/**` contains a hardcoded domain identifier literal from the 11-domain list.

---

## 14. Open risks and mitigations

- **Risk:** Classifier confidently miscategorises edge cases (e.g. a humanitarian-coded Ukraine situation tagged as `armed-conflict-security`). **Mitigation:** user-override is immediate and one click; `domainOverriddenByUser` flag feeds a BigQuery query for monthly classifier-accuracy review.
- **Risk:** Firestore hot-spotting on `config/domains/*` reads. **Mitigation:** 5-minute Runtime Cache already specified; cache is per-region and shared across functions per the Vercel runtime-cache guidance.
- **Risk:** Existing tool prompts assume no `<domain-frame>` and break on its presence. **Mitigation:** every tool already wraps with `withCalibration` whose `systemPromptBlock` is a single string prepended to the tool's own prompt; adding a new XML tag inside it is additive and backward-compatible. Verified by spot-check against `advisory`, `dossier-generate`, `power-map` (the three top-scoring tools in the 2026-04-19 audit).
- **Risk:** Dashboard refactor introduces a new regression. **Mitigation:** the hook-stability test specified in §11 runs in CI; `docs/verification/2026-04-19-dashboard-manual-checklist.md` lists 6 manual smoke scenarios.
- **Risk:** `ADMIN_ALLOWLIST` env var leaks a uid into source control. **Mitigation:** env var only, never committed; Cloud Build mounts from Secret Manager.

---

## 15. Out of scope for this spec (tracked separately)

- Plan B Tier 1 tool migrations (separate spec; this work unblocks them).
- Per-tool prompt override authoring UI inside admin (v1 supports editing via JSON; WYSIWYG comes with Plan B's prompt registry consolidation).
- Localisation of domain labels.
- Auto-reclassification of existing situations older than 30 days.
- Multi-domain situations (a single `domain` field suffices; `promptOverrides` and `frameworks` composition already covers multi-lens cases via the user's `secondaryDomains`).
