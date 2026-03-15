"use client";

import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";

interface BiasIndicatorProps {
  value: number; // -1 (far left) to 1 (far right)
  label?: string;
  className?: string;
}

const SPECTRUM_LABELS = [
  { pos: 0, label: "Far Left" },
  { pos: 25, label: "Left" },
  { pos: 50, label: "Center" },
  { pos: 75, label: "Right" },
  { pos: 100, label: "Far Right" },
];

export function BiasIndicator({ value, label, className }: BiasIndicatorProps) {
  // Map -1..1 to 0..100 percent
  const pct = ((value + 1) / 2) * 100;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-navy-400">
          {label}
        </p>
      )}
      <div className="relative">
        {/* Track */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-navy-200">
          {/* Gradient fill */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(to right, #A63D40, #C75B39, #64748B, #3D5A80, #4A90A4)",
              opacity: 0.4,
            }}
          />
        </div>

        {/* Center line */}
        <div className="absolute top-0 left-1/2 h-2 w-px -translate-x-1/2 bg-navy-400" />

        {/* Indicator dot */}
        <motion.div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold-500 bg-white shadow-md shadow-gold-500/20"
          initial={{ left: "50%" }}
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </div>

      {/* Labels */}
      <div className="mt-1.5 flex justify-between">
        {SPECTRUM_LABELS.map((item) => (
          <span
            key={item.label}
            className="text-[10px] font-medium text-navy-500"
            style={{ width: "20%", textAlign: "center" }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
