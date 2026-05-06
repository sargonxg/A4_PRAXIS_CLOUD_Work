import { tool, generateText, Output } from 'ai';
import { z } from 'zod';
import { DEMO_CONFLICT } from '@/lib/constants/demo-conflict';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { findMediaOutlet } from '@/lib/constants/media-database';
import { executeWebResearch, type WebResearchResult } from '@/lib/ai/web-research';
import { searchWeb } from '@/lib/ai/grounded-research';
import { getModel, getProModel } from '@/lib/ai/providers';

// ---------------------------------------------------------------------------
// Shared helpers — truncation and timeout
// ---------------------------------------------------------------------------

function truncate(s: string, max = 12000): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + '\n[...truncated]';
}

const TOOL_TIMEOUT_MS = 30_000;

function timeoutSignal(): AbortSignal {
  return AbortSignal.timeout(TOOL_TIMEOUT_MS);
}

// ============================================================================
// Tool 1: webSearch
// Google Search via Gemini grounding is always available.
// Falls back gracefully — never blocks on missing keys.
// ============================================================================

export const webSearch = tool({
  description:
    'Search the web for current news and reports about a conflict topic. Uses grounded Google Search and returns results with titles, snippets, sources, and reliability scores.',
  inputSchema: z.object({
    query: z.string().describe('The search query to execute'),
    region: z.string().optional().describe('Geographic region to focus the search on'),
    timeRange: z
      .enum(['day', 'week', 'month', 'year', 'all'])
      .optional()
      .describe('Time range filter for search results'),
    uid: z.string().optional().describe('User ID to load API keys for premium providers'),
    favoriteSources: z.array(z.string()).optional().describe('User preferred sources to focus on'),
  }),
  execute: async ({ query, region, timeRange, uid, favoriteSources }) => {
    try {
      // Use the unified web research client (Google Search first, then premium in parallel)
      const webResults: WebResearchResult[] = await executeWebResearch(
        query,
        region ?? '',
        uid ?? 'system',
        {
          maxResults: 8,
          region,
          timeRange,
          favoriteSources: favoriteSources ?? [],
        }
      );

      if (webResults.length === 0) {
        return {
          results: [],
          query,
          providers: ['google-search'],
          analysisNote: 'No web results returned. Google Search found no matches for this query.',
          _generatedAt: new Date().toISOString(),
        };
      }

      // Map unified results
      const providers = [...new Set(webResults.map((r) => r.provider))];
      const results = webResults.map((r) => ({
        title: r.title,
        snippet: r.snippet || r.content?.slice(0, 300) || '',
        source: r.source,
        publishedDate: r.publishedDate || new Date().toISOString().split('T')[0],
        url: r.url,
        reliabilityScore: r.reliabilityScore,
            provider: r.provider,
          }));

      return {
        results,
        query,
        providers,
        analysisNote: `Found ${results.length} web sources via ${providers.join(', ')}. Results sorted by reliability.`,
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[webSearch]', err instanceof Error ? err.message : err);
      return {
        error: true,
        message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)),
        results: [],
        query,
        providers: [],
        analysisNote: 'Web search failed. Check Gemini grounding configuration.',
        _generatedAt: new Date().toISOString(),
      };
    }
  },
});

function extractHostname(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  } catch {
    return 'Unknown';
  }
}

function scoreUrlReliability(url: string): number {
  const lowerUrl = url.toLowerCase();
  if (/reuters|apnews|afp/.test(lowerUrl)) return 0.95;
  if (/bbc|guardian|nytimes|washingtonpost|ft\.com|aljazeera/.test(lowerUrl)) return 0.85;
  if (/crisisgroup|icg|ucdp|sipri|iiss/.test(lowerUrl)) return 0.88;
  if (/un\.org|osce|europa\.eu/.test(lowerUrl)) return 0.90;
  if (/foreignpolicy|economist|foreignaffairs/.test(lowerUrl)) return 0.82;
  return 0.70;
}

// ============================================================================
// Tool 2: analyzeDocument
// Real entity extraction using Gemini with Conflict Grammar framework
// ============================================================================

