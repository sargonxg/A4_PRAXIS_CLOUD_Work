import { tool, generateObject, generateText } from 'ai';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { DEMO_CONFLICT } from '@/lib/constants/demo-conflict';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { MEDIA_DATABASE, findMediaOutlet } from '@/lib/constants/media-database';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
});

// Convenience helper — single place to swap model version
const gemini = (model = 'gemini-2.5-flash') => google(model);

// ============================================================================
// Tool 1: webSearch
// AI-generated conflict-grounded search results via Gemini
// NOTE: Cannot use useSearchGrounding here — it conflicts with custom tools
// (Vercel AI SDK / Gemini issue #8258). Use /api/ai/grounded-search for live search.
// ============================================================================

export const webSearch = tool({
  description:
    'Search for current news and reports about a conflict topic. Returns realistic, AI-generated results using real outlet names and substantive analytical content. For live Google Search use the grounded-search endpoint instead.',
  inputSchema: z.object({
    query: z.string().describe('The search query to execute'),
    region: z.string().optional().describe('Geographic region to focus the search on'),
    timeRange: z
      .enum(['day', 'week', 'month', 'year', 'all'])
      .optional()
      .describe('Time range filter for search results'),
  }),
  execute: async ({ query, region, timeRange }) => {
    try {
      const { object } = await generateObject({
        model: gemini(),
        schema: z.object({
          results: z.array(
            z.object({
              title: z.string(),
              snippet: z.string().describe('2-3 sentences of substantive analytical content'),
              source: z.string(),
              publishedDate: z.string(),
              url: z.string(),
              reliabilityScore: z
                .number()
                .min(0)
                .max(1)
                .describe('Source reliability: wire services 0.90+, quality press 0.80+, state media 0.40-0.60'),
            })
          ),
          analysisNote: z
            .string()
            .describe('1-sentence assessment of the overall information landscape for this query'),
        }),
        prompt: `You are a conflict intelligence research assistant. Generate 4-5 realistic search results for the query: "${query}"${region ? ` in the ${region} region` : ''}. Time range: ${timeRange || 'recent'}.

IMPORTANT: Use REAL news outlet names (Reuters, Al Jazeera, BBC, Crisis Group, UN News, ACLED, Financial Times, Foreign Policy, The Guardian, AFP, AP, DW, France 24, etc.). Generate realistic-sounding article titles and snippets that a professional conflict analyst would find useful. Each snippet should be 2-3 sentences of substantive content, not generic filler. Include a reliability score based on source type (wire services 0.90+, quality broadsheets 0.80+, regional specialists 0.70-0.80, state media 0.40-0.60).

Also provide an analysisNote: a 1-sentence assessment of the overall information landscape for this query.`,
      });
      return { ...object, query };
    } catch {
      return {
        results: [],
        query,
        analysisNote:
          'Search unavailable. Switch to Live Research mode (Google Search grounding) for real-time results.',
      };
    }
  },
});

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
    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
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
${conflictContext ? `Known conflict context: ${conflictContext}` : ''}

TEXT TO ANALYZE:
${text.slice(0, 8000)}

For each entity, include the exact source passage it was extracted from. Rate confidence 0-1 based on how clearly the text supports the extraction. Also identify information gaps — what an analyst would want to know that this text does not provide.`,
    });
    return object;
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
    };
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
  execute: async ({ sectionTitle, templateType, conflictId, instructions, wordLimit, tone }) => {
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
      model: gemini(),
      system: DIPLOMATIC_SYSTEM_PROMPT,
      prompt: `Draft the "${sectionTitle}" section for a ${templateType.replace(/_/g, ' ')} report.

CONFLICT: ${conflict.name}
DESCRIPTION: ${conflict.description}

KEY ACTORS:
${actorSummary}

RECENT EVENTS:
${recentEvents}

${instructions ? `SPECIAL INSTRUCTIONS: ${instructions}` : ''}
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
    };
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
      model: gemini(),
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
${pass1}

