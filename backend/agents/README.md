# PRAXIS Vertex AI Agent Engine — backend

This folder holds the deployable Vertex AI Agent Engine (Reasoning Engine)
that backs the PRAXIS Deep Research Agent tool at `/app/deep-search-agent`.

> The full walk-through is in **`docs/USER_ACTION_LIST.md` §3**. This README is
> the in-folder quick reference. Recipe verified against
> `docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
> §R1 on 2026-04-25.

## Files

- `deploy.py` — registers a 3-phase agent (planner → researcher →
  synthesizer) with Vertex AI Agent Engine, prints the resource path
  and numeric engine ID on success.
- `requirements.txt` — pinned Python deps (Python 3.10–3.12).
- `deep_research/` — earlier in-process agent code, kept for
  reference. The deploy.py above is the new authoritative path.

## TL;DR deploy

```bash
cd backend/agents

# one-time setup
python3 -m venv .venv
source .venv/bin/activate    # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
gcloud auth application-default login

# deploy
python deploy.py
```

Capture the numeric engine ID printed at the end. Save it to Secret
Manager:

```bash
echo -n "<NUMERIC_ID>" | gcloud secrets create praxis-vertex-adk-engine-id \
  --data-file=- --project=praxisbytacitus
gcloud secrets add-iam-policy-binding praxis-vertex-adk-engine-id \
  --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=praxisbytacitus
```

Add `VERTEX_AGENT_ENGINE_ID=praxis-vertex-adk-engine-id:latest` to the
frontend `--update-secrets` flag in `cloudbuild.yaml`. Redeploy.

Verify:

```bash
curl -s https://praxis.tacitus.me/api/health | jq '.checks.vertex_adk'
# expect "ok"
```

## IAM (one-time)

The Cloud Run runtime service account must hold `roles/aiplatform.user`
to invoke the engine. There is no separate `roles/aiplatform.reasoningEngineUser`
as of April 2026.

```bash
gcloud projects add-iam-policy-binding praxisbytacitus \
  --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

## Costs

vCPU $0.0864/hr + RAM $0.0090/GB-hr + Gemini token costs per phase
(Flash for plan/research, Pro for synthesise). A typical 3-phase
research run is a few cents; daily spend at 50 researches is roughly
$5–8.

## Troubleshooting

- **Python 3.13 errors** — Agent Engine doesn't support 3.13 yet. Use 3.10–3.12.
- **`PermissionDenied: aiplatform.reasoningEngines.create`** — your
  user (not the runtime SA) needs `roles/aiplatform.user` to deploy.
  Run `gcloud auth application-default login` again with an account
  that has Owner or Vertex AI Admin.
- **`bucket does not exist`** — you skipped step `gsutil mb -p
  praxisbytacitus -l us-central1 gs://praxisbytacitus-agent-staging`.
- **Validate locally before deploying:**
  ```python
  import vertexai
  from deploy import build_agent
  vertexai.init(project="praxisbytacitus", location="us-central1")
  agent = build_agent()
  print(agent.name)
  ```
