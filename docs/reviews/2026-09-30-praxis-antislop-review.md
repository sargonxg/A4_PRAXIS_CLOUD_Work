# PRAXIS anti-slop review, 2026-09-30

The public entry flow and guide now explain the actual work with less repetition. The capsule drawer, library retry and writing send controls have explicit 44px targets. The writing surface describes its context score as a heuristic rather than factual verification. These changes preserve the capsule evidence map, timeline, claim receipts and review workflow.

This is a source-backed review with scoped application fixes. Browser acceptance is recorded separately by the release coordinator. Source inspection, palette calculations and automated contracts do not establish that every interaction, theme or viewport works in production.

## 1. Scope and design direction

- Reference: [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop), version `3.2.20`, commit `91f12ec67e9de6043cfd93b846404986ba73c3f4`. The local read-only reference is under ignored `output/playwright/practical-refinement-20260930/anti-slop-reference/`.
- Applied as an after-implementation review within the existing session authorization. No installation or global configuration changes were made.
- Read the anti-slop core, copywriting, UI, human and mobile-layout guidance. Relevant rules include R-02 (plain copy), R-03 (mobile targets), R-04 (purposeful icons), R-05/R-14 (content-driven layouts), R-09 (decorative eyebrows), R-25 (contrast), R-27 (states), R-32 (keyboard), R-35 (verification), R-36 (honest claims) and R-37 (design direction).
- PRAXIS direction comes from [DESIGN.md](../../DESIGN.md) and [DESIGN_SYSTEM.md](../contributing/DESIGN_SYSTEM.md): Civic Atelier, archive-paper/deep-ink surfaces, emerald actions, Garamond headings and inspectable context chains.
- Consulted the sibling TACITUS website's `DESIGN.md` and `WEBSITE_IMPROVEMENT_GUIDE.md` for clear policy-facing copy, source boundaries and honest development status. Its full dark presentation was not transplanted into PRAXIS. Historical website strategy is not evidence of current product availability or incorporation.
- Application edits are limited to `praxis-chat-first-shell.tsx`, `guide/page.tsx`, the `CapsuleLibrary.tsx` retry control and small `memo-desk.tsx` controls/labels. One existing marketing source contract was updated to inspect the actual composer for its Ask label. Account, pricing and legal changes have separate ownership.

## 2. P1: signed-out copy must match the login requirement, fixed

Evidence: [praxis-chat-first-shell.tsx](../../src/components/app/praxis-chat-first-shell.tsx), `ContextDrawer`, lines 428-485.

The previous signed-out empty state implied that a user could ask directly without completing sign-in. It now says, "Sign in to ask. A capsule is optional." The authenticated empty state separately says, "No capsule attached. You can ask a question now." Existing login redirect destinations and capsule attachment handlers are retained.

Rules: R-36 and R-38. Browser checks still need to confirm that the composer and drawer both take a signed-out user through the intended login redirect.

## 3. P1: small actionable controls, fixed within ownership

Evidence: [praxis-chat-first-shell.tsx](../../src/components/app/praxis-chat-first-shell.tsx), lines 442-481 and 494-576; [CapsuleLibrary.tsx](../../src/components/capsules/CapsuleLibrary.tsx), line 147; [memo-desk.tsx](../../src/components/memo/memo-desk.tsx), the writing Ask submit button near line 1604.

- Drawer sign-in, attach/import/build/pick links, the authenticated capsule button, Make primary and Detach now specify `min-h-11`.
- The library error Retry button now has an explicit 44px minimum height and horizontal padding. Its owner-scoped reload behavior is unchanged.
- The writing Ask send button was `h-9 w-9`, or 36px at the default scale, and contained only an unnamed icon. It is now `h-11 w-11` with `aria-label="Send question"`. Pending/empty-input disabling and submit behavior are unchanged.
- Sidebar destination and recent-conversation links, the recent-conversation disclosure and the TACITUS link retain explicit minimum target heights.

Rules: R-03, R-26 and R-32. Computed sizes and focus visibility still require browser measurement; the source classes are not a universal accessibility pass.

## 4. P1: context structure is not factual trust, fixed within ownership

