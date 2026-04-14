export function aiError(status: number, message: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({ error: message, ...(details ? { details } : {}) }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

export function handleRouteError(err: unknown, routeName: string): Response {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${routeName}] ${message}`, err);
  return new Response(
    JSON.stringify({
      error: `Internal error in ${routeName}`,
      // Include detail in dev or when it's an AI/model error (helps diagnose model ID / API key issues)
      detail: process.env.NODE_ENV !== 'production' || message.includes('model') || message.includes('API') || message.includes('quota')
        ? message
        : undefined,
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
