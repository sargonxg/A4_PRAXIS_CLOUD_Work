# PRAXIS CLOUD — Expansion Pack (Companion to DEFINITIVE.md)

## Use WITH PRAXIS_CLOUD_DEFINITIVE.md — This document adds and modifies prompts

> **Repo**: https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work
> **Graphify**: https://github.com/safishamsi/graphify (branch v3)
> **Graphiti**: https://github.com/getzep/graphiti (FalkorDB + Neo4j temporal memory)
>
> **What this document changes from DEFINITIVE.md**:
> 1. No Vercel — Next.js on Cloud Run via Docker (all-GCP)
> 2. Genkit Python SDK for AI flows (replaces raw google-genai calls)
> 3. User-managed API keys (Gemini, Claude, OpenAI, Firecrawl)
> 4. User-choosable graph backend (Neo4j OR FalkorDB)
> 5. Graphiti temporal memory integration
> 6. Working onboarding wizard → auto-pipeline
> 7. Internet research tools (Google Search grounding, Firecrawl)
> 8. Long-form drafting with model selection (Flash vs Pro vs Claude)
> 9. Expanded tool categorization and new tools
>
> **Execution**: Run DEFINITIVE.md Phases 1-5 first, then run these expansion prompts.

---

## ARCHITECTURAL CHANGES FROM DEFINITIVE.md

### 1. No Vercel — Everything on Cloud Run

The Next.js frontend deploys to Cloud Run as a Docker container, not Vercel. This keeps everything on GCP, uses your Google Cloud for Startups credits, and avoids split infrastructure.

```
# Frontend: Cloud Run (Next.js standalone Docker)
# Backend: Cloud Run (Python FastAPI + Genkit)
# Graph DB: Neo4j AuraDB OR FalkorDB Cloud (user choice)
# Graphiti: Temporal layer on same graph DB
# All other: Firebase Auth, Firestore, Cloud Functions, BigQuery, Cloud Storage, Pub/Sub
```

### 2. Genkit Python for AI Flows

Instead of raw `google-genai` calls, use Genkit Python SDK (v0.5+) for all AI operations. Genkit gives you: structured output with Pydantic, flow tracing/debugging, streaming, multi-provider support (Google GenAI, Vertex AI, Anthropic, OpenAI), and Firebase observability.

### 3. Graph Backend Adapter

Users choose Neo4j or FalkorDB in their settings. The Python backend uses an adapter pattern:

```python
# backend/services/graph_adapter.py
class GraphAdapter(ABC):
    async def push_graph(self, G, tenant_id, situation_id): ...
    async def query(self, tenant_id, situation_id, cypher): ...
    async def actor_profile(self, tenant_id, actor_id): ...

class Neo4jAdapter(GraphAdapter): ...    # Uses neo4j async driver
class FalkorDBAdapter(GraphAdapter): ...  # Uses falkordb-py
```

### 4. Graphiti for Temporal Memory

Every source ingested into PRAXIS also becomes a Graphiti episode. This means the conflict graph tracks WHEN facts were true — "Russia and Turkey were allied (2016-2020)" vs "Russia and Turkey have competing interests in Syria (2020-present)." Graphiti handles contradiction detection and temporal invalidation automatically.

### 5. User API Key Management

Users can bring their own API keys for: Google AI (Gemini), Anthropic (Claude), OpenAI, Firecrawl. Keys stored encrypted in Firestore at `users/{uid}/settings/api_keys`. Each AI call checks: user key first → platform default key as fallback.

---

## EXPANSION PROMPTS

### Prompt E0 — Switch Frontend to Cloud Run (Remove Vercel)

```
CONTEXT: The PRAXIS frontend currently assumes Vercel deployment. We're switching to Cloud Run so everything runs on GCP.

TASKS:

1. Delete vercel.json if it exists.

2. Update next.config.ts:
   - Add output: 'standalone' (required for Docker)
   - Remove any Vercel-specific configuration
   - Keep the proxy rewrites for local dev (backend at localhost:8080)
   - Add: images: { unoptimized: true } (Cloud Run doesn't have Vercel's image optimizer)

3. Create Dockerfile at project root (for the Next.js frontend):
   ```dockerfile
   # Stage 1: Dependencies
   FROM node:20-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci

   # Stage 2: Build
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   ENV NEXT_TELEMETRY_DISABLED=1
   RUN npm run build

   # Stage 3: Run
   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   ENV NEXT_TELEMETRY_DISABLED=1
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   USER nextjs
   EXPOSE 3000
   ENV PORT=3000
   ENV HOSTNAME="0.0.0.0"
   CMD ["node", "server.js"]
   ```

4. Create .dockerignore at project root:
   ```
   node_modules
   .next
   .git
   backend/
   cloud_functions/
   infrastructure/
   *.md
   ```

5. Update docker-compose.yml to include the frontend:
   Add a 'frontend' service that builds from the root Dockerfile, ports 3000, depends_on backend, with environment NEXT_PUBLIC_PRAXIS_BACKEND_URL=http://backend:8080.

6. Create infrastructure/deploy-frontend.sh:
   ```bash
   #!/bin/bash
   gcloud run deploy praxis-frontend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 1Gi --cpu 1 \
     --min-instances 0 --max-instances 10 \
     --set-env-vars="NEXT_PUBLIC_PRAXIS_BACKEND_URL=https://praxis-backend-${GCP_PROJECT_HASH}.run.app,NEXT_PUBLIC_FIREBASE_API_KEY=${FIREBASE_API_KEY},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${GCP_PROJECT_ID}"
   ```

7. Update infrastructure/deploy-backend.sh to output the backend URL and set it as a Cloud Run environment variable on the frontend service.

VERIFICATION:
- docker build -t praxis-frontend . (builds successfully)
- docker run -p 3000:3000 praxis-frontend (starts, serves pages)
- npm run build (still works for local dev)
```

