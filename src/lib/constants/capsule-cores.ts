/**
 * Capsule-core inventory — the 12 typed slots a PRAXIS capsule can hold.
 *
 * Visual identity uses these to render the 12-dot strip and the honeycomb
 * section on the landing page. Keep this aligned with the canonical core
 * inventory in src/lib/tools/contract.ts (CoreKind) plus the extended
 * presentation cores (objective, product, output, memory) used by
 * src/lib/context/capsule-service.ts.
 */

export type CapsuleCoreKey =
  | "user"
  | "situation"
  | "path"
  | "source"
  | "document"
  | "graph"
  | "time"
  | "tool"
  | "objective"
  | "product"
  | "output"
  | "memory";

export type CapsuleCoreDef = {
  key: CapsuleCoreKey;
  label: string;
  /** One-line definition shown on hover/tap. */
  description: string;
  /** Hex color used for the 8px dot + honeycomb tile accent. */
  color: string;
};

export const CAPSULE_CORES: readonly CapsuleCoreDef[] = [
  {
    key: "user",
    label: "User",
    description: "Who you are, how you analyse, what tone and language you ship in.",
    color: "#1B3A5C",
  },
  {
    key: "situation",
    label: "Situation",
    description: "The case, country, or file in scope — actors, geography, time horizon.",
    color: "#4B92DB",
  },
  {
    key: "path",
    label: "Path",
    description: "The workflow you are on: research, mediation, sanctions, humanitarian.",
    color: "#7B6D8D",
  },
  {
    key: "source",
    label: "Source",
    description: "Vetted feeds, documents, and receipts the capsule can cite from.",
    color: "#C75B39",
  },
  {
    key: "document",
    label: "Document",
    description: "Private papers, transcripts, and uploads attached to this capsule.",
    color: "#A37A14",
  },
  {
    key: "graph",
    label: "Graph",
    description: "Actor / claim / interest / leverage network reachable from this case.",
    color: "#5B8C5A",
  },
  {
    key: "time",
    label: "Time",
    description: "The window you are reasoning over and the freshness budget for sources.",
    color: "#3D5A80",
  },
  {
    key: "tool",
    label: "Tool",
    description: "The 55 registered analytical surfaces this capsule is allowed to call.",
    color: "#4A90A4",
  },
  {
    key: "objective",
    label: "Objective",
    description: "The decision, brief, or product the capsule is being assembled for.",
    color: "#A63D40",
  },
  {
    key: "product",
    label: "Product",
    description: "The output template selected — country one-pager, cable, options memo.",
    color: "#D4A373",
  },
  {
    key: "output",
    label: "Output",
    description: "Prior output capsules linked into this one — composable provenance.",
    color: "#E8B931",
  },
  {
    key: "memory",
    label: "Memory",
    description: "Institutional recall — what was decided before, by whom, with what caveats.",
    color: "#574A6A",
  },
] as const;

export const CAPSULE_CORE_BY_KEY: Record<CapsuleCoreKey, CapsuleCoreDef> =
  Object.fromEntries(CAPSULE_CORES.map((c) => [c.key, c])) as Record<
    CapsuleCoreKey,
    CapsuleCoreDef
  >;
