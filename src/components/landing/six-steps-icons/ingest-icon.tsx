import { motion } from "framer-motion";

type StepIconProps = {
  delay: number;
  reducedMotion: boolean;
};

export function IngestIcon({ delay, reducedMotion }: StepIconProps) {
  const animate = reducedMotion
    ? {}
    : {
        y: [-34, 0, 0, -34],
        opacity: [0, 1, 1, 0],
      };

  return (
    <svg viewBox="0 0 180 128" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="ingest-tray" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="100%" stopColor="#E8B931" stopOpacity="0.32" />
        </linearGradient>
      </defs>
      <rect x="28" y="72" width="124" height="34" rx="9" fill="url(#ingest-tray)" stroke="#E8B931" strokeOpacity="0.55" />
      <path d="M42 72h24l6 10h36l6-10h24" fill="none" stroke="#1B3A5C" strokeOpacity="0.45" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          animate={animate}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delay + i * 0.22 }}
          style={{ transformOrigin: "center" }}
        >
          <rect x={48 + i * 28} y={34 - i * 4} width="22" height="28" rx="3" fill="#FFFFFF" stroke="#4B92DB" strokeOpacity="0.65" />
          <path d={`M54 ${43 - i * 4}h10M54 ${50 - i * 4}h8`} stroke="#1B3A5C" strokeOpacity="0.42" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>
      ))}
      {["gdelt.org", "reliefweb.int", "unhcr.org"].map((url, i) => (
        <motion.g
          key={url}
          initial={false}
          animate={reducedMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 0], x: [-8, 0, 0, 5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delay + 0.36 + i * 0.24 }}
        >
          <rect x={24 + i * 45} y={12 + i * 7} width="42" height="16" rx="8" fill="#1B3A5C" fillOpacity="0.08" stroke="#4B92DB" strokeOpacity="0.22" />
          <circle cx={32 + i * 45} cy={20 + i * 7} r="3" fill="#E8B931" />
          <text x={39 + i * 45} y={23 + i * 7} fontSize="6.5" fontFamily="Inter, sans-serif" fontWeight="700" fill="#1B3A5C">
            {url}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