### Prompt E1 — Genkit Python Integration (Replace Raw google-genai)

```
CONTEXT: The Python backend currently uses raw google-genai SDK calls for AI. Replace with Genkit Python SDK (v0.5+) for structured flows, multi-provider support, observability, and streaming.

REFERENCE: https://github.com/firebase/genkit (Python SDK), https://genkit.dev/docs/python/

TASKS:

1. Update backend/pyproject.toml — replace google-genai with:
   "genkit>=0.5",
   "genkit-google-genai>=0.5",  # For Google AI Studio / Vertex AI
   Add optional deps for user-provided providers:
   "genkit-anthropic>=0.5" as optional
   "genkit-openai>=0.5" as optional

2. Create backend/ai/__init__.py (empty).

3. Create backend/ai/genkit_app.py — Central Genkit initialization:
   ```python
   """PRAXIS Genkit AI application — multi-provider, user-key-aware."""
   from genkit import Genkit
   from genkit_google_genai import GoogleGenAI
   
   # Platform-level Genkit instance (uses platform API keys)
   ai = Genkit(
       plugins=[GoogleGenAI()],  # Uses GOOGLE_API_KEY or Vertex AI ADC
   )
   
   def get_ai_for_user(user_settings: dict) -> Genkit:
       """Create a Genkit instance with user's own API keys if provided."""
       plugins = []
       
       # Google GenAI (Gemini)
       google_key = user_settings.get('google_ai_key')
       if google_key:
           plugins.append(GoogleGenAI(api_key=google_key))
       else:
           plugins.append(GoogleGenAI())  # Falls back to platform key
       
       # Anthropic (if user provides key)
       anthropic_key = user_settings.get('anthropic_key')
       if anthropic_key:
           try:
               from genkit_anthropic import Anthropic
               plugins.append(Anthropic(api_key=anthropic_key))
           except ImportError:
               pass
       
       # OpenAI (if user provides key)
       openai_key = user_settings.get('openai_key')
       if openai_key:
           try:
               from genkit_openai import OpenAI
               plugins.append(OpenAI(api_key=openai_key))
           except ImportError:
               pass
       
       return Genkit(plugins=plugins)
   ```

4. Create backend/ai/flows.py — Genkit flows for all AI operations:
   ```python
   """PRAXIS AI Flows — structured Genkit flows for conflict intelligence."""
   from ai.genkit_app import ai
   from pydantic import BaseModel, Field
   from graphify_tacitus.schemas.aco import PrimitiveType
   
   # ── ACO Extraction Flow ──
   class ACOExtractionOutput(BaseModel):
       nodes: list[dict] = Field(default_factory=list)
       edges: list[dict] = Field(default_factory=list)
   
   @ai.flow()
   async def extract_aco_entities(text: str, source_file: str = "") -> ACOExtractionOutput:
       """Extract ACO conflict entities from text."""
       response = await ai.generate(
           model="googleai/gemini-2.5-flash",
           prompt=f"{ACO_EXTRACTION_PROMPT}\n\nSOURCE TEXT:\n{text[:30000]}",
           output=ACOExtractionOutput,
       )
       return response.output
   
   # ── Deep Extraction Flow (uses Pro model) ──
   @ai.flow()
   async def deep_extract_aco(text: str, source_file: str = "") -> ACOExtractionOutput:
       """Deep extraction with gemini-2.5-pro for complex sources."""
       response = await ai.generate(
           model="googleai/gemini-2.5-pro",
           prompt=f"{ACO_EXTRACTION_PROMPT}\n\nSOURCE TEXT:\n{text[:60000]}",
           output=ACOExtractionOutput,
       )
       return response.output
   
   # ── Situation Brief Flow ──
   class SituationBrief(BaseModel):
       executive_summary: str
       pivot_actors: list[dict]
       faction_analysis: list[dict]
       escalation_assessment: dict
       negotiation_space: dict
       intelligence_gaps: list[dict]
       recommended_actions: list[str]
   
   @ai.flow()
   async def generate_situation_brief(
       situation_context: str,
       graph_analysis: dict,
   ) -> SituationBrief:
       """Generate comprehensive intelligence brief from graph analysis."""
       response = await ai.generate(
           model="googleai/gemini-2.5-pro",  # Use Pro for comprehensive briefs
           prompt=f"""You are PRAXIS, a conflict intelligence AI.
           
           {situation_context}
           
           Graph Analysis Data:
           {json.dumps(graph_analysis, indent=2)[:10000]}
           
           Generate a comprehensive intelligence brief.""",
           output=SituationBrief,
       )
       return response.output
   
   # ── Tool Generation Flow (generic, used by all tools) ──
   @ai.flow()
   async def generate_tool_output(
       tool_name: str,
       tool_prompt: str,
       situation_context: str,
       model: str = "googleai/gemini-2.5-flash",
   ) -> dict:
       """Generic tool output generation with situation context."""
       response = await ai.generate(
           model=model,
           prompt=f"""You are PRAXIS, a conflict intelligence AI.
           
           {situation_context}
           
           {tool_prompt}
           
           Respond with structured JSON only.""",
           output=dict,
       )
       return response.output
   
   # ── Internet Research Flow (with Google Search grounding) ──
   @ai.flow()
   async def research_with_grounding(
       query: str,
       situation_context: str,
   ) -> dict:
       """Research using Vertex AI with Google Search grounding."""
       response = await ai.generate(
           model="googleai/gemini-2.5-flash",
           prompt=f"""Research the following question about this conflict situation.
           
           {situation_context}
           
           RESEARCH QUESTION: {query}
           
           Provide findings with source citations.""",
           config={"google_search_retrieval": {"disable_attribution": False}},
           output=dict,
       )
       return response.output
   ```

5. Update backend/graphify_tacitus/extract.py to use the Genkit flows instead of raw google-genai calls. Replace the gemini_client parameter with a call to the extract_aco_entities flow.

6. Update backend/routers/pipeline.py to use Genkit flows for extraction and brief generation.

VERIFICATION:
- cd backend && python -c "from ai.genkit_app import ai; print('Genkit OK')"
- cd backend && python -c "from ai.flows import extract_aco_entities, generate_situation_brief; print('Flows OK')"
```

