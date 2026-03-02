// @ts-nocheck
// TODO: Update tool definitions to match AI SDK v6 API (inputSchema instead of parameters)
import { tool } from 'ai';
import { z } from 'zod';

// ============================================================================
// Tool 1: webSearch
// Search the web for current information about a conflict or topic
// ============================================================================

export const webSearch = tool({
  description:
    'Search the web for current news, reports, and information about a specific topic, conflict, or actor. Returns relevant search results with titles, snippets, and URLs.',
  parameters: z.object({
    query: z.string().describe('The search query to execute'),
    region: z
      .string()
      .optional()
      .describe('Geographic region to focus the search on'),
    timeRange: z
      .enum(['day', 'week', 'month', 'year', 'all'])
      .optional()
      .describe('Time range filter for search results'),
    maxResults: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .describe('Maximum number of results to return'),
  }),
  execute: async ({ query, region, timeRange, maxResults }) => {
    // Placeholder: integrate with search API (Tavily, Serper, etc.)
    return {
      results: [
        {
          title: `Latest developments: ${query}`,
          snippet: `Recent analysis of ${query}${region ? ` in the ${region} region` : ''}. Multiple sources report ongoing developments that warrant attention from the international community.`,
          url: 'https://example.com/article-1',
          publishedDate: new Date().toISOString(),
          source: 'International Affairs Review',
        },
        {
          title: `UN response to ${query}`,
          snippet: `The United Nations Security Council held consultations regarding ${query}. Member states expressed varying positions on the appropriate response framework.`,
          url: 'https://example.com/article-2',
          publishedDate: new Date().toISOString(),
          source: 'UN News',
        },
        {
          title: `Regional implications of ${query}`,
          snippet: `Regional organizations have been monitoring the situation closely. ${query} has implications for stability across neighboring states and existing peace agreements.`,
          url: 'https://example.com/article-3',
          publishedDate: new Date().toISOString(),
          source: 'Crisis Group',
        },
      ],
      query,
      timeRange: timeRange || 'all',
      totalResults: maxResults || 3,
    };
  },
});

// ============================================================================
// Tool 2: analyzeDocument
// Extract structured information from an uploaded document
// ============================================================================

export const analyzeDocument = tool({
  description:
    'Analyze an uploaded document to extract key entities, claims, events, and relationships. Returns structured data conforming to the Conflict Grammar schema.',
  parameters: z.object({
    documentId: z.string().describe('The ID of the uploaded document to analyze'),
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
      .describe('Types of entities to extract from the document'),
    focusArea: z
      .string()
      .optional()
      .describe('Specific aspect of the document to focus extraction on'),
  }),
  execute: async ({ documentId, extractionTargets, focusArea }) => {
    return {
      documentId,
      extractedEntities: extractionTargets.map((target) => ({
        type: target,
        count: Math.floor(Math.random() * 5) + 1,
        entities: [
          {
            id: `${target}-extracted-1`,
            name: `Extracted ${target} entity from document`,
            confidence: 0.85,
            sourcePassage: `[Relevant passage from document ${documentId}]`,
          },
        ],
      })),
      focusArea: focusArea || 'general',
      summary: `Document ${documentId} analyzed. Found entities across ${extractionTargets.length} categories.`,
      confidence: 0.82,
    };
  },
});

// ============================================================================
// Tool 3: queryConflictGraph
// Query the conflict knowledge graph for entities and relationships
// ============================================================================

export const queryConflictGraph = tool({
  description:
    'Query the conflict knowledge graph to retrieve entities, relationships, and patterns. Supports filtering by entity type, actor, time range, and relationship type.',
  parameters: z.object({
    conflictId: z.string().describe('The ID of the conflict graph to query'),
    entityType: z
      .enum([
        'actor',
        'claim',
        'interest',
        'constraint',
        'leverage',
        'commitment',
        'event',
        'narrative',
        'all',
      ])
      .describe('Type of entity to retrieve'),
    actorId: z
      .string()
      .optional()
      .describe('Filter results to a specific actor'),
    timeRange: z
      .object({
        start: z.string().optional(),
        end: z.string().optional(),
      })
      .optional()
      .describe('Filter events/commitments by date range'),
    query: z
      .string()
      .optional()
      .describe('Natural language query to search the graph'),
  }),
  execute: async ({ conflictId, entityType, actorId, query }) => {
    return {
      conflictId,
      entityType,
      results: [
        {
          id: `${entityType}-demo-1`,
          type: entityType === 'all' ? 'actor' : entityType,
          name: `Demo ${entityType} entity`,
          description: `This is a demo entity from conflict ${conflictId}${actorId ? ` filtered by actor ${actorId}` : ''}`,
        },
      ],
      totalCount: 1,
      query: query || null,
    };
  },
});

