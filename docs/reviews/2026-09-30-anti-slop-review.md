# PRAXIS anti-slop review, 30 September 2026

Scope: PRAXIS public pages and the primary signed-in chat/capsule workflow. The TACITUS website has a separate review. Publication and final live acceptance are coordinated by the release owner.

Guidance: [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop), read-only snapshot `91f12ec67e9de6043cfd93b846404986ba73c3f4`. Applied its core purpose test, copywriting, UI, keyboard and responsive principles within the user's authorized cleanup. No package, agent configuration or global preference was installed or changed.

## Direction and purpose

Preserve the Civic Atelier identity in `DESIGN.md`: EB Garamond headings, readable body type, emerald actions, quiet paper surfaces, real context graphs and source receipts. Energy is restrained, layouts follow the work, and motion communicates a real state. The product's distinguishing visual is its recorded evidence map, not decorative AI badges.

Typography and dividers organize policy material. Capsule cards identify saved objects; active/review states have meaning. Graph lines represent recorded relationships. Numbered workflow rows explain the order of actions. Technical controls and longer guidance stay available in disclosures. No new visual asset or invented statistics were introduced.

## Findings and changes

| Priority | Finding | Change | Guidance |
| --- | --- | --- | --- |
| High | Homepage JSON-LD described an Organization despite no incorporated operator. Learn called TACITUS a company. | Identify Giulio Catanzariti as Person/operator; describe an independent experimental project. | R17, R36, C5 |
| High | Onboarding promised hard constraints and universal behavior in every drafting tool. | Describe saved preferences that guide drafts, with human checking. Remove the unmeasured 30-second promise. | R17, R36, C5 |
| High | Learn described universal multi-agent checks, approval behavior and improvement after every run. | Explain actual saved-version resolution, separate research dependencies, optional deep research, human promotion and handover limits. | R36, C5 |
| High | Live review found an unnamed notification button across signed-in routes. | Name the bell and unread state; add expanded/controlled state, Escape and focus return, named dismiss/open/mark-read controls. | R03, R26, R32 |
| High | Live review found invalid aria-label on a generic graph wrapper. | Give the labelled map a region role; retain the complete keyboard evidence list. | R03, R32 |
| High | Live review found low-contrast capsule counts and graph-detail captions. | Use readable graphite text and 12px captions. | R25 |
| Medium | Guide repeated the same workflow in its hero, rail, cards and boundary panel. | Five numbered steps with short instructions. Detailed source, review and handover constraints expand on demand. | R05, R16, C3 |
| Medium | Learn repeated the workflow, product capabilities and technical internals across many card sections. | A short capsule definition, four useful contents, five capability rows and one technical disclosure. Keep existing deep-link anchors. | R05, R16, C3 |
| Medium | Homepage and chat repeated decorative Ask PRAXIS badges; suggestions duplicated their outcomes. | Remove the badges and secondary suggestion text. Preserve the question composer, actual prompt actions and established public headings. | R09, R31, C3 |
| Medium | Homepage introduced context through three feature cards plus repeated helper paragraphs. | Use one small ordered workflow and fewer secondary links. Remove the repeated composer explanation. | R05, R16, C3 |
| Medium | Builder repeated upload and proposal warnings in several places. | Keep permission-to-upload, review and verification boundaries in concise instructions. Add a visible keyboard focus outline to upload. | R03, R16, R27 |
| Medium | Saved capsule cards had a dark top stripe with no state meaning. | Remove it in the simplified library. Preserve actual active/review signals and the object's specimen shape. | R01, R31 |
| Medium | Library empty states listed internal facets and ontology search vocabulary. | Say to create context, change search or reset filters. Make reset a 44px target. | R16, R27, R32 |
| Medium | The welcome overlay introduced a second page-level h1. | Change the overlay's welcome heading to h2; the chat remains the page heading. | R03 |
| Medium | Notification menus were fixed-width, pointer-only rows with tiny hidden dismiss controls. | Responsive width; explicit real buttons for each row action, visible dismiss controls and 44px targets. | R03, R32, R34 |
| Low | Public branding used tiny tracked badges and an implementation version in the footer. | Plain brand attribution, link to release history and visible experimental/operator identity. | R06, R09, C3 |
| Low | Login had an unnamed loading spinner and long handoff wording. | Label loading and shorten the question handoff confirmation. | R16, R27 |

## Page families reviewed

