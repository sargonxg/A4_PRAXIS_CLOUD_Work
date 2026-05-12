# PRAXIS — Codex Pack 30: Document Extraction & Knowledge Graph Wave

**File**: `PRAXIS_CODEX_30_EXTRACTION_AND_GRAPHRAG_WAVE.md`
**Branch**: `feature/extraction-graphrag-wave`
**Depends on**: Pack 29 merged. v1.5.1 tagged. Force-graph + timeline + map visualizations live. Existing Pack 23 Context Genesis ingestion pipeline. Existing 12 subagents. Existing graph_nodes + provenance JSONB.
**Estimated effort**: ~4 days (~32 engineering hours).
**Target release**: v1.6
**Voice**: Senior backend engineer who has built ingestion pipelines for legal/policy documents and knows that the upstream parser quality determines every downstream signal. Three permissive libraries that turn UN reports, treaties, sanctions PDFs, and policy briefs into clean structured input for PRAXIS's existing extraction subagents — without rewriting the orchestration.

---

## 0. Why this pack exists

PRAXIS's Pack 23 Context Genesis pipeline ingests documents from canonical sources (Wikipedia, UCDP, ICG, ReliefWeb, UN, Reuters) plus user uploads. The pipeline is functional but the upstream document-processing layer is the weak link:

**(1) PDF parsing loses structure.** Treaties have parties tables. UN reports have annexes. Sanctions documents have schedules of designated entities. ICJ judgments have cited-precedent sections. The current pipeline (per the codebase audit: `backend/graphify_tacitus/extract.py` + naive PDF text extraction) loses table structure, reading order, and footnote-to-operative-clause linkage. Extraction quality on the only documents that actually drive policy analysis is materially weaker than it should be.

**(2) Per-extraction cost scales with Gemini calls.** Every chunk runs through `gemini-2.5-flash` or `gemini-2.5-pro`. On a 100-page UN report, this is hundreds of LLM invocations. ~70% of those calls are doing entity recognition that a small specialist NER model could do in milliseconds on CPU.

**(3) Corpus-level synthesis is missing.** Pack 21's `cross.contradiction-finder` and `governance.coalition-map` operate per-case, but PRAXIS has no built-in pattern for "build a knowledge graph from this 50-document corpus and surface community-level themes." The existing extraction is per-chunk; community detection and community summaries (the actual differentiator of GraphRAG over naive RAG) don't exist.

The OSS sourcing report (Pack 30 dependency artifact) identified three permissively-licensed libraries that close these gaps:

1. **Docling (MIT, ~37k★, IBM/LF AI & Data)**: layout-aware PDF/DOCX/PPTX parser with TableFormer for table extraction (trained on 1M+ tables), reading-order preservation, page-level layout. Exports to Markdown, HTML, JSON. Runs locally — important for sensitive ICRC/government documents.
2. **GLiNER (Apache-2.0, NAACL 2024)**: zero-shot NER model that takes a runtime list of entity-type strings ("armed group", "treaty", "mediator", "sanction regime") and returns typed spans. CPU-runnable (~50-200ms/doc on 4-vCPU). Cuts ~70% of Gemini calls by acting as a high-recall pre-filter.
3. **Microsoft GraphRAG (MIT, ~30.5k★, v2.7.0 with LiteLLM)**: end-to-end pipeline for building a knowledge graph from a text corpus — entity extraction, relationship extraction, community detection, per-community LLM summaries, local + global query modes. Maps cleanly onto PRAXIS's 8 ACO primitives. v2.7.0 (October 2025) made LiteLLM the default provider, so the Vertex AI Gemini path is one config away.

Three structural decisions:

**(A) Each library runs as a Cloud Run worker, registered as a v2-contract tool.** No replacement of the orchestration — Cloud Tasks fan-out (Pack 23 W5) calls each worker as a stage in the existing pipeline. The Tool Contract v2 from Pack 18 is the registration surface. Existing subagents consume the outputs.

**(B) The pipeline becomes layered, not linear.** Today: PDF → naive text → Gemini chunk → graph nodes. After this pack: PDF → Docling → reading-order Markdown → GLiNER (typed span recall) → Gemini structured-claim extraction (precision) → graph nodes. Optionally for corpus-level synthesis: same documents → GraphRAG → community summaries → review queue → memo annexes.

