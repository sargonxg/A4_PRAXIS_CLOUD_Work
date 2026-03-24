import { z } from 'zod';

export function validateAiRequest<T>(body: unknown, schema: z.ZodType<T>): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(body);
  if (!result.success) {
    console.warn('[validateAiRequest] Validation failed:', result.error.issues);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Validation failed', details: result.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return { success: true, data: result.data };
}
