import { streamText, stepCountIs, type ModelMessage } from 'ai';
import { z } from 'zod';
import { getModel, getModelForUser } from '@/lib/ai/providers';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { createSituationBoundTools, type SituationToolContext, type ConflictGraphSnapshot } from '@/lib/ai/tools';
import { getConflictGraphAdmin } from '@/lib/firebase/situations';
import { buildSituationContext } from '@/lib/ai/situation-context';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { withCalibration } from '@/lib/api/with-calibration';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import { localKnowledgeAdapter } from '@/lib/knowledge/context-engine';
import { messageContentSchema, situationContextSchema, aiSettingsSchema } from '@/lib/api/schemas';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { resolveTier } from '@/lib/api/tier';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { resolveInjectableContext, type InjectableContext } from '@/lib/context/context-injection';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { writeReadAuditEvents } from '@/lib/audit/read-ledger';
import { buildAskPraxisExtensions } from '@/lib/ai/ask-praxis-tools';
import {
  buildAskPraxisAnswerPolicyBlock,
  buildAskPraxisPathFrameworkBlock,
  buildAskPraxisSituationSourcePosture,
  formatAskPraxisCorpusBlock,
  summarizeAskPraxisGraphSnapshot,
} from '@/lib/ai/ask-praxis-context';
import { toLegacyDataStreamResponse } from '@/lib/ai/legacy-data-stream';
import { buildToolPromptContract } from '@/lib/tools/tool-operating-contracts';
import { inferResponseActionKinds } from '@/lib/assistant/response-action-kinds';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

type AiSettings = z.infer<typeof aiSettingsSchema>;

