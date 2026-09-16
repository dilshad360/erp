import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  heading: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  heading,
  description,
  action,
  className,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50",
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] mb-4 shrink-0">
          <Icon size={32} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        {heading}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex items-center justify-center">{action}</div>}
    </div>
  );
}