// ============================================================================
// Tool 4: draftSection
// Generate a report section based on template and context
// ============================================================================

export const draftSection = tool({
  description:
    'Draft a section of a diplomatic report based on the specified template, section type, and available context from the conflict graph and research materials.',
  parameters: z.object({
    sectionId: z.string().describe('The ID of the section to draft'),
    sectionTitle: z.string().describe('The title/heading of the section'),
    templateType: z
      .enum([
        'sg_report',
        'sc_briefing',
        'political_cable',
        'options_paper',
        'conflict_assessment',
        'custom',
      ])
      .describe('The report template type'),
    context: z
      .string()
      .describe('Relevant context from the conflict graph and research'),
    instructions: z
      .string()
      .optional()
      .describe('Specific drafting instructions or focus areas'),
    wordLimit: z
      .number()
      .optional()
      .describe('Target word count for the section'),
    tone: z
      .enum(['formal', 'analytical', 'balanced', 'urgent', 'cautious'])
      .optional()
      .describe('Desired tone for the section'),
  }),
  execute: async ({
    sectionId,
    sectionTitle,
    templateType,
    context,
    instructions,
    wordLimit,
  }) => {
    return {
      sectionId,
      sectionTitle,
      content: `[Draft of "${sectionTitle}" section for ${templateType} template]\n\nBased on the available information, this section presents an analysis of the current situation. The context provided indicates several key developments that merit attention.\n\nThe situation continues to evolve, with multiple actors pursuing divergent objectives. International mediation efforts have yielded limited results to date, though diplomatic channels remain open.\n\n${instructions ? `\n[Note: Drafted with specific instructions: ${instructions}]` : ''}`,
      wordCount: wordLimit || 250,
      status: 'draft' as const,
      generatedBy: 'ai' as const,
      sources: [
        {
          type: 'graph' as const,
          title: 'Conflict Knowledge Graph',
          reference: `conflict-graph-${templateType}`,
        },
      ],
    };
  },
});

// ============================================================================
// Tool 5: editForDiplomaticTone
// Revise text to conform to diplomatic language standards
// ============================================================================

export const editForDiplomaticTone = tool({
  description:
    'Review and edit text to ensure it conforms to diplomatic language standards, including UN terminology, balanced framing, and appropriate hedging. Highlights changes and provides explanations.',
  parameters: z.object({
    text: z.string().describe('The text to review and edit'),
    targetAudience: z
      .enum([
        'security_council',
        'general_assembly',
        'secretary_general',
        'member_states',
        'public',
        'internal',
      ])
      .describe('The intended audience for the text'),
    sensitivityLevel: z
      .enum(['high', 'medium', 'low'])
      .optional()
      .describe('How diplomatically sensitive the topic is'),
  }),
  execute: async ({ text, targetAudience, sensitivityLevel }) => {
    return {
      originalText: text,
      editedText: text
        .replace(/war/gi, 'armed conflict')
        .replace(/invasion/gi, 'military operation')
        .replace(/regime/gi, 'authorities')
        .replace(/rebels/gi, 'opposition forces')
        .replace(/terrorist/gi, 'non-state armed group'),
      changes: [
        {
          original: 'war',
          replacement: 'armed conflict',
          reason:
            'UN preferred terminology avoids the term "war" in favor of "armed conflict" for precision and neutrality.',
        },
        {
          original: 'regime',
          replacement: 'authorities',
          reason:
            'The term "regime" carries negative connotations. "Authorities" or "government" is preferred in UN documents.',
        },
      ],
      targetAudience,
      sensitivityLevel: sensitivityLevel || 'medium',
      overallAssessment:
        'Text revised for diplomatic appropriateness. Key terminology adjusted to conform with UN standards.',
    };
  },
});

// ============================================================================
// Tool 6: analyzeMediaSource
// Analyze the positioning and reliability of a media source
// ============================================================================

export const analyzeMediaSource = tool({
  description:
    'Analyze a media source for political positioning, reliability, editorial independence, and known biases. Uses the TACITUS media source database and supplementary research.',
  parameters: z.object({
    sourceName: z.string().describe('Name of the media source to analyze'),
    sourceUrl: z
      .string()
      .optional()
      .describe('URL of a specific article or the source homepage'),
    analysisDepth: z
      .enum(['quick', 'standard', 'deep'])
      .optional()
      .describe('How detailed the analysis should be'),
  }),
  execute: async ({ sourceName, sourceUrl, analysisDepth }) => {
    return {
      sourceName,
      sourceUrl: sourceUrl || null,
      type: 'private' as const,
      country: 'Unknown',
      politicalOrientation: 0,
      reliability: 0.7,
      editorialIndependence: 0.6,
      analysis: `${sourceName} is a media outlet that requires careful contextual reading. Coverage tends to reflect editorial positioning. Cross-referencing with wire services and alternative sources is recommended.`,
      knownBiases: ['editorial_slant', 'geographic_focus'],
      coverageStrengths: ['regional_expertise'],
      recommendedPairing: [
        'Wire services (AFP, Reuters, AP) for factual baseline',
        'Regional outlets for local perspective',
      ],
      analysisDepth: analysisDepth || 'standard',
    };
  },
});

