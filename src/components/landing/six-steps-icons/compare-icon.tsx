import { motion } from "framer-motion";

type StepIconProps = {
  delay: number;
  reducedMotion: boolean;
};

export function CompareIcon({ delay, reducedMotion }: StepIconProps) {
  return (
    <svg viewBox="0 0 180 128" className="h-full w-full" aria-hidden="true">
      <rect x="18" y="22" width="66" height="58" rx="8" fill="#FFFFFF" stroke="#4B92DB" strokeOpacity="0.24" />
      <rect x="96" y="22" width="66" height="58" rx="8" fill="#FFFFFF" stroke="#E8B931" strokeOpacity="0.45" />
      <text x="32" y="40" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="800" fill="#1B3A5C">UN docs</text>
      <text x="110" y="40" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="800" fill="#1B3A5C">Local media</text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="31" y={51 + i * 8} width={38 - i * 4} height="3" rx="1.5" fill="#4B92DB" fillOpacity="0.22" />
          <rect x="109" y={51 + i * 8} width={34 + i * 3} height="3" rx="1.5" fill="#E8B931" fillOpacity="0.38" />
        </g>
      ))}
      <motion.g
        animate={reducedMotion ? {} : { y: [0, -3, 0], opacity: [0.84, 1, 0.84] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <rect x="20" y="90" width="140" height="22" rx="11" fill="#FFF8E7" stroke="#E8B931" strokeOpacity="0.68" />
        <text x="90" y="104" textAnchor="middle" fontSize="7.2" fontFamily="Inter, sans-serif" fontWeight="800" fill="#1B3A5C">
          UN says X · Local media says Y · Δ flagged
        </text>
      </motion.g>
    </svg>
  );
}
