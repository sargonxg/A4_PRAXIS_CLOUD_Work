import { PubSub } from '@google-cloud/pubsub';

let client: PubSub | null = null;

type PubSubJsonInput = {
  topicName: string;
  payload: Record<string, unknown>;
  attributes?: Record<string, string | null | undefined>;
  logPrefix?: string;
};

type PubSubPushEnvelope = {
  message?: {
    data?: string;
    attributes?: Record<string, string>;
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
};

export function getPubSubClient(): PubSub {
  if (!client) client = new PubSub();
  return client;
}

export async function publishPubSubJson(input: PubSubJsonInput): Promise<boolean> {
  try {
    await getPubSubClient().topic(input.topicName).publishMessage({
      data: Buffer.from(JSON.stringify(input.payload)),
      attributes: compactAttributes(input.attributes ?? {}),
    });
    return true;
  } catch (err) {
    console.warn(`[${input.logPrefix ?? 'pubsub'}] publish failed (non-fatal):`, err);
    return false;
  }
}

export function decodePubSubJsonEnvelope<T = Record<string, unknown>>(envelope: unknown): {
  ok: true;
  payload: T;
  attributes: Record<string, string>;
  messageId: string | null;
  publishTime: string | null;
} | {
  ok: false;
  error: string;
} {
  if (!isPushEnvelope(envelope)) {
    return { ok: false, error: 'Invalid Pub/Sub push envelope' };
  }

  const encoded = envelope.message?.data;
  if (!encoded) {
    return { ok: false, error: 'Pub/Sub message data is required' };
  }

  try {
    const text = Buffer.from(encoded, 'base64').toString('utf8');
    return {
      ok: true,
      payload: JSON.parse(text) as T,
      attributes: envelope.message?.attributes ?? {},
      messageId: envelope.message?.messageId ?? null,
      publishTime: envelope.message?.publishTime ?? null,
    };
  } catch {
    return { ok: false, error: 'Pub/Sub message data must be base64 encoded JSON' };
  }
}

function compactAttributes(input: Record<string, string | null | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

function isPushEnvelope(value: unknown): value is PubSubPushEnvelope {
  return typeof value === 'object' && value !== null && 'message' in value;
}
