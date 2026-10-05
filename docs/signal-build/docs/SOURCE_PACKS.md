# Global source-pack design

Any supported country can open a desk. Depth depends on a configured source pack, access and reviewed context. Avoid a global claim that all local media, social platforms or regions are continuously monitored. Country and regional packs are editable/versioned customer assets.

## Source-pack fields

Each pack has a stable ID/version, geographic inclusion rules, languages, aliases/disambiguation rules, source-family definitions, collectors, permitted capture/retention/export basis, review owner, validation date, polling bounds, coverage gaps and health expectations. A panel change is a new pack version and a break in comparative metrics unless an explicit comparable subset is computed.

Include official institutions and statements, local-language news, national/international outlets, relevant humanitarian or civil-society reports, and permitted customer material. A source's affiliation or reliability is an evidenced, time-qualified assertion rather than a static national label. Record exclusions such as unavailable archives, paywalls, uncertain rights, platform access and missing local languages.

## Geography and aliases

Use the registry for stable country/territory IDs and separate display policy. Add original-script names and reviewed aliases to retrieval. Ambiguous terms such as Georgia, Congo, a city sharing a country name or an acronym require inclusion/exclusion and entity resolution. Alias matching returns relevance candidates rather than authoritative geolocation.

Administrative packs use versioned named subdivisions and attributable geometry where needed. Theatre packs declare their editorial scope: Darfur or a cross-border shipping route is not a new sovereign boundary. Customers may create a region for any country. Multi-country desks carry all included country IDs; do not hide a single-country default inside the implementation.

## Pack maturity

| Stage | Available behavior | Visible limitation |
| --- | --- | --- |
| Discovery | General news discovery and supplied material | No reviewed local source panel/context |
| Configured | Named permitted sources, aliases and languages | Explicit remaining gaps and unvalidated collectors |
| Reviewed | Analyst checked scope, source panel and contextual distinctions | Coverage remains panel-bounded |
| Operating | Watched collection, measured health and reviewed output cadence | Measured service window and tier/budget limits |

Ship three demonstration configurations across different contexts, such as Brazil, Sudan and Japan, with synthetic evidence fixtures. Do not invent real source entitlements or geopolitical expert rules. For live pilots, an analyst validates actual sources and access. Add multilingual packs as customer demand funds depth.

## Collector defaults

Collect only watched packs, with configurable timing and bounded windows. Start with GDELT discovery, authorized RSS/official sources and supplied materials. GDELT headline tags support routing, not body verification. RSS omission does not prove absence. ReliefWeb/Media Cloud/social integrations must validate current access and commercial terms before becoming promised dependencies.

For each source expose last success, last failure, capture lag, result ceiling, parse quality, permitted retention and missing languages. A failed source leaves historical evidence available but degrades current coverage. Regional relevance can be unresolved, and the user should be able to correct it with review lineage.
