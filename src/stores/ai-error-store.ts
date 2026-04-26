'use client';

/**
 * Cross-tool AI error channel.
 *
 * Tool reliability audit (`docs/TOOL_RELIABILITY_AUDIT_2026-04-26.md`,
 * F-CCM-1) flagged that a 5xx from any AI route currently surfaces only
 * to the inline error state of the calling page — there's no platform-wide
 * signal. This store + the matching `<AiErrorToast />` primitive give
 * every tool a single channel to publish to, and analysts a consistent
 * top-right toast they recognise across pages.
 *
 * The store intentionally stays minimal: a queue of {id, toolId, status,
 * message, retryable, retry?}. UI consumes via Zustand selectors.
 */

import { create } from 'zustand';

export interface AiErrorEntry {
  id: string;
  toolId: string;
  status: number;
  message: string;
  /** When true, the toast renders a Retry button calling `retry()`. */
  retryable?: boolean;
  retry?: () => void | Promise<void>;
  /** ISO timestamp the error was published. */
  at: string;
}

interface AiErrorStore {
  errors: AiErrorEntry[];
  publish: (input: Omit<AiErrorEntry, 'id' | 'at'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;

export const useAiErrorStore = create<AiErrorStore>((set) => ({
  errors: [],
  publish: (input) => {
    const id = `aierr-${++counter}-${Date.now().toString(36)}`;
    const entry: AiErrorEntry = { ...input, id, at: new Date().toISOString() };
    set((s) => ({ errors: [...s.errors, entry] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ errors: s.errors.filter((e) => e.id !== id) })),
  clear: () => set({ errors: [] }),
}));

/**
 * Pure helper for unit tests. Increments the counter so every call is
 * guaranteed-unique even within the same millisecond.
 */
export function nextErrorId(): string {
  return `aierr-${++counter}-${Date.now().toString(36)}`;
}