**(C) ACLED is removed; UCDP remains the canonical conflict-event source.** The OSS sourcing report verified ACLED's EULA explicitly bans LLM/AI use of its data even commercially. The existing `backend/services/feed_clients/acled.py` adapter is deprecated and removed in this pack. UCDP (CC-BY-4.0) remains as the canonical adapter.

After this pack: the user uploads a 60-page UNSC report. Docling parses table structure cleanly. GLiNER extracts 200+ candidate entities in 2 seconds (Actor, Treaty, Resolution, Sanction). Gemini takes the GLiNER candidate set and produces structured Claims with high precision. The graph populates with the right nodes, properly typed against the active ontology. Cost per document drops ~60% (fewer, more focused Gemini calls). On a corpus of 30 such reports, GraphRAG runs nightly and produces 8-12 community summaries surfaced as memo annexes.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Docling deployed as Cloud Run worker `services/extract-docling/` exposing `POST /parse`; consumes Cloud Storage URIs, returns `DoclingDocument` JSON + Markdown export | E2E test on UNSC report fixture: tables preserved, reading order correct |
| 2 | Docling integrated into existing Pack 23 W4 user-upload adapter + W3 ICG/UN/ReliefWeb adapters as the parsing stage | Existing adapter tests pass; new structural-fidelity assertions added |
| 3 | GLiNER deployed as Cloud Run worker `services/extract-ner-gliner/` exposing `POST /extract`; ontology-aware entity-type label sets per the 9 ontologies | Eval ≥80% recall on 50 hand-labeled policy documents |
| 4 | Pack 23 Context Genesis ingestion runs GLiNER **before** Gemini extraction; Gemini receives candidate-span context to verify and structure | Cost telemetry shows ≥50% reduction in Gemini tokens per document |
| 5 | New v2-contract tool `extract.entities.gliner` registered in marketplace (within `cross-cutting` category, NOT a new category) | `audit:tool-contract-v2` reports 53 tools (52 from Pack 21 + 1 new) |
| 6 | Microsoft GraphRAG deployed as Cloud Tasks batch worker `services/extract-graphrag/`; configured for Vertex AI Gemini via LiteLLM | Sample corpus run produces community summaries with proper provenance |
| 7 | GraphRAG output mapped onto ACO primitives via committed adapter at `backend/services/extract_graphrag/aco_adapter.py` | Adapter unit tests for Entity→Actor/Event/Claim and Relationship→edge transformations |
| 8 | New v2-contract tool `cross.community-synthesizer` registered (within `cross-cutting`) — invokes GraphRAG on a subset of case documents | `audit:tool-contract-v2` reports 54 tools |
| 9 | Existing ACLED adapter at `backend/services/feed_clients/acled.py` removed; deprecation note in CHANGELOG; license audit confirms no remaining ACLED-derived code | License audit explicit: zero CC-BY-NC content |
| 10 | One ADR: 0047 (extraction layering: parser → recall NER → precision LLM, plus optional GraphRAG batch) | ADR reviewed |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 30. I understand:
> 1. **Three Cloud Run workers, three v2-contract registrations.** Each library runs as an isolated service with health checks, Cloud Trace, structured logging — same posture as the existing 12 subagents. No library is imported into the main FastAPI app directly.
> 2. **The orchestration is unchanged.** Pack 23 W5 Cloud Tasks fan-out adds new stages (`docling-parse`, `gliner-extract`) to the pipeline. The existing Gemini structured-claim extractor stays. The existing firewall + two-phase commit stays.
> 3. **Tool Contract v2 is the registration surface.** GLiNER tool registers as `extract.entities.gliner` in the cross-cutting category. GraphRAG tool registers as `cross.community-synthesizer` in the cross-cutting category. NO new categories. NO new ontologies. Marketplace count goes 52 → 54.
> 4. **License floor: MIT / Apache-2.0 / BSD only.** Verified per the OSS sourcing report: Docling MIT, GLiNER Apache-2.0, GraphRAG MIT. Transitive deps audited: Docling has no AGPL transitives in the default config (avoid `ocrmypdf`/Ghostscript path); GLiNER's torch/transformers/onnxruntime are clean; GraphRAG via LiteLLM is clean.
> 5. **ACLED removal is a deliberate license-discipline action.** The existing `acled.py` adapter is removed. No replacement adapter — UCDP fills the role per Pack 17 v1.1.
> 6. **Architecture invariants from the bible (§3) hold.** ContextProvider-only access from tools. Symbolic firewall enforced on every write. Owner scoping absolute. Model strings only in `MODEL_MATRIX.json`. Subagent invocations via `ContextProvider.subagent`. Cloud Run + Cloud Tasks discipline maintained.
> 7. **No frontend changes in this pack.** Pack 29 ships visualization. This pack ships ingestion + extraction. UI consumes the output through existing Pack 24 Context Library + Pack 27 Library tab.
>
> Open questions for Giulio:
> - **Q1**: Docling deployment — propose: bake the ~2.5 GB model weights into the Cloud Run container image (slower cold-start, simpler deploy) vs mount from Cloud Storage at startup (faster image, more complex). Default to baked-in for reliability; open to GCS-mount if image-pull cost becomes an issue. Acceptable?
> - **Q2**: GLiNER label sets — propose: one label set per active ontology, committed at `backend/services/extract_ner_gliner/labels/<ontology-id>.json`. The orchestrator picks the label set based on the case's primary ontology (or unions across multi-ontology cases per Pack 20). Acceptable?
> - **Q3**: GraphRAG cost — propose: GraphRAG runs only when explicitly invoked via `cross.community-synthesizer` tool, NOT on every Context Genesis. Each invocation has a $5 P95 cost ceiling on a 50-document corpus, rate-limited 1 invocation per case per day. Acceptable?
> - **Q4**: GraphRAG community summaries — propose: each summary lands in the existing Pack 18 R1 review queue with `source.kind='graphrag-community-synthesizer'`. User accepts/rejects; accepted summaries become memo blocks in the existing memo studio. Acceptable?
> - **Q5**: ACLED removal — propose: drop `backend/services/feed_clients/acled.py` entirely; update `backend/services/feed_clients/__init__.py` to remove the export; add a CHANGELOG entry; flag any imports for removal. Acceptable, or keep with a "do not use" warning?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---:|
| DD1 | Foundations: pipeline-stage architecture; service-deploy template for permissive-license workers; license-audit deepening | 4 |
| DD2 | Docling Cloud Run worker: container, FastAPI wrapper, Cloud Tasks integration, reading-order chunker | 8 |
| DD3 | GLiNER Cloud Run worker: container, label-set per ontology, FastAPI wrapper, v2-contract tool registration | 7 |
| DD4 | GLiNER ↔ Gemini integration: GLiNER produces candidates, Gemini structures into Claims, cost telemetry validates ≥50% token reduction | 5 |
| DD5 | GraphRAG batch worker: container, LiteLLM-Vertex config, ACO-adapter, community-summary review-queue routing | 6 |
| DD6 | ACLED removal + license audit deepening + ADR + verification | 2 |
| **Total** | | **~32** |

