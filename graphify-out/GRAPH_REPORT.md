# Graph Report - praxiscodexworking  (2026-04-30)

## Corpus Check
- 899 files · ~978,417 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3112 nodes · 3799 edges · 107 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 699 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 134|Community 134]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 137|Community 137]]
- [[_COMMUNITY_Community 138|Community 138]]
- [[_COMMUNITY_Community 145|Community 145]]
- [[_COMMUNITY_Community 146|Community 146]]
- [[_COMMUNITY_Community 148|Community 148]]
- [[_COMMUNITY_Community 152|Community 152]]
- [[_COMMUNITY_Community 154|Community 154]]
- [[_COMMUNITY_Community 157|Community 157]]
- [[_COMMUNITY_Community 160|Community 160]]
- [[_COMMUNITY_Community 168|Community 168]]
- [[_COMMUNITY_Community 170|Community 170]]
- [[_COMMUNITY_Community 177|Community 177]]
- [[_COMMUNITY_Community 190|Community 190]]
- [[_COMMUNITY_Community 195|Community 195]]
- [[_COMMUNITY_Community 201|Community 201]]
- [[_COMMUNITY_Community 206|Community 206]]
- [[_COMMUNITY_Community 208|Community 208]]

## God Nodes (most connected - your core abstractions)
1. `FirestoreSync` - 55 edges
2. `ConflictMemory` - 36 edges
3. `GeminiClient` - 35 edges
4. `getAdminDbOrThrow()` - 32 edges
5. `SpannerGraphAdapter` - 28 edges
6. `build_from_json()` - 25 edges
7. `FalkorDBAdapter` - 25 edges
8. `ACO v2.0 — Agentic Conflict Ontology schema package.  14 entity types (8 core` - 23 edges
9. `PrimitiveType` - 22 edges
10. `set()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Graph extraction validation — adapted from Graphify's validate.py.  Validates` --uses--> `PrimitiveType`  [INFERRED]
  backend\graphify_tacitus\validate.py → backend\graphify_tacitus\schemas\aco.py
- `Compare two graph snapshots and return structural differences.` --uses--> `FirestoreSync`  [INFERRED]
  backend\routers\analyze.py → backend\services\firestore_sync.py
- `test_primitive_type_has_all_8_values()` --calls--> `set()`  [INFERRED]
  backend\tests\test_aco_schemas.py → src\app\app\settings\graph-backend\page.tsx
- `test_aco_type_map_has_all_8_types()` --calls--> `set()`  [INFERRED]
  backend\tests\test_aco_schemas.py → src\app\app\settings\graph-backend\page.tsx