Evidence: [memo-desk.tsx](../../src/components/memo/memo-desk.tsx), score resolution near lines 264-269, capsule details near 1273-1322 and writing context near 1420; [trust-posture.ts](../../src/lib/context/trust-posture.ts), lines 27-46, 50-173; [capsule-service.ts](../../src/lib/context/capsule-service.ts), `computeCapsuleHealth` near line 4591.

The old writing receipt label was "Trust" followed by a band and score. The calculation is a weighted combination of recorded coverage, freshness, graph readiness, capsule health/completeness and flagged gaps. Its fallback is capsule health. It does not measure the probability that a claim is true, independently verify passages or certify that a draft is safe to share.

The visible label now reads "Context score," gives the recorded value and says it is "A heuristic, not factual verification." The adjacent capsule summary states that the score summarizes recorded structure and evidence signals and does not measure factual accuracy. Capsule health in the selector is labeled "structure." Score calculation, bands, API contracts and model execution behavior are unchanged.

Rule: R-36. Future score work should keep its methodology inspectable and avoid relabeling these heuristics as confidence probabilities.

## 5. P2: pale, tiny supporting text, fixed within ownership

Evidence: [praxis-chat-first-shell.tsx](../../src/components/app/praxis-chat-first-shell.tsx), sidebar labels/timestamps near lines 339-391; [memo-desk.tsx](../../src/components/memo/memo-desk.tsx), capsule selector/metric labels near 1273-1312 and keyboard helper near 1609; [globals.css](../../src/app/globals.css), archive-paper token near line 65.

The affected `text-[10px]`/`text-[9px]` pale slate labels are now `text-xs text-slate-600`. This covers the reviewed sidebar text, writing capsule selector metadata, context metric labels and Ask keyboard helper. Decorative, `aria-hidden` page corner marks were not treated as actionable information.

Static WCAG calculations using standard Tailwind palette values (`slate-400` = `#94A3B8`, `slate-600` = `#475569`) give:

| Background | Previous slate-400 | Revised slate-600 |
| --- | ---: | ---: |
| White, `#FFFFFF` | 2.56:1 | 7.58:1 |
| Archive paper, `#F4F0E7` | 2.25:1 | 6.66:1 |
| Slate-50, `#F8FAFC` | 2.45:1 | 7.24:1 |

The calculation uses sRGB linearization and `(lighter luminance + 0.05) / (darker luminance + 0.05)`. Normal text needs 4.5:1. These are palette comparisons, not computed browser measurements of every translucent, hover or theme surface.

Rule: R-25. Browser acceptance should check the actual foreground/background pairs and the remaining compact labels.

## 6. P2: decorative public eyebrow, removed

Evidence: [praxis-chat-first-shell.tsx](../../src/components/app/praxis-chat-first-shell.tsx), public hero near lines 224-236.

Removed the Sparkles icon and pill-shaped "Ask PRAXIS" eyebrow above the H1. The H1 remains "Policy analysis you can inspect." The shorter supporting sentence tells the user to ask, add sources when useful and review before sharing. This reduces ornament without changing the established typeface or palette.

Rules: R-04 and R-09. Retained functional icons indicate a destination or action, such as capsules, source material and sending a question.

## 7. P2: repeated public explanations, consolidated

Evidence: [praxis-chat-first-shell.tsx](../../src/components/app/praxis-chat-first-shell.tsx), `PublicIntroduction` near lines 292-304 and `HomeSidebar` near 337-393.

Replaced the repeated introduction and three generic feature cards with one capsule explanation: saved sources, assumptions and methods for policy briefs, assessments and narrative analysis. Kept real guide, learning and pricing links and the short experimental-access/review boundary. Removed the repeated sidebar slogan; its external link now reads "About TACITUS."

Rules: R-05, R-14 and copywriting guidance. This is a source simplification; no measured comprehension or conversion benefit is claimed.

## 8. P2: guide repeated the same workflow across sections, consolidated

Evidence: [guide/page.tsx](../../src/app/guide/page.tsx), workflow steps near 26-49, ordered list near 70-85, worked example near 87-89, policy requests near 91-107 and help disclosure near 109-114.

Removed the redundant context rail, separate capsule CTA, equal role cards and final warning panel. The guide now has a short introduction, two direct actions, five divided workflow rows, the compact worked policy example, three concrete policy-use prompts and one expandable help section.

