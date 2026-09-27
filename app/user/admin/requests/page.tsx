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
import type { AdminRequestRow } from "@/lib/api-types";

const PAGE_LIMIT = 20;

type Decision = { row: AdminRequestRow; action: "APPROVE" | "REJECT" };

export default function AdminRequestsPage() {
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminRequestRow[]; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (t: string, s: string, p: number) => {
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({ type: t, page: String(p), limit: String(PAGE_LIMIT) });
        if (s !== "ALL") q.set("status", s);
        const d = await apiGet<{ items: AdminRequestRow[]; total: number; totalPages: number }>(
          `/api/admin/requests?${q.toString()}`
        );
        setData(d);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reload = () => load(type, status, page);

  useLive(reload);

  const switchType = (t: "DEPOSIT" | "WITHDRAWAL") => {
    setType(t);
    setPage(1);
    load(t, status, 1);
  };

  const switchStatus = (s: string) => {
    setStatus(s);
    setPage(1);
    load(type, s, 1);
  };

  const submitDecision = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      await apiSend(`/api/admin/requests/${decision.row.id}?type=${type}`, "PATCH", {
        action: decision.action,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setToast(`${type === "DEPOSIT" ? "Deposit" : "Withdrawal"} ${decision.action === "APPROVE" ? "approved" : "rejected"}`);
      setDecision(null);
      setNote("");
      reload();
    } catch (e) {
      setToast((e as Error).message);
      setDecision(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminRequestRow>[] = [
    {
      label: "User",
      render: (r) => (
        <div style={{ minWidth: 0 }}>
          <b>{r.userName}</b>
          <span className="adm-cell-sub">{r.userEmail}</span>
        </div>
      ),
    },
    { label: "Amount", render: (r) => <span className="num">{fmtMoney(r.amountCents)}</span> },
    { label: "Method", render: (r) => r.method },
    {
      label: "Reference",
      render: (r) => (
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{r.reference}</span>
      ),
    },
    {
      label: "Details",
      render: (r) =>
        r.details ? (
          <span title={r.details} style={{ display: "block", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.details}
          </span>
        ) : (
          "—"
        ),
    },
    {
      // For a withdrawal this is where the money goes, so it is shown as a
      // full-width verifiable address rather than a truncated string.
      label: type === "DEPOSIT" ? "From Wallet" : "Payout Wallet",
      render: (r) =>
        r.walletAddress ? (
          <div className="adm-wallet-block">
            <a
              className="adm-wallet-cell"
              href={`https://etherscan.io/address/${r.walletAddress}`}
              target="_blank"
              rel="noreferrer noopener"
              title={r.walletAddress}
            >
              {r.walletAddress}
            </a>
            {type === "WITHDRAWAL" && <span className="adm-wallet-verified">signature verified</span>}
          </div>
        ) : (
          <span className="adm-wallet-cell none">—</span>
        ),
    },
    { label: "Status", render: (r) => <StatusPill status={r.status} /> },
    { label: "Created", render: (r) => <span style={{ whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</span> },
    {
      label: "",
      className: "num",
      render: (r) =>
        r.status === "PENDING" ? (
          <div className="adm-actions-cell">
            <button className="adm-btn good sm" onClick={() => setDecision({ row: r, action: "APPROVE" })}>
              Approve
            </button>
            <button className="adm-btn danger sm" onClick={() => setDecision({ row: r, action: "REJECT" })}>
              Reject
            </button>
          </div>
        ) : (
          <span className="adm-cell-sub">Reviewed</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={type === "DEPOSIT" ? "Deposit Requests" : "Withdrawal Requests"}
        subtitle="Manually review each request. Approving creates the transaction and updates the ledger atomically; withdrawals already reserve funds at submission."
      />

      <div className="adm-inline-form">
        <div className="adm-seg">
          <button className={type === "DEPOSIT" ? "active" : ""} onClick={() => switchType("DEPOSIT")}>
            Deposits
          </button>
          <button className={type === "WITHDRAWAL" ? "active" : ""} onClick={() => switchType("WITHDRAWAL")}>
            Withdrawals
          </button>
        </div>
        <select className="adm-select" value={status} onChange={(e) => switchStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading && !data ? (
        <Spinner label="Loading requests…" />
      ) : error && !data ? (
        <ErrorBanner message={error} onRetry={reload} />
      ) : data ? (
        <>
          <DataTable columns={columns} rows={data.items} />
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            onChange={(p) => {
              setPage(p);
              load(type, status, p);
            }}
          />
        </>
      ) : null}

      {decision && (
        <Modal title={`${decision.action === "APPROVE" ? "Approve" : "Reject"} ${type === "DEPOSIT" ? "deposit" : "withdrawal"}`} onClose={() => setDecision(null)}>
          <p className="adm-confirm-text">
            <b style={{ color: "var(--dash-text)" }}>{decision.row.userName}</b> · {fmtMoney(decision.row.amountCents)} via {decision.row.method}
            <br />
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{decision.row.reference}</span>
          </p>
          <div className="adm-field">
            <label>Admin note (optional, sent to the user)</label>
            <textarea
              className="adm-textarea"
              placeholder={decision.action === "APPROVE" ? "e.g. Deposit confirmed. Welcome aboard!" : "e.g. Please provide a valid payment proof and retry."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {decision.action === "APPROVE" && type === "WITHDRAWAL" && (
            <div className="adm-notice" style={{ marginBottom: 14 }}>
              Approved withdrawals are paid immediately to the user&apos;s provided details and the reserved funds are released.
            </div>
          )}
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