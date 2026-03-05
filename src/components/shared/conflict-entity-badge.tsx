"use client";

import {
  Users,
  MessageSquare,
  Target,
  Lock,
  Zap,
  Handshake,
  Calendar,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ConflictEntityType =
  | "actor"
  | "claim"
  | "interest"
  | "constraint"
  | "leverage"
  | "commitment"
  | "event"
  | "narrative";

interface ConflictEntityBadgeProps {
  type: ConflictEntityType;
  label?: string;
  className?: string;
}

const ENTITY_META: Record<
  ConflictEntityType,
  { icon: React.ElementType; label: string; className: string }
> = {
  actor: {
    icon: Users,
    label: "Actor",
    className: "bg-diplomatic-blue/10 text-diplomatic-blue border-diplomatic-blue/20",
  },
  claim: {
    icon: MessageSquare,
    label: "Claim",
    className: "bg-crimson/10 text-crimson border-crimson/20",
  },
  interest: {
    icon: Target,
    label: "Interest",
    className: "bg-teal/10 text-teal border-teal/20",
  },
  constraint: {
    icon: Lock,
    label: "Constraint",
    className: "bg-navy-600/10 text-navy-600 border-navy-600/20",
  },
  leverage: {
    icon: Zap,
    label: "Leverage",
    className: "bg-gold-600/10 text-gold-700 border-gold-600/20",
  },
  commitment: {
    icon: Handshake,
    label: "Commitment",
    className: "bg-sage/10 text-sage border-sage/20",
  },
  event: {
    icon: Calendar,
    label: "Event",
    className: "bg-terracotta/10 text-terracotta border-terracotta/20",
  },
  narrative: {
    icon: BookOpen,
    label: "Narrative",
    className: "bg-purple/10 text-purple border-purple/20",
  },
};

export function ConflictEntityBadge({ type, label, className }: ConflictEntityBadgeProps) {
  const meta = ENTITY_META[type];
  const Icon = meta.icon;
  const displayLabel = label || meta.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {displayLabel}
    </span>
  );
}
