# PRAXIS Sophisticated Persona Wave — 2026-04-29

## Mission

Stress PRAXIS like serious users would: not a quick smoke test, but a
multi-persona product review that asks whether the platform is clear,
trustworthy, defensible, and useful for policy, diplomacy, mediation,
humanitarian, and conflict-intelligence work.

## Test Surfaces

- Local app: `http://localhost:3100`
- Live public site checked: `https://praxis.tacitus.me`
- Browser tool: `agent-browser 0.26.0`
- Personas: policy director, mediator/envoy-team analyst, intelligence analyst,
  enterprise buyer, skeptical security/trust reviewer.

## Persona Workflows Exercised

### 1. Policy Director

Question: "Can I go from a live situation to a defensible two-page policy
brief with assumptions, risks, and next actions?"

Routes/actions:

- Live landing page read-through.
- Local demo dashboard.
- Daily Intelligence Brief.
- Quick actions: Ask PRAXIS, New Report, Deep Research, Upload Sources.
- Export/provenance review by code inspection.

Findings:

- Local demo dashboard now communicates the sample workspace clearly.
- Live landing still contains older source claims and placeholder social proof.
- Export engine previously hardcoded sources not necessarily used.

Actions in this wave:

- Export footer now uses supplied source list or says no explicit sources were
  supplied.
- Landing-page worker tightened public copy toward source, graph, and audit
  language.
- Placeholder social proof was removed from the active landing testimonial
  section until real approved practitioner quotes exist.
- Landing stats and headline text were adjusted after browser extraction showed
  zero-state animated metrics and joined headline text.

### 2. Mediator / Envoy Team

Question: "Can PRAXIS help me identify actors, leverage, red lines, and
sequenced process options without inventing facts?"

Routes/actions:

- Demo dashboard.
- Conflict graph and scenario-planning entry points.
- Ask PRAXIS route intent and sidebar navigation.
- AI route trust audit for scenario/stakeholder/sanctions outputs.

Findings:

- The demo route system rewrites `/demo/*` to matching `/app/*` pages, but
  browser automation observed `/demo/assistant` falling back to dashboard in
  one run. Needs scripted regression coverage.
- Several AI routes still need explicit source/provenance envelopes before they
  can be treated as mediator-grade outputs.

Actions in this wave:

- Logged demo route continuity as a P0/P1 browser-regression item.
- Added provenance/export and sanctions-source fixes.

### 3. Intelligence Analyst

Question: "Can I trust the source basis, freshness, and confidence of AI
outputs when they reference current events?"

Routes/actions:

- Live landing source claims.
- Local intelligence feed empty state.
- AI audit of grounded search, web research, situation intelligence,
  risk indicators, and prior-output reuse.

Findings:

- Live site still claims sources that the current local product posture has
  been narrowing.
- "Grounded" paths need provider-native source receipts or language that does
  not overclaim grounding.
- Prior outputs can be fed back as JSON previews without trust envelopes.

Actions in this wave:

- Local landing copy now avoids retired source claims in worker-owned surfaces.
- Sanctions scan no longer generates live sanctions analysis from model
  training data when current source retrieval fails.

### 4. Enterprise Buyer

Question: "Can I understand security posture, roadmap, private data handling,
  and limits without being oversold?"

Routes/actions:

- Live landing security section.
- Local landing security section.
- Terms/privacy/pricing smoke from prior wave.

Findings:

- Live site still includes strong but mixed claims: early demo banner,
  certification roadmap, private GCP workspace, and placeholder testimonial.
- Local landing worker clarified live controls versus planned controls.

Actions in this wave:

- Security copy now separates current controls from planned enterprise
  features more plainly.
- Placeholder quote remains an active cleanup item.

### 5. Skeptical Security / Trust Reviewer

Question: "Where could PRAXIS silently fabricate, hide degraded AI, leak
  demo/source assumptions, or export unsupported claims?"

Routes/actions:

- Protected route and demo route behavior.
- Source/provenance inspection.
- Export route inspection.
- AI fallback inspection.

Findings:

- Demo mode is now better labeled in dashboard/welcome/feed surfaces.
- Export was trusting client-supplied content and using a hardcoded source
  footer; this could make unsupported documents look cited.
- Sanctions fallback to training data was unacceptable for legal/current
  status analysis.

Actions in this wave:

- Removed hardcoded export source footer.
- Removed sanctions training-data fallback.
- Demo sanctions payload now marks `demo`, `fictional`, `exportEligible:
  false`, and `sourceBasis`.

## 35-Item Improvement Roadmap

### Critical / High Priority

1. **Grounded-search truthfulness** — wire provider-native Google Search
   grounding receipts or rename ungrounded paths.
2. **Sanctions current-source enforcement** — started; standard sanctions scan
   now refuses to generate from training data when source retrieval fails.
3. **Export provenance** — started; situation report footer no longer hardcodes
   unused sources.
4. **Append-only tool run history** — replace one-document-per-tool overwrite
   with run IDs, latest pointer, model, prompt hash, schema version, and source
   receipts.
5. **Persistence failure visibility** — stop swallowing save failures; mark
   output non-exportable if persistence fails.
