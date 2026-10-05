# Collector access and geography

This plan is an implementation input, not a claim that any external connector has been enabled. The machine-readable companion is [provider-access-plan.json](provider-access-plan.json). Phase 03 must verify current access, terms and failure behavior against the actual account before marking a collector live.

## Text pilot source ladder

Start with customer-owned uploads, permitted official publications and a small curated RSS/source panel for each watched desk. Add GDELT URL discovery. Extract article text only through a separately permitted capture adapter. Every discovery result keeps its provider receipt and every retained representation keeps its own retention basis. A URL, headline or search result never authorizes a full-text archive.

| Provider | Intended role | Access gate | Default implementation decision |
| --- | --- | --- | --- |
| Customer-owned material | Primary evidence | Authenticated upload, declared rights, tenant ownership | Implement first; never share private captures |
| Curated RSS/direct sources | Original reporting and statements | Per-source capture/retention policy, robots and service terms | Enable individually after permission check |
| GDELT DOC | URL/headline discovery | Bounded query, current endpoint probe, source-code mapping | Implement discovery adapter; article capture remains separate |
| ReliefWeb | Humanitarian documents and context | Approved appname and original document rights | Optional early contextual adapter |
| Media Cloud | Discovery and panel research | Account/key/quota and permitted downstream capture | Optional; not a full-text source |
| UCDP | Versioned conflict event context | API token, dataset version, use/redistribution entitlement | Optional, disabled until verified |
| ACLED | Event context | Commercial licence and permitted analysis/export scope | Optional, disabled until verified |
| Social platforms | Public narrative samples | Approved API, retention/export terms, quota | Defer until a paid desk needs it |

GDELT's original DOC documentation distinguishes publisher source country from subject geography and uses provider-specific country codes; article list limits are bounded. Historical DOC articles describe different search-window limits. Verify the current endpoint rather than encoding a historical article as an uptime or history guarantee. Mark a capped result set `saturated`, shorten its window, and retain the incomplete discovery receipt. [R21,R22]

Media Cloud's FAQ describes URL-oriented access, weekly/request limits and the absence of distributable actual story text. Configure quotas from the account rather than relying on a universal free allowance. ReliefWeb's published parameters require an approved appname; document access is separate from publisher retention rights. [R10,R11]

UCDP currently documents a token, explicit version and pagination. Its country identifiers are Gleditsch-Ward codes, and date filtering has dataset-specific semantics. Validate filters locally because an ignored parameter can produce plausible but unrelated results. Store the requested dataset/version and the returned version/receipt with each import. A free API token alone is not a commercial rights determination. [R08,R09]

ACLED is outside the default commercial pilot. Its commercial licensing and AI-related content conditions must cover the actual intended processing. Record the entitlement, allowed derived outputs, permitted retention and licence renewal rather than storing a generic `licensed=true` flag. [R06,R07]

## Geography contract

Keep ISO country/territory selection as the product registry. Keep provider-country mappings in versioned adapter tables with explicit `unmapped` status; never pass ISO codes into a different identifier scheme without a mapping. Separate subject country, event location, publisher location, actor affiliation and analyst desk relevance. These describe different relationships.

Resolve each region against a pinned boundary release and explicit included country/administrative IDs. A box or radius is a filter, not an endorsement of a territorial claim. geoBoundaries is an attribution-bearing boundary option; pin both its geometry and release metadata if used. [R20]

An initial source pack includes panel revision, required languages, source families, ownership/syndication notes, acquisition basis and expected cadence. A globally selectable country can honestly have zero configured sources. Show that state and offer source configuration; do not synthesize a coverage score from the selector.

## Collector acceptance

For each adapter, prove one permissioned live acquisition plus fixture paths for timeout, throttling, oversized response, bad JSON, malformed date, duplicate pages, unknown geography, saturated search, missing full text and denied retention. A revoked key or policy expiry produces a visible degraded/blocked state. It must not become a successful zero-count window.

Use an adapter allowlist and bounded egress. Do not fetch arbitrary user URLs from a privileged worker without SSRF controls, redirect validation, public-address checks and byte/time/content limits. Respect provider retry instructions, add jitter, maintain an idempotent receipt and put terminal failures into the existing PRAXIS operator queue. Each source budget belongs to a watched desk; turning on the global selector does not schedule all countries.
