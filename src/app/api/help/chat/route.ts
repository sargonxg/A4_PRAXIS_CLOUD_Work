import { streamText, type ModelMessage } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { withAuth } from '@/lib/api/with-auth';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { toLegacyDataStreamResponse } from '@/lib/ai/legacy-data-stream';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const HelpChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.unknown().optional(),
    text: z.unknown().optional(),
  })).min(1).max(12),
});

const PRODUCT_HELP_SYSTEM_PROMPT = [
  'You are PRAXIS product help.',
  'Answer only about how PRAXIS works: Ask PRAXIS, ContextCapsules, the Capsule Dock, navigation, agentic workflows, receipts, public Guide pages, and DIALECTICA as the context-building direction.',
  'This endpoint never reads or writes user capsules, situations, documents, conversations, saved threads, usage ledgers, or AgentRuns.',
  'Do not imply access to the user workspace, private sources, billing, credentials, saved capsules, active situation data, or hidden system state.',
  'If the user asks about their own data, tell them to use the visible PRAXIS workspace surface.',
  'Keep the answer compact and actionable.',
].join('\n');

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = validateAiRequest(body, HelpChatSchema);
    if (!validation.success) return validation.response;

    const messages = validation.data.messages
      .map((message): ModelMessage | null => {
        const content = cleanMessageContent(message.content ?? message.text);
        if (!content) return null;
        return { role: message.role, content };
      })
      .filter((message): message is ModelMessage => Boolean(message));

    if (!messages.length) {
      return Response.json({ error: 'A product-help message is required.' }, { status: 400 });
    }

    const result = streamText({
      model: getModel(),
      system: PRODUCT_HELP_SYSTEM_PROMPT,
      messages,
      maxOutputTokens: 700,
    });

    return toLegacyDataStreamResponse(result.textStream, {
      headers: {
        'X-PRAXIS-Help-Scope': 'product-only',
      },
    });
  } catch (err) {
    return handleRouteError(err, 'help.chat');
  }
});

function cleanMessageContent(value: unknown): string {
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim().slice(0, 1200);
  if (value == null) return '';
  try {
    return JSON.stringify(value).slice(0, 1200);
  } catch {
    return String(value).slice(0, 1200);
  }
}
