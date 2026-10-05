# SIGNAL world explorer: source and catalog research

Research date: 2026-10-05. This document separates curated directory choices, real network observations and unverified acquisition permissions. It does not approve a source reading, publish an analytical assessment or establish complete national coverage.

## Contracts inspected

The active repository AGENTS/CLAUDE architecture chain, current SIGNAL decisions and kit research/collector access/UI guidance govern this lane. Firestore and native ContextCapsules remain the existing canonical owner plane; a shared public-source refresh must not copy private desk captures or change capsule knowledge. Headline discovery is not original article evidence. The kit explicitly requires individual access/retention gates, distinguishes subject geography from publisher location and forbids treating similarity as coordination or intent.

## Representative country panel

This twenty-entry panel is a bounded initial directory, not a ranking of major powers or a claim that other countries are less relevant. Government links identify a government portal/reference, not an incumbent officeholder. Media organization links are starting points for inspection, not endorsements, ratings, an exhaustive national media panel or evidence of source independence. Country association does not establish publisher ownership, reporting geography or the origin of any particular story. Link reachability is recorded separately below.

| ISO | Display country/territory | Government directory reference | Media organization reference |
|---|---|---|---|
| US | United States | [https://www.usa.gov/](https://www.usa.gov/) | [Associated Press](https://apnews.com/) |
| GB | United Kingdom | [https://www.gov.uk/](https://www.gov.uk/) | [BBC News](https://www.bbc.com/news) |
| FR | France | [https://www.info.gouv.fr/](https://www.info.gouv.fr/) | [France 24](https://www.france24.com/en/) |
| DE | Germany | [https://www.bundesregierung.de/breg-en](https://www.bundesregierung.de/breg-en) | [Deutsche Welle](https://www.dw.com/en/) |
| IT | Italy | [https://www.governo.it/en](https://www.governo.it/en) | [ANSA](https://www.ansa.it/english/) |
| CA | Canada | [https://www.canada.ca/en.html](https://www.canada.ca/en.html) | [CBC News](https://www.cbc.ca/news) |
| BR | Brazil | [https://www.gov.br/en](https://www.gov.br/en) | [Agência Brasil](https://agenciabrasil.ebc.com.br/en) |
| RU | Russian Federation | [https://government.ru/en/](https://government.ru/en/) | [TASS](https://tass.com/) |
| UA | Ukraine | [https://www.kmu.gov.ua/en](https://www.kmu.gov.ua/en) | [Ukrinform](https://www.ukrinform.net/) |
| CN | China | [https://english.www.gov.cn/](https://english.www.gov.cn/) | [Xinhua](https://english.news.cn/) |
| JP | Japan | [https://www.japan.go.jp/](https://www.japan.go.jp/) | [NHK World Japan](https://www3.nhk.or.jp/nhkworld/en/) |
| KR | Republic of Korea | [https://www.korea.net/](https://www.korea.net/) | [Yonhap News Agency](https://en.yna.co.kr/) |
| IN | India | [https://www.india.gov.in/](https://www.india.gov.in/) | [The Hindu](https://www.thehindu.com/) |
| ID | Indonesia | [https://indonesia.go.id/](https://indonesia.go.id/) | [ANTARA](https://en.antaranews.com/) |
| TR | Türkiye | [https://www.turkiye.gov.tr/](https://www.turkiye.gov.tr/) | [Anadolu Agency](https://www.aa.com.tr/en) |
| SA | Saudi Arabia | [https://my.gov.sa/en](https://my.gov.sa/en) | [Arab News](https://www.arabnews.com/) |
| IR | Iran | [https://president.ir/en](https://president.ir/en) | [IRNA](https://en.irna.ir/) |
| IL | Israel | [https://www.gov.il/en](https://www.gov.il/en) | [The Times of Israel](https://www.timesofisrael.com/) |
| PS | Palestine (display policy; WB: West Bank and Gaza) | [https://www.palestinecabinet.gov.ps/](https://www.palestinecabinet.gov.ps/) | [WAFA](https://english.wafa.ps/) |
| ZA | South Africa | [https://www.gov.za/](https://www.gov.za/) | [SABC News](https://www.sabcnews.com/) |

ISO country/territory display policy remains separate from recognition and boundary claims. For PS, retain World Bank's returned entity label (normally “West Bank and Gaza”) next to the app's territory display; never silently equate distinct statistical entities. KR is the Republic of Korea. Government/media pages do not grant article scraping or commercial redistribution rights.

## Economic provider contract

Candidate authoritative API: [World Bank Indicators API](https://api.worldbank.org/v2/), [basic call documentation](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures), [WDI dataset licence](https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators).

The authorized GCP probe requests these exact indicator IDs across the twenty ISO codes, with `format=json&mrnev=1&per_page=100`; the implemented runtime additionally pins `source=2` (World Development Indicators):

| ID | Metric | Units and interpretation |
|---|---|---|
| SP.POP.TOTL | Population, total | Persons; annual statistical observation |
| NY.GDP.PCAP.CD | GDP per capita | Current US dollars; not purchasing-power-adjusted GDP |
| FP.CPI.TOTL.ZG | Inflation, consumer prices | Annual percentage change; not the current-month inflation rate |
| IT.NET.USER.ZS | Individuals using the Internet | Percentage of population; not traffic or political influence |

Endpoint shape: `https://api.worldbank.org/v2/country/US;GB;FR;DE;IT;CA;BR;RU;UA;CN;JP;KR;IN;ID;TR;SA;IR;IL;PS;ZA/indicator/<ID>?format=json&mrnev=1&per_page=100`.

The initial successful research requests used the unpinned endpoint above; the implemented runtime adds `source=2` to both select and validate World Development Indicators explicitly. Preserve the returned country ID/ISO mapping, indicator name, value, observation year, dataset/source metadata and `lastupdated`. A missing value stays unavailable. Each country/indicator can have a different latest nonempty year. A twelve-hour refresh is a fetch cadence, not a twelve-hour cadence for annual economic observations. Retain the last good observation with a stale/degraded receipt after a refresh failure; do not fabricate current values or convert provider failure into zero.

## Headline candidates and rights

A public RSS endpoint is not by itself a commercial content licence. Default to attributed outbound links and source-specific title/link/publication metadata only after a documented title-display basis. No descriptions, article bodies, images, embeds or audio are acquired by this lane. The visible interface must distinguish source headline metadata from exact original text admitted into a reviewed desk. Statistical keyword/topic counts are labelled as bounded matching discovery coverage, never beliefs, ideological positions, reach, causal influence or independent corroboration.

| Organization | Candidate RSS endpoint | Terms reference |
|---|---|---|
| BBC News | https://feeds.bbci.co.uk/news/world/rss.xml | https://www.bbc.co.uk/usingthebbc/terms/ and https://www.bbc.co.uk/news/10628494 |
| Deutsche Welle | https://rss.dw.com/rdf/rss-en-all | https://www.dw.com/en/terms-of-use/a-1820051 |
| The Guardian | https://www.theguardian.com/world/rss | https://www.theguardian.com/help/terms-of-service |
| France 24 | https://www.france24.com/en/rss | https://www.france24.com/en/terms-of-use |
| UN News | https://news.un.org/feed/subscribe/en/news/all/rss.xml | https://www.un.org/en/about-us/terms-of-use |
| Al Jazeera | https://www.aljazeera.com/xml/rss/all.xml | https://www.aljazeera.com/terms-and-conditions |
| NHK | https://www3.nhk.or.jp/rss/news/cat0.xml | https://www3.nhk.or.jp/nhkworld/en/information/terms/ |

Feed HTTP success and an XML response prove access at one time, not permitted commercial republishing or continuing uptime. A legal page 404 or unreadable terms is an unresolved rights gate. Keep source-by-source capability states instead of labelling all candidates “live”. Feed IDs and URLs remain distinct from outlet country membership. English aliases can classify explicit country mentions; such matches do not prove the event's location or geopolitical significance. Original publication date, capture date and country-matching method must remain visible.

## Region and conflict directory scope

These entries are curated navigation lenses with explicit country subsets. They are not an event dataset, severity/risk assessment or claim that a war is active at the time of refresh. Country lists establish the selected analytical frame only. In the implemented world panel, globe interaction selects only the twenty configured country/territory entries, not a source's physical location. Non-panel countries are reference geometry without a source panel and are not selectable through this release's world explorer. Context directory references outside the twenty-country panel do not add a selectable country or imply data coverage.

Reference for statistical regional groupings: [UN M49 methodology](https://unstats.un.org/unsd/methodology/m49/). A product grouping that departs from it must be labelled curated rather than UN-defined.

| Curated panel region | Included country/territory codes | Limit |
|---|---|---|
| Americas panel | US, CA, BR | Selected North/South America entries, not all Americas |
| Europe panel | GB, FR, DE, IT, RU, UA | Selected entries; whole-country labels do not assign all transcontinental territory to one continent |
| East Asia panel | CN, JP, KR | Selected entries; not a geopolitical recognition statement |
| South/Southeast Asia panel | IN, ID | Deliberately combined product directory grouping |
| Middle East panel | TR, SA, IR, IL, PS | Curated analytical grouping, not a UN M49 region |
| Africa panel | ZA | One configured country, not continent coverage |

| Context directory lens | Selected codes | Primary reference and use |
|---|---|---|
| Ukraine and neighbouring conflict context | UA, RU | https://www.unocha.org/ukraine ; humanitarian country reference; cross-border analyst lens is product-authored |
| Israel/Palestine context | IL, PS | https://www.unocha.org/occupied-palestinian-territory ; humanitarian reference, not automated event verification |
| Syria context | SY | https://www.unocha.org/syrian-arab-republic ; SY is outside the initial twenty-country provider panel |
| Iran/Gulf context | IR, SA | https://www.un.org/en/about-us/member-states ; product-authored country lens, reference availability unverified here; not an assertion of current conflict or severity |
| Korean Peninsula context | KR, KP | https://www.un.org/en/about-us/member-states ; selected-country directory only; no asserted current conflict/severity |

Large-country informational title-keyword lenses can use named-place aliases within an already country-matched headline: US California/Texas/Washington D.C.; BR São Paulo/Sao Paulo, Amazonas, Brasília/Brasilia; IN Maharashtra, Tamil Nadu, New Delhi; CN Guangdong, Beijing, Shanghai. These are text filters, not event locations, validated subnational coverage or polygon datasets. No headline matches means no available discovery sample, not no activity. Shared institutional/publisher source location remains separate from subject-country matching.

Do not ingest UCDP or ACLED under a directory label. [UCDP API documentation](https://ucdp.uu.se/apidocs/) has separate token/version/licensing requirements; ACLED remains entitlement-gated under the build kit. No commercial event licence was obtained by this work.

## Firsthand network observations and reproducible evidence

Workspace checks at 2026-10-05 22:53–22:55 UTC: World Bank API/documentation/terms, the seven RSS candidates, most portals and UN source pages returned HTTP 503 **from the environment's Envoy upstream tunnel**, whose body reported `remote connection failure ... remote address:envoy://cloudflare_https_tunnel/`. These are transport failures and do not establish publisher/provider HTTP 503. Independent curl confirmed the same failure with HTTP/2. USA.gov and Canada.ca returned HTTP 200; CBC's endpoint returned a tunnel connection 403. No API observations or article facts were invented from these failures.

The runtime skill was used to inspect current environment status and `/etc/codex/network-policy.json`: desired HTTP policy unrestricted, observed policy state unknown. TLS verification and inherited proxy were preserved. No network policy/configuration was modified.

An explicitly authorized source-only Cloud Build probe used existing project `praxisbytacitus`, existing bucket `praxisbytacitus_cloudbuild` and trusted image `gcr.io/google.com/cloudsdktool/cloud-sdk:stable`. Successful build **`5ed6bbee-f8ed-4603-b66d-60978b4526b4`** acquired verified upstream responses at approximately **2026-10-05T23:02:06Z**. Python is the SDK's bundled interpreter and TLS trust is the SDK's bundled Mozilla/certifi CA file; certificate verification was preserved. Earlier diagnostics `c7e717a7-d0ee-42ab-89f2-b58c37e2d8f4` (missing Python PATH), `ef1711ab-8248-4c87-9f4c-fb4e9124f61d` (missing interpreter default CA) and `166b41ec-982c-4653-8132-3a6dfe5303d5` (absent system CA prerequisite) did not establish upstream availability. No app image, service, traffic, IAM or private data was changed by these research builds.

Public raw scripts/artifacts remain outside Git at `/tmp/signal-world-research/certified-cloud/{results,catalog,rights}.json`; persisted public-only copies are `gs://praxisbytacitus_cloudbuild/signal-world-research/5ed6bbee-f8ed-4603-b66d-60978b4526b4/`. Artifacts retain bounded economic records and title/link/date metadata, not article bodies. Temporary public legal HTML is researched solely for access/licensing conditions.

### Verified economic observations

All four metric batches returned HTTP 200 JSON, one page, twenty records and `lastupdated=2026-07-13`; `sourceid` was null in these replies and must not be fabricated. Values below are the actual API observations rounded only for this table; the provider's full numeric precision remains in raw artifacts. Years are individual observation years, not the refresh year. Country metadata returned twenty records, including the provider entity label “West Bank and Gaza” for PS. Capital coordinates in that metadata are not exact country or media locations.

| ISO | Population (year) | GDP/person current US$ (year) | Inflation % (year) | Internet users % (year) |
|---|---|---|---|---|
| US | 341,784,857 (2025) | 90,026.5163 (2025) | 2.9495 (2024) | 94.6938 (2024) |
| GB | 69,487,000 (2025) | 57,601.9621 (2025) | 3.8831 (2025) | 95.4721 (2024) |
| FR | 68,720,337 (2025) | 48,985.7308 (2025) | 0.9438 (2025) | 88.6538 (2024) |
| DE | 83,491,249 (2025) | 60,496.4351 (2025) | 2.1718 (2025) | 93.5 (2024) |
| IT | 58,915,656 (2025) | 43,308.6403 (2025) | 1.5317 (2025) | 89.2207 (2024) |
| CA | 41,651,653 (2025) | 55,697.664 (2025) | 2.0723 (2025) | 94.3533 (2024) |
| BR | 212,812,405 (2025) | 10,713.2857 (2025) | 5.0168 (2025) | 84.4635 (2024) |
| RU | 143,513,328 (2025) | 17,546.6094 (2025) | 8.7199 (2025) | 94.365 (2024) |
| UA | 38,980,376 (2025) | 5,865.8848 (2025) | 12.7303 (2025) | 82.4749 (2024) |
| CN | 1,406,585,000 (2025) | 13,861.9702 (2025) | 0.0596 (2025) | 91.6 (2025) |
| JP | 123,366,734 (2025) | 35,951.045 (2025) | 3.1725 (2025) | 85.5415 (2024) |
| KR | 51,684,564 (2025) | 36,226.9664 (2025) | 2.1231 (2025) | 97.8956 (2024) |
| IN | 1,463,865,525 (2025) | 2,702.4799 (2025) | 2.3988 (2025) | 70 (2025) |
| ID | 285,721,236 (2025) | 5,059.626 (2025) | 1.9133 (2025) | 72.7808 (2024) |
| TR | 85,878,556 (2025) | 18,599.4421 (2025) | 34.8812 (2025) | 89.7702 (2025) |
| SA | 36,973,555 (2025) | 34,536.6555 (2025) | 2.0842 (2025) | 100 (2024) |
| IR | 92,417,681 (2025) | 3,924.3802 (2025) | 42.1712 (2025) | 85.3404 (2024) |
| IL | 10,122,800 (2025) | 60,336.8478 (2025) | 3.0414 (2025) | 88.1824 (2024) |
| PS | 5,413,596 (2025) | 3,171.1084 (2025) | 9.8084 (2025) | 86.6377 (2023) |
| ZA | 64,747,319 (2025) | 6,597.7145 (2025) | 3.2055 (2025) | 78.3576 (2024) |

### Verified access and rights are separate

| Feed | GCP HTTP | Parsed items | Latest sampled publication | Acquisition decision |
|---|---|---|---|---|
| bbc | 200 | 23 | Mon, 05 Oct 2026 21:46:22 GMT | Excluded: actual section15 requires permission/licence for business RSS/metadata use. |
| dw | 200 | 131 | 2026-10-05T21:07:00Z | RDF format requires parser support; terms URL404, rights unresolved. |
| aljazeera | 200 | 25 | Mon, 05 Oct 2026 22:17:30 +0000 | Exclude default commercial use: primary terms personal/noncommercial; redistribution requires consent. |
| un | 200 | 30 | Mon, 05 Oct 2026 12:00:00 +0000 | Exclude default commercial use: general UN terms personal/noncommercial, no redistribution grant. |
| guardian | 200 | 45 | Mon, 05 Oct 2026 12:00:24 GMT | Exclude default commercial use: primary terms explicitly personal/noncommercial and cover RSS/metadata. |
| france24 | 200 | 24 | Mon, 05 Oct 2026 21:56:30 GMT | Terms candidate403/404; rights unresolved. |
| nhk | 200 | 7 | Sat, 08 Aug 2026 21:54:30 +0900 | Stale August publication; terms URL404, excluded. |

The BBC RSS guide states: “We encourage the use of BBC News feeds as part of a website,” requiring attribution “BBC News” or “bbc.co.uk/news”, no logos/trademarks and allowing withdrawal. This feed-specific statement does not silently override linked general terms. Guardian, UN and Al Jazeera's public RSS accessibility does not overcome their commercial reuse restrictions. A research fetch is not approval for runtime retention.

The former World Bank dataset-terms URL redirected to generic `https://www.worldbank.org/ext/en/legal/terms-conditions`, whose informational/noncommercial wording is **not proof of the WDI dataset licence**. Dataset-specific public licensing is independently checked below before treating the metric API as cleared.

### Directory reachability

Checks started 2026-10-05T23:02:09–12Z. `200` means a page response was reachable then; it neither verifies officeholders nor gives acquisition/republishing rights. A 403, redirect error or timeout stays unverified. Canada also returned workspace HTTP200 earlier, but its GCP attempt timed out. The following records preserve actual final redirects where available.

| ISO | Government status/final URL | Media status/final URL |
|---|---|---|
| US | 200 · https://www.usa.gov/ | 403 · https://apnews.com/ |
| GB | 200 · https://www.gov.uk/ | 200 · https://www.bbc.com/news |
| FR | 403 · https://www.info.gouv.fr/ | 403 · https://www.france24.com/en/ |
| DE | 200 · https://www.bundesregierung.de/breg-en | 200 · https://www.dw.com/en/top-stories/s-9097 |
| IT | 200 · https://www.governo.it/en | 200 · https://www.ansa.it/english/ |
| CA | Timeout/error · https://www.canada.ca/en.html | 200 · https://www.cbc.ca/news |
| BR | 200 · https://www.gov.br/planalto/en | 200 · https://agenciabrasil.ebc.com.br/en |
| RU | Timeout/error · https://government.ru/en/ | 200 · https://tass.com/ |
| UA | 200 · https://www.kmu.gov.ua/en | 200 · https://www.ukrinform.net/ |
| CN | 200 · https://english.www.gov.cn/ | 200 · https://english.news.cn/ |
| JP | 200 · https://www.japan.go.jp/ | 200 · https://www3.nhk.or.jp/nhkworld/en/ |
| KR | 302 · https://www.korea.net/ | 200 · https://en.yna.co.kr/ |
| IN | 200 · https://www.india.gov.in/ | 200 · https://www.thehindu.com/ |
| ID | Timeout/error · https://indonesia.go.id/ | 200 · https://en.antaranews.com/ |
| TR | 200 · https://www.turkiye.gov.tr/ | 200 · https://www.aa.com.tr/en |
| SA | 403 · https://my.gov.sa/en | 403 · https://www.arabnews.com/ |
| IR | Timeout/error · https://president.ir/en | Timeout/error · https://en.irna.ir/ |
| IL | 403 · https://www.gov.il/en | 403 · https://www.timesofisrael.com/ |
| PS | Timeout/error · https://www.palestinecabinet.gov.ps/ | 200 · https://english.wafa.ps/ |
| ZA | 200 · https://www.gov.za/ | 200 · https://www.sabcnews.com/sabcnews/ |

OCHA Ukraine, occupied Palestinian territory and Syrian Arab Republic directory references returned GCP HTTP200. UN M49 returned200 but exceeded the bounded read; it was not fully parsed. UCDP documentation returned200, without any commercial event-data entitlement being acquired.

## Specific licences and cleared institutional feeds

Successful source-only build `47ce33c8-9252-46e0-8db7-d06f9ff656ae` fetched the following primary references with verified TLS at **2026-10-05T23:06:54–55Z**. Public legal documents and sanitized title/link/date-only feed metadata are outside Git at `/tmp/signal-world-research/license-cloud`; persisted equivalents use the same build's existing-bucket path. Raw feed bodies were removed after extracting bounded metadata; no article URL was fetched. The broad website terms above do not replace these specific data licences.

- [World Development Indicators dataset](https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators), HTTP200: “This dataset is licensed under Creative Commons Attribution 4.0.” [World Bank public licences](https://datacatalog.worldbank.org/public-licenses), HTTP200: CC BY4.0 allows copying, modification and distribution “for any purpose, including commercial use”, with appropriate attribution and indication of changes. Preserve World Bank/WDI attribution, indicator/entity/year and actual data URL. Different datasets can have different licences; this is not a blanket grant for World Bank website materials. API source2 returned “World Development Indicators”.
- [GOV.UK terms](https://www.gov.uk/help/terms-conditions), HTTP200: most GOV.UK content is Crown copyright and published under the Open Government Licence, with exceptions. [OGL v3](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/), HTTP200: permits commercial/noncommercial use with source acknowledgement and licence link. Default attribution: “Contains public sector information licensed under the Open Government Licence v3.0.” Excludes personal data, logos/insignia and unlicensed third-party rights. Initial runtime retains title/link/date only and identifies GOV.UK as an official UK-government source, without endorsement.
- [European Commission legal notice](https://commission.europa.eu/legal-notice_en), HTTP200: unless otherwise indicated, EU-owned content is CC BY4.0, requiring attribution and indication of changes. Third-party rights and logos/names are excluded. Initial title/link/date cache attributes European Commission and links the licence/source; an English feed query does not guarantee every item is English.

| Cleared institutional feed | Exact endpoint | Verified response | Latest actual sampled timestamp | Scope |
|---|---|---|---|---|
| GOV.UK news/communications | https://www.gov.uk/search/news-and-communications.atom | 200, valid Atom, 13,695 bytes, 20 entries | 2026-10-06T00:01:02+01:00 (=2026-10-05T23:01:02Z) | Official UK institutional communications; not an independent-media panel |
| European Commission press corner | https://ec.europa.eu/commission/presscorner/api/rss?language=en | 200, valid RSS, 7,258 bytes, 10 items | Mon, 05 Oct 2026 13:11:24 GMT | Official Commission institutional communications; not all EU countries' media |

Representative **attributed titles**, not factual assertions by PRAXIS: GOV.UK “Holding Russia accountable for its war against Ukraine: UK statement to the Warsaw Human Dimension Conference” (2026-10-05T17:32:31+01:00), linked to its original government speech; Commission “Daily News 05 / 10 / 2026” (09:26:54GMT), linked to the original press corner item. Extract no descriptions or article bodies. Country assignments on shared feeds require explicit full-name/alias title mentions, labelled `title-mention`; publisher origin is separate. Do not copy every institutional headline into every country's coverage, or treat an unmentioned place as event geography. Sparse/empty country results are expected.

White House's candidate feed returned200, but no source-specific rights proof was established here and it is not enabled by this research. BBC's guessed full terms page was an HTML meta redirect. The actual [BBC terms](https://www.bbc.co.uk/usingthebbc/terms-of-use), verified HTTP200 in successful source-only build `28ca0a0c-3e53-4f71-bd49-d3eadd4f966e`, section15, explicitly states: “For business You’ll need a licence to use our metadata (such as images, text, media and the links to them)” and “For business use of our RSS feeds you'll need to get our permission, and there may be a fee to pay.” **Exclude BBC runtime metadata/RSS without permission.** The feed-guide encouragement does not grant this product business reuse. Pending or excluded publishers can remain outbound organization links without a runtime headline collector.

The [current World Bank dataset terms](https://www.worldbank.org/ext/en/legal/terms-conditions/datasets), verified200 in that same build, explicitly provide CC BY4.0 unless labelled otherwise, with third-party indicator exceptions and additional dispute conditions. Mandatory attribution format: “The World Bank: Dataset name: Data source (if known).” Preserve any specific exceptions in indicator metadata instead of assuming all World Bank-hosted data share identical terms.

## Independent publisher follow-up

Successful source-only build `a3419ce4-80ac-4b5a-bdf7-d4593380fa30` tested public metadata-only feeds and primary reuse guidance:

- Global Voices `https://globalvoices.org/feed/`: HTTP200, valid RSS, fifteen items, latest sampled date Mon,05 Oct2026 05:22:25+0000. Candidate terms `https://globalvoices.org/about/terms-of-use/` returned404. Reachability alone does not clear runtime rights; canonical primary licence is checked separately below.
- The Conversation `https://theconversation.com/us/articles.atom`: HTTP200, valid Atom, fifty entries, latest2026-10-05T22:06:14Z. [Primary republishing guidelines](https://theconversation.com/us/republishing-guidelines) HTTP200, state Creative Commons Attribution/No Derivatives4.0 and unchanged article/author attribution conditions; also explicitly “Commercial, non-journalism usage: license fees may apply. Contact us to discuss” and prohibit systematically republishing all articles. No article bodies were fetched. Default commercial SIGNAL metadata collection is not declared cleared by this work; keep outbound directory reference until an applicable title-metadata basis is resolved.

All four exact [World Bank indicator metadata](https://api.worldbank.org/v2/indicator/SP.POP.TOTL?format=json) endpoints returned200 with source2 World Development Indicators and no restrictive indicator label in their returned records. Preserve sourceOrganization in provenance: population UN/NSOs/Eurostat; GDP national statistics/OECD/World Bank staff; inflation IMF International Financial Statistics; internet ITU World Telecommunication/ICT Indicators Database. These are WDI-provided observations under the specific WDI licence, not permission to scrape the upstream organizations' other content.

Successful final discovery build `33fe4e0f-bc92-428e-b3b6-501613685d2b` at2026-10-05T23:11:53Z established the primary [Global Voices about page](https://globalvoices.org/about/) HTTP200, whose footer explicitly states “This site is licensed as Creative Commons Attribution3.0”, links [CC BY3.0](https://creativecommons.org/licenses/by/3.0/) and points to its actual attribution policy. The previously guessed terms URLs404 do not negate that specific primary licence declaration. The exact attribution policy was subsequently verified as described below; do not infer publisher independence, ideological orientation or source ownership from this licence.

GDELT bounded query `https://api.gdeltproject.org/api/v2/doc/doc?query=%22Ukraine%22&mode=artlist&format=rss&maxrecords=25&timespan=1d` returned actual HTTP429 from GCP. [GDELT about/terms](https://www.gdeltproject.org/about.html#termsofuse) returned200 and states unlimited/unrestricted academic, commercial and governmental use with GDELT citation/link. This is provider-dataset permission, not a third-party article-body licence. Its metadata acquisition remains **disabled/unhealthy** in this initial release; no fresh metadata success is claimed and no retry storm was performed. Existing owned `SIGNAL_GDELT_ENABLED=false` workflow is not changed by these world research probes.

### Global Voices attribution basis and bounds

Successful two-reference verification build `f442a166-bb47-4861-9942-0b2c2498507e` fetched [Global Voices' canonical attribution policy](https://globalvoices.org/about/global-voices-attribution-policy/) HTTP200 and [CC BY3.0](https://creativecommons.org/licenses/by/3.0/) HTTP200. The policy, updated9 April2025, explicitly permits sharing/adaptation “for any purpose, even commercially” unless otherwise stated, and requires attribution, licence link and indication of changes. Original story URL and author name must remain visible. It warns that third-party photos/video/audio need their own permission. Its request to let editors know about full-story republication is not permission to send external messages here; no messages were sent and no stories were republished.

For the bounded world-discovery feed, retain the original attributed title, original URL and date, plus **author attribution from RSS `dc:creator`/author**. Titles are normalized to plain text and bounded to240characters; this capture transformation must be indicated rather than described as unchanged full text. Display Global Voices, creator, source URL and CC BY3.0 link near each item; label it “headline only” and retain provider timestamp. Skip missing-author or specifically restricted records instead of inventing names or fetching article bodies. No photos, logos, descriptions, original story bodies or third-party media are retained. No claim of publisher independence, ideology, ownership or national representativeness follows from the licence. This provides a source-specific commercial title-discovery basis with attribution; it does not approve full-story ingestion or model training. The initial live sample is fifteen recent items, not complete world coverage, and explicit title-country matches can be empty.

The actual primary licence and response evidence is `/tmp/signal-world-research/gv-policy/rights.json`; feed title/link/date evidence is `/tmp/signal-world-research/independent-cloud/rights.json`. Both use existing-bucket public-only build artifact paths. Future runtime refresh, not an invented fixture, must obtain actual creator metadata and preserve its own access/status receipts.

## Implemented initial provider panel

The active source registry has three feeds: **GOV.UK official communications**, **European Commission official communications** and **Global Voices**. Their institutional/publisher labels, source rights references and actual access receipts remain distinct. Global Voices retains actual author attribution, original title/link/date and its CC BY3.0 licence link; items missing required authors are skipped. All shared feeds use explicit country-title mention assignments, not publisher-country or inferred event geography. The four economic calls pin and validate World Bank `source=2` (WDI). The initial UI exposes only twenty configured selectable countries; other drawn polygons are geographic reference geometry without a source panel. Twelve-hour refresh is the acquisition cadence, not a claim that annual economic observations or every publisher update every twelve hours.

Government directory `verified` means a successful HTTP reachability check only. It does not verify an officeholder, political legitimacy, authenticity of every linked statement, content licence or continuing uptime. No incumbent-government or officeholder facts are asserted by the portal registry.

## Runtime recommendations

- Use bounded allowlisted HTTPS destinations, response byte/time limits and strict JSON/XML/date parsing. Do not fetch arbitrary article URLs. Avoid retry storms; preserve provider `Retry-After`/failure status.
- Limit the initial public cache to twenty countries, four economic indicators and bounded headline metadata from individually cleared sources. Default endpoint pages must be verified complete before claiming coverage. Older/missing economic years stay explicit.
- Separate shared public-source cache from every user's private desk/capsule evidence. Country panel rows and outbound government/media links do not become approved claims. The authorized root `signalRuntime` control/latest records can hold the bounded public snapshot without new protected rules or collections.
- Fence twelve-hour scheduled refreshes and manual retries with a lease; record attempt/start/end/partial/failed state, per-source cutoff, actual fetch timestamp and next eligible refresh. A catalogue entry is not a successful fetch.
- Keep formal desk capture/review/context/export paths available as advanced work. Import into a desk only through existing permission and source/review contracts; never silently promote public headlines to factual or native capsule memory.