---

## 4. Hard rules

- **Each new library is a Cloud Run worker, never imported into the main FastAPI app.** Isolation enforced.
- **License floor: MIT / Apache-2.0 / BSD-2-Clause / BSD-3-Clause / ISC.** Any transitive license drift fails CI per Pack 29's license audit (extended in this pack).
- **No new categories or ontologies.** GLiNER and GraphRAG tools register in `cross-cutting` per existing Tool Contract v2.
- **ACLED removed.** Zero CC-BY-NC content in the deployed product.
- **Existing firewall + two-phase commit + review queue invariants hold.** Source-layer nodes from Docling/GLiNER write through firewall; synthesized Claim candidates from GLiNER+Gemini route through review queue; GraphRAG community summaries route through review queue.
- **All cost ceilings enforced.** Docling parse ≤$0.05 P95 per document; GLiNER extraction ≤$0.01 P95 per document (CPU); GraphRAG corpus run ≤$5 P95 per 50 documents.
- **All prior invariants from packs 03-29 hold.**

---

## 5. Prompt DD1 — Foundations: pipeline stages + worker-deploy template + license audit

### Persona
Backend architect.

### Phase 1 — Read & report

- Inspect existing Pack 23 W5 Cloud Tasks fan-out orchestrator (`backend/services/context_genesis/orchestrator.py`).
- Inspect existing Pack 18 R3 two-phase commit pattern.
- Inspect existing Pack 23 firewall integration.
- Inspect existing tool registry pattern (`src/lib/tools/registry/`).
- Inspect existing Pack 22 Cloud Run service template (16 runbooks).
- Output `docs/audits/2026-NN-NN-EXTRACTION_WAVE_FOUNDATIONS.md`.

