export type ResearchUpdateType =
  | 'subQuestionGenerated'
  | 'sourceFound'
  | 'extractionCandidate'
  | 'finalReport'
  | 'unavailable';

export interface ResearchUpdate {
  type: ResearchUpdateType;
  payload: unknown;
}

export async function* runResearch(
  question: string,
  contextId: string,
  userModelId: string,
): AsyncIterable<ResearchUpdate> {
  const response = await fetch('/api/research/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, contextId, userModelId }),
  });
  if (!response.ok || !response.body) {
    yield { type: 'unavailable', payload: { status: response.status, message: 'Research pipeline is unavailable.' } };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const event = part.match(/^event:\s*(.+)$/m)?.[1] as ResearchUpdateType | undefined;
      const data = part.match(/^data:\s*(.+)$/m)?.[1];
      if (event && data) yield { type: event, payload: JSON.parse(data) };
    }
  }
}
