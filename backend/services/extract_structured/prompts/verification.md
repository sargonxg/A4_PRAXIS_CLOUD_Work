# GLiNER Candidate Verification Prompt

Use GLiNER spans as high-recall candidates only. Verify each candidate against
the surrounding source text, discard false positives, and emit ACO nodes and
edges only when the source supports them. Synthesized claims must route through
the review queue and carry provenance.