6. **Tool schema enforcement for Ask PRAXIS writes** — whitelist writable tools
   and validate payloads before `writeToTool`.
7. **Full assistant response persistence** — persist citations, tool calls,
   retrieval trace, confidence, and model metadata, not only last message.
8. **Model fallback transparency** — expose `modelUsed`, `fallbackUsed`, and
   degraded confidence when Pro falls back to Flash.
9. **Situation Intelligence evidence IDs** — require every graph node/edge to
   cite validated source fragment IDs.
10. **Prior-output trust envelopes** — feed previous outputs back with
    generatedAt, model, confidence, schema version, and source basis.
11. **Stakeholder placeholder scoring** — block interpretation or mark output
    degraded when graph data is absent.
12. **Risk indicator retrieval** — require actual evidence retrieval or return
    low-confidence/no-source output.
13. **Web-search freshness** — do not assign today's date to undated search
    results.
14. **Demo export controls** — ensure all demo intelligence payloads are marked
    non-exportable or exported with clear synthetic-data watermarking.
15. **Demo route continuity regression** — script `/demo/dashboard`,
    `/demo/assistant`, `/demo/conflict-graph`, `/demo/reports/new`,
    `/demo/settings/system-health` and assert no unexpected dashboard fallback.

### Product / UX / Workflow

16. **Landing source claims** — started; local landing now narrows source
    claims, but live site still needs deployment.
17. **Placeholder testimonial removal** — replace "Practitioner quote pending"
    with no testimonial block or a clearly labeled pilot-feedback request.
    Done locally in this wave by hiding the testimonial section until real
    approved quotes exist.
18. **Unsupported metric cleanup** — replace broad "73%" and "6hrs" style
    claims with sourced data, product-specific counters, or remove them.
19. **First-run policy workflow** — add a guided path: create situation →
    upload/source → graph → executive intelligence → brief/export.
20. **Serious sample questions** — include role-specific sample prompts for
    policy, mediation, humanitarian, legal, and intelligence users.
21. **Source-state banners** — every tool should show whether it used graph,
    uploaded docs, open web, prior outputs, or demo data.
22. **Confidence language standard** — unify HIGH/MEDIUM/LOW definitions across
    tools.
23. **Visual graph explainability** — graph node clicks should show source
    fragments, extraction confidence, and last updated timestamp.
24. **Scenario quality rubric** — scenarios should include drivers,
    probabilities, assumptions, early indicators, and decision triggers.
25. **Action specificity** — action generators should validate that actions
    include actor, verb, object, timeframe, expected outcome, and risk.

### Testing / QA Automation

26. **Sophisticated persona Playwright suite** — encode the five 10-minute
    personas as repeatable scripts.
27. **AI route source-contract tests** — fail routes that claim grounding
    without source receipts.
28. **Export regression tests** — assert exports never list sources that were
    not supplied or persisted.
29. **Demo-mode watermark tests** — assert demo API responses include
    `demo/fictional/sourceBasis` where relevant.
30. **Slow-network state testing** — throttle network and verify loading,
    retry, and degraded states.
31. **Mobile workflow screenshots** — dashboard, graph, assistant, reports,
    settings, landing, pricing.
32. **Console/network capture** — store browser console and failed request
    evidence for every persona pass.

### Cloud / Security / Deployment

33. **Secret rotation** — rotate local workstation credentials that appeared in
    `.env.local` before production reliance or sharing.
34. **Middleware-to-proxy migration** — address the Next.js 16 deprecation.
35. **Deploy parity checklist** — compare live `praxis.tacitus.me` copy and
    build hash against local before each release.

## Changes Completed In This Wave

- Landing-page credibility pass completed by worker in:
  - `src/app/(landing)/page.tsx`
  - `src/components/landing/hero.tsx`
  - `src/components/landing/how-it-works.tsx`
  - `src/components/landing/problem-section.tsx`
  - `src/components/landing/data-substrate.tsx`
  - `src/components/landing/live-platform-preview.tsx`
  - `src/components/landing/security-section.tsx`
- `src/components/landing/testimonials.tsx`
  - `src/components/landing/waitlist-form.tsx`
- Browser follow-up also adjusted `hero.tsx`, `problem-section.tsx`, and
  `data-substrate.tsx` for readable text extraction and more defensible public
  claims.
- Sanctions route:
  - Demo response now labels synthetic data and export eligibility.
  - Standard scan refuses to generate from model training data alone when live
    source retrieval fails.
- Export engine:
  - Situation reports now list only supplied sources or an explicit "no source
    list supplied" warning.

## Next Verification

```powershell
npx tsc --noEmit
npx eslint "src/app/(landing)/page.tsx" src/components/landing/hero.tsx src/components/landing/how-it-works.tsx src/components/landing/problem-section.tsx src/components/landing/data-substrate.tsx src/components/landing/live-platform-preview.tsx src/components/landing/security-section.tsx src/components/landing/waitlist-form.tsx src/app/api/ai/sanctions-scan/route.ts src/lib/services/export-engine.ts
npm run build
agent-browser open http://localhost:3100
agent-browser open http://localhost:3100/demo/dashboard
agent-browser open https://praxis.tacitus.me
```