- `resolveSituationFromRequest()` --calls--> `getSituationById()`  [INFERRED]
  src\lib\ai\diplomatic-drafting-service.ts → src\lib\firebase\situations.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (81): ACOExtractionOutput, PRAXIS AI Flows — structured Genkit flows for conflict intelligence.  Falls ba, Run ACO extraction using Genkit if available, else raw google-genai.      This, Register Genkit flows on the given Genkit instance., _register_flows(), run_extraction(), SituationBrief, BaseModel (+73 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (96): query_gdelt(), GDELT DOC API client — queries for news articles by keyword., Query GDELT DOC API for articles matching keywords.      Returns list of {url,, gdelt_poller(), _get_id_token(), Cloud Function: gdelt_poller  HTTP-triggered function (called by Cloud Schedul, Poll GDELT feeds for all active situations and ingest new articles., set() (+88 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (68): GET(), PUT(), saveToolOutput(), gateTier(), meetsTier(), parseDateLike(), resolveTier(), checkAndDeductCredits() (+60 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (61): buildAdvisorBriefing(), pickModelForTier(), renderHistoryBlock(), runFirestoreAdvisor(), resolveAdvisorModel(), formatResultsAsContext(), getCached(), getClient() (+53 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (60): withAuth(), _init_firebase(), Firebase ID token verification for FastAPI.  Every protected endpoint uses Dep, FastAPI dependency: verify a trusted Google service-account OIDC token.      Use, Initialize firebase-admin once. Subsequent calls are no-ops.      Credential r, FastAPI dependency: verify Firebase ID token OR Google OIDC token.      Token, verify_firebase_token(), verify_service_token() (+52 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (68): extract_conflict_text(), extract_from_document(), extract_from_url(), _make_id(), _parse_llm_response(), Conflict entity extractor — reads source text, produces ACO entities via Gemini., Parse LLM JSON response into ExtractionResult., Extract ACO entities from plain text via Gemini. (+60 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (33): ABC, create_adapter_from_settings(), create_graph_adapter(), FalkorDBAdapter, GraphAdapter, Neo4jAdapter, Graph database adapter — supports Neo4j, FalkorDB, and Cloud Spanner Graph.  U, FalkorDB graph backend — Redis-compatible, sub-millisecond latency. (+25 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (49): checkAiRequestLimits(), enrichCalibrationWithToolBackbone(), estimateTextChars(), jsonError(), getToolById(), GET(), main(), pageExists() (+41 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (42): areSameFact(), computeFactConfidence(), computeTrustworthiness(), crossSourceCorroborate(), detectContradictions(), getSourceReliability(), groupFacts(), jaccardSimilarity() (+34 more)

### Community 9 - "Community 9"
Cohesion: 0.03
Nodes (29): AppShell(), AssistantPage(), AuthProvider(), CoreToolsWidget(), DashboardPage(), DomainPicker(), DossierPage(), useNotifications() (+21 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (50): deriveInteractionFrame(), summarizeOutput(), truncate(), buildCalibratedContext(), agenticMemoryHealth(), availableLayers(), buildSituationContextHealthPrompt(), computeScore() (+42 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (40): getPersona(), AgentRunnerError, clamp(), formatCalibrationBlock(), formatCorpusBlock(), formatPersonaBlock(), runAgent(), buildCrossToolContext() (+32 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (35): fetchGraph(), gdeltFetch(), getEntitySignal(), rateLimit(), addEdges(), addNodes(), getGraph(), getGraphEvolution() (+27 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (24): delegateToAskPraxis(), buildAnnotationContext(), buildGraphContext(), buildLegacyGraphContext(), buildMemoryContext(), buildSKCContext(), graphContextToPrompt(), buildDiplomaticDraftingContext() (+16 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (10): POST(), POST(), addEntity(), createConflict(), createConflictWithId(), emptyGraph(), generateId(), getConflict() (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (34): Enum, _age(), AnalystProfileHealthInput, _as_utc(), compute_situation_health(), _corpus_health(), CorpusCoverageHealthInput, DegradationKind (+26 more)

### Community 16 - "Community 16"
Cohesion: 0.1
Nodes (28): addActor(), addEvent(), adminSituationsCol(), archiveSituation(), createSituation(), createSituationAdmin(), deleteSituation(), deleteSituationAdmin() (+20 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (8): buildAdjacency(), computeBetweennessCentrality(), computeDensity(), detectCommunities(), findShortestPath(), getMostCentralNode(), FirestoreGraphLayer, Neo4jGraphLayer

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (25): _get_id_token(), main(), poll_once(), GDELT poller — Cloud Run Worker Pool variant.  Runs continuously. Polls every, One pass: list active situations, ingest GDELT for each.      Returns a result, Run a cheap probe of the collection_group("situations").where("status",...), verify_required_indexes(), _get_id_token() (+17 more)

### Community 19 - "Community 19"
Cohesion: 0.1
Nodes (18): handleRouteError(), emitMeterEvent(), emitToolRunMetered(), getSecret(), isDisabled(), situationToCaseData(), GET(), isVerified() (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (22): buildAad(), decrypt(), encrypt(), getMasterKey(), maskSecret(), bustCapabilitiesCache(), cacheKey(), resolveFeedCapabilities() (+14 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (8): handleFileChange(), setFiles(), move(), toggleHidden(), acceptFiles(), parseUrls(), save(), uploadAll()

### Community 22 - "Community 22"
Cohesion: 0.1
Nodes (17): getPreferences(), PATH(), savePreferences(), content_hash(), ExtractionCache, Content-addressed cache for incremental processing — copied from Graphify., Simple file-based cache keyed by source content hash.      Prevents re-extract, SHA256 hash of text content for cache keys. (+9 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (19): buildLiveSourcePack(), formatScrapes(), formatSources(), formatUcdp(), buildSourceReceipts(), clampReliability(), cleanExcerpt(), confidenceForReliability() (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (19): craftQueriesFromTemplate(), craftQueriesWithAI(), getToolSourceHints(), getToolTimeWindow(), buildSourceFocusedQueries(), executeWebResearch(), getAvailableProviders(), getCached() (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (3): handleChange(), handleDrop(), validateFile()

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (10): CloudLoggingJsonFormatter, configure_logging(), Structured JSON logging for Cloud Run / Cloud Logging.  Emits one JSON object, Emit each record as a single JSON line keyed for Cloud Logging., Install the JSON formatter on the root logger.      Idempotent — safe to call, formatDateRange(), formatDiplomaticDate(), formatISODate() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (8): DialecticaClient, Neo4j DIALECTICA client — direct async Neo4j driver (non-adapter version).  Fo, Find shortest path between two entities., Async Neo4j client for the DIALECTICA conflict knowledge graph., Create uniqueness constraints for all ACO primitive types., Push NetworkX graph to Neo4j with ACO labels and tenant isolation., Return all nodes and edges for a situation., Get full actor profile: actor node + all connected entities.

### Community 28 - "Community 28"
Cohesion: 0.26
Nodes (11): AdminLayout(), getAdminEmailAllowlist(), getAdminGateStatus(), getAdminPrincipalAccess(), getAdminUidAllowlist(), isAdmin(), isAdminEmail(), isAdminPrincipal() (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (12): make_test_graph(), Tests for graph export endpoint helpers., Verify MERGE (not CREATE) is used for both nodes and edges., Relation labels must be uppercased in Cypher., Edges without a relation get RELATED_TO as default., test_gexf_roundtrip(), test_graphml_roundtrip(), test_json_roundtrip() (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (3): DebugErrorBoundary, handler(), toggle()

### Community 31 - "Community 31"
Cohesion: 0.26
Nodes (9): fetchActors(), fetchEvents(), fetchEventTrend(), fetchPage(), fetchWithRetry(), getCredentials(), isACLEDConfigured(), normalizeActor() (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.32
Nodes (9): clusterEvents(), computeCentroid(), computeRadius(), computeTrend(), daysBefore(), detectMovement(), haversineDistance(), mostFrequent() (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.32
Nodes (11): getEconomicSnapshot(), getFragilityIndicators(), getGDP(), getGovernanceIndicators(), getIndicator(), getInflation(), getLatest(), getMilitaryExpenditure() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.21
Nodes (5): deductCredits(), ensureUserProfile(), getCreditBalance(), getUserProfile(), recordCreditTransaction()

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (7): GET(), getAdvisor(), HISTORY(), listAdvisors(), PATH(), saveAdvisor(), main()

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (3): buildMarkdown(), handleCopyToClipboard(), handleDownloadMarkdown()

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (4): SpecialisedBadge(), ToolInvocation(), tryParseJson(), useCountdown()

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (7): buildCaseContextString(), getActorClaims(), getActorFromCase(), getActorInterests(), getActorRelationships(), getCaseEventsSorted(), getCaseOntology()

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (2): estimateTokens(), RetrievalOrchestrator

### Community 40 - "Community 40"
Cohesion: 0.2
Nodes (1): SituationKnowledgeCore

### Community 41 - "Community 41"
Cohesion: 0.27
Nodes (6): isToolHidden(), applyToolPreferences(), hiddenToolSet(), isToolHiddenByPreference(), normalizeToolPreferenceId(), orderedToolIds()

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): bodyParagraph(), divider(), generateBriefingDOCX(), generateDossierDOCX(), generateSituationReportDOCX(), headerParagraph(), metaParagraph(), normalizeSources()

### Community 43 - "Community 43"
Cohesion: 0.27
Nodes (6): recommendToolsForRole(), buildPathFromPolicy(), getRecommendedToolIdsForWorkflowPath(), getToolIdsForPath(), getToolPath(), unique()

### Community 44 - "Community 44"
Cohesion: 0.2
Nodes (8): Deep Research Agent for PRAXIS.  Three-phase pipeline: search → extract → synt, document_retrieval_tool(), graph_query_tool(), Tool implementations for the Deep Research Agent., Search the web for current information about conflict topics., Retrieve relevant document excerpts from the user's uploaded documents., Query the conflict knowledge graph for entities and relationships., web_search_tool()

### Community 45 - "Community 45"
Cohesion: 0.31
Nodes (7): createSession(), getAccessToken(), getAuth(), inferPhase(), parseAgentEvent(), streamAgentQuery(), streamAgentTurn()

### Community 46 - "Community 46"
Cohesion: 0.42
Nodes (8): buildAad(), deleteLegacy(), encrypt(), getMasterKey(), initFirestore(), main(), maskSecret(), migrateUser()

### Community 50 - "Community 50"
Cohesion: 0.25
Nodes (2): genId(), submit()

### Community 51 - "Community 51"
Cohesion: 0.39
Nodes (7): getWikipediaRelated(), getWikipediaSummary(), RELATED_URL(), safeFetch(), SEARCH_URL(), searchWikipedia(), SUMMARY_URL()

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (1): FeedLayer

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (2): CircuitBreaker, getAllBreakerStates()

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (7): _build_genkit(), get_ai_for_user(), get_model_for_category(), PRAXIS Genkit AI application — multi-provider, user-key-aware.  Platform-level, Build a Genkit instance with the given provider configurations., Create a Genkit instance with user's own API keys if provided.      Falls back, Return the preferred model ID for a given tool category.      Categories: fast

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (7): Security utilities — URL validation, label sanitization — copied from Graphify., Return True if URL uses http/https and has a valid hostname., Strip characters that could cause issues in Neo4j/HTML contexts., Ensure a file path stays within the allowed directory (path traversal prevention, sanitize_label(), validate_path(), validate_url()

### Community 56 - "Community 56"
Cohesion: 0.32
Nodes (3): main(), renderReport(), walkRoutes()

### Community 59 - "Community 59"
Cohesion: 0.32
Nodes (3): RiskTrajectoryChart(), scaleX(), scaleY()

### Community 62 - "Community 62"
Cohesion: 0.39
Nodes (5): EventDetailPanel(), EventDot(), getEscalationColor(), getEscalationIcon(), getGlaslStage()

### Community 63 - "Community 63"
Cohesion: 0.46
Nodes (7): appendMessage(), chatDoc(), chatsRef(), createChat(), deleteChat(), getChat(), listChats()

### Community 64 - "Community 64"
Cohesion: 0.43
Nodes (6): approveProposal(), collectionRef(), countOpenProposals(), getProposal(), listProposals(), rejectProposal()

### Community 65 - "Community 65"
Cohesion: 0.43
Nodes (7): createReport(), deleteReport(), getReport(), listReports(), reportDoc(), reportsRef(), updateReport()

### Community 66 - "Community 66"
Cohesion: 0.57
Nodes (7): baseTemplate(), getResend(), send(), sendAlertDigestEmail(), sendCreditWarningEmail(), sendWeeklySummaryEmail(), sendWelcomeEmail()

### Community 67 - "Community 67"
Cohesion: 0.62
Nodes (6): addSecurityHeaders(), generateNonce(), nextWithNonce(), parseSessionForRouting(), proxy(), rewriteWithNonce()

### Community 68 - "Community 68"
Cohesion: 0.52
Nodes (6): generateDocx(), generatePdf(), loadReport(), POST(), reportToMarkdown(), stripMd()

### Community 69 - "Community 69"
Cohesion: 0.38
Nodes (4): handleDownload(), brainstormingTableFilename(), brainstormingTableToMarkdown(), escapeQuoted()

### Community 71 - "Community 71"
Cohesion: 0.52
Nodes (6): buildToolContext(), formatRole(), formatType(), getGlaslLabel(), getGlaslZone(), getTypeGuidance()

### Community 72 - "Community 72"
Cohesion: 0.48
Nodes (5): computeActorFragmentation(), computeEscalation(), computeGeographicSpread(), computeWeightedIntensity(), getStageTransitionProbability()

### Community 73 - "Community 73"
Cohesion: 0.38
Nodes (3): cached(), getDisplacedToCountries(), getDisplacementStats()

### Community 74 - "Community 74"
Cohesion: 0.48
Nodes (5): addAnalystNote(), deleteAnalystNote(), listAnalystNotes(), notesRef(), updateAnalystNote()

### Community 75 - "Community 75"
Cohesion: 0.52
Nodes (6): getCrossContextEntities(), getEntitiesForSituation(), indexEntities(), makeEntityId(), normalize(), searchGlobalEntities()

### Community 76 - "Community 76"
Cohesion: 0.4
Nodes (5): _map_event_type(), query_acled(), ACLED API client — queries conflict events for a country., Query ACLED API for conflict events in a country.      Returns list of dicts i, Map ACLED event type to ACO event_type vocabulary.

### Community 82 - "Community 82"
Cohesion: 0.33
Nodes (1): ToolErrorBoundary

### Community 85 - "Community 85"
Cohesion: 0.6
Nodes (5): buildAskPraxisExtensions(), makeFirecrawlFetch(), makeParallelResearch(), makeRunDeepResearch(), makeWriteToTool()

### Community 87 - "Community 87"
Cohesion: 0.6
Nodes (5): clamp(), computeINFORM(), computeRiskScore(), getStageTransitionRisk(), wgiToRiskScore()

### Community 88 - "Community 88"
Cohesion: 0.4
Nodes (3): callBackend(), getBackendIdToken(), proxyBackendRequest()

### Community 89 - "Community 89"
Cohesion: 0.6
Nodes (5): createScenario(), deleteScenario(), getScenario(), listScenarios(), scenariosRef()

### Community 91 - "Community 91"
Cohesion: 0.7
Nodes (3): colorize(), main(), statusColor()

### Community 92 - "Community 92"
Cohesion: 0.5
Nodes (2): parseEditor(), saveDomain()

### Community 94 - "Community 94"
Cohesion: 0.6
Nodes (3): BRIEF_HISTORY_KEY(), loadBriefHistory(), saveBriefToHistory()

### Community 98 - "Community 98"
Cohesion: 0.5
Nodes (2): formatMoney(), formatNumber()

### Community 102 - "Community 102"
Cohesion: 0.5
Nodes (2): setWorkingStyle(), toggleSource()

### Community 103 - "Community 103"
Cohesion: 0.6
Nodes (4): buildExportPayload(), generate(), isIntelligenceResult(), saveJsonExport()

### Community 109 - "Community 109"
Cohesion: 0.6
Nodes (3): getACOBorderColor(), getACOColor(), getACOFillColor()

### Community 111 - "Community 111"
Cohesion: 0.8
Nodes (4): initAnalystProfileIfMissing(), loadAnalystProfile(), PROFILE_PATH(), saveProfilePatch()

### Community 112 - "Community 112"
Cohesion: 0.6
Nodes (3): buildAdvancedMediaSearchQuery(), cleanToken(), quote()

### Community 114 - "Community 114"
Cohesion: 0.7
Nodes (4): readToolData(), subscribeToolData(), toolRef(), writeToolData()

### Community 115 - "Community 115"
Cohesion: 0.4
Nodes (2): CitationIndex(), cn()

### Community 116 - "Community 116"
Cohesion: 0.67
Nodes (3): build_agent(), main(), Deploy the PRAXIS Deep Research Agent to Vertex AI Agent Engine.  Usage (from

### Community 117 - "Community 117"
Cohesion: 0.5
Nodes (2): GET(), getCaseById()

### Community 119 - "Community 119"
Cohesion: 0.83
Nodes (3): getResearchStatus(), researchStatusRef(), saveResearchStatus()

### Community 134 - "Community 134"
Cohesion: 0.67
Nodes (2): PartyBar(), pct()

### Community 135 - "Community 135"
Cohesion: 0.67
Nodes (2): getVisitedPages(), markPageVisited()

### Community 137 - "Community 137"
Cohesion: 0.67
Nodes (2): addRecentSearch(), getRecentSearches()

### Community 138 - "Community 138"
Cohesion: 0.83
Nodes (3): getColor(), lerp(), lerpColor()

### Community 145 - "Community 145"
Cohesion: 0.67
Nodes (2): classifyStatus(), getCrisisWatch()

### Community 146 - "Community 146"
Cohesion: 0.5
Nodes (2): initTracing(), register()

### Community 148 - "Community 148"
Cohesion: 0.83
Nodes (3): applySourcePreferences(), normalizeHost(), preferenceForUrl()

### Community 152 - "Community 152"
Cohesion: 0.67
Nodes (1): Deploy the Deep Research ADK agent to Vertex AI Agent Engine with Memory Bank.

### Community 154 - "Community 154"
Cohesion: 1.0
Nodes (2): formatDigest(), formatMarkdownSection()

### Community 157 - "Community 157"
Cohesion: 1.0
Nodes (2): load(), submit()

### Community 160 - "Community 160"
Cohesion: 0.67
Nodes (1): Layout()

### Community 168 - "Community 168"
Cohesion: 1.0
Nodes (2): buildCategories(), SuggestedPrompts()

### Community 170 - "Community 170"
Cohesion: 1.0
Nodes (2): RiskGaugeWidget(), riskLabel()

### Community 177 - "Community 177"
Cohesion: 1.0
Nodes (2): buildDocumentRefHref(), DocumentRefChip()

### Community 190 - "Community 190"
Cohesion: 1.0
Nodes (2): getColor(), RiskGauge()

### Community 195 - "Community 195"
Cohesion: 1.0
Nodes (2): hasCitations(), parseChatCitations()

### Community 201 - "Community 201"
Cohesion: 1.0
Nodes (2): normalize(), regionCenter()

### Community 206 - "Community 206"
Cohesion: 0.67
Nodes (1): PubSub

### Community 208 - "Community 208"
Cohesion: 1.0
Nodes (1): graphify_tacitus — Graphify fork adapted for the TACITUS Agentic Conflict Ontolo

## Knowledge Gaps
- **131 isolated node(s):** `Firebase ID token verification for FastAPI.  Every protected endpoint uses Dep`, `Initialize firebase-admin once. Subsequent calls are no-ops.      Credential r`, `FastAPI dependency: verify Firebase ID token OR Google OIDC token.      Token`, `FastAPI dependency: verify a trusted Google service-account OIDC token.      Use`, `PRAXIS Backend configuration — loads from environment variables.` (+126 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 39`** (11 nodes): `estimateTokens()`, `RetrievalOrchestrator`, `.clipStructuredData()`, `.constructor()`, `.retrieve()`, `.trimEdges()`, `.trimFeedData()`, `.trimNodes()`, `.trimToolData()`, `.trimVectorResults()`, `retrieval-orchestrator.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (11 nodes): `SituationKnowledgeCore`, `.constructor()`, `.getHealth()`, `.getToolContext()`, `.ingestDocument()`, `.ingestToolOutput()`, `.retrieve()`, `.saveFeedData()`, `.upsertGraphEdge()`, `.upsertGraphNode()`, `situation-knowledge-core.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (9 nodes): `addCustom()`, `genId()`, `handleDragEnd()`, `removeCustom()`, `resolveOrder()`, `submit()`, `toggleCat()`, `toggleExpand()`, `source-picker.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (9 nodes): `FeedLayer`, `.constructor()`, `.feedCacheRef()`, `.getFeedData()`, `.getMultipleFeedData()`, `.getToolRelevantFeeds()`, `.isHealthy()`, `.saveFeedData()`, `feed-layer.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (9 nodes): `circuit-breaker.ts`, `CircuitBreaker`, `.constructor()`, `.execute()`, `.getDetails()`, `.getName()`, `.getState()`, `getAllBreakerDetails()`, `getAllBreakerStates()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (6 nodes): `ToolErrorBoundary`, `.componentDidCatch()`, `.constructor()`, `.getDerivedStateFromError()`, `.render()`, `tool-error-boundary.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (5 nodes): `domainToEditor()`, `iconFor()`, `parseEditor()`, `saveDomain()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (5 nodes): `formatMoney()`, `formatNumber()`, `StatCard()`, `TrendArrow()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (5 nodes): `cn()`, `requestMoreRedLines()`, `setWorkingStyle()`, `toggleSource()`, `step-working-style.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (5 nodes): `CitationIndex()`, `CitationLayer()`, `citation-chip.tsx`, `cn.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (4 nodes): `GET()`, `getCaseById()`, `route.ts`, `demo-cases.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 134`** (4 nodes): `calculateZOPA()`, `PartyBar()`, `pct()`, `zopa-visualizer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (4 nodes): `getVisitedPages()`, `markPageVisited()`, `UnvisitedDot()`, `contextual-hint.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (4 nodes): `addRecentSearch()`, `getRecentSearches()`, `handleKeyDown()`, `global-search.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (4 nodes): `classifyStatus()`, `getCrisisWatch()`, `isCrisisGroupConfigured()`, `crisisgroup-client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (4 nodes): `initTracing()`, `register()`, `instrumentation.ts`, `tracing.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (3 nodes): `main()`, `deploy_agent.py`, `Deploy the Deep Research ADK agent to Vertex AI Agent Engine with Memory Bank.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (3 nodes): `formatDigest()`, `formatMarkdownSection()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (3 nodes): `load()`, `submit()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 160`** (3 nodes): `Layout()`, `layout.tsx`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 168`** (3 nodes): `buildCategories()`, `SuggestedPrompts()`, `suggested-prompts.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 170`** (3 nodes): `RiskGaugeWidget()`, `riskLabel()`, `risk-gauge-widget.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 177`** (3 nodes): `buildDocumentRefHref()`, `DocumentRefChip()`, `document-ref-chip.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 190`** (3 nodes): `risk-gauge.tsx`, `getColor()`, `RiskGauge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 195`** (3 nodes): `hasCitations()`, `parseChatCitations()`, `citation-parser.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 201`** (3 nodes): `normalize()`, `regionCenter()`, `region-centers.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 206`** (3 nodes): `PubSub`, `.topic()`, `profile-events.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 208`** (2 nodes): `__init__.py`, `graphify_tacitus — Graphify fork adapted for the TACITUS Agentic Conflict Ontolo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `buildCalibratedContext()` connect `Community 10` to `Community 16`, `Community 2`, `Community 3`, `Community 22`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `PATH()` connect `Community 22` to `Community 1`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `getPreferences()` connect `Community 22` to `Community 10`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Are the 40 inferred relationships involving `FirestoreSync` (e.g. with `DiffRequest` and `Analyze router — /api/v1/analyze/*  Exposes individual analysis results from t`) actually correct?**
  _`FirestoreSync` has 40 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `ConflictMemory` (e.g. with `GraphBackendConfig` and `GraphQueryRequest`) actually correct?**
  _`ConflictMemory` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 29 inferred relationships involving `GeminiClient` (e.g. with `ACOExtractionOutput` and `SituationBrief`) actually correct?**
  _`GeminiClient` has 29 INFERRED edges - model-reasoned connections that need verification._
- **Are the 31 inferred relationships involving `getAdminDbOrThrow()` (e.g. with `run()` and `GET()`) actually correct?**
  _`getAdminDbOrThrow()` has 31 INFERRED edges - model-reasoned connections that need verification._