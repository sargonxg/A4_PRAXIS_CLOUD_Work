export interface AiActAckContext {
  aiActAcknowledgedAt?: string;
}

export function requireAiActAck(req: Request): Response | null {
  const ack = req.headers.get('X-AI-Act-Ack');
  if (!ack) {
    return new Response(JSON.stringify({
      error: 'AI Act ack required',
      message: 'This is decision support, not a decision. A human analyst must acknowledge before running this high-risk verb.',
    }), {
      status: 428,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

export function aiActAcknowledgedAt(req: Request): string | undefined {
  return req.headers.get('X-AI-Act-Ack') ? new Date().toISOString() : undefined;
}
