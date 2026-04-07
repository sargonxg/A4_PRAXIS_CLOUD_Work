# PRAXIS CLOUD — Definitive Transformation Plan

## The Knowledge Graph That Makes Everything Real

---

## PART 1: WHAT THIS APP CAN DO AND WHY THE GRAPH CHANGES EVERYTHING

### The Problem Today

PRAXIS currently has 21 AI tools. Every one of them calls Gemini independently with just the situation's name and description. The AI hallucinates actors, invents relationships, has no memory of what other tools already generated, and produces generic output that could apply to any conflict. A user who generates a "Stakeholder Map" and then generates a "Negotiation Prep" gets two outputs that may reference completely different actors with contradictory relationships. There is no shared state, no ground truth, no institutional memory.

### What the Graph Changes

When Graphify (https://github.com/safishamsi/graphify) enters the picture, PRAXIS goes from "21 disconnected AI calls" to "one living knowledge graph that powers everything." Here is how it works in practice:

**Step 1 — User creates a situation.** They describe it: "The Sudan civil war between the SAF and RSF, with regional involvement from Egypt, UAE, and Ethiopia." They paste 5 URLs from Reuters, upload a PDF from the ICG, connect the ACLED feed for Sudan.

**Step 2 — The Graphify pipeline runs.** It reads every source, extracts ACO entities (16 Actors including the SAF, RSF, Hemeti, al-Burhan, IGAD, Egypt, UAE; 8 Claims including territorial control, legitimate governance, civilian protection; 12 Interests including resource control, regime survival, regional influence; 5 Leverage points including arms supply, sanctions pressure; 9 Events with dates and escalation scores; 4 Narratives including "restoring democracy" vs "fighting terrorism"), identifies 42 typed relationships between them, builds a NetworkX graph, clusters it into factions via Leiden community detection, and pushes the result to Neo4j and Firestore.

**Step 3 — Every tool now sees the real graph.** When the user opens "Negotiation Prep," the AI prompt includes: "The SAF faction (Actors: SAF, al-Burhan, Egypt — shared interests: regime preservation, territorial integrity; leverage: air superiority, diplomatic recognition) and the RSF faction (Actors: RSF, Hemeti, UAE — shared interests: resource control, autonomy; leverage: ground control, gold revenue). Escalation at Glasl Stage 7. The ZOPA analysis shows potential overlap on civilian corridor commitments…" The tool output is grounded in real entities with real relationships that the user can verify, edit, and trace back to sources.

**Step 4 — Tools feed each other.** The Scenario Analysis tool reads the Risk Assessment output, the Escalation Scan, and the Negotiation Space analysis. The Briefing tool reads every prior tool output and synthesizes a comprehensive brief. The graph is the shared brain.

### What Each Tool Can Do (With the Graph)

**Tools that become GRAPH VIEWS (no separate AI call needed — just query the graph):**

| Tool | What It Becomes | How |
|------|----------------|-----|
| Stakeholder Map | Interactive graph filtered to Actors, colored by faction, with relationship edges | Read from `graph/snapshot`, filter nodes where `primitive_type == "Actor"` |
| Escalation Scan | Glasl stage indicator + event timeline + escalation chain | Read from `graph/analysis.escalationAssessment` |
| Commitment Scan | Table of all Commitment entities with status | Read from `graph/snapshot`, filter `primitive_type == "Commitment"` |
| Actor Enrichment | Full actor profile page with all connected entities | Query graph for a single Actor and its neighborhood |
| Early Warning | Dashboard of high-escalation Events + threshold alerts | Read Events with `escalation_impact > 0.5` from graph |

**Tools that become MUCH BETTER (still use Gemini but grounded in graph):**

| Tool | What Graph Adds | Key Context Injected |
|------|----------------|---------------------|
| Scenario Analysis | Real actors, real leverage, real constraints — not hypothetical ones | Factions, leverage asymmetries, escalation trajectory |
| Dossier | Complete actor dossier with traced claims, interests, commitments | Full actor neighborhood from graph |
| Briefing | Synthesizes ALL prior tool outputs into coherent brief | All tool data + graph analysis + situation metadata |
| Talking Points | Audience-specific points grounded in real actor positions | Party positions, claims, interests from graph |
| Negotiation Prep | ZOPA computed from actual overlapping interests across factions | negotiation_space analysis from graph |
| Mediation Design | Process design based on actual faction structure and power dynamics | Faction map, leverage map, commitment history |
| Risk Assessment | 5-dimension risk computed from real events and actor capabilities | Event data, actor capabilities, constraint analysis |
| Media Analysis | Narrative ecosystem mapped to actual actors and claims | Narrative entities from graph + GDELT feed data |
| Sanctions Scan | Entities checked against real actors in the graph | Actor list with affiliations |
| Treaty Analysis | Obligations mapped to real commitments and actors | Commitment entities + actor relationships |
| UN Toolkit | Relevant mechanisms based on conflict type and escalation stage | Escalation stage, conflict type, actor types |
| Deep Research | Web research targeted at actual intelligence gaps | intelligence_gaps from graph analysis |
| Historical Parallels | Parallels based on real conflict structure, not just keywords | Faction structure, escalation stage, conflict type |
| Info Environment | Narrative map with actual propagators and targets | Narrative entities + Actor relationships |
| Calendar | Timeline of real events + commitment deadlines | Event entities with dates + Commitment due dates |

### The Net Effect

Without the graph, PRAXIS is a collection of AI prompts — clever, but fundamentally generic. With the graph, PRAXIS becomes a **conflict intelligence operating system** where every piece of analysis is traceable to sources, every actor is real, every relationship is typed and confidence-scored, and every tool builds on every other tool's output. This is the difference between a ChatGPT wrapper and a Palantir competitor.

---

## PART 2: ARCHITECTURE

### What Stays (Firebase-Native)

PRAXIS already has a solid Firebase-native architecture. We keep all of it:

- **Firebase Auth** — Google sign-in, session management, `withAuth()` middleware
- **Firestore** — Single source of truth for all data: `users/{uid}/situations/{sitId}/...`
- **Vercel AI SDK** — Streaming AI responses in tool API routes
- **Zustand stores** — Client state management (situation, conflict, notification, preferences)
- **Credit system** — `checkAndDeductCredits()` for usage metering
- **Data feed clients** — ACLED, GDELT, ReliefWeb, HDX, World Bank (in `src/lib/data/`)
- **All 25+ UI pages** — dashboard, tools, settings, etc.
- **Vercel deployment** for the Next.js frontend

### What Gets Added (Python Backend on Cloud Run)

A Python FastAPI service that runs the heavy graph processing. It authenticates every request by verifying Firebase ID tokens via `firebase-admin`. After processing, it writes results back to Firestore so the frontend always reads from one place.

**Why Python?** Graphify is Python. NetworkX is Python. Leiden clustering (graspologic) is Python. Neo4j's best driver is Python. The google-genai SDK works in Python. Tree-sitter is Python. There is no benefit to rewriting any of this in TypeScript.

**Why Cloud Run?** The pipeline is CPU-intensive but bursty — you need it when processing sources (seconds to minutes of heavy compute) but not between runs. Cloud Run scales to zero, handles bursts, and is native GCP. It also runs on your Google Cloud for Startups credits.

### Architecture Diagram

```
USER BROWSER
     │
     ▼
VERCEL (Next.js Frontend)
├── Firebase Auth (login, session)
├── Firestore reads (onSnapshot for real-time tool data)
├── API Routes (/api/ai/*) → Gemini via Vercel AI SDK
│   └── Each route: withAuth → load situation context → call Gemini → write to Firestore
├── Backend calls (/api/v1/*) → proxied to Cloud Run
│   └── Pipeline run, graph queries, visualization
└── Static pages, UI components, Zustand stores
     │
     │ Firebase ID token in Authorization header
     ▼
CLOUD RUN (Python Backend)
├── FastAPI + firebase-admin (verify tokens)
├── graphify_tacitus/ (forked Graphify pipeline)
│   ├── extract.py → Gemini (google-genai SDK) → ACO entities
│   ├── build.py → NetworkX graph
│   ├── cluster.py → Leiden communities (graspologic)
│   ├── analyze.py → pivot actors, hidden linkages, escalation, factions
│   ├── export.py → Neo4j push, HTML visualization, JSON
│   └── serve.py → MCP server for agentic queries
├── services/
│   ├── firestore_sync.py → write results back to Firestore
│   ├── neo4j_client.py → DIALECTICA graph database
│   ├── gemini_client.py → google-genai SDK (Vertex AI)
│   └── bigquery_client.py → analytics and audit logging
└── routers/ → FastAPI endpoints
     │
     ▼
GCP SERVICES
├── FIRESTORE — all data (users, situations, tools, graph snapshots)
├── NEO4J AURADB — persistent conflict knowledge graph (DIALECTICA)
├── VERTEX AI — Gemini 2.5 Flash/Pro for extraction
├── BIGQUERY — pipeline audit logs, GDELT cache, usage metrics
├── CLOUD FUNCTIONS v2 — event triggers:
│   ├── onSituationCreated → trigger pipeline
│   ├── onDocumentUploaded → trigger extraction
│   ├── gdeltPoller (Cloud Scheduler, every 15min)
│   └── alertEvaluator (Pub/Sub, on new events)
├── CLOUD STORAGE — file uploads, PDF exports
├── PUB/SUB — async pipeline orchestration
└── CLOUD SCHEDULER — periodic feed polling
```

### Firestore Data Model (Complete)

```
users/{uid}/
  ├── profile: { name, email, org, role, credits, plan, createdAt }
  │
  └── situations/{sitId}/
      ├── (root doc): { name, description, type, region, parties[],
      │                  status, pipelineStatus, lastPipelineRun,
      │                  escalationStage, nodeCount, edgeCount,
      │                  sourceUrls[], contextNotes,
      │                  createdAt, updatedAt }
      │
      ├── graph/
      │   ├── snapshot: { nodes[], edges[], communities{},
      │   │               communityLabels{}, version, generatedAt }
      │   └── analysis: { pivotActors[], hiddenLinkages[],
      │                    intelligenceGaps[], factionMap{},
      │                    escalationAssessment{}, negotiationSpace{},
      │                    keyConcepts[], generatedAt }
      │
      ├── tools/{toolName}: { ...toolSpecificData, model, generatedAt }
      │   (one document per tool — 21 possible tool documents)
      │
      ├── documents/{docId}: { filename, mimeType, size,
      │                         extractedText, extractionStatus,
      │                         acoEntities[], uploadedAt }
      │
      ├── sources/{srcId}: { url, type, title, fetchedAt,
      │                       extractionStatus, nodeCount }
      │
      ├── reports/{reportId}: { title, type, sections[], format,
      │                          createdAt }
      │
      └── chat/{threadId}/messages/{msgId}: { role, content, ts }
```

**Why this model works**: Every tool page does `onSnapshot(doc(db, 'users', uid, 'situations', sitId, 'tools', toolName))`. When the backend (Cloud Run) or an API route writes tool data, the frontend sees it instantly. No polling, no WebSockets, no custom real-time layer. Firebase handles it.

---

## PART 3: CLAUDE CODE EXECUTION PLAN

### How to Use This Document

1. Fork `sargonxg/PRAXIS_NEXTJS_TACITUS` → `sargonxg/PRAXIS_CLOUD`
2. Clone the new repo locally
3. Open Claude Code in the repo directory
4. Copy-paste each PHASE prompt into Claude Code sequentially
5. After each phase: verify, commit, push

Each prompt tells Claude Code exactly what files to create, modify, or copy. The Graphify source is at https://github.com/safishamsi/graphify (branch `v3`). Claude Code should clone it as a reference but NOT copy it wholesale — we cherry-pick specific modules and adapt them.

---

## PHASE 1: SCAFFOLD + GRAPHIFY CORE

### Prompt 1.1 — Backend Scaffold + Firebase Auth

```
I am transforming PRAXIS into a dual-service architecture. The existing Next.js app (root directory) stays as-is and deploys to Vercel. I'm adding a Python FastAPI backend that deploys to Google Cloud Run for heavy graph processing.

CRITICAL CONTEXT about the existing codebase:
- Firebase Auth + Firestore for ALL data storage
- Firestore path convention: users/{uid}/situations/{sitId}/...
- src/lib/firebase/config.ts = client SDK init
- src/lib/firebase/admin.ts = server SDK init (Firebase Admin)
- src/lib/api/with-auth.ts = middleware that verifies Firebase ID tokens on Next.js API routes
- src/lib/ai/providers.ts = creates Gemini model instances (Google AI Studio + Vertex AI)
- src/lib/ai/tools.ts = 21 tool definitions with Zod schemas
- The Python backend is ADDITIVE — it does not replace any existing functionality.

TASKS:

1. Create backend/ directory at project root.

2. Create backend/pyproject.toml with these dependencies:
   fastapi>=0.115, uvicorn[standard]>=0.34, networkx>=3.4, graspologic>=3.4,
   pydantic>=2.10, pydantic-settings>=2.7, google-genai>=1.8,
   google-cloud-firestore>=2.19, google-cloud-bigquery>=3.27,
   firebase-admin>=6.6, neo4j>=5.26, httpx>=0.28, python-multipart>=0.0.17
   Set name="praxis-backend", version="0.1.0", requires-python=">=3.11".

3. Create backend/config.py:
   A Pydantic BaseSettings class with fields: gcp_project_id (str), gcp_region (str, default "us-central1"), neo4j_uri (str), neo4j_user (str, default "neo4j"), neo4j_password (str), bigquery_dataset (str, default "praxis_analytics"), gemini_model (str, default "gemini-2.5-flash"), gemini_deep_model (str, default "gemini-2.5-pro"), cors_origins (list[str], default ["http://localhost:3000"]), firebase_credentials_path (str, default ""). Use env_file=".env" and @lru_cache for get_settings().

4. Create backend/auth.py:
   Firebase ID token verification for FastAPI. Initialize firebase-admin once (use ApplicationDefault credentials if no explicit path, else Certificate from firebase_credentials_path). Create a FastAPI dependency verify_firebase_token that extracts the Bearer token from the Authorization header, calls firebase_auth.verify_id_token(), and returns the decoded token dict (which includes 'uid'). Raise HTTPException(401) on failure. Use fastapi.security.HTTPBearer.

5. Create backend/main.py:
   FastAPI app with CORS middleware (origins from settings), a /health endpoint returning {"status": "ok", "service": "praxis-backend"}, and placeholder comments for router registration.

6. Create backend/Dockerfile:
   FROM python:3.11-slim, WORKDIR /app, COPY pyproject.toml, pip install -e ., COPY ., ENV PORT=8080, CMD uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1.

7. Create backend/.env.example documenting all required environment variables.

8. Create docker-compose.yml at project root:
   Two services: backend (build ./backend, ports 8080, volume mount ./backend:/app, command uvicorn with --reload, env_file ./backend/.env) and neo4j (neo4j:5-community, ports 7474+7687, NEO4J_AUTH=neo4j/praxis_dev_pw, named volume).

9. Add to the existing .env.local.example:
   NEXT_PUBLIC_PRAXIS_BACKEND_URL=http://localhost:8080

10. Update CLAUDE.md at project root: add a new section "## Python Backend" explaining the dual-service architecture, that Firebase/Firestore is the single source of truth, that the backend writes results back to Firestore, and how to run locally (docker-compose up).

VERIFICATION:
- cd backend && python -c "from main import app; print('Backend OK')"
- npx tsc --noEmit (frontend still compiles unchanged)
- docker-compose config (valid compose file)
```

### Prompt 1.2 — ACO Schemas + Conflict Extraction Engine

```
I am building the core of the Graphify-TACITUS pipeline. Graphify (https://github.com/safishamsi/graphify, branch v3) is a Python tool that builds knowledge graphs from source files. I am forking its architecture for conflict intelligence using the TACITUS Agentic Conflict Ontology (ACO).

Graphify's pipeline: detect → extract → build_graph → cluster → analyze → report → export
Each stage is a pure function in its own module. They communicate through plain Python dicts and NetworkX graphs.

My adaptation: replace Graphify's tree-sitter AST extraction (designed for code) with LLM-based conflict entity extraction. Keep everything else (build, cluster, analyze, report, export) structurally the same.

TASKS:

1. Create backend/graphify_tacitus/__init__.py:
   Docstring explaining this is a fork of Graphify adapted for ACO. Set __version__ = "0.1.0".

2. Create backend/graphify_tacitus/schemas/__init__.py (empty).

3. Create backend/graphify_tacitus/schemas/aco.py — Pydantic v2 models for all 8 ACO primitives:

   Enums: ConfidenceLevel (EXTRACTED, INFERRED, AMBIGUOUS, ASSESSED), PrimitiveType (Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative).

   Base class ACONode(BaseModel): id (str), label (str), primitive_type (PrimitiveType), source_file (str, default ""), source_location (str, default ""), confidence (ConfidenceLevel, default EXTRACTED), tenant_id (str, default ""), situation_id (str, default ""), extracted_at (datetime, default_factory=datetime.utcnow), metadata (dict, default_factory=dict).

   Subclasses — each sets its primitive_type default:
   - Actor: actor_type str (state/non-state/individual/institution/armed_group), affiliation str, capabilities list[str], stated_position str
   - Claim: claim_type str (territorial/legal/political/economic/identity), content str, legitimacy_basis str
   - Interest: interest_type str (stated/unstated/security/economic/identity/survival), salience float (0-1), is_negotiable bool
   - Constraint: constraint_type str (legal/political/resource/temporal/normative), severity str (hard/soft), imposed_by str
   - Leverage: leverage_type str (military/economic/diplomatic/informational/moral), holder str, target str, effectiveness float (0-1), sustainability str
   - Commitment: commitment_type str (ceasefire/treaty/verbal/written/binding), status str (active/violated/expired/pending), parties list[str], date_made str
   - Event: event_type str (military/diplomatic/humanitarian/political/protest), date str, location str, casualties int|None, escalation_impact float (-1 to 1)
   - Narrative: narrative_type str (media/propaganda/historical/identity/victimhood), framing str, propagated_by str, reach str (local/national/international)

4. Create backend/graphify_tacitus/schemas/relationships.py:
   ACOEdge(BaseModel): source str, target str, relation str, confidence ConfidenceLevel, source_file str, source_location str, weight float (default 1.0), tenant_id str, situation_id str, metadata dict.
   
   ACO_RELATIONSHIPS dict mapping 42 relationship names to (source_primitive, target_primitive) tuples. Include: claims (Actor→Claim), has_interest (Actor→Interest), faces_constraint (Actor→Constraint), holds_leverage (Actor→Leverage), made_commitment (Actor→Commitment), participated_in (Actor→Event), propagates_narrative (Actor→Narrative), allied_with (Actor→Actor), opposes (Actor→Actor), mediates_between (Actor→Actor), sponsors (Actor→Actor), subordinate_to (Actor→Actor), contradicts (Claim→Claim), supports_claim (Claim→Claim), based_on_interest (Claim→Interest), justified_by_narrative (Claim→Narrative), constrained_by (Claim→Constraint), conflicts_with (Interest→Interest), aligns_with (Interest→Interest), underlying_interest_of (Interest→Claim), limits_leverage (Constraint→Leverage), blocks_commitment (Constraint→Commitment), imposed_by_event (Constraint→Event), targets (Leverage→Actor), derived_from_event (Leverage→Event), undermined_by (Leverage→Constraint), addresses_claim (Commitment→Claim), violated_by_event (Commitment→Event), supersedes (Commitment→Commitment), triggered_by (Event→Event), escalates (Event→Event), de_escalates (Event→Event), involves_actor (Event→Actor), affects_leverage (Event→Leverage), validates_narrative (Event→Narrative), contradicts_narrative (Event→Narrative), frames_event (Narrative→Event), justifies_claim (Narrative→Claim), undermines_claim (Narrative→Claim), competes_with (Narrative→Narrative), reinforces (Narrative→Narrative), semantically_similar_to (*→*).

5. Create backend/graphify_tacitus/schemas/extraction.py:
   ExtractionNode(BaseModel): id, label, primitive_type str, source_file, source_location, confidence str, metadata dict.
   ExtractionEdge(BaseModel): source, target, relation, confidence str, source_file, source_location, weight float.
   ExtractionResult(BaseModel): nodes list[ExtractionNode], edges list[ExtractionEdge], hyperedges list[dict], input_tokens int, output_tokens int, source_file str, tenant_id str, situation_id str.

6. Create backend/graphify_tacitus/extract.py — the conflict extractor:
   
   Define ACO_EXTRACTION_PROMPT as a detailed multi-paragraph prompt that instructs Gemini to:
   - Read source text and identify ALL conflict-relevant entities
   - Classify each as one of the 8 ACO primitives with type-specific fields
   - Identify relationships between entities using the typed relationship vocabulary
   - Tag confidence: EXTRACTED (directly stated), INFERRED (reasonable deduction), AMBIGUOUS (uncertain)
   - Return ONLY a JSON object: {nodes: [{id, label, primitive_type, metadata}], edges: [{source, target, relation, confidence}]}
   
   Helper: _make_id(*parts) → snake_case stable ID from name parts (strip non-alphanumeric, lowercase).
   
   async def extract_conflict_text(text: str, source_file: str, gemini_client, tenant_id: str, situation_id: str) → ExtractionResult:
   - Truncate text to 30K chars
   - Call gemini_client.generate() with the ACO prompt + text, requesting JSON response
   - Parse response into ExtractionNode and ExtractionEdge lists
   - Return ExtractionResult with tenant/situation IDs
   
   async def extract_from_url(url: str, gemini_client, tenant_id, situation_id) → ExtractionResult:
   - Fetch URL with httpx (timeout 30s)
   - Strip HTML tags (regex-based: remove script, style, then all tags)
   - Call extract_conflict_text with the cleaned text
   
   async def extract_from_document(text: str, filename: str, gemini_client, tenant_id, situation_id) → ExtractionResult:
   - Wrapper for document extraction (PDF text, DOCX text, etc.)

VERIFICATION:
- cd backend && python -c "from graphify_tacitus.schemas.aco import Actor, Claim, Event, Narrative; print('ACO OK')"
- cd backend && python -c "from graphify_tacitus.schemas.relationships import ACO_RELATIONSHIPS; print(f'{len(ACO_RELATIONSHIPS)} relationships')"
- cd backend && python -c "from graphify_tacitus.extract import extract_conflict_text; print('Extractor OK')"
```

### Prompt 1.3 — Graph Build, Cluster, Analyze (Adapted from Graphify)

```
Continue building the graphify_tacitus pipeline. Reference the Graphify source at https://github.com/safishamsi/graphify (branch v3) for the patterns. I am adapting these modules for conflict intelligence while keeping the same function signatures so the pipeline stays composable.

TASKS:

1. Create backend/graphify_tacitus/validate.py:
   Copy the validation pattern from Graphify's validate.py. Function validate_extraction(data: dict) → list[str] that checks: every node has 'id' and 'label' fields, every edge has 'source' and 'target' fields, every edge source/target references a valid node id (warn but don't error for dangling — those are external references). ADDITIONALLY check: if a node has 'primitive_type', verify it's one of the 8 ACO types.

2. Create backend/graphify_tacitus/build.py:
   Copy Graphify's build.py essentially unchanged. It takes extraction dicts and builds a NetworkX undirected graph. Functions: build_from_json(extraction: dict) → nx.Graph (validates, adds nodes with attrs, adds edges with attrs, stores _src/_tgt for direction, handles hyperedges), and build(extractions: list[dict]) → nx.Graph (merges multiple extractions).

3. Create backend/graphify_tacitus/cluster.py:
   Copy Graphify's cluster.py. Uses graspologic's Leiden algorithm for community detection on the NetworkX graph. Assign community IDs as node attributes. Include cohesion_score(G, community_nodes) function. If graspologic is not available, fall back to networkx.algorithms.community.greedy_modularity_communities.

4. Create backend/graphify_tacitus/analyze.py — CONFLICT-SPECIFIC ANALYSIS:

   Helper: _is_primitive(G, node_id, ptype) → checks if node has primitive_type == ptype.
   Copy _is_file_node() and _is_concept_node() from Graphify unchanged.
   Copy _node_community_map() unchanged.
   Copy graph_diff() unchanged.

   RENAMED/ADAPTED functions:

   a) pivot_actors(G, top_n=10) — like Graphify's god_nodes but filtered to only nodes where primitive_type == "Actor". Returns list of dicts with id, label, edges count, actor_type, community.

   b) key_concepts(G, top_n=5) — highest-degree non-Actor nodes (Claims, Interests, Narratives that everything connects through).

   c) hidden_linkages(G, communities, top_n=5) — fork Graphify's surprising_connections but add conflict-specific scoring bonuses: Actor↔Actor cross-faction (+3, "potential back-channel"), Interest alignment across opposing factions (+4, "potential ZOPA"), Leverage targeting an allied actor (+2, "spoiler dynamic"), Narrative contradicting same-faction Claim (+3, "internal incoherence"). Each result has 'why' and 'conflict_significance' fields.

   d) intelligence_gaps(G, communities, community_labels, top_n=7) — fork Graphify's suggest_questions but reframe: ambiguous_edge → "Unverified Intelligence", bridge_node → "Gatekeeper Analysis", verify_inferred → "Assessment Validation", isolated_nodes → "Blind Spots", low_cohesion → "Fragile Coalition". Add new type: "escalation_risk" for Events with escalation_impact > 0.5 connected to multiple Actors.

   e) escalation_assessment(G) — NEW. Walk all Event nodes, compute aggregate escalation_impact, find Event→triggered_by→Event chains, estimate Glasl stage (1-9) based on: stages 1-3 if average impact < 0.3, stages 4-6 if 0.3-0.6, stages 7-9 if > 0.6. Return glaslStage, trajectory ("escalating"/"de-escalating"/"stable"), escalation_chains list, event_count.

   f) faction_map(G, communities) — NEW. For each community: find dominant Actors (highest degree in community), shared Claims and Interests, Narratives propagated, Leverage held. Return dict keyed by community_id.

   g) negotiation_space(G) — NEW. Find Interest nodes that appear in multiple factions (potential ZOPA). Find hard Constraints (severity=="hard"). Compute leverage asymmetries (which faction holds more Leverage). Return zopa list, hardConstraints list, leverageAsymmetries list.

5. Create backend/graphify_tacitus/report.py:
   Function render_situation_brief(G, analysis, situation_metadata) → str that generates a markdown SITUATION_BRIEF with sections: Executive Summary (node/edge/community counts, Glasl stage, confidence breakdown), Pivot Actors (top 10 with connection counts), Faction Analysis (per-community breakdown), Hidden Linkages (top 5 with why), Escalation Assessment (Glasl stage + chain), Negotiation Space (ZOPA + constraints), Intelligence Gaps (top 7), Recommended Actions (3-5 based on analysis).
   
   Also: render_situation_brief_json(G, analysis, situation_metadata) → dict with the same data in structured form.

6. Create backend/graphify_tacitus/export.py — fork from Graphify:
   
   a) push_to_neo4j(G, uri, user, password, communities, tenant_id, situation_id) — like Graphify's but: node labels use ACO primitive_type (e.g. :Actor, :Claim), every node gets tenant_id and situation_id properties, MERGE on (id, tenant_id) for tenant isolation, relationship types use uppercased ACO names (e.g. -[:CLAIMS]->, -[:HOLDS_LEVERAGE]->).
   
   b) to_json(G, communities, output_path) — export graph.json with ACO metadata.
   
   c) to_html(G, communities, community_labels, analysis) — fork Graphify's HTML visualization but: use TACITUS colors (Actor=#4E79A7, Claim=#F28E2B, Interest=#59A14F, Constraint=#E15759, Leverage=#EDC948, Commitment=#76B7B2, Event=#B07AA1, Narrative=#FF9DA7), title "PRAXIS Conflict Graph", node shapes vary by primitive type (Actors=large dots, Events=diamonds, Narratives=triangles).
   
   d) Copy to_cypher() and to_graphml() from Graphify with minor adaptations.

7. Create backend/graphify_tacitus/cache.py — copy from Graphify unchanged (SHA256 content hashing for incremental processing).

8. Create backend/graphify_tacitus/security.py — copy from Graphify unchanged (URL validation, label sanitization, path validation).

VERIFICATION:
- cd backend && python -c "from graphify_tacitus.build import build_from_json; print('Build OK')"
- cd backend && python -c "from graphify_tacitus.analyze import pivot_actors, hidden_linkages, escalation_assessment, faction_map, negotiation_space; print('Analysis OK')"
- cd backend && python -c "from graphify_tacitus.report import render_situation_brief; print('Report OK')"
- cd backend && python -c "from graphify_tacitus.export import push_to_neo4j, to_html; print('Export OK')"
```

---

## PHASE 2: BACKEND SERVICES + API ROUTES

### Prompt 2.1 — GCP Service Clients

```
Create the service layer that connects the Python backend to GCP services. The backend is in the backend/ directory.

TASKS:

1. Create backend/services/__init__.py (empty).

2. Create backend/services/gemini_client.py:
   Uses the google-genai SDK (import from google.genai import Client, from google.genai.types import HttpOptions).
   
   Class GeminiClient:
   - __init__(project_id, region): creates self.client = Client(vertexai=True, project=project_id, location=region)
   - async def generate(self, prompt: str, model: str = None, response_mime_type: str = "application/json") → str: calls self.client.models.generate_content(model=model or settings.gemini_model, contents=prompt, config={"response_mime_type": response_mime_type}), returns response.text
   - async def extract_aco(self, text: str, source_file: str = "") → dict: calls generate() with the ACO extraction prompt from graphify_tacitus.extract, parses JSON, returns the dict

3. Create backend/services/firestore_sync.py:
   Uses google.cloud.firestore.AsyncClient (initialized via firebase_admin).
   
   Class FirestoreSync:
   - __init__(): self.db = firestore.AsyncClient()
   - Helper _sit_ref(uid, sit_id) → document reference to users/{uid}/situations/{sit_id}
   - async write_graph_snapshot(uid, sit_id, snapshot_dict) → writes to graph/snapshot subcollection doc
   - async write_analysis(uid, sit_id, analysis_dict) → writes to graph/analysis subcollection doc
   - async write_tool_data(uid, sit_id, tool_name, data_dict) → writes to tools/{tool_name} with merge=True
   - async read_situation(uid, sit_id) → dict
   - async read_graph_snapshot(uid, sit_id) → dict
   - async read_tool_data(uid, sit_id, tool_name) → dict
   - async read_all_tool_data(uid, sit_id) → dict of all tool outputs
   - async update_situation_metadata(uid, sit_id, updates_dict) → partial update

4. Create backend/services/neo4j_client.py:
   Uses neo4j.AsyncGraphDatabase.
   
   Class DialecticaClient:
   - __init__(uri, user, password): creates self.driver
   - async ensure_constraints(): creates uniqueness constraints for each ACO primitive type: CREATE CONSTRAINT IF NOT EXISTS FOR (n:{PrimitiveType}) REQUIRE (n.id, n.tenant_id) IS UNIQUE
   - async push_graph(G: nx.Graph, tenant_id, situation_id): for each node, MERGE with ACO label; for each edge, MERGE with typed relationship. All nodes get tenant_id and situation_id properties.
   - async query_situation_graph(tenant_id, situation_id) → dict with nodes and edges
   - async actor_profile(tenant_id, actor_id) → dict with actor and all connections
   - async shortest_path(tenant_id, source_id, target_id) → list of path nodes
   - async close(): close driver

5. Create backend/services/bigquery_client.py:
   Uses google.cloud.bigquery.Client.
   
   Functions (not a class — simpler):
   - log_pipeline_run(tenant_id, situation_id, nodes_count, edges_count, duration_ms, status)
   - log_extraction(tenant_id, source_file, source_type, nodes_count, edges_count, model, input_tokens, output_tokens)
   - get_usage_metrics(tenant_id, date_from, date_to) → dict

6. Create backend/services/feed_clients/__init__.py (empty).

7. Create backend/services/feed_clients/gdelt.py:
   Function query_gdelt(keywords: list[str], days_back: int = 7) → list[dict]:
   - Queries GDELT DOC API (https://api.gdeltproject.org/api/v2/doc/doc) with keyword search
   - Returns list of {url, title, source, tone, date} dicts

8. Create backend/services/feed_clients/acled.py:
   Function query_acled(country: str, days_back: int = 30, api_key: str = "") → list[dict]:
   - Queries ACLED API (https://api.acleddata.com/acled/read)
   - Maps each event to ACO Event format: {id, label, event_type, date, location, casualties: fatalities, escalation_impact: calculated from event_type}

VERIFICATION:
- cd backend && python -c "from services.gemini_client import GeminiClient; print('Gemini OK')"
- cd backend && python -c "from services.firestore_sync import FirestoreSync; print('Firestore OK')"
- cd backend && python -c "from services.neo4j_client import DialecticaClient; print('Neo4j OK')"
```

### Prompt 2.2 — FastAPI Routers

```
Create the FastAPI API routers in backend/routers/. Every endpoint requires a valid Firebase ID token via Depends(verify_firebase_token) from backend/auth.py.

TASKS:

1. Create backend/routers/__init__.py (empty).

2. Create backend/routers/pipeline.py:
   Router with tag "pipeline".
   
   POST /pipeline/run:
   - Body: {situation_id: str, sources: list[{type: "url"|"text"|"file", content: str}]}
   - Auth: verify_firebase_token → get uid from decoded token
   - Implementation:
     a. For each source: extract ACO entities via GeminiClient + extract_conflict_text/extract_from_url
     b. Merge all extractions via build() from graphify_tacitus
     c. Cluster with cluster() from graphify_tacitus
     d. Run full analysis: pivot_actors, hidden_linkages, intelligence_gaps, escalation_assessment, faction_map, negotiation_space
     e. Generate situation brief
     f. Push to Neo4j via DialecticaClient
     g. Sync to Firestore via FirestoreSync: write graph snapshot, write analysis, update situation metadata (nodeCount, edgeCount, escalationStage, pipelineStatus="complete", lastPipelineRun)
     h. Log to BigQuery
     i. Return {analysis, brief, stats: {nodes, edges, communities}}
   
   POST /pipeline/ingest-url:
   - Body: {situation_id: str, url: str}
   - Extract from URL, merge into existing graph (read current snapshot from Firestore, add new nodes/edges, re-cluster, re-analyze), write back.
   
   POST /pipeline/ingest-feeds:
   - Body: {situation_id: str}
   - Read situation metadata (keywords, region) from Firestore
   - Query GDELT and ACLED
   - Extract ACO entities from results
   - Merge into existing graph

3. Create backend/routers/graph.py:
   Router with tag "graph".
   
   GET /graph/{situation_id}:
   - Read graph snapshot from Firestore (faster than Neo4j for frontend reads)
   - Return {nodes, edges, communities, analysis}
   
   POST /graph/{situation_id}/query:
   - Body: {question: str, mode: "bfs"|"dfs", depth: int, token_budget: int}
   - Load graph from Firestore into NetworkX
   - Use Graphify's scoring + traversal pattern (score_nodes by keyword match, BFS/DFS from top matches, render subgraph as text)
   - Return traversal results
   
   GET /graph/{situation_id}/actor/{actor_id}:
   - Query Neo4j for full actor profile (all connected entities with relationship types)
   
   GET /graph/{situation_id}/path:
   - Query params: source, target
   - Find shortest path in graph between two entities
   
   GET /graph/{situation_id}/visualization:
   - Generate HTML visualization using to_html() from graphify_tacitus
   - Return as HTML string

4. Create backend/routers/analyze.py:
   Router with tag "analyze".
   
   GET /analyze/{situation_id}/pivot-actors
   GET /analyze/{situation_id}/hidden-linkages  
   GET /analyze/{situation_id}/intelligence-gaps
   GET /analyze/{situation_id}/escalation
   GET /analyze/{situation_id}/factions
   GET /analyze/{situation_id}/negotiation-space
   GET /analyze/{situation_id}/brief (returns markdown)
   GET /analyze/{situation_id}/brief.json (returns structured JSON)
   POST /analyze/{situation_id}/diff — Body: {snapshot_a, snapshot_b} — compare two graph versions
   
   Each endpoint: verify auth, verify user owns situation, load graph from Firestore, run analysis, return results.

5. Register all routers in backend/main.py:
   from routers import pipeline, graph, analyze
   app.include_router(pipeline.router, prefix="/api/v1/pipeline", tags=["pipeline"])
   app.include_router(graph.router, prefix="/api/v1/graph", tags=["graph"])
   app.include_router(analyze.router, prefix="/api/v1/analyze", tags=["analyze"])

VERIFICATION:
- cd backend && python -c "from main import app; routes = [r.path for r in app.routes if hasattr(r, 'path')]; print(f'{len(routes)} routes'); print(routes)"
- cd backend && uvicorn main:app --port 8080 & sleep 2 && curl -s http://localhost:8080/health && kill %1
```

---

## PHASE 3: FRONTEND — CONTEXT BUILDER + TOOL DATA LAYER

### Prompt 3.1 — Tool Data Service + Context Builder + Backend Client

```
I need to create three critical shared modules for the Next.js frontend that ALL tools will use. These wire every tool to Firestore for persistent data and inject graph context into every AI call.

CONTEXT: The existing codebase has 21 tool API routes in src/app/api/ai/*/route.ts. Currently most of them call Gemini with just the situation name — no graph data, no prior tool outputs, no uploaded documents. This prompt creates the infrastructure to fix that.

TASKS:

1. Create src/lib/services/tool-data-service.ts:

   Export a type ToolName = 'scenario_analysis' | 'dossier' | 'briefing' | 'talking_points' | 'negotiation_prep' | 'mediation_design' | 'risk_assessment' | 'escalation_scan' | 'media_analysis' | 'media_roundup' | 'sanctions_scan' | 'treaty_analysis' | 'commitment_scan' | 'stakeholder_map' | 'early_warning' | 'un_toolkit' | 'deep_research' | 'actor_enrichment' | 'info_environment' | 'historical_parallels' | 'calendar';

   Helper function toolRef(uid: string, sitId: string, tool: ToolName) that returns doc(db, 'users', uid, 'situations', sitId, 'tools', tool). Import db from @/lib/firebase/config.

   Export functions:
   - readToolData<T>(uid, sitId, tool) → Promise<T | null>: getDoc, return data or null
   - writeToolData(uid, sitId, tool, data) → Promise<void>: setDoc with merge, always add generatedAt: new Date().toISOString()
   - subscribeToolData(uid, sitId, tool, callback) → Unsubscribe: onSnapshot, call callback with data or null

2. Create src/lib/ai/context-builder.ts:

   Interface SituationContext: situation (any), graphAnalysis (any), graphSnapshot (any), toolOutputs (Record<string, any>), documents (any[]).

   Export async function buildSituationContext(uid: string, sitId: string, relevantTools: string[] = []): Promise<SituationContext>:
   - Read situation doc from Firestore: users/{uid}/situations/{sitId}
   - Read graph/analysis doc (pivot actors, factions, escalation)
   - Read graph/snapshot doc (summary only — don't load thousands of nodes into memory, just read the top-level fields)
   - For each tool in relevantTools, read tools/{toolName}
   - Read documents subcollection (just filename + first 2000 chars of extractedText)
   - Return SituationContext

   Export function contextToPrompt(ctx: SituationContext): string:
   - Build a structured text block from the context:
     "## SITUATION: {name}\nDescription: {description}\nType: {type}\nRegion: {region}"
   - If pivotActors exist: "## KEY ACTORS:\n" + list each with edge count
   - If factionMap exists: "## FACTIONS:\n" + list each with dominant actors
   - If escalationAssessment exists: "## ESCALATION: Glasl Stage {stage}/9 — {trajectory}"
   - If negotiationSpace exists: "## NEGOTIATION: ZOPA: {zopa}, HARD CONSTRAINTS: {constraints}"
   - For each toolOutput: "## PREVIOUS ANALYSIS ({toolName}): {first 1000 chars as JSON}"
   - Return the concatenated string

3. Create src/lib/api/praxis-backend.ts:

   Import getAuth from firebase/auth.

   const BACKEND_URL = process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL || 'http://localhost:8080';

   async function backendFetch(path: string, options: RequestInit = {}): Promise<any>:
   - Get current user's ID token: await getAuth().currentUser?.getIdToken()
   - If no token, throw 'Not authenticated'
   - fetch(BACKEND_URL + '/api/v1' + path, { ...options, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, ...options.headers } })
   - If !res.ok, throw error
   - Return res.json()

   Export object praxisBackend with methods:
   - runPipeline(sitId, sources[]) → POST /pipeline/run
   - ingestUrl(sitId, url) → POST /pipeline/ingest-url
   - ingestFeeds(sitId) → POST /pipeline/ingest-feeds
   - getGraph(sitId) → GET /graph/{sitId}
   - queryGraph(sitId, question) → POST /graph/{sitId}/query
   - getVisualization(sitId) → GET /graph/{sitId}/visualization
   - getActorProfile(sitId, actorId) → GET /graph/{sitId}/actor/{actorId}
   - getPivotActors(sitId) → GET /analyze/{sitId}/pivot-actors
   - getHiddenLinkages(sitId) → GET /analyze/{sitId}/hidden-linkages
   - getEscalation(sitId) → GET /analyze/{sitId}/escalation
   - getFactions(sitId) → GET /analyze/{sitId}/factions
   - getNegotiationSpace(sitId) → GET /analyze/{sitId}/negotiation-space
   - getIntelligenceGaps(sitId) → GET /analyze/{sitId}/intelligence-gaps
   - getBrief(sitId) → GET /analyze/{sitId}/brief.json

4. Create src/hooks/useToolData.ts:

   Custom hook useToolData<T>(toolName: ToolName):
   - Uses useAuth() for user, useSituationStore() for activeSituation
   - useState for data (T | null) and loading (boolean)
   - useEffect: if user.uid and activeSituation.id exist, call subscribeToolData for real-time updates; on snapshot callback set data and loading=false; return unsubscribe. If no user/situation, set loading=false.
   - Return { data, loading, hasData: !!data, situationId: activeSituation?.id, uid: user?.uid }

5. Add proxy rewrite in next.config.ts for local development:
   In the existing next.config.ts, add an async rewrites() function that returns [{ source: '/backend/:path*', destination: 'http://localhost:8080/api/v1/:path*' }]. If rewrites already exists, append to it.

VERIFICATION:
- npx tsc --noEmit
```

### Prompt 3.2 — Wire All Tool API Routes to Context + Firestore

```
Update EVERY tool API route in src/app/api/ai/ to: (1) load situation context with the graph and relevant prior tool outputs, (2) inject that context into the Gemini prompt, (3) save the result to Firestore at tools/{toolName}.

CONTEXT: Each API route currently uses withAuth() and calls Gemini with generateText or streamText from the Vercel AI SDK. The routes exist but most generate output in isolation without situation context. Some routes lack withAuth(). Some return results that are never persisted.

TOOL CONTEXT DEPENDENCY MAP — for each tool, list which prior tool outputs should be loaded as context:

scenario_analysis: ['risk_assessment', 'escalation_scan', 'stakeholder_map']
dossier: ['stakeholder_map', 'actor_enrichment']
briefing: ALL tools (load all via readAllToolData)
talking_points: ['negotiation_prep', 'stakeholder_map', 'media_analysis']
negotiation_prep: ['stakeholder_map', 'commitment_scan', 'escalation_scan']
mediation_design: ['negotiation_prep', 'stakeholder_map', 'commitment_scan']
risk_assessment: ['escalation_scan', 'media_analysis', 'early_warning']
escalation_scan: [] (reads from graph analysis directly)
media_analysis: ['info_environment', 'media_roundup']
media_roundup: [] (uses GDELT feed data)
sanctions_scan: ['stakeholder_map', 'actor_enrichment']
treaty_analysis: ['commitment_scan', 'negotiation_prep']
commitment_scan: ['stakeholder_map']
stakeholder_map: [] (reads from graph analysis — pivotActors, factions)
early_warning: ['escalation_scan', 'risk_assessment']
un_toolkit: ['treaty_analysis', 'commitment_scan', 'mediation_design']
deep_research: [] (uses Firecrawl + graph intelligence_gaps)
actor_enrichment: ['stakeholder_map']
info_environment: ['media_analysis', 'media_roundup']
historical_parallels: ['escalation_scan', 'stakeholder_map']
calendar: ['commitment_scan', 'early_warning']

TASKS:

For EACH route file in src/app/api/ai/:

1. Add these imports at the top (if not present):
   import { buildSituationContext, contextToPrompt } from '@/lib/ai/context-builder';
   import { writeToolData } from '@/lib/services/tool-data-service';

2. After the withAuth() call that gives you the uid, and after extracting situationId from the request body:
   const ctx = await buildSituationContext(uid, situationId, RELEVANT_TOOLS_FROM_MAP_ABOVE);
   const contextPrompt = contextToPrompt(ctx);

3. Prepend contextPrompt to the system prompt used in the Gemini call:
   const systemPrompt = `You are PRAXIS, a conflict intelligence AI.\n\n${contextPrompt}\n\nBased on this situation context, ${EXISTING_TOOL_SPECIFIC_INSTRUCTIONS}`;

4. After receiving and parsing the AI response, save to Firestore:
   await writeToolData(uid, situationId, 'TOOL_NAME_FROM_MAP', {
     ...parsedResult,
     model: 'gemini-2.5-flash',
   });

5. If the route currently lacks withAuth(), add it. Known routes without auth: talking-points, scenario (verify and fix).

6. If the route uses generateObject with a Zod schema, ensure the schema is still used for parsing. If it uses streamText, the write to Firestore should happen after the stream completes (or in a .then() on the stream promise).

Go through every file in src/app/api/ai/ and apply this pattern. The result: every tool call is now grounded in the real situation context, and every tool output is persisted to Firestore.

VERIFICATION:
- npx tsc --noEmit
- grep -r "writeToolData" src/app/api/ai/ | wc -l (should be >= 20, one per tool route)
- grep -r "buildSituationContext" src/app/api/ai/ | wc -l (should be >= 20)
```

### Prompt 3.3 — Wire All Tool Pages to useToolData

```
Update EVERY tool page in src/app/(app)/ to use the useToolData hook for real-time Firestore data.

PATTERN for every tool page:

The page should:
1. Import and call useToolData<ToolDataType>('tool_name')
2. Import useSituationStore for activeSituation
3. If no activeSituation → render a "Select a situation first" empty state
4. If loading → render a loading skeleton
5. If hasData → render the tool visualization with the data, plus a "Regenerate" button and a "Generated {timeAgo}" timestamp
6. If !hasData → render an empty state with a prominent "Generate with PRAXIS" button that POSTs to the tool's API route with { situationId: activeSituation.id }

APPLY TO THESE PAGES (verify each file exists, create if missing):

1. src/app/(app)/scenarios/page.tsx → useToolData('scenario_analysis'), POST /api/ai/scenario
2. src/app/(app)/dossier/page.tsx → useToolData('dossier'), POST /api/ai/dossier
3. src/app/(app)/briefing/page.tsx → useToolData('briefing'), POST /api/ai/briefing
4. src/app/(app)/talking-points/page.tsx → useToolData('talking_points'), POST /api/ai/talking-points
5. src/app/(app)/negotiation-prep/page.tsx OR negotiation/page.tsx → useToolData('negotiation_prep'), POST /api/ai/negotiation
6. src/app/(app)/mediation-design/page.tsx OR mediation/page.tsx → useToolData('mediation_design'), POST /api/ai/mediation
7. src/app/(app)/risk/page.tsx → useToolData('risk_assessment'), POST /api/ai/risk
8. src/app/(app)/escalation/page.tsx → useToolData('escalation_scan'), POST /api/ai/escalation
9. src/app/(app)/media-compass/page.tsx → useToolData('media_analysis'), POST /api/ai/media
10. src/app/(app)/media-roundup/page.tsx → useToolData('media_roundup'), POST /api/ai/media-roundup
11. src/app/(app)/sanctions/page.tsx → useToolData('sanctions_scan'), POST /api/ai/sanctions
12. src/app/(app)/treaty/page.tsx → useToolData('treaty_analysis'), POST /api/ai/treaty
13. src/app/(app)/commitments/page.tsx → useToolData('commitment_scan'), POST /api/ai/commitment
14. src/app/(app)/stakeholder-map/page.tsx → useToolData('stakeholder_map'), POST /api/ai/stakeholder-map
15. src/app/(app)/early-warning/page.tsx → useToolData('early_warning'), POST /api/ai/early-warning
16. src/app/(app)/un-toolkit/page.tsx → useToolData('un_toolkit'), POST /api/ai/un-toolkit
17. src/app/(app)/deep-research/page.tsx → useToolData('deep_research'), POST /api/ai/deep-research
18. src/app/(app)/actors/page.tsx → useToolData('actor_enrichment'), POST /api/ai/actor-enrichment
19. src/app/(app)/info-environment/page.tsx → useToolData('info_environment'), POST /api/ai/info-environment
20. src/app/(app)/calendar/page.tsx → useToolData('calendar'), POST /api/ai/calendar

For pages that already have complex UI (like the D3 graph, the ZOPA visualizer, etc.), keep the existing visualization components but wire them to data from useToolData instead of local state or demo constants.

VERIFICATION:
- npx tsc --noEmit
- grep -r "useToolData" src/app/ | wc -l (should be >= 20)
```

---

## PHASE 4: GRAPH INTEGRATION + DASHBOARD + KEY PAGES

### Prompt 4.1 — Dashboard Intelligence Summary + Graph Page

```
Wire the Dashboard and Conflict Graph pages to the Python backend for graph-powered intelligence.

TASKS:

1. UPDATE src/app/(app)/dashboard/page.tsx:

   Add an "Intelligence Summary" section that reads from Firestore graph/analysis:
   - Import onSnapshot, doc from firebase/firestore
   - Subscribe to users/{uid}/situations/{sitId}/graph/analysis
   - If analysis exists, show:
     a. Glasl Escalation Stage badge (1-9 with color: green 1-3, amber 4-6, red 7-9)
     b. Pivot Actors list (top 5 with connection counts)
     c. Intelligence Gaps count with "View Gaps" link
     d. Hidden Linkages count with "Explore" link
     e. Last Pipeline Run timestamp with "Run Pipeline" button
     f. Pipeline Status indicator (idle/running/complete/error)
   - If no analysis exists, show "Run your first pipeline to generate intelligence" CTA

   Add a "Quick Ingest" card:
   - Text input for URL + "Ingest" button
   - Calls praxisBackend.ingestUrl(situationId, url)
   - Shows loading state, then success with new entity count

   Add a "Run Full Pipeline" button:
   - Calls praxisBackend.runPipeline(situationId, [])
   - Shows progress: "Extracting sources..." → "Building graph..." → "Analyzing..." → "Complete"
   - On completion, the onSnapshot listeners will automatically update all cards

2. UPDATE src/app/(app)/graph/page.tsx (or conflict-graph/page.tsx):

   The page should combine the existing D3 GraphViewer with data from the backend:
   
   a. Subscribe to Firestore graph/snapshot for real-time graph data
   b. If graph data exists, feed it to the existing GraphViewer component
   c. Color nodes by ACO primitive_type using the TACITUS color palette
   d. Add a sidebar panel that shows:
      - Pivot actors (from graph/analysis)
      - Factions (from graph/analysis.factionMap) — clicking a faction highlights its nodes
      - Hidden linkages (from graph/analysis.hiddenLinkages) — clicking highlights the edge
      - Intelligence gaps (from graph/analysis.intelligenceGaps)
   e. Add "Run Pipeline" button at top
   f. Add "Get HTML Visualization" button → calls praxisBackend.getVisualization(sitId) and opens in new tab
   g. If no graph exists, show empty state: "Upload documents or paste URLs to build your conflict graph"

3. UPDATE src/app/(app)/stakeholder-map/page.tsx:
   
   This page should now be a GRAPH VIEW — not a separate AI call:
   - Read from Firestore graph/snapshot
   - Filter to only Actor nodes
   - Display as a force-directed graph with relationship edges
   - Color by faction (community)
   - Click on actor → show actor profile (Claims, Interests, Leverage, etc. from graph neighbors)
   - "Enrich Actor" button → calls the actor-enrichment API route for deeper AI analysis
   - If no graph exists, fall back to the old AI-generated stakeholder map

VERIFICATION:
- npx tsc --noEmit
- Navigate to dashboard, verify Intelligence Summary renders (or shows empty state)
- Navigate to graph page, verify it renders (or shows empty state)
```

### Prompt 4.2 — Cloud Functions + Deployment Config

```
Create GCP Cloud Functions for event-driven processing and deployment configuration.

TASKS:

1. Create cloud_functions/ directory at project root.

2. Create cloud_functions/on_situation_created/main.py:
   - Uses functions_framework for Cloud Functions v2
   - Triggered by Firestore document creation on users/{uid}/situations/{sitId}
   - Reads the new situation document
   - If it has sourceUrls (list of URLs), calls the Python backend's /api/v1/pipeline/run endpoint with those URLs as sources
   - Uses httpx for the HTTP call, passes a service-to-service auth header
   - Create requirements.txt: functions-framework, google-cloud-firestore, httpx

3. Create cloud_functions/on_document_uploaded/main.py:
   - Triggered by Firestore document creation on users/{uid}/situations/{sitId}/documents/{docId}
   - Reads extractedText from the document
   - Calls backend /api/v1/pipeline/ingest-url or a dedicated extraction endpoint
   - Create requirements.txt

4. Create cloud_functions/gdelt_poller/main.py:
   - HTTP-triggered (for Cloud Scheduler)
   - Queries Firestore for all active situations (where status != "resolved")
   - For each situation with keywords/region, queries GDELT for new articles
   - If new articles found, calls backend /api/v1/pipeline/ingest-url for each
   - Create requirements.txt: functions-framework, google-cloud-firestore, httpx

5. Create infrastructure/ directory with:

   infrastructure/deploy-backend.sh:
   ```bash
   #!/bin/bash
   cd backend
   gcloud run deploy praxis-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi --cpu 2 \
     --timeout 300 \
     --min-instances 0 --max-instances 10 \
     --set-env-vars="GCP_PROJECT_ID=$GCP_PROJECT_ID,GCP_REGION=us-central1"
   ```

   infrastructure/setup-gcp.sh:
   ```bash
   #!/bin/bash
   # Enable required APIs
   gcloud services enable run.googleapis.com aiplatform.googleapis.com \
     bigquery.googleapis.com pubsub.googleapis.com \
     cloudfunctions.googleapis.com cloudscheduler.googleapis.com
   # Create BigQuery dataset
   bq mk --dataset $GCP_PROJECT_ID:praxis_analytics
   # Create Cloud Scheduler for GDELT polling
   gcloud scheduler jobs create http gdelt-poller \
     --schedule="*/15 * * * *" \
     --uri="https://REGION-PROJECT.cloudfunctions.net/gdelt_poller" \
     --http-method=POST
   ```

6. Create vercel.json at project root (if it doesn't exist):
   Add rewrites to proxy /backend/* to the Cloud Run backend URL.
   Add env: NEXT_PUBLIC_PRAXIS_BACKEND_URL pointing to Cloud Run URL.

7. Create a comprehensive .env.example at project root documenting ALL environment variables for both frontend and backend, grouped by service.

VERIFICATION:
- ls cloud_functions/*/main.py (all function files exist)
- ls infrastructure/*.sh (deployment scripts exist)
- bash -n infrastructure/deploy-backend.sh (valid bash syntax)
```

---

## PHASE 5: TESTING + POLISH

### Prompt 5.1 — End-to-End Pipeline Test

```
Create integration tests that validate the full pipeline from text input to graph output.

TASKS:

1. Create backend/tests/__init__.py (empty).

2. Create backend/tests/fixtures/hr_conflict.txt:
   The Alex vs. Maya HR conflict test case: "At Northwind Support, a public conflict erupted between Alex Chen (Senior Engineer) and Maya Rodriguez (Team Lead). Alex publicly criticized Maya's code review process in a team Slack channel, calling it 'gatekeeping that kills innovation.' Maya responded that Alex was 'creating a hostile environment by attacking colleagues publicly instead of using proper feedback channels.' The HR contact, Jordan Park, has been asked to mediate. Alex claims the team needs radical transparency to improve code quality. Maya insists on following the established feedback protocol where criticism is given privately first. The team is divided — some support Alex's directness while others feel unsafe. A mediation session has been requested for next Tuesday."

3. Create backend/tests/test_aco_schemas.py:
   - Test all 8 ACO Pydantic models can be instantiated with valid data
   - Test all 8 models serialize to dict and deserialize back
   - Test ConfidenceLevel enum has all 4 values
   - Test PrimitiveType enum has all 8 values
   - Test ACO_RELATIONSHIPS dict has 42 entries
   - Test ExtractionResult can hold a mix of all primitive types

4. Create backend/tests/test_pipeline.py:
   - Load hr_conflict.txt as fixture
   - Create a mock extraction result that represents what Gemini WOULD return:
     Nodes: Alex (Actor), Maya (Actor), Jordan (Actor), radical_transparency (Claim), feedback_protocol (Claim), code_quality (Interest), psychological_safety (Interest), hr_policy (Constraint), public_criticism_incident (Event), mediation_request (Event), transparency_narrative (Narrative)
     Edges: Alex→claims→radical_transparency, Maya→claims→feedback_protocol, Alex→has_interest→code_quality, Maya→has_interest→psychological_safety, Alex→participated_in→public_criticism_incident, Alex→propagates_narrative→transparency_narrative, Alex→opposes→Maya
   - Test build_from_json produces valid NetworkX graph with correct node/edge counts
   - Test cluster assigns community IDs
   - Test pivot_actors returns Alex and Maya (highest degree)
   - Test hidden_linkages finds cross-faction edges
   - Test intelligence_gaps identifies blind spots
   - Test escalation_assessment returns a Glasl stage
   - Test faction_map produces at least 2 factions
   - Test render_situation_brief returns non-empty markdown string
   - Test render_situation_brief_json returns dict with all expected keys

5. Create backend/tests/test_auth.py:
   - Test that verify_firebase_token raises HTTPException(401) when no token provided
   - Test that verify_firebase_token raises HTTPException(401) for invalid token

VERIFICATION:
- cd backend && pip install -e ".[dev]" --break-system-packages && python -m pytest tests/ -v
```

### Prompt 5.2 — Final Wiring Check + CLAUDE.md Update

```
Final verification pass: ensure everything is properly connected.

TASKS:

1. Run these verification commands and fix any issues:
   - npx tsc --noEmit (frontend compiles)
   - cd backend && python -c "from main import app; print([r.path for r in app.routes if hasattr(r,'path')])" (all routes registered)
   - grep -r "useToolData" src/app/ | wc -l (should be >= 20)
   - grep -r "writeToolData" src/app/api/ | wc -l (should be >= 15)
   - grep -r "buildSituationContext" src/app/api/ | wc -l (should be >= 15)
   - grep -r "withAuth" src/app/api/ai/ | wc -l (should match number of route files)

2. Verify every tool API route has ALL THREE of: withAuth, buildSituationContext, writeToolData. List any routes that are missing any of these three and fix them.

3. Verify the Firestore security rules in firestore.rules allow:
   - Authenticated users to read/write their own data under users/{uid}/
   - No cross-user access
   - If firestore.rules doesn't exist, create it with proper rules

4. Update the root CLAUDE.md to be the definitive developer guide:
   - Architecture overview (Next.js + Python backend + GCP services)
   - How to run locally: npm run dev (frontend) + docker-compose up (backend + neo4j)
   - File structure: frontend at root, backend at backend/, cloud functions at cloud_functions/
   - Firestore data model (the full path hierarchy)
   - Tool wiring pattern: useToolData hook → API route → buildSituationContext → Gemini → writeToolData → onSnapshot
   - ACO primitives: the 8 types and their purposes
   - Graph pipeline: extract → build → cluster → analyze → report → export
   - Environment variables: complete list grouped by service
   - Deployment: Vercel (frontend) + Cloud Run (backend) + Neo4j AuraDB
   - Color scheme: Navy #0F172A, Emerald #10B981, Gold #E8B931, Diplomatic Blue #1B3A5C
   - Typography: EB Garamond (headings), Inter (body), JetBrains Mono (code)
   - ACO visualization colors: Actor=#4E79A7, Claim=#F28E2B, Interest=#59A14F, Constraint=#E15759, Leverage=#EDC948, Commitment=#76B7B2, Event=#B07AA1, Narrative=#FF9DA7

5. Verify next.config.ts has the proxy rewrite for local backend development.

6. Run npm run build to verify the full production build succeeds.

VERIFICATION:
- npm run build succeeds
- cd backend && python -m pytest tests/ -v passes
- All grep counts match expected numbers
```

---

## QUICK REFERENCE: WHAT TO COPY-PASTE INTO CLAUDE CODE

Phase 1 (Backend + Graphify Core):
- Prompt 1.1 → scaffold
- Prompt 1.2 → ACO schemas + extractor
- Prompt 1.3 → build + cluster + analyze + report + export

Phase 2 (Backend Services + API):
- Prompt 2.1 → GCP service clients
- Prompt 2.2 → FastAPI routers

Phase 3 (Frontend Wiring):
- Prompt 3.1 → tool data service + context builder + backend client
- Prompt 3.2 → wire all API routes to context + Firestore
- Prompt 3.3 → wire all tool pages to useToolData

Phase 4 (Integration):
- Prompt 4.1 → dashboard + graph page + stakeholder map
- Prompt 4.2 → Cloud Functions + deployment

Phase 5 (Testing + Polish):
- Prompt 5.1 → integration tests
- Prompt 5.2 → final verification + CLAUDE.md

Total: 12 prompts across 5 phases.
Estimated Claude Code execution: 12-18 hours total.