### Prompt E2 — User API Keys + Model Selection + Settings

```
CONTEXT: Users should be able to provide their own API keys and choose which AI model each tool uses.

TASKS:

1. Create src/app/(app)/settings/api-keys/page.tsx:
   A settings page where users can:
   - Enter their Google AI API key (for Gemini)
   - Enter their Anthropic API key (for Claude)
   - Enter their OpenAI API key
   - Enter their Firecrawl API key (for web research)
   - Keys are shown masked after entry (first 4 chars + ****)
   - "Test Connection" button for each key
   - Save button writes to Firestore: users/{uid}/settings (as a subcollection doc 'api_keys')
   - Keys are stored as-is in Firestore (for production, note that Secret Manager should be used — add a TODO comment)
   - Show explanatory text: "Your keys are used for AI operations. If not provided, platform defaults are used."

2. Create src/app/(app)/settings/model-preferences/page.tsx:
   Users can set their default model for different tool categories:
   - "Fast Analysis" (default: gemini-2.5-flash) — used for quick extractions, stakeholder maps
   - "Deep Analysis" (default: gemini-2.5-pro) — used for briefs, dossiers, scenario analysis
   - "Creative Drafting" (default: gemini-2.5-pro) — used for talking points, briefings
   - "Research" (default: gemini-2.5-flash with search grounding) — used for deep research, media roundup
   - Dropdown options per category: gemini-2.5-flash, gemini-2.5-pro, claude-sonnet-4 (if Anthropic key provided), gpt-4o (if OpenAI key provided)
   - Save to Firestore: users/{uid}/settings (doc 'model_preferences')

3. Update the Python backend to read user settings:
   In backend/services/firestore_sync.py, add:
   - async read_user_settings(uid) → dict with api_keys and model_preferences
   
   In backend/routers/pipeline.py and all other routers:
   - After verifying Firebase token, read user settings
   - Pass user settings to get_ai_for_user() to create a user-specific Genkit instance
   - Use the user's model preferences to select the right model for each operation

4. Update the Next.js API routes (src/app/api/ai/*):
   At the top of each route, read user settings from Firestore:
   ```typescript
   const settingsSnap = await getDoc(doc(db, 'users', uid, 'settings', 'model_preferences'));
   const prefs = settingsSnap.data() || {};
   const model = prefs.deepAnalysis || 'gemini-2.5-pro'; // or fastAnalysis, etc.
   ```
   Use the selected model in the AI call.

5. Add a model indicator on each tool page:
   Show a small badge "Powered by Gemini 2.5 Pro" (or whatever model is selected) in the top-right of each tool's output area.

VERIFICATION:
- npx tsc --noEmit
- Navigate to Settings → API Keys page, verify form renders
- Navigate to Settings → Model Preferences page, verify dropdowns work
```

### Prompt E3 — Graph Backend Adapter (Neo4j + FalkorDB Choice)

