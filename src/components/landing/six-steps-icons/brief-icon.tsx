import { motion } from "framer-motion";

type StepIconProps = {
  delay: number;
  reducedMotion: boolean;
};

export function BriefIcon({ delay, reducedMotion }: StepIconProps) {
  const avatars = [
    { x: 46, y: 36 },
    { x: 88, y: 24 },
    { x: 130, y: 36 },
    { x: 58, y: 78 },
    { x: 118, y: 78 },
  ];

  return (
    <svg viewBox="0 0 180 128" className="h-full w-full" aria-hidden="true">
      <rect x="68" y="43" width="44" height="30" rx="8" fill="#1B3A5C" fillOpacity="0.08" stroke="#4B92DB" strokeOpacity="0.28" />
      <text x="90" y="61" textAnchor="middle" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="800" fill="#1B3A5C">Boardroom</text>
      {avatars.map((avatar, i) => (
        <motion.g
          key={`${avatar.x}-${avatar.y}`}
          animate={reducedMotion ? {} : { x: [0, (90 - avatar.x) * 0.2, 0], y: [0, (58 - avatar.y) * 0.2, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay + i * 0.12 }}
          style={{ transformOrigin: `${avatar.x}px ${avatar.y}px` }}
        >
          <circle cx={avatar.x} cy={avatar.y} r="10" fill={i === 2 ? "#E8B931" : "#4B92DB"} fillOpacity="0.2" stroke={i === 2 ? "#E8B931" : "#4B92DB"} strokeOpacity="0.65" />
          <circle cx={avatar.x} cy={avatar.y - 2} r="3" fill="#1B3A5C" fillOpacity="0.5" />
          <path d={`M${avatar.x - 5} ${avatar.y + 5}q5-6 10 0`} stroke="#1B3A5C" strokeOpacity="0.5" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </motion.g>
      ))}
      <rect x="48" y="91" width="84" height="26" rx="5" fill="#FFFFFF" stroke="#E7DDC7" />
      <motion.g
        animate={reducedMotion ? {} : { x: [-14, 0, 0, -14], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay + 1.1 }}
      >
        <rect x="58" y="99" width="60" height="3" rx="1.5" fill="#1B3A5C" fillOpacity="0.32" />
        <rect x="58" y="106" width="44" height="3" rx="1.5" fill="#E8B931" fillOpacity="0.58" />
      </motion.g>
    </svg>
  );
}
