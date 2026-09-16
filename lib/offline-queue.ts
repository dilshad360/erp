"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type QueuedAttendanceAction = {
  id?: number;
  type: "checkin" | "checkout";
  lat: number;
  lng: number;
  timestamp: string;
  subdomain?: string;
};

interface ErpOfflineDB extends DBSchema {
  attendance_queue: {
    key: number;
    value: QueuedAttendanceAction;
    indexes: { "by-timestamp": string };
  };
}

const DB_NAME = "erp_offline_store";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ErpOfflineDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<ErpOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("attendance_queue")) {
          const store = db.createObjectStore("attendance_queue", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("by-timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueOfflineAttendance(
  action: Omit<QueuedAttendanceAction, "id">
): Promise<number | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  const id = await db.add("attendance_queue", {
    ...action,
    timestamp: action.timestamp || new Date().toISOString(),
  });
  return id;
}

export async function getOfflineAttendanceQueue(): Promise<QueuedAttendanceAction[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll("attendance_queue");
}

export async function removeOfflineAttendanceItem(id: number): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete("attendance_queue", id);
}

export async function clearOfflineAttendanceQueue(): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.clear("attendance_queue");
}

export function getLastSyncTimestamp(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("erp_last_sync_timestamp");
}

export function setLastSyncTimestamp(isoString: string = new Date().toISOString()): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("erp_last_sync_timestamp", isoString);
}

export async function syncOfflineAttendance(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = await getOfflineAttendanceQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      const endpoint =
        item.type === "checkout"
          ? "/api/attendance/checkout"
          : "/api/attendance/checkin";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: item.lat,
          lng: item.lng,
          offlineTimestamp: item.timestamp,
        }),
      });

      if (res.ok && item.id !== undefined) {
        await removeOfflineAttendanceItem(item.id);
        syncedCount++;
      } else {
        failedCount++;
      }
    } catch {
      failedCount++;
    }
  }

  if (syncedCount > 0) {
    setLastSyncTimestamp();
  }

  return { syncedCount, failedCount };
}
