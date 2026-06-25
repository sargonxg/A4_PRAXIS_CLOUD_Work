# PRAXIS Data Controller ADK Agent

This is the Google ADK/Agent Runtime lane for PRAXIS work that needs managed
sessions, Vertex RAG repositories, BigQuery analytics, or long-running
planner/researcher/synthesizer execution.

It does not replace Ask PRAXIS, ContextCapsules, the Cloud SQL AgentRun ledger,
or PRAXIS review cards. It runs behind the existing queued worker path and must
mirror session ids, tool calls, RAG retrieval ids, BigQuery query metadata, and
outputs back into PRAXIS.

## Deploy Shape

```powershell
cd C:\Users\giuli\tacitus-products\praxis\backend\agents
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
adk deploy agent_engine `
  --project=praxisbytacitus `
  --region=us-central1 `
  --staging_bucket=gs://praxisbytacitus-agent-staging `
  --display_name="PRAXIS Data Controller" `
  --adk_app=praxis_data_controller.agent.app `
  praxis_data_controller
```

Do not run the deploy command until `npm run audit:google-agent-platform
-- --production` is intentionally being used as a preflight and the cloud
mutation is approved.

## Tool Boundaries

- `capsule_context_reader`: asks PRAXIS for owner-scoped capsule snapshots.
- `vertex_rag_retrieval`: plans retrieval against a mounted Vertex RAG corpus.
- `BigQueryToolset`: bounded analytics only; no arbitrary user-visible SQL
  without PRAXIS receipts.
- `review_card_proposer`: proposes review cards; does not apply mutations.

## Official Sources

- ADK Agent Runtime deployment: https://google.github.io/adk-docs/deploy/agent-runtime/
- ADK BigQuery tooling: https://google.github.io/adk-docs/integrations/bigquery-agent-analytics/
- Vertex RAG Store retrieval config: https://google.github.io/adk-docs/api-reference/agentconfig/
