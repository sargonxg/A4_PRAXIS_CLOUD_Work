export function aiError(status: number, message: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({ error: message, ...(details ? { details } : {}) }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

export function handleRouteError(err: unknown, routeName: string): Response {
  console.error(`[${routeName}]`, err instanceof Error ? err.message : err);
  return new Response(
    JSON.stringify({ error: `Internal error in ${routeName}` }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