### Phase 2 — Propose & confirm

Pipeline-stage architecture:

```python
# backend/services/context_genesis/pipeline.py (extension)

PIPELINE_STAGES = [
    'fetch',          # existing: adapter fetches the document (Wikipedia, UCDP, ICG, etc.)
    'parse',          # NEW: Docling parses to reading-order Markdown + DoclingDocument JSON
    'chunk',          # existing: chunker now consumes Docling structured output
    'recall_ner',     # NEW: GLiNER produces candidate spans typed by ontology label set
    'precision_extract',  # existing: Gemini structures candidates into ACO Claims/Actors/Events
    'firewall_write', # existing: two-phase commit through firewall
]
```

Worker-deploy template at `infrastructure/templates/cloud-run-permissive-worker/`:
- Dockerfile baseline (Python 3.11-slim, multi-stage build).
- Health check + Cloud Trace + structured logging boilerplate.
- IAM role minimum (read Cloud Storage, write Pub/Sub for SSE, no Firestore/Postgres direct access).
- Terraform module for deploy.

License audit extension:

```ts
// scripts/audit-license-sbom.ts (extends Pack 29)
// Walks Python deps via `pip-licenses --format=json`, flags any of:
// - GPL-*, AGPL-*, LGPL-* (any flavor)
// - CC-BY-NC-*, CC-BY-SA-*
// - Custom non-commercial licenses
// - "UNKNOWN" or unparseable licenses
// Fails CI on any flag.
// Includes per-worker isolated venv check (Docling/GLiNER/GraphRAG each have their own dependency tree).
```

Wait for sign-off on the pipeline stages and the worker template.

### Phase 3 — Execute

- Author pipeline-stage extension.
- Author worker-deploy template.
- Extend license audit to walk Python deps per-worker.
- Add CI step.

### Phase 4 — Verify

- Existing pipeline runs unchanged.
- License audit green on all existing services.

---

## 6. Prompt DD2 — Docling Cloud Run worker

### Persona
Backend engineer with Docker experience.

### Outcome

Service `services/extract-docling/`:

```python
# services/extract-docling/main.py
from fastapi import FastAPI
from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions

app = FastAPI()

# Load once per container (warm via min_instances=1 in Cloud Run config).
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=PdfPipelineOptions(
                do_ocr=False,           # use Docling's built-in layout, NOT ocrmypdf path (avoids Ghostscript AGPL)
                do_table_structure=True,
                table_structure_options={'mode': 'accurate'},  # TableFormer accurate mode
            )
        )
    }
)

@app.post("/parse")
async def parse(req: ParseRequest) -> ParseResponse:
    """Parse a document from Cloud Storage URI."""
    # 1. Download from Cloud Storage (gs://...).
    # 2. Run Docling conversion.
    # 3. Export to Markdown for downstream chunking.
    # 4. Persist DoclingDocument JSON to Cloud Storage at parsed/<hash>.json.
    # 5. Return Markdown + JSON URI + structural metadata.
    ...
```

Container:

```dockerfile
# services/extract-docling/Dockerfile
FROM python:3.11-slim AS base

# System deps for Docling: poppler for PDF, no ocrmypdf (avoid Ghostscript AGPL).
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils libgomp1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake Docling models into the image (~2.5 GB).
RUN python -c "from docling.document_converter import DocumentConverter; DocumentConverter()"

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

Pipeline integration:

```python
# backend/services/context_genesis/orchestrator.py (extended)
async def stage_parse(document_ref: DocumentRef) -> ParsedDocument:
    """Stage 2: Docling parses the document into reading-order Markdown + structural JSON."""
    response = await http_client.post(
        DOCLING_WORKER_URL + "/parse",
        json={"gcs_uri": document_ref.gcs_uri},
        timeout=120.0,  # Docling on a 60-page PDF takes 30-90s on CPU
    )
    return ParsedDocument(
        markdown=response.json()["markdown"],
        docling_json_uri=response.json()["docling_json_uri"],
        page_count=response.json()["page_count"],
        table_count=response.json()["table_count"],
    )
