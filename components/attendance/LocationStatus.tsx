"use client";
import { MapPin, CheckCircle, AlertCircle } from "lucide-react";

type LocationState = "idle" | "requesting" | "acquired" | "denied";

interface LocationStatusProps {
  state: LocationState;
}

export default function LocationStatus({ state }: LocationStatusProps): React.JSX.Element {
  const config: Record<
    LocationState,
    { dot: string; label: string; icon: React.ReactNode }
  > = {
    idle: {
      dot: "bg-[var(--color-text-muted)]",
      label: "Location not started",
      icon: <MapPin className="w-3.5 h-3.5" />,
    },
    requesting: {
      dot: "bg-yellow-400 animate-pulse",
      label: "Requesting location…",
      icon: <MapPin className="w-3.5 h-3.5 text-yellow-400" />,
    },
    acquired: {
      dot: "bg-emerald-400",
      label: "Location acquired",
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
    },
    denied: {
      dot: "bg-red-400",
      label: "Location unavailable",
      icon: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
    },
  };

  const current = config[state];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${current.dot}`}
        aria-hidden="true"
      />
      <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
        {current.icon}
        {current.label}
      </span>
    </div>
  );
}

// Re-export the type so it can be imported by the parent component
export type { LocationState };
