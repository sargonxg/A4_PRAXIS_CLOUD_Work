import { streamText, stepCountIs, type ModelMessage } from 'ai';
import { z } from 'zod';
import { getModel, getModelForUser } from '@/lib/ai/providers';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { createSituationBoundTools, type SituationToolContext, type ConflictGraphSnapshot } from '@/lib/ai/tools';
import { getConflictGraphAdmin } from '@/lib/firebase/situations';
import { buildSituationContext } from '@/lib/ai/situation-context';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/compat/sample-mode';
import { withAuth } from '@/lib/api/with-auth';
import { withCalibration } from '@/lib/api/with-calibration';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import { localKnowledgeAdapter } from '@/lib/knowledge/context-engine';
import { messageContentSchema, situationContextSchema, aiSettingsSchema } from '@/lib/api/schemas';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { resolveTier } from '@/lib/api/tier';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { InjectableContext } from '@/lib/context/context-injection';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { writeReadAuditEvents } from '@/lib/audit/read-ledger';
import { buildAskPraxisExtensions } from '@/lib/ai/ask-praxis-tools';
import { buildCapsuleEvidencePack, formatEvidencePackPromptBlock } from '@/lib/agent-runtime/evidence-pack';
import { buildTurnCapsule, suggestNextActions, type TurnCapsule } from '@/lib/ai/context-kernel';
import {
  buildAskPraxisAnswerPolicyBlock,
  buildAskPraxisPathFrameworkBlock,
  buildAskPraxisSituationSourcePosture,
  formatAskPraxisCorpusBlock,
  summarizeAskPraxisGraphSnapshot,
} from '@/lib/ai/ask-praxis-context';
import { toLegacyDataStreamResponse } from '@/lib/ai/legacy-data-stream';
import { buildToolPromptContract } from '@/lib/tools/tool-operating-contracts';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import { inferResponseActionKinds } from '@/lib/assistant/response-action-kinds';
import { listAskThreadTurns, persistAskThreadTurn, type AskThreadTurnRecord } from '@/lib/firebase/ask-thread-service';
import { isAskThreadSqlConfigured, listAskThreadTurnsSql, persistAskThreadTurnSql } from '@/lib/agent-runtime/ask-thread-postgres';
import {
  askIntentDirective,
  buildAskConversationMessages,
  classifyAskIntent,
  type AskIntent,
} from '@/lib/ai/ask-conversation';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

type AiSettings = z.infer<typeof aiSettingsSchema>;