```

The chunker (existing) is updated to consume Docling's reading-order output rather than naive page-by-page text:

```python
# backend/services/chunker/docling_chunker.py
def chunk_docling_document(doc: DoclingDocument) -> list[Chunk]:
    """Chunk on reading-order paragraph boundaries; keep tables as atomic chunks."""
    chunks = []
    for para in doc.iterate_items():
        if para.kind == 'table':
            chunks.append(Chunk(text=para.export_to_markdown(), kind='table', ...))
        elif para.kind == 'paragraph':
            chunks.append(Chunk(text=para.text, kind='paragraph', ...))
        # ...
    return chunks
```

### Files

- `services/extract-docling/main.py`, `Dockerfile`, `requirements.txt`, `cloudbuild.yaml`.
- `infrastructure/terraform/modules/extract-docling/`.
- `backend/services/chunker/docling_chunker.py`.
- Pipeline orchestrator extension.
- E2E test on UNSC report fixture.

### Verify

- Container builds, image size ≤4 GB.
- Cold start ≤30s with warm pool of 1.
- 60-page UNSC report parsed in ≤90s P95.
- Tables preserved with cell-level structure.
- Cost ≤$0.05 P95 per document (Cloud Run CPU pricing).

---

## 7. Prompt DD3 — GLiNER Cloud Run worker

### Persona
ML engineer who has shipped lightweight NER models in production.

### Outcome

Service `services/extract-ner-gliner/`:

```python
# services/extract-ner-gliner/main.py
from fastapi import FastAPI
from gliner import GLiNER
import json

app = FastAPI()
model = GLiNER.from_pretrained("urchade/gliner_base")  # 250MB Apache-2.0 model

# Per-ontology label sets, committed at backend/services/extract_ner_gliner/labels/.
LABEL_SETS = {
    'conflict': json.load(open('labels/conflict.json')),    # ~25 labels
    'mediation': json.load(open('labels/mediation.json')),
    'governance': json.load(open('labels/governance.json')),
    'narrative': json.load(open('labels/narrative.json')),
    'human-rights': json.load(open('labels/human-rights.json')),
    'economic': json.load(open('labels/economic.json')),
    'humanitarian': json.load(open('labels/humanitarian.json')),
    'legal': json.load(open('labels/legal.json')),
    'security': json.load(open('labels/security.json')),
}

@app.post("/extract")
async def extract(req: ExtractRequest) -> ExtractResponse:
    """Extract entities from text using ontology-aware label sets."""
    # 1. Union the label sets for active ontologies (case may have 1-3 per Pack 20).
    labels = []
    for ontology_id in req.ontology_ids:
        labels.extend(LABEL_SETS[ontology_id])
    labels = list(set(labels))

    # 2. Run GLiNER prediction.
    entities = model.predict_entities(req.text, labels, threshold=0.5)

    # 3. Return typed spans.
    return ExtractResponse(entities=[
        {
            "text": ent["text"],
            "label": ent["label"],
            "start": ent["start"],
            "end": ent["end"],
            "confidence": ent["score"],
        }
        for ent in entities
    ])
