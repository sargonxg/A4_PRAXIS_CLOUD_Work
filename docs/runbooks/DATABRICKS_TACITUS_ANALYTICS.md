# Databricks TACITUS Analytics Runbook

Status: optional analytics lane for PRAXIS and DIALECTICA.

Databricks can help TACITUS analyze capsule quality, graph evolution, review
latency, and PRAXIS answer improvement. It must not become a hidden canonical
store for PRAXIS user state or DIALECTICA capsule truth.

## Local Profile

Expected local profile:

```text
tacitus
```

Refresh OAuth when the profile is invalid:

```powershell
databricks auth login --host "https://dbc-69e04818-40fb.cloud.databricks.com?account_id=7caac1c1-eb1d-4290-a26b-77dd326ae5bb" --profile tacitus
```

Verify:

```powershell
databricks auth profiles
databricks current-user me --profile tacitus
```

DIALECTICA also has a local non-secret checker:

```powershell
cd C:\Users\giuli\A3_DIALECTICAbyTACITUS_v3\tools\python
python -m dialectica_tools.databricks_connection --profile tacitus
```

## PRAXIS Boundary

Allowed PRAXIS exports:

- aggregate agent-run metrics;
- answer quality evals;
- capsule-vs-baseline deltas;
- source coverage counts;
- graph delta review counts;
- freshness and failure-rate metrics.

Do not export by default:

- raw private notes;
- raw uploaded documents;
- unpublished user source text;
- full Ask PRAXIS transcripts;
- credentials or session data.

Raw text export requires an explicit product/security decision and a dedicated
data-classification note.

## DIALECTICA Boundary

DIALECTICA should be the first producer of Databricks graph/capsule snapshots.
PRAXIS should consume only derived metrics or receipts unless a later ADR
creates a reviewed, authenticated analytics API.

First useful DIALECTICA outputs:

- `graph_nodes` and `graph_edges` keyed by `snapshot_id`, `workspace_id`,
  `capsule_id`, and `bundle_digest`;
- `capsule_builds`;
- `read_receipts`;
- `answer_quality`.

## First Proof

The first Databricks proof now exists as a deployed DIALECTICA bundle.

Job:

```text
https://dbc-69e04818-40fb.cloud.databricks.com/jobs/1123194333821498?o=7474658425841042
```

Latest successful run:

```text
https://dbc-69e04818-40fb.cloud.databricks.com/?o=7474658425841042#job/1123194333821498/run/697665372540171
```

Databricks App:

```text
https://tacitus-capsule-builder-dev-7474658425841042.aws.databricksapps.com
```

Databricks MCP server app:

```text
https://mcp-tacitus-capsules-dev-7474658425841042.aws.databricksapps.com/mcp
```

The job creates:

- four capsule families: `USER`, `SITUATION`, `TOOL`, and `OUTPUT`;
- a guided PRAXIS-style builder session;
- source connector requests for upload, PRAXIS history, Gmail OAuth, and
  Ladybug/Postgres graph snapshots;
- similarity matches across prior capsules;
- candidate ontology, semantic graph, temporal, and causal layers;
- 1,000 synthetic candidate graph nodes and 1,500 candidate graph edges;
- 16 reviewable improvement proposals;
- 4 deterministic PRAXIS agent guidance frames;
- 4 guided-builder context-pack exports.
- 4 Databricks AI extraction runs using `ai_query` against
  `databricks-gpt-5-mini`;
- 4 capsule ontology design cards covering primitive classes, temporal
  primitives, causal primitives, review rules, and agent controls;
- Databricks click-path and platform-story views for demos;
- a Databricks-native Capsule Operations Agent tab;
- MCP tool contracts and a custom MCP server app for controlled workspace
  inspection, workflow triggering, and Codex feedback queueing;
- dashboard-ready Databricks views;
- an AI-search-ready Delta source table;
- saved SQL queries named `TACITUS Capsule Factory - ...`;
- a Databricks App control-room view.

Workspace demo path:

```text
https://dbc-69e04818-40fb.cloud.databricks.com/browse?o=7474658425841042
```

Open `Workflows`, `Catalog`, `SQL Editor`, and `Apps` in that order. In the
App, start with `Agent / MCP`, `Showroom`, `AI Extraction Lab`, and `Ontology`;
then move to Portfolio, Graph, Review, Agent Guidance, AI Search Corpus, and
Exports.

PRAXIS should treat those exports as review-card proposals. They must not
silently write to Firestore capsules, active context stacks, output capsules,
or agent-run canonical state.

This keeps PRAXIS simple while giving TACITUS a governed lakehouse lane for
analytics and experiments.
