# PRAXIS Truth Layers v1

PRAXIS augments the existing ACO conflict grammar with four orthogonal truth layers:

- `source`: the document, URL, dataset, transcript, or analyst-uploaded object.
- `claim`: an extracted assertion grounded in one or more sources.
- `evidence`: a graph pattern or corroborated relation derived from claims.
- `verdict`: an analyst-defended judgment or tool output that cites evidence.

Every truth-layer node carries `caseId`, `ownerUid`, `confidence`, `provenance[]`, `validFrom`, `validTo`, `assertedFrom`, and `assertedTo`.

The ACO kind is not replaced. A node can remain `kind: "actor"` while also carrying `layer: "claim"`.
