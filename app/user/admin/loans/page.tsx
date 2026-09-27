"use client";

import { useCallback, useState } from "react";
import { useLive } from "@/lib/use-live";
import {
  apiGet,
  apiSend,
  DataTable,
  ErrorBanner,
  Modal,
  PageHeader,
  Pagination,
  Spinner,
  StatusPill,
  Toast,
  fmtDate,
  fmtMoney,
  type Column,
} from "@/components/admin/ui";

type LoanRow = {
  id: string;
  userName: string;
  userEmail: string;
  type: string;
  currency: string;
  amount: string;
  amountCents: number;
  period: number;
  status: string;
  createdAt: string;
  adminNote?: string;
};

const PAGE_LIMIT = 20;

export default function AdminLoansPage() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: LoanRow[]; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ row: LoanRow; action: "APPROVE" | "REJECT" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async (s: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(p), limit: String(PAGE_LIMIT) });
      if (s !== "ALL") q.set("status", s);
      const d = await apiGet<{ items: LoanRow[]; total: number; totalPages: number }>(`/api/admin/loans?${q.toString()}`);
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useLive(() => load(status, page));

  const applyStatus = (s: string) => {
    setStatus(s);
    setPage(1);
    load(s, 1);
  };

  const submitDecision = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      await apiSend(`/api/admin/loans/${decision.row.id}`, "PATCH", {
        action: decision.action,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setToast(`Loan ${decision.action === "APPROVE" ? "approved" : "rejected"}`);
      setDecision(null);
      setNote("");
      load(status, page);
    } catch (e) {
      setToast((e as Error).message);
      setDecision(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<LoanRow>[] = [
    {
      label: "User",
      render: (l) => (
        <div style={{ minWidth: 0 }}>
          <b>{l.userName}</b>
          <span className="adm-cell-sub">{l.userEmail}</span>
        </div>
      ),
    },
    {
      label: "Loan",
      render: (l) => (
        <div>
          <b>{l.type}</b>
          <span className="adm-cell-sub">{l.currency} · {l.period} months</span>
        </div>
      ),
    },
    { label: "Amount", render: (l) => <span className="num">{l.amount}</span> },
    { label: "Status", render: (l) => <StatusPill status={l.status} /> },
    { label: "Created", render: (l) => <span style={{ whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</span> },
    {
      label: "",
      className: "num",
      render: (l) =>
        l.status === "PENDING" ? (
          <div className="adm-actions-cell">
            <button className="adm-btn good sm" onClick={() => setDecision({ row: l, action: "APPROVE" })}>
              Approve
            </button>
            <button className="adm-btn danger sm" onClick={() => setDecision({ row: l, action: "REJECT" })}>
              Reject
            </button>
          </div>
        ) : (
          <span className="adm-cell-sub">{l.status.toLowerCase()}</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Loans"
        subtitle="Approve or reject loan applications. Approved loans receive a due date based on the repayment period."
      />

      <div className="adm-inline-form">
        <select className="adm-select" value={status} onChange={(e) => applyStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading && !data ? (
        <Spinner label="Loading loans…" />
      ) : error && !data ? (
        <ErrorBanner message={error} onRetry={() => load(status, page)} />
      ) : data ? (
        <>
          <DataTable columns={columns} rows={data.items} />
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            onChange={(p) => {
              setPage(p);
              load(status, p);
            }}
          />
        </>
      ) : null}

      {decision && (
        <Modal title={`${decision.action === "APPROVE" ? "Approve" : "Reject"} loan — ${decision.row.userName}`} onClose={() => setDecision(null)}>
          <p className="adm-confirm-text">
            {fmtMoney(decision.row.amountCents)} · {decision.row.type} · {decision.row.period} months
          </p>
          <div className="adm-field">
            <label>Admin note (optional, sent to the user)</label>
            <textarea
              className="adm-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Your loan has been approved. The amount will be credited to your balance."
            />
          </div>
          <div className="adm-row-end">
            <button className="adm-btn ghost" onClick={() => setDecision(null)} disabled={busy}>
              Cancel
            </button>
            <button
              className={`adm-btn ${decision.action === "APPROVE" ? "good" : "danger"}`}
              onClick={submitDecision}
              disabled={busy}
            >
              {busy ? "Working…" : `${decision.action === "APPROVE" ? "Approve" : "Reject"} ${fmtMoney(decision.row.amountCents)}`}
            </button>
          </div>
        </Modal>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}