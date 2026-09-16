"use client";

import { useEffect } from "react";
import { syncOfflineAttendance } from "@/lib/offline-queue";

export default function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for service worker updates
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("ServiceWorker registration failed:", err);
        });
    }

    // Auto sync on reconnection
    const handleOnline = () => {
      syncOfflineAttendance().catch(() => {});
    };

    window.addEventListener("online", handleOnline);

    // Initial check on mount
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncOfflineAttendance().catch(() => {});
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
