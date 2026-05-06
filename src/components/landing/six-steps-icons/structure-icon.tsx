import { motion } from "framer-motion";

type StepIconProps = {
  delay: number;
  reducedMotion: boolean;
};

export function StructureIcon({ delay, reducedMotion }: StepIconProps) {
  return (
    <svg viewBox="0 0 180 128" className="h-full w-full" aria-hidden="true">
      <rect x="18" y="22" width="70" height="84" rx="8" fill="#FFFFFF" stroke="#E7DDC7" />
      {["convoy entered", "minister claimed", "border event"].map((line, i) => (
        <g key={line}>
          <rect x="30" y={39 + i * 20} width={line.length * 3.7} height="9" rx="4.5" fill={i === 1 ? "#E8B931" : "#4B92DB"} fillOpacity={i === 1 ? 0.28 : 0.12} />
          <text x="31" y={46 + i * 20} fontSize="7" fontFamily="Inter, sans-serif" fontWeight="700" fill="#1B3A5C" opacity="0.72">
            {line}
          </text>
          {!reducedMotion && (
            <motion.rect
              x="28"
              y={36 + i * 20}
              width="54"
              height="14"
              rx="7"
              fill="#E8B931"
              fillOpacity="0.2"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + i * 0.45 }}
            />
          )}
        </g>
      ))}
      <path d="M91 43C104 43 104 40 116 40M91 63C105 63 105 64 118 64M91 83C104 83 104 88 116 88" fill="none" stroke="#1B3A5C" strokeOpacity="0.22" strokeWidth="1.6" />
      {[
        { label: "Actor", x: 132, y: 40, fill: "#4B92DB" },
        { label: "Claim", x: 126, y: 64, fill: "#E8B931" },
        { label: "Event", x: 134, y: 88, fill: "#59A14F" },
      ].map((node, i) => (
        <motion.g
          key={node.label}
          animate={reducedMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.82, 1, 0.82] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.7 + i * 0.34 }}
          style={{ transformOrigin: `${node.x}px ${node.y}px` }}
        >
          <circle cx={node.x} cy={node.y} r="15" fill={node.fill} fillOpacity="0.22" stroke={node.fill} strokeOpacity="0.62" />
          <text x={node.x} y={node.y + 3} textAnchor="middle" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="800" fill="#1B3A5C">
            {node.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