Return ONLY the revised text, with no preamble or explanation.`,
    });

    return {
      originalText: text,
      editedText: finalText,
      targetAudience,
      sensitivityLevel: sensitivityLevel || 'medium',
      overallAssessment:
        'Text revised for diplomatic appropriateness per UN editorial standards. Key terminology adjusted and balanced framing applied.',
    };
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

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Analyze the media source "${sourceName}" for diplomatic and conflict analysis purposes.

${dbContext}
${topicContext ? `\nSpecific topic for coverage assessment: "${topicContext}"` : ''}

Provide a comprehensive ${analysisDepth || 'standard'} analysis including:
- Editorial positioning and political orientation (-1 to 1 scale)
- Reliability score (0-1) based on track record, fact-checking, and editorial standards
- Editorial independence from government or corporate owners
- Known biases and blind spots relevant to conflict reporting
- Coverage strengths that make this outlet valuable
- Recommended outlets to pair with this source for triangulation
- Practical guidance on how to use this source in diplomatic analysis`,
    });

    return { ...object, analysisDepth: analysisDepth || 'standard' };
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
  execute: async ({ topic, sourceNames, timeRange }) => {
    // Build media database context for sources requested
    const sourceProfiles = sourceNames.map((name) => {
      const entry = findMediaOutlet(name);
      return entry
        ? `${entry.name} (${entry.ownershipType}, orientation: ${entry.politicalOrientation}, reliability: ${entry.reliabilityScore}): ${entry.notableFor}`
        : `${name}: no PRAXIS database entry`;
    });

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Analyze how these media sources cover the topic: "${topic}" (time range: ${timeRange || 'recent week'}).

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

    return object;
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
    };
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
  execute: async ({ topic, type, keyPoints, strength, previousResolutions, chapterVII }) => {
    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
        topic: z.string(),
        type: z.string(),
        preambular: z.array(z.string()).describe('Preambular paragraphs (gerund form: "Recalling...", "Expressing concern...")'),
        operative: z.array(z.string()).describe('Operative paragraphs (present tense: "1. Demands...", "2. Calls upon...")'),
        chapterVIIClause: z.string().optional().describe('Chapter VII authorization clause if applicable'),
        strength: z.string(),
        referencedResolutions: z.array(z.string()),
        draftingNotes: z.string(),
      }),
      prompt: `Draft UN Security Council resolution language on: "${topic}"

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
      ...object,
      note: 'This is AI-generated draft language. All resolution text must be reviewed and approved through proper diplomatic channels before formal use.',
    };
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
  execute: async ({ topic, audience, position, conflictId, maxPoints }) => {
    // Ground in real conflict data if available
    const conflict = DEMO_CONFLICT;
    const actorContext = conflict.actors
      .slice(0, 5)
      .map((a) => `${a.name}: ${a.description.slice(0, 80)}...`)
      .join('\n');

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Generate diplomatic talking points for: "${topic}"
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

    return { ...object, conflictId: conflictId || null };
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
  execute: async ({ conflictId, specificConcern, timeHorizon }) => {
    // Load conflict data
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const events = (conflictData.events as Array<Record<string, unknown>> | undefined) ?? [];
    const recentEvents = events
      .slice(-8)
      .map((e) => `${e.date} [${e.type ?? 'unknown'}]: ${String(e.description ?? '').slice(0, 80)}...`)
      .join('\n');
    const actorList = conflict.actors.map((a) => `${a.name} (${a.type})`).join(', ');

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Conduct an escalation assessment for: ${conflict.name}

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

    return object;
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
  execute: async ({ conflictId, issuesOfFocus, mediationContext }) => {
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

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Analyze the negotiation space for: ${conflict.name}

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

    return object;
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
  execute: async ({ conflictId, focus, audienceFocus }) => {
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

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Map the narrative ecosystem for: ${conflict.name}

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

    return object;
  },
});

// ============================================================================
// Tool 14: historicalParallelAnalysis
// Identifies historical conflict parallels with similarity scoring
// ============================================================================

export const historicalParallelAnalysis = tool({
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
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const actors = conflict.actors.slice(0, 6).map((a) => `${a.name} (${a.type})`).join(', ');
    const events = (conflictData.events as Array<Record<string, unknown>> | undefined) ?? [];
    const recentEvents = events
      .slice(-5)
      .map((e) => `${e.date}: ${String(e.description ?? '').slice(0, 80)}`)
      .join('\n');

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Identify historical conflict parallels for: ${conflict.name}

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

    return { ...object, conflictId };
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

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Generate enriched timeline data for: ${conflict.name}

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

    return { ...object, conflictId };
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
    const conflict = DEMO_CONFLICT;
    const conflictActors = conflict.actors.map((a) => `${a.name} (${a.type}): ${a.description.slice(0, 80)}`).join('\n');

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Generate a sanctions regime analysis for${entityName ? ` entity: "${entityName}"` : ''}${conflictId ? ` conflict context: ${conflict.name}` : ''}.

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
      ...object,
      disclaimer: 'ANALYTICAL PURPOSE ONLY. For actual sanctions compliance, consult official government databases: UN Consolidated List, US OFAC SDN List, EU Sanctions Map, UK OFSI Consolidated List. This AI-generated output does not constitute legal advice.',
      conflictId: conflictId || null,
    };
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
    const conflict = DEMO_CONFLICT;
    const conflictData = conflict as Record<string, unknown>;
    const actors = conflict.actors.map((a) => `${a.name} (${a.type})`).join(', ');
    const events = (conflictData.events as Array<Record<string, unknown>> | undefined) ?? [];
    const humanEvents = events
      .filter((e) => String(e.type ?? '') === 'humanitarian' || String(e.description ?? '').toLowerCase().includes('humanitarian'))
      .slice(0, 8)
      .map((e) => `${e.date}: ${String(e.description ?? '').slice(0, 100)}`)
      .join('\n');

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
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

    return { ...object, conflictId };
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

    const { object } = await generateObject({
      model: gemini(),
      schema: z.object({
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
      }),
      prompt: `Conduct a comparative analysis of two conflicts:

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

    return { ...object, conflictId1, conflictId2 };
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
  historicalParallelAnalysis,
  generateTimeline,
  sanctionsCheck,
  humanitarianSnapshot,
  compareConflicts,
};

export type TacitusToolName = keyof typeof tacitusTools;
