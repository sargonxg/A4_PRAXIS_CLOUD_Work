/**
 * Brainstorming Table — Markdown export.
 *
 * Closes step 6 of `docs/AGENTIC_SYSTEM.md` First Implementation Queue and
 * item #7 of `docs/IMPROVEMENT_15_2026-04-26.md`.
 *
 * Renders a deliberation result as an analyst-grade Markdown memo:
 *   - frontmatter (question, generated-at, personas)
 *   - BLUF
 *   - Personas at the table
 *   - Deliberation table (one row per turn)
 *   - Synthesis (consensus, divergences, decision options, open questions,
 *     next actions)
 *   - Provenance footer (retrieval trace if present)
 *
 * Pure function — no DOM access. Page-level callers wrap it with a Blob
 * + URL.createObjectURL download.
 */

const PERSONA_LABEL: Record<string, string> = {
  mediator: 'Mediator',
  humanitarian: 'Humanitarian Lead',
  legal: 'Legal Analyst',
  media: 'Media Analyst',
  security: 'Security/Risk Analyst',
  'red-team': 'Red Team Critic',
  'synthesis-chair': 'Synthesis Chair',
  'source-scout': 'Source Scout',
  'graph-cartographer': 'Graph Cartographer',
  'timeline-editor': 'Timeline Editor',
};

interface Evidence {
  sourceType: string;
  sourceId?: string;
  excerpt: string;
}

interface Turn {
  turnId: string;
  persona: string;
  claim: string;
  evidence: Evidence[];
  critique?: string;
  recommendation?: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'proposed' | 'challenged' | 'accepted' | 'rejected';
}

interface Synthesis {
  bluf: string;
  consensusPoints: string[];
  divergences: string[];
  optionsForDecision: { label: string; tradeoffs: string; preferredBy?: string[] }[];
  openQuestions: string[];
  nextActions: { action: string; owner?: string; urgency: 'immediate' | 'short-term' | 'medium-term' }[];
}

export interface BrainstormingTableExportInput {
  question: string;
  generatedAt: string;
  personas: string[];
  turns: Turn[];
  synthesis: Synthesis;
  retrievalTrace?: { layersSearched: string[]; itemCount: number; durationMs: number };
  /** Optional analyst name for the memo header. */
  analystName?: string;
  /** Optional situation name. */
  situationName?: string;
}

export function brainstormingTableToMarkdown(input: BrainstormingTableExportInput): string {
  const lines: string[] = [];

  // YAML-style frontmatter for downstream tools (Obsidian, Pandoc, GitHub).
  lines.push('---');
  lines.push(`title: "Brainstorming Table — ${escapeQuoted(input.question)}"`);
  lines.push(`generated_at: ${input.generatedAt}`);
  if (input.situationName) lines.push(`situation: "${escapeQuoted(input.situationName)}"`);
  if (input.analystName) lines.push(`analyst: "${escapeQuoted(input.analystName)}"`);
  lines.push(`personas: [${input.personas.map((p) => `"${p}"`).join(', ')}]`);
  lines.push(`turns: ${input.turns.length}`);
  lines.push('---');
  lines.push('');

  // Title + BLUF
  lines.push(`# Brainstorming Table`);
  lines.push('');
  lines.push(`**Question.** ${input.question}`);
  lines.push('');
  lines.push(`> **BLUF.** ${input.synthesis.bluf}`);
  lines.push('');

  // Personas
  lines.push('## Personas at the table');
  lines.push('');
  for (const id of input.personas) {
    lines.push(`- **${PERSONA_LABEL[id] ?? id}** (\`${id}\`)`);
  }
  lines.push('');

  // Deliberation
  lines.push('## Deliberation');
  lines.push('');
  for (const turn of input.turns) {
    const label = PERSONA_LABEL[turn.persona] ?? turn.persona;
    lines.push(`### ${label} — ${turn.status} · confidence ${turn.confidence}`);
    lines.push('');
    lines.push(`**Claim.** ${turn.claim}`);
    if (turn.evidence.length > 0) {
      lines.push('');
      lines.push('**Evidence.**');
      for (const e of turn.evidence) {
        const sid = e.sourceId ? ` \`${e.sourceId}\`` : '';
        lines.push(`- _[${e.sourceType}]${sid}_ ${e.excerpt}`);
      }
    } else {
      lines.push('');
      lines.push('_No corpus evidence cited (sourceType=reasoning)._');
    }
    if (turn.critique) {
      lines.push('');
      lines.push(`**Critique.** ${turn.critique}`);
    }
    if (turn.recommendation) {
      lines.push('');
      lines.push(`**Recommendation.** ${turn.recommendation}`);
    }
    lines.push('');
  }

  // Synthesis
  lines.push('## Synthesis');
  lines.push('');

  if (input.synthesis.consensusPoints.length > 0) {
    lines.push('### Consensus');
    for (const p of input.synthesis.consensusPoints) lines.push(`- ${p}`);
    lines.push('');
  }
  if (input.synthesis.divergences.length > 0) {
    lines.push('### Divergences');
    for (const p of input.synthesis.divergences) lines.push(`- ${p}`);
    lines.push('');
  }

  if (input.synthesis.optionsForDecision.length > 0) {
    lines.push('### Options for decision');
    for (const opt of input.synthesis.optionsForDecision) {
      const preferred = opt.preferredBy && opt.preferredBy.length > 0
        ? ` _(preferred by ${opt.preferredBy.map((p) => PERSONA_LABEL[p] ?? p).join(', ')})_`
        : '';
      lines.push(`- **${opt.label}**${preferred}`);
      lines.push(`  - Trade-offs: ${opt.tradeoffs}`);
    }
    lines.push('');
  }

  if (input.synthesis.openQuestions.length > 0) {
    lines.push('### Open questions');
    for (const q of input.synthesis.openQuestions) lines.push(`- ${q}`);
    lines.push('');
  }

  if (input.synthesis.nextActions.length > 0) {
    lines.push('### Next actions');
    for (const a of input.synthesis.nextActions) {
      const owner = a.owner ? ` _(owner: ${a.owner})_` : '';
      lines.push(`- **${a.urgency}** — ${a.action}${owner}`);
    }
    lines.push('');
  }

  // Provenance footer
  lines.push('---');
  lines.push('');
  lines.push('## Provenance');
  lines.push('');
  lines.push(`- Generated: \`${input.generatedAt}\``);
  lines.push(`- Personas: \`${input.personas.join(', ')}\``);
  lines.push(`- Turns: ${input.turns.length}`);
  if (input.retrievalTrace) {
    lines.push(`- Corpus retrieval: ${input.retrievalTrace.itemCount} items across ${input.retrievalTrace.layersSearched.join(', ')} (${input.retrievalTrace.durationMs}ms)`);
  } else {
    lines.push('- Corpus retrieval: not recorded (synchronous prototype run)');
  }
  lines.push('');
  lines.push('_Generated by PRAXIS Brainstorming Table — exported on ' + new Date().toISOString() + '_');

  return lines.join('\n');
}

/** Suggested filename for the download (no extension). */
export function brainstormingTableFilename(input: BrainstormingTableExportInput): string {
  const slug = (input.situationName || 'situation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'situation';
  const date = (input.generatedAt || new Date().toISOString()).slice(0, 10);
  return `brainstorming-${slug}-${date}`;
}

function escapeQuoted(value: string): string {
  return (value || '').replace(/"/g, '\\"');
}
