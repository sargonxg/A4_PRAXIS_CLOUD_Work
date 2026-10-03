# Cognitive and document parser evaluation

`runCognitiveBenchmark` runs nine locked contexts: generic, documents, actual RAG retrieval, plain graph, graph with distinctions, cumulative heuristics, language, cases, and full compiled cognition. One snapshot digest and `asOf` date apply throughout the run. Provider and retrieval adapters receive detached inputs. Each completed call records the exact context digest, transmitted record IDs, evidence quotation digests, source versions, model and provider receipt.

The golden suite is synthetic. It covers typical, difficult, exception, adversarial and out-of-scope cases: diplomatic wording, temporal faction identity, authorization versus expenditure, heuristic withdrawal exceptions, reviewed correction, repeated sources, jurisdiction/posture differences and domain boundaries. Expected markers describe conclusions, distinctions, citations and questions; they do not require a particular prose style. Provider and retrieval adapters receive only the task ID, scope, prompt and observed fixture, never expected answer/citation markers. Applications should supply capsule-specific record IDs in their task contracts. A fixture expectation does not insert its named record into a capsule.

Benchmark providers return `conclusions`, `distinctions`, `citedIds`, `questions`, and optional `evidenceCitations`. Every cited ID must have been transmitted. Every evidence ID cited must also have an anchor `{id, sourceVersion, quoteHash}`; `quoteHash` is `sha256:` followed by the SHA-256 of the literal UTF-8 quote, without whitespace normalization. Locked but omitted records are not citable. A fabricated ID or altered anchor fails evaluation. Standalone `evaluateGoldenOutput` without a transmitted set performs marker checks only and reports citation posture `not-verified`.

Absent model/provider adapters remain `not-run`; missing retrieval leaves RAG `not-run`. Retrieval adapters must return `{evidence, retriever, retrievalReceipt}`; both retriever and execution receipt must be nonblank and are retained in the RAG context lock. A callback returning only concatenated document records is insufficient. These receipts record adapter execution; they do not independently certify retrieval quality. Supplying a test adapter proves the runner contract, not model improvement. The report always retains `modelImprovementEstablished: false`; representative data, controlled retrieval and blinded expert assessment remain prerequisites for stronger claims. No benchmark provider or paid job runs automatically.

## Parser-independent DocumentIR

The existing Google Document AI/fallback binding now attaches `metadata.documentIr`, using a version derived from actual supplied original file bytes, or supplied text bytes when no file exists. This additive metadata preserves the existing binding contract. Both existing parsers normalize text, so their IR says `textPosture: normalized`; normalized offsets are not original document offsets.

DocumentIR carries explicit pages, typed blocks, parser metadata, source version, geometry, parent links and cell grid coordinates. Runtime validation rejects duplicate IDs/pages, missing page or parent references, parent cycles, invalid table cells, unpaired/inverted offsets, and geometry outside a page. `documentIrJsonSchema()` exports the structural contract. Unknown parser structures remain outside the canonical IR.

Spatial evidence conversion verifies supported SHA-256 quote hashes against literal text and rejects mismatches. Unsupported legacy hashes remain unresolved. Normalized parser quotations are excerpts; only supplied original quotations with verified hash and stable content version become exact anchors. Source receipts require a matching captured original passage before a span is labeled exact. Web Annotation exports retain quote/position selectors and PDF geometry together with anchor status.

## Optional actual parser comparison

Run from the repository root:

```powershell
npx tsx scripts/benchmark-cognitive-parsers.ts --input .\example.pdf
npx tsx scripts/benchmark-cognitive-parsers.ts --input .\example.pdf --google-document-ai --python C:\path\python.exe --artifacts C:\path\preloaded-docling-models
```

The first command inventories honest pending results without invoking parsers. `--google-document-ai` explicitly opts into the existing configured Document AI API and needs the existing processor configuration/credentials. A fallback result is not reported as a successful Google parser benchmark.

Docling is optional and is not installed by this change. The adapter uses the explicitly selected Python environment and existing local artifacts, disables remote services and enables Hugging Face offline flags. It does not install dependencies, download models, replace the production parser, or retain credentials. Missing Docling or artifacts produce `not-run`; failed real conversions produce `failed`. The Python bridge converts Docling text, headings, footnotes, tables/cells, images and page geometry into neutral IR. It does not claim original text offsets or silently assign a table rectangle to every cell. OCR is disabled in this comparison profile and must be evaluated separately for scanned documents.

Reports record actual parser version, execution receipt, locked source version, elapsed time, IR digest and block counts. Counts and timing do not establish layout or evidence quality; `parserQualityImprovementEstablished` stays false until independent gold annotations are assessed.

## Portable constraints

`cognitiveConstraintProjection()` and `cognitiveShaclShapes()` export a separate RDF-friendly validation projection and SHACL Core shapes for commitments, speech acts, heuristics, evidence-bound claims and actor identity. `documentIrShacl()` exports document/page/block shapes. Canonical graph records remain in the existing JSON-LD format. These exports require no new graph store. Runtime remains the stronger authority for reference integrity, temporal/conditional semantics, geometry and cycles. Contract parity tests cover the corresponding required fields; no external SHACL engine run is claimed unless separately supplied and executed.

Tests: `npx vitest run tests/unit/lib/cognitive-capsule/advanced-evidence-evaluation.test.ts tests/unit/lib/cognitive-capsule/evidence-evaluation.test.ts tests/unit/lib/cognitive-capsule/validation-export.test.ts`.
