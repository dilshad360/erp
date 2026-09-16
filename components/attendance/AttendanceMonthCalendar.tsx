"use client";

import { useMemo, useState } from "react";
import { Timer } from "lucide-react";

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
  dayLogs: AttendanceLog[] | undefined
): DayStatus {
  const day = date.getDay(); // 0 = Sun, 6 = Sat
  if (day === 0 || day === 6) return "weekend";

  const isPast = date < today && date.toDateString() !== today.toDateString();
  const isFuture = date > today;
  const isToday = date.toDateString() === today.toDateString();

  if (!dayLogs || dayLogs.length === 0) {
    if (isFuture) return "future";
    if (isToday) return "today_no_log";
    return "absent"; // past weekday with no log
  }

  // Check if any log is half_day
  if (dayLogs.some((l) => l.status === "half_day")) return "half_day";
  // If any log has out of range
  if (dayLogs.every((l) => l.check_in_range === false)) return "out_of_range";
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

function formatDuration(ms: number): string {
  if (ms < 0) return "0m";
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
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

  // Build a map of date string → array of logs for quick lookups
  const logsByDate = useMemo(() => {
    const map = new Map<string, AttendanceLog[]>();
    for (const log of logs) {
      if (log.check_in_at) {
        const dateStr = new Date(log.check_in_at).toISOString().split("T")[0];
        const existing = map.get(dateStr) ?? [];
        existing.push(log);
        map.set(dateStr, existing);
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
    return firstDow === 0 ? 6 : firstDow - 1;
  }, [year, monthNum]);

  const selectedDateStr = selectedDay ? selectedDay.toISOString().split("T")[0] : null;
  const selectedDayLogs = selectedDateStr ? logsByDate.get(selectedDateStr) ?? [] : [];

  const totalWorkedMsForSelectedDay = useMemo(() => {
    return selectedDayLogs.reduce((acc, log) => {
      if (!log.check_in_at) return acc;
      const start = new Date(log.check_in_at).getTime();
      const end = log.check_out_at ? new Date(log.check_out_at).getTime() : start;
      return acc + Math.max(0, end - start);
    }, 0);
  }, [selectedDayLogs]);

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
          const dayLogs = logsByDate.get(dateStr);
          const status = getDayStatus(day, today, dayLogs);
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
        <div className="mt-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
            <p className="font-semibold text-[var(--color-text-primary)]">
              {selectedDay.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            {selectedDayLogs.length > 0 && (
              <span className="text-xs text-[var(--color-brand)] font-medium flex items-center gap-1 font-mono">
                <Timer className="w-3.5 h-3.5" />
                {formatDuration(totalWorkedMsForSelectedDay)}
              </span>
            )}
          </div>

          {selectedDayLogs.length > 0 ? (
            <div className="space-y-2">
              {selectedDayLogs.map((log, idx) => {
                const startMs = log.check_in_at ? new Date(log.check_in_at).getTime() : 0;
                const endMs = log.check_out_at ? new Date(log.check_out_at).getTime() : startMs;
                const durationMs = Math.max(0, endMs - startMs);

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)] mr-2">
                        Session {idx + 1}:
                      </span>
                      <span className="text-[var(--color-text-muted)]">
                        {formatTime(log.check_in_at)} → {formatTime(log.check_out_at)}
                      </span>
                      {log.check_in_range === false && (
                        <p className="text-[10px] text-yellow-400 mt-0.5">
                          ⚠ Out of range
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[var(--color-text-primary)] font-medium">
                      {formatDuration(durationMs)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-xs">No attendance record for this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
