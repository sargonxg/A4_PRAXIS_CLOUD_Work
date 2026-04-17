/**
 * Vertex AI Agent Engine (ADK Deep Search) Client
 *
 * Connects PRAXIS to the Google ADK Deep Search agent deployed on
 * Vertex AI Agent Engine under project: praxisbytacitus
 *
 * Required env vars:
 *   VERTEX_AGENT_ENGINE_ID   — Reasoning Engine numeric ID
 *   VERTEX_AGENT_LOCATION    — Region (default: us-central1)
 *
 * Auth uses FIREBASE_SERVICE_ACCOUNT_KEY (already required for PRAXIS)
 * → the service account must have the "Vertex AI User" IAM role.
 */

import { GoogleAuth } from 'google-auth-library';

const DEFAULT_LOCATION = 'us-central1';
const PROJECT_ID = 'praxisbytacitus';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface VertexAgentConfig {
  projectId: string;
  location: string;
  engineId: string;
}

export function getVertexAgentConfig(): VertexAgentConfig | null {
  const engineId = process.env.VERTEX_AGENT_ENGINE_ID;
  if (!engineId) return null;
  return {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || PROJECT_ID,
    location: process.env.VERTEX_AGENT_LOCATION || DEFAULT_LOCATION,
    engineId,
  };
}

export function isVertexAgentConfigured(): boolean {
  return !!process.env.VERTEX_AGENT_ENGINE_ID;
}

// ---------------------------------------------------------------------------
// Auth — reuse Firebase service account credentials for Vertex AI
// ---------------------------------------------------------------------------

let authInstance: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (authInstance) return authInstance;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set — required for Vertex AI auth');
  const credentials = JSON.parse(raw);
  authInstance = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  return authInstance;
}

async function getAccessToken(): Promise<string> {
  const auth = getAuth();
  const token = await auth.getAccessToken();
  if (!token) throw new Error('Failed to obtain Google Cloud access token');
  return token;
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

export async function createSession(config: VertexAgentConfig): Promise<string> {
  const { projectId, location, engineId } = config;
  const token = await getAccessToken();
  const url = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/reasoningEngines/${engineId}/sessions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create session: HTTP ${res.status} — ${text.slice(0, 300)}`);
  }

  const data = await res.json() as { name?: string };
  // name format: "projects/.../reasoningEngines/.../sessions/SESSION_ID"
  const parts = (data.name || '').split('/');
  const sessionId = parts[parts.length - 1];
  if (!sessionId) throw new Error('Session created but no session ID returned');
  return sessionId;
}

// ---------------------------------------------------------------------------
// Streaming turn execution
// ---------------------------------------------------------------------------

/**
 * Streams a turn in an existing ADK agent session.
 * Returns a ReadableStream of SSE text chunks that can be piped to the client.
 *
 * ADK SSE event format (from Vertex AI Agent Engine):
 *   data: {"content":{"parts":[{"text":"..."}]},"role":"model","author":"agent_name"}
 * or:
 *   data: {"output":{"text":"..."},"done":false}
 * or:
 *   data: [DONE]
 *
 * @param firebaseUid - Firebase UID used to scope Memory Bank per user
 * @param sessionId   - Session ID scoped within the user (for session continuity)
 */
export async function streamAgentTurn(
  config: VertexAgentConfig,
  sessionId: string,
  userMessage: string,
  firebaseUid?: string,
): Promise<Response> {
  const { projectId, location, engineId } = config;
  const token = await getAccessToken();
  const url = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/reasoningEngines/${engineId}/sessions/${sessionId}/turns:run`;

  const requestBody: Record<string, unknown> = {
    class_method: 'stream_query',
    input: {
      message: userMessage,
      ...(firebaseUid ? { user_id: firebaseUid } : {}),
      session_id: sessionId,
    },
  };

  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(requestBody),
  });
}

/**
 * Single-shot query (no session) — useful for simple queries.
 * Uses the streamQuery endpoint.
 */
export async function streamAgentQuery(
  config: VertexAgentConfig,
  query: string,
): Promise<Response> {
  const { projectId, location, engineId } = config;
  const token = await getAccessToken();
  const url = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/reasoningEngines/${engineId}:streamQuery`;

  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      input: { input_text: query },
    }),
  });
}

// ---------------------------------------------------------------------------
// SSE parsing utilities
// ---------------------------------------------------------------------------

export interface AgentEvent {
  type: 'text' | 'plan' | 'research_step' | 'source' | 'report' | 'error' | 'done' | 'status';
  author?: string;   // ADK agent name (e.g., "section_researcher", "report_composer_with_citations")
  text?: string;
  url?: string;
  title?: string;
  phase?: 'planning' | 'research' | 'synthesis';
  raw?: unknown;
}

/**
 * Parse a single SSE data line from the Vertex AI Agent Engine into a structured AgentEvent.
 * Handles multiple possible response formats from different ADK agent versions.
 */
export function parseAgentEvent(dataLine: string): AgentEvent | null {
  if (!dataLine || dataLine === '[DONE]') return { type: 'done' };

  try {
    const obj = JSON.parse(dataLine) as Record<string, unknown>;

    // Format 1: {content: {parts: [{text: "..."}]}, role: "model", author: "agent_name"}
    const content = obj.content as { parts?: Array<{ text?: string }> } | undefined;
    if (content?.parts) {
      const text = content.parts.map((p) => p.text || '').join('');
      const author = (obj.author as string) || '';
      const phase = inferPhase(author);
      return { type: 'text', text, author, phase, raw: obj };
    }

    // Format 2: {output: {text: "..."}, done: bool}
    const output = obj.output as { text?: string } | undefined;
    if (output?.text !== undefined) {
      if (obj.done === true) return { type: 'done' };
      return { type: 'text', text: output.text, phase: 'research', raw: obj };
    }

    // Format 3: {response: {output: {text: "..."}}} (streamQuery format)
    const response = obj.response as { output?: { text?: string } } | undefined;
    if (response?.output?.text) {
      return { type: 'text', text: response.output.text, phase: 'research', raw: obj };
    }

    // Format 4: {text: "..."} simple
    if (typeof obj.text === 'string') {
      return { type: 'text', text: obj.text, phase: 'research', raw: obj };
    }

    // Format 5: done signal
    if (obj.done === true || obj.finished === true) {
      return { type: 'done' };
    }

    // Unknown format — forward as-is
    return { type: 'status', text: JSON.stringify(obj), raw: obj };
  } catch {
    // Plain text chunk
    if (dataLine.trim()) return { type: 'text', text: dataLine };
    return null;
  }
}

/**
 * Infer the research phase from the ADK agent author name.
 * Matches agent names defined in the ADK Deep Search app/agent.py.
 */
function inferPhase(author: string): AgentEvent['phase'] {
  const a = author.toLowerCase();
  if (a.includes('planner') || a.includes('plan_generator')) return 'planning';
  if (a.includes('researcher') || a.includes('search') || a.includes('critic')) return 'research';
  if (a.includes('composer') || a.includes('synthesis') || a.includes('report')) return 'synthesis';
  return 'research';
}
