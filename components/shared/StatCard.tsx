import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: StatCardProps): React.JSX.Element {
  const trendColor =
    trend?.direction === "up"
      ? "text-[var(--color-success)]"
      : trend?.direction === "down"
        ? "text-[var(--color-danger)]"
        : "text-[var(--color-text-muted)]";

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 shadow-[var(--shadow-level-1)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {value}
          </p>
          {trend && (
            <p className={`text-xs font-medium ${trendColor}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className="shrink-0 w-10 h-10 rounded-md bg-[var(--color-brand-subtle)] flex items-center justify-center">
          <Icon size={20} className="text-[var(--color-brand)]" />
        </div>
      </div>
    </div>
  );
}