The shorter text retains the important boundaries: capsules are optional; check the saved version; supplied-evidence-only requests exclude outside sources; web summaries are not quotations; saving does not approve claims; feedback changes a draft only after it is applied; review applies to the saved version; and handover recipients may still need source access. Unreadable/scanned and long-file limitations remain visible under product-specific help.

Rules: R-05 and R-14. The worked evidence table is preserved because it explains an actual analytical distinction rather than filling space.

## 9. P1: allowance wording, coordinated account follow-up

Evidence at review time: [account-settings-page.tsx](../../src/components/settings/account-settings-page.tsx), Usage tab detail near line 249, said "Credits and monthly allowance"; [pricing/page.tsx](../../src/app/pricing/page.tsx), near line 42, states that the starter allowance does not automatically refill.

The broad monthly-refill wording can mislead a free user. The release coordinator assigned the account owner a correction to "Remaining allowance and usage" or equivalent wording backed by actual entitlements. This report does not claim that correction passed browser acceptance.

Rule: R-36. Current pricing now distinguishes enabled configured checkout, sandbox-only checkout, unavailable paid upgrades and future proposals. Evaluate those states against operator configuration rather than assuming one static availability state.

## 10. P2: advanced connector targets, coordinated account follow-up

Evidence: [account-settings-page.tsx](../../src/components/settings/account-settings-page.tsx), connector Docs/Get key links near lines 962-966, originally used `px-3 py-2 text-xs` without explicit 44px height.

The release coordinator assigned the account owner the minimum-target correction. Keep these advanced links behind their existing disclosure and verify their external destinations. Do not add prominent provider configuration to the main asking workflow.

Rules: R-03 and R-26. This remains a coordinated item until the owner supplies validation evidence.

## 11. P2: builder privacy wording needs precise scope, recommendation

Evidence: [CapsuleBuilderWizard.tsx](../../src/components/capsules/CapsuleBuilderWizard.tsx), line 619; [pages.ts](../../src/lib/legal/pages.ts), processing and retention boundaries near lines 150-158.

"PRAXIS keeps it private" describes the capsule workspace but can be read as a blanket processing guarantee. Prefer wording about saving material to the user's account, paired with the actual data-handling boundary, after confirming the storage and provider path. This source finding is a copy-scope concern, not proof of a privacy leak.

Preserve the proposal caveat near line 682, private save behavior near 955, separate publication boundary near 1020 and unsaved/save distinctions near 1035. Uploading, extracting and saving do not independently validate the material.

Rules: R-36 and R-38. No builder privacy or publication behavior was changed by this review.

## 12. P2: advanced implementation vocabulary, recommendation

Evidence: [CapsuleBuilderWizard.tsx](../../src/components/capsules/CapsuleBuilderWizard.tsx), line 890, "embeddedGraph: GraphLite advisory projection."

Use a short user-facing label such as "Recorded context map" at this location; retain the exact projection format inside expanded technical details. A policymaker needs to know what the map records, what is missing and how to inspect it. The implementation name is useful for diagnostics but unnecessary for choosing the next action.

Rules: R-02 and R-05. Preserve the advanced save/publication distinction and graph truth boundaries.

## 13. P2: writing review language and version limits, mostly preserve

Evidence: [MemoHandoverPreview.tsx](../../src/components/praxis/MemoHandoverPreview.tsx), lines 32 and 48-52; [memo-desk.tsx](../../src/components/memo/memo-desk.tsx), source receipt list near 1327 and applied-feedback/review behavior elsewhere in the component.

The preview's 409 refresh explanation is useful: changed saved work requires reviewing the refreshed preview. Its reviewed-state text correctly limits the owner's review to a saved memo and intended use, and explicitly excludes independent approval of capsule/source dependencies. Preserve these boundaries and recipient-access warnings.

The pre-existing "Draft" review label contains an em dash. A future focused copy pass can use "Draft, review required" in that unowned component. This is a typography/copy rule finding, not a functional defect. Do not replace version-specific review with a blanket approved badge.

Rules: R-02 and R-36.

## 14. P2: onboarding remains optional and recoverable, preserve and verify

Evidence: [onboarding/page.tsx](../../src/app/onboarding/page.tsx), retry controls near 236-242, context preview near 288 and header near 310-314.

