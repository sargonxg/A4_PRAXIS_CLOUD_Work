# Pack 28 Follow-Up Backlog

Owner: PRAXIS engineering
Target release: v1.5 backend completion

## P1 — Signed Draft Export Backend

- Extend the current Next/API export manifest endpoint into a server-rendered binary artifact pipeline.
- Persist generated Markdown/DOCX/PDF binaries under authenticated workspace/case storage with retention metadata.
- Add server-side C2PA signing or a clearly named substitute until C2PA credentials are provisioned.
- Add redaction filtering tests for public/internal/restricted outputs.

## P1 — Agent Engine Case Scaffolder

- Deploy `case_scaffolder` to Vertex Agent Engine.
- Add a 30-objective eval set and weekly freshness audit.
- Keep model routing in the central model matrix; no hard-coded provider strings in route handlers.
- Record per-call cost and trace ids.

## P1 — Review Queue And Firewall Commit For Scaffold Items

- Route accepted actor and claim candidates through the existing review queue.
- Continue persisting rejected candidates as discarded scaffold audit events only.
- Add symbolic firewall tests proving accepted scaffold writes cannot violate owner scope or ontology invariants.

## P2 — New-User End-To-End CI Flow

- Add an authenticated Playwright spec for onboarding -> AI-first case creation -> workbench -> first tool -> memo -> draft export.
- Run the flow against a synthetic user with isolated workspace data.
- Track wall-clock activation timing separately from demo workbench smoke.

## P2 — Role x Ontology Guidance Matrix Expansion

- Expand `src/lib/workbench/empty-state-actions.ts` from deterministic defaults into the full hand-reviewed role x ontology table requested by Pack 28.
- Add a table-shape audit once the matrix is complete.
