"use client";

import { useEffect, useRef, useState } from "react";

/** Default refresh cadence for live screens. */
export const LIVE_MS = 15_000;

/* Shared "last successful sync" clock so one badge can report every live
   screen in the tab. Client-side only; starts null so SSR and hydration match. */
type SyncListener = (t: number) => void;
const listeners = new Set<SyncListener>();
let lastSync: number | null = null;

function publishSync() {
  lastSync = Date.now();
  for (const l of listeners) l(lastSync);
}

/** Subscribe to the tab-wide last-sync timestamp. */
export function useLastSync(): number | null {
  const [t, setT] = useState<number | null>(lastSync);
  useEffect(() => {
    const l: SyncListener = (v) => setT(v);
    listeners.add(l);
    setT(lastSync);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return t;
}

/**
 * Loads data and keeps it in sync with the server.
 *
 * Runs `refresh` immediately (unless `immediate` is false), then on an
 * interval, plus whenever the tab regains focus or becomes visible again.
 * Polling pauses while the tab is hidden, requests never overlap, and a failed
 * refresh leaves the last good data on screen instead of blanking the page.
 *
 * @param intervalMs 0 disables the interval but still loads on mount.
 */
export function useLive(
  refresh: () => unknown,
  intervalMs: number = LIVE_MS,
  immediate = true
): number | null {
  const latest = useRef(refresh);
  const inFlight = useRef(false);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  // Always call the newest closure without resubscribing the interval.
  useEffect(() => {
    latest.current = refresh;
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled || inFlight.current || document.hidden) return;
      inFlight.current = true;
      try {
        await latest.current();
        if (!cancelled) {
          setSyncedAt(Date.now());
          publishSync();
        }
      } catch {
        /* transient failure: keep showing what we have */
      } finally {
        inFlight.current = false;
      }
    };

    if (immediate) {
      publishSync();
      void run();
    }
    if (intervalMs <= 0) return;

    const id = setInterval(run, intervalMs);
    const onWake = () => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [intervalMs, immediate]);

  return syncedAt;
}

/** Pulsing indicator showing how fresh the data on screen is. */
export function LiveBadge({ intervalMs = LIVE_MS, className = "" }: { intervalMs?: number; className?: string }) {
  const syncedAt = useLastSync();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const secs = syncedAt ? Math.max(0, Math.round((Date.now() - syncedAt) / 1000)) : null;
  const text =
    secs === null
      ? "Live"
      : secs < 5
        ? "Live · just now"
        : `Live · ${secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`} ago`;

  return (
    <span className={`qfs-live ${className}`.trim()} title={`Auto-refreshes every ${Math.round(intervalMs / 1000)}s`}>
      <i aria-hidden="true" />
      {/* wrapped so narrow topbars can drop the label and keep just the dot */}
      <b>{text}</b>
    </span>
  );
}