```
CONTEXT: Users should be able to choose between Neo4j and FalkorDB as their graph backend. Both are supported by Graphiti for temporal memory.

REFERENCE: https://github.com/getzep/graphiti — supports both Neo4j and FalkorDB

TASKS:

1. Update backend/pyproject.toml to add:
   "falkordb>=1.1",
   "graphiti-core>=0.6",

2. Create backend/services/graph_adapter.py:
   ```python
   """Graph database adapter — supports Neo4j and FalkorDB."""
   from abc import ABC, abstractmethod
   import networkx as nx
   
   class GraphAdapter(ABC):
       @abstractmethod
       async def ensure_constraints(self): ...
       @abstractmethod
       async def push_graph(self, G: nx.Graph, tenant_id: str, situation_id: str) -> dict: ...
       @abstractmethod
       async def query_situation(self, tenant_id: str, situation_id: str) -> dict: ...
       @abstractmethod
       async def actor_profile(self, tenant_id: str, actor_id: str) -> dict: ...
       @abstractmethod
       async def shortest_path(self, tenant_id: str, source_id: str, target_id: str) -> list: ...
       @abstractmethod
       async def close(self): ...
   
   class Neo4jAdapter(GraphAdapter):
       """Neo4j graph backend using async driver."""
       def __init__(self, uri: str, user: str, password: str):
           from neo4j import AsyncGraphDatabase
           self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
       
       async def ensure_constraints(self):
           primitives = ["Actor", "Claim", "Interest", "Constraint",
                        "Leverage", "Commitment", "Event", "Narrative"]
           async with self.driver.session() as session:
               for p in primitives:
                   await session.run(
                       f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{p}) "
                       f"REQUIRE (n.id, n.tenant_id) IS UNIQUE"
                   )
       
       async def push_graph(self, G, tenant_id, situation_id):
           # ... (same as DEFINITIVE.md neo4j_client.py push logic)
           pass
       
       # ... implement all methods
       
       async def close(self):
           await self.driver.close()
   
   class FalkorDBAdapter(GraphAdapter):
       """FalkorDB graph backend — Redis-compatible, sub-ms latency."""
       def __init__(self, host: str = "localhost", port: int = 6379):
           from falkordb import FalkorDB
           self.db = FalkorDB(host=host, port=port)
           self.graph = self.db.select_graph("praxis")
       
       async def ensure_constraints(self):
           primitives = ["Actor", "Claim", "Interest", "Constraint",
                        "Leverage", "Commitment", "Event", "Narrative"]
           for p in primitives:
               try:
                   self.graph.query(f"CREATE INDEX FOR (n:{p}) ON (n.id, n.tenant_id)")
               except Exception:
                   pass  # Index may already exist
       
       async def push_graph(self, G, tenant_id, situation_id):
           for node_id, data in G.nodes(data=True):
               ptype = data.get("primitive_type", "Entity")
               props = {k: v for k, v in data.items() if isinstance(v, (str, int, float, bool))}
               props["id"] = node_id
               props["tenant_id"] = tenant_id
               props["situation_id"] = situation_id
               # FalkorDB uses Cypher-like syntax
               self.graph.query(
                   f"MERGE (n:{ptype} {{id: $id, tenant_id: $tid}}) SET n += $props",
                   {"id": node_id, "tid": tenant_id, "props": props}
               )
           # ... edges similarly
           return {"nodes": G.number_of_nodes(), "edges": G.number_of_edges()}
       
       # ... implement all methods
       
       async def close(self):
           pass  # FalkorDB client doesn't need explicit close
   
   def create_graph_adapter(provider: str, **kwargs) -> GraphAdapter:
       """Factory: create the right adapter based on user preference."""
       if provider == "falkordb":
           return FalkorDBAdapter(
               host=kwargs.get("host", "localhost"),
               port=kwargs.get("port", 6379),
           )
       else:  # default to neo4j
           return Neo4jAdapter(
               uri=kwargs.get("uri", ""),
               user=kwargs.get("user", "neo4j"),
               password=kwargs.get("password", ""),
           )
   ```

3. Add graph backend settings to the frontend:
   In src/app/(app)/settings/graph-backend/page.tsx:
   - Radio buttons: Neo4j AuraDB / Self-hosted Neo4j / FalkorDB Cloud / Self-hosted FalkorDB
   - Connection fields: URI/Host, Port, Username, Password
   - "Test Connection" button
   - Save to Firestore: users/{uid}/settings (doc 'graph_backend')
   - Default: use the platform's Neo4j instance

4. Update all backend routers to read the user's graph backend preference from Firestore and create the appropriate adapter.

5. Update docker-compose.yml: add a falkordb service alongside neo4j:
   ```yaml
   falkordb:
     image: falkordb/falkordb:latest
     ports: ["6379:6379", "3001:3000"]
   ```

VERIFICATION:
- cd backend && python -c "from services.graph_adapter import create_graph_adapter; print('Adapter OK')"
- cd backend && python -c "from services.graph_adapter import Neo4jAdapter, FalkorDBAdapter; print('Both backends OK')"
```

### Prompt E4 — Graphiti Temporal Memory Integration

