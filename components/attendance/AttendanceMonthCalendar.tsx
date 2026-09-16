"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";

type AttendanceLog = {
  id: string;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_range: boolean | null;
  status: string | null;
};

interface AttendanceMonthCalendarProps {
  logs: AttendanceLog[];
  /** YYYY-MM format */
  month: string;
}

type DayStatus = "present" | "absent" | "out_of_range" | "half_day" | "future" | "weekend" | "today_no_log";

function getDayStatus(
  date: Date,
  today: Date,
  log: AttendanceLog | undefined
): DayStatus {
  const day = date.getDay(); // 0 = Sun, 6 = Sat
  if (day === 0 || day === 6) return "weekend";

  const isPast = date < today && date.toDateString() !== today.toDateString();
  const isFuture = date > today;
  const isToday = date.toDateString() === today.toDateString();

  if (!log) {
    if (isFuture) return "future";
    if (isToday) return "today_no_log";
    return "absent"; // past weekday with no log
  }

  if (log.status === "half_day") return "half_day";
  if (log.check_in_range === false) return "out_of_range";
  if (isPast || isToday) return "present";
  return "future";
}

const STATUS_STYLES: Record<DayStatus, string> = {
  present: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold",
  absent: "bg-red-500/15 text-red-400 border-red-500/25",
  out_of_range: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  half_day: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  future: "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] opacity-40",
  weekend: "bg-transparent text-[var(--color-text-muted)] border-transparent opacity-20",
  today_no_log: "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border-[var(--color-brand)] border-2",
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AttendanceMonthCalendar({
  logs,
  month,
}: AttendanceMonthCalendarProps): React.JSX.Element {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Build a map of date string → log for quick lookups
  const logsByDate = useMemo(() => {
    const map = new Map<string, AttendanceLog>();
    for (const log of logs) {
      if (log.check_in_at) {
        const dateStr = new Date(log.check_in_at).toISOString().split("T")[0];
        map.set(dateStr, log);
      }
    }
    return map;
  }, [logs]);

  const [year, monthNum] = month.split("-").map(Number) as [number, number];

  // Generate all calendar days for the month
  const days = useMemo(() => {
    const result: Date[] = [];
    const lastDay = new Date(year, monthNum, 0);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push(new Date(year, monthNum - 1, d));
    }
    return result;
  }, [year, monthNum]);

  // Blank cells to align with Mon as first column
  const startPadding = useMemo(() => {
    const firstDow = new Date(year, monthNum - 1, 1).getDay(); // 0=Sun
    // Convert to Mon-first: Sun → 6, Mon → 0, Tue → 1, ...
    return firstDow === 0 ? 6 : firstDow - 1;
  }, [year, monthNum]);

  const selectedLog = selectedDay
    ? logsByDate.get(selectedDay.toISOString().split("T")[0])
    : undefined;

  const monthLabel = new Date(year, monthNum - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{monthLabel}</h3>
        <div className="flex gap-2">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/60 inline-block" /> Present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/60 inline-block" /> Absent</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500/60 inline-block" /> Out of range</span>
          </div>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-[10px] font-medium text-[var(--color-text-muted)] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding cells */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateStr = day.toISOString().split("T")[0];
          const log = logsByDate.get(dateStr);
          const status = getDayStatus(day, today, log);
          const isSelected = selectedDay?.toDateString() === day.toDateString();
          const isWeekday = day.getDay() !== 0 && day.getDay() !== 6;
          const isClickable = isWeekday && status !== "future";

          return (
            <button
              key={dateStr}
              onClick={() => {
                if (!isClickable) return;
                setSelectedDay(isSelected ? null : day);
              }}
              disabled={!isClickable}
              className={[
                "aspect-square rounded-lg border text-xs flex items-center justify-center transition-all duration-150",
                STATUS_STYLES[status],
                isSelected ? "ring-2 ring-[var(--color-brand)] ring-offset-1 ring-offset-[var(--color-bg)]" : "",
                isClickable ? "cursor-pointer hover:brightness-125 active:scale-95" : "cursor-default",
              ].join(" ")}
              aria-label={`${dateStr}: ${status}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Day detail popover */}
      {selectedDay && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
          <p className="font-semibold text-[var(--color-text-primary)] mb-3">
            {selectedDay.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {selectedLog ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[var(--color-text-muted)]">Check-in</p>
                <p className="text-[var(--color-text-primary)] font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTime(selectedLog.check_in_at)}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)]">Check-out</p>
                <p className="text-[var(--color-text-primary)] font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTime(selectedLog.check_out_at)}
                </p>
              </div>
              {selectedLog.check_in_range === false && (
                <div className="col-span-2">
                  <span className="text-yellow-400 text-xs">⚠ Checked in outside office area</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-xs">No attendance record for this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