The source explicitly says users can start chatting now and finish preferences later. Retry controls specify 44px targets, and the profile-context preview is an expandable section. These are useful progressive disclosures; source inspection does not justify claiming that onboarding necessarily blocks a first question.

Browser checks should confirm that the skip path, failed initialization, retry-save state and keyboard-operable preview retain the intended behavior. Profile-photo text in account settings near line 723 mentions "shared work"; confirm the actual visibility and sharing path before making wider sharing claims.

Rules: R-27, R-32 and R-36. No onboarding or account-photo behavior was changed here.

## 15. P2: library and inspection already contain purposeful structure, preserve

Evidence: [CapsuleLibrary.tsx](../../src/components/capsules/CapsuleLibrary.tsx), Create capsule near 247, collapsed filters near 264, loaded-search boundary near 159/303 and factual-accuracy caveat near 306; [CapsuleInspectionExperience.tsx](../../src/components/capsules/CapsuleInspectionExperience.tsx), tabs and recorded contents near 90-123.

The capsule count/search boundary says which loaded records are included. The structural-score caveat distinguishes completeness from factual accuracy. The inspection surface exposes recorded sources, claims, mapped relationships, a graph, evidence, timeline and review. Selecting graph claims opens evidence; these visuals support inspection and should remain.

Source includes roving tab keyboard handling and a 44px close button. The tabpanel has `outline-none` near line 108, while global focus styles exist. Confirm the computed visible focus indicator in the browser instead of inferring a keyboard failure from that one class. Confirm Escape, focus containment and return focus for the actual dialog as well.

Rules: R-17, R-25, R-32 and R-35. No decorative replacement graph, stock illustration or fabricated count was added.

## 16. P2: pricing and legal readability must retain substance

Evidence: [pricing/page.tsx](../../src/app/pricing/page.tsx), free allowance near 42, configured/sandbox checkout near 49-61, future proposals near 63-74 and operator/legal-entity boundaries near 78; [pages.ts](../../src/lib/legal/pages.ts), retention near 158, institutional prerequisites near 175, human review/non-excludable rights near 190-193 and deletion exceptions near 290-299.

Pricing should show only the access and checkout states supported by current operator configuration. Future plans remain explicitly labeled proposals. Keep the single starter/shared allowance explanation, operator identity, incorporated-entity status and legal navigation consistent across pages.

For legal pages, prefer a short reading summary followed by the existing detailed text. Do not remove provider-processing, retention, deletion exceptions, human-review duties, institutional prerequisites or non-excludable statutory rights merely to shorten the page. This review makes no legal-sufficiency determination.

Rules: R-02, R-05, R-36 and R-38. Legal and billing edits remain separately owned.

## 17. Source reduction and validation

Measured from the UTF-8 source content immediately before and after the owned entry/guide changes:

| File | Before lines | After lines | Before bytes | After bytes |
| --- | ---: | ---: | ---: | ---: |
| `praxis-chat-first-shell.tsx` | 644 | 629 | 32,492 | 31,286 |
| `guide/page.tsx` | 178 | 118 | 11,459 | 6,864 |

Together these two files contain 75 fewer lines and 5,801 fewer UTF-8 bytes. This is measured source reduction, not a performance or usability metric. The memo/library additions supply necessary labels, explanation and touch-target classes.

Validation after the shared dependency refresh:

- Scoped `git diff --check` passed for all four application files and the updated existing source contract.
- Focused test and lint attempts before the coordinator's dependency rebuild failed at tool resolution, not assertions: missing `vitest` executable and unresolved `eslint/config` module. The coordinator then completed `npm ci` successfully; this reviewer did not mutate dependencies.
- Four existing focused suites now pass, 23 tests in total: `marketing-home-contract.test.ts`, `app-page.test.ts`, `phase-e-design-performance-contract.test.ts` and `praxis-background-contract.test.ts`. The initial marketing run had one stale assertion requiring the removed decorative eyebrow in `shellSource`; that assertion now checks `chatSource`, where the actual composer/action/accessibility label belongs, and its four tests passed on rerun.
- Scoped ESLint passed with exit 0 and no output for the four application files and the adjusted marketing source contract. The release coordinator owns the complete typecheck/build/test gate.
- Vitest emitted a configuration-loader warning about ESM syntax in the current CommonJS-loaded config. It did not fail these tests; this review does not change the test configuration.
- No production browser acceptance is claimed by this document. The release coordinator owns the final integrated checks and rendered evidence.