```
CONTEXT: Graphiti (https://github.com/getzep/graphiti) builds temporal knowledge graphs that track when facts were true. Every source ingested into PRAXIS should also become a Graphiti episode so the conflict graph has temporal awareness — "Iran and US were in negotiations (2013-2015)" vs "Negotiations collapsed (2018)."

REFERENCE: Graphiti supports Neo4j and FalkorDB backends, uses Gemini for structured output, and has an MCP server.

TASKS:

1. Create backend/services/graphiti_client.py:
   ```python
   """Graphiti temporal memory — tracks when conflict facts were valid."""
   from graphiti_core import Graphiti
   from graphiti_core.nodes import EpisodeType
   
   class ConflictMemory:
       def __init__(self, graph_adapter_config: dict):
           """Initialize Graphiti with the user's chosen graph backend."""
           provider = graph_adapter_config.get("provider", "neo4j")
           
           if provider == "falkordb":
               from graphiti_core.driver.falkor_driver import FalkorDriver
               driver = FalkorDriver(
                   host=graph_adapter_config.get("host", "localhost"),
                   port=graph_adapter_config.get("port", 6379),
               )
           else:
               from graphiti_core.driver.neo4j_driver import Neo4jDriver
               driver = Neo4jDriver(
                   uri=graph_adapter_config.get("uri"),
                   user=graph_adapter_config.get("user", "neo4j"),
                   password=graph_adapter_config.get("password"),
               )
           
           self.graphiti = Graphiti(graph_driver=driver)
       
       async def initialize(self):
           """Build indices on first use."""
           await self.graphiti.build_indices()
       
       async def ingest_source(
           self,
           text: str,
           source_name: str,
           situation_id: str,
           source_date: str = None,
       ):
           """Add a source as a Graphiti episode — builds temporal facts."""
           await self.graphiti.add_episode(
               name=source_name,
               episode_body=text[:15000],  # Graphiti has token limits
               source=EpisodeType.text,
               group_id=situation_id,  # Tenant isolation via group_id
               reference_time=source_date,  # When the source was published
           )
       
       async def search_facts(
           self,
           query: str,
           situation_id: str,
           time_range: tuple = None,
       ) -> list:
           """Search temporal facts with optional time filtering."""
           results = await self.graphiti.search(
               query=query,
               group_ids=[situation_id],
           )
           # Filter by time range if provided
           if time_range and len(time_range) == 2:
               results = [
                   r for r in results
                   if r.valid_at and time_range[0] <= r.valid_at <= time_range[1]
               ]
           return results
       
       async def get_entity_history(self, entity_name: str, situation_id: str) -> list:
           """Get the temporal history of an entity — how facts about it changed."""
           results = await self.graphiti.search(
               query=entity_name,
               group_ids=[situation_id],
           )
           # Sort by valid_at for chronological history
           return sorted(results, key=lambda r: r.valid_at or "")
       
       async def close(self):
           await self.graphiti.close()
   ```

2. Wire Graphiti into the pipeline:
   In backend/routers/pipeline.py, after ACO extraction and graph push, ALSO add each source as a Graphiti episode:
   ```python
   # After graph push
   memory = ConflictMemory(user_graph_config)
   await memory.initialize()
   for source in sources:
       await memory.ingest_source(
           text=source.content,
           source_name=source.url or source.filename,
           situation_id=situation_id,
           source_date=source.date,
       )
   ```

3. Add temporal query endpoints in backend/routers/graph.py:
   - GET /graph/{situation_id}/timeline?from=DATE&to=DATE — temporal facts in range
   - GET /graph/{situation_id}/entity/{entity_id}/history — how an entity's facts changed
   - POST /graph/{situation_id}/temporal-search — search with time awareness

4. Add a "Timeline" view on the frontend Conflict Graph page:
   A horizontal timeline at the bottom that shows Events chronologically. Dragging the timeline range filters which graph nodes/edges are visible. Facts that were invalidated by newer information show as faded/strikethrough.

VERIFICATION:
- cd backend && python -c "from services.graphiti_client import ConflictMemory; print('Graphiti OK')"
```

### Prompt E5 — Onboarding Wizard That Actually Works

```
CONTEXT: The situation creation wizard at src/app/(app)/situations/new/page.tsx has a known critical gap: Step 3 (Context) collects URLs and files but never passes them to the backend. The pipeline never auto-runs. This must be fixed for onboarding to work.

TASKS:

1. Rewrite src/app/(app)/situations/new/page.tsx:
   
   The wizard has 4 steps. Lift ALL state to the parent component:
   
   Step 1 — Basics: name (required), description (textarea), type (dropdown: armed_conflict, political_crisis, humanitarian_emergency, hr_dispute, legal_dispute, trade_dispute, cyber_conflict, environmental_conflict), region (text input)
   
   Step 2 — Key Parties: dynamic list of actor names (add/remove). Store as parties[].
   
   Step 3 — Sources: 
   - URL input with "Add" button (stores to sourceUrls[])
   - File upload zone (PDF, DOCX, TXT — max 25MB each) — uploads to Cloud Storage, stores refs
   - Free text notes textarea (stores to contextNotes)
   - Paste from clipboard button
   
   Step 4 — Review: show all entered data, confirm button
   
   On "Create Situation":
   a. Create the situation document in Firestore with ALL data including sourceUrls, contextNotes, parties, pipelineStatus: "pending"
   b. Navigate to the new situation's dashboard
   c. Trigger the pipeline in the background:
      - POST to the Python backend: /api/v1/pipeline/run with { situation_id, sources: sourceUrls.map(url => ({type: "url", content: url})).concat(contextNotes ? [{type: "text", content: contextNotes}] : []) }
      - Show a toast: "PRAXIS is analyzing your sources..."
   d. The dashboard shows pipeline progress via onSnapshot on the situation doc (pipelineStatus field)

2. Update the dashboard to show pipeline progress:
   When pipelineStatus is "running", show a progress indicator:
   "Ingesting sources..." → "Extracting entities..." → "Building graph..." → "Analyzing..." → "Complete ✓"
   
   When pipeline completes, the graph/analysis subcollection gets populated, and the Intelligence Summary cards automatically appear (via onSnapshot from useToolData and direct Firestore subscriptions).

3. Create a "first situation" welcome state:
   If the user has 0 situations (check Firestore), show a full-page welcome:
   "Welcome to PRAXIS. Create your first situation to begin building conflict intelligence."
   Large "Get Started" button → navigates to /situations/new

4. After situation creation, auto-populate the sidebar situation selector and set the new situation as active.

VERIFICATION:
- npx tsc --noEmit
- Test: create a new situation with 2 URLs and some text notes → verify pipeline triggers → verify graph populates → verify dashboard shows intelligence
```

### Prompt E6 — Internet Research + Deep Drafting Tools

