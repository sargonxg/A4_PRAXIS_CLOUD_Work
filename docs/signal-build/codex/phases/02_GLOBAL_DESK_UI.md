# Phase 02 - authenticated global desk interface

Additional required reading: [research/UI_BRIEF_SPEC.md](../../research/UI_BRIEF_SPEC.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

Implement `/signal` within the actual PRAXIS route group and authenticated shell discovered in phase 00. Use current layout, navigation, permissions and design components. Do not embed the reference harness in an iframe or ship another application's login.

Build a searchable global selector and saved desks. Support any registry country, administrative area where configured, a custom regional/theatre definition, and multiple countries for a thematic scope. An unconfigured country opens discovery/intake mode and reports its coverage gaps. Do not populate pretend historical narratives or imply that selection provides complete media coverage.

Build Overview, Coverage, Narratives, Evidence, Context and Briefs as connected views. Implement the working Coverage/Evidence intake skeleton now; later analytical views should show clear empty states until their data exists. Persist the desk's question, audience, window, languages and source pack through phase 01's authorized services. The active scope must be visible and represented in shareable navigation state without exposing private source text.

Create meaningful loading, empty, denied, provider-failed and partial-coverage states. Lists are keyboard operable; graph inspection later must have an equivalent relationship list. Source text and labels are untrusted and escaped. Avoid exposing internal schema names or job tokens in the customer workflow.

Acceptance: an authenticated test user creates a Brazil desk, a Sudan regional desk and a multi-country thematic desk, switches between them and reloads without losing configuration. A second user/tenant is denied the first user's desk according to current membership policy. Test a country with no source pack, keyboard flow, mobile width and stale deep-link revision. Capture actual UI screenshots and console results using the repository's browser/test lane. If auth access is missing, record the blocked live journey; do not claim fixture routing proves it.