export const analyzeDocument = tool({
  description:
    'Extract Conflict Grammar entities from text — actors, claims, interests, events, narratives, constraints, leverage, commitments. Returns structured data with confidence scores and source passages.',
  inputSchema: z.object({
    text: z.string().describe('The text content to analyze'),
    extractionTargets: z
      .array(
        z.enum([
          'actors',
          'claims',
          'interests',
          'constraints',
          'leverage',
          'commitments',
          'events',
          'narratives',
        ])
      )
      .describe('Types of Conflict Grammar entities to extract'),
    conflictContext: z.string().optional().describe('Known conflict context to improve extraction accuracy'),
  }),
  execute: async ({ text, extractionTargets, conflictContext }) => {
    try {
      const { output } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          entities: z.array(
            z.object({
              type: z.enum([
                'actor',
                'claim',
                'interest',
                'constraint',
                'leverage',
                'commitment',
                'event',
                'narrative',
              ]),
              name: z.string(),
              description: z.string(),
              sourcePassage: z
                .string()
                .describe('The exact passage from the text this entity was extracted from'),
              confidence: z.number().min(0).max(1),
              attributes: z.record(z.string(), z.string()).optional(),
            })
          ),
          summary: z.string(),
          informationGaps: z.array(z.string()),
        }) }),
        prompt: `You are a TACITUS Conflict Grammar entity extraction engine. Analyze this text and extract structured conflict entities.

CONFLICT GRAMMAR FRAMEWORK:
- Actor: Any entity with agency (states, armed groups, IOs, individuals, civil society)
- Claim: A formal or informal assertion of rights, territory, status, or legitimacy
- Interest: Underlying motivations — distinguish STATED vs UNSTATED vs INFERRED
- Constraint: Factors limiting an actor's freedom of action (legal, financial, domestic political, military)
- Leverage: Sources of power one actor holds over another (economic, military, diplomatic, informational)
- Commitment: Promises, obligations, agreements between actors (formal or informal)
- Event: Significant occurrences with date, actors involved, and escalatory direction
- Narrative: How actors frame the conflict for specific audiences

Extract: ${extractionTargets.join(', ')}
${conflictContext ? `Known conflict context: ${truncate(conflictContext)}` : ''}

TEXT TO ANALYZE:
${truncate(text)}

For each entity, include the exact source passage it was extracted from. Rate confidence 0-1 based on how clearly the text supports the extraction. Also identify information gaps — what an analyst would want to know that this text does not provide.`,
      });
      return { ...output, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'analyzeDocument', entities: [], summary: '', informationGaps: [], _generatedAt: new Date().toISOString() };
      }
      console.error('[analyzeDocument]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), entities: [], summary: '', informationGaps: [], _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 3: queryConflictGraph
// Returns REAL data from the PRAXIS demo conflict (Nordalia Crisis)
// ============================================================================

export const queryConflictGraph = tool({
  description:
    'Query the PRAXIS conflict knowledge graph for actors, events, claims, interests, leverage, constraints, commitments, and narratives. Always use this when asked about specific entities in a monitored conflict.',
  inputSchema: z.object({
    conflictId: z.string().describe('The ID of the conflict graph to query'),
    entityType: z
      .enum([
        'actor',
        'event',
        'claim',
        'interest',
        'constraint',
        'leverage',
        'commitment',
        'narrative',
        'relationship',
        'all',
      ])
      .describe('Type of entity to retrieve'),
    actorId: z.string().optional().describe('Filter results to entities involving this actor'),
    query: z.string().optional().describe('Natural language query to guide result filtering'),
  }),
  execute: async ({ conflictId, entityType, actorId, query }) => {
    try {
      // In production: fetch conflict from database by conflictId.
      // For demo, use the pre-loaded Nordalia Crisis dataset.
      const conflict = DEMO_CONFLICT;

      let results: unknown[] = [];

      switch (entityType) {
        case 'actor':
          results = conflict.actors;
          break;
        case 'event':
          results = (conflict as unknown as Record<string, unknown[]>).events || [];
          break;
        case 'relationship':
          results = (conflict as unknown as Record<string, unknown[]>).relationships || [];
          break;
        case 'all':
          results = [
            ...conflict.actors.map((a) => ({ ...a, _entityType: 'actor' })),
            ...((conflict as unknown as Record<string, unknown[]>).events || []).map((e) => ({
              ...(e as object),
              _entityType: 'event',
            })),
            ...((conflict as unknown as Record<string, unknown[]>).claims || []).map((c) => ({
              ...(c as object),
              _entityType: 'claim',
            })),
            ...((conflict as unknown as Record<string, unknown[]>).interests || []).map((i) => ({
              ...(i as object),
              _entityType: 'interest',
            })),
            ...((conflict as unknown as Record<string, unknown[]>).commitments || []).map((c) => ({
              ...(c as object),
              _entityType: 'commitment',
            })),
            ...((conflict as unknown as Record<string, unknown[]>).leverage || []).map((l) => ({
              ...(l as object),
              _entityType: 'leverage',
            })),
            ...((conflict as unknown as Record<string, unknown[]>).constraints || []).map((c) => ({
              ...(c as object),
              _entityType: 'constraint',
            })),
            ...((conflict as unknown as Record<string, unknown[]>).narratives || []).map((n) => ({
              ...(n as object),
              _entityType: 'narrative',
            })),
          ];
          break;
        default: {
          const key = entityType + 's';
          const conflictData = conflict as Record<string, unknown>;
          results = (conflictData[key] as unknown[] | undefined) ?? (conflictData[entityType] as unknown[] | undefined) ?? [];
        }
      }

      // Filter by actor if specified
      if (actorId) {
        results = results.filter((e) => {
          const entity = e as Record<string, unknown>;
          return (
            entity.id === actorId ||
            entity.actorId === actorId ||
            entity.source === actorId ||
            entity.target === actorId ||
            (Array.isArray(entity.actorIds) && entity.actorIds.includes(actorId))
          );
        });
      }

      return {
        conflictId,
        conflictName: conflict.name,
        entityType,
        query: query ?? null,
        results: results.slice(0, 20), // Limit for context window
        totalCount: results.length,
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[queryConflictGraph]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), conflictId, conflictName: '', entityType, query: query ?? null, results: [], totalCount: 0, _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 4: draftSection
// AI-generated diplomatic report sections grounded in real conflict data
// ============================================================================

export const draftSection = tool({
  description:
    'Draft a section of a diplomatic report using data from the conflict knowledge graph. Produces UN-standard language with proper hedging, sourcing, and formatting.',
  inputSchema: z.object({
    sectionTitle: z.string().describe('The title/heading of the section to draft'),
    templateType: z
      .enum([
        'sg_report',
        'sc_briefing',
        'political_cable',
        'mediation_brief',
        'early_warning',
        'options_paper',
        'sitrep',
        'ceasefire_report',
      ])
      .describe('The report template type'),
    conflictId: z.string().describe('Conflict ID to ground the section in real knowledge graph data'),
    instructions: z.string().optional().describe('Specific drafting instructions or focus areas'),
    wordLimit: z.number().optional().describe('Target word count (default: 300)'),
    tone: z
      .enum(['formal', 'analytical', 'urgent', 'cautious', 'balanced'])
      .optional()
      .describe('Desired tone for the section'),
  }),
  execute: async ({ sectionTitle, templateType, conflictId: _conflictId, instructions, wordLimit, tone }) => {
    try {
      // Load real conflict data for grounding
      const conflict = DEMO_CONFLICT;
      const actorSummary = conflict.actors
        .map((a) => `${a.name} (${a.type}): ${a.description.slice(0, 120)}...`)
        .join('\n');
      const conflictData = conflict as Record<string, unknown>;
      const events = (conflictData.events as Array<Record<string, unknown>> | undefined) ?? [];
      const recentEvents = events
        .slice(-5)
        .map((e) => `${e.date} [${e.type}]: ${String(e.description ?? '').slice(0, 120)}...`)
        .join('\n');

      const { text } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        system: DIPLOMATIC_SYSTEM_PROMPT,
        prompt: `Draft the "${sectionTitle}" section for a ${templateType.replace(/_/g, ' ')} report.

CONFLICT: ${conflict.name}
DESCRIPTION: ${truncate(conflict.description)}

KEY ACTORS:
${actorSummary}

RECENT EVENTS:
${recentEvents}

${instructions ? `SPECIAL INSTRUCTIONS: ${truncate(instructions)}` : ''}
TONE: ${tone || 'formal diplomatic'}
TARGET LENGTH: ~${wordLimit || 300} words

Requirements:
- Use standard UN formatting and language conventions
- Include bracketed source references where appropriate: [Source: UNMN SITREP, Feb 2026]
- Use calibrated confidence language: "reports indicate", "it is assessed that", "credible sources suggest", "it remains unclear"
- Maintain strict impartiality — present all parties' perspectives
- Structure with clear topic sentences and analytical depth
- This must read as a genuine diplomatic document, not a summary or bullet list
- For SG reports/SC briefings: use third-person UN voice
- For political cables: use analytical first-person mission voice
- For sitrep: lead with most significant development`,
      });

      return {
        sectionTitle,
        content: text,
        wordCount: text.split(/\s+/).length,
        templateType,
        status: 'draft' as const,
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'draftSection', sectionTitle, content: '', wordCount: 0, templateType, status: 'draft' as const, _generatedAt: new Date().toISOString() };
      }
      console.error('[draftSection]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), sectionTitle, content: '', wordCount: 0, templateType, status: 'draft' as const, _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 5: editForDiplomaticTone
// Two-pass editing: regex for obvious terms + Gemini for nuanced revision
// ============================================================================

export const editForDiplomaticTone = tool({
  description:
    'Review and edit text to conform to diplomatic language standards, UN terminology, and appropriate hedging. Two-pass: quick regex for obvious terms, then Gemini for nuanced diplomatic editing.',
  inputSchema: z.object({
    text: z.string().describe('The text to review and edit'),
    targetAudience: z
      .enum([
        'security_council',
        'general_assembly',
        'secretary_general',
        'member_states',
        'press',
        'internal',
      ])
      .describe('The intended audience for the text'),
    sensitivityLevel: z
      .enum(['high', 'medium', 'low'])
      .optional()
      .describe('How diplomatically sensitive the topic is'),
  }),
  execute: async ({ text, targetAudience, sensitivityLevel }) => {
    try {
      // Pass 1: Quick regex for well-established UN terminology substitutions
      const pass1 = text
        .replace(/\bwar\b/gi, 'armed conflict')
        .replace(/\brebels?\b/gi, 'opposition armed group')
        .replace(/\bregime\b/gi, 'authorities')
        .replace(/\bterrorist\b/gi, 'non-State armed group')
        .replace(/\binvasion\b/gi, 'military operation')
        .replace(/\bethnic cleansing\b/gi, '[term requires determination by competent body]')
        .replace(/\bcivil war\b/gi, 'non-international armed conflict')
        .replace(/\bfailed state\b/gi, 'State facing governance challenges')
        .replace(/\bchild soldier/gi, 'child associated with armed forces and armed groups')
        .replace(/\bboots on the ground\b/gi, 'military deployment')
        .replace(/\bpeace deal\b/gi, 'peace agreement')
        .replace(/\bwarlord\b/gi, 'armed group leader')
        .replace(/\bno-fly zone\b/gi, 'flight restriction zone')
        .replace(/\bsanctions busting\b/gi, 'sanctions violations')
        .replace(/\bkilling\b/gi, 'killing')
        .replace(/\bextremists?\b/gi, 'extremist elements')
        .replace(/\bjihadi(st)?\b/gi, 'armed extremist group member');

      // Pass 2: Gemini for nuanced diplomatic revision
      const { text: finalText } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        prompt: `You are a UN editorial specialist with expertise in diplomatic language and the UN Editorial Manual. Review and revise this text for a ${targetAudience.replace(/_/g, ' ')} audience at sensitivity level: ${sensitivityLevel || 'medium'}.

Rules:
1. Ensure balanced framing — no passage should advantage any party over another
2. Add diplomatic hedging where assertions lack clear sourcing ("it is reported that", "according to available information", "sources indicate", "it is assessed that")
3. Use gender-inclusive language throughout (chairperson not chairman, etc.)
4. Ensure terminology complies with the UN Editorial Manual
5. For ${targetAudience}:${
          targetAudience === 'security_council'
            ? ' Use formal Council language. Reference relevant resolutions where appropriate. Avoid policy recommendations unless in an "Observations" section.'
            : targetAudience === 'press'
              ? ' Use accessible language. Avoid jargon. Keep sentences short. Attribute all claims explicitly.'
              : targetAudience === 'general_assembly'
                ? ' Use formal multilateral language. Reference Charter principles and resolution precedents.'
                : targetAudience === 'secretary_general'
                  ? ' Use clear analytical language. Lead with key judgements. Be frank about information gaps.'
                  : ' Use standard diplomatic register with appropriate hedging.'
        }

Text to edit:
${truncate(pass1)}

Return ONLY the revised text, with no preamble or explanation.`,
      });

      return {
        originalText: text,
        editedText: finalText,
        targetAudience,
        sensitivityLevel: sensitivityLevel || 'medium',
        overallAssessment:
          'Text revised for diplomatic appropriateness per UN editorial standards. Key terminology adjusted and balanced framing applied.',
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'editForDiplomaticTone', originalText: text, editedText: '', targetAudience, sensitivityLevel: sensitivityLevel || 'medium', overallAssessment: '', _generatedAt: new Date().toISOString() };
      }
      console.error('[editForDiplomaticTone]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), originalText: text, editedText: '', targetAudience, sensitivityLevel: sensitivityLevel || 'medium', overallAssessment: '', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 6: analyzeMediaSource
// Real analysis using the MEDIA_DATABASE + Gemini for contextual assessment
// ============================================================================

export const analyzeMediaSource = tool({
  description:
    'Analyze a media source for political positioning, reliability, editorial independence, and known biases. Uses the TACITUS media source database of 50+ real outlets.',
  inputSchema: z.object({
    sourceName: z.string().describe('Name of the media source to analyze'),
    sourceUrl: z.string().optional().describe('URL of a specific article or the source homepage'),
    analysisDepth: z
      .enum(['quick', 'standard', 'deep'])
      .optional()
      .describe('How detailed the analysis should be'),
    topicContext: z.string().optional().describe('Specific topic to assess the source coverage of'),
  }),
  execute: async ({ sourceName, analysisDepth, topicContext }) => {
    try {
      const dbEntry = findMediaOutlet(sourceName);

      if (dbEntry && analysisDepth === 'quick') {
        // Return database entry directly without Gemini call for quick lookups
        return {
          sourceName: dbEntry.name,
          country: dbEntry.country,
          ownershipType: dbEntry.ownershipType,
          politicalOrientation: dbEntry.politicalOrientation,
          reliability: dbEntry.reliabilityScore,
          editorialIndependence: dbEntry.editorialIndependence,
          knownStrengths: dbEntry.knownStrengths,
          knownLimitations: dbEntry.knownLimitations,
          notableFor: dbEntry.notableFor,
          topicAssessment: topicContext
            ? `For coverage of "${topicContext}", consult ${dbEntry.name}'s known limitations for relevant bias factors.`
            : null,
          analysisDepth: 'quick',
          _generatedAt: new Date().toISOString(),
        };
      }

      // Build database context for Gemini
      const dbContext = dbEntry
        ? `PRAXIS DATABASE ENTRY for ${dbEntry.name}:
- Country: ${dbEntry.country}
- Ownership: ${dbEntry.ownershipType}
- Political orientation: ${dbEntry.politicalOrientation} (-1 far left, +1 far right, 0 neutral)
- Reliability score: ${dbEntry.reliabilityScore}
- Editorial independence: ${dbEntry.editorialIndependence}
- Strengths: ${dbEntry.knownStrengths.join(', ')}
- Limitations: ${dbEntry.knownLimitations.join(', ')}
- Notable for: ${dbEntry.notableFor}`
        : `No entry found in PRAXIS database for "${sourceName}". Generate analysis based on general knowledge.`;

      const { output } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          sourceName: z.string(),
          country: z.string(),
          ownershipType: z.enum(['state', 'private', 'public', 'wire_service', 'ngo', 'think_tank']),
          politicalOrientation: z.number().min(-1).max(1),
          reliability: z.number().min(0).max(1),
          editorialIndependence: z.number().min(0).max(1),
          analysis: z.string(),
          knownBiases: z.array(z.string()),
          coverageStrengths: z.array(z.string()),
          topicAssessment: z.string().optional(),
          recommendedPairing: z.array(z.string()),
          usageGuidance: z.string(),
        }) }),
        prompt: `

${dbContext}
${topicContext ? `\nSpecific topic for coverage assessment: "${truncate(topicContext)}"` : ''}

Provide a comprehensive ${analysisDepth || 'standard'} analysis including:
- Editorial positioning and political orientation (-1 to 1 scale)
- Reliability score (0-1) based on track record, fact-checking, and editorial standards
- Editorial independence from government or corporate owners
- Known biases and blind spots relevant to conflict reporting
- Coverage strengths that make this outlet valuable
- Recommended outlets to pair with this source for triangulation
- Practical guidance on how to use this source in diplomatic analysis`,
      });

      return { ...output, analysisDepth: analysisDepth || 'standard', _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'analyzeMediaSource', _generatedAt: new Date().toISOString() };
      }
      console.error('[analyzeMediaSource]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 7: compareMediaCoverage
// Gemini-powered analysis of how different outlets cover conflict topics
// ============================================================================

export const compareMediaCoverage = tool({
  description:
    'Compare how multiple media sources cover the same topic or event. Identifies framing differences, convergence and divergence points, and notable omissions.',
  inputSchema: z.object({
    topic: z.string().describe('The topic or event to compare coverage of'),
    sourceNames: z.array(z.string()).min(2).max(8).describe('Names of media sources to compare'),
    timeRange: z.enum(['day', 'week', 'month']).optional().describe('Time range for coverage comparison'),
  }),
  execute: async ({ topic: _topic, sourceNames, timeRange: _timeRange }) => {
    try {
      // Build media database context for sources requested
      const sourceProfiles = sourceNames.map((name) => {
        const entry = findMediaOutlet(name);
        return entry
          ? `${entry.name} (${entry.ownershipType}, orientation: ${entry.politicalOrientation}, reliability: ${entry.reliabilityScore}): ${entry.notableFor}`
          : `${name}: no PRAXIS database entry`;
      });

      const { output } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          topic: z.string(),
          timeRange: z.string(),
          sources: z.array(
            z.object({
              sourceName: z.string(),
              headline: z.string().describe('Representative headline this outlet would likely run'),
              tone: z.enum(['positive', 'negative', 'neutral', 'alarming', 'cautious']),
              framing: z.string().describe('How this outlet frames the issue and why'),
              keyActorsMentioned: z.array(z.string()),
              narrativesIdentified: z.array(z.string()),
              notableAngles: z.string().describe('Distinctive coverage angles this outlet brings'),
            })
          ),
          convergencePoints: z.array(z.string()),
          divergencePoints: z.array(z.string()),
          notableOmissions: z.array(z.string()),
          reliabilityRanking: z
            .array(z.string())
            .describe('Sources ranked from most to least reliable for this topic'),
          overallAssessment: z.string(),
          recommendedReadingOrder: z.string().describe('Which sources to read first and why'),
        }) }),
        prompt: `

SOURCE PROFILES FROM PRAXIS DATABASE:
${sourceProfiles.join('\n')}

For each source, assess:
- How they would headline and frame this story
- What narrative they emphasize and why (based on ownership, editorial line, audience)
- Which actors they center and which they marginalize
- What angles are distinctive to this outlet

Then assess: where do sources converge (likely factual baseline)? Where do they diverge (contested framing)? What do ALL sources miss?

Provide a reliability ranking of these sources for this specific topic and guidance on recommended reading order.`,
      });

      return { ...output, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'compareMediaCoverage', _generatedAt: new Date().toISOString() };
      }
      console.error('[compareMediaCoverage]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 8: checkUNTerminology
// Expanded 50+ term database with Gemini for context-sensitive review
// ============================================================================

export const checkUNTerminology = tool({
  description:
    'Check text against UN terminology standards and official usage guidelines. Identifies non-standard terms and suggests UN-approved alternatives.',
  inputSchema: z.object({
    text: z.string().describe('The text to check for UN terminology compliance'),
    context: z
      .enum(['resolution', 'report', 'briefing', 'statement', 'correspondence', 'general'])
      .optional()
      .describe('The document context for terminology checking'),
  }),
  execute: async ({ text, context }) => {
    try {
    // Core UN terminology rules — expanded to 30+ regex checks
    const termChecks = [
      { pattern: /\bwar\b/gi, suggestion: 'armed conflict', severity: 'error' as const },
      { pattern: /\brebels?\b/gi, suggestion: 'opposition armed group / non-State armed group', severity: 'error' as const },
      { pattern: /\bregime\b/gi, suggestion: 'Government / authorities', severity: 'error' as const },
      { pattern: /\btribe\b/gi, suggestion: 'ethnic group / community / clan', severity: 'warning' as const },
      { pattern: /\bterrorist\b/gi, suggestion: 'designated entity / non-State armed group (unless SC-designated)', severity: 'error' as const },
      { pattern: /\bfailed state\b/gi, suggestion: 'State facing governance challenges', severity: 'warning' as const },
      { pattern: /\bcivil war\b/gi, suggestion: 'non-international armed conflict / internal armed conflict', severity: 'warning' as const },
      { pattern: /\bethnic cleansing\b/gi, suggestion: 'use only when determined by a competent body', severity: 'error' as const },
      { pattern: /\bwarlord\b/gi, suggestion: 'armed group leader / commander', severity: 'warning' as const },
      { pattern: /\binvasion\b/gi, suggestion: 'military operation / military incursion', severity: 'error' as const },
      { pattern: /\boccupied territories\b/gi, suggestion: 'occupied territory (singular per UN usage)', severity: 'info' as const },
      { pattern: /\bchild soldier/gi, suggestion: 'child associated with armed forces and armed groups (CAAFAG)', severity: 'error' as const },
      { pattern: /\bno-fly zone\b/gi, suggestion: 'flight restriction zone', severity: 'info' as const },
      { pattern: /\brefugee camp\b/gi, suggestion: 'refugee settlement / camp (verify UNHCR designation)', severity: 'info' as const },
      { pattern: /\billegal immigrants?\b/gi, suggestion: 'undocumented migrants / persons in an irregular situation', severity: 'error' as const },
      { pattern: /\bslums?\b/gi, suggestion: 'informal settlement', severity: 'warning' as const },
      { pattern: /\bhandicapped\b/gi, suggestion: 'persons with disabilities', severity: 'error' as const },
      { pattern: /\bmanpower\b/gi, suggestion: 'personnel / human resources / workforce', severity: 'warning' as const },
      { pattern: /\bchairman\b/gi, suggestion: 'Chair / Chairperson', severity: 'warning' as const },
      { pattern: /\bspokesman\b/gi, suggestion: 'spokesperson', severity: 'warning' as const },
      { pattern: /\blayman\b/gi, suggestion: 'non-specialist / layperson', severity: 'info' as const },
      { pattern: /\bjihadis?t?\b/gi, suggestion: 'extremist / violent extremist (avoid religious framing)', severity: 'error' as const },
      { pattern: /\bsuicide bomber\b/gi, suggestion: 'perpetrator of a suicide attack', severity: 'warning' as const },
      { pattern: /\bpeace deal\b/gi, suggestion: 'peace agreement / peace accord', severity: 'info' as const },
      { pattern: /\bsanctions busting\b/gi, suggestion: 'sanctions violations / circumvention of sanctions', severity: 'warning' as const },
      { pattern: /\bproxy war\b/gi, suggestion: 'internationalized internal armed conflict / external interference', severity: 'warning' as const },
      { pattern: /\bblue helmet/gi, suggestion: 'UN peacekeeping personnel / uniformed personnel of [MISSION NAME]', severity: 'info' as const },
      { pattern: /\bsex slave/gi, suggestion: 'victim of conflict-related sexual violence', severity: 'error' as const },
      { pattern: /\bboy soldier/gi, suggestion: 'child associated with armed forces and armed groups', severity: 'error' as const },
      { pattern: /\beradication\b/gi, suggestion: 'elimination / decisive action against (avoid when referring to people)', severity: 'warning' as const },
    ];

    const issues: Array<{
      term: string;
      suggestion: string;
      reason: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];

    for (const check of termChecks) {
      const matches = text.match(check.pattern);
      if (matches) {
        for (const match of matches) {
          issues.push({
            term: match,
            suggestion: check.suggestion,
            reason: `"${match}" is non-standard UN terminology. Preferred: "${check.suggestion}".`,
            severity: check.severity,
          });
        }
      }
    }

    // Deduplicate issues by term
    const seen = new Set<string>();
    const dedupedIssues = issues.filter((i) => {
      const key = i.term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      text,
      context: context || 'general',
      issueCount: dedupedIssues.length,
      issues: dedupedIssues,
      overallCompliance:
        dedupedIssues.length === 0
          ? 'compliant'
          : dedupedIssues.some((i) => i.severity === 'error')
            ? 'non_compliant'
            : 'needs_review',
      recommendation:
        dedupedIssues.length === 0
          ? 'Text conforms to UN terminology standards.'
          : `Found ${dedupedIssues.length} terminology issue(s) (${dedupedIssues.filter((i) => i.severity === 'error').length} errors, ${dedupedIssues.filter((i) => i.severity === 'warning').length} warnings). Review suggested replacements before finalizing.`,
      _generatedAt: new Date().toISOString(),
    };
    } catch (err) {
      console.error('[checkUNTerminology]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), text, context: context || 'general', issueCount: 0, issues: [], overallCompliance: 'compliant', recommendation: '', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 9: draftResolutionLanguage
// UN Security Council resolution language with Chapter VII patterns
// ============================================================================

export const draftResolutionLanguage = tool({
  description:
    'Draft text in the style and format of UN Security Council resolutions. Generates preambular and operative paragraphs using standard resolution language, including Chapter VII formulations.',
  inputSchema: z.object({
    topic: z.string().describe('The topic or situation the resolution addresses'),
    type: z
      .enum(['preambular', 'operative', 'full'])
      .describe('Whether to draft preambular paragraphs, operative paragraphs, or both'),
    keyPoints: z.array(z.string()).describe('Key points to address in the resolution language'),
    strength: z
      .enum(['strong', 'moderate', 'weak'])
      .optional()
      .describe('"strong" uses Chapter VII language (demands/decides), "moderate" uses calls upon/urges, "weak" uses encourages/notes'),
    previousResolutions: z
      .array(z.string())
      .optional()
      .describe('Previous resolution numbers to recall and reference'),
    chapterVII: z.boolean().optional().describe('Whether to include Chapter VII authorization language'),
  }),
  execute: async ({ topic: _topic, type, keyPoints, strength, previousResolutions, chapterVII }) => {
    try {
    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        topic: z.string(),
        type: z.string(),
        preambular: z.array(z.string()).describe('Preambular paragraphs (gerund form: "Recalling...", "Expressing concern...")'),
        operative: z.array(z.string()).describe('Operative paragraphs (present tense: "1. Demands...", "2. Calls upon...")'),
        chapterVIIClause: z.string().optional().describe('Chapter VII authorization clause if applicable'),
        strength: z.string(),
        referencedResolutions: z.array(z.string()),
        draftingNotes: z.string(),
      }) }),
      prompt: `

Type requested: ${type}
Strength level: ${strength || 'moderate'}
Chapter VII: ${chapterVII ? 'YES — include "Acting under Chapter VII of the Charter"' : 'No'}
Key points to address: ${keyPoints.join('; ')}
Previous resolutions to reference: ${previousResolutions?.join(', ') || 'None specified'}

RESOLUTION DRAFTING STANDARDS:
Preambular verbs (gerund form): Recalling, Reaffirming, Noting, Expressing (concern/satisfaction), Recognizing, Welcoming, Deploring, Condemning, Bearing in mind, Convinced that, Determined to, Taking note of, Recalling also, Emphasizing
Operative verbs by strength:
- Strong (Chapter VII): Demands, Decides, Determines, Requires, Authorizes, Establishes
- Moderate: Calls upon, Urges, Requests, Stresses, Encourages (parties to), Emphasizes, Reiterates
- Weak: Notes, Welcomes, Invites, Expresses appreciation for, Looks forward to

IMPORTANT PATTERNS:
- Reference previous resolutions: "Recalling its resolution [XXXX (YEAR)] and subsequent resolutions on the situation"
- Chapter VII clause: "Acting under Chapter VII of the Charter of the United Nations,"
- Termination clause: "Decides to remain actively seized of the matter."
- Sanctions: "Decides that all Member States shall immediately take the necessary measures to [action]"
- Mission authorization: "Authorizes [MISSION NAME] to use all necessary means to [mandate]"

Draft authentic UNSC resolution language for each element requested. Each preambular paragraph ends with a comma, each operative paragraph ends with a semicolon (last ends with period).`,
    });

    return {
      ...output,
      note: 'This is AI-generated draft language. All resolution text must be reviewed and approved through proper diplomatic channels before formal use.',
      _generatedAt: new Date().toISOString(),
    };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'draftResolutionLanguage', topic: '', type: '', preambular: [], operative: [], strength: '', referencedResolutions: [], draftingNotes: '', note: '', _generatedAt: new Date().toISOString() };
      }
      console.error('[draftResolutionLanguage]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), topic: '', type: '', preambular: [], operative: [], strength: '', referencedResolutions: [], draftingNotes: '', note: '', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 10: generateTalkingPoints
// Grounded in conflict graph data with audience-specific formatting
// ============================================================================

export const generateTalkingPoints = tool({
  description:
    'Generate structured talking points for diplomatic briefings, meetings, or press conferences. Grounded in real conflict data with anticipated Q&A.',
  inputSchema: z.object({
    topic: z.string().describe('The topic for the talking points'),
    audience: z
      .enum([
        'security_council',
        'general_assembly',
        'press',
        'bilateral_meeting',
        'internal_briefing',
        'special_envoy',
      ])
      .describe('The intended audience for the talking points'),
    position: z.string().optional().describe('The position or perspective to articulate'),
    conflictId: z.string().optional().describe('Conflict ID to ground talking points in real knowledge graph data'),
    maxPoints: z.number().min(3).max(10).optional().describe('Maximum number of talking points to generate'),
  }),
  execute: async ({ topic: _topic, audience, position, conflictId, maxPoints }) => {
    try {
    // Ground in real conflict data if available
    const conflict = DEMO_CONFLICT;
    const actorContext = conflict.actors
      .slice(0, 5)
      .map((a) => `${a.name}: ${a.description.slice(0, 80)}...`)
      .join('\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        topic: z.string(),
        audience: z.string(),
        position: z.string(),
        talkingPoints: z.array(
          z.object({
            point: z.string().describe('The main talking point (1-2 sentences)'),
            supporting: z.array(z.string()).describe('2-3 supporting facts or arguments'),
            sensitivityNote: z.string().describe('Diplomatic sensitivity guidance for this point'),
          })
        ),
        anticipatedQuestions: z.array(
          z.object({
            question: z.string(),
            suggestedResponse: z.string(),
          })
        ),
        keyMessages: z.array(z.string()).describe('3 core messages that must come across regardless'),
        avoidList: z.array(z.string()).describe('Specific phrases or framing to avoid for this audience'),
      }) }),
      prompt: `
Audience: ${audience.replace(/_/g, ' ')}
Position/Perspective: ${position || 'UN Secretary-General / SRSG'}
Number of points: ${maxPoints || 5}

CONFLICT CONTEXT (Nordalia Crisis):
${actorContext}

AUDIENCE-SPECIFIC REQUIREMENTS:
${
  audience === 'security_council'
    ? 'Formal diplomatic register. Reference relevant UNSC resolutions. Speak to maintenance of international peace and security. Avoid policy recommendations in factual briefing — reserve for "Observations" section.'
    : audience === 'press'
      ? 'Accessible language. Short, quotable sentences. All claims attributed. Lead with humanitarian angle. Avoid jargon. Anticipate hostile follow-up questions.'
      : audience === 'bilateral_meeting'
        ? 'Direct, frank tone appropriate for closed-door diplomatic exchange. Acknowledge interests of the counterpart. Focus on areas of potential agreement.'
        : audience === 'special_envoy'
          ? 'Analysis-heavy. Include frank assessment of obstacles. Note where flexibility exists. Include red lines.'
          : 'Standard diplomatic register with calibrated hedging.'
}

For each talking point: provide the main point, 2-3 supporting facts, and a sensitivity note.
Also provide: 3 anticipated tough questions with suggested responses, 3 key messages that must land regardless of how the conversation goes, and a list of phrases/framings to avoid with this audience.`,
    });

    return { ...output, conflictId: conflictId || null, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'generateTalkingPoints', topic: '', audience: '', position: '', talkingPoints: [], anticipatedQuestions: [], keyMessages: [], avoidList: [], conflictId: null, _generatedAt: new Date().toISOString() };
      }
      console.error('[generateTalkingPoints]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), topic: '', audience: '', position: '', talkingPoints: [], anticipatedQuestions: [], keyMessages: [], avoidList: [], conflictId: null, _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 11: escalationAssessment
// Analyzes escalation dynamics using Glasl's 9-stage escalation model
// ============================================================================

export const escalationAssessment = tool({
  description:
    'Analyze conflict escalation dynamics using the Glasl 9-stage escalation model. Returns current stage assessment, key drivers, de-escalation opportunities, and trigger risks.',
  inputSchema: z.object({
    conflictId: z.string().describe('Conflict ID to analyze (will load real knowledge graph data)'),
    specificConcern: z
      .string()
      .optional()
      .describe('Specific escalation concern to focus the analysis on'),
    timeHorizon: z
      .enum(['immediate', 'short_term', 'medium_term'])
      .optional()
      .describe('Time horizon for risk assessment (default: short_term)'),
  }),
  execute: async ({ conflictId: _conflictId, specificConcern, timeHorizon }) => {
    try {
    // Load conflict data
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const events = (conflictData.events as Array<Record<string, unknown>> | undefined) ?? [];
    const recentEvents = events
      .slice(-8)
      .map((e) => `${e.date} [${e.type ?? 'unknown'}]: ${String(e.description ?? '').slice(0, 80)}...`)
      .join('\n');
    const actorList = conflict.actors.map((a) => `${a.name} (${a.type})`).join(', ');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        conflictName: z.string(),
        currentStage: z.number().min(1).max(9).describe('Current Glasl escalation stage (1-9)'),
        stageName: z.string().describe('Name of the current escalation stage'),
        stageDescription: z.string().describe('What characterizes this stage in this conflict'),
        escalationTrend: z.enum(['escalating', 'stable', 'de-escalating', 'volatile']),
        trendExplanation: z.string(),
        keyDrivers: z.array(
          z.object({
            driver: z.string(),
            actorsInvolved: z.array(z.string()),
            severity: z.enum(['low', 'medium', 'high', 'critical']),
          })
        ),
        deEscalationOpportunities: z.array(
          z.object({
            opportunity: z.string(),
            requiredConditions: z.string(),
            feasibility: z.enum(['low', 'medium', 'high']),
            leadActors: z.array(z.string()),
          })
        ),
        triggerRisks: z.array(
          z.object({
            trigger: z.string(),
            likelihood: z.enum(['low', 'medium', 'high']),
            potentialImpact: z.string(),
            earlyWarningIndicators: z.array(z.string()),
          })
        ),
        recommendedActions: z.array(z.string()),
        analystConfidence: z.enum(['low', 'medium', 'high']),
        assessmentCaveats: z.array(z.string()),
      }) }),
      prompt: `

CONFLICT DESCRIPTION: ${conflict.description}

KEY ACTORS: ${actorList}

RECENT EVENTS TIMELINE:
${recentEvents}

${specificConcern ? `SPECIFIC CONCERN: ${specificConcern}` : ''}
TIME HORIZON: ${timeHorizon || 'short_term'} (immediate = 72hrs, short_term = 1-4 weeks, medium_term = 1-3 months)

GLASL 9-STAGE ESCALATION MODEL:
Stage 1: Hardening positions
Stage 2: Debates and polemics
Stage 3: Actions, not words
Stage 4: Images and coalitions
Stage 5: Loss of face
Stage 6: Strategies of threats
Stage 7: Limited destructive blows
Stage 8: Fragmentation of the enemy
Stage 9: Together into the abyss

Assess the current stage and provide a rigorous escalation analysis including:
- Key drivers of escalation risk specific to this conflict's dynamics
- Realistic de-escalation opportunities given current positions
- Concrete trigger risks for rapid escalation with early warning indicators
- Actionable recommendations for mediators and international actors
- Confidence level in this assessment and key caveats`,
    });

    return { ...output, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'escalationAssessment', _generatedAt: new Date().toISOString() };
      }
      console.error('[escalationAssessment]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 12: negotiationSpaceAnalysis
// Maps ZOPA, BATNA, red lines, and potential trade-offs
// ============================================================================

export const negotiationSpaceAnalysis = tool({
  description:
    'Map the negotiation space for a conflict — ZOPA (Zone of Possible Agreement), BATNA assessments, red lines, and deal probability. Grounded in conflict graph actor data.',
  inputSchema: z.object({
    conflictId: z.string().describe('Conflict ID to analyze'),
    issuesOfFocus: z
      .array(z.string())
      .optional()
      .describe('Specific negotiation issues to analyze (e.g., "power sharing", "ceasefire terms")'),
    mediationContext: z
      .string()
      .optional()
      .describe('Current mediation format and state of talks'),
  }),
  execute: async ({ conflictId: _conflictId, issuesOfFocus, mediationContext }) => {
    try {
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const actors = conflict.actors.slice(0, 6).map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      description: a.description.slice(0, 150),
    }));
    const interests = ((conflictData.interests as Array<Record<string, unknown>> | undefined) ?? [])
      .map((i) => `${i.actorId}: ${i.type} interest — ${i.description}`)
      .join('\n');
    const constraints = ((conflictData.constraints as Array<Record<string, unknown>> | undefined) ?? [])
      .map((c) => `${c.actorId}: ${c.description}`)
      .join('\n');
    const commitments = ((conflictData.commitments as Array<Record<string, unknown>> | undefined) ?? [])
      .map((c) => `${c.type} [${c.status}]: ${String(c.description ?? '').slice(0, 120)}`)
      .join('\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        conflictName: z.string(),
        parties: z.array(
          z.object({
            name: z.string(),
            statedPosition: z.string(),
            underlyingInterests: z.array(z.string()),
            batna: z.string().describe('Best Alternative to a Negotiated Agreement'),
            redLines: z.array(z.string()),
            flexibilityAreas: z.array(z.string()),
            negotiatingStrength: z.enum(['strong', 'moderate', 'weak']),
          })
        ),
        issueAnalysis: z.array(
          z.object({
            issue: z.string(),
            zopaExists: z.boolean(),
            zopaDescription: z.string().optional(),
            mainObstacles: z.array(z.string()),
            potentialFormulations: z.array(z.string()),
          })
        ),
        potentialTradeoffs: z.array(
          z.object({
            party1: z.string(),
            concession1: z.string(),
            party2: z.string(),
            concession2: z.string(),
            feasibility: z.enum(['low', 'medium', 'high']),
          })
        ),
        dealProbability: z.number().min(0).max(1),
        dealProbabilityRationale: z.string(),
        criticalPathToAgreement: z.array(z.string()),
        spoilerRisks: z.array(z.string()),
        mediatorRecommendations: z.array(z.string()),
      }) }),
      prompt: `

CONFLICT DESCRIPTION: ${conflict.description}

KEY ACTORS:
${actors.map((a) => `${a.name} (${a.type}): ${a.description}`).join('\n\n')}

MAPPED INTERESTS:
${interests}

CONSTRAINTS:
${constraints}

EXISTING COMMITMENTS:
${commitments}

${issuesOfFocus ? `FOCUS ISSUES: ${issuesOfFocus.join(', ')}` : ''}
${mediationContext ? `MEDIATION CONTEXT: ${mediationContext}` : ''}

Conduct a rigorous negotiation space analysis:
1. For each party: map stated positions vs. underlying interests, BATNA, red lines, and areas of flexibility
2. For each key issue: does a ZOPA exist? What would an agreement formula look like?
3. Map potential trade-offs across issues and parties (log-rolling opportunities)
4. Assess overall deal probability (0-1) with clear rationale
5. Identify the critical path to agreement — what must happen in what order
6. Flag spoiler risks — who benefits from no deal and how they might undermine talks
7. Recommend specific mediator strategies`,
    });

    return { ...output, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'negotiationSpaceAnalysis', _generatedAt: new Date().toISOString() };
      }
      console.error('[negotiationSpaceAnalysis]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 13: narrativeEcosystemMap
// Maps the narrative landscape — dominant, counter, emerging narratives
// ============================================================================

export const narrativeEcosystemMap = tool({
  description:
    'Map the narrative ecosystem of a conflict — dominant narratives, counter-narratives, emerging narratives, audience targeting, and misinformation risks. Grounded in conflict graph narrative data.',
  inputSchema: z.object({
    conflictId: z.string().describe('Conflict ID to analyze'),
    focus: z
      .string()
      .optional()
      .describe('Specific narrative dimension to focus on (e.g., "humanitarian framing", "legitimacy narratives")'),
    audienceFocus: z
      .string()
      .optional()
      .describe('Specific audience to examine narrative targeting for'),
  }),
  execute: async ({ conflictId: _conflictId, focus, audienceFocus }) => {
    try {
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const narratives = ((conflictData.narratives as Array<Record<string, unknown>> | undefined) ?? [])
      .map(
        (n) =>
          `${n.actorId} — ${n.type}: ${n.description} [Audiences: ${Array.isArray(n.targetAudiences) ? n.targetAudiences.join(', ') : 'N/A'}]`
      )
      .join('\n');
    const actors = conflict.actors
      .slice(0, 6)
      .map((a) => `${a.name}: ${a.description.slice(0, 100)}`)
      .join('\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        conflictName: z.string(),
        dominantNarratives: z.array(
          z.object({
            narrativeName: z.string(),
            coreFraming: z.string(),
            promotedBy: z.array(z.string()),
            targetAudiences: z.array(z.string()),
            mediaChannels: z.array(z.string()),
            strength: z.enum(['weak', 'moderate', 'strong', 'hegemonic']),
            vulnerabilities: z.string().describe('Where this narrative is weakest or most contested'),
          })
        ),
        counterNarratives: z.array(
          z.object({
            narrativeName: z.string(),
            contestedClaim: z.string(),
            alternativeFraming: z.string(),
            promotedBy: z.array(z.string()),
            effectiveness: z.enum(['ineffective', 'limited', 'moderate', 'effective']),
          })
        ),
        emergingNarratives: z.array(
          z.object({
            narrativeName: z.string(),
            description: z.string(),
            potentialImpact: z.string(),
            earlyIndicators: z.array(z.string()),
          })
        ),
        narrativeClashes: z.array(
          z.object({
            clash: z.string(),
            partiesInvolved: z.array(z.string()),
            stakes: z.string(),
          })
        ),
        misinformationRisks: z.array(
          z.object({
            claim: z.string(),
            likelihood: z.enum(['low', 'medium', 'high']),
            potentialImpact: z.string(),
            countermeasures: z.array(z.string()),
          })
        ),
        informationEnvironmentAssessment: z.string(),
        strategicCommunicationRecommendations: z.array(z.string()),
      }) }),
      prompt: `

CONFLICT DESCRIPTION: ${conflict.description}

KEY ACTORS: ${actors}

EXISTING NARRATIVE DATA FROM PRAXIS GRAPH:
${narratives}

${focus ? `ANALYTICAL FOCUS: ${focus}` : ''}
${audienceFocus ? `AUDIENCE FOCUS: ${audienceFocus}` : ''}

Conduct a comprehensive narrative ecosystem analysis:
1. Map dominant narratives — who controls the information space and how
2. Identify counter-narratives — who contests dominant framing and with what success
3. Flag emerging narratives — what new framings are gaining traction
4. Analyze narrative clashes — where competing narratives directly conflict and what's at stake
5. Assess misinformation risks — what false narratives could destabilize the peace process
6. Evaluate the overall information environment (contested, dominated, fragmented, etc.)
7. Provide strategic communication recommendations for international mediators`,
    });

    return { ...output, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'narrativeEcosystemMap', _generatedAt: new Date().toISOString() };
      }
      console.error('[narrativeEcosystemMap]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 14: historicalParallelsAnalysis
// Identifies historical conflict parallels with similarity scoring
// ============================================================================

export const historicalParallelsAnalysis = tool({
  description:
    'Identify historical conflict parallels for a given conflict. Returns 3-5 historical cases with similarity scores, lessons learned, and cautionary notes. Useful for contextualizing current dynamics and informing mediation strategy.',
  inputSchema: z.object({
    conflictId: z.string().describe('Conflict ID to find historical parallels for'),
    dimension: z
      .enum(['military', 'diplomatic', 'political', 'humanitarian', 'economic', 'all'])
      .optional()
      .describe('Specific dimension to focus the parallel analysis on (default: all)'),
    timeframe: z
      .enum(['cold_war', 'post_cold_war', 'post_2000', 'any'])
      .optional()
      .describe('Historical timeframe to search within (default: any)'),
  }),
  execute: async ({ conflictId, dimension, timeframe }) => {
    try {
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const actors = conflict.actors.slice(0, 6).map((a) => `${a.name} (${a.type})`).join(', ');
    const events = (conflictData.events as Array<Record<string, unknown>> | undefined) ?? [];
    const recentEvents = events
      .slice(-5)
      .map((e) => `${e.date}: ${String(e.description ?? '').slice(0, 80)}`)
      .join('\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        conflictName: z.string(),
        analysisScope: z.string().describe('What dimension and timeframe was analyzed'),
        parallels: z.array(
          z.object({
            historicalCase: z.string().describe('Name of the historical conflict'),
            period: z.string().describe('Time period (e.g., "1991-1995")'),
            region: z.string(),
            similarityScore: z.number().min(0).max(1).describe('Overall similarity score (0-1)'),
            keyParallels: z.array(z.string()).describe('Specific structural or dynamic similarities'),
            keyDifferences: z.array(z.string()).describe('Important ways the cases differ'),
            outcome: z.string().describe('How the historical case ended'),
            lessonsLearned: z.array(z.string()).describe('Actionable lessons for the current conflict'),
            cautionaryNotes: z.array(z.string()).describe('Risks of over-applying this parallel'),
            relevantSources: z.array(z.string()).describe('Academic or policy sources on this case'),
          })
        ),
        crossCuttingInsights: z.array(z.string()).describe('Insights that emerge across multiple parallels'),
        keyDivergenceFromHistory: z.string().describe('What makes the current conflict genuinely novel'),
        analystNotes: z.string().describe('Methodological caveats on historical comparison'),
      }) }),
      prompt: `

CONFLICT DESCRIPTION: ${conflict.description}
KEY ACTORS: ${actors}
RECENT DYNAMICS:
${recentEvents}

ANALYSIS DIMENSION: ${dimension || 'all dimensions'}
TIMEFRAME: ${timeframe === 'cold_war' ? '1947-1991' : timeframe === 'post_cold_war' ? '1991-2000' : timeframe === 'post_2000' ? '2000-present' : 'any period in modern history'}

Identify 3-5 historical conflict cases that offer meaningful parallels to the current situation. For each:
1. Assess structural similarity (actor configuration, grievance type, conflict phase, international context)
2. Score overall similarity (0.0-1.0) with honest calibration
3. Extract actionable lessons relevant to current mediation/resolution efforts
4. Note cautionary risks of over-applying the analogy
5. Cite real academic and policy sources on the historical case

Cross-cutting: What patterns emerge across multiple parallels? What is genuinely novel about the current conflict that history does not well illuminate?

Be intellectually rigorous — resist superficial parallels. Prioritize cases where the mechanism of similarity is clear and the lessons are transferable.`,
    });

    return { ...output, conflictId, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'historicalParallelsAnalysis', conflictId, _generatedAt: new Date().toISOString() };
      }
      console.error('[historicalParallelsAnalysis]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), conflictId, _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 15: generateTimeline
// Generates structured timeline data for the interactive timeline component
// ============================================================================

export const generateTimeline = tool({
  description:
    'Generate or enrich structured timeline data for a conflict. Returns events formatted for the InteractiveTimeline component, including Glasl stage classifications, significance ratings, and source citations.',
  inputSchema: z.object({
    conflictId: z.string().describe('Conflict ID to generate timeline for'),
    startDate: z.string().optional().describe('Start date filter (ISO format: YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date filter (ISO format: YYYY-MM-DD)'),
    eventTypes: z
      .array(z.enum(['political', 'military', 'diplomatic', 'humanitarian', 'economic']))
      .optional()
      .describe('Event types to include (default: all types)'),
    includeProjected: z
      .boolean()
      .optional()
      .describe('Whether to include projected/anticipated future events (default: false)'),
  }),
  execute: async ({ conflictId, startDate, endDate, eventTypes, includeProjected }) => {
    try {
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const allEvents = (conflictData.events as Array<Record<string, unknown>> | undefined) ?? [];

    // Filter events by date range if specified
    const filteredEvents = allEvents.filter((e) => {
      const dateStr = String(e.date ?? '');
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      if (eventTypes && eventTypes.length > 0) {
        const eType = String(e.type ?? '');
        if (!eventTypes.includes(eType as 'political' | 'military' | 'diplomatic' | 'humanitarian' | 'economic')) return false;
      }
      return true;
    });

    const eventSummaries = filteredEvents
      .slice(0, 20)
      .map((e) => `[${e.date}] [${e.type}] ${String(e.description ?? '').slice(0, 100)}`)
      .join('\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        conflictName: z.string(),
        timelineRange: z.object({
          start: z.string(),
          end: z.string(),
        }),
        events: z.array(
          z.object({
            id: z.string(),
            date: z.string().describe('ISO date string YYYY-MM-DD'),
            title: z.string().describe('Short event title (5-10 words)'),
            description: z.string().describe('Detailed event description (2-4 sentences)'),
            type: z.enum(['political', 'military', 'diplomatic', 'humanitarian', 'economic']),
            glaslStage: z.number().min(1).max(9).describe('Glasl escalation stage at time of event'),
            escalatoryDirection: z.enum(['escalatory', 'de-escalatory', 'neutral']),
            significance: z.enum(['critical', 'major', 'moderate', 'minor']),
            involvedActors: z.array(z.string()).describe('Names of key actors involved'),
            sources: z.array(z.string()).describe('Source citations (real outlets/documents)'),
            tags: z.array(z.string()).optional().describe('Analytical tags (e.g., "ceasefire", "sanctions", "humanitarian corridor")'),
          })
        ),
        projectedEvents: z
          .array(
            z.object({
              estimatedDate: z.string().describe('Estimated date or timeframe (e.g., "Q2 2026")'),
              title: z.string(),
              description: z.string(),
              type: z.enum(['political', 'military', 'diplomatic', 'humanitarian', 'economic']),
              probability: z.enum(['low', 'medium', 'high']),
              triggerConditions: z.array(z.string()),
            })
          )
          .optional(),
        escalationTrajectory: z.object({
          trend: z.enum(['escalating', 'stable', 'de-escalating', 'volatile']),
          summary: z.string(),
          peakStage: z.number().min(1).max(9),
          currentStage: z.number().min(1).max(9),
        }),
        timelineNote: z.string().describe('Methodological note on data coverage and gaps'),
      }) }),
      prompt: `

CONFLICT DESCRIPTION: ${conflict.description}

EXISTING EVENT DATA (${filteredEvents.length} events):
${eventSummaries}

DATE FILTER: ${startDate || 'no start filter'} to ${endDate || 'no end filter'}
EVENT TYPES: ${eventTypes?.join(', ') || 'all types'}
INCLUDE PROJECTED: ${includeProjected ? 'YES — include 3-5 plausible near-future events' : 'NO'}

GLASL ESCALATION STAGES FOR CLASSIFICATION:
1: Hardening | 2: Debates/Polemics | 3: Actions not Words | 4: Images/Coalitions |
5: Loss of Face | 6: Threat Strategies | 7: Limited Destructive Blows |
8: Fragmentation | 9: Together into Abyss

For each event:
- Assign a clear, informative title
- Classify into the correct Glasl stage based on conflict dynamics at that time
- Determine escalatory direction (did this event push toward or away from violence?)
- Rate significance honestly (critical = major turning point, minor = routine development)
- Identify key actors directly involved
- Cite realistic sources (real news outlets, UN documents, NGO reports)

Calculate overall escalation trajectory across the timeline period.`,
    });

    return { ...output, conflictId, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'generateTimeline', conflictId, _generatedAt: new Date().toISOString() };
      }
      console.error('[generateTimeline]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), conflictId, _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 16: sanctionsCheck
// Generates sanctions regime information for entities or conflicts
// ============================================================================

export const sanctionsCheck = tool({
  description:
    'Generate comprehensive sanctions regime information for a named entity or conflict. Returns sanctions lists, designating bodies, asset freeze/travel ban status, and compliance guidance. For analytical and due-diligence awareness purposes.',
  inputSchema: z.object({
    entityName: z
      .string()
      .optional()
      .describe('Name of the individual, organization, or entity to check'),
    conflictId: z
      .string()
      .optional()
      .describe('Conflict ID to retrieve all related sanctions regimes'),
    sanctionsBody: z
      .enum(['un_security_council', 'us_ofac', 'eu', 'uk_ofsi', 'all'])
      .optional()
      .describe('Specific sanctions body to focus on (default: all)'),
    includeGuidance: z
      .boolean()
      .optional()
      .describe('Whether to include compliance and due diligence guidance (default: true)'),
  }),
  execute: async ({ entityName, conflictId, sanctionsBody, includeGuidance }) => {
    try {
    const conflict = DEMO_CONFLICT;
    const conflictActors = conflict.actors.map((a) => `${a.name} (${a.type}): ${a.description.slice(0, 80)}`).join('\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        queryType: z.enum(['entity', 'conflict', 'combined']),
        disclaimer: z.string().describe('Legal/analytical disclaimer about the nature of this output'),
        entityResults: z
          .array(
            z.object({
              entityName: z.string(),
              entityType: z.enum(['individual', 'organization', 'vessel', 'aircraft', 'unknown']),
              sanctionsStatus: z.enum(['designated', 'not_designated', 'unclear', 'delisted']),
              designatingBodies: z.array(
                z.object({
                  body: z.string(),
                  listName: z.string(),
                  designationDate: z.string().optional(),
                  designationBasis: z.string(),
                  measures: z.array(z.enum(['asset_freeze', 'travel_ban', 'arms_embargo', 'trade_restriction'])),
                })
              ),
              aliases: z.array(z.string()),
              associatedEntities: z.array(z.string()),
              noteworthy: z.string().optional(),
            })
          )
          .optional(),
        conflictRegimes: z
          .array(
            z.object({
              regimeName: z.string(),
              legalBasis: z.string().describe('Resolution number, regulation, or executive order'),
              establishedDate: z.string(),
              designatingBody: z.string(),
              scopeDescription: z.string(),
              keyMeasures: z.array(z.string()),
              currentlyActive: z.boolean(),
              recentDevelopments: z.string(),
              keyDesignatedEntities: z.array(z.string()).describe('Notable designated actors (not exhaustive)'),
            })
          )
          .optional(),
        complianceGuidance: z
          .object({
            dueDiligenceSteps: z.array(z.string()),
            redFlags: z.array(z.string()),
            reportingObligations: z.string(),
            keyContacts: z.array(z.object({ body: z.string(), resource: z.string() })),
            commonPitfalls: z.array(z.string()),
          })
          .optional(),
        analyticalNote: z.string().describe('Analytical context on how sanctions are affecting the conflict dynamics'),
      }) }),
      prompt: `

CONFLICT CONTEXT (${conflict.name}):
${conflictActors}

SANCTIONS BODIES TO COVER: ${sanctionsBody === 'all' || !sanctionsBody ? 'UN Security Council, US OFAC, EU, UK OFSI' : sanctionsBody.replace(/_/g, ' ').toUpperCase()}
INCLUDE COMPLIANCE GUIDANCE: ${includeGuidance !== false ? 'YES' : 'NO'}

${entityName ? `ENTITY LOOKUP:
Generate realistic but clearly illustrative sanctions information for "${entityName}" in the context of the ${conflict.name} scenario. For the Nordalia Crisis (a fictional scenario), create fictional but realistic-sounding sanctions designations that reflect the conflict dynamics.

If this is a real-world conflict, generate accurate information based on real sanctions regimes.` : ''}

${conflictId ? `CONFLICT REGIME MAPPING:
Map all relevant sanctions regimes that apply to this conflict, including:
- UN Security Council committee/panel
- Regional body measures (EU, AU, ECOWAS, etc.)
- Major bilateral measures (US, UK)
- Arms embargoes and targeted financial measures

For fictional scenarios, create realistic fictional regime structures.` : ''}

IMPORTANT DISCLAIMERS:
- This is an AI-generated analytical tool for awareness purposes only
- Real sanctions compliance requires checking official government databases (UN Consolidated List, OFAC SDN List, EU Sanctions Map, OFSI List)
- This does not constitute legal advice

Provide realistic, analytically useful output that helps conflict analysts understand the sanctions environment and its implications for the conflict dynamics.`,
    });

    return {
      ...output,
      disclaimer: 'ANALYTICAL PURPOSE ONLY. For actual sanctions compliance, consult official government databases: UN Consolidated List, US OFAC SDN List, EU Sanctions Map, UK OFSI Consolidated List. This AI-generated output does not constitute legal advice.',
      conflictId: conflictId || null,
      _generatedAt: new Date().toISOString(),
    };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'sanctionsCheck', conflictId: conflictId || null, _generatedAt: new Date().toISOString() };
      }
      console.error('[sanctionsCheck]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), conflictId: conflictId || null, _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 17: humanitarianSnapshot
// Generates OCHA-style humanitarian situation snapshot
// ============================================================================

export const humanitarianSnapshot = tool({
  description:
    'Generate an OCHA-style humanitarian situation snapshot for a conflict. Returns key humanitarian indicators, population movement, access constraints, funding gaps, and response priorities.',
  inputSchema: z.object({
    conflictId: z.string().describe('Conflict ID to generate humanitarian snapshot for'),
    focusSectors: z
      .array(z.enum(['food_security', 'health', 'shelter', 'wash', 'protection', 'education', 'livelihoods']))
      .optional()
      .describe('Humanitarian sectors to focus on (default: all)'),
    asOfDate: z.string().optional().describe('Snapshot reference date (ISO format, default: current)'),
  }),
  execute: async ({ conflictId, focusSectors, asOfDate }) => {
    try {
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const actors = conflict.actors.map((a) => `${a.name} (${a.type})`).join(', ');
    const events = (conflictData.events as Array<Record<string, unknown>> | undefined) ?? [];
    const humanEvents = events
      .filter((e) => String(e.type ?? '') === 'humanitarian' || String(e.description ?? '').toLowerCase().includes('humanitarian'))
      .slice(0, 8)
      .map((e) => `${e.date}: ${String(e.description ?? '').slice(0, 100)}`)
      .join('\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        conflictName: z.string(),
        snapshotDate: z.string(),
        classification: z.enum(['L1', 'L2', 'L3']).describe('IASC emergency classification level'),
        overallSeverity: z.enum(['moderate', 'serious', 'critical', 'catastrophic']),
        executiveSummary: z.string().describe('2-3 sentence top-line summary for senior leadership'),
        populationData: z.object({
          totalAffected: z.string().describe('Total affected population (number + context)'),
          displaced: z.object({
            idps: z.string().describe('Internally displaced persons'),
            refugees: z.string().describe('Refugees in neighboring countries'),
            returnees: z.string().describe('Recent returnees'),
          }),
          atRisk: z.string().describe('Population in areas at risk'),
          keyVulnerableGroups: z.array(z.string()),
        }),
        sectorIndicators: z.array(
          z.object({
            sector: z.string(),
            severityLevel: z.enum(['moderate', 'serious', 'critical', 'catastrophic']),
            keyIndicators: z.array(z.string()).describe('2-3 quantified indicators'),
            priority: z.enum(['low', 'medium', 'high', 'acute']),
            gaps: z.array(z.string()),
          })
        ),
        accessConstraints: z.array(
          z.object({
            area: z.string(),
            constraintType: z.enum(['security', 'bureaucratic', 'physical', 'combined']),
            description: z.string(),
            percentageUnreached: z.string().optional(),
            humanitarianConsequence: z.string(),
          })
        ),
        fundingStatus: z.object({
          appealName: z.string(),
          totalRequested: z.string(),
          totalReceived: z.string(),
          fundingGapPercent: z.number().min(0).max(100),
          topDonors: z.array(z.string()),
          criticallyUnderfundedSectors: z.array(z.string()),
        }),
        keyProtectionConcerns: z.array(z.string()),
        immediatePriorities: z.array(
          z.object({
            priority: z.string(),
            requiredAction: z.string(),
            responsibleActors: z.array(z.string()),
            timeline: z.string(),
          })
        ),
        contactInfo: z.object({
          ochaCoverage: z.string(),
          interclusterCoordinator: z.string(),
          mediaContact: z.string(),
        }),
        dataQualityNote: z.string().describe('Note on data sources, gaps, and reliability'),
      }) }),
      prompt: `Generate an OCHA-style humanitarian snapshot for: ${conflict.name}

CONFLICT DESCRIPTION: ${conflict.description}
KEY ACTORS: ${actors}
HUMANITARIAN EVENTS ON RECORD:
${humanEvents || 'No specific humanitarian events recorded'}

SNAPSHOT DATE: ${asOfDate || new Date().toISOString().split('T')[0]}
SECTORS TO COVER: ${focusSectors?.join(', ') || 'all sectors (food security, health, shelter, WASH, protection, education, livelihoods)'}

OCHA FORMATTING STANDARDS:
- Use IPC Phase classifications for food security (Phase 1-5)
- WHO scale for health emergencies
- UNHCR data conventions for displacement
- UN OCHA format for funding (Humanitarian Response Plan)
- Cluster system for sector coordination (Food Cluster, Health Cluster, WASH Cluster, etc.)

Generate a realistic, analytically substantive snapshot following OCHA's Situation Report format. For fictional conflicts (like Nordalia Crisis), create plausible indicators consistent with the conflict's known dynamics. Include realistic-sounding (but clearly illustrative) figures and percentages.

Lead with the most urgent/life-threatening concerns. Be frank about access constraints. Include realistic funding gaps.`,
    });

    return { ...output, conflictId, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'humanitarianSnapshot', conflictId, _generatedAt: new Date().toISOString() };
      }
      console.error('[humanitarianSnapshot]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), conflictId, _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 18: compareConflicts
// Side-by-side comparison of two conflicts across specified dimensions
// ============================================================================

export const compareConflicts = tool({
  description:
    'Run a structured side-by-side comparison of two conflicts across specified analytical dimensions. Returns comparative tables, divergence analysis, and synthesis insights.',
  inputSchema: z.object({
    conflictId1: z.string().describe('First conflict ID to compare'),
    conflictId2: z.string().describe('Second conflict ID to compare (can be a historical case name)'),
    dimensions: z
      .array(
        z.enum([
          'actors',
          'grievances',
          'escalation',
          'international_response',
          'humanitarian',
          'economics',
          'narrative',
          'peace_prospects',
        ])
      )
      .optional()
      .describe('Analytical dimensions to compare (default: all)'),
    purpose: z
      .enum(['academic', 'policy', 'operational', 'early_warning'])
      .optional()
      .describe('Purpose of the comparison (shapes depth and framing)'),
  }),
  execute: async ({ conflictId1, conflictId2, dimensions, purpose }) => {
    try {
    const conflict1 = DEMO_CONFLICT;
    const conflictData1 = conflict1 as Record<string, unknown>;
    const actors1 = conflict1.actors.slice(0, 5).map((a) => `${a.name} (${a.type})`).join(', ');
    const events1 = (conflictData1.events as Array<Record<string, unknown>> | undefined) ?? [];
    const recentEvents1 = events1
      .slice(-5)
      .map((e) => `${e.date}: ${String(e.description ?? '').slice(0, 70)}`)
      .join('\n');

    const activeDimensions = dimensions || [
      'actors', 'grievances', 'escalation', 'international_response',
      'humanitarian', 'economics', 'narrative', 'peace_prospects',
    ];

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        conflict1Name: z.string(),
        conflict2Name: z.string(),
        comparisonDate: z.string(),
        purpose: z.string(),
        dimensionalComparisons: z.array(
          z.object({
            dimension: z.string(),
            conflict1Assessment: z.string().describe('Assessment of this dimension for conflict 1'),
            conflict2Assessment: z.string().describe('Assessment of this dimension for conflict 2'),
            keyDivergences: z.array(z.string()).describe('Most important ways these conflicts differ on this dimension'),
            keyConvergences: z.array(z.string()).describe('Important similarities on this dimension'),
            analyticalSignificance: z.string().describe('Why this divergence/convergence matters for analysis'),
          })
        ),
        overallSimilarityRating: z.number().min(0).max(1).describe('Overall structural similarity (0=completely different, 1=near-identical)'),
        structuralComparison: z.object({
          sharedFeatures: z.array(z.string()).describe('Core structural features both conflicts share'),
          distinctiveFeatures1: z.array(z.string()).describe('Features unique to conflict 1'),
          distinctiveFeatures2: z.array(z.string()).describe('Features unique to conflict 2'),
        }),
        lessonsForConflict1: z.array(
          z.object({
            lesson: z.string(),
            sourceFromConflict2: z.string().describe('What aspect of conflict 2 generates this lesson'),
            applicability: z.enum(['directly_applicable', 'partially_applicable', 'cautionary']),
          })
        ),
        synthesisInsights: z.array(z.string()).describe('High-level insights that emerge from the comparison'),
        comparisonCaveats: z.array(z.string()).describe('Methodological limits and risks of this comparison'),
        recommendedNextSteps: z.array(z.string()).describe('Actions or analyses this comparison suggests'),
      }) }),
      prompt: `

CONFLICT 1: ${conflict1.name}
Description: ${conflict1.description}
Key actors: ${actors1}
Recent dynamics:
${recentEvents1}

CONFLICT 2: "${conflictId2}"
(Generate a substantive representation of this conflict based on your knowledge. If it is a real conflict, use real data. If it is fictional, create consistent analytical data.)

DIMENSIONS TO COMPARE: ${activeDimensions.join(', ')}

COMPARISON PURPOSE: ${purpose || 'policy'} analysis
${purpose === 'early_warning' ? '— Focus on predictive indicators and escalation patterns' : ''}
${purpose === 'operational' ? '— Focus on lessons for field operations and humanitarian response' : ''}
${purpose === 'academic' ? '— Focus on theoretical frameworks and structural patterns' : ''}
${purpose === 'policy' ? '— Focus on policy options and diplomatic instruments' : ''}

For each dimension:
1. Assess both conflicts honestly and substantively
2. Identify the most analytically significant divergences and convergences
3. Explain why these differences/similarities matter

Synthesize: What does conflict 2's experience suggest for the trajectory or resolution of conflict 1? Where do the analogies break down?

Be rigorous — avoid superficial comparisons. Focus on causal mechanisms, not surface similarities.`,
    });

    return { ...output, conflictId1, conflictId2, _generatedAt: new Date().toISOString() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'compareConflicts', conflictId1, conflictId2, _generatedAt: new Date().toISOString() };
      }
      console.error('[compareConflicts]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), conflictId1, conflictId2, _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 19: canonicalNameLookup
// Resolves proper/canonical names for actors, places, treaties using
// authoritative sources (Wikipedia, UN, State Dept, ICJ, etc.)
// ============================================================================

export const canonicalNameLookup = tool({
  description:
    'Look up the canonical/official name for an actor, place, treaty, organization, or concept. Uses authoritative sources (Wikipedia, UN, US State Department, ICJ, EU) to find the proper designation. Use this when the user mentions an entity and you need to verify its official name, or when standardizing names across a situation.',
  inputSchema: z.object({
    entity: z.string().describe('The name or partial name to look up'),
    entityType: z.enum(['actor', 'place', 'organization', 'treaty', 'event', 'concept']).describe('Type of entity'),
    context: z.string().optional().describe('Situation context to disambiguate'),
  }),
  execute: async ({ entity, entityType, context }) => {
    try {
    // Try Google-grounded search for authoritative sources
    const sources = [
      `"${entity}" site:wikipedia.org ${entityType}`,
      `"${entity}" site:un.org official name`,
      `"${entity}" ${entityType} official designation`,
    ];

    const allResults = [];
    for (const query of sources) {
      try {
        const results = await searchWeb(query, { numResults: 3 });
        allResults.push(...results);
      } catch {
        // Continue with other sources
      }
    }

    if (allResults.length === 0) {
      // Fallback to AI knowledge
      const { text } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        prompt: `What is the canonical/official name for "${entity}" (${entityType})?
${context ? `Context: ${context}` : ''}

Provide:
1. Official/canonical name as used by the United Nations
2. Alternative names/spellings commonly used
3. The ISO or UN designation if applicable
4. Any naming controversies or sensitivities

Be precise and cite the authoritative source for each name variant.`,
      });
      return {
        entity,
        canonicalName: entity,
        source: 'AI knowledge (no web results available)',
        analysis: text,
        webResults: [],
        _generatedAt: new Date().toISOString(),
      };
    }

    // Use AI to synthesize the authoritative name from search results
    const sourceTexts = allResults.slice(0, 5).map((r) =>
      `[${r.title}](${r.url}): ${truncate(r.description || r.content || '', 500)}`
    ).join('\n\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        canonicalName: z.string().describe('The most authoritative/official name'),
        unDesignation: z.string().optional().describe('UN official designation if different'),
        alternativeNames: z.array(z.string()).describe('Other commonly used names'),
        namingNotes: z.string().describe('Important notes about naming conventions or sensitivities'),
        sources: z.array(z.object({
          name: z.string(),
          url: z.string(),
          designation: z.string(),
        })),
      }) }),
      prompt: `

SOURCES:
${sourceTexts}

${context ? `CONTEXT: ${truncate(context)}` : ''}

Identify:
1. The most authoritative/official name (UN usage preferred)
2. Alternative names and when each is appropriate
3. Any naming sensitivities (e.g., contested territories, disputed states)
4. Which sources support which names`,
    });

    return {
      entity,
      ...output,
      webResults: allResults.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
      _generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[canonicalNameLookup]', err instanceof Error ? err.message : err);
    return { entity, canonicalName: entity, error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), webResults: [], _generatedAt: new Date().toISOString() };
  }
  },
});