## 18. Remaining browser acceptance

Record actual outcomes, URLs/revision and console errors for the following before a release-wide pass is claimed:

1. At desktop and 390px mobile widths, open the public hero, guide and both capsule drawer states; check wrapping, overflow and computed control sizes.
2. Follow guide, learning, pricing, TACITUS and builder links. For signed-out attach/build/pick actions, complete login and confirm the intended redirect.
3. With saved capsules, expand Context details, attach a reference, make it primary, detach it and confirm the saved state and exact version. Confirm a first question works without a capsule.
4. Trigger library load failure and use Retry; confirm owner-scoped state, previous loaded work and loading feedback are preserved.
5. In writing, type and submit by keyboard and by the named send button; confirm pending/disabled behavior, source receipts and readable helper text. Check the context-score caveat at narrow widths.
6. Open capsule inspection; exercise Overview/Evidence/Timeline/Review, graph-to-evidence selection, arrow-key tab navigation, visible focus, Escape and return focus.
7. Expand guide help and onboarding preview with the keyboard. Follow onboarding's optional start-now path and exercise its existing retry states.
8. Exercise the configured pricing/checkout states and advanced account links after their owning worker's changes. Verify that visible free allowance wording never implies automatic monthly refill.
9. Check every shipped theme used by these surfaces, including actual contrast on translucent, hover, focus and disabled states. Source class changes do not close this requirement.

## 19. Review self-evaluation

| Axis | Score | Evidence and remaining improvement |
| --- | ---: | --- |
| Accuracy | 4/5 | Findings point to current source and the actual heuristic calculation; rendered states remain unverified by this reviewer. |
| Completeness | 3/5 | All assigned surfaces received a source review and focused tests/lint pass; final integrated and browser acceptance remain separately owned and pending. |
| Clarity | 4/5 | Priorities and fixed versus recommended work are explicit; the comprehensive report still requires a short release summary for users. |
| Actionability | 4/5 | Owned fixes are in source and remaining checks have concrete actions; account/billing follow-ups need their owners' final evidence. |
| Conciseness | 4/5 | Entry/guide source reduced by 75 lines; the evidence document is intentionally longer than product copy. |

Overall: 3.8/5 for this scoped review. Highest-impact next steps are to complete the integrated gate, rendered acceptance and coordinated account fixes. A user should agree with the distinction between completed source improvements and unproven release-wide readiness; they should not have to infer that distinction from an optimistic score.

## 20. Prepared public browser audit

The ignored harness is `output/playwright/practical-refinement-20260930/antislop-browser-live.cjs`. `node --check` passes. It has not been run against production at this preparation point; the release coordinator must supply the final live 40-character source SHA before execution.

The harness uses real signed-out Chromium pages for `/`, `/guide`, `/pricing` and `/login`, each at 1440px, 768px and 390px widths. It requires `/api/health/runtime` to report that exact commit and healthy status both before and after the audit. Each case records screenshots, page overflow, selected computed contrast and target sizes, console/page/network errors, keyboard focus styles and actual navigation/disclosure outcomes. It tests public Context details, the preserved worked evidence table, guide help, future-plan disclosure, mobile-menu Escape/return focus and login's mode switches. It does not submit login/reset/signup forms, invoke Google sign-in, purchase a plan or run an analysis provider.

Safety interception blocks and records any unexpected protected account/auth/provider write. Such an attempt fails the case; blocked requests cannot be reported as successful behavior. Telemetry rate-limit responses, if encountered during rapid audit navigation, remain in the evidence with an explicit scope limit. Contrast calculations that encounter an unresolved image, gradient or opacity layer are recorded as unmeasured, not given an AA pass.

Even a successful automated run remains limited to its named pages, widths, selected controls, signed-out light presentation and Chromium. Screenshot inspection with `view_image` and the separately owned authenticated journeys are still required. This harness does not establish all-app WCAG conformance or universal anti-slop acceptance.

Execution after the coordinator supplies and verifies the release SHA:

```powershell
node output/playwright/practical-refinement-20260930/antislop-browser-live.cjs --run-approved --expected-sha <final-live-40-character-sha>
```
