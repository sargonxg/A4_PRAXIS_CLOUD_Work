/**
 * /api/ai/ask-praxis — calibrated streaming chat endpoint.
 *
 * Thin alias around /api/ai/chat that exists so client code can target a
 * named "ask-praxis" route without coupling to the historical "chat" name.
 * Behaviour is identical for now — the two routes diverge as Ask PRAXIS
 * gains its own tool extensions (writeToTool, groundedSearchFetch,
 * runDeepResearch) registered through the chat handler.
 *
 * Auditor: this route delegates auth + calibration + credit deduction to
 * the chat handler via re-export, so the calibration audit script will see
 * a single source of truth.
 */

export { POST } from '../chat/route';
export const maxDuration = 60;
