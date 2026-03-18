import { generateObject } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { z } from 'zod';

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

// Programmatic checks for common UN terminology issues
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
          reason: `"${match}" is not standard UN terminology. Use "${check.suggestion}" instead.`,
          severity: check.severity,
        });
      }
    }
  }

  return issues;
}

export async function POST(request: Request) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in Vercel environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { text, context } = await request.json();

    if (!text) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    // Run fast programmatic checks first
    const programmaticIssues = runProgrammaticChecks(text);

    // Use Gemini for nuanced analysis
    const { object } = await generateObject({
      model: getModel(),
      schema: TerminologyResponseSchema,
      prompt: `You are a UN Editorial Manual expert. Analyze the following text for UN terminology compliance.
Document context: ${context || 'general'}

The following issues have already been detected programmatically:
${programmaticIssues.map((i) => `- "${i.term}" → "${i.suggestion}" (${i.severity})`).join('\n') || 'None'}

Now perform a deeper analysis for:
1. Additional terminology that doesn't meet UN standards
2. Date format compliance (should be "1 January 2025" not "January 1st, 2025")
3. Number formatting (spell out one through nine, use figures for 10+)
4. Proper UN body references (full names on first reference)
5. Gender-inclusive language issues
6. Diplomatic register (too informal, too loaded, or too politically charged language)
7. Appropriate hedging for unverified claims

Text to analyze:
---
${text}
---

Include BOTH the programmatic issues AND any additional issues you identify. Calculate an overall compliance score (0-100).`,
    });

    // Merge programmatic issues that weren't captured by AI
    const aiTerms = new Set(object.issues.map((i: { term: string }) => i.term.toLowerCase()));
    const mergedIssues = [...object.issues];
    for (const issue of programmaticIssues) {
      if (!aiTerms.has(issue.term.toLowerCase())) {
        mergedIssues.push(issue);
      }
    }

    return Response.json({
      text,
      context: context || 'general',
      issueCount: mergedIssues.length,
      issues: mergedIssues,
      overallCompliance: object.overallCompliance,
      complianceScore: object.complianceScore,
      styleRecommendations: object.styleRecommendations,
      recommendation: object.recommendation,
    });
  } catch (err) {
    console.error('Terminology route error:', err);
    return Response.json({ error: 'Terminology check failed' }, { status: 500 });
  }
}