```

Label sets (sample for Conflict):

```json
// services/extract-ner-gliner/labels/conflict.json
[
  "armed actor",
  "state actor",
  "non-state armed group",
  "armed conflict",
  "ceasefire",
  "ceasefire violation",
  "escalation event",
  "civilian harm event",
  "displacement event",
  "weapons system",
  "territorial control",
  "peace agreement",
  "mediator",
  "third-party state",
  "international organization",
  "sanction regime",
  "peacekeeping mission",
  "treaty obligation",
  "war crime allegation"
]
```

Per-ontology label sets are reviewed by Giulio before commit (they map directly to PRAXIS's ACO subtypes per Pack 20 ontology definitions).

V2-contract tool registration:

```ts
// src/lib/tools/registry/extract-entities-gliner.ts
export const EXTRACT_ENTITIES_GLINER_TOOL: ToolDefinitionV2 = {
  id: 'extract.entities.gliner',
  version: '1.0.0',
  title: 'Extract Entities (GLiNER)',
  description: 'Zero-shot entity extraction using ontology-aware label sets. High-recall pre-filter before structured-claim extraction.',
  category: 'cross-cutting',                    // existing category
  contextSpec: { ontologies: ['*'], requiresGraph: false, requiresDocuments: true },
  composition: { canChainInto: ['cross.contradiction-finder', 'cross.brief-exporter'], canChainFrom: ['cross.web-research'] },
  sideEffects: 'reads-only',
  subagentDeps: [],
  skill: { file: 'skills/tools/extract-entities-gliner/SKILL.md' },
  inputSchema: { ... },
  outputSchema: { ... },
  estimatedRuntimeMs: 2000,
  costClass: 'cheap',
  streaming: false,
};
```

Pipeline integration: GLiNER becomes stage 4 (`recall_ner`) in the Pack 23 pipeline, before the existing Gemini structured-claim extraction.

### Files

- `services/extract-ner-gliner/main.py`, `Dockerfile`, `requirements.txt`, `cloudbuild.yaml`.
- `services/extract-ner-gliner/labels/<ontology-id>.json` × 9.
- `infrastructure/terraform/modules/extract-ner-gliner/`.
- `src/lib/tools/registry/extract-entities-gliner.ts`.
- `skills/tools/extract-entities-gliner/SKILL.md`.
- `backend/services/extract_ner_gliner/eval/cases.json` (50 hand-labeled documents).
- E2E test.

### Verify

- 50-doc eval ≥80% recall against hand-labeled gold.
- ≤200ms P95 extraction time per 4-page document.
- Cost ≤$0.01 P95 per document (CPU-only, no GPU needed).

---

## 8. Prompt DD4 — GLiNER ↔ Gemini integration + cost validation

### Persona
Backend engineer + ML engineer.

### Outcome

The existing Gemini structured-claim extractor is updated to consume GLiNER's candidate spans:

```python
# backend/services/extract_structured/orchestrator.py (modified)
async def extract_structured_claims(
    text: str,
    ontology_ids: list[OntologyId],
    *,
    ner_candidates: list[NerEntity] | None = None,    # NEW: from GLiNER stage
) -> list[ProposedClaim]:
    """Extract structured ACO Claims using Gemini.

    If ner_candidates provided, prompt is built with candidates pre-listed,
    asking Gemini to verify, link, structure, and add edges — rather than
    full-text entity extraction. This cuts ~50-70% of Gemini tokens.
    """
    if ner_candidates:
        prompt = build_verification_prompt(text, ner_candidates, ontology_ids)
    else:
        prompt = build_full_extraction_prompt(text, ontology_ids)
    response = await call_vertex_gemini(prompt, task_kind='balanced')
    return parse_response(response)
```

Cost telemetry validation: a Cloud Trace dashboard panel showing per-document Gemini token cost before vs after GLiNER integration. Acceptance criterion: ≥50% reduction on the 100-document benchmark corpus.

### Files

- Modified `backend/services/extract_structured/orchestrator.py`.
- New prompt template `backend/services/extract_structured/prompts/verification.md`.
- Cloud Monitoring dashboard JSON.
- Benchmark script `scripts/bench-gliner-cost-reduction.py`.

### Verify

- Cost reduction ≥50% on benchmark corpus.
- Extraction quality (precision + recall) within 5% of pre-GLiNER baseline (verified by human review on 20-doc sample).

---

## 9. Prompt DD5 — Microsoft GraphRAG batch worker

### Persona
Backend engineer + ML engineer.

### Outcome

Service `services/extract-graphrag/`:

```python
# services/extract-graphrag/main.py
import os
import subprocess
from fastapi import FastAPI

app = FastAPI()