// ============================================================================
// Tool 7: compareMediaCoverage
// Compare how different media sources cover the same topic
// ============================================================================

export const compareMediaCoverage = tool({
  description:
    'Compare how multiple media sources cover the same topic or event. Identifies convergence and divergence points, framing differences, and notable omissions across sources.',
  parameters: z.object({
    topic: z.string().describe('The topic or event to compare coverage of'),
    sourceNames: z
      .array(z.string())
      .min(2)
      .max(10)
      .describe('Names of media sources to compare'),
    timeRange: z
      .enum(['day', 'week', 'month'])
      .optional()
      .describe('Time range for coverage comparison'),
  }),
  execute: async ({ topic, sourceNames, timeRange }) => {
    return {
      topic,
      timeRange: timeRange || 'week',
      sources: sourceNames.map((name) => ({
        sourceName: name,
        headline: `${name}'s coverage of ${topic}`,
        tone: 'neutral' as const,
        framing: `${name} frames the issue through its characteristic editorial lens`,
        keyActorsMentioned: ['Actor A', 'Actor B'],
        narrativesIdentified: ['security_narrative', 'humanitarian_narrative'],
      })),
      convergencePoints: [
        'All sources agree on the basic timeline of events',
        'Casualty figures are broadly consistent across sources',
      ],
      divergencePoints: [
        'Attribution of responsibility differs significantly',
        'Framing of civilian impact varies by source',
        'Historical context is presented selectively',
      ],
      notableOmissions: [
        'Economic dimensions underreported across most sources',
        'Regional actor involvement receives uneven coverage',
      ],
      overallAssessment: `Coverage of ${topic} across ${sourceNames.length} sources reveals significant framing differences. Wire services provide the most factually consistent baseline. State-funded media show predictable editorial alignment with national positions.`,
    };
  },
});

// ============================================================================
// Tool 8: checkUNTerminology
// Check text against UN terminology standards
// ============================================================================

export const checkUNTerminology = tool({
  description:
    'Check text against UN terminology standards and official usage guidelines. Identifies non-standard terms and suggests UN-approved alternatives. Flags potentially sensitive language.',
  parameters: z.object({
    text: z.string().describe('The text to check for UN terminology compliance'),
    context: z
      .enum([
        'resolution',
        'report',
        'briefing',
        'statement',
        'correspondence',
        'general',
      ])
      .optional()
      .describe('The document context for terminology checking'),
  }),
  execute: async ({ text, context }) => {
    const issues: Array<{
      term: string;
      suggestion: string;
      reason: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];

    const termChecks = [
      { pattern: /\bwar\b/gi, suggestion: 'armed conflict', severity: 'error' as const },
      { pattern: /\brebels?\b/gi, suggestion: 'opposition armed group / non-State armed group', severity: 'error' as const },
      { pattern: /\bregime\b/gi, suggestion: 'Government / authorities', severity: 'error' as const },
      { pattern: /\btribe\b/gi, suggestion: 'ethnic group / community', severity: 'warning' as const },
      { pattern: /\bterrorist\b/gi, suggestion: 'designated entity / non-State armed group (unless SC-listed)', severity: 'error' as const },
      { pattern: /\bfailed state\b/gi, suggestion: 'State facing governance challenges', severity: 'warning' as const },
      { pattern: /\bcivil war\b/gi, suggestion: 'non-international armed conflict / internal armed conflict', severity: 'warning' as const },
      { pattern: /\bethnic cleansing\b/gi, suggestion: 'use only when findings have been made by a competent body', severity: 'error' as const },
    ];

    for (const check of termChecks) {
      const matches = text.match(check.pattern);
      if (matches) {
        for (const match of matches) {
          issues.push({
            term: match,
            suggestion: check.suggestion,
            reason: `"${match}" is not standard UN terminology. Use "${check.suggestion}" instead.`,
            severity: check.severity,
          });
        }
      }
    }

    return {
      text,
      context: context || 'general',
      issueCount: issues.length,
      issues,
      overallCompliance: issues.length === 0 ? 'compliant' : issues.some((i) => i.severity === 'error') ? 'non_compliant' : 'needs_review',
      recommendation:
        issues.length === 0
          ? 'Text conforms to UN terminology standards.'
          : `Found ${issues.length} terminology issue(s). Review suggested replacements before finalizing.`,
    };
  },
});

// ============================================================================
// Tool 9: draftResolutionLanguage
// Draft text in UN Security Council resolution format
// ============================================================================

