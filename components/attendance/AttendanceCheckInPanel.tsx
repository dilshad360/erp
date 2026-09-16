"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  Coffee,
  LogIn,
  LogOut,
  Timer,
  WifiOff,
  CloudUpload,
} from "lucide-react";
import LocationStatus, { type LocationState } from "./LocationStatus";
import {
  enqueueOfflineAttendance,
  syncOfflineAttendance,
  getOfflineAttendanceQueue,
} from "@/lib/offline-queue";

export type AttendanceLog = {
  id: string;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_range: boolean | null;
  status?: string | null;
};

interface AttendanceCheckInPanelProps {
  todayLogs: AttendanceLog[];
}

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

function formatDurationHMS(ms: number): string {
  if (ms < 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function AttendanceCheckInPanel({
  todayLogs: initialLogs,
}: AttendanceCheckInPanelProps): React.JSX.Element {
  const router = useRouter();

  const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs);
  const [locationState, setLocationState] = useState<LocationState>("requesting");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state if props change from server refresh
  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  // Online / Offline listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      const queue = await getOfflineAttendanceQueue();
      if (queue.length > 0) {
        setOfflineNotice("Back online. Syncing your offline check-in logs...");
        const result = await syncOfflineAttendance();
        if (result.syncedCount > 0) {
          setOfflineNotice(`Synced ${result.syncedCount} offline record(s) with the server.`);
          router.refresh();
          setTimeout(() => setOfflineNotice(null), 4000);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineNotice("You are offline. Any check-ins will be safely stored locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);

  // Find active (un-checked-out) session
  const activeLog = useMemo(() => {
    return logs.find((l) => !l.check_out_at) ?? null;
  }, [logs]);

  const checkedIn = !!activeLog;

  // Live timer tick when checked in
  useEffect(() => {
    if (!checkedIn) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [checkedIn]);

  // ── Acquire geolocation on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }

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

  // ── Calculate total worked time today ───────────────────────────────────
  const totalWorkedMs = useMemo(() => {
    return logs.reduce((acc, log) => {
      if (!log.check_in_at) return acc;
      const start = new Date(log.check_in_at).getTime();
      const end = log.check_out_at ? new Date(log.check_out_at).getTime() : now;
      return acc + Math.max(0, end - start);
    }, 0);
  }, [logs, now]);

  const currentSessionMs = useMemo(() => {
    if (!activeLog?.check_in_at) return 0;
    const start = new Date(activeLog.check_in_at).getTime();
    return Math.max(0, now - start);
  }, [activeLog, now]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCheckIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    const nowIso = new Date().toISOString();
    const lat = coords?.lat ?? 0;
    const lng = coords?.lng ?? 0;

    // Check if offline
    if (!navigator.onLine) {
      await enqueueOfflineAttendance({
        type: "checkin",
        lat,
        lng,
        timestamp: nowIso,
      });

      const optimisticLog: AttendanceLog = {
        id: `offline-${Date.now()}`,
        check_in_at: nowIso,
        check_out_at: null,
        check_in_range: true,
        status: "present",
      };

      setLogs((prev) => [...prev, optimisticLog]);
      setOfflineNotice("Offline check-in saved locally. Will sync automatically when connected.");
      setLoading(false);
      return;
    }

    try {
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
        setError(json.error ?? "Failed to check in. Please try again.");
      } else if (json.data) {
        setLogs((prev) => [...prev, json.data!]);
        router.refresh();
      }
    } catch {
      // Network drop during fetch -> save to offline queue
      await enqueueOfflineAttendance({
        type: "checkin",
        lat,
        lng,
        timestamp: nowIso,
      });

      const optimisticLog: AttendanceLog = {
        id: `offline-${Date.now()}`,
        check_in_at: nowIso,
        check_out_at: null,
        check_in_range: true,
        status: "present",
      };

      setLogs((prev) => [...prev, optimisticLog]);
      setOfflineNotice("Network lost. Check-in saved offline and queued for sync.");
    } finally {
      setLoading(false);
    }
  }, [coords, router]);

  const handleCheckOut = useCallback(async () => {
    if (!activeLog) return;
    setLoading(true);
    setError(null);

    const nowIso = new Date().toISOString();
    const lat = coords?.lat ?? 0;
    const lng = coords?.lng ?? 0;

    // Check if offline
    if (!navigator.onLine) {
      await enqueueOfflineAttendance({
        type: "checkout",
        lat,
        lng,
        timestamp: nowIso,
      });

      setLogs((prev) =>
        prev.map((l) =>
          l.id === activeLog.id ? { ...l, check_out_at: nowIso } : l
        )
      );
      setOfflineNotice("Offline check-out saved locally. Will sync automatically when connected.");
      setLoading(false);
      return;
    }

    try {
      const body = coords
        ? { logId: activeLog.id, lat: coords.lat, lng: coords.lng }
        : { logId: activeLog.id, lat: null, lng: null };

      const res = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { data: AttendanceLog | null; error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to check out. Please try again.");
      } else if (json.data) {
        setLogs((prev) =>
          prev.map((l) => (l.id === json.data!.id ? json.data! : l))
        );
        router.refresh();
      }
    } catch {
      await enqueueOfflineAttendance({
        type: "checkout",
        lat,
        lng,
        timestamp: nowIso,
      });

      setLogs((prev) =>
        prev.map((l) =>
          l.id === activeLog.id ? { ...l, check_out_at: nowIso } : l
        )
      );
      setOfflineNotice("Network lost. Check-out saved offline and queued for sync.");
    } finally {
      setLoading(false);
    }
  }, [coords, activeLog, router]);

  const isOutOfRange = activeLog?.check_in_range === false;
  const sessionCount = logs.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Location status & quick meta */}
      <div className="flex items-center justify-between px-1">
        <LocationStatus state={locationState} />
        <div className="flex items-center gap-3">
          {!isOnline && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              <WifiOff size={12} />
              Offline Mode
            </span>
          )}
          {sessionCount > 0 && (
            <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-[var(--color-brand)]" />
              Total: <strong className="text-[var(--color-text-primary)] font-mono">{formatDuration(totalWorkedMs)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Offline sync banner */}
      {offlineNotice && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          <CloudUpload className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{offlineNotice}</span>
        </div>
      )}

      {/* Out-of-range warning banner */}
      {isOutOfRange && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            You checked in outside the designated office radius. Your session is active.
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live running session badge (if checked in) */}
      {checkedIn && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Session {sessionCount} in progress
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Started at {formatTime(activeLog?.check_in_at ?? null)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-mono font-bold text-emerald-400">
              {formatDurationHMS(currentSessionMs)}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Live Timer</p>
          </div>
        </div>
      )}

      {/* Main punch button */}
      {checkedIn ? (
        <button
          id="checkout-btn"
          onClick={handleCheckOut}
          disabled={loading}
          className={[
            "w-full h-16 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer",
            "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-[0.98] text-white shadow-lg shadow-red-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          ].join(" ")}
          aria-label="Check out / Take break"
        >
          <LogOut className="w-5 h-5" />
          <div className="flex flex-col items-center">
            <span>{loading ? "Recording Check-Out…" : "Check Out"}</span>
            <span className="text-[10px] font-normal opacity-85">
              Take lunch / end session
            </span>
          </div>
        </button>
      ) : (
        <button
          id="checkin-btn"
          onClick={handleCheckIn}
          disabled={loading || locationState === "requesting"}
          className={[
            "w-full h-16 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer",
            "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white shadow-lg shadow-emerald-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          ].join(" ")}
          aria-label="Check in"
        >
          <LogIn className="w-5 h-5" />
          <div className="flex flex-col items-center">
            <span>
              {loading
                ? "Recording Check-In…"
                : locationState === "requesting"
                ? "Getting Location…"
                : sessionCount === 0
                ? "Check In"
                : `Check In (Session ${sessionCount + 1})`}
            </span>
            {sessionCount > 0 && !loading && locationState !== "requesting" && (
              <span className="text-[10px] font-normal opacity-85">
                Resume work after break
              </span>
            )}
          </div>
        </button>
      )}

      {/* Today's Sessions Log */}
      {logs.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-primary)]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              Today's Sessions ({logs.length})
            </span>
            <span className="text-[var(--color-text-muted)] font-normal">
              Total: <strong className="text-[var(--color-text-primary)]">{formatDuration(totalWorkedMs)}</strong>
            </span>
          </div>

          <div className="space-y-2">
            {logs.map((log, index) => {
              const isOngoing = !log.check_out_at;
              const startMs = log.check_in_at ? new Date(log.check_in_at).getTime() : 0;
              const endMs = log.check_out_at ? new Date(log.check_out_at).getTime() : now;
              const durationMs = Math.max(0, endMs - startMs);

              return (
                <div
                  key={log.id}
                  className={[
                    "p-3 rounded-xl border flex items-center justify-between text-xs transition-colors",
                    isOngoing
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-[var(--color-surface-raised)] border-[var(--color-border)]",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={[
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isOngoing
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
                      ].join(" ")}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                        <span>{formatTime(log.check_in_at)}</span>
                        <span className="text-[var(--color-text-muted)]">→</span>
                        <span>{isOngoing ? "Now" : formatTime(log.check_out_at)}</span>
                      </div>
                      {log.check_in_range === false && (
                        <p className="text-[10px] text-yellow-400 mt-0.5">
                          Outside office radius
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={[
                        "px-2 py-0.5 rounded-md font-mono font-medium text-[11px]",
                        isOngoing
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
                      ].join(" ")}
                    >
                      {formatDuration(durationMs)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Break suggestion hint if checked out and has logs today */}
      {!checkedIn && sessionCount > 0 && (
        <div className="p-3.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <Coffee className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            On a break? When you return from lunch or stepping out, tap <strong>Check In</strong> to start your next session.
          </span>
        </div>
      )}
    </div>
  );
}