# GraphRAG via LiteLLM provider config to use Vertex AI Gemini (v2.7.0+ default).
GRAPHRAG_SETTINGS = """
encoding_model: cl100k_base
skip_workflows: []
llm:
  api_key: $VERTEX_AI_KEY
  type: openai_chat                    # via LiteLLM
  model: gemini-2.5-flash
  api_base: https://us-central1-aiplatform.googleapis.com/v1beta1
  litellm_params:
    custom_llm_provider: vertex_ai
    vertex_project: $GCP_PROJECT_ID
    vertex_location: us-central1
embeddings:
  llm:
    api_key: $VERTEX_AI_KEY
    type: openai_embedding
    model: text-embedding-005
    litellm_params:
      custom_llm_provider: vertex_ai
"""

@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest) -> SynthesizeResponse:
    """Run GraphRAG on a corpus of documents from a case."""
    # 1. Stage corpus to local /tmp/corpus from Cloud Storage URIs.
    # 2. Write GRAPHRAG_SETTINGS with env-substituted secrets.
    # 3. Subprocess: graphrag index --root /tmp/run/.
    # 4. Read output Parquet artifacts (entities.parquet, relationships.parquet, communities.parquet).
    # 5. Adapt to ACO via aco_adapter.py.
    # 6. Return list of CommunitySummary with provenance.
    ...
```

ACO adapter:

```python
# backend/services/extract_graphrag/aco_adapter.py
def graphrag_to_aco(
    entities: list[GraphRagEntity],
    relationships: list[GraphRagRelationship],
    communities: list[GraphRagCommunity],
) -> AcoOutput:
    """Map GraphRAG output schema onto PRAXIS ACO primitives.

    GraphRAG entity.type → ACO primitive:
      person, organization → Actor
      event → Event
      claim/proposition → Claim
      goal → Interest
      rule/policy → Constraint
      tool/lever → Leverage
      promise/agreement → Commitment
      narrative/frame → Narrative

    GraphRAG relationship → graph edge with provenance.
    GraphRAG community summary → CandidateMemoBlock for review queue.
    """
    actors = [...]
    events = [...]
    claims = [...]
    edges = [...]
    candidate_summaries = [...]
    return AcoOutput(actors=actors, events=events, claims=claims, edges=edges, candidate_summaries=candidate_summaries)
```

V2-contract tool registration:

```ts
// src/lib/tools/registry/cross-community-synthesizer.ts
export const COMMUNITY_SYNTHESIZER_TOOL: ToolDefinitionV2 = {
  id: 'cross.community-synthesizer',
  version: '1.0.0',
  title: 'Community Synthesizer',
  description: 'Build a knowledge graph over a corpus of case documents and surface community-level themes via Microsoft GraphRAG.',
  category: 'cross-cutting',
  contextSpec: { ontologies: ['*'], requiresGraph: false, requiresDocuments: true, minDocumentCount: 5 },
  composition: { canChainInto: ['cross.brief-exporter'], canChainFrom: [] },
  sideEffects: 'writes-to-review-queue',
  subagentDeps: [],
  skill: { file: 'skills/tools/cross-community-synthesizer/SKILL.md' },
  inputSchema: { ... },
  outputSchema: { ... },
  estimatedRuntimeMs: 300000,    // 5 min P95 for 50-doc corpus
  costClass: 'expensive',
  streaming: false,
};
```

Rate limiting: 1 invocation per case per day. Cost ceiling $5 P95 per invocation.

Community summaries route through Pack 18 R1 review queue with `source.kind='graphrag-community-synthesizer'`. User accepts/rejects. Accepted summaries become memo blocks in MemoStudio.

### Files

- `services/extract-graphrag/main.py`, `Dockerfile`, `requirements.txt`, `cloudbuild.yaml`.
- `infrastructure/terraform/modules/extract-graphrag/`.
- `backend/services/extract_graphrag/aco_adapter.py`.
- `src/lib/tools/registry/cross-community-synthesizer.ts`.
- `skills/tools/cross-community-synthesizer/SKILL.md`.
- E2E test on a 10-document fixture corpus.

### Verify

- Sample run on 10-doc corpus produces ≥3 community summaries.
- Adapter produces well-formed ACO entities + edges (firewall accepts the writes).
- Cost ≤$5 P95.
- Rate limit enforced.

---

## 10. Prompt DD6 — ACLED removal + license audit deepening + ADR + verification

### Persona
Backend engineer + compliance.

### ACLED removal

```bash
# Files removed:
backend/services/feed_clients/acled.py
backend/tests/test_acled_client.py

