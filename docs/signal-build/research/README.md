# Additional research and implementation decisions

This supplement extends the original project blueprint. Sources were checked on 5 October 2026. References point to primary papers, maintainers' documentation and provider terms. Summaries distinguish what a source establishes from the design recommended for SIGNAL. No third-party dataset, model weight or complete source article is included.

| File | Use in build phases |
| --- | --- |
| [RESEARCH_DECISIONS.md](RESEARCH_DECISIONS.md) | 00-01: choose the smallest coherent implementation |
| [ANALYTICAL_METHOD.md](ANALYTICAL_METHOD.md) | 04-06: retrieval, claims, frames, narrative continuity and metrics |
| [MULTILINGUAL_EVALUATION.md](MULTILINGUAL_EVALUATION.md) | 04, 08-09: language fidelity, benchmarks and held-out evaluation |
| [COLLECTOR_ACCESS.md](COLLECTOR_ACCESS.md) | 03, 07, 09: provider contracts, geography crosswalks and permissions |
| [TEMPORAL_CONTEXT_GRAPH.md](TEMPORAL_CONTEXT_GRAPH.md) | 01, 05-07: valid time, review lineage, portable expert context |
| [UI_BRIEF_SPEC.md](UI_BRIEF_SPEC.md) | 02, 06, 11: inspectable analysis and customer deliverables |
| [SOLO_FOUNDER_EXECUTION.md](SOLO_FOUNDER_EXECUTION.md) | 00, 08, 10-11: scope, operating costs and paid-pilot proof |
| [SOURCE_REGISTER.md](SOURCE_REGISTER.md) | Check the specific primary reference before integrating |

`source-register.json` records the new sources and the narrow claims checked. `provider-access-plan.json` records planned access states; it is not proof of a licence or credentials. `code/analysis-baselines.mjs` implements small deterministic reference guards. It does not perform real embedding inference, narrative detection or PRAXIS production analysis.

Main recommendation: reuse PRAXIS's current services, collect a bounded source panel, retrieve multilingual evidence, validate attributed claims, review narrative/assessment changes and export a pinned brief. Evaluate each step separately. A broad model language claim or public benchmark result does not establish competence on a customer's local dialect, political vocabulary or decision.