```
CONTEXT: Some tools need live internet research (Deep Research, Media Roundup, Actor Enrichment). Others need long-form drafting with top-tier models (Briefing, Dossier, Policy Memo). This prompt ensures both capabilities work properly.

TASKS:

1. Create src/app/api/ai/deep-research/route.ts (or update if exists):
   This tool MUST use internet research. Implementation:
   a. Load situation context (graph analysis, intelligence gaps)
   b. Use Vertex AI with Google Search grounding:
      ```typescript
      const model = google('gemini-2.5-flash', {
        useSearchGrounding: true,  // Enables Google Search
      });
      ```
   c. Construct research queries from intelligence_gaps (from graph analysis) — these are the things we DON'T know
   d. For each gap, run a grounded search query
   e. Synthesize findings into a structured research report
   f. Save to Firestore tools/deep_research with source citations
   g. Deduct 5 credits (research is expensive)

2. If Firecrawl is available (user has API key), create an enhanced research mode:
   In src/lib/services/firecrawl-service.ts:
   - Check if user has a Firecrawl key in their settings
   - If yes, use Firecrawl to deeply scrape relevant URLs for full content
   - Feed the full scraped content to Gemini for extraction
   - This gives much richer results than Google Search grounding alone

3. Update the Briefing tool (src/app/api/ai/briefing/route.ts):
   - ALWAYS use gemini-2.5-pro (or user's selected "deep analysis" model)
   - Load ALL prior tool outputs as context (this is the most comprehensive tool)
   - Generate a structured 3000-5000 word intelligence briefing with:
     - Executive Summary
     - Situation Overview (from graph)
     - Key Actors & Factions (from stakeholder map)
     - Escalation Assessment (from escalation scan)
     - Risk Analysis (from risk assessment)
     - Media & Narrative Landscape (from media analysis)
     - Negotiation Prospects (from negotiation prep)
     - Recommendations
   - Save to Firestore
   - Add "Export as DOCX" button on the briefing page that calls /api/export/docx

4. Update the Dossier tool (src/app/api/ai/dossier/route.ts):
   - Accept a target actor ID as parameter
   - Load the actor's full profile from the graph (all connected entities)
   - Use gemini-2.5-pro for comprehensive analysis
   - Generate a 2000-4000 word dossier covering:
     - Background & Affiliation
     - Stated Positions & Claims
     - Underlying Interests (stated + assessed unstated)
     - Capabilities & Leverage
     - Commitments & Track Record
     - Narrative Strategy
     - Key Relationships
     - Assessment & Outlook

5. Create a NEW tool: Policy Memo (src/app/api/ai/policy-memo/route.ts):
   - New page at src/app/(app)/policy-memo/page.tsx
   - Generates a 1-2 page policy recommendation memo
   - User selects: target audience (UN Security Council / Head of State / NGO leadership / Corporate board)
   - Uses gemini-2.5-pro with full situation context
   - Structured as: Issue / Background / Analysis / Options / Recommendation
   - Add to sidebar navigation under "Production" tools

6. Create a NEW tool: Situation Comparison (src/app/api/ai/compare/route.ts):
   - User selects 2 situations they own
   - Loads both graph analyses
   - Uses AI to compare: actor structures, escalation patterns, negotiation spaces
   - Identifies what's similar and what's different
   - Useful for finding patterns across conflicts

7. Update the Media Roundup tool to use Google Search grounding for live news:
   - Query: "latest news {situation_name} {key_actors} conflict"
   - Parse results into structured article list
   - Identify narrative themes
   - Save to Firestore

VERIFICATION:
- npx tsc --noEmit
- Test: open Deep Research tool, generate → verify it returns results with citations
- Test: open Briefing tool, generate → verify it produces a comprehensive multi-section brief
```

### Prompt E7 — Tool Categorization, Navigation Redesign, New Tools

```
CONTEXT: The 25+ tools need better organization. Currently the sidebar is a flat list. Reorganize into logical categories that reflect how an analyst actually works.

TASKS:

1. Update src/components/app/app-sidebar.tsx (or wherever the sidebar navigation is defined):

   New navigation structure:

   SITUATION (always visible)
   ├── Dashboard
   ├── Conflict Graph (Compass)
   └── Timeline

   INTELLIGENCE (graph-powered views — fast, no AI call needed)
   ├── Stakeholder Map (Actors from graph)
   ├── Escalation Monitor (Events + Glasl stage)
   ├── Commitment Tracker (Commitments from graph)
   ├── Early Warning (high-impact Events + thresholds)
   └── Info Environment (Narratives from graph)

   ANALYSIS (AI-generated, grounded in graph)
   ├── Scenario Analysis
   ├── Risk Assessment
   ├── Negotiation Prep (ZOPA/BATNA)
   ├── Media & Narrative Analysis
   ├── Sanctions & Compliance
   ├── Treaty & Legal Analysis
   └── Historical Parallels

   PRODUCTION (long-form AI drafting)
   ├── Intelligence Briefing
   ├── Diplomatic Dossier
   ├── Talking Points
   ├── Policy Memo (NEW)
   ├── Mediation Design
   └── UN Toolkit

   RESEARCH (internet + deep analysis)
   ├── Deep Research
   ├── Actor Enrichment
   ├── Source Monitor (NEW — RSS/feed tracking)
   └── Situation Comparison (NEW)

   WORKSPACE
   ├── AI Assistant (chat)
   ├── Documents
   ├── Reports
   ├── Export Center (NEW — all exports in one place)
   └── Team (sharing)

   SETTINGS
   ├── Profile
   ├── API Keys
   ├── Model Preferences
   ├── Graph Backend
   └── Billing

2. Each category should be collapsible in the sidebar.

3. Add category icons using Lucide React:
   - INTELLIGENCE: Brain
   - ANALYSIS: BarChart3
   - PRODUCTION: FileText
   - RESEARCH: Search
   - WORKSPACE: FolderOpen
   - SETTINGS: Settings

4. Create the new pages if they don't exist:
   - src/app/(app)/timeline/page.tsx — chronological Event view from graph
   - src/app/(app)/policy-memo/page.tsx — Policy Memo drafting tool
   - src/app/(app)/source-monitor/page.tsx — RSS/feed tracking (GDELT, ACLED, ReliefWeb monitoring)
   - src/app/(app)/export-center/page.tsx — centralized export: PDF, DOCX, PPTX of any tool output
   - src/app/(app)/compare/page.tsx — Situation Comparison tool

5. For each new page, use the useToolData hook pattern from DEFINITIVE.md Prompt 3.3.

6. Create the Export Center:
   - Lists all tools that have generated data for the current situation
   - "Export All as PDF" button — generates a comprehensive report
   - Individual export buttons per tool (DOCX, PDF)
   - Uses the existing export infrastructure in src/app/api/export/

VERIFICATION:
- npx tsc --noEmit
- Navigate through all sidebar sections, verify all pages load
- Verify collapsible categories work
```

