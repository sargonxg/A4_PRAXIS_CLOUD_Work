# PRAXIS anti-slop review, 2026-09-30

The public entry flow and guide now explain the actual work with less repetition. The capsule drawer, library retry and writing send controls have explicit 44px targets. The writing surface describes its context score as a heuristic rather than factual verification. These changes preserve the capsule evidence map, timeline, claim receipts and review workflow.

The public review passed **12/12 cases** on source `01a954972892121764974538c863cbeccb094b4a`, revision `praxis-frontend-01098-tkw`, with twelve representative screenshots inspected. [Section 23](#23-closed-public-review-01a95497) records the exact scope and receipt.

At 2026-10-01 01:59:23 UTC, the release coordinator reported a later serving source, `52102b5c4e775a0744a16af96c01e3a09e350123`, revision `praxis-frontend-01099-wpp`, with checkout disabled. **That successor is not covered by this acceptance.** Authenticated workflow proof remains dated to `cf04c6bb`; see the [live release record](2026-09-30-praxis-live-release.md). This report closes with those boundaries and the preserved findings below, without claiming complete accessibility or institutional readiness.

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

The later merged guide condensed this further: one “Open PRAXIS” action, five workflow rows with expandable “Details,” a capsule-tools navigation, the worked example, “What to ask for” and “Upload or save failed?” disclosures. Section 23 checks that deployed public version; the initial source-reduction measurements in section 17 remain historical.

Rules: R-05 and R-14. The worked evidence table is preserved because it explains an actual analytical distinction rather than filling space.

## 9. P1: allowance wording, corrected in the combined source

Evidence at review time: [account-settings-page.tsx](../../src/components/settings/account-settings-page.tsx), Usage tab detail near line 249, said "Credits and monthly allowance"; [pricing/page.tsx](../../src/app/pricing/page.tsx), near line 42, states that the starter allowance does not automatically refill.

The broad monthly-refill wording could mislead a free user. The combined source now labels the Usage tab "Account balance and activity." Pricing separately explains the one-time starter allowance. Browser acceptance of the authenticated account surface belongs to the final serial suite.

Rule: R-36. Current pricing now distinguishes enabled configured checkout, sandbox-only checkout, unavailable paid upgrades and future proposals. Evaluate those states against operator configuration rather than assuming one static availability state.

## 10. P2: advanced connector targets, corrected in the combined source

Evidence: [account-settings-page.tsx](../../src/components/settings/account-settings-page.tsx), connector Docs/Get key links near lines 962-966, originally used `px-3 py-2 text-xs` without explicit 44px height.

Both links now specify `inline-flex min-h-11 items-center`. They remain behind the existing advanced settings disclosure. Computed targets and external destinations still need browser verification.

Rules: R-03 and R-26. The source correction is confirmed; it does not establish that every connector works.

## 11. P2: builder privacy wording, narrowed in the combined source

Evidence: [CapsuleBuilderWizard.tsx](../../src/components/capsules/CapsuleBuilderWizard.tsx), line 619; [pages.ts](../../src/lib/legal/pages.ts), processing and retention boundaries near lines 150-158.

The original "PRAXIS keeps it private" could read as a blanket processing guarantee. The current prompt says to upload documents or paste notes for review and use material the user has permission to upload. An expandable explanation describes the private evidence workspace and leaves missing identities, dates and causal links unknown. This is a narrower description of the workspace; it does not imply that external providers never process material.

Preserve the proposal caveat near line 682, private save behavior near 955, separate publication boundary near 1020 and unsaved/save distinctions near 1035. Uploading, extracting and saving do not independently validate the material.

Rules: R-36 and R-38. The builder owner changed the copy. This finding was not evidence of a privacy leak, and no publication behavior was changed by this review.

## 12. P2: advanced implementation vocabulary, recommendation

Evidence: [CapsuleBuilderWizard.tsx](../../src/components/capsules/CapsuleBuilderWizard.tsx), line 890, "embeddedGraph: GraphLite advisory projection."

This label remains in the advanced builder path. Prefer a short heading such as "Recorded context map" with the projection format in technical details. A policymaker needs to know what the map records, what is missing and how to inspect it. The implementation name is useful for diagnostics but unnecessary for choosing the next action.

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
- These focused checks established source validation only. Section 20 records the later intermediate public browser audit; final integrated checks remain owned by the release coordinator.

## 18. Browser acceptance checklist from the source review

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

## 19. Initial source-review self-evaluation

| Axis | Score | Evidence and remaining improvement |
| --- | ---: | --- |
| Accuracy | 4/5 | Findings point to current source and the actual heuristic calculation; rendered states remain unverified by this reviewer. |
| Completeness | 3/5 | All assigned surfaces received a source review and focused tests/lint pass; final integrated and browser acceptance remain separately owned and pending. |
| Clarity | 4/5 | Priorities and fixed versus recommended work are explicit; the comprehensive report still requires a short release summary for users. |
| Actionability | 4/5 | Owned fixes are in source and remaining checks have concrete actions; account/billing follow-ups need their owners' final evidence. |
| Conciseness | 4/5 | Entry/guide source reduced by 75 lines; the evidence document is intentionally longer than product copy. |

Overall: 3.8/5 for this scoped review. Highest-impact next steps are to complete the integrated gate, rendered acceptance and coordinated account fixes. A user should agree with the distinction between completed source improvements and unproven release-wide readiness; they should not have to infer that distinction from an optimistic score.

## 20. Intermediate public browser audit: `43875e47`

The signed-out public scope passed on intermediate source `43875e4725968a26f321d02d7fcde5a1c95d4bfc`, serving revision `praxis-frontend-01092-g7t`, build `345037bc-46aa-4ee1-b52d-c2a4701fd592`. These historical receipts do not verify the final application source. The coordinator owns the later authentication/CSS deployment and final rerun.

The ignored harness, `output/playwright/practical-refinement-20260930/antislop-browser-live.cjs`, exercised `/`, `/guide`, `/pricing` and `/login` at 1440px, 768px and 390px widths using real Chromium. Runtime health confirmed the exact healthy SHA before and after each run.

| Receipt under `output/playwright/practical-refinement-20260930/` | Result | Runtime observations, UTC |
| --- | --- | --- |
| `antislop-live-1790812387577-43875e47.json` | First run: 11/12 pass; original failure preserved | 2026-09-30 23:53:19 to 23:55:07 |
| `antislop-live-1790812749666-43875e47.json` | Corrected full run: 12/12 pass | 2026-09-30 23:59:10 to 2026-10-01 00:00:15 |
| `antislop-login-fields-1790813010151-43875e47.json` | Additional computed-field check: 3/3 pass | 2026-10-01 00:03:30 to 00:03:35 |

The first failure was an instrumentation timing gap: the 390px Continue button was enabled in the DOM but still transitioning from disabled opacity/colors. Its opacity was `0.55`, so the harness correctly recorded contrast as unmeasured and failed. The corrected harness waits for finite CSS transitions and converts modern CSS colors to sRGB through browser canvas pixels. It retains the enabled-state check, 44px target requirement and hard 4.5:1 contrast assertion. The settled button measures 5.484:1; the original failed receipt is not replaced or relabeled.

The full passing run records 66 interaction steps, 42 target measurements, 36 selected text-contrast assertions, 30 keyboard checks, 42 page-overflow checks and 39 screenshots. Selected enabled controls measure 5.484:1 to 20.157:1 and at least 44px in height and width. Actual Tab/Enter interactions open Context details, worked evidence, guide help, future proposals and login mode switches. Mobile/tablet menu Escape closes the menu and returns focus. Links and Continue reach the expected public/login destinations; the typed public question is carried to login without executing a provider.

Neither passing receipt records console warnings/errors, page errors, HTTP errors or protected writes. All failed network requests are retained as navigation cancellations (`net::ERR_ABORTED`): 156 in the full navigation-heavy run and 16 in the additional login run. No unexplained request failure is accepted as a pass.

Twelve representative screenshots from prefix `antislop-live-1790812749666-43875e47` were inspected with `view_image`:

| Page | 1440px capture | 768px capture | 390px capture |
| --- | --- | --- | --- |
| Home | `context-expanded` | `worked-evidence-expanded` | `context-expanded` |
| Guide | `help-expanded` | `help-expanded` | `worked-evidence-expanded` |
| Pricing | `proposals-expanded` | `initial` | `proposals-expanded` |
| Login | `email-focus` | `signup-mode` | `signup-mode` |

The question remains the first useful action. Capsule explanation, policy-use examples and synthetic-example labeling are readable in the inspected layouts. The guide's five workflow rows preserve source/review/version boundaries, and the evidence table retains the distinction between a commitment, review outcome, expenditure and implementation. At 390px its 350px contents scroll inside a 314px region, without page overflow. A small scroll cue could improve discovery of the sample-note column; this is a recommendation, not a broken-page finding. Preserve the table rather than replacing it with decoration.

Pricing visibly explains the one-time shared starter allowance, no automatic refill, unavailable paid upgrades in this configured intermediate release, future proposals and operator/legal-entity status. Login's signup/reset/back controls work by keyboard, and focus outlines are visible in inspected unmasked areas. Full-page captures paint the sticky header at the current scroll position; that capture placement alone is not evidence of a permanent content collision.

The shared `privateScreenshotMasks` helper intentionally masks email/password inputs even when empty. Magenta rectangles are privacy masks, **not rendering defects**; those pixels are excluded from visual inspection. The separate field check records both fields enabled, 46px high, text `rgb(17, 24, 22)` on white, contrast 18.009:1, and widths of 382px at desktop/tablet and 316px at mobile. It reads styles and does not submit credentials.

The coordinator also removed unlabeled source-card confidence percentages from final-source `praxis-chat.tsx`, preserving source type, quotations, tiers, statuses and receipts. `ask-answer-envelope.ts` near lines 450 and 464 assigns fixed heuristics such as 0.68/0.48 and 0.54/0.62; these are not measured factual probabilities. This source correction is outside the signed-out intermediate audit. Final authenticated/mobile screenshots must establish its rendered state after deployment.

Limits: this evidence covers selected public controls in Chromium's light presentation at the named widths. It does not submit signup/login/reset forms, invoke Google sign-in, purchase a plan, run a provider, test authenticated capsules/writing, certify all-app WCAG conformance or verify the final release. Run the default full harness again with the final serving SHA after the coordinator's authentication/CSS deployment, then inspect its screenshots. No app, credential, cloud, staging or commit changes were made in this browser lane.

## 21. P1 follow-up: full-stack deployment replaces optional runtime settings

The full-stack [cloudbuild.yaml](../../cloudbuild.yaml) frontend deploy uses `--set-env-vars` and `--set-secrets` (lines 247-252). Local `gcloud run deploy --help` confirms that each removes existing entries before adding its supplied list. The omitted Polar bindings and checkout flag would therefore be lost on a future full-stack deployment. This is a concrete configuration defect, not a failure of the current frontend release lane.

Read-only checks at 2026-09-30 22:16-22:18 UTC confirmed that serving source `7a56d338` came from successful build `3239045f-58f9-4266-9a93-0e579a886572`, whose frontend deploy used both `--update-*` flags. The live `frontend-main-on-push` trigger uses `cloudbuild.frontend.yaml`; the separate full trigger matches backend, cloud-functions, PgBouncer and full-build configuration paths. The current application/frontend/package changes match only the frontend lane. Existing `cloudbuild-rules-step.test.ts` enforces preservation and erasure-disabled state for the frontend-only file, with no equivalent coverage for the full file.

Before the next full-stack release, switch its frontend deploy to `--update-env-vars` and `--update-secrets`, retain the explicit core bindings, explicitly set `PRAXIS_ACCOUNT_ERASURE_RULES_VERIFIED=false`, and extend the deployment contract test to both configurations. Preserved settings need explicit `--remove-*` entries when intentionally retired. No deployment configuration or cloud resource was changed by this review; the current frontend release is not blocked by this follow-up.

## 22. Final public audit found a guide contrast defect on `cf04c6bb`

After the authenticated serial suite completed, public Chromium checks ran against exact source `cf04c6bb232ed2715f77d927d7e752663e95f1d5`, serving revision `praxis-frontend-01097-5kw`. The first two failures were harness limitations exposed by the merged guide simplification. Correcting those limitations then identified a real text-contrast defect. The release coordinator repaired it in `01a95497`; section 23 records the deployed public verification.

| Receipt under `output/playwright/practical-refinement-20260930/` | Result and interpretation |
| --- | --- |
| `antislop-live-1790817247477-cf04c6bb.json` | 9/12 pass. All three guide cases used the old help label. The final guide has “Upload or save failed?” and “Create a capsule.” Original failure screenshots and the original harness are preserved. |
| `antislop-live-1790817401079-cf04c6bb.json` | 9/12 pass. Updated guide selectors reached the actual help, then the solid-background contrast calculator correctly returned unmeasured for the capsule link on the patterned background. No pass was claimed. |
| `antislop-live-1790817578783-cf04c6bb.json` | 9/12 pass. A transparent-text screenshot measured every background pixel in the link rectangle. Conservative minima were 3.891:1 at 1440/768px and 3.638:1 at 390px; this alone did not establish a failure under the glyphs. |
| `antislop-live-1790817780796-cf04c6bb.json` | 10/12 pass. Same-position original/transparent captures identified all discernible glyph/underline positions. Actual text-position minima were 4.279:1 at 1440px and 3.964:1 at 390px. The 768px text positions passed; the whole-rectangle minima remain in the receipt. |

On the audited `cf04c6bb` source, the affected [guide/page.tsx](../../src/app/guide/page.tsx) `Capsule tools` navigation inherited `text-[var(--color-praxis-emerald-700)]`, or `rgb(4, 120, 87)`. Its links are 14px supporting actions and require at least 4.5:1. The proposed one-token repair uses the existing `--color-praxis-emerald-800`, `#065F46`, for this navigation. Calculating that foreground against every preserved background pixel predicts conservative minima of 5.452:1 at 1440/768px and 5.097:1 at 390px. Those predictions are not deployment acceptance.

The pixel method changes only browser-local text and underline paint to transparent, retains layout and background layers, and restores the exact original inline style in `finally`. `sharp` decodes the original PNG pixels. The paired captures share dimensions; changed RGB pixels locate the original text paint, and each corresponding background pixel receives the standard sRGB contrast calculation. The receipt records sampled counts, viewport, scroll position, rectangle, worst pixel, background color, original captures, conservative rectangle minimum and actual text-position minimum. The 1440px failure includes 864 text-paint positions and a worst background of `rgb(226, 227, 232)`. No favorable subset was selected, no threshold was lowered and no application or server state was changed in this lane.

All four failed receipts remain unchanged. The subsequent public pass below verifies the repaired `01a95497` source and does not cover its later successor.

## 23. Closed public review: `01a95497`

Receipt: `output/playwright/practical-refinement-20260930/antislop-live-1790819739865-01a95497.json`. Screenshot inspection is recorded separately in `antislop-live-1790819739865-01a95497-visual-review.json`; the raw automated receipt is preserved.

Runtime readbacks at **2026-10-01 01:55:40.214 UTC** and **01:56:49.414 UTC** both confirmed healthy source `01a954972892121764974538c863cbeccb094b4a`, revision `praxis-frontend-01098-tkw`, build `6898b39d-4035-4904-8d9a-d187de20c896`. The coordinator independently confirmed 100% traffic, seven healthy checks and the image digest `sha256:97470d5ea1e4f1e9e1b70d0d17e2ee604756c0fec861ed9f4e8abc2b2d35fd9e`.

| Signed-out Chromium page | 1440px | 768px | 390px |
| --- | --- | --- | --- |
| Home | Pass | Pass | Pass |
| Guide | Pass | Pass | Pass |
| Pricing | Pass | Pass | Pass |
| Login and mode changes | Pass | Pass | Pass |

The run records **66 interactions, 48 target measurements, 42 selected contrast assertions, 30 keyboard checks and 42 page-overflow states**. Selected text contrast ranges from 5.484:1 to 20.157:1. Targets meet the scoped 44px minimum. The final full run includes the previously separate login-field checks: both fields are enabled, 46px high and 18.009:1, with widths of 382px, 382px and 316px across the three viewports. No separate login-field rerun was needed.

The repaired guide link now computes to `rgb(6, 95, 70)`. The unchanged pixel method from section 22 records:

| Viewport | Minimum under actual text paint | Conservative whole-rectangle minimum |
| --- | ---: | ---: |
| 1440px | 5.996:1 | 5.452:1 |
| 768px | 6.392:1 | 5.452:1 |
| 390px | 5.554:1 | 5.097:1 |

The browser recorded **zero console warnings/errors, page errors, HTTP errors and protected writes**. All 149 failed requests remain recorded as navigation cancellations (`net::ERR_ABORTED`), with no unexplained request failure accepted. This is browser evidence for these pages and times; it does not resolve historical server exceptions or prove their cause.

The run saved 39 masked full-page screenshots and six unmasked public link/background clips for pixel analysis. Twelve representative full-page captures were inspected with `view_image`:

| Page | 1440px capture | 768px capture | 390px capture |
| --- | --- | --- | --- |
| Home | `context-expanded` | `worked-evidence-expanded` | `context-expanded` |
| Guide | `help-expanded` | `help-expanded` | `worked-evidence-expanded` |
| Pricing | `proposals-expanded` | `initial` | `proposals-expanded` |
| Login | `email-focus` | `signup-mode` | `signup-mode` |

The first useful action remains the question. Optional context, sign-in and synthetic-example boundaries are visible. The shorter guide keeps real policy-work steps and an evidence table instead of decorative feature cards. Pricing on this reviewed release displays free access and the configured $49/month Practitioner offer, while Team and Institution remain proposals. Login mode changes, named controls and unmasked focus outlines are visible. Magenta email/password areas are intentional privacy masks and are excluded from visual judgement; field styles are independently measured in the browser. Sticky headers appear at the capture's current scroll position in full-page PNGs, which alone does not establish a permanent collision.

Historical authenticated `cf04c6bb` mobile captures were also inspected: source text and the synthetic 42-character identifier wrap, numeric source-confidence percentages are absent, and saved draft/context/source metadata remain visible. The long dark tails in full-page captures lie outside the initial viewport and are not evidence of a blank visible screen. The first-use banner's overlap with the library heading at its saved scroll position remains a follow-up.

**Limits:** selected public controls and representative images in Chromium's light presentation only. No credentials were submitted, account created, Google sign-in completed, provider executed or subscription purchased in this lane. No all-app, all-theme, cross-browser, screen-reader or institutional certification is claimed. Root-directed publication closed further testing: a later `52102b5c` deployment now serves with checkout disabled, so its source and billing configuration require separate acceptance. The successful `01a95497` receipt remains valid dated evidence, not successor approval.

## 24. Content and design follow-ups

These remain recommendations for a later iteration, alongside the full [improvement analysis](2026-09-30-praxis-improvement-analysis.md):

1. Give source receipts readable titles; keep opaque IDs in technical details and preserve review badges. This retains recommendation 33 in the broader analysis.
2. Keep the mobile first-use banner clear of the library heading and saved work at every scroll position.
3. Add a small horizontal-scroll cue to the narrow worked-example table. Preserve its commitment/review/expenditure/implementation distinctions.
4. Prefer “Recorded context map” over the advanced builder's GraphLite implementation heading, retaining the format in technical details.
5. When paid checkout is enabled, replace login's blanket “Current access is free” with “Start free.” Keep plan availability tied to verified configuration.
6. Add short legal reading summaries while retaining processing, retention, deletion, access and human-review duties. Complete broader theme, keyboard and screen-reader checks before making wider accessibility claims.

## 25. Final review self-evaluation

| Axis | Score | Evidence and remaining improvement |
| --- | ---: | --- |
| Accuracy | 4/5 | Exact before/after identity and retained failures support the public result; a later source remains outside acceptance. |
| Completeness | 4/5 | All twelve assigned public cases and representative screenshots are complete; cross-browser and full-app checks remain outside the completed scope. |
| Clarity | 4/5 | The current successor limit is prominent; historical findings make the supporting record longer. |
| Actionability | 4/5 | The measured contrast defect received a minimal deployed repair; successor acceptance and the short follow-up list remain explicit. |
| Conciseness | 4/5 | Product copy was shortened and current results are grouped; the evidence history is intentionally retained. |

Overall: **4.0/5 for this scoped review**, not a product-readiness score. Highest-impact next work is to accept one coordinated serving source/configuration, improve source-label and mobile-banner readability, then broaden accessibility checks. The user should be able to distinguish proven dated behavior from current unreviewed changes without reading the historical receipts.