export const draftResolutionLanguage = tool({
  description:
    'Draft text in the style and format of UN Security Council resolutions. Generates preambular and operative paragraphs using standard resolution language and formulations.',
  parameters: z.object({
    topic: z.string().describe('The topic or situation the resolution addresses'),
    type: z
      .enum(['preambular', 'operative', 'full'])
      .describe('Whether to draft preambular paragraphs, operative paragraphs, or both'),
    keyPoints: z
      .array(z.string())
      .describe('Key points to address in the resolution language'),
    strength: z
      .enum(['strong', 'moderate', 'weak'])
      .optional()
      .describe('Desired strength of the language (e.g., "demands" vs. "encourages")'),
    previousResolutions: z
      .array(z.string())
      .optional()
      .describe('Previous resolution numbers to reference'),
  }),
  execute: async ({ topic, type, keyPoints, strength, previousResolutions }) => {
    const actionVerbs = {
      strong: ['Demands', 'Decides', 'Requires', 'Determines'],
      moderate: ['Calls upon', 'Urges', 'Requests', 'Stresses'],
      weak: ['Encourages', 'Invites', 'Notes', 'Welcomes'],
    };

    const verbs = actionVerbs[strength || 'moderate'];

    const preambular = [
      `Recalling its previous resolutions on the situation in relation to ${topic}${previousResolutions ? `, in particular resolutions ${previousResolutions.join(', ')}` : ''},`,
      `Expressing deep concern at the ongoing situation regarding ${topic},`,
      `Reaffirming its commitment to the sovereignty, independence, territorial integrity and national unity of all States,`,
      `Taking note of the reports of the Secretary-General on the matter,`,
    ];

    const operative = keyPoints.map((point, i) => {
      const verb = verbs[i % verbs.length];
      return `${i + 1}. ${verb} ${point};`;
    });

    return {
      topic,
      type,
      preambular: type === 'operative' ? [] : preambular,
      operative: type === 'preambular' ? [] : operative,
      strength: strength || 'moderate',
      referencedResolutions: previousResolutions || [],
      note: 'This is AI-generated draft language. All resolution text must be reviewed and approved through proper diplomatic channels.',
    };
  },
});

// ============================================================================
// Tool 10: generateTalkingPoints
// Generate structured talking points for diplomatic briefings
// ============================================================================

export const generateTalkingPoints = tool({
  description:
    'Generate structured talking points for diplomatic briefings, meetings, or press conferences. Includes main points, supporting evidence, anticipated questions, and suggested responses.',
  parameters: z.object({
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
    position: z
      .string()
      .optional()
      .describe('The position or perspective to articulate'),
    conflictId: z
      .string()
      .optional()
      .describe('Conflict ID to draw context from the knowledge graph'),
    maxPoints: z
      .number()
      .min(3)
      .max(15)
      .optional()
      .describe('Maximum number of talking points to generate'),
  }),
  execute: async ({ topic, audience, position, conflictId, maxPoints }) => {
    return {
      topic,
      audience,
      position: position || 'balanced',
      conflictId: conflictId || null,
      talkingPoints: [
        {
          point: `The situation regarding ${topic} requires the urgent attention of the international community.`,
          supporting: [
            'Recent developments indicate a deterioration in conditions on the ground.',
            'Civilian populations continue to bear the brunt of the ongoing situation.',
          ],
          sensitivityNote: 'Factual framing; avoid attribution of blame.',
        },
        {
          point: 'The United Nations stands ready to support all parties in seeking a peaceful resolution.',
          supporting: [
            'Existing mediation frameworks provide a basis for renewed dialogue.',
            'Regional organizations have expressed willingness to coordinate efforts.',
          ],
          sensitivityNote: 'Emphasize inclusive approach; do not single out any party.',
        },
        {
          point: 'Humanitarian access must be maintained and expanded to reach all affected populations.',
          supporting: [
            'Current humanitarian needs assessments indicate significant unmet requirements.',
            'Compliance with international humanitarian law is a non-negotiable obligation of all parties.',
          ],
          sensitivityNote:
            'Use IHL framing; avoid language that could be seen as politically motivated.',
        },
      ],
      anticipatedQuestions: [
        {
          question: `What specific actions is the UN taking regarding ${topic}?`,
          suggestedResponse:
            'The Secretary-General has been actively engaged with all parties. The UN system on the ground continues to deliver humanitarian assistance while the political track explores avenues for de-escalation.',
        },
        {
          question: 'How do you respond to allegations of bias in the UN approach?',
          suggestedResponse:
            'The United Nations is guided by the principles of the Charter and acts in an impartial manner. Our engagement is based on international law and the protection of civilian populations.',
        },
      ],
      maxPoints: maxPoints || 5,
    };
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
};

export type TacitusToolName = keyof typeof tacitusTools;
