"use client";

import { useCallback, useState } from "react";
import { useLive } from "@/lib/use-live";
import {
  apiGet,
  apiSend,
  Confirm,
  DataTable,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  Spinner,
  StatusPill,
  Toast,
  type Column,
} from "@/components/admin/ui";

type Asset = {
  id: string;
  symbol: string;
  name: string;
  full: string;
  type: "METAL" | "STOCK" | "CRYPTO";
  price: string;
  change: string;
  direction: "up" | "down" | "flat";
  color: string;
  sort: number;
  isActive: boolean;
  createdAt: string;
};

const EMPTY: Omit<Asset, "id" | "createdAt"> = {
  symbol: "",
  name: "",
  full: "",
  type: "METAL",
  price: "",
  change: "",
  direction: "up",
  color: "#2b2b3a",
  sort: 0,
  isActive: true,
};

export default function AdminMarketsPage() {
  const [data, setData] = useState<Asset[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<(Asset & { isNew: boolean }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<Asset[]>("/api/admin/markets"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useLive(load);

  const save = async () => {
    if (!editor) return;
    if (!editor.symbol.trim() || !editor.name.trim() || !editor.price.trim() || !editor.change.trim()) {
      setToast("Symbol, name, price and change are required");
      return;
    }
    const body = {
      symbol: editor.symbol.trim().toUpperCase(),
      name: editor.name.trim(),
      full: editor.full.trim(),
      type: editor.type,
      price: editor.price.trim(),
      change: editor.change.trim(),
      direction: editor.direction,
      color: editor.color.trim(),
      sort: Math.round(Number(editor.sort) || 0),
      isActive: editor.isActive,
    };
    setBusy(true);
    try {
      if (editor.isNew) {
        await apiSend("/api/admin/markets", "POST", body);
        setToast(`Asset ${body.symbol} created`);
      } else {
        await apiSend(`/api/admin/markets/${editor.id}`, "PATCH", body);
        setToast(`Asset ${body.symbol} updated`);
      }
      setEditor(null);
      load();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await apiSend(`/api/admin/markets/${deleteTarget.id}`, "DELETE");
      setToast(`Asset ${deleteTarget.symbol} deleted`);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setToast((e as Error).message);
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Asset>[] = [
    {
      label: "Asset",
      render: (a) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: a.color || "#2b2b3a",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {a.symbol.slice(0, 1)}
          </span>
          <div>
            <b>{a.name}</b>
            <span className="adm-cell-sub">
              {a.symbol} · {a.full}
            </span>
          </div>
        </div>
      ),
    },
    { label: "Type", render: (a) => <StatusPill status={a.type.toLowerCase()} /> },
    { label: "Price", render: (a) => `$${a.price}` },
    {
      label: "Change (24h)",
      render: (a) => (
        <span style={{ color: a.direction === "up" ? "var(--dash-green)" : a.direction === "down" ? "var(--dash-red)" : "var(--dash-muted)" }}>
          {a.change}
        </span>
      ),
    },
    { label: "Sort", render: (a) => a.sort },
    { label: "Status", render: (a) => <StatusPill status={a.isActive ? "Active" : "Disabled"} /> },
    {
      label: "",
      className: "num",
      render: (a) => (
        <div className="adm-actions-cell">
          <button className="adm-link-btn" onClick={() => setEditor({ ...a, isNew: false })}>
            Edit
          </button>
          <button className="adm-link-btn danger" onClick={() => setDeleteTarget(a)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Markets"
        subtitle="Live price feeds split by tab (Metals, Stocks, Crypto) on the user dashboard."
        actions={
          <button className="adm-btn primary" onClick={() => setEditor({ id: "", createdAt: "", ...EMPTY, isNew: true })}>
            + New Asset
          </button>
        }
      />

      {loading && !data ? (
        <Spinner label="Loading markets…" />
      ) : error && !data ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : data ? (
        <DataTable columns={columns} rows={data} />
      ) : null}

      {editor && (
        <Modal title={editor.isNew ? "New Asset" : `Edit ${editor.symbol}`} onClose={() => !busy && setEditor(null)}>
          <div className="adm-grid-2">
            <Field label="Symbol">
              <input className="adm-input" value={editor.symbol} onChange={(e) => setEditor({ ...editor, symbol: e.target.value })} placeholder="XAU" />
            </Field>
            <Field label="Type">
              <select className="adm-select" value={editor.type} onChange={(e) => setEditor({ ...editor, type: e.target.value as Asset["type"] })}>
                <option value="METAL">Metal</option>
                <option value="STOCK">Stock</option>
                <option value="CRYPTO">Crypto</option>
              </select>
            </Field>
          </div>
          <div className="adm-grid-2">
            <Field label="Name">
              <input className="adm-input" value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} placeholder="Gold" />
            </Field>
            <Field label="Sub-label">
              <input className="adm-input" value={editor.full} onChange={(e) => setEditor({ ...editor, full: e.target.value })} placeholder="Gold / USD" />
            </Field>
          </div>
          <div className="adm-grid-2">
            <Field label="Price">
              <div className="adm-input-suffix">
                <input className="adm-input" value={editor.price} onChange={(e) => setEditor({ ...editor, price: e.target.value })} placeholder="2431.50" />
                <span>$</span>
              </div>
            </Field>
            <Field label="Change (24h)">
              <input className="adm-input" value={editor.change} onChange={(e) => setEditor({ ...editor, change: e.target.value })} placeholder="+1.24%" />
            </Field>
          </div>
          <div className="adm-grid-2">
            <Field label="Direction">
              <select className="adm-select" value={editor.direction} onChange={(e) => setEditor({ ...editor, direction: e.target.value as Asset["direction"] })}>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="flat">Flat</option>
              </select>
            </Field>
            <Field label="Color">
              <input className="adm-input" value={editor.color} onChange={(e) => setEditor({ ...editor, color: e.target.value })} placeholder="#2b2b3a" />
            </Field>
          </div>
          <div className="adm-grid-2">
            <Field label="Sort">
              <input className="adm-input" inputMode="numeric" value={String(editor.sort)} onChange={(e) => setEditor({ ...editor, sort: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Status">
              <select className="adm-select" value={editor.isActive ? "active" : "disabled"} onChange={(e) => setEditor({ ...editor, isActive: e.target.value === "active" })}>
                <option value="active">Active (visible)</option>
                <option value="disabled">Disabled</option>
              </select>
            </Field>
          </div>
          <div className="adm-row-end">
            <button className="adm-btn ghost" onClick={() => setEditor(null)} disabled={busy}>
              Cancel
            </button>
            <button className="adm-btn primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editor.isNew ? "Create" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Confirm
          title={`Delete ${deleteTarget.symbol}?`}
          text="This permanently removes the asset from the markets feed."
          danger
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}