| Surface | Result |
| --- | --- |
| `/` | Shorter introduction, simpler workflow presentation; composer and login handoffs preserved. |
| `/login`, sign-up and reset modes | Existing simple form retained; named loading and concise pending-question confirmation. No account or recovery operations performed. |
| `/guide`, `/help` | Short actionable guide with disclosures; Help remains the canonical Guide redirect. |
| `/learn` | Short explanation plus technical detail on demand; corrected operator and capability claims. |
| `/pricing` | Existing free-access presentation and closed future-plan disclosure retained. No paid checkout enabled; published usage/legal boundaries kept. |
| `/release-notes`, `/changelog` | Release-history content retained as historical evidence; no invented current capability promises added. |
| `/legal/*` | Operator, experimental limitations and mandatory-rights language retained. No retention period or certification invented. |
| `/onboarding` | Shorter step introductions and completion summary; preferences no longer described as universally enforced constraints. |
| `/app`, saved conversations | Chat headings and suggestions simplified. Context chips, history, provenance and research options preserved. |
| `/app/capsules` | Shorter introduction/empty states, quieter cards and readable loaded-result counts. Search, facets and private management remain. |
| `/app/capsules/builder` | Shorter material instructions, less nested framing, accessible document upload; review/save behavior preserved. |
| Capsule inspection | The actual evidence map remains central. Shorter graph heading; region semantics and readable details. Overview, Evidence, Timeline, Review and advanced context remain. |
| Shared signed-in header/settings routes | Notification naming, keyboard behavior, focus return and menu reflow corrected. Other settings behavior unchanged. |

## Measured copy reduction

Compared with source `7a56d338`. A local helper transpiles each page, renders its authored content in Chromium and counts whitespace-separated words from visible `innerText` with disclosures closed. Shared navigation, footer, icons, old context rails and the shared worked example are excluded on both sides. This measures the page's initial reading burden, not total product copy or runtime output length.

| Page | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Guide | 657 words | 159 words | 76% |
| Learn | 436 words | 229 words | 47% |

The same synthetic evidence specimen stays available, clearly labelled. Details remain expandable; the reduction does not remove source, review or handover boundaries.

Before: “Three quick fields. Takes 30 seconds.” After: “Your role and organisation help guide drafting defaults.”

Before: “Every tool now reads from the perspective below.” After: “Review the profile below. You can edit it later in Settings.”

Before: “Try another facet, category, or search title, ontology, source, claim, or output term.” After: “Change your search or reset the filters.”

## Validation and limits

- Scoped ESLint: passed with no output.
- Focused public, copy, login and instrument contracts: 6 files / 31 tests passed. Exact prose assertions were updated; functional assertions retained.
- Independent code review checked the copy and notification keyboard fixes. Release owner runs the integrated mandatory gate and responsive/live acceptance against the published revision.
- Existing public headings and navigation contracts were preserved. No backend API, authentication policy, account creation, billing capability or source-permission contract was changed by this pass.
- No fabricated testimonial, statistic, certification, retention period or guaranteed analytical correctness was added.

Review must preserve these limits: saved capsule references do not freeze source-document bodies or wider research; inspection opens the current saved capsule; handover carries bounded context and references rather than original-source permissions or universal import; hashes show integrity rather than analytical approval; download expiry does not delete the stored package; paid access and erasure remain disabled. Synthetic acceptance is software evidence, not a measurement of analytical validity.

Final integrated gate, publication identifiers and live acceptance belong in the chat-first release receipt. This review alone is not deployment proof.


## Self-evaluation of this PRAXIS pass

Applied `agent-self-evaluation` to this scoped work. Copy and UI improvements are concrete and reviewable; integrated release and live proof remain the release owner's responsibility.

| Axis | Score | Evidence and remaining improvement |
| --- | ---: | --- |
| Accuracy | 4/5 | Corrected operator and universal capability claims; kept version, source, review and handover limits. Experimental analytical accuracy remains unmeasured. |
| Completeness | 4/5 | Reviewed every public family and primary signed-in family. Deep secondary tools and legacy onboarding visuals were retained rather than redesigned in this final pass. |
| Clarity | 4/5 | Guide and Learn now state the next action first. Some advanced technical terms remain because they express real provenance boundaries. |
| Actionability | 4/5 | Source edits, named controls, focused passing checks and a precise release handoff exist. Final live responsiveness and the updated revision require the integrated release check. |
| Conciseness | 4/5 | Initial authored Guide text fell 76%; Learn fell 47%. The shared synthetic evidence specimen remains longer because its supporting evidence is useful. |

Overall: 4.0/5. Highest-impact next checks: verify the updated authenticated pages with keyboard and axe; confirm one page h1 and readable graph captions at phone widths; verify the exact published source and repeat the affected capsule journey. The release workflow owns these checks. The user can judge the assessment from the rendered pages and the linked acceptance receipts.


## Publication checkpoint

See the [final publication receipt](2026-09-30-praxis-final-publication.md): source 52102b5c is published and health/configuration checks passed. Final-source handover, worker and rendered acceptance remain pending after the user's instruction to publish and close. Historical/local evidence above retains its original scope.
