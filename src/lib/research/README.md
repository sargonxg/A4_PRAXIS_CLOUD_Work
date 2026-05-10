# Research pipeline module

Future home for Research Pipeline orchestration. Will compose Firecrawl,
Parallel AI, and Google Grounded Search clients into a tiered retrieval
pipeline with source-tier discipline (T0–T7), citation tracking, and
deduplication.

Status: empty placeholder. Existing research-adjacent code lives at:

- `src/app/api/ai/deep-research/`, `src/app/api/ai/grounded-search/`, `src/app/api/ai/discover-sources/`, `src/app/api/ai/source-scout/`.
- `src/lib/data-feeds/` — feed clients.
- `backend/services/` — backend research-side helpers.

Do not add files here without an approved ADR or v7 slice covering the
research pipeline contract.
