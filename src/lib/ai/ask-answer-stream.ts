import { streamText, stepCountIs, type ToolSet } from 'ai';

// Leave the final round available for an answer, even when the model keeps
// requesting tools. The SDK carries all prior tool results into that round.
const MAX_ASK_STEPS = 6;

export function streamAskAnswer<TOOLS extends ToolSet>(
  options: Parameters<typeof streamText<TOOLS>>[0] & { system: string },
) {
  return streamText({
    ...options,
    stopWhen: stepCountIs(MAX_ASK_STEPS),
    prepareStep: ({ stepNumber }) => stepNumber >= MAX_ASK_STEPS - 1 ? {
      toolChoice: 'none' as const,
      system: `${options.system}\n\nTool inspection is complete for this turn. Answer the user's question now using the evidence already available. Keep the requested length, cite only evidence you actually received, and state any missing information. Do not request further tools or claim that unfinished work is complete.`,
    } : undefined,
  });
}

export async function* requireAnswerText(stream: AsyncIterable<string>): AsyncGenerator<string> {
  let hasAnswer = false;
  for await (const text of stream) {
    if (text.trim()) hasAnswer = true;
    yield text;
  }
  if (!hasAnswer) {
    throw new Error('PRAXIS did not produce an answer. Please retry the question; your attached context is still available.');
  }
}