// ============================================================================
// Tool 20: deepSourceResearch
// Multi-source deep research combining Google Grounding, academic databases,
// think tank reports, and government sources
// ============================================================================

export const deepSourceResearch = tool({
  description:
    'Conduct deep multi-source research on a topic. Searches across news wires, think tanks, academic sources, government reports, and specialized conflict databases. Returns synthesized findings with full source attribution and reliability scoring.',
  inputSchema: z.object({
    topic: z.string().describe('Research topic or question'),
    situationContext: z.string().optional().describe('Active situation context'),
    depth: z.enum(['quick', 'standard', 'comprehensive']).default('standard'),
    sourcePreferences: z.array(z.string()).optional().describe('Preferred sources (e.g., "Crisis Group", "UCDP", "Reuters")'),
    timeRange: z.enum(['week', 'month', 'quarter', 'year']).optional(),
  }),
  execute: async ({ topic, situationContext, depth, sourcePreferences, timeRange }) => {
    try {
    const numResults = depth === 'quick' ? 5 : depth === 'comprehensive' ? 15 : 8;

    // Build targeted queries for different source categories
    const queries = [
      topic, // General
      `${topic} site:crisisgroup.org OR site:ucdp.uu.se OR site:sipri.org`, // Think tanks and conflict data
      `${topic} site:un.org OR site:reliefweb.int`, // UN/humanitarian
      `${topic} site:reuters.com OR site:apnews.com`, // Wire services
    ];

    if (sourcePreferences?.length) {
      queries.push(`${topic} ${sourcePreferences.map((s) => `"${s}"`).join(' OR ')}`);
    }

    const allResults = [];
    for (const query of queries.slice(0, depth === 'comprehensive' ? 4 : 2)) {
      try {
        const results = await searchWeb(query, { numResults: Math.ceil(numResults / 2) });
        allResults.push(...results);
      } catch {
        // Continue
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    }).slice(0, numResults);

    if (unique.length === 0) {
      return {
        topic,
        findings: [],
        summary: 'No sources found. Google Grounding may not be configured.',
        sources: [],
        _generatedAt: new Date().toISOString(),
      };
    }

    // Synthesize findings
    const sourceTexts = unique.map((r, i) =>
      `[Source ${i + 1}] ${r.title} (${r.url})\n${(r.description || r.content || '').slice(0, 800)}`
    ).join('\n\n---\n\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        summary: z.string().describe('Executive summary of findings (2-3 paragraphs)'),
        keyFindings: z.array(z.object({
          finding: z.string(),
          confidence: z.enum(['high', 'medium', 'low']),
          sources: z.array(z.number()).describe('Source indices that support this finding'),
        })),
        emergingTrends: z.array(z.string()),
        informationGaps: z.array(z.string()),
        suggestedFollowUp: z.array(z.string()),
        conflictGrammarEntities: z.object({
          newActors: z.array(z.string()),
          newEvents: z.array(z.string()),
          newClaims: z.array(z.string()),
        }),
      }) }),
      prompt: `

RESEARCH TOPIC: ${topic}
${situationContext ? `SITUATION CONTEXT: ${situationContext}` : ''}
${timeRange ? `TIME RANGE: Last ${timeRange}` : ''}

SOURCES:
${sourceTexts}

Produce:
1. Executive summary — what does the evidence show?
2. Key findings with confidence levels and source attribution
3. Emerging trends that an analyst should watch
4. Information gaps — what we still don't know
5. Suggested follow-up research questions
6. Any new Conflict Grammar entities (actors, events, claims) discovered`,
    });

    return {
      topic,
      ...output,
      sources: unique.map((r, i) => ({
        index: i + 1,
        title: r.title || 'Untitled',
        url: r.url,
        source: (() => {
          try { return new URL(r.url).hostname.replace('www.', ''); } catch { return 'unknown'; }
        })(),
      })),
      _generatedAt: new Date().toISOString(),
    };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'deepSourceResearch', topic, sources: [], _generatedAt: new Date().toISOString() };
      }
      console.error('[deepSourceResearch]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), topic, sources: [], _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 21: verifyAndStandardize
// Cross-references claims, dates, and facts against multiple sources
// ============================================================================

export const verifyAndStandardize = tool({
  description:
    'Verify a claim, date, statistic, or fact against multiple authoritative sources. Cross-references to confirm accuracy and provides the standardized/official version. Use this before including contested facts in reports.',
  inputSchema: z.object({
    claim: z.string().describe('The claim or fact to verify'),
    claimType: z.enum(['date', 'statistic', 'event', 'quote', 'designation', 'general']),
    context: z.string().optional(),
  }),
  execute: async ({ claim, claimType: _claimType, context }) => {
    try {
    // Search for verification
    const verifyResults = await searchWeb(`"${claim}" verify fact check`, { numResults: 5 }).catch(() => []);
    const officialResults = await searchWeb(`"${claim}" site:un.org OR site:reuters.com OR site:icj-cij.org`, { numResults: 3 }).catch(() => []);

    const allSources = [...verifyResults, ...officialResults].slice(0, 6);
    const sourceTexts = allSources.map((r) =>
      `${r.title} (${r.url}): ${(r.description || '').slice(0, 300)}`
    ).join('\n');

    const { output } = await generateText({
      model: getModel(),
      abortSignal: timeoutSignal(),
      output: Output.object({ schema: z.object({
        verified: z.boolean().describe('Whether the claim is verified as accurate'),
        confidence: z.enum(['confirmed', 'likely', 'contested', 'unverified', 'false']),
        standardizedVersion: z.string().describe('The corrected/standardized version of the claim'),
        discrepancies: z.array(z.string()).describe('Any discrepancies found between sources'),
        notes: z.string().describe('Important caveats or context'),
      }) }),
      prompt: `
${context ? `Context: ${context}` : ''}

Sources found:
${sourceTexts || 'No sources available — use general knowledge with appropriate caveats.'}

Assess:
1. Is this claim accurate?
2. What is the standardized/official version?
3. Are there any discrepancies between sources?
4. What caveats should accompany this claim in a diplomatic document?`,
    });

    return {
      claim,
      ...output,
      sources: allSources.map((r) => ({ title: r.title, url: r.url })),
      _generatedAt: new Date().toISOString(),
    };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'verifyAndStandardize', claim, sources: [], _generatedAt: new Date().toISOString() };
      }
      console.error('[verifyAndStandardize]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), claim, sources: [], _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 22: stakeholderInfluenceMap
// Maps stakeholders on a power-interest grid using Mendelow's matrix
// ============================================================================

export const stakeholderInfluenceMap = tool({
  description:
    'Map stakeholders on a power-interest grid using Mendelow\'s Power-Interest Matrix. Identifies who to engage, inform, consult, and monitor. Returns quadrant assignments, engagement strategies, and coalition building opportunities.',
  inputSchema: z.object({
    actors: z.array(z.string()).describe('List of actors/stakeholders to map'),
    situationContext: z.string().describe('Description of the conflict or situation context'),
    analysisScope: z.string().optional().describe('Optional scope or focus of the analysis'),
  }),
  execute: async ({ actors, situationContext, analysisScope }) => {
    try {
      const { output } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          quadrants: z.object({
            manageClosely: z.array(z.object({
              actor: z.string(),
              power: z.number(),
              interest: z.number(),
              rationale: z.string(),
              engagementStrategy: z.string(),
            })),
            keepSatisfied: z.array(z.object({
              actor: z.string(),
              power: z.number(),
              interest: z.number(),
              rationale: z.string(),
              engagementStrategy: z.string(),
            })),
            keepInformed: z.array(z.object({
              actor: z.string(),
              power: z.number(),
              interest: z.number(),
              rationale: z.string(),
              engagementStrategy: z.string(),
            })),
            monitor: z.array(z.object({
              actor: z.string(),
              power: z.number(),
              interest: z.number(),
              rationale: z.string(),
              engagementStrategy: z.string(),
            })),
          }),
          coalitionOpportunities: z.array(z.string()),
          spoilerRisks: z.array(z.string()),
          recommendations: z.string(),
        }) }),
        prompt: `

Situation: ${truncate(situationContext, 3000)}
${analysisScope ? `Analysis Scope: ${analysisScope}` : ''}

Actors to map: ${actors.join(', ')}

For each actor, assess:
- Power (0-10): Ability to influence outcomes, resources, political capital, veto power
- Interest (0-10): Level of stake in the situation outcome, motivation to act

Assign each actor to the appropriate quadrant:
- Manage Closely (High Power, High Interest): Key players — engage intensively
- Keep Satisfied (High Power, Low Interest): Latent stakeholders — keep content but don't overburden
- Keep Informed (Low Power, High Interest): Active supporters/critics — communicate regularly
- Monitor (Low Power, Low Interest): Peripheral stakeholders — watch for changes

Also identify coalition-building opportunities between complementary stakeholders and spoiler risks from actors whose interests are threatened.`,
      });

      return {
        ...output,
        actors,
        framework: "Mendelow's Power-Interest Matrix (1991)",
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'stakeholderInfluenceMap', _generatedAt: new Date().toISOString() };
      }
      console.error('[stakeholderInfluenceMap]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), toolName: 'stakeholderInfluenceMap', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 23: ceasefireMonitor
// Analyzes ceasefire compliance using UN DPKO monitoring methodology
// ============================================================================

export const ceasefireMonitor = tool({
  description:
    'Analyze ceasefire compliance and violation patterns using UN DPKO monitoring methodology. Assesses compliance per party, identifies violation patterns, and estimates collapse risk.',
  inputSchema: z.object({
    conflictContext: z.string().describe('Description of the conflict and ceasefire context'),
    parties: z.array(z.string()).describe('List of parties to the ceasefire'),
    ceasefireDate: z.string().optional().describe('Date the ceasefire was agreed or entered into force'),
    terms: z.string().optional().describe('Key terms of the ceasefire agreement'),
    recentEvents: z.string().optional().describe('Recent incidents or events affecting compliance'),
  }),
  execute: async ({ conflictContext, parties, ceasefireDate, terms, recentEvents }) => {
    try {
      const { output } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          complianceScores: z.array(z.object({
            party: z.string(),
            score: z.number().min(0).max(100),
            violations: z.array(z.string()),
            trends: z.string(),
          })),
          overallStatus: z.enum(['holding', 'fragile', 'deteriorating', 'collapsed']),
          violationPatterns: z.array(z.string()),
          riskOfCollapse: z.number().min(0).max(1),
          monitoringGaps: z.array(z.string()),
          recommendations: z.array(z.string()),
          timelineToCollapse: z.string(),
        }) }),
        prompt: `

Conflict Context: ${truncate(conflictContext, 3000)}
Parties: ${parties.join(', ')}
${ceasefireDate ? `Ceasefire Date: ${ceasefireDate}` : ''}
${terms ? `Ceasefire Terms: ${truncate(terms, 1500)}` : ''}
${recentEvents ? `Recent Events: ${truncate(recentEvents, 1500)}` : ''}

Assess:
1. Compliance score (0-100) for each party, listing specific violations and trends
2. Overall ceasefire status: holding / fragile / deteriorating / collapsed
3. Recurring violation patterns (e.g., use of prohibited weapons, access denial, provocation tactics)
4. Risk of collapse (0.0-1.0): 0 = stable, 1.0 = imminent breakdown
5. Monitoring gaps: what the international community cannot observe
6. Actionable recommendations for the monitoring mission
7. Estimated timeline to collapse if deterioration continues unchecked`,
      });

      return {
        ...output,
        parties,
        methodology: 'UN DPKO Ceasefire Monitoring Methodology',
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'ceasefireMonitor', _generatedAt: new Date().toISOString() };
      }
      console.error('[ceasefireMonitor]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), toolName: 'ceasefireMonitor', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 24: peaceAgreementAnalyzer
// Analyzes peace agreement provisions using PA-X Database categories
// ============================================================================

export const peaceAgreementAnalyzer = tool({
  description:
    'Analyze peace agreement provisions, implementation status, and gaps using PA-X Peace Agreements Database categories. Identifies critical implementation gaps and makes recommendations.',
  inputSchema: z.object({
    agreementText: z.string().describe('The text or summary of the peace agreement to analyze'),
    parties: z.array(z.string()).describe('Parties to the agreement'),
    signedDate: z.string().optional().describe('Date the agreement was signed'),
    situationContext: z.string().optional().describe('Current situation context for implementation assessment'),
  }),
  execute: async ({ agreementText, parties, signedDate, situationContext }) => {
    try {
      const { output } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          provisions: z.array(z.object({
            category: z.string(),
            provision: z.string(),
            status: z.enum(['implemented', 'partial', 'pending', 'violated', 'unknown']),
            implementationGaps: z.string(),
            criticality: z.enum(['critical', 'high', 'medium', 'low']),
          })),
          overallImplementation: z.number().min(0).max(100),
          criticalGaps: z.array(z.string()),
          spoilerThreats: z.array(z.string()),
          recommendations: z.array(z.string()),
          riskAssessment: z.string(),
        }) }),
        prompt: `

Agreement Text: ${truncate(agreementText, 5000)}
Parties: ${parties.join(', ')}
${signedDate ? `Signed: ${signedDate}` : ''}
${situationContext ? `Current Situation: ${truncate(situationContext, 2000)}` : ''}

PA-X Database categories to assess (where relevant):
- Security arrangements (ceasefire, DDR, SSR, transitional security)
- Power sharing (executive, legislative, judicial, electoral)
- Territorial arrangements (autonomy, federalism, decentralization)
- Rights provisions (human rights, minority rights, women's rights, IHL)
- Transitional justice (accountability, reparations, truth commissions)
- Economic provisions (resource sharing, reconstruction, sanctions)
- Implementation mechanisms (verification, monitoring, guarantors)
- Spoiler management provisions

For each provision found:
- Identify the PA-X category
- Assess implementation status: implemented / partial / pending / violated / unknown
- Describe implementation gaps
- Rate criticality: critical / high / medium / low

Provide overall implementation score (0-100), critical gaps summary, spoiler threats, and recommendations.`,
      });

      return {
        ...output,
        parties,
        signedDate,
        framework: 'PA-X Peace Agreements Database',
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'peaceAgreementAnalyzer', _generatedAt: new Date().toISOString() };
      }
      console.error('[peaceAgreementAnalyzer]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), toolName: 'peaceAgreementAnalyzer', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 25: earlyWarningBrief
// Generates early warning intelligence brief using CEWARN/IGAD methodology
// ============================================================================

export const earlyWarningBrief = tool({
  description:
    'Generate a focused early warning intelligence brief using CEWARN/IGAD methodology. Identifies trigger events, alert level, and actionable recommendations with timeline estimates.',
  inputSchema: z.object({
    conflictContext: z.string().describe('Description of the conflict situation and current dynamics'),
    recentEvents: z.string().optional().describe('Recent events, incidents, or developments'),
    region: z.string().optional().describe('Geographic region or area of focus'),
    timeHorizon: z.enum(['72hours', '1week', '30days', '90days']).optional().describe('Early warning time horizon'),
  }),
  execute: async ({ conflictContext, recentEvents, region, timeHorizon }) => {
    try {
      const { output } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          alertLevel: z.enum(['green', 'yellow', 'orange', 'red']),
          alertLevelJustification: z.string(),
          keyIndicators: z.array(z.object({
            indicator: z.string(),
            status: z.enum(['normal', 'elevated', 'critical']),
            trend: z.string(),
          })),
          triggerEvents: z.array(z.string()),
          windowOfOpportunity: z.string(),
          recommendedActions: z.array(z.object({
            action: z.string(),
            timeline: z.string(),
            actor: z.string(),
          })),
          timelineToEscalation: z.string(),
          informationGaps: z.array(z.string()),
        }) }),
        prompt: `

Conflict Context: ${truncate(conflictContext, 3000)}
${recentEvents ? `Recent Events: ${truncate(recentEvents, 1500)}` : ''}
${region ? `Region: ${region}` : ''}
Time Horizon: ${timeHorizon || '30days'}

CEWARN Alert Levels:
- GREEN: Peaceful situation, no significant risk indicators
- YELLOW: Tension rising, early warning indicators present, monitor closely
- ORANGE: High alert, significant risk of violent escalation, preventive action required
- RED: Crisis imminent or ongoing, emergency response required

Assess the following CEWARN/IGAD indicators:
- Political indicators (governance failure, election tensions, power disputes)
- Security indicators (armed group mobilization, arms flows, troop movements)
- Socioeconomic indicators (displacement, food insecurity, resource competition)
- Human rights indicators (violations, targeted violence, hate speech)
- Cross-border indicators (refugee flows, regional spillover)

Identify:
1. Alert level with justification
2. Key indicators by status (normal/elevated/critical) with trends
3. Trigger events that could precipitate escalation within the time horizon
4. Window of opportunity for preventive action
5. Recommended actions with timelines and responsible actors
6. Timeline estimate to escalation if no action taken
7. Critical information gaps`,
      });

      return {
        ...output,
        region,
        timeHorizon: timeHorizon || '30days',
        methodology: 'CEWARN/IGAD Early Warning Methodology',
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'earlyWarningBrief', _generatedAt: new Date().toISOString() };
      }
      console.error('[earlyWarningBrief]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), toolName: 'earlyWarningBrief', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 26: gameTheoryAnalysis
// Analyzes strategic interactions using formal game theory
// ============================================================================

export const gameTheoryAnalysis = tool({
  description:
    'Analyze strategic interactions between conflict actors using formal game theory. Identifies game type, Nash equilibria, dominant strategies, and cooperation conditions. Uses Gemini Pro for complex strategic reasoning.',
  inputSchema: z.object({
    actors: z.array(z.string()).describe('List of actors in the strategic interaction'),
    strategies: z.record(z.string(), z.array(z.string())).optional().describe('Optional map of actor to their available strategies'),
    conflictContext: z.string().describe('Description of the conflict and strategic situation'),
    specificQuestion: z.string().optional().describe('Specific strategic question to answer'),
  }),
  execute: async ({ actors, strategies, conflictContext, specificQuestion }) => {
    try {
      const strategiesText = strategies
        ? Object.entries(strategies).map(([actor, strats]) => `${actor}: ${strats.join(', ')}`).join('\n')
        : null;

      const { output } = await generateText({
        model: getProModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          gameType: z.string(),
          gameArchetype: z.enum(['prisoners_dilemma', 'chicken', 'stag_hunt', 'assurance', 'zero_sum', 'coordination', 'mixed']),
          payoffMatrix: z.array(z.array(z.string())),
          nashEquilibria: z.array(z.object({
            strategies: z.record(z.string(), z.string()),
            outcome: z.string(),
            stability: z.string(),
          })),
          dominantStrategies: z.array(z.object({
            actor: z.string(),
            strategy: z.string(),
            rationale: z.string(),
          })),
          cooperationConditions: z.array(z.string()),
          schellingFocalPoints: z.array(z.string()),
          analysis: z.string(),
          policyImplications: z.array(z.string()),
        }) }),
        prompt: `

Frameworks: Nash (1950), Schelling (1960), Fearon (1995)

Actors: ${actors.join(', ')}
${strategiesText ? `Available Strategies:\n${strategiesText}` : ''}
Conflict Context: ${truncate(conflictContext, 4000)}
${specificQuestion ? `Specific Question: ${specificQuestion}` : ''}

Analyze:
1. Game Type: Describe the nature of this strategic interaction
2. Game Archetype: Classify as one of: prisoners_dilemma, chicken, stag_hunt, assurance, zero_sum, coordination, mixed
3. Payoff Matrix: Construct a payoff matrix (rows = strategies of actor 1, columns = strategies of actor 2+)
   - Each cell should show outcomes like "(Cooperate/Defect, 3/1)" in string format
4. Nash Equilibria: Identify all Nash equilibria — strategy profiles where no actor benefits from unilateral deviation
   - For each: specify strategies chosen, outcome, and stability assessment
5. Dominant Strategies: Identify any dominant strategies per actor with rationale
6. Cooperation Conditions: What conditions would enable cooperative outcomes?
   - Apply Schelling's focal points theory and repeated game logic
7. Schelling Focal Points: Identify salient coordination points that actors might gravitate toward
8. Analysis: Comprehensive strategic analysis explaining the game dynamics (Fearon's rationalist explanations for war if applicable)
9. Policy Implications: Actionable recommendations for mediators, guarantors, and international actors`,
      });

      return {
        ...output,
        actors,
        frameworks: ['Nash (1950)', 'Schelling (1960)', 'Fearon (1995)'],
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'gameTheoryAnalysis', _generatedAt: new Date().toISOString() };
      }
      console.error('[gameTheoryAnalysis]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), toolName: 'gameTheoryAnalysis', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool 27: protectionOfCiviliansAssessment
// Assesses PoC situation using OCHA framework and IHL/IHRL standards
// ============================================================================

export const protectionOfCiviliansAssessment = tool({
  description:
    'Assess protection of civilians (PoC) situation using OCHA PoC framework and IHL/IHRL standards. Identifies threats, legal violations, protection gaps, and priority actions.',
  inputSchema: z.object({
    conflictContext: z.string().describe('Description of the conflict and humanitarian situation'),
    actors: z.array(z.string()).describe('Armed actors and parties to the conflict'),
    recentEvents: z.string().optional().describe('Recent incidents affecting civilians'),
    affectedAreas: z.string().optional().describe('Geographic areas and communities affected'),
  }),
  execute: async ({ conflictContext, actors, recentEvents, affectedAreas }) => {
    try {
      const { output } = await generateText({
        model: getModel(),
        abortSignal: timeoutSignal(),
        output: Output.object({ schema: z.object({
          pocThreats: z.array(z.object({
            threat: z.string(),
            responsibleActors: z.array(z.string()),
            severity: z.enum(['critical', 'high', 'medium', 'low']),
            affectedPopulation: z.string(),
            trend: z.enum(['increasing', 'stable', 'decreasing']),
          })),
          ihrlViolations: z.array(z.object({
            violation: z.string(),
            article: z.string(),
            perpetrators: z.array(z.string()),
          })),
          ihlViolations: z.array(z.object({
            violation: z.string(),
            genevaReference: z.string(),
            perpetrators: z.array(z.string()),
          })),
          protectionGaps: z.array(z.string()),
          recommendations: z.array(z.object({
            action: z.string(),
            actor: z.string(),
            urgency: z.enum(['immediate', 'short-term', 'medium-term']),
          })),
          overallPoCSituation: z.enum(['critical', 'severe', 'serious', 'concerning', 'stable']),
        }) }),
        prompt: `

Conflict Context: ${truncate(conflictContext, 3000)}
Conflict Parties/Armed Actors: ${actors.join(', ')}
${recentEvents ? `Recent Incidents: ${truncate(recentEvents, 1500)}` : ''}
${affectedAreas ? `Affected Areas: ${affectedAreas}` : ''}

Apply the OCHA three-pillar PoC framework:
1. Protection through dialogue and engagement
2. Provision of physical protection
3. Establishment of a protective environment

Assess threats to civilians across:
- Direct targeting (indiscriminate attacks, deliberate targeting of civilians)
- Conflict-induced harm (displacement, family separation, access to aid)
- Abuse of power (arbitrary detention, torture, sexual violence)

For IHL violations, reference Geneva Conventions and Additional Protocols:
- Geneva Convention IV (civilian protection)
- Additional Protocol I Articles 48, 51, 52, 54 (distinction, proportionality, precaution)
- Common Article 3 (non-international armed conflicts)

For IHRL violations, reference key instruments:
- ICCPR Articles (right to life Art.6, prohibition of torture Art.7, liberty Art.9)
- ICESCR (economic and social rights violations)
- CEDAW (gender-based violence)
- CRC (child protection)

Rate each threat by severity (critical/high/medium/low) and trend (increasing/stable/decreasing).
Identify protection gaps — what is not being done that should be.
Recommend priority actions with responsible actors and urgency levels.
Provide overall PoC situation rating: critical / severe / serious / concerning / stable.`,
      });

      return {
        ...output,
        actors,
        framework: 'OCHA Protection of Civilians Framework + IHL/IHRL',
        _generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return { error: true, message: 'Tool timed out after 30s', toolName: 'protectionOfCiviliansAssessment', _generatedAt: new Date().toISOString() };
      }
      console.error('[protectionOfCiviliansAssessment]', err instanceof Error ? err.message : err);
      return { error: true, message: 'Tool failed: ' + (err instanceof Error ? err.message : String(err)), toolName: 'protectionOfCiviliansAssessment', _generatedAt: new Date().toISOString() };
    }
  },
});

// ============================================================================
// Tool Registry
// ============================================================================

export const tacitusTools = {
  webSearch,
  analyzeDocument,
  queryConflictGraph,
  draftSection,
  editForDiplomaticTone,
  analyzeMediaSource,
  compareMediaCoverage,
  checkUNTerminology,
  draftResolutionLanguage,
  generateTalkingPoints,
  escalationAssessment,
  negotiationSpaceAnalysis,
  narrativeEcosystemMap,
  historicalParallelsAnalysis,
  generateTimeline,
  sanctionsCheck,
  humanitarianSnapshot,
  compareConflicts,
  canonicalNameLookup,
  deepSourceResearch,
  verifyAndStandardize,
  stakeholderInfluenceMap,
  ceasefireMonitor,
  peaceAgreementAnalyzer,
  earlyWarningBrief,
  gameTheoryAnalysis,
  protectionOfCiviliansAssessment,
};

export type TacitusToolName = keyof typeof tacitusTools;

// ============================================================================
// Situation-Aware Tool Factory
// Creates tool instances bound to the current user's active situation.
// Use this in the chat route instead of the static tacitusTools export.
// ============================================================================

export interface SituationToolContext {
  name: string;
  description: string;
  actorSummary: string;
  eventSummary: string;
  region: string;
  glaslStage?: number;
  riskScore?: number;
  // Extended context for newly-bound tools (all optional for backwards compat)
  claimsSummary?: string;
  interestsSummary?: string;
  constraintsSummary?: string;
  commitmentsSummary?: string;
  narrativesSummary?: string;
  humanitarianSummary?: string;
}

export interface ConflictGraphSnapshot {
  nodes: Array<{ id: string; type: string; label: string; properties?: Record<string, unknown> }>;
  edges: Array<{ source: string; target: string; type: string; label?: string }>;
}

/**
 * Creates situation-bound tool instances for the authenticated chat route.
 * Tools that used to hardcode DEMO_CONFLICT will now use real situation data.
 *
 * @param situationCtx - Structured context from the user's active situation
 * @param graphSnapshot - Pre-fetched conflict graph data from Firestore (optional)
 */
export function createSituationBoundTools(
  situationCtx?: SituationToolContext | null,
  graphSnapshot?: ConflictGraphSnapshot | null,
) {
  // Derive a context string for prompt injection
  const ctxName = situationCtx?.name ?? DEMO_CONFLICT.name;
  const ctxDescription = situationCtx?.description ?? DEMO_CONFLICT.description;
  const ctxActors = situationCtx?.actorSummary ?? DEMO_CONFLICT.actors.slice(0, 5).map((a) => `${a.name}: ${a.description.slice(0, 80)}`).join('\n');
  const ctxEvents = situationCtx?.eventSummary ?? '';
  const ctxRegion = situationCtx?.region ?? 'Unknown region';
  const isRealSituation = !!situationCtx;

  // --- Bound: queryConflictGraph ---
  // Uses the pre-fetched graph snapshot when available; falls back to DEMO_CONFLICT.
  const boundQueryConflictGraph = tool({
    description: queryConflictGraph.description,
    inputSchema: queryConflictGraph.inputSchema,
    execute: async ({ conflictId, entityType, actorId, query }) => {
      try {
        // If we have a real graph snapshot, use it
        if (isRealSituation && graphSnapshot) {
          const { nodes, edges } = graphSnapshot;
          let results: unknown[] = [];
          switch (entityType) {
            case 'actor':
              results = nodes.filter((n) => n.type === 'actor');
              break;
            case 'event':
              results = nodes.filter((n) => n.type === 'event');
              break;
            case 'relationship':
              results = edges;
              break;
            case 'all':
              results = [
                ...nodes.map((n) => ({ ...n, _entityType: n.type })),
                ...edges.map((e) => ({ ...e, _entityType: 'relationship' })),
              ];
              break;
            default:
              results = nodes.filter((n) => n.type === entityType);
          }
          if (actorId) {
            results = results.filter((e) => {
              const entity = e as Record<string, unknown>;
              return entity.id === actorId || entity.source === actorId || entity.target === actorId;
            });
          }
          return {
            conflictId,
            conflictName: ctxName,
            entityType,
            query: query ?? null,
            results: results.slice(0, 25),
            totalCount: results.length,
            dataSource: 'live_situation',
            _generatedAt: new Date().toISOString(),
          };
        }

        // No graph data available — return descriptive context from situation
        if (isRealSituation) {
          return {
            conflictId,
            conflictName: ctxName,
            entityType,
            query: query ?? null,
            results: [],
            totalCount: 0,
            dataSource: 'no_graph_data',
            note: `The conflict graph for "${ctxName}" has not been populated yet. Use the Conflict Graph tool to build the knowledge graph, then retry.`,
            _generatedAt: new Date().toISOString(),
          };
        }

        // Fall back to DEMO_CONFLICT for demo users
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (queryConflictGraph.execute as any)({ conflictId, entityType, actorId, query });
      } catch (err) {
        console.error('[boundQueryConflictGraph]', err instanceof Error ? err.message : err);
        return { error: true, message: 'Tool failed', conflictId, conflictName: ctxName, entityType, query: query ?? null, results: [], totalCount: 0, _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: escalationAssessment ---
  // Uses real situation context instead of DEMO_CONFLICT.
  const boundEscalationAssessment = tool({
    description: escalationAssessment.description,
    inputSchema: escalationAssessment.inputSchema,
    execute: async ({ conflictId: _conflictId, specificConcern, timeHorizon }) => {
      try {
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({
            schema: z.object({
              conflictName: z.string(),
              currentStage: z.number().min(1).max(9),
              stageName: z.string(),
              stageDescription: z.string(),
              escalationTrend: z.enum(['escalating', 'stable', 'de-escalating', 'volatile']),
              trendExplanation: z.string(),
              keyDrivers: z.array(z.object({ driver: z.string(), actorsInvolved: z.array(z.string()), severity: z.enum(['low', 'medium', 'high', 'critical']) })),
              deEscalationOpportunities: z.array(z.object({ opportunity: z.string(), requiredConditions: z.string(), feasibility: z.enum(['low', 'medium', 'high']), leadActors: z.array(z.string()) })),
              triggerRisks: z.array(z.object({ trigger: z.string(), likelihood: z.enum(['low', 'medium', 'high']), potentialImpact: z.string(), earlyWarningIndicators: z.array(z.string()) })),
              recommendedActions: z.array(z.string()),
              analystConfidence: z.enum(['low', 'medium', 'high']),
              assessmentCaveats: z.array(z.string()),
            }),
          }),
          prompt: `Analyze conflict escalation using the Glasl 9-stage model.

SITUATION: ${ctxName}
REGION: ${ctxRegion}
DESCRIPTION: ${truncate(ctxDescription)}
KEY ACTORS: ${ctxActors}
${ctxEvents ? `RECENT EVENTS:\n${ctxEvents}` : ''}
${specificConcern ? `SPECIFIC CONCERN: ${specificConcern}` : ''}
TIME HORIZON: ${timeHorizon || 'short_term'} (immediate=72hrs, short_term=1-4wks, medium_term=1-3mo)

GLASL 9-STAGE MODEL: 1 Hardening→2 Debates→3 Actions→4 Coalitions→5 Loss of face→6 Threats→7 Limited blows→8 Fragmentation→9 Abyss

Provide: current stage, key drivers, de-escalation opportunities, trigger risks, and recommended actions with confidence level and caveats.`,
        });
        return { ...output, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'escalationAssessment', _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: generateTalkingPoints ---
  const boundGenerateTalkingPoints = tool({
    description: generateTalkingPoints.description,
    inputSchema: generateTalkingPoints.inputSchema,
    execute: async ({ topic, audience, position, conflictId, maxPoints }) => {
      try {
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({
            schema: z.object({
              topic: z.string(),
              audience: z.string(),
              position: z.string(),
              talkingPoints: z.array(z.object({ point: z.string(), supporting: z.array(z.string()), sensitivityNote: z.string() })),
              anticipatedQuestions: z.array(z.object({ question: z.string(), suggestedResponse: z.string() })),
              keyMessages: z.array(z.string()),
              avoidList: z.array(z.string()),
            }),
          }),
          prompt: `Generate structured talking points on: "${topic}"

SITUATION: ${ctxName} (${ctxRegion})
DESCRIPTION: ${truncate(ctxDescription, 500)}
KEY ACTORS: ${ctxActors}
AUDIENCE: ${audience.replace(/_/g, ' ')}
POSITION: ${position || 'UN Secretary-General / SRSG'}
POINTS REQUESTED: ${maxPoints || 5}

For each talking point: main point (1-2 sentences), 2-3 supporting facts, diplomatic sensitivity note.
Also provide: 3 anticipated questions with suggested responses, 3 key messages that must land, phrases/framings to avoid for this audience.`,
        });
        return { ...output, conflictId: conflictId ?? null, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'generateTalkingPoints', topic: '', audience: '', position: '', talkingPoints: [], anticipatedQuestions: [], keyMessages: [], avoidList: [], conflictId: null, _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), topic: '', audience: '', position: '', talkingPoints: [], anticipatedQuestions: [], keyMessages: [], avoidList: [], conflictId: null, _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: draftSection ---
  const boundDraftSection = tool({
    description: draftSection.description,
    inputSchema: draftSection.inputSchema,
    execute: async ({ sectionTitle, templateType, conflictId: _conflictId, instructions, wordLimit, tone }) => {
      try {
        const { text } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          system: DIPLOMATIC_SYSTEM_PROMPT,
          prompt: `Draft the "${sectionTitle}" section for a ${templateType.replace(/_/g, ' ')} report.

SITUATION: ${ctxName} (${ctxRegion})
DESCRIPTION: ${truncate(ctxDescription, 600)}
KEY ACTORS: ${ctxActors}
${ctxEvents ? `RECENT EVENTS:\n${ctxEvents}` : ''}
${instructions ? `SPECIAL INSTRUCTIONS: ${truncate(instructions)}` : ''}
TONE: ${tone || 'formal diplomatic'}
TARGET LENGTH: ~${wordLimit || 300} words

Requirements:
- Use standard UN formatting and language conventions
- Include bracketed source references where appropriate
- Use calibrated confidence language
- Maintain strict impartiality
- Structure with clear topic sentences and analytical depth`,
        });
        return { sectionTitle, content: text, wordCount: text.split(/\s+/).length, templateType, status: 'draft' as const, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'draftSection', sectionTitle, content: '', wordCount: 0, templateType, status: 'draft' as const, _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), sectionTitle, content: '', wordCount: 0, templateType, status: 'draft' as const, _generatedAt: new Date().toISOString() };
      }
    },
  });

  const ctxInterests = situationCtx?.interestsSummary ?? '';
  const ctxConstraints = situationCtx?.constraintsSummary ?? '';
  const ctxCommitments = situationCtx?.commitmentsSummary ?? '';
  const ctxNarratives = situationCtx?.narrativesSummary ?? '';

  // --- Bound: negotiationSpaceAnalysis ---
  const boundNegotiationSpaceAnalysis = tool({
    description: negotiationSpaceAnalysis.description,
    inputSchema: negotiationSpaceAnalysis.inputSchema,
    execute: async ({ conflictId: _conflictId, issuesOfFocus, mediationContext }) => {
      if (!isRealSituation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (negotiationSpaceAnalysis.execute as any)({ conflictId: _conflictId, issuesOfFocus, mediationContext });
      }
      try {
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({ schema: z.object({
            conflictName: z.string(),
            parties: z.array(z.object({ name: z.string(), statedPosition: z.string(), underlyingInterests: z.array(z.string()), batna: z.string(), redLines: z.array(z.string()), flexibilityAreas: z.array(z.string()), negotiatingStrength: z.enum(['strong', 'moderate', 'weak']) })),
            issueAnalysis: z.array(z.object({ issue: z.string(), zopaExists: z.boolean(), zopaDescription: z.string().optional(), mainObstacles: z.array(z.string()), potentialFormulations: z.array(z.string()) })),
            potentialTradeoffs: z.array(z.object({ party1: z.string(), concession1: z.string(), party2: z.string(), concession2: z.string(), feasibility: z.enum(['low', 'medium', 'high']) })),
            dealProbability: z.number().min(0).max(1),
            dealProbabilityRationale: z.string(),
            criticalPathToAgreement: z.array(z.string()),
            spoilerRisks: z.array(z.string()),
            mediatorRecommendations: z.array(z.string()),
          }) }),
          prompt: `Conduct a negotiation space analysis.

SITUATION: ${ctxName} (${ctxRegion})
DESCRIPTION: ${truncate(ctxDescription)}
KEY ACTORS: ${ctxActors}
${ctxInterests ? `MAPPED INTERESTS:\n${ctxInterests}` : ''}
${ctxConstraints ? `CONSTRAINTS:\n${ctxConstraints}` : ''}
${ctxCommitments ? `EXISTING COMMITMENTS:\n${ctxCommitments}` : ''}
${issuesOfFocus ? `FOCUS ISSUES: ${issuesOfFocus.join(', ')}` : ''}
${mediationContext ? `MEDIATION CONTEXT: ${mediationContext}` : ''}

Map stated positions vs. underlying interests, BATNA, red lines, flexibility areas, deal probability (0-1), critical path to agreement, spoiler risks, and mediator strategy recommendations.`,
        });
        return { ...output, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'negotiationSpaceAnalysis', _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: narrativeEcosystemMap ---
  const boundNarrativeEcosystemMap = tool({
    description: narrativeEcosystemMap.description,
    inputSchema: narrativeEcosystemMap.inputSchema,
    execute: async ({ conflictId: _conflictId, focus, audienceFocus }) => {
      if (!isRealSituation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (narrativeEcosystemMap.execute as any)({ conflictId: _conflictId, focus, audienceFocus });
      }
      try {
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({ schema: z.object({
            conflictName: z.string(),
            dominantNarratives: z.array(z.object({ narrativeName: z.string(), coreFraming: z.string(), promotedBy: z.array(z.string()), targetAudiences: z.array(z.string()), mediaChannels: z.array(z.string()), strength: z.enum(['weak', 'moderate', 'strong', 'hegemonic']), vulnerabilities: z.string() })),
            counterNarratives: z.array(z.object({ narrativeName: z.string(), contestedClaim: z.string(), alternativeFraming: z.string(), promotedBy: z.array(z.string()), effectiveness: z.enum(['ineffective', 'limited', 'moderate', 'effective']) })),
            emergingNarratives: z.array(z.object({ narrativeName: z.string(), description: z.string(), potentialImpact: z.string(), earlyIndicators: z.array(z.string()) })),
            narrativeClashes: z.array(z.object({ clash: z.string(), partiesInvolved: z.array(z.string()), stakes: z.string() })),
            misinformationRisks: z.array(z.object({ claim: z.string(), likelihood: z.enum(['low', 'medium', 'high']), potentialImpact: z.string(), countermeasures: z.array(z.string()) })),
            informationEnvironmentAssessment: z.string(),
            strategicCommunicationRecommendations: z.array(z.string()),
          }) }),
          prompt: `Map the narrative ecosystem of this conflict.

SITUATION: ${ctxName} (${ctxRegion})
DESCRIPTION: ${truncate(ctxDescription)}
KEY ACTORS: ${ctxActors}
${ctxNarratives ? `EXISTING NARRATIVE DATA:\n${ctxNarratives}` : ''}
${focus ? `ANALYTICAL FOCUS: ${focus}` : ''}
${audienceFocus ? `AUDIENCE FOCUS: ${audienceFocus}` : ''}

Map dominant narratives, counter-narratives, emerging narratives, narrative clashes, misinformation risks, and provide strategic communication recommendations.`,
        });
        return { ...output, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'narrativeEcosystemMap', _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: historicalParallelsAnalysis ---
  const boundHistoricalParallelsAnalysis = tool({
    description: historicalParallelsAnalysis.description,
    inputSchema: historicalParallelsAnalysis.inputSchema,
    execute: async ({ conflictId, dimension, timeframe }) => {
      if (!isRealSituation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (historicalParallelsAnalysis.execute as any)({ conflictId, dimension, timeframe });
      }
      try {
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({ schema: z.object({
            conflictName: z.string(),
            analysisScope: z.string(),
            parallels: z.array(z.object({ historicalCase: z.string(), period: z.string(), region: z.string(), similarityScore: z.number().min(0).max(1), keyParallels: z.array(z.string()), keyDifferences: z.array(z.string()), outcome: z.string(), lessonsLearned: z.array(z.string()), cautionaryNotes: z.array(z.string()), relevantSources: z.array(z.string()) })),
            crossCuttingInsights: z.array(z.string()),
            keyDivergenceFromHistory: z.string(),
            analystNotes: z.string(),
          }) }),
          prompt: `Identify historical conflict parallels.

SITUATION: ${ctxName} (${ctxRegion})
DESCRIPTION: ${truncate(ctxDescription)}
KEY ACTORS: ${ctxActors}
${ctxEvents ? `RECENT DYNAMICS:\n${ctxEvents}` : ''}

ANALYSIS DIMENSION: ${dimension || 'all dimensions'}
TIMEFRAME: ${timeframe === 'cold_war' ? '1947-1991' : timeframe === 'post_cold_war' ? '1991-2000' : timeframe === 'post_2000' ? '2000-present' : 'any period in modern history'}

Identify 3-5 historical cases with meaningful structural parallels. For each: similarity score (0-1), key parallels and differences, outcome, actionable lessons, cautionary notes on the analogy, and real sources.`,
        });
        return { ...output, conflictId, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'historicalParallelsAnalysis', conflictId, _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), conflictId, _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: generateTimeline ---
  const boundGenerateTimeline = tool({
    description: generateTimeline.description,
    inputSchema: generateTimeline.inputSchema,
    execute: async ({ conflictId, startDate, endDate, eventTypes, includeProjected }) => {
      if (!isRealSituation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (generateTimeline.execute as any)({ conflictId, startDate, endDate, eventTypes, includeProjected });
      }
      try {
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({ schema: z.object({
            conflictName: z.string(),
            timelineRange: z.object({ start: z.string(), end: z.string() }),
            events: z.array(z.object({ id: z.string(), date: z.string(), title: z.string(), description: z.string(), type: z.enum(['political', 'military', 'diplomatic', 'humanitarian', 'economic']), glaslStage: z.number().min(1).max(9), escalatoryDirection: z.enum(['escalatory', 'de-escalatory', 'neutral']), significance: z.enum(['critical', 'major', 'moderate', 'minor']), involvedActors: z.array(z.string()), sources: z.array(z.string()), tags: z.array(z.string()).optional() })),
            projectedEvents: z.array(z.object({ estimatedDate: z.string(), title: z.string(), description: z.string(), type: z.enum(['political', 'military', 'diplomatic', 'humanitarian', 'economic']), probability: z.enum(['low', 'medium', 'high']), triggerConditions: z.array(z.string()) })).optional(),
            escalationTrajectory: z.object({ trend: z.enum(['escalating', 'stable', 'de-escalating', 'volatile']), summary: z.string(), peakStage: z.number().min(1).max(9), currentStage: z.number().min(1).max(9) }),
            timelineNote: z.string(),
          }) }),
          prompt: `Generate a structured conflict timeline.

SITUATION: ${ctxName} (${ctxRegion})
DESCRIPTION: ${truncate(ctxDescription)}
${ctxEvents ? `KNOWN EVENTS:\n${ctxEvents}` : ''}

DATE FILTER: ${startDate || 'no start filter'} to ${endDate || 'no end filter'}
EVENT TYPES: ${eventTypes?.join(', ') || 'all types'}
INCLUDE PROJECTED: ${includeProjected ? 'YES — include 3-5 plausible near-future events' : 'NO'}

GLASL STAGES: 1 Hardening | 2 Debates | 3 Actions | 4 Coalitions | 5 Loss of face | 6 Threats | 7 Limited blows | 8 Fragmentation | 9 Abyss

For each event: clear title, Glasl stage, escalatory direction, significance, key actors, real source citations.`,
        });
        return { ...output, conflictId, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'generateTimeline', conflictId, _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), conflictId, _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: sanctionsCheck ---
  const boundSanctionsCheck = tool({
    description: sanctionsCheck.description,
    inputSchema: sanctionsCheck.inputSchema,
    execute: async ({ entityName, conflictId, sanctionsBody, includeGuidance }) => {
      if (!isRealSituation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (sanctionsCheck.execute as any)({ entityName, conflictId, sanctionsBody, includeGuidance });
      }
      try {
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({ schema: z.object({
            queryType: z.enum(['entity', 'conflict', 'combined']),
            disclaimer: z.string(),
            entityResults: z.array(z.object({ entityName: z.string(), entityType: z.enum(['individual', 'organization', 'vessel', 'aircraft', 'unknown']), sanctionsStatus: z.enum(['designated', 'not_designated', 'unclear', 'delisted']), designatingBodies: z.array(z.object({ body: z.string(), listName: z.string(), designationDate: z.string().optional(), designationBasis: z.string(), measures: z.array(z.enum(['asset_freeze', 'travel_ban', 'arms_embargo', 'trade_restriction'])) })), aliases: z.array(z.string()), associatedEntities: z.array(z.string()), noteworthy: z.string().optional() })).optional(),
            conflictRegimes: z.array(z.object({ regimeName: z.string(), legalBasis: z.string(), establishedDate: z.string(), designatingBody: z.string(), scopeDescription: z.string(), keyMeasures: z.array(z.string()), currentlyActive: z.boolean(), recentDevelopments: z.string(), keyDesignatedEntities: z.array(z.string()) })).optional(),
            complianceGuidance: z.object({ dueDiligenceSteps: z.array(z.string()), redFlags: z.array(z.string()), reportingObligations: z.string(), keyContacts: z.array(z.object({ body: z.string(), resource: z.string() })), commonPitfalls: z.array(z.string()) }).optional(),
            analyticalNote: z.string(),
          }) }),
          prompt: `Generate sanctions regime information.

SITUATION: ${ctxName} (${ctxRegion})
KEY ACTORS: ${ctxActors}

SANCTIONS BODIES: ${sanctionsBody === 'all' || !sanctionsBody ? 'UN Security Council, US OFAC, EU, UK OFSI' : sanctionsBody.replace(/_/g, ' ').toUpperCase()}
INCLUDE COMPLIANCE GUIDANCE: ${includeGuidance !== false ? 'YES' : 'NO'}

${entityName ? `ENTITY LOOKUP: "${entityName}" in the context of ${ctxName}` : ''}
${conflictId ? 'Map all relevant sanctions regimes applicable to this conflict.' : ''}

DISCLAIMER: Analytical tool only. Real compliance requires official databases (UN Consolidated List, OFAC SDN, EU Sanctions Map, OFSI). Not legal advice.`,
        });
        return {
          ...output,
          disclaimer: 'ANALYTICAL PURPOSE ONLY. For actual sanctions compliance, consult official government databases: UN Consolidated List, US OFAC SDN List, EU Sanctions Map, UK OFSI Consolidated List. This AI-generated output does not constitute legal advice.',
          conflictId: conflictId || null,
          _generatedAt: new Date().toISOString(),
        };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'sanctionsCheck', conflictId: conflictId || null, _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), conflictId: conflictId || null, _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: humanitarianSnapshot ---
  const boundHumanitarianSnapshot = tool({
    description: humanitarianSnapshot.description,
    inputSchema: humanitarianSnapshot.inputSchema,
    execute: async ({ conflictId, focusSectors, asOfDate }) => {
      if (!isRealSituation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (humanitarianSnapshot.execute as any)({ conflictId, focusSectors, asOfDate });
      }
      try {
        const humanCtx = situationCtx?.humanitarianSummary ?? '';
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({ schema: z.object({
            conflictName: z.string(),
            snapshotDate: z.string(),
            classification: z.enum(['L1', 'L2', 'L3']),
            overallSeverity: z.enum(['moderate', 'serious', 'critical', 'catastrophic']),
            executiveSummary: z.string(),
            populationData: z.object({ totalAffected: z.string(), displaced: z.object({ idps: z.string(), refugees: z.string(), returnees: z.string() }), atRisk: z.string(), keyVulnerableGroups: z.array(z.string()) }),
            sectorIndicators: z.array(z.object({ sector: z.string(), severityLevel: z.enum(['moderate', 'serious', 'critical', 'catastrophic']), keyIndicators: z.array(z.string()), priority: z.enum(['low', 'medium', 'high', 'acute']), gaps: z.array(z.string()) })),
            accessConstraints: z.array(z.object({ area: z.string(), constraintType: z.enum(['security', 'bureaucratic', 'physical', 'combined']), description: z.string(), percentageUnreached: z.string().optional(), humanitarianConsequence: z.string() })),
            fundingStatus: z.object({ appealName: z.string(), totalRequested: z.string(), totalReceived: z.string(), fundingGapPercent: z.number().min(0).max(100), topDonors: z.array(z.string()), criticallyUnderfundedSectors: z.array(z.string()) }),
            keyProtectionConcerns: z.array(z.string()),
            immediatePriorities: z.array(z.object({ priority: z.string(), requiredAction: z.string(), responsibleActors: z.array(z.string()), timeline: z.string() })),
            contactInfo: z.object({ ochaCoverage: z.string(), interclusterCoordinator: z.string(), mediaContact: z.string() }),
            dataQualityNote: z.string(),
          }) }),
          prompt: `Generate an OCHA-style humanitarian snapshot.

SITUATION: ${ctxName} (${ctxRegion})
DESCRIPTION: ${truncate(ctxDescription)}
KEY ACTORS: ${ctxActors}
${humanCtx ? `HUMANITARIAN CONTEXT:\n${humanCtx}` : ''}
${ctxEvents ? `RECENT EVENTS:\n${ctxEvents}` : ''}

SNAPSHOT DATE: ${asOfDate || new Date().toISOString().split('T')[0]}
SECTORS: ${focusSectors?.join(', ') || 'all sectors (food security, health, shelter, WASH, protection, education, livelihoods)'}

Follow OCHA SitRep format: IPC phases for food security, IASC classification levels, cluster system for coordination. Lead with most urgent life-threatening concerns. Be frank about access constraints.`,
        });
        return { ...output, conflictId, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'humanitarianSnapshot', conflictId, _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), conflictId, _generatedAt: new Date().toISOString() };
      }
    },
  });

  // --- Bound: compareConflicts ---
  // conflict1 is the user's real situation; conflict2 is specified by conflictId2 (user-provided)
  const boundCompareConflicts = tool({
    description: compareConflicts.description,
    inputSchema: compareConflicts.inputSchema,
    execute: async ({ conflictId1, conflictId2, dimensions, purpose }) => {
      if (!isRealSituation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (compareConflicts.execute as any)({ conflictId1, conflictId2, dimensions, purpose });
      }
      try {
        const activeDimensions = dimensions || ['actors', 'grievances', 'escalation', 'international_response', 'humanitarian', 'economics', 'narrative', 'peace_prospects'];
        const { output } = await generateText({
          model: getModel(),
          abortSignal: timeoutSignal(),
          output: Output.object({ schema: z.object({
            conflict1Name: z.string(),
            conflict2Name: z.string(),
            comparisonDate: z.string(),
            purpose: z.string(),
            dimensionalComparisons: z.array(z.object({ dimension: z.string(), conflict1Assessment: z.string(), conflict2Assessment: z.string(), keyDivergences: z.array(z.string()), keyConvergences: z.array(z.string()), analyticalSignificance: z.string() })),
            overallSimilarityRating: z.number().min(0).max(1),
            structuralComparison: z.object({ sharedFeatures: z.array(z.string()), distinctiveFeatures1: z.array(z.string()), distinctiveFeatures2: z.array(z.string()) }),
            lessonsForConflict1: z.array(z.object({ lesson: z.string(), sourceFromConflict2: z.string(), applicability: z.enum(['directly_applicable', 'partially_applicable', 'cautionary']) })),
            synthesisInsights: z.array(z.string()),
            comparisonCaveats: z.array(z.string()),
            recommendedNextSteps: z.array(z.string()),
          }) }),
          prompt: `Compare two conflicts across analytical dimensions.

CONFLICT 1 (user's situation): ${ctxName} (${ctxRegion})
Description: ${truncate(ctxDescription)}
Key actors: ${ctxActors}
${ctxEvents ? `Recent dynamics:\n${ctxEvents}` : ''}

CONFLICT 2: "${conflictId2}"
(If a real conflict, use real data. If fictional or a case name, generate consistent analytical data.)

DIMENSIONS: ${activeDimensions.join(', ')}
PURPOSE: ${purpose || 'policy'} analysis

For each dimension: assess both conflicts, identify key divergences and convergences, explain analytical significance. Synthesize cross-cutting insights. Note where analogies break down.`,
        });
        return { ...output, _generatedAt: new Date().toISOString() };
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') return { error: true, message: 'Tool timed out after 30s', toolName: 'compareConflicts', _generatedAt: new Date().toISOString() };
        return { error: true, message: String(err), _generatedAt: new Date().toISOString() };
      }
    },
  });

  // Return merged tool set — bound tools override the static defaults
  return {
    ...tacitusTools,
    queryConflictGraph: boundQueryConflictGraph,
    escalationAssessment: boundEscalationAssessment,
    generateTalkingPoints: boundGenerateTalkingPoints,
    draftSection: boundDraftSection,
    negotiationSpaceAnalysis: boundNegotiationSpaceAnalysis,
    narrativeEcosystemMap: boundNarrativeEcosystemMap,
    historicalParallelsAnalysis: boundHistoricalParallelsAnalysis,
    generateTimeline: boundGenerateTimeline,
    sanctionsCheck: boundSanctionsCheck,
    humanitarianSnapshot: boundHumanitarianSnapshot,
    compareConflicts: boundCompareConflicts,
  };
}
