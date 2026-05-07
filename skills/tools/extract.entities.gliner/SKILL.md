# Extract Entities (GLiNER)

## Purpose
Run permissive-license GLiNER entity recall over parsed document text using PRAXIS ontology-specific labels.

## When To Use
Use this after Docling parsing and chunking when the system needs a broad candidate set of actors, places, institutions, incidents, interests, legal hooks, and indicators before expensive precision extraction.

## When Not To Use
Do not use it as a final graph writer, source verifier, or legal/factual adjudicator. It proposes candidates only.

## Inputs
- `text`: Parsed markdown or chunk text.
- `ontology_ids`: One or more PRAXIS ontology ids.
- `threshold`: Optional confidence threshold for returned candidates.

## Outputs
- `entities`: Candidate spans with text, label, offsets, and confidence.
- `label_sources`: Ontology label files used during extraction.
- `review_required`: Always true for graph write candidates.

## Context Requirements
Requires case context, source provenance, and the active ontology set. Low context health is advisory and should not block extraction.

## Composition
Can chain into `cross.contradiction-finder`, `cross.brief-exporter`, and precision extraction. It can precede `cross.community-synthesizer` when batch community synthesis is explicitly requested.

## Examples
Run on a mediation brief to extract parties, interests, constraints, proposed terms, and venue references before mapping them to ACO nodes.

## Pitfalls
High recall means false positives are expected. Never persist entities directly without symbolic firewall validation and review-queue routing.