### Prompt E8 — Complete GCP Deployment (Cloud Run + Cloud Build)

```
CONTEXT: Everything deploys to GCP. No Vercel. Both frontend and backend on Cloud Run. Cloud Functions for async triggers. BigQuery for analytics. Cloud Storage for files.

TASKS:

1. Create cloudbuild.yaml at project root:
   ```yaml
   steps:
     # Build and deploy backend
     - name: 'gcr.io/cloud-builders/docker'
       args: ['build', '-t', 'gcr.io/$PROJECT_ID/praxis-backend', './backend']
     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/praxis-backend']
     - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
       entrypoint: gcloud
       args: ['run', 'deploy', 'praxis-backend',
              '--image', 'gcr.io/$PROJECT_ID/praxis-backend',
              '--region', 'us-central1', '--allow-unauthenticated',
              '--memory', '2Gi', '--cpu', '2', '--timeout', '300',
              '--min-instances', '0', '--max-instances', '10',
              '--set-env-vars', 'GCP_PROJECT_ID=$PROJECT_ID,GCP_REGION=us-central1']

     # Get backend URL for frontend config
     - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
       entrypoint: bash
       args:
         - '-c'
         - 'gcloud run services describe praxis-backend --region=us-central1 --format="value(status.url)" > /workspace/backend_url.txt'

     # Build and deploy frontend
     - name: 'gcr.io/cloud-builders/docker'
       args: ['build', '-t', 'gcr.io/$PROJECT_ID/praxis-frontend',
              '--build-arg', 'NEXT_PUBLIC_PRAXIS_BACKEND_URL=$(cat /workspace/backend_url.txt)',
              '.']
     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/praxis-frontend']
     - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
       entrypoint: gcloud
       args: ['run', 'deploy', 'praxis-frontend',
              '--image', 'gcr.io/$PROJECT_ID/praxis-frontend',
              '--region', 'us-central1', '--allow-unauthenticated',
              '--memory', '1Gi', '--cpu', '1',
              '--min-instances', '0', '--max-instances', '10']
   ```

2. Update the root Dockerfile to accept build args:
   Add: ARG NEXT_PUBLIC_PRAXIS_BACKEND_URL
   ENV NEXT_PUBLIC_PRAXIS_BACKEND_URL=$NEXT_PUBLIC_PRAXIS_BACKEND_URL
   (Place before the npm run build step)

3. Create infrastructure/setup-gcp.sh — comprehensive one-time setup:
   ```bash
   #!/bin/bash
   set -e
   PROJECT_ID=$(gcloud config get-value project)
   
   echo "Enabling APIs..."
   gcloud services enable \
     run.googleapis.com artifactregistry.googleapis.com \
     cloudbuild.googleapis.com aiplatform.googleapis.com \
     bigquery.googleapis.com pubsub.googleapis.com \
     cloudfunctions.googleapis.com cloudscheduler.googleapis.com \
     firestore.googleapis.com secretmanager.googleapis.com \
     storage.googleapis.com
   
   echo "Creating Artifact Registry..."
   gcloud artifacts repositories create praxis \
     --repository-format=docker --location=us-central1
   
   echo "Creating BigQuery dataset..."
   bq mk --dataset ${PROJECT_ID}:praxis_analytics
   
   echo "Creating Pub/Sub topics..."
   for topic in praxis.pipeline praxis.extract praxis.ingest praxis.alert; do
     gcloud pubsub topics create $topic 2>/dev/null || true
   done
   
   echo "Creating Cloud Storage bucket..."
   gsutil mb -l us-central1 gs://${PROJECT_ID}-praxis-uploads 2>/dev/null || true
   
   echo "Creating Cloud Scheduler jobs..."
   gcloud scheduler jobs create http gdelt-poller \
     --schedule="*/15 * * * *" \
     --uri="https://praxis-backend-${PROJECT_ID}.run.app/api/v1/feeds/gdelt-poll" \
     --http-method=POST \
     --oidc-service-account-email=${PROJECT_ID}@appspot.gserviceaccount.com \
     2>/dev/null || echo "Scheduler job already exists"
   
   echo "Setting up service account permissions..."
   SA="${PROJECT_ID}@appspot.gserviceaccount.com"
   for role in aiplatform.user bigquery.dataEditor firestore.user pubsub.subscriber storage.objectAdmin secretmanager.secretAccessor; do
     gcloud projects add-iam-policy-binding $PROJECT_ID \
       --member="serviceAccount:${SA}" --role="roles/${role}" --quiet
   done
   
   echo "Done! Run 'gcloud builds submit' to deploy."
   ```

4. Create infrastructure/deploy.sh — one-command deploy:
   ```bash
   #!/bin/bash
   gcloud builds submit --config=cloudbuild.yaml
   echo "Deploy complete!"
   echo "Frontend: $(gcloud run services describe praxis-frontend --region=us-central1 --format='value(status.url)')"
   echo "Backend: $(gcloud run services describe praxis-backend --region=us-central1 --format='value(status.url)')"
   ```

5. Create a comprehensive .env.example at project root with ALL variables grouped by service.

6. Update CLAUDE.md with complete deployment instructions:
   - Local dev: npm run dev + docker-compose up
   - Deploy: ./infrastructure/setup-gcp.sh (once) then ./infrastructure/deploy.sh
   - Custom domain: gcloud run domain-mappings create

VERIFICATION:
- docker-compose up --build (both services start locally)
- curl http://localhost:8080/health (backend responds)
- open http://localhost:3000 (frontend loads)
```

