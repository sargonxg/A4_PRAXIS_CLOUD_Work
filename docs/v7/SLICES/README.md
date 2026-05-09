# v7 Slices

This directory stores executable slice plans for the v7 Ask PRAXIS,
mobile-first, tacit-knowledge simplification wave.

Use `docs/v7/SLICE_TEMPLATE.md` for every new slice. A slice marked `proposed`
is planning material only and must not be coded until Giulio approves it.

Current slice:

- `00_foundations_cores_schema.md` — in-progress core substrate, flags, and
  audits for v7 Context Cores.
- `01_foundations_experience_map.md` — proposed foundations layer for the v7
  experience map and agentic workflow registry.
- `02_app_shell_skeleton.md` — in-progress flagged dashboard command shell
  preview for the simplified v7 user experience.
- `03_home_surface.md` — in-progress real Home preview for the Ask-first
  v7 front door.
- `04_ask_thread_substrate.md` — in-progress Ask substrate schema, types,
  audit, and flagged Ask surface.
- `05_cores_library_surface.md` — in-progress Cores Library surface that
  folds Situation, Sources, Graph/Ontology, Analyst Skills, and specialist
  panels into one guided destination.
- `06_source_document_core_panel.md` — in-progress Source/Document Core
  panel inside Cores Library with receipts, upload posture, coverage gaps,
  and Source Scout action.
- `07_outputs_surface.md` — in-progress Outputs surface for memos, briefs,
  handovers, talking points, provenance posture, and existing export entry
  points.
- `08_analyst_skills_panel.md` — in-progress Analyst Skills panel that groups
  the consolidated tool code by analyst work and stages skills into Ask PRAXIS.
- `09_v7_skill_manifest.md` — in-progress derived v7 skill manifest for every
  registered tool, including category, ontology compatibility, and posture.
- `10_ask_runtime_persistence.md` — in-progress Ask runtime persistence seam:
  FastAPI router, authenticated proxy path, and v7 Ask UI receipt panel.
- `11_ask_routing_layer.md` — in-progress inspectable Ask routing layer for
  direct answers, staged skills, subagent plans, and clarification receipts.
- `12_ask_core_resolution.md` — in-progress Ask Context Core resolver that
  persists and displays implicit/attached core snapshots before generation
  cutover.
- `13_ask_direct_answer_execution.md` — in-progress direct-answer execution
  seam that builds from resolved Context Cores, persists core citations, and
  gates live Vertex calls behind `PRAXIS_V7_ASK_AI_ENABLED`.
- `14_cores_read_api.md` — in-progress owner-scoped Core list/detail read API
  plus a materialized-core panel in the Cores Library.
- `15_ask_core_skill_execution.md` — in-progress first read-only Analyst Skill
  execution path from resolved Context Cores.
