"use client";

import { CAPSULE_CORES, type CapsuleCoreKey } from "@/lib/constants/capsule-cores";

/**
 * CapsuleStrip — 12-core dot strip rendered in cockpit headers.
 *
 * Reads core status from a partial map; missing keys default to "empty".
 * Designed to be a drop-in for the shared cockpit / workbench header. The
 * upstream component owns layout; CapsuleStrip is responsible only for the
 * dot row and tooltips.
 */

type CoreStatus = "filled" | "empty" | "stale";

export type CapsuleStripProps = {
  status?: Partial<Record<CapsuleCoreKey, CoreStatus>>;
  className?: string;
  /** Show inline labels next to dots (used in dense desktop chrome). */
  showLabels?: boolean;
};

const STATUS_OPACITY: Record<CoreStatus, number> = {
  filled: 1,
  empty: 0.25,
  stale: 0.55,
};

export function CapsuleStrip({
  status = {},
  className = "",
  showLabels = false,
}: CapsuleStripProps) {
  return (
    <ul
      role="list"
      aria-label="Capsule cores"
      className={`flex flex-wrap items-center gap-2.5 ${className}`}
    >
      {CAPSULE_CORES.map((c) => {
        const s: CoreStatus = status[c.key] ?? "empty";
        return (
          <li key={c.key} className="group relative inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="block h-2 w-2 rounded-full transition-all duration-200"
              style={{
                background: c.color,
                opacity: STATUS_OPACITY[s],
                boxShadow:
                  s === "filled"
                    ? `0 0 0 3px ${c.color}22`
                    : s === "stale"
                      ? `0 0 0 2px ${c.color}14`
                      : "none",
              }}
            />
            {showLabels ? (
              <span
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink)]/65"
              >
                {c.label}
              </span>
            ) : null}
            {/* Hover tooltip */}
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-[color:var(--color-ink)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white shadow-capsule group-hover:block group-focus-within:block"
            >
              {c.label} · {s}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default CapsuleStrip;