### Prompt E9 — Final Integration Test + Production Polish

```
CONTEXT: Final verification that everything works end-to-end.

TASKS:

1. Create backend/tests/test_full_pipeline.py:
   - Fixture: Sudan conflict text (3 paragraphs about SAF vs RSF)
   - Test: extract → build → cluster → analyze → report
   - Verify: Actors include SAF and RSF, Glasl stage > 3, factions detected
   - Test the graph adapter with both Neo4j and FalkorDB mocks

2. Run comprehensive frontend checks:
   - npx tsc --noEmit
   - npm run build (production build succeeds)
   - grep -r "useToolData" src/app/ | wc -l (>= 25, one per tool page)
   - grep -r "buildSituationContext" src/app/api/ | wc -l (>= 20)
   - grep -r "writeToolData" src/app/api/ | wc -l (>= 20)
   - grep -r "withAuth" src/app/api/ai/ | wc -l (matches number of AI route files)

3. Verify Firestore security rules:
   Create or update firestore.rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. Update CLAUDE.md to be the DEFINITIVE developer guide covering:
   - Architecture: Next.js (Cloud Run) + Python backend (Cloud Run) + Firebase + GCP services
   - Graphify pipeline: extract → build → cluster → analyze → report → export
   - Graphiti temporal memory: episodes → temporal facts → temporal queries
   - ACO: 8 primitives, 42 relationships, confidence levels
   - Tool wiring: useToolData → API route → buildSituationContext → Genkit flow → writeToolData → onSnapshot
   - Graph backend: Neo4j or FalkorDB (user choice via adapter)
   - User API keys: stored in Firestore settings, used per-request
   - Model selection: Flash (fast) vs Pro (deep) vs Claude (if key provided)
   - Tool categories: Intelligence (graph views), Analysis (AI+graph), Production (drafting), Research (internet)
   - Local dev: npm run dev + docker-compose up (backend + neo4j + falkordb)
   - Deploy: ./infrastructure/setup-gcp.sh then ./infrastructure/deploy.sh
   - Environment variables: complete grouped list
   - Design: Navy/Emerald/Gold colors, EB Garamond/Inter/JetBrains Mono fonts
   - ACO colors: Actor=#4E79A7, Claim=#F28E2B, Interest=#59A14F, Constraint=#E15759, Leverage=#EDC948, Commitment=#76B7B2, Event=#B07AA1, Narrative=#FF9DA7

5. Create a README.md for the repo that serves as the public-facing documentation:
   - What PRAXIS is (conflict intelligence OS powered by knowledge graphs)
   - Screenshots/demo link
   - Quick start (local dev)
   - Architecture overview
   - Technology stack
   - Contributing
   - License

VERIFICATION:
- cd backend && python -m pytest tests/ -v (all pass)
- npm run build (succeeds)
- docker-compose up --build (all services start)
- Full flow: create situation → add URLs → pipeline runs → graph appears → tools generate
```

---

## EXECUTION ORDER (COMPLETE)

### From DEFINITIVE.md (run these first):
1. Prompt 1.1 — Backend scaffold + Firebase auth
2. Prompt 1.2 — ACO schemas + conflict extraction
3. Prompt 1.3 — Build + cluster + analyze + report + export
4. Prompt 2.1 — GCP service clients
5. Prompt 2.2 — FastAPI routers
6. Prompt 3.1 — Tool data service + context builder + backend client
7. Prompt 3.2 — Wire all API routes to context + Firestore
8. Prompt 3.3 — Wire all tool pages to useToolData

### From this Expansion Pack (run these after):
9. Prompt E0 — Switch to Cloud Run (no Vercel)
10. Prompt E1 — Genkit Python integration
11. Prompt E2 — User API keys + model selection
12. Prompt E3 — Graph backend adapter (Neo4j + FalkorDB)
13. Prompt E4 — Graphiti temporal memory
14. Prompt E5 — Onboarding wizard fix
15. Prompt E6 — Internet research + deep drafting
16. Prompt E7 — Tool categorization + new tools
17. Prompt E8 — GCP deployment
18. Prompt E9 — Final test + polish

### From DEFINITIVE.md (run last):
19. Prompt 4.1 — Dashboard + graph page wiring
20. Prompt 5.1 — Integration tests
21. Prompt 5.2 — Final verification

**Total: 21 prompts. Estimated execution: 25-35 hours of Claude Code time.**
