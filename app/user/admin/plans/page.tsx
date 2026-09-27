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
  fmtMoney,
  type Column,
} from "@/components/admin/ui";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  minAmountCents: number;
  maxAmountCents: number | null;
  monthlyRoiBps: number;
  termMonths: number;
  isActive: boolean;
  sort: number;
  color: string;
  createdAt: string;
};

type FormState = {
  id?: string;
  name: string;
  description: string;
  minAmount: string;
  maxAmount: string;
  monthlyRoiPct: string;
  termMonths: string;
  sort: string;
  isActive: boolean;
  color: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  minAmount: "100",
  maxAmount: "",
  monthlyRoiPct: "5.0",
  termMonths: "6",
  sort: "1",
  isActive: true,
  color: "#992c92",
};

const PLAN_COLORS = ["#992c92", "#ceff0c", "#2ed47a", "#4da3ff", "#ffb020", "#ff5f77", "#d86fd0"];

export default function AdminPlansPage() {
  const [data, setData] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<FormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<Plan[]>("/api/admin/plans"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useLive(load);

  const openCreate = () => setEditor({ ...EMPTY_FORM });

  const openEdit = (p: Plan) =>
    setEditor({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      minAmount: String(p.minAmountCents / 100),
      maxAmount: p.maxAmountCents ? String(p.maxAmountCents / 100) : "",
      monthlyRoiPct: String(p.monthlyRoiBps / 100),
      termMonths: String(p.termMonths),
      sort: String(p.sort),
      isActive: p.isActive,
      color: p.color,
    });

  const save = async () => {
    if (!editor) return;
    const body = {
      name: editor.name.trim(),
      description: editor.description.trim() || undefined,
      minAmount: Number(editor.minAmount),
      ...(editor.maxAmount.trim() ? { maxAmount: Number(editor.maxAmount) } : {}),
      monthlyRoiPct: Number(editor.monthlyRoiPct),
      termMonths: Math.max(1, Math.round(Number(editor.termMonths) || 1)),
      isActive: editor.isActive,
      sort: Math.round(Number(editor.sort) || 0),
      color: editor.color,
    };
    if (!body.name || !body.minAmount || body.minAmount <= 0) {
      setToast("Name and a valid minimum amount are required");
      return;
    }
    setBusy(true);
    try {
      if (editor.id) {
        await apiSend(`/api/admin/plans/${editor.id}`, "PATCH", body);
        setToast(`Plan "${body.name}" updated`);
      } else {
        await apiSend("/api/admin/plans", "POST", body);
        setToast(`Plan "${body.name}" created`);
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
      await apiSend(`/api/admin/plans/${deleteTarget.id}`, "DELETE");
      setToast(`Plan "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setToast((e as Error).message);
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Plan>[] = [
    {
      label: "Plan",
      render: (p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 4,
              background: p.color || "#992c92",
              flexShrink: 0,
            }}
          />
          <div>
            <b>{p.name}</b>
            {p.description && <span className="adm-cell-sub">{p.description}</span>}
          </div>
        </div>
      ),
    },
    { label: "Monthly ROI", render: (p) => `${(p.monthlyRoiBps / 100).toFixed(1)}%` },
    { label: "Min", render: (p) => <span className="num">{fmtMoney(p.minAmountCents)}</span> },
    {
      label: "Max",
      render: (p) => <span className="num">{p.maxAmountCents ? fmtMoney(p.maxAmountCents) : "Unlimited"}</span>,
    },
    { label: "Term", render: (p) => `${p.termMonths} months` },
    { label: "Sort", render: (p) => <span className="num">{p.sort}</span> },
    { label: "Status", render: (p) => <StatusPill status={p.isActive ? "Active" : "Disabled"} /> },
    {
      label: "",
      className: "num",
      render: (p) => (
        <div className="adm-actions-cell">
          <button className="adm-link-btn" onClick={() => openEdit(p)}>
            Edit
          </button>
          <button className="adm-link-btn danger" onClick={() => setDeleteTarget(p)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Investment Plans"
        subtitle="Plans power the earnings accrual engine. ROI is stored in basis points (bps) — 5% monthly = 500 bps."
        actions={
          <button className="adm-btn primary" onClick={openCreate}>
            + New Plan
          </button>
        }
      />

      {loading && !data ? (
        <Spinner label="Loading plans…" />
      ) : error && !data ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : data ? (
        <DataTable columns={columns} rows={data} />
      ) : null}

      {editor && (
        <Modal title={editor.id ? `Edit "${editor.name}"` : "New Investment Plan"} onClose={() => !busy && setEditor(null)} wide>
          <div className="adm-grid-2">
            <Field label="Plan name">
              <input className="adm-input" value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} placeholder="QFS Growth" />
            </Field>
            <Field label="Monthly ROI (%)">
              <div className="adm-input-suffix">
                <input
                  className="adm-input"
                  inputMode="decimal"
                  value={editor.monthlyRoiPct}
                  onChange={(e) => setEditor({ ...editor, monthlyRoiPct: e.target.value })}
                  placeholder="5.0"
                />
                <span>%</span>
              </div>
            </Field>
            <Field label="Minimum amount (USD)">
              <div className="adm-input-suffix">
                <input
                  className="adm-input"
                  inputMode="decimal"
                  value={editor.minAmount}
                  onChange={(e) => setEditor({ ...editor, minAmount: e.target.value })}
                />
                <span>$</span>
              </div>
            </Field>
            <Field label="Maximum amount (USD, optional)">
              <div className="adm-input-suffix">
                <input
                  className="adm-input"
                  inputMode="decimal"
                  value={editor.maxAmount}
                  onChange={(e) => setEditor({ ...editor, maxAmount: e.target.value })}
                  placeholder="Unlimited"
                />
                <span>$</span>
              </div>
            </Field>
            <Field label="Term (months)">
              <input
                className="adm-input"
                inputMode="numeric"
                value={editor.termMonths}
                onChange={(e) => setEditor({ ...editor, termMonths: e.target.value })}
              />
            </Field>
            <Field label="Sort order">
              <input
                className="adm-input"
                inputMode="numeric"
                value={editor.sort}
                onChange={(e) => setEditor({ ...editor, sort: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Description (shown to users)">
            <textarea
              className="adm-textarea"
              value={editor.description}
              onChange={(e) => setEditor({ ...editor, description: e.target.value })}
              placeholder="A balanced plan for steady growth…"
            />
          </Field>
          <Field label="Accent color">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PLAN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setEditor({ ...editor, color: c })}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: c,
                    border: editor.color === c ? "2px solid var(--dash-lime-2)" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </Field>
          <label className="adm-check" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={editor.isActive}
              onChange={(e) => setEditor({ ...editor, isActive: e.target.checked })}
            />
            Active — users can invest in this plan
          </label>
          <div className="adm-row-end">
            <button className="adm-btn ghost" onClick={() => setEditor(null)} disabled={busy}>
              Cancel
            </button>
            <button className="adm-btn primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editor.id ? "Save Changes" : "Create Plan"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Confirm
          title={`Delete "${deleteTarget.name}"?`}
          text={
            deleteTarget ? (
              <>
                Plan min {fmtMoney(deleteTarget.minAmountCents)} · {deleteTarget.termMonths} months · ROI{" "}
                {(deleteTarget.monthlyRoiBps / 100).toFixed(1)}%. Plans with investment history are deactivated
                instead of hard-deleted; active history is preserved.
              </>
            ) : undefined
          }
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