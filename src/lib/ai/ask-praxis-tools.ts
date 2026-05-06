/**
 * Ask PRAXIS extension tools.
 *
 * These tools are bound to the authenticated user + their active situation
 * and added to the chat tool set in /api/ai/chat (and /api/ai/ask-praxis).
 * Each tool either succeeds, returns a structured `requiresTier` payload,
 * or returns `requiresKey` so the UI can render an upgrade / settings chip.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { gateTier, type SubscriptionTier } from '@/lib/api/tier';
import { scrapeUrl } from '@/lib/ai/grounded-research';
import { createGraphUpdateProposal, type GraphUpdateKind } from '@/lib/firebase/graph-updates-service';

export interface AskPraxisToolBindings {
  uid: string;
  situationId: string | undefined;
  profileVersion: number;
  tier: SubscriptionTier;
  isDemo: boolean;
}

const TOOL_TIMEOUT_MS = 30_000;

/**
 * writeToTool — persist a structured payload to a tool output slot.
 * Used by Ask PRAXIS to populate briefing blocks, risk indicators, etc.
 */
export function makeWriteToTool(b: AskPraxisToolBindings) {
  return tool({
    description:
      'Persist a structured JSON payload to a tool output slot under the active situation. Use to populate briefing blocks, risk-indicator cards, timeline events, or any tool the user asked you to fill. Will no-op when the user has no active situation.',
    inputSchema: z.object({
      toolId: z.string().describe('Target tool id, e.g. "briefing", "risk-monitor", "timeline", "actor-profiles".'),
      payload: z
        .record(z.string(), z.any())
        .describe('Arbitrary JSON. Must match the target tool schema; the UI will validate before re-rendering.'),
      summary: z.string().describe('One-sentence human summary of what was written for confirmation chip.'),
    }),
    execute: async ({ toolId, payload, summary }) => {
      if (!b.situationId) {
        return {
          ok: false,
          error: 'no_active_situation',
          message: 'No active situation. Ask the user to open a situation first.',
        };
      }
      try {
        await saveToolOutput({
          uid: b.uid,
          situationId: b.situationId,
          toolId,
          profileVersion: b.profileVersion,
          output: payload,
          metadata: { source: 'ask-praxis', writtenAt: new Date().toISOString() },
        });
        return { ok: true, toolId, summary, _generatedAt: new Date().toISOString() };
      } catch (err) {
        return { ok: false, error: 'write_failed', message: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

/**
 * groundedSearchFetch — fetch one URL and return clean text.
 * Free tier: 5 fetches/session limit (best-effort, in-memory). Premium tier: unlimited.
 * Always returns structured payload — never throws.
 */
const groundedSearchFetchSessionCounters = new WeakMap<object, { count: number }>();

export function makeGroundedSearchFetch(b: AskPraxisToolBindings, sessionKey: object) {
  return tool({
    description:
      'Fetch a URL and return clean markdown content. Use sparingly — prefer webSearch first. Free users limited to 5 fetches per session; premium users unlimited.',
    inputSchema: z.object({
      url: z.string().url().describe('Absolute URL to scrape.'),
      reason: z.string().describe('One sentence why this fetch is needed (cited in the answer).'),
    }),
    execute: async ({ url, reason }) => {
      const gate = gateTier(b.tier, 'free');
      if (!gate.ok) return { requiresTier: gate.requiredTier, currentTier: gate.currentTier };

      // Per-session free-tier rate limit (best effort)
      if (b.tier === 'free') {
        const counter = groundedSearchFetchSessionCounters.get(sessionKey) ?? { count: 0 };
        counter.count += 1;
        groundedSearchFetchSessionCounters.set(sessionKey, counter);
        if (counter.count > 5) {
          return {
            ok: false,
            requiresTier: 'analyst',
            currentTier: b.tier,
            reason,
            message: 'Free tier limit reached: 5 fetches per session. Upgrade for unlimited fetches.',
          };
        }
      }

      try {
        const result = await Promise.race([
          scrapeUrl(url),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), TOOL_TIMEOUT_MS)),
        ]) as Awaited<ReturnType<typeof scrapeUrl>>;
        return {
          ok: true,
          url,
          title: result.title ?? '',
          markdown: result.content,
          via: 'grounded-google-search',
          reason,
          _generatedAt: new Date().toISOString(),
        };
      } catch (err) {
        return { ok: false, error: 'fetch_failed', message: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

/**
 * runDeepResearch — Vertex ADK Deep Research Agent (premium).
 * For free users, returns a stub that routes the question to grounded webSearch
 * and surfaces an upgrade hint.
 */
export function makeRunDeepResearch(b: AskPraxisToolBindings) {
  return tool({
    description:
      'Run a deep research task via the Vertex ADK Deep Research Agent. Premium tier feature — free users will be redirected to webSearch with an upgrade hint.',
    inputSchema: z.object({
      question: z.string(),
      depth: z.enum(['standard', 'deep']).default('standard'),
    }),
    execute: async ({ question, depth }) => {
      const gate = gateTier(b.tier, 'analyst');
      if (!gate.ok) {
        return {
          requiresTier: gate.requiredTier,
          currentTier: gate.currentTier,
          fallbackHint: 'Free users: ask the same question and the assistant will use grounded Google Search.',
          question,
          depth,
        };
      }
      // For paid users, surface a clear pointer to the deep-search-agent route.
      // Calling that route from within a tool would double-charge credits, so
      // we return a structured directive the UI can act on (deep-link).
      return {
        ok: true,
        directive: 'open_tool',
        toolPath: '/app/deep-search-agent',
        prefill: { question, depth },
        _generatedAt: new Date().toISOString(),
      };
    },
  });
}

export function makeProposeGraphDelta(b: AskPraxisToolBindings) {
  return tool({
    description:
      'Create a reviewable PRAXIS graph proposal for the active situation. Use when the user asks to add, correct, remove, or clarify an actor, claim, interest, constraint, event, commitment, risk, or relationship. Never directly mutate the canonical graph.',
    inputSchema: z.object({
      kind: z.enum(['node.add', 'node.edit', 'edge.add', 'edge.edit']),
      summary: z.string().min(8).max(300),
      confidence: z.number().min(0).max(1).default(0.65),
      payload: z.record(z.string(), z.any()).describe('For node changes include {node:{id,type,label,metadata}}. For edge changes include {edge:{source,target,type,label,metadata}}.'),
      provenance: z.object({
        sourceUrl: z.string().url().optional(),
        documentId: z.string().optional(),
        chunkId: z.string().optional(),
        rationale: z.string().max(800).optional(),
      }).optional(),
    }),
    execute: async ({ kind, summary, confidence, payload, provenance }) => {
      if (!b.situationId) {
        return {
          ok: false,
          error: 'no_active_situation',
          message: 'Open a situation before proposing graph changes.',
        };
      }
      try {
        const id = await createGraphUpdateProposal(b.uid, b.situationId, {
          kind: kind as GraphUpdateKind,
          confidence,
          summary,
          provenance: {
            sourceUrl: provenance?.sourceUrl,
            documentId: provenance?.documentId,
            chunkId: provenance?.chunkId,
            extractor: 'ask-praxis',
          },
          payload: {
            ...payload,
            rationale: provenance?.rationale,
            proposedBy: 'ask-praxis',
          },
        });
        return {
          ok: Boolean(id),
          proposalId: id,
          summary,
          message: id ? 'Graph proposal created for analyst review.' : 'Graph proposal could not be created.',
          _generatedAt: new Date().toISOString(),
        };
      } catch (err) {
        return { ok: false, error: 'graph_proposal_failed', message: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

/**
 * Build the four-tool bundle in one call.
 */
export function buildAskPraxisExtensions(b: AskPraxisToolBindings) {
  // sessionKey is a fresh anonymous object; the WeakMap lets the counter
  // be GC'd with the tool bundle when the request finishes.
  const sessionKey = {};
  return {
    writeToTool: makeWriteToTool(b),
    proposeGraphDelta: makeProposeGraphDelta(b),
    groundedSearchFetch: makeGroundedSearchFetch(b, sessionKey),
    runDeepResearch: makeRunDeepResearch(b),
  };
}
