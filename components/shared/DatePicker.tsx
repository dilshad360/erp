"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export interface DatePickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  min?: string;
}

export default function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  id,
  min,
}: DatePickerProps): React.JSX.Element {
  return (
    <div className={cn("relative", className)}>
      <Calendar
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
      />
      <input
        id={id}
        type="date"
        disabled={disabled}
        value={value ?? ""}
        min={min}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          // Style the date picker native chrome
          "[color-scheme:dark]"
        )}
      />
    </div>
  );
}
