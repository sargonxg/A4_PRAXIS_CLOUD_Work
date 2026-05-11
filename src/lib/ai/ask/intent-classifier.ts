import { getMethodById, MVP_METHODS } from '@/lib/methods/catalog';
import { commandToMode, parseAskCommand, type AskMode } from '@/lib/ai/ask/slash-commands';

export interface AskIntentPlan {
  intent: 'answer' | 'research' | 'draft' | 'analysis' | 'scenario' | 'citation';
  mode: AskMode;
  methodIds: string[];
  sourceCount: number;
  latencyLabel: string;
  effortLabel: string;
  steps: string[];
  confidence: 'low' | 'medium' | 'high';
  requiresConfirmation: boolean;
  unavailableReason?: string;
}

export function classifyAskIntent(input: { prompt: string; explicitMode: AskMode; hasContext: boolean }): AskIntentPlan {
  const parsed = parseAskCommand(input.prompt);
  const mode = commandToMode(parsed.command) ?? input.explicitMode;
  const text = parsed.text.toLowerCase();
  const mentionedMethod = parsed.methodMention ? getMethodById(parsed.methodMention) : null;

  if (!input.hasContext && mode !== 'quick') {
    return buildPlan({
      intent: 'answer',
      mode,
      methodIds: ['deep-research', 'contradiction-finder'].filter((id) => getMethodById(id)),
      sourceCount: 0,
      confidence: 'low',
      requiresConfirmation: true,
      unavailableReason: 'Select a context before running deeper work.',
    });
  }

  if (mentionedMethod) {
    return buildPlan({
      intent: mentionedMethod.category === 'research' ? 'research' : mentionedMethod.id === 'memo-drafter' ? 'draft' : 'analysis',
      mode,
      methodIds: [mentionedMethod.id],
      sourceCount: input.hasContext ? 4 : 0,
      confidence: 'medium',
      requiresConfirmation: mode !== 'quick',
    });
  }

  if (parsed.command === 'memo' || parsed.command === 'brief' || /\bmemo|brief|draft\b/.test(text)) {
    return buildPlan({
      intent: 'draft',
      mode: mode === 'auto' ? 'memo' : mode,
      methodIds: ['memo-drafter', 'contradiction-finder'],
      sourceCount: input.hasContext ? 5 : 0,
      confidence: 'medium',
      requiresConfirmation: true,
    });
  }

  if (parsed.command === 'research' || /\bresearch|source|update|who says|evidence\b/.test(text)) {
    return buildPlan({
      intent: 'research',
      mode: mode === 'auto' ? 'research' : mode,
      methodIds: ['deep-research', 'contradiction-finder'],
      sourceCount: input.hasContext ? 6 : 0,
      confidence: 'medium',
      requiresConfirmation: true,
    });
  }

  if (parsed.command === 'scenarios' || /\bscenario|forecast|risk|path|next\b/.test(text)) {
    return buildPlan({
      intent: 'scenario',
      mode: mode === 'auto' ? 'scenario' : mode,
      methodIds: ['scenario-projector', 'stakeholder-power-interest-map'],
      sourceCount: input.hasContext ? 4 : 0,
      confidence: 'medium',
      requiresConfirmation: true,
    });
  }

  if (parsed.command === 'ach' || /\bhypothesis|explain|why|competing\b/.test(text)) {
    return buildPlan({
      intent: 'analysis',
      mode: mode === 'auto' ? 'deep' : mode,
      methodIds: ['ach', 'contradiction-finder'],
      sourceCount: input.hasContext ? 3 : 0,
      confidence: 'medium',
      requiresConfirmation: true,
    });
  }

  return buildPlan({
    intent: 'answer',
    mode: mode === 'auto' ? 'quick' : mode,
    methodIds: ['contradiction-finder'],
    sourceCount: input.hasContext ? 3 : 0,
    confidence: input.hasContext ? 'high' : 'medium',
    requiresConfirmation: mode !== 'quick',
  });
}

function buildPlan(input: Omit<AskIntentPlan, 'latencyLabel' | 'effortLabel' | 'steps'>): AskIntentPlan {
  const methods = input.methodIds
    .map((id) => MVP_METHODS.find((method) => method.id === id))
    .filter(Boolean);
  const names = methods.map((method) => method?.name).filter(Boolean) as string[];

  return {
    ...input,
    latencyLabel: input.mode === 'quick' ? 'short' : input.mode === 'research' ? 'longer' : 'standard',
    effortLabel: input.mode === 'quick' ? 'light' : input.mode === 'deep' || input.mode === 'research' ? 'high' : 'standard',
    steps: [
      'Check selected user model and context',
      names.length ? `Prepare ${names.join(' + ')}` : 'Prepare a direct answer',
      input.sourceCount > 0 ? `Use ${input.sourceCount} available source signals` : 'Report missing source coverage honestly',
      input.intent === 'draft' ? 'Send usable output to Drafting Studio when available' : 'Return answer with confidence and next actions',
    ],
  };
}
