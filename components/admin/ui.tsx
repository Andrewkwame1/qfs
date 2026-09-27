"use client";

/* Shared client-side toolkit for the QFS admin dashboard. */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LIVE_MS, useLive } from "@/lib/use-live";
import { Close } from "../dashboard/icons";

/* ---------------- API helpers ---------------- */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    if (res.status === 401 || res.status === 403) {
      window.location.href = "/user/user/login";
      throw new Error("Session expired");
    }
    throw new Error(json?.error?.message ?? "Request failed");
  }
  return json.data as T;
}

export async function apiSend<T = unknown>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    if (res.status === 401 || res.status === 403) {
      window.location.href = "/user/user/login";
      throw new Error("Session expired");
    }
    throw new Error(json?.error?.message ?? "Request failed");
  }
  return json.data as T;
}

export function useFetch<T>(path: string, opts?: { intervalMs?: number }) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });

  const reload = useCallback(async () => {
    try {
      const d = await apiGet<T>(path);
      setState({ data: d, error: null, loading: false });
    } catch (e) {
      setState((s) => ({ data: s.data, error: (e as Error).message, loading: false }));
    }
  }, [path]);

  // Loads on mount and then keeps itself fresh. Pass { intervalMs: 0 } to opt out of polling.
  const syncedAt = useLive(reload, opts?.intervalMs ?? LIVE_MS);

  return { ...state, reload, syncedAt };
}

/* ---------------- Formatting ---------------- */

export function fmtMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------------- Tiny UI primitives ---------------- */

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="adm-loading" role="status">
      <span className="adm-spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="adm-banner error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button className="adm-btn ghost sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", hint }: { title?: string; hint?: string }) {
  return (
    <div className="adm-empty">
      <b>{title}</b>
      {hint && <span>{hint}</span>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="adm-page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="adm-page-actions">{actions}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const cls = status.toLowerCase();
  return <span className={`adm-pill ${cls}`}>{status}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`adm-modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-modal-head">
          <h3>{title}</h3>
          <button className="adm-modal-close" aria-label="Close" onClick={onClose}>
            <Close />
          </button>
        </div>
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ title, text, confirmLabel = "Confirm", danger, busy, onConfirm, onCancel }: {
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      {text && <p className="adm-confirm-text">{text}</p>}
      <div className="adm-row-end">
        <button className="adm-btn ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          className={`adm-btn ${danger ? "danger" : "primary"}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      {children}
      {hint && <span className="adm-field-hint">{hint}</span>}
    </div>
  );
}

export function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (p: number) => void }) {
  return (
    <div className="adm-pagination">
      <span className="adm-pagination-total">
        {total} row{total === 1 ? "" : "s"} · page {page} of {Math.max(totalPages, 1)}
      </span>
      <div className="adm-pagination-btns">
        <button className="adm-btn ghost sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Prev
        </button>
        <button className="adm-btn ghost sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

export type Column<T> = { label: string; render: (row: T) => ReactNode; className?: string };

export function DataTable<T>({ columns, rows, empty }: { columns: Column<T>[]; rows: T[]; empty?: ReactNode }) {
  if (rows.length === 0) {
    return empty ?? <EmptyState />;
  }
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label} className={c.className}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.label} className={c.className}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className="adm-toast" role="status">
      <span className="adm-toast-dot" aria-hidden="true" />
      {message}
    </div>
  );
}