export const GET = withAuth(async (request: Request, user) => {
  try {
    const url = new URL(request.url);
    const capsuleId = url.searchParams.get('capsuleId');
    const threadId = url.searchParams.get('threadId');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    if (!capsuleId || !threadId) {
      return Response.json(
        { error: 'capsuleId and threadId are required to resume an Ask PRAXIS thread.' },
        { status: 400 },
      );
    }

    const sqlHistory = await listAskThreadTurnsSql({
      uid: user.uid,
      capsuleId,
      threadId,
      limit: Number.isFinite(limit) ? limit : undefined,
    }).catch((err) => {
      console.warn('[chat.history] SQL thread read failed; falling back to Firestore:', err);
      return null;
    });
    if (sqlHistory?.thread || sqlHistory?.turns.length) {
      return Response.json({ ...sqlHistory, persistence: 'cloud-sql' });
    }

    const history = await listAskThreadTurns({
      uid: user.uid,
      capsuleId,
      threadId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return Response.json({ ...history, persistence: 'firestore' });
  } catch (err) {
    return handleRouteError(err, 'chat.history');
  }
});

export const POST = withCalibration('chat', 'ai_chat', {
  retrievalQuery: (_req, body) => {
    const messages = Array.isArray(body.messages) ? body.messages as Array<{ role?: string; content?: unknown }> : [];
    const last = messages[messages.length - 1];
    if (last && typeof last.content === 'string') return last.content.slice(0, 500);
    return undefined;
  },
  variant: 'streaming',
  blockOnThinContext: false,
})(async (request: Request, _user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system', 'tool']), content: messageContentSchema })),
      conflictContext: z.string().optional(),
      situation: situationContextSchema.optional(),
      currentToolId: z.string().optional(),
      currentPath: z.string().optional(),
      contextPackageId: z.string().optional(),
      capsuleId: z.string().optional(),
      activeContextStack: z.unknown().optional(),
      threadId: z.string().optional(),
      aiSettings: aiSettingsSchema,
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { messages, conflictContext, situation, currentToolId, currentPath, contextPackageId, capsuleId, activeContextStack, threadId, aiSettings } = validation.data;
    const requestSituationId = (situation as Situation | undefined)?.id;
    const prompt = lastUserPrompt(messages);
    const askIntent = classifyAskIntent(prompt);
    let capsuleContext: InjectableContext | null = null;
    let turnCapsule: TurnCapsule | null = null;
    let effectiveSituationId: string | undefined = requestSituationId;
    let retrievedDocumentIds: string[] = [];
    let retrievedSourceIds: string[] = [];
    let evidencePackReceipt: { packId: string; paragraphCount: number; gapCount: number } | null = null;
    const toolInvocations: AskToolInvocationReceipt[] = [];
    const frameworkSteps = buildAskFrameworkStepReceipts(
      _user.calibration.path,
      prompt,
    );

    // --- Sample mode ---
    if (isServerDemoMode()) {
      const lastMessage = messages?.[messages.length - 1];
      const userContent = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
      const inputHash = hashInput({ content: userContent, context: conflictContext });

      if (inputHash) {
        const routeKeys = ['chat', 'scenario', 'escalation', 'talking_points', 'dashboard'];
        for (const routeKey of routeKeys) {
          const cached = getCachedResponse(routeKey, inputHash);
          if (cached) return formatAsStreamResponse(cached);
        }
      }

      const greeting = getCachedResponse('chat', 'greeting');
      if (greeting) return formatAsStreamResponse(greeting);

      return new Response(
        JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Live mode ---
    // Credits + profile gate already handled by withCalibration above.
    turnCapsule = _user.uid
      ? await buildTurnCapsule({
          uid: _user.uid,
          capsuleId,
          contextPackageId,
          activeContextStack: isRecord(activeContextStack) ? activeContextStack as Partial<ActiveContextStackState> : null,
          situationId: requestSituationId,
          query: prompt,
        })
      : null;
    capsuleContext = turnCapsule?.injectableContext ?? null;
    effectiveSituationId = requestSituationId
      ?? capsuleContext?.capsule.coreRefs.situationCoreId
      ?? turnCapsule?.situationCore
      ?? undefined;

    // Build situation-aware system prompt with super-agent capabilities.
    // Prepend the calibrated analyst-profile/situation-frame/output-constraints block.
    let systemPrompt = buildAskPrompt({
      systemPromptBlock: _user.calibration.systemPromptBlock,
      outputConstraints: _user.calibration.outputConstraints,
      capsule: capsuleContext?.capsule ?? null,
      injectableContext: capsuleContext,
    });
    if (turnCapsule) {
      systemPrompt += '\n\n' + turnCapsule.retrievalPlan.promptBlock;
      if (_user.uid && (capsuleContext?.capsule?.capsuleId ?? capsuleId)) {
        const evidencePack = await buildCapsuleEvidencePack({
          ownerUid: _user.uid,
          capsuleId: capsuleContext?.capsule?.capsuleId ?? capsuleId ?? 'default',
          objective: prompt,
          maxParagraphs: 6,
        }).catch((err) => {
          console.warn('[chat] evidence pack build failed (non-fatal):', err);
          return null;
        });
        if (evidencePack) {
          systemPrompt += '\n\n' + formatEvidencePackPromptBlock(evidencePack);
          retrievedDocumentIds = uniqueStrings([
            ...retrievedDocumentIds,
            ...evidencePack.sourcedParagraphs.map((paragraph) => paragraph.documentId),
          ]);
          retrievedSourceIds = uniqueStrings([
            ...retrievedSourceIds,
            ...evidencePack.sourceReceiptIds,
          ]);
          evidencePackReceipt = {
            packId: evidencePack.packId,
            paragraphCount: evidencePack.sourcedParagraphs.length,
            gapCount: evidencePack.openGaps.length,
          };
        }
      }
    }
    systemPrompt += '\n\n' + buildAskPraxisPathFrameworkBlock(_user.calibration.path);

    // Add super-agent instructions with deep platform knowledge and guardrails
    systemPrompt += `\n\n## PRAXIS Super-Agent Mode

You are **Ask PRAXIS** — the central intelligence assistant of the PRAXIS platform by TACITUS. You are not a generic chatbot. You are an elite conflict intelligence tool designed for diplomats, mediators, political affairs officers, and analysts working in peace and security.

### About TACITUS & PRAXIS
TACITUS (Threat Assessment, Conflict Tracking, and Intelligence Utility System) is a technology company building AI-native tools for conflict resolution and international affairs. Founded by Giulio Catanzariti, TACITUS aims to make conflict data computable, actionable, and accessible to the people working to prevent and resolve violent conflict worldwide.

PRAXIS is TACITUS's flagship conflict-intelligence workspace for turning situations, sources, graph primitives, and analyst context into cited assessments, briefings, and decision support. The platform at praxis.tacitus.me provides:
- **${PRAXIS_CANONICAL_TOOLS.length} canonical capabilities** surfaced through the simple app spine: Home, Ask PRAXIS, Library, Memo Studio, Canvas, and Advanced
- **AI-powered research** using Google Cloud/Firebase/Vertex AI, grounded search, source-linked event reporting, humanitarian web reporting, humanitarian data, official multilateral news, economic institution, Wikipedia, and grounded Google Search
- **Conflict Grammar framework** — 14-entity structured ontology (Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives, Institutions, Norms, Resources, Risks, Policies, Grievances)
- **Glasl 9-stage escalation model** for systematic conflict assessment
- **ZOPA/BATNA negotiation analysis** grounded in Fisher/Ury methodology
- **professional diplomatic editing** report generation
- **Document RAG** — uploaded documents are chunked and used to ground AI responses

Learn more at tacitus.me. For questions about pricing, partnerships, or enterprise features, direct users to giulio@tacitus.me.

### Your Capabilities
1. **Inspect the active context** — Use the resolved User Core, Situation Core, capsule, context package, documents, graph snapshot, and active context stack before answering when they are present.
2. **Research with receipts** — Use the situation corpus first, then source/document retrieval and grounded fetches when needed. Thin or missing source coverage must become an evidence gap, not a fact.
3. **Route internal capabilities safely** — Suggest or call only the safe tools available in this request: context resolution, source retrieval, claim/evidence review, graph proposals, memo drafting, tool suggestions, and context health repair.
4. **Generate workspace outputs** — Draft briefings, risk assessments, options memos, handover notes, talking points, and graph-review proposals grounded in the active capsule/context package.
5. **Guide users through the simple app spine** — Route normal users to Ask PRAXIS, Library, Memo Studio, Canvas, or Advanced rather than exposing internal implementation details.
6. **Adapt to the user's role**:
   - **Analyst**: Evidence-based assessments with confidence levels
   - **Mediator**: Process design, party positions, ZOPA/BATNA, CBMs
   - **Observer**: Neutral monitoring, early warning indicators, trend tracking
   - **Advisor**: Policy options, strategic recommendations, risk scenarios
   - **Researcher**: Academic rigor, citations, comparative analysis, methodology
7. **Be proactive** — Suggest related analyses, flag risks, recommend next steps, identify information gaps.

### Professional Guardrails
- **NEVER fabricate facts about real conflicts, real people, or real organizations.** If uncertain, say so and offer to search for current information.
- **Always cite sources** when making factual claims. Use source badges: [grounded search], [humanitarian web reporting], [source-linked event reporting], [humanitarian data], [official multilateral news], [economic institution], [Wikipedia], [Web], [AI Analysis].
- **Maintain strict impartiality** — never advocate for any party, state, or position in a conflict.
- **Use professional diplomatic language standards** — "armed conflict" not "war", "non-State armed group" not "rebels", "Government" not "regime".
- **Flag confidence levels** — HIGH (multiple corroborating sources), MEDIUM (limited sources), LOW (single source or inference).
- **Never provide operational security advice** that could endanger individuals.
- **Never generate content that could be used to incite violence** or target individuals.
- **Protect user privacy** — never share information between situations or users.
- **When discussing sensitive topics** (mass atrocities, sexual violence, terrorism), maintain professional analytical distance while acknowledging human impact.

## ABOUT YOU
You are PRAXIS, the AI assistant built by TACITUS — the conflict intelligence platform for peace and security professionals. You are part of a comprehensive toolkit that includes:
- **Ask PRAXIS**: the simple front door for context inspection, questions, evidence gaps, and tool routing
- **Library**: source/document receipts, attached cores, and context intake
- **Memo Studio**: reviewable drafting from the active User Core, Situation Core, capsule, and context package
- **Canvas**: graph review, stakeholder mapping, scenario structure, and reviewable proposals
- **Advanced**: traces, receipts, administrative review, and specialist/internal capabilities

${buildAskPraxisToolCatalogPrompt()}

When users ask about capabilities, guide them to the right tool. Be a knowledgeable ambassador for the TACITUS platform.

## GUARDRAILS
- You are an analytical tool, not a decision-maker. Always present analysis as assessments, not directives.
- Flag uncertainty explicitly. Use phrases like "assessment indicates", "available evidence suggests", not "this will happen".
- Never fabricate sources, citations, or data. If you don't have information, say so clearly.
- When discussing actors in a conflict, maintain analytical neutrality. Present multiple perspectives.
- Do not provide operational military intelligence, targeting information, or advice that could directly enable violence.
- Remind users that AI analysis should supplement, not replace, human judgment and ground-truth verification.
- Protect personally identifiable information. Do not store or repeat sensitive personal details.
- When discussing sanctions, legal frameworks, or compliance, note that your analysis is for informational purposes and not legal advice.

## DATA INTERACTION
You have access to the user's active situation data. When answering questions:
- Reference specific actors, events, and relationships from the situation context
- Cite risk scores, Glasl stages, and escalation trends when relevant
- Suggest which PRAXIS tools would help the user explore their question further
- If the user asks about something their situation data doesn't cover, suggest they run the relevant tool (e.g., "I'd recommend running the Risk Monitor to get a detailed assessment")`;

    if (situation) {
      const sit = situation as unknown as Situation;
      systemPrompt += '\n\n' + buildSituationContext(sit);
      systemPrompt += '\n\n' + buildAskPraxisSituationSourcePosture(sit);

      // Include source URLs when available so the AI can reference them
      if (sit.sourceUrls && sit.sourceUrls.length > 0) {
        systemPrompt += `\n\n## Reference URLs\nThe user provided these source URLs for this situation:\n${sit.sourceUrls.map((u) => `- ${u}`).join('\n')}\nYou may reference or search these sources for grounding.`;
      }
    } else if (conflictContext) {
      systemPrompt += `\n\n## Active Conflict Context\nThe user is analyzing: **${conflictContext}**\nUse queryConflictGraph to retrieve structured data before answering.`;
    }

    systemPrompt += '\n\n' + buildAskPraxisAnswerPolicyBlock();

    if (currentToolId) {
      systemPrompt += `\n\n${buildToolPromptContract(currentToolId)}`;
      if (currentPath) {
        systemPrompt += `\nCurrent UI path: ${currentPath}`;
      }
    }

    // --- RAG: retrieve the user's situation corpus via the shared retriever ---
    // Replaces the older `buildAskPraxisCorpusContext` cookie-parsing path with
    // the canonical `searchSituationCorpus` (Lane A, 2026-04-26) so Ask PRAXIS
    // and calibrated internal routes reason over the same evidence layers.
    if (effectiveSituationId && !_user.isDemo && _user.uid) {
      try {
        const lastMessage = messages?.[messages.length - 1];
        const query = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
        if (query) {
          const runtimeContext = contextPackageId
            ? await localKnowledgeAdapter.buildContextPack({
                uid: _user.uid,
                contextPackageId,
                situationId: effectiveSituationId,
                query,
              })
            : null;
          if (runtimeContext) {
            systemPrompt += '\n\n' + runtimeContext.promptBlock;
          }
          const corpus = runtimeContext?.corpus ?? await searchSituationCorpus({
            uid: _user.uid,
            situationId: effectiveSituationId,
            query,
            limit: 12,
          });
          retrievedDocumentIds = uniqueStrings(corpus.items
            .filter((item) => item.sourceType === 'documents')
            .map((item) => item.sourceId.split('#')[0] ?? item.sourceId));
          retrievedSourceIds = uniqueStrings(corpus.items
            .filter((item) => item.sourceType !== 'documents')
            .map((item) => item.sourceId));
          if (corpus.items.length > 0) {
            systemPrompt += '\n\n' + formatAskPraxisCorpusBlock(corpus);
          } else {
            systemPrompt += '\n\n' + formatAskPraxisCorpusBlock(corpus);
          }
        }
      } catch (ragErr) {
        console.error('[chat] corpus retrieval failed (non-fatal):', ragErr);
        // Continue without RAG — non-fatal
      }
    }

    // --- Heavy-question routing — keep deliberation inside the simplified spine ---
    systemPrompt += `\n\n## Routing Heavy Questions\nWhen the user asks a strategic, multi-stakeholder question that warrants multi-perspective deliberation, keep the user in the single PRAXIS app at \`/app\`. Recommend creating a memo, mapping actors, reviewing claims, or opening advanced receipts inside that same cockpit instead of presenting separate live pages. If specialist deliberation would help but is not directly exposed, label it as a routed internal capability.`;

    // Build situation-aware tool instances.
    // For real users, pre-fetch the conflict graph from Firestore so that
    // queryConflictGraph returns actual knowledge-graph data rather than demo content.
    let situationCtx: SituationToolContext | null = null;
    let graphSnapshot: ConflictGraphSnapshot | null = null;
    if (situation) {
      const sit = situation as unknown as Situation;
      situationCtx = {
        name: sit.name ?? '',
        description: sit.description ?? '',
        actorSummary: Array.isArray(sit.actors) ? sit.actors.slice(0, 8).join(', ') : '',
        eventSummary: '',
        region: sit.region ?? '',
        glaslStage: typeof sit.glaslStage === 'number' ? sit.glaslStage : undefined,
        riskScore: typeof sit.riskScore === 'number' ? sit.riskScore : undefined,
      };
      if (!_user.isDemo && _user.uid && sit.id) {
        try {
          graphSnapshot = (await getConflictGraphAdmin(_user.uid, sit.id)) as ConflictGraphSnapshot | null;
          // Derive extended context from graph nodes where available
          if (graphSnapshot?.nodes) {
            const byType = (t: string) => graphSnapshot!.nodes
              .filter((n) => n.type === t)
              .map((n) => n.label)
              .slice(0, 8)
              .join('; ');
            situationCtx.interestsSummary = byType('interest');
            situationCtx.claimsSummary = byType('claim');
            situationCtx.constraintsSummary = byType('constraint');
            situationCtx.commitmentsSummary = byType('commitment');
            situationCtx.narrativesSummary = byType('narrative');
          }
        } catch {
          // Non-fatal — tools will degrade gracefully without graph data
        }
      }
    }
    systemPrompt += '\n\n' + summarizeAskPraxisGraphSnapshot(graphSnapshot);
    const baseTools = createSituationBoundTools(situationCtx, graphSnapshot);
    // Ask PRAXIS extensions — writeToTool / groundedSearchFetch /
    // runDeepResearch. Tier-gated; safe to attach for all callers because each
    // tool returns a structured `requiresTier` / `requiresKey` payload when the
    // user lacks the necessary plan or credentials.
    const tier = await resolveTier(_user.uid ?? 'demo-user-001', _user.isDemo === true);
    const askPraxisExt = buildAskPraxisExtensions({
      uid: _user.uid ?? 'demo-user-001',
      situationId: effectiveSituationId,
      profileVersion: _user.calibration.provenance.profileVersion ?? 1,
      tier,
      isDemo: _user.isDemo === true,
    });
    const tools = runAskTools({ ...baseTools, ...askPraxisExt }, toolInvocations);
    const depthDirective = aiSettings?.analysisDepth === 'deep'
      ? '\n\nANALYSIS DEPTH: Provide a more detailed answer with explicit assumptions, alternative interpretations, source/corpus gaps, and practical next actions. Keep it concise enough for an analyst to use.'
      : '\n\nANALYSIS DEPTH: Provide a concise operational answer with the most relevant assumptions and next action.';
    systemPrompt += depthDirective;
    systemPrompt += '\n\n' + askIntentDirective(askIntent);

    // Select model based on user preferences. The default comes from
    // MODEL_MATRIX.json so the app follows the single provider/matrix contract.
    const runtime = selectAskRuntime(aiSettings);
    const model = runtime.model;
    const runtimeReceipt = decorateAskRuntimeReceipt(runtime.receipt, {
      intent: askIntent,
      contextPackageId,
      capsule: capsuleContext?.capsule ?? null,
      turnCapsule,
      corpusSearch: Boolean(effectiveSituationId && !_user.isDemo && _user.uid),
      groundedSearch: false,
      effectiveSituationId: effectiveSituationId ?? null,
      retrievedDocumentIds,
      retrievedSourceIds,
      evidencePackReceipt,
      memoryPersistence: isAskThreadSqlConfigured() ? 'cloud-sql' : 'firestore',
    });
    const askStartedAt = Date.now();
    const persistedHistory = await loadServerAskHistory({
      uid: _user.uid,
      capsuleId: capsuleContext?.capsule?.capsuleId ?? capsuleId ?? null,
      threadId,
    });
    const effectiveMessages = buildAskConversationMessages(
      messages,
      persistedHistory,
    );

    const { provenance } = _user.calibration;
    const result = streamText({
      model,
      system: systemPrompt,
      messages: effectiveMessages as unknown as ModelMessage[],
      tools,
      stopWhen: stepCountIs(15),
      onFinish: async ({ text }) => {
        if (_user.uid && text) {
          if (effectiveSituationId) {
            await saveToolOutput({
              uid: _user.uid,
              situationId: effectiveSituationId,
              toolId: 'chat',
              profileVersion: provenance.profileVersion,
              output: {
                lastMessage: text.slice(0, 4000),
                availableActions: inferResponseActionKinds(text),
                suggestedNextActions: turnCapsule ? suggestNextActions(turnCapsule, 'ask') : [],
                at: new Date().toISOString(),
              },
            }).catch((err) => console.warn('[chat] saveToolOutput failed:', err));
            await persistAskTurn({
              uid: _user.uid,
              situationId: effectiveSituationId,
              threadId,
              prompt,
              capsule: capsuleContext?.capsule ?? null,
              runtime: runtimeReceipt,
              pathId: _user.calibration.path?.id ?? null,
              pathVersion: _user.calibration.path?.version ?? null,
              frameworkSteps,
              toolInvocations,
              output: text,
            }).catch((err) => console.warn('[chat] persistAskTurn failed:', err));
          }
          await persistAskThreadTurn({
            uid: _user.uid,
            situationId: effectiveSituationId,
            capsuleId: capsuleContext?.capsule?.capsuleId ?? capsuleId ?? null,
            threadId,
            prompt,
            capsuleVersion: capsuleContext?.capsule?.version ?? null,
            runtime: runtimeReceipt,
            pathId: _user.calibration.path?.id ?? null,
            pathVersion: _user.calibration.path?.version ?? null,
            frameworkSteps,
            toolInvocations,
            output: text,
          }).catch((err) => console.warn('[chat] persistAskThreadTurn failed:', err));
          await persistAskThreadTurnSql({
            uid: _user.uid,
            situationId: effectiveSituationId,
            capsuleId: capsuleContext?.capsule?.capsuleId ?? capsuleId ?? null,
            threadId,
            prompt,
            capsuleVersion: capsuleContext?.capsule?.version ?? null,
            runtime: runtimeReceipt,
            pathId: _user.calibration.path?.id ?? null,
            pathVersion: _user.calibration.path?.version ?? null,
            frameworkSteps,
            toolInvocations,
            output: text,
          }).catch((err) => console.warn('[chat] persistAskThreadTurnSql failed:', err));
          if (effectiveSituationId) {
            await persistAskReadLedger({
              uid: _user.uid,
              situationId: effectiveSituationId,
              threadId,
              capsule: capsuleContext?.capsule ?? null,
              runtime: runtimeReceipt,
              pathId: _user.calibration.path?.id ?? null,
              frameworkSteps,
              toolInvocations,
              askLatencyMs: Date.now() - askStartedAt,
            }).catch((err) => console.warn('[chat] audit ledger write failed:', err));
          }
        }
      },
    });

    return toLegacyDataStreamResponse(result.textStream);
  } catch (err) {
    return handleRouteError(err, 'chat');
  }
});

interface AskRuntimeReceipt extends Record<string, unknown> {
  provider?: string;
  model?: string;
  analysisDepth?: string;
  selectedAt: string;
  intent?: AskIntent;
  contextPackageId?: string | null;
  capsuleId?: string | null;
  capsuleVersion?: number | null;
  traceId?: string | null;
  tokenPosture?: {
    operation: 'ai_chat';
    charged: boolean;
  };
  contextCores?: {
    userCoreId: string | null;
    situationCoreId: string | null;
    sourceDocumentCoreIds: string[];
    graphCoreId: string | null;
    memoryCoreId: string | null;
    outputCoreIds: string[];
  };
  retrieval?: {
    corpusSearch: boolean;
    groundedSearch: boolean;
    sourceDocumentCount: number;
    activeGapCount: number;
    retrievedDocumentIds: string[];
    retrievedSourceIds: string[];
    planLayerOrder?: string[];
    repositoryDocumentIds?: string[];
    repositorySourceReceiptIds?: string[];
    repositoryChunkCount?: number;
      repositoryFreshness?: string;
      evidencePackId?: string;
      evidenceParagraphCount?: number;
      evidenceGapCount?: number;
  };
  effectiveSituationId?: string | null;
  resolvedCapsules?: Array<{
    capsuleId: string;
    capsuleVersion: number;
    label: string;
    mode: 'praxis_lite';
    parentCapsuleId: string | null;
  }>;
  contextMode?: 'praxis_lite';
  memoryPersistence?: 'cloud-sql' | 'firestore';
}

interface AskToolInvocationReceipt {
  event: 'tool_invocation';
  toolId: string;
  status: 'ok' | 'error';
  latencyMs: number;
  startedAt: string;
  finishedAt: string;
  inputPreview: string;
  outputPreview?: string;
  error?: string;
}

interface AskFrameworkStepReceipt {
  event: 'framework_step';
  pathId: string;
  pathVersion: number;
  stepIndex: number;
  frameworkId: string;
  status: 'planned';
  questionPreview: string;
  createdAt: string;
}

function buildAskPraxisToolCatalogPrompt() {
  const grouped = PRAXIS_CANONICAL_TOOLS.reduce<Record<string, string[]>>((acc, tool) => {
    const status = tool.readiness === 'live'
      ? 'live'
      : tool.readiness === 'routed'
        ? 'routed'
        : 'not directly available';
    acc[status] = acc[status] ?? [];
    acc[status].push(`${tool.name} (${tool.id})`);
    return acc;
  }, {});

  const lines = ['Canonical PRAXIS capability status:'];
  for (const status of ['live', 'routed', 'not directly available']) {
    if (grouped[status]?.length) {
      lines.push(`- ${status}: ${grouped[status].join(', ')}`);
    }
  }
  lines.push('If a capability is routed or not directly available, say that plainly and propose the closest safe surface instead of pretending a hidden page is live.');
  return lines.join('\n');
}

function buildAskPrompt(input: {
  systemPromptBlock: string;
  outputConstraints: {
    language: string;
    redLineClauses: string[];
  };
  capsule: PraxisCapsule | null;
  injectableContext: InjectableContext | null;
}) {
  const langDirective = input.outputConstraints.language !== 'en'
    ? `\n\nRESPOND IN: ${input.outputConstraints.language.toUpperCase()} (analyst's working language).`
    : '';
  const redLineDirective = input.outputConstraints.redLineClauses.length
    ? `\n\nRED LINES — DO NOT:\n${input.outputConstraints.redLineClauses.map((r) => `  - ${r}`).join('\n')}`
    : '';
  const capsuleDirective = input.injectableContext
    ? `\n\n${input.injectableContext.promptBlock}`
    : input.capsule
      ? `\n\nACTIVE CAPSULE: ${input.capsule.capsuleId} v${input.capsule.version}; health ${input.capsule.health.score}; scope ${input.capsule.scope}.`
      : '';
  return `${input.systemPromptBlock}\n\n${DIPLOMATIC_SYSTEM_PROMPT}${langDirective}${redLineDirective}${capsuleDirective}`;
}

function selectAskRuntime(aiSettings: AiSettings) {
  return {
    model: aiSettings ? getModelForUser(aiSettings) : getModel(),
    receipt: {
      provider: aiSettings?.provider,
      model: aiSettings?.model,
      analysisDepth: aiSettings?.analysisDepth ?? 'standard',
      selectedAt: new Date().toISOString(),
    } satisfies AskRuntimeReceipt,
  };
}

function decorateAskRuntimeReceipt(
  receipt: AskRuntimeReceipt,
  input: {
    intent: AskIntent;
    contextPackageId?: string;
    capsule: PraxisCapsule | null;
    turnCapsule: TurnCapsule | null;
    corpusSearch: boolean;
    groundedSearch: boolean;
    effectiveSituationId: string | null;
    retrievedDocumentIds: string[];
    retrievedSourceIds: string[];
    evidencePackReceipt: { packId: string; paragraphCount: number; gapCount: number } | null;
    memoryPersistence: 'cloud-sql' | 'firestore';
  },
): AskRuntimeReceipt {
  const resolvedCapsule = input.capsule ?? input.turnCapsule?.injectableContext.capsule ?? null;
  return {
    ...receipt,
    intent: input.intent,
    contextPackageId: input.contextPackageId ?? null,
    capsuleId: resolvedCapsule?.capsuleId ?? input.turnCapsule?.capsuleId ?? null,
    capsuleVersion: resolvedCapsule?.version ?? input.turnCapsule?.capsuleVersion ?? null,
    traceId: input.turnCapsule?.traceId ?? null,
    effectiveSituationId: input.effectiveSituationId,
    contextMode: 'praxis_lite',
    memoryPersistence: input.memoryPersistence,
    resolvedCapsules: resolvedCapsule
      ? [{
          capsuleId: resolvedCapsule.capsuleId,
          capsuleVersion: resolvedCapsule.version,
          label: resolvedCapsule.label,
          mode: 'praxis_lite',
          parentCapsuleId: resolvedCapsule.parentCapsuleId,
        }]
      : [],
    tokenPosture: {
      operation: 'ai_chat',
      charged: true,
    },
    contextCores: {
      userCoreId: input.turnCapsule?.userCore ?? null,
      situationCoreId: input.turnCapsule?.situationCore ?? null,
      sourceDocumentCoreIds: input.turnCapsule?.sourceDocumentCore ?? [],
      graphCoreId: input.turnCapsule?.graphCore ?? null,
      memoryCoreId: input.turnCapsule?.memoryCore ?? null,
      outputCoreIds: input.turnCapsule?.outputCore ?? [],
    },
    retrieval: {
      corpusSearch: input.corpusSearch,
      groundedSearch: input.groundedSearch,
      sourceDocumentCount: input.turnCapsule?.sourceDocumentCore.length ?? 0,
      activeGapCount: input.turnCapsule?.activeGaps.length ?? 0,
      retrievedDocumentIds: input.retrievedDocumentIds,
      retrievedSourceIds: input.retrievedSourceIds,
      planLayerOrder: input.turnCapsule?.retrievalPlan.layers.map((layer) => layer.id),
      repositoryDocumentIds: input.turnCapsule?.retrievalPlan.repository.documentIds,
      repositorySourceReceiptIds: input.turnCapsule?.retrievalPlan.repository.sourceReceiptIds,
      repositoryChunkCount: input.turnCapsule?.retrievalPlan.repository.chunkCount,
      repositoryFreshness: input.turnCapsule?.retrievalPlan.repository.freshness,
      evidencePackId: input.evidencePackReceipt?.packId,
      evidenceParagraphCount: input.evidencePackReceipt?.paragraphCount,
      evidenceGapCount: input.evidencePackReceipt?.gapCount,
    },
  };
}

async function loadServerAskHistory(input: {
  uid?: string | null;
  capsuleId?: string | null;
  threadId?: string | null;
}): Promise<AskThreadTurnRecord[]> {
  const capsuleId = input.capsuleId?.trim();
  const threadId = input.threadId?.trim();
  if (!input.uid || !capsuleId || !threadId) return [];

  const sqlHistory = await listAskThreadTurnsSql({
    uid: input.uid,
    capsuleId,
    threadId,
    limit: 8,
  }).catch((err) => {
    console.warn('[chat.history] SQL continuity read failed; falling back to Firestore:', err);
    return null;
  });
  if (sqlHistory?.turns.length) return sqlHistory.turns;

  const history = await listAskThreadTurns({
    uid: input.uid,
    capsuleId,
    threadId,
    limit: 8,
  }).catch((err) => {
    console.warn('[chat.history] Firestore continuity read failed:', err);
    return null;
  });
  return history?.turns ?? [];
}

function runAskTools<TTools extends Record<string, unknown>>(
  tools: TTools,
  receipts: AskToolInvocationReceipt[],
): TTools {
  return Object.fromEntries(
    Object.entries(tools).map(([toolId, toolDef]) => {
      if (!toolDef || typeof toolDef !== 'object' || !('execute' in toolDef)) {
        return [toolId, toolDef];
      }
      const executable = toolDef as { execute?: (input: unknown, options?: unknown) => Promise<unknown> | unknown };
      if (typeof executable.execute !== 'function') return [toolId, toolDef];
      const originalExecute = executable.execute;
      return [toolId, {
        ...toolDef,
        execute: async (input: unknown, options?: unknown) => {
          const startedAt = new Date();
          try {
            const output = await originalExecute(input, options);
            const finishedAt = new Date();
            receipts.push({
              event: 'tool_invocation',
              toolId,
              status: 'ok',
              latencyMs: finishedAt.getTime() - startedAt.getTime(),
              startedAt: startedAt.toISOString(),
              finishedAt: finishedAt.toISOString(),
              inputPreview: previewJson(input),
              outputPreview: previewJson(output),
            });
            return output;
          } catch (err) {
            const finishedAt = new Date();
            receipts.push({
              event: 'tool_invocation',
              toolId,
              status: 'error',
              latencyMs: finishedAt.getTime() - startedAt.getTime(),
              startedAt: startedAt.toISOString(),
              finishedAt: finishedAt.toISOString(),
              inputPreview: previewJson(input),
              error: err instanceof Error ? err.message : String(err),
            });
            throw err;
          }
        },
      }];
    }),
  ) as TTools;
}

async function persistAskTurn(input: {
  uid: string;
  situationId: string;
  threadId?: string;
  prompt: string;
  capsule: PraxisCapsule | null;
  runtime: AskRuntimeReceipt;
  pathId: string | null;
  pathVersion: number | null;
  frameworkSteps: AskFrameworkStepReceipt[];
  toolInvocations: AskToolInvocationReceipt[];
  output: string;
}) {
  const db = getAdminDbOrThrow();
  const safeThreadId = cleanDocId(input.threadId, 'default');
  const turnRef = db
    .collection('users').doc(input.uid)
    .collection('situations').doc(cleanDocId(input.situationId, 'workspace'))
    .collection('threads').doc(safeThreadId)
    .collection('turns').doc(`turn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

  await turnRef.set({
    prompt: input.prompt,
    capsuleId: input.capsule?.capsuleId ?? null,
    capsuleVersion: input.capsule?.version ?? null,
    runtime: input.runtime,
    pathId: input.pathId,
    pathVersion: input.pathVersion,
    frameworkSteps: input.frameworkSteps,
    toolInvocations: input.toolInvocations,
    output: input.output,
    ts: new Date().toISOString(),
  });
}

async function persistAskReadLedger(input: {
  uid: string;
  situationId: string;
  threadId?: string;
  capsule: PraxisCapsule | null;
  runtime: AskRuntimeReceipt;
  pathId: string | null;
  frameworkSteps: AskFrameworkStepReceipt[];
  toolInvocations: AskToolInvocationReceipt[];
  askLatencyMs: number;
}) {
  const model = input.runtime.model ?? input.runtime.provider ?? 'default';
  const costClass = input.runtime.analysisDepth ?? 'standard';
  const retrievedSourceIds = input.runtime.retrieval
    ? uniqueStrings([
        ...input.runtime.retrieval.retrievedSourceIds,
        ...input.runtime.retrieval.retrievedDocumentIds.map((id) => `document:${id}`),
      ])
    : [];
  await writeReadAuditEvents([
    {
      uid: input.uid,
      situationId: input.situationId,
      capsuleId: input.capsule?.capsuleId ?? null,
      threadId: input.threadId ?? null,
      toolId: 'ask-praxis',
      sourceIds: retrievedSourceIds,
      model,
      latencyMs: input.askLatencyMs,
      status: 'ok',
      costClass,
    },
    ...input.frameworkSteps.map((step) => ({
      uid: input.uid,
      situationId: input.situationId,
      capsuleId: input.capsule?.capsuleId ?? null,
      threadId: input.threadId ?? null,
      toolId: `ask-praxis:${step.frameworkId}`,
      sourceIds: [step.pathId],
      model,
      latencyMs: null,
      status: 'ok' as const,
      costClass: `framework-step:${input.pathId ?? 'baseline'}`,
    })),
    ...input.toolInvocations.map((tool) => ({
      uid: input.uid,
      situationId: input.situationId,
      capsuleId: input.capsule?.capsuleId ?? null,
      threadId: input.threadId ?? null,
      toolId: tool.toolId,
      sourceIds: [],
      model,
      latencyMs: tool.latencyMs,
      status: tool.status,
      costClass,
    })),
  ]);
}

function buildAskFrameworkStepReceipts(
  path: { id: string; version: number; frameworkPath: string[] } | null | undefined,
  question: string,
): AskFrameworkStepReceipt[] {
  if (!path?.frameworkPath?.length) return [];
  const createdAt = new Date().toISOString();
  return path.frameworkPath.map((frameworkId, index) => ({
    event: 'framework_step',
    pathId: path.id,
    pathVersion: path.version,
    stepIndex: index + 1,
    frameworkId,
    status: 'planned',
    questionPreview: question.slice(0, 800),
    createdAt,
  }));
}

function lastUserPrompt(messages: Array<{ role: string; content: unknown }>): string {
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  if (!lastUser) return '';
  return typeof lastUser.content === 'string' ? lastUser.content : previewJson(lastUser.content);
}

function cleanDocId(value: string | undefined, fallback: string): string {
  const cleaned = value?.trim().replace(/[/?#[\]]/g, '-');
  return cleaned || fallback;
}

function previewJson(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, 1200);
  } catch {
    return String(value).slice(0, 1200);
  }
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 50);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
