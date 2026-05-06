import { motion } from "framer-motion";

type StepIconProps = {
  delay: number;
  reducedMotion: boolean;
};

export function InheritIcon({ delay, reducedMotion }: StepIconProps) {
  return (
    <svg viewBox="0 0 180 128" className="h-full w-full" aria-hidden="true">
      <rect x="22" y="66" width="76" height="36" rx="8" fill="#FFF8E7" stroke="#E8B931" strokeOpacity="0.62" />
      <text x="60" y="88" textAnchor="middle" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="800" fill="#1B3A5C">Library</text>
      <motion.g
        animate={reducedMotion ? {} : { x: [34, 0, 0, 34], y: [-24, 0, 0, -24], rotate: [-10, 0, 0, -10], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
        style={{ transformOrigin: "76px 54px" }}
      >
        <rect x="48" y="25" width="55" height="34" rx="5" fill="#FFFFFF" stroke="#4B92DB" strokeOpacity="0.32" />
        <text x="56" y="40" fontSize="7" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="800" fill="#1B3A5C">JSON-LD</text>
        <circle cx="86" cy="49" r="10" fill="#E8B931" fillOpacity="0.2" stroke="#E8B931" strokeOpacity="0.78" strokeWidth="2" />
      </motion.g>
      <motion.g
        animate={reducedMotion ? {} : { x: [0, -18, -18, 0], opacity: [0.74, 1, 1, 0.74] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 1.2 }}
      >
        <circle cx="138" cy="53" r="8" fill="#1B3A5C" fillOpacity="0.55" />
        <path d="M126 94q12-29 24 0" fill="#1B3A5C" fillOpacity="0.22" stroke="#1B3A5C" strokeOpacity="0.45" />
        <path d="M119 78h28" stroke="#E8B931" strokeOpacity="0.74" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}
