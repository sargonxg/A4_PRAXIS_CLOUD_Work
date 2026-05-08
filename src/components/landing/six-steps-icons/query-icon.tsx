import { motion } from "framer-motion";

type StepIconProps = {
  delay: number;
  reducedMotion: boolean;
};

export function QueryIcon({ delay, reducedMotion }: StepIconProps) {
  const code = "Check claim support";

  return (
    <svg viewBox="0 0 180 128" className="h-full w-full" aria-hidden="true">
      <rect x="20" y="22" width="140" height="28" rx="7" fill="#102A43" />
      <text x="31" y="40" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700" fill="#FFF8E7">
        {code}
      </text>
      {!reducedMotion && (
        <motion.rect
          x="29"
          y="31"
          width="2"
          height="14"
          rx="1"
          fill="#E8B931"
          animate={{ x: [29, 145, 145, 29], opacity: [1, 1, 0, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay }}
        />
      )}
      {[
        { x: 54, y: 82, r: 13 },
        { x: 93, y: 65, r: 15 },
        { x: 128, y: 88, r: 12 },
      ].map((node, i) => (
        <g key={`${node.x}-${node.y}`}>
          {i > 0 && <line x1={i === 1 ? 54 : 93} y1={i === 1 ? 82 : 65} x2={node.x} y2={node.y} stroke="#4B92DB" strokeOpacity="0.42" strokeWidth="2" />}
          <motion.circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill={i === 1 ? "#E8B931" : "#4B92DB"}
            fillOpacity="0.22"
            stroke={i === 1 ? "#E8B931" : "#4B92DB"}
            strokeOpacity="0.72"
            animate={reducedMotion ? {} : { opacity: [0.65, 1, 0.65], scale: [1, 1.14, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.55 + i * 0.18 }}
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          />
        </g>
      ))}
    </svg>
  );
}
