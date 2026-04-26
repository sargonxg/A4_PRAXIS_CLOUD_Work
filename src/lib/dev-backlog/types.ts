/**
 * Developer Backlog — types.
 *
 * Authored 2026-04-26 round 4. The backlog is a Firestore-backed running
 * record of friction signals, errors, and improvement ideas that PRAXIS
 * collects continuously while users work. Code agents (Claude Code, Codex)
 * read it via `/api/intelligence/dev-backlog` to plan their next lane —
 * "what hurt the most this week?" becomes a query, not a guess.
 *
 * Three sources populate it:
 *   1. Auto-collected from `withCalibration` failures, route 5xx, slow
 *      tool runs (>30s), corpus-search empty hits.
 *   2. User-submitted via the in-app "Report friction" button (planned).
 *   3. Agent-flagged when a tool can't proceed (e.g. Source Scout
 *      exhausts plausible queries — dispatches a `kind: idea` row asking
 *      for a new feed source).
 *
 * Spec: docs/IMPROVEMENT_15_2026-04-26.md item — round 4 brick.
 */

export type DevBacklogKind =
  | 'error.route'           // 5xx surfaced from an AI route
  | 'error.calibration'     // withCalibration gate fired (auth/credits/onboarding)
  | 'perf.slow-tool'        // tool run > threshold seconds
  | 'corpus.empty'          // searchSituationCorpus returned 0 items
  | 'ux.friction'           // user-submitted friction report
  | 'idea.agent'            // agent-suggested improvement
  | 'idea.user'             // user-suggested improvement
  | 'data.gap';             // tool couldn't ground a claim — feed/source gap

export type DevBacklogSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type DevBacklogStatus =
  | 'open'
  | 'investigating'
  | 'queued'
  | 'in-progress'
  | 'resolved'
  | 'wontfix'
  | 'duplicate';

export interface DevBacklogEntry {
  id: string;
  kind: DevBacklogKind;
  source: 'auto' | 'agent' | 'user';
  severity: DevBacklogSeverity;
  status: DevBacklogStatus;
  /** Brief actionable summary (one sentence). */
  message: string;
  /** Optional analyst-grade detail; capped at 4 KB by the writer. */
  detail?: string;
  /** Optional structured pointers — tool, situation, user, route, status. */
  toolId?: string;
  situationId?: string;
  uid?: string;
  route?: string;
  httpStatus?: number;
  /** Optional suggestion the agent / user proposes. */
  suggestedFix?: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  /** Auto-pruned via Firestore TTL after 90 days for low / info entries;
   *  365 days for high / critical. */
  expiresAt: string;
  /** Hash of a normalised signature so duplicates fold instead of flooding. */
  dedupeKey: string;
  /** How many times the same dedupeKey was published before reset. */
  occurrences: number;
  /** Brick id (e.g. BIG #18) once a backlog row gets adopted into a brick. */
  brickId?: string;
}

export interface DevBacklogQuery {
  kind?: DevBacklogKind;
  severity?: DevBacklogSeverity;
  status?: DevBacklogStatus;
  toolId?: string;
  situationId?: string;
  /** Look-back window in days. Default 14. */
  sinceDays?: number;
  limit?: number;
}

export const DEFAULT_BACKLOG_LIMIT = 50;
export const MAX_BACKLOG_LIMIT = 200;
export const DEFAULT_LOOKBACK_DAYS = 14;