# Files modified:
backend/services/feed_clients/__init__.py    # remove ACLED export
docs/architecture/CONFLICT_DATA_SOURCES.md   # note ACLED is excluded for license reasons
CHANGELOG.md                                  # entry: "ACLED adapter removed; CC-BY-NC EULA prohibits LLM/AI use even commercially. UCDP CC-BY-4.0 fills the role."
```

License audit verifies zero ACLED-derived content remains.

### License audit deepening

```ts
// scripts/audit-license-sbom.ts (extended)
// Per-worker venv check:
// - services/extract-docling: pip-licenses, no AGPL transitives confirmed (no ocrmypdf path)
// - services/extract-ner-gliner: pip-licenses, all clean (torch BSD, transformers Apache-2.0)
// - services/extract-graphrag: pip-licenses, all clean (litellm MIT, microsoft/graphrag MIT)
// - main backend: pip-licenses, no GLiNER/Docling/GraphRAG imports leak in
// Frontend SBOM: same check, no GPL/AGPL/CC-BY-NC.
// Fails CI on any flag.
```

### ADR

- `0047-extraction-layering-plus-graphrag-batch.md` — explains the layered pipeline (parser → recall NER → precision LLM), the cost-reduction logic, the GraphRAG batch pattern, the firewall + review-queue routing, the license discipline.

### Final verification

```bash
# Foundations
npm run typecheck && npm run lint && npm run test
pytest backend/ -q

# Pack-30-specific
npm run audit:license-sbom                 # zero non-permissive licenses, zero ACLED references
npm run audit:tool-contract-v2              # 54 tools (52 + GLiNER + GraphRAG)
npm run audit:tool-skills-present           # 54/54
npm run audit:firewall-coverage             # extended for new tools
npm run audit:cost-telemetry                # ≥50% Gemini token reduction validated

# All prior gates
npm run audit:gate

# Persona suites
npm run test:e2e:personas                  # 10 consecutive green

# Pack-specific
pytest services/extract-docling/tests/
pytest services/extract-ner-gliner/tests/
pytest services/extract-graphrag/tests/

# Live integration smoke
PRAXIS_ENV=staging python scripts/smoke-extraction-pipeline.py --doc=fixtures/unsc_sudan_2026.pdf

git tag v1.6.0
```

---

## 11. Out of scope

- ViEWS forecasting integration — Pack 31+ (it's an HTTP API, half-day job).
- OpenSanctions yente sanctions matching — Pack 31+.
- NetworkX + python-louvain centrality + community detection on graph_nodes — Pack 31+.
- Mesa 3 ABM simulation — Pack 31+.
- Cytoscape.js compound graphs — Sprint 2.
- deck.gl high-cardinality geo overlays — Sprint 2.
- Custom GLiNER fine-tuning — v2 (zero-shot is sufficient for v1).
- GraphRAG production-realtime mode — v2 (batch only for v1).
- Replacing Gemini extraction entirely with GLiNER — out of scope (Gemini's structured output remains the precision layer).

---

## 12. Closing note

Three permissive backend libraries. ~32 hours. PRAXIS gains layout-aware document parsing for treaties + UN reports + sanctions PDFs, ontology-aware zero-shot NER that cuts Gemini token cost ~50-70%, and corpus-level community synthesis via Microsoft GraphRAG mapped onto the 8 ACO primitives. ACLED is removed to preserve commercial license cleanliness. The 12 subagents, 9 ontologies, 12 surfaces, and existing orchestration are unchanged — three new Cloud Run workers slot into the existing pipeline as additional stages.

Branch: `feature/extraction-graphrag-wave`. Commit prefix `extract(<library>): DD<N> <description>`. PR titled `Pack 30 — Document Extraction & Knowledge Graph Wave`.

After merge, tag `v1.6.0`. Pack 31 follows with the analytics + sanctions + simulation wave (NetworkX + python-louvain + OpenSanctions yente + Mesa 3).

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_30_EXTRACTION_AND_GRAPHRAG_WAVE.md`
