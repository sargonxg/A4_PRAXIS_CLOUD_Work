"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)} data-testid="shared-empty-state">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
        <Icon className="h-6 w-6 text-navy-400" />
      </div>
      <h3 className="font-serif text-lg font-medium text-navy-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-navy-500 leading-relaxed">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-6 bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
