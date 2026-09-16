"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, LogIn, LogOut } from "lucide-react";
import LocationStatus, { type LocationState } from "./LocationStatus";

type AttendanceLog = {
  id: string;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_range: boolean | null;
};

interface AttendanceCheckInPanelProps {
  checkedIn: boolean;
  todayLog: AttendanceLog | null;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AttendanceCheckInPanel({
  checkedIn: initialCheckedIn,
  todayLog: initialLog,
}: AttendanceCheckInPanelProps): React.JSX.Element {
  const router = useRouter();

  const [locationState, setLocationState] = useState<LocationState>("requesting");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(initialLog);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Acquire geolocation on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }

    // 5-second timeout fallback
    timeoutRef.current = setTimeout(() => {
      setLocationState("denied");
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationState("acquired");
      },
      () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setLocationState("denied");
      },
      { timeout: 5000, maximumAge: 60000 }
    );

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCheckIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Optimistic UI — show checked in immediately
    setCheckedIn(true);

    const body = coords
      ? { lat: coords.lat, lng: coords.lng }
      : { lat: null, lng: null };

    const res = await fetch("/api/attendance/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as { data: AttendanceLog | null; error: string | null };

    if (!res.ok || json.error) {
      // Revert optimistic update
      setCheckedIn(false);
      setError(json.error ?? "Failed to check in. Please try again.");
    } else if (json.data) {
      setTodayLog(json.data);
      router.refresh();
    }

    setLoading(false);
  }, [coords, router]);

  const handleCheckOut = useCallback(async () => {
    if (!todayLog) return;
    setLoading(true);
    setError(null);

    // Optimistic UI
    setCheckedIn(false);

    const body = coords
      ? { logId: todayLog.id, lat: coords.lat, lng: coords.lng }
      : { logId: todayLog.id, lat: null, lng: null };

    const res = await fetch("/api/attendance/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as { data: AttendanceLog | null; error: string | null };

    if (!res.ok || json.error) {
      // Revert
      setCheckedIn(true);
      setError(json.error ?? "Failed to check out. Please try again.");
    } else if (json.data) {
      setTodayLog(json.data);
      router.refresh();
    }

    setLoading(false);
  }, [coords, todayLog, router]);

  const isOutOfRange = todayLog?.check_in_range === false;
  // Session is done for the day: log exists + checked out
  const sessionComplete = !!todayLog?.check_out_at && !checkedIn;

  return (
    <div className="flex flex-col gap-5">
      {/* Location status indicator */}
      <div className="flex items-center justify-between px-1">
        <LocationStatus state={locationState} />
        {todayLog?.check_in_at && (
          <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {checkedIn
              ? `Checked in at ${formatTime(todayLog.check_in_at)}`
              : `Checked out at ${formatTime(todayLog.check_out_at)}`}
          </span>
        )}
      </div>

      {/* Out-of-range warning banner */}
      {isOutOfRange && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            You appear to be outside the office area. Your check-in has been recorded.
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main action button */}
      {checkedIn ? (
        <button
          id="checkout-btn"
          onClick={handleCheckOut}
          disabled={loading}
          className={[
            "w-full h-16 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200",
            "bg-red-500/90 hover:bg-red-500 active:scale-95 text-white shadow-lg shadow-red-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          ].join(" ")}
          aria-label="Check out"
        >
          <LogOut className="w-5 h-5" />
          {loading ? "Checking out…" : "Check Out"}
        </button>
      ) : sessionComplete ? (
        /* Session done for today — disable button and show completion state */
        <button
          id="session-complete-btn"
          disabled
          className="w-full h-16 rounded-xl font-semibold text-base flex items-center justify-center gap-3 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
          aria-label="Session complete for today"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Session Complete
        </button>
      ) : (
        <button
          id="checkin-btn"
          onClick={handleCheckIn}
          disabled={loading || locationState === "requesting"}
          className={[
            "w-full h-16 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200",
            "bg-emerald-500/90 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          ].join(" ")}
          aria-label="Check in"
        >
          <LogIn className="w-5 h-5" />
          {loading
            ? "Checking in…"
            : locationState === "requesting"
            ? "Getting location…"
            : "Check In"}
        </button>
      )}

      {/* Session summary when checked in */}
      {checkedIn && todayLog?.check_in_at && (
        <div className="text-center text-xs text-[var(--color-text-muted)]">
          Session started at{" "}
          <span className="text-[var(--color-text-primary)] font-medium">
            {formatTime(todayLog.check_in_at)}
          </span>
        </div>
      )}

      {/* Done for the day summary */}
      {!checkedIn && todayLog?.check_out_at && (
        <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
          <p className="font-medium text-[var(--color-text-primary)] mb-2">Today's session</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
            <div>
              <span>Check-in</span>
              <p className="text-[var(--color-text-primary)] font-medium">
                {formatTime(todayLog.check_in_at)}
              </p>
            </div>
            <div>
              <span>Check-out</span>
              <p className="text-[var(--color-text-primary)] font-medium">
                {formatTime(todayLog.check_out_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
