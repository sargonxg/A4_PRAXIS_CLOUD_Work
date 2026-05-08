# Orphan modules

Static modules with zero importers and not obvious framework entry points. These are candidates, not deletion approvals.

| module | lines | exports | risk | notes |
|---|---|---|---|---|
| src/lib/constants/frameworks.ts | 672 | GLASL_ESCALATION_MODEL, FISHER_URY_FRAMEWORK, INFORM_RISK_INDEX, BARNETT_DUVALL_POWER, ZARTMAN_RIPENESS, STEDMAN_SPOILER_THEORY | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/routers/chapters.py | 588 | DeskAskRequest, ToolRunRequest, BoardroomBriefingRequest, ResearchThreadRequest, ResearchRecallRequest, ResearchCloseRequest | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/media-sources.ts | 568 | MEDIA_SOURCES, MEDIA_SOURCES_MAP, getMediaSource, getMediaSourcesByType, getMediaSourcesByCountry, getHighReliabilitySources | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/routers/tabs.py | 523 | SituationFrameRequest, CoachRequest, _row_or_empty | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/concordia-demo.ts | 498 | MediationFramework, SessionPlan, MediationTurn, SettlementClause, Settlement, MEDIATION_FRAMEWORKS | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/scenario-configs.ts | 478 | ScenarioParams, ScenarioPreset, DEFAULT_PARAMS, PARAM_METADATA, SCENARIO_PRESETS | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/un-terminology.ts | 474 | TerminologyEntry, TerminologyCategory, UN_TERMINOLOGY, TERMINOLOGY_MAP, getTermsByCategory, getTermsBySeverity | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/cognee_memory.py | 428 | CogneeSearchMode, MemoryScope, MemoryHit, MemoryHealth, SearchAudit, OntologyRuntime | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/graphify_tacitus/analyze.py | 408 | _is_primitive, _is_file_node, _is_concept_node, _node_community_map, graph_diff, pivot_actors | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/routers/graph.py | 368 | GraphBackendConfig, GraphQueryRequest, TemporalSearchRequest | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/situation_health.py | 363 | HealthState, DegradationKind, HealthFinding, HealthDimension, AnalystProfileHealthInput, FeedHealthInput | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/notifications/__init__.py | 340 | _now, _json, _title_for, _body_for, _preference_mode, _quiet_hours_active | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/notifications/registry.py | 329 | NotificationCategory, NotificationUrgency, NotificationChannel, NotificationSpec, SourceIngestCompletePayload, SourceIngestFailedPayload | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/ai/prompts/report.ts | 328 | BASE_REPORT_PROMPT, SG_REPORT_PROMPTS, SC_BRIEFING_PROMPTS, POLITICAL_CABLE_PROMPTS, OPTIONS_PAPER_PROMPTS, CONFLICT_ASSESSMENT_PROMPTS | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/risk-monitor-data.ts | 321 | RiskLevel, EscalationTrend, TrendDirection, MonitoredRegion, RiskTimelinePoint, MONITORED_REGIONS | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/routers/pipeline.py | 312 | Source, PipelineRunRequest, IngestUrlRequest, IngestFeedsRequest, _run_analysis | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/actor-profiles.ts | 311 | ActorProfile, ACTOR_PROFILES | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/main.py | 300 | RequestContextMiddleware | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/proxy.ts | 284 | proxy, config | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/routers/notifications.py | 282 | SignalRequest, TestNotificationRequest, PreferencesRequest, DispatchRequest, _serialize | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/kg_repositories.py | 278 | GraphNodeRecord, GraphEdgeRecord, NodeRepo, EdgeRepo, GraphTraversalRepo, EmbeddingRepo | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/argus-demo.ts | 274 | ArgusQuery, ArgusDocument, ARGUS_DEMO_QUERIES, ARGUS_DEMO_DOCUMENTS, ARGUS_CROSS_CASE_MATRIX | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/graphify_tacitus/export.py | 258 | to_json, to_html, to_cypher, to_graphml | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| cloud_functions/_shared/spine.py | 230 | _ttl, build_idempotency_key, _semaphore_for_job, create_or_get_job, update_job_progress, complete_job | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/treaty-demo.ts | 227 | Agreement, Clause, ComplianceSummary, DEMO_AGREEMENTS, NORDALIA_CEASEFIRE_CLAUSES, COMPLIANCE_SUMMARY | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/mcp/praxis_server.py | 220 |  | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/data-feeds/resilient-fetch.ts | 219 | fetchConflictEvents, fetchDisplacementData, fetchEconomicIndicators, fetchNewsArticles | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/routers/workspace.py | 210 | SuggestionActionRequest, _event_from_suggestion, _event_from_log, _sse_event_name, _sse | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/ontology_system.py | 209 | CaseTypeSpec, normalize_case_type, available_case_types, ontology_stack_for_case_types, ontology_resolver_descriptor, data_point_modules_for_case_types | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/graphify_tacitus/report.py | 205 | render_situation_brief, render_situation_brief_json | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/migrations/versions/0017_deep_preship_foundation.py | 203 | upgrade, downgrade | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/dossier-templates.ts | 201 | DossierType, DossierSection, GenerationStep, DOSSIER_TYPES, DOSSIER_SECTIONS, GENERATION_STEPS | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/migrations/versions/0015_workspace_tabs_chapters.py | 197 | upgrade, downgrade | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/neo4j_client.py | 197 | Neo4jClient, _with_bitemporal, _safe_label, _is_read_only_cypher, DialecticaClient | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/graphify_tacitus/extract.py | 195 | _make_id, _strip_html, _parse_llm_response | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| cloud_functions/on_situation_created/main.py | 195 | _get_id_token, _extract_situation, on_situation_created | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/graphify_tacitus/schemas/aco.py | 191 | ConfidenceLevel, PrimitiveType, SourceSpan, ACONode, Actor, Claim | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| cloud_functions/gdelt_poller/worker.py | 188 | _load_required_env, _get_id_token, verify_required_indexes, poll_once, main | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/hooks/use-conflict-data.ts | 186 | ConflictListItem, ConflictDetail, useConflictList, useConflictDetail | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/analytics/network_metrics.py | 184 | RankedNode, NetworkAnalysisResult, graph_from_records, compute_centrality, detect_communities, k_core_decomposition | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| cloud_functions/on_document_uploaded/main.py | 179 | _get_id_token, on_document_uploaded | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/auth.py | 174 | _init_firebase | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/graph_adapter.py | 172 | GraphAdapter, Neo4jAdapter, _safe_cypher_identifier, create_graph_adapter | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/routers/memory.py | 168 | _row_dict, RememberRequest, RecallRequest, PromoteRequest, RejectRequest | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/ai/prompts/media.ts | 161 | MEDIA_SOURCE_ANALYSIS_PROMPT, MEDIA_COVERAGE_COMPARISON_PROMPT, NARRATIVE_ANALYSIS_PROMPT, MEDIA_BIAS_DETECTION_PROMPT | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/notifications/delivery.py | 161 | _now_iso, sign_webhook_payload, provider_configured, initial_channel_status, plan_external_deliveries | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/cognee_bridge.py | 159 | CogneeCandidate, capped_confidence | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/data-feeds/aggregator-v2.ts | 157 | UserAwareIntelligence, UserAwareOptions, getUserAwareIntelligence | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/chunker/docling_chunker.py | 156 | Chunk, chunk_docling_document, _extract_items, _tag_docling_items, _order_key, _kind | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/agents/deploy.py | 153 | build_agent, main | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/calendar-events.ts | 152 | CalendarEvent, calendarEvents | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/ai/flows.py | 149 | _register_flows | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/ontology_evolution.py | 147 | UngroundedPattern, OntologyGapProposal, _candidate_key, _sample_quotes, _suggested_fields, detect_ontology_gap | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/routers/analyze.py | 143 | DiffRequest | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| services/extract-graphrag/main.py | 136 | Chunk, SynthesizeRequest, CommunitySummary, healthz, synthesize, _graphrag_enabled | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/ai/build-context-pure.ts | 134 | buildToolContext | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/types/sats.py | 131 | ACHHypothesis, ACHEvidence, ACHScore, ACHRanking, ACHMatrix, KACAssumption | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/agents/langgraph/checkpointing.py | 123 | _resolve_password, _conninfo, get_checkpointer, close_checkpointer, health_check | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/migrations/versions/0016_workspace_chapter_products.py | 123 | upgrade, downgrade | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/sanctions/yente_client.py | 123 | ActorNode, SanctionsMatch, normalize_actor, build_owner_scoped_actor_metadata_update | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/geo/region-centers.ts | 122 | regionCenter, DEFAULT_WORLD_CENTER | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/api/with-activity.ts | 118 | useTrackedFetch | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/early-warning-data.ts | 118 | MonitoredSituation, monitoredSituations | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/dialectica/recipes/common.py | 117 | build_graph, node_type, relation, confidence, metadata, label | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/migrations/versions/0011_postgres_kg_contract.py | 111 | upgrade, downgrade | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/bigquery_client.py | 111 | _get_client, _dataset, _project, log_pipeline_run, log_extraction, get_usage_metrics | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/types/boardroom.py | 111 | PersonaFramework, Citation, PersonaSpec, ToolUse, PersonaContribution, SynthesisClaim | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/conflict-media-resources.ts | 109 | ConflictMediaResource, ConflictResearchKit, CONFLICT_RESEARCH_KITS, getResearchKit | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/context_layers.py | 107 | UserContext, WorkspaceGuideline, WorkspaceContext, CaseContext, ConversationContext, ContextAdvisory | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/graphify_tacitus/validate.py | 106 | validate_extraction | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/migrations/versions/0018_notifications_feedback_system.py | 106 | upgrade, downgrade | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/extract_graphrag/aco_adapter.py | 106 | AcoOutput, graphrag_to_aco, _entity_to_node, _relationship_to_edge, _community_to_review_block, _stable_id | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/firestore_sync.py | 106 | FirestoreSync | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/services/postgres.py | 105 | TenantConnection, _conninfo | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/agents/firewall/graph.py | 102 | FirewallDecision, validate_cypher, _needle | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| cloud_functions/gdelt_poller/main.py | 102 | _get_id_token, gdelt_poller | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/auth/mock-auth.ts | 99 | AuthUser, getSession, signIn, signInDemo, signOut | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| backend/graphify_tacitus/schemas/relationships.py | 98 | normalize_relation, canonical_relation, validate_relation | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/constants/global-media-sources.ts | 97 | MediaSource, GLOBAL_MEDIA_SOURCES, getReliabilityLabel, getSourcesByType, getSourcesForRegion | medium | Zero static importers; verify dynamic import/string usage before deletion. |
| src/lib/api/praxis-backend.ts | 95 | praxisBackend | medium | Zero static importers; verify dynamic import/string usage before deletion. |
