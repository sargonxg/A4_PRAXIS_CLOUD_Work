import { generateText, Output } from 'ai';
import { getModel, hasServerAiProvider } from '@/lib/ai/providers';
import { withCalibration } from '@/lib/api/with-calibration';
import { handleRouteError } from '@/lib/api/standard-error';
import { validateAiRequest } from '@/lib/api/validate-request';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { z } from 'zod';

export const maxDuration = 45;

const TermIssueSchema = z.object({
  term: z.string(),
  suggestion: z.string(),
  reason: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  startIndex: z.number().optional(),
});

const TerminologyResponseSchema = z.object({
  issues: z.array(TermIssueSchema),
  overallCompliance: z.enum(['compliant', 'needs_review', 'non_compliant']),
  complianceScore: z.number().min(0).max(100),
  styleRecommendations: z.array(z.string()),
  recommendation: z.string(),
});

const TerminologyRequestSchema = z.object({
  text: z.string().min(1),
  context: z.string().optional(),
  situationId: z.string().optional(),
});

// Programmatic checks for common diplomatic terminology issues
function runProgrammaticChecks(text: string) {
  const issues: Array<{ term: string; suggestion: string; reason: string; severity: 'error' | 'warning' | 'info' }> = [];

  const termChecks = [
    { pattern: /\bwar\b/gi, suggestion: 'armed conflict', severity: 'error' as const },
    { pattern: /\brebels?\b/gi, suggestion: 'opposition armed group / non-State armed group', severity: 'error' as const },
    { pattern: /\bregime\b/gi, suggestion: 'Government / authorities', severity: 'error' as const },
    { pattern: /\btribe\b/gi, suggestion: 'ethnic group / community', severity: 'warning' as const },
    { pattern: /\bterrorist\b/gi, suggestion: 'designated entity / non-State armed group (unless SC-listed)', severity: 'error' as const },
    { pattern: /\bfailed state\b/gi, suggestion: 'State facing governance challenges', severity: 'warning' as const },
    { pattern: /\bcivil war\b/gi, suggestion: 'non-international armed conflict / internal armed conflict', severity: 'warning' as const },
    { pattern: /\bethnic cleansing\b/gi, suggestion: 'use only when findings have been made by a competent body', severity: 'error' as const },
    { pattern: /\bpeace-keeping\b/gi, suggestion: 'peacekeeping (one word, no hyphen)', severity: 'warning' as const },
    { pattern: /\bpeace talks\b/gi, suggestion: 'peace negotiations / peace process', severity: 'info' as const },
    { pattern: /\bfighters?\b/gi, suggestion: 'non-State armed group members / armed elements', severity: 'warning' as const },
  ];

  for (const check of termChecks) {
    const matches = text.match(check.pattern);
    if (matches) {
      for (const match of matches) {
        issues.push({
          term: match,
          suggestion: check.suggestion,
          reason: `"${match}" is not standard professional diplomatic terminology. Use "${check.suggestion}" instead.`,
          severity: check.severity,
        });
      }
    }
  }

  return issues;
}

export const POST = withCalibration('un_toolkit', 'ai_chat', {
  retrievalQuery: (_req, body) => {
    const c = typeof body.context === 'string' ? body.context : '';
    return c || undefined;
  },
})(async (request, ctx) => {
  if (isServerDemoMode()) {
    return Response.json({ issues: [], overallCompliance: 'compliant', complianceScore: 100, styleRecommendations: ['Sample mode — configure GOOGLE_AI_API_KEY for AI-powered terminology checking'], recommendation: 'Sample mode active. AI analysis unavailable.' });
  }

  if (!hasServerAiProvider()) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT in environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const validation = validateAiRequest(body, TerminologyRequestSchema);
    if (!validation.success) return validation.response;
    const { text, context, situationId } = validation.data;

    const { systemPromptBlock, outputConstraints } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    // Run fast programmatic checks first
    const programmaticIssues = runProgrammaticChecks(text);

    // Use Gemini for nuanced analysis (generateText + Output.object — AI SDK v6 pattern)
    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: TerminologyResponseSchema }),
      system: `You are a professional diplomatic terminology editor specializing in diplomatic terminology.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `You are a professional diplomatic terminology editor. Analyze the following text for professional diplomatic terminology compliance.
Document context: ${context || 'general'}

The following issues have already been detected programmatically:
${programmaticIssues.map((i) => `- "${i.term}" → "${i.suggestion}" (${i.severity})`).join('\n') || 'None'}

Now perform a deeper analysis for:
1. Additional terminology that doesn't meet professional diplomatic standards
2. Date format compliance (should be "1 January 2025" not "January 1st, 2025")
3. Number formatting (spell out one through nine, use figures for 10+)
4. Proper institutional references (full names on first reference)
5. Gender-inclusive language issues
6. Diplomatic register (too informal, too loaded, or too politically charged language)
7. Appropriate hedging for unverified claims

Text to analyze:
---
${text}
---

Include BOTH the programmatic issues AND any additional issues you identify. Calculate an overall compliance score (0-100).`,
    });
    const object = result.output;

    // Merge programmatic issues that weren't captured by AI
    const aiTerms = new Set(object.issues.map((i: { term: string }) => i.term.toLowerCase()));
    const mergedIssues = [...object.issues];
    for (const issue of programmaticIssues) {
      if (!aiTerms.has(issue.term.toLowerCase())) {
        mergedIssues.push(issue);
      }
    }

    const response = {
      text,
      context: context || 'general',
      issueCount: mergedIssues.length,
      issues: mergedIssues,
      overallCompliance: object.overallCompliance,
      complianceScore: object.complianceScore,
      styleRecommendations: object.styleRecommendations,
      recommendation: object.recommendation,
    };

    await saveToolOutput({
      uid: ctx.uid,
      situationId,
      toolId: 'terminology',
      profileVersion: ctx.calibration.provenance.profileVersion,
      output: response,
      toolRunId: ctx.toolRunId,
      metadata: {
        context: context || 'general',
        issueCount: mergedIssues.length,
        checker: 'un-terminology',
      },
    }).catch((err) => console.warn('[terminology] saveToolOutput failed:', err));

    return Response.json(response);
  } catch (err) {
    return handleRouteError(err, 'terminology');
  }
});