export const POST = withCalibration('chat', 'ai_chat', {
  retrievalQuery: (_req, body) => {
    const messages = Array.isArray(body.messages) ? body.messages as Array<{ role?: string; content?: unknown }> : [];
    const last = messages[messages.length - 1];
    if (last && typeof last.content === 'string') return last.content.slice(0, 500);
    return undefined;
  },
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
    const sitId = (situation as Situation | undefined)?.id;
    let capsuleContext: InjectableContext | null = null;
    const toolInvocations: AskToolInvocationReceipt[] = [];
    const frameworkSteps = buildAskFrameworkStepReceipts(
      _user.calibration.path,
      lastUserPrompt(messages),
    );

    // --- Demo mode ---
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
    capsuleContext = _user.uid
      ? await resolveInjectableContext({
          uid: _user.uid,
          capsuleId,
          contextPackageId,
          activeContextStack: isRecord(activeContextStack) ? activeContextStack as Partial<ActiveContextStackState> : null,
          situationId: sitId,
        })
      : null;

    // Build situation-aware system prompt with super-agent capabilities.
    // Prepend the calibrated analyst-profile/situation-frame/output-constraints block.
    let systemPrompt = buildAskPrompt({
      systemPromptBlock: _user.calibration.systemPromptBlock,
      outputConstraints: _user.calibration.outputConstraints,
      capsule: capsuleContext?.capsule ?? null,
      injectableContext: capsuleContext,
    });
    systemPrompt += '\n\n' + buildAskPraxisPathFrameworkBlock(_user.calibration.path);

    // Add super-agent instructions with deep platform knowledge and guardrails
    systemPrompt += `\n\n## PRAXIS Super-Agent Mode

You are **Ask PRAXIS** — the central intelligence assistant of the PRAXIS platform by TACITUS. You are not a generic chatbot. You are an elite conflict intelligence tool designed for diplomats, mediators, political affairs officers, and analysts working in peace and security.

### About TACITUS & PRAXIS
TACITUS (Threat Assessment, Conflict Tracking, and Intelligence Utility System) is a technology company building AI-native tools for conflict resolution and international affairs. Founded by Giulio Catanzariti, TACITUS aims to make conflict data computable, actionable, and accessible to the people working to prevent and resolve violent conflict worldwide.

PRAXIS is TACITUS's flagship conflict-intelligence workspace for turning situations, sources, graph primitives, and analyst context into cited assessments, briefings, and decision support. The platform at praxis.tacitus.me provides:
- **10 consolidated primary tools** for context building, research, documents, graph operations, conflict visualization, timeline signals, actor mapping, Ask PRAXIS, and briefing, with specialist labs grouped behind them
- **AI-powered research** using Google Cloud/Firebase/Vertex AI, GDELT, UCDP, ReliefWeb, HDX, UN News, World Bank, Wikipedia, and grounded Google Search
- **Conflict Grammar framework** — 14-entity structured ontology (Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives, Institutions, Norms, Resources, Risks, Policies, Grievances)
- **Glasl 9-stage escalation model** for systematic conflict assessment
- **ZOPA/BATNA negotiation analysis** grounded in Fisher/Ury methodology
- **professional diplomatic editing** report generation
- **Document RAG** — uploaded documents are chunked and used to ground AI responses

Learn more at tacitus.me. For questions about pricing, partnerships, or enterprise features, direct users to giulio@tacitus.me.

### Your Capabilities
1. **Research extensively** — Use webSearch to find current information. Start with stable background sources such as Wikipedia where useful, then triangulate recent developments with UN sources, ReliefWeb, GDELT, UCDP, World Bank, reputable news, and grounded Google Search results.
2. **Answer ANY question** — About the situation, the platform, TACITUS, conflict resolution methodology, international law, humanitarian frameworks, or any related topic.
3. **Generate content for any tool** — Briefings, risk assessments, scenarios, talking points, actor profiles, treaty analysis, sanctions scans, mediation frameworks.
4. **Guide users through the platform** — Explain what each tool does, how to use it, and when to use it. Help users get the most from PRAXIS.
5. **Adapt to the user's role**:
   - **Analyst**: Evidence-based assessments with confidence levels
   - **Mediator**: Process design, party positions, ZOPA/BATNA, CBMs
   - **Observer**: Neutral monitoring, early warning indicators, trend tracking
   - **Advisor**: Policy options, strategic recommendations, risk scenarios
   - **Researcher**: Academic rigor, citations, comparative analysis, methodology
6. **Be proactive** — Suggest related analyses, flag risks, recommend next steps, identify information gaps.

### Professional Guardrails
- **NEVER fabricate facts about real conflicts, real people, or real organizations.** If uncertain, say so and offer to search for current information.
- **Always cite sources** when making factual claims. Use source badges: [GDELT], [ReliefWeb], [UCDP], [HDX], [UN News], [World Bank], [Wikipedia], [Web], [AI Analysis].
- **Maintain strict impartiality** — never advocate for any party, state, or position in a conflict.
- **Use professional diplomatic language standards** — "armed conflict" not "war", "non-State armed group" not "rebels", "Government" not "regime".
- **Flag confidence levels** — HIGH (multiple corroborating sources), MEDIUM (limited sources), LOW (single source or inference).
- **Never provide operational security advice** that could endanger individuals.
- **Never generate content that could be used to incite violence** or target individuals.
- **Protect user privacy** — never share information between situations or users.
- **When discussing sensitive topics** (mass atrocities, sexual violence, terrorism), maintain professional analytical distance while acknowledging human impact.

## ABOUT YOU
You are PRAXIS, the AI assistant built by TACITUS — the conflict intelligence platform for peace and security professionals. You are part of a comprehensive toolkit that includes:
- **Dashboard**: Situation overview with risk scores and Glasl escalation stages
- **Conflict Graph**: Knowledge graph of actors, events, claims, and relationships
- **Actor Profiles**: Deep intelligence profiles with Fisher/Ury framework analysis
- **Risk Monitor**: INFORM Risk Index-based assessment with regional breakdowns
- **Early Warning**: Glasl escalation model tracking with de-escalation opportunities
- **ARGUS Intelligence**: Structured web intelligence with source triangulation and confidence scoring
- **Media Compass**: Media source mapping by bias and reliability
- **Report Studio**: Automated report generation with export to DOCX/PDF
- **Scenario Planner**: Scenario modeling and strategic planning
- **Negotiation Prep**: ZOPA/BATNA analysis with Fisher/Ury methodology

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
    // the canonical `searchSituationCorpus` (Lane A, 2026-04-26) so Ask PRAXIS,
    // Brainstorming Table, Humanitarian, and any future agent reason over the
    // same evidence layers ranked the same way.
    if (situation && !_user.isDemo && _user.uid && situation.id) {
      try {
        const lastMessage = messages?.[messages.length - 1];
        const query = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
        if (query) {
          const runtimeContext = contextPackageId
            ? await localKnowledgeAdapter.buildContextPack({
                uid: _user.uid,
                contextPackageId,
                situationId: situation.id,
                query,
              })
            : null;
          if (runtimeContext) {
            systemPrompt += '\n\n' + runtimeContext.promptBlock;
          }
          const corpus = runtimeContext?.corpus ?? await searchSituationCorpus({
            uid: _user.uid,
            situationId: situation.id,
            query,
            limit: 12,
          });
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

    // --- Heavy-question routing — point users at the Brainstorming Table ---
    systemPrompt += `\n\n## Routing Heavy Questions\nWhen the user asks a strategic, multi-stakeholder question that warrants multi-perspective deliberation (e.g. "should I attribute publicly", "is a pause better than a statement", "how does my mediation step play vs the multilateral forum track"), recommend running the **Brainstorming Table** at \`/app/brainstorming-table\`. That tool convenes mediator, humanitarian, legal, media, security, and red-team personas over the same situation corpus and produces a structured options memo with consensus, divergences, and decision tradeoffs.`;

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
      situationId: (situation as Situation | undefined)?.id,
      profileVersion: _user.calibration.provenance.profileVersion ?? 1,
      tier,
      isDemo: _user.isDemo === true,
    });
    const tools = runAskTools({ ...baseTools, ...askPraxisExt }, toolInvocations);
    const depthDirective = aiSettings?.analysisDepth === 'deep'
      ? '\n\nANALYSIS DEPTH: Provide a more detailed answer with explicit assumptions, alternative interpretations, source/corpus gaps, and practical next actions. Keep it concise enough for an analyst to use.'
      : '\n\nANALYSIS DEPTH: Provide a concise operational answer with the most relevant assumptions and next action.';
    systemPrompt += depthDirective;

    // Select model based on user preferences.
    // Default: gemini-3-flash for fast conversational chat. Users can override
    // to Pro or Claude via aiSettings. Analytical tools use getProModel() instead.
    const runtime = selectAskRuntime(aiSettings);
    const model = runtime.model;
    const askStartedAt = Date.now();

    const { provenance } = _user.calibration;
    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages as unknown as ModelMessage[],
      tools,
      stopWhen: stepCountIs(15),
      onFinish: async ({ text }) => {
        if (sitId && _user.uid && text) {
          await saveToolOutput({
            uid: _user.uid,
            situationId: sitId,
            toolId: 'chat',
            profileVersion: provenance.profileVersion,
            output: {
              lastMessage: text.slice(0, 4000),
              availableActions: inferResponseActionKinds(text),
              at: new Date().toISOString(),
            },
          }).catch((err) => console.warn('[chat] saveToolOutput failed:', err));
          await persistAskTurn({
            uid: _user.uid,
            situationId: sitId,
            threadId,
            prompt: lastUserPrompt(messages),
            capsule: capsuleContext?.capsule ?? null,
            runtime: runtime.receipt,
            pathId: _user.calibration.path?.id ?? null,
            pathVersion: _user.calibration.path?.version ?? null,
            frameworkSteps,
            toolInvocations,
            output: text,
          }).catch((err) => console.warn('[chat] persistAskTurn failed:', err));
          await persistAskReadLedger({
            uid: _user.uid,
            situationId: sitId,
            threadId,
            capsule: capsuleContext?.capsule ?? null,
            runtime: runtime.receipt,
            pathId: _user.calibration.path?.id ?? null,
            frameworkSteps,
            toolInvocations,
            askLatencyMs: Date.now() - askStartedAt,
          }).catch((err) => console.warn('[chat] audit ledger write failed:', err));
        }
      },
    });

    return toLegacyDataStreamResponse(result.textStream);
  } catch (err) {
    return handleRouteError(err, 'chat');
  }
});

interface AskRuntimeReceipt {
  provider?: string;
  model?: string;
  analysisDepth?: string;
  selectedAt: string;
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
  await writeReadAuditEvents([
    {
      uid: input.uid,
      situationId: input.situationId,
      capsuleId: input.capsule?.capsuleId ?? null,
      threadId: input.threadId ?? null,
      toolId: 'ask-praxis',
      sourceIds: [],
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
