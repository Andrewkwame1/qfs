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
  Pagination,
  Spinner,
  StatusPill,
  Toast,
  fmtDate,
  fmtMoney,
  type Column,
} from "@/components/admin/ui";
import type { AdminUserRow } from "@/lib/api-types";

const PAGE_LIMIT = 20;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [data, setData] = useState<{ items: AdminUserRow[]; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ row: AdminUserRow; action: "SUSPEND" | "ACTIVATE" | "SET_ROLE"; role?: "ADMIN" | "USER" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [adjust, setAdjust] = useState<{ scope: "USER" | "ALL"; row?: AdminUserRow } | null>(null);
  const [adjDirection, setAdjDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjNote, setAdjNote] = useState("");

  const load = useCallback(
    async (p: number, s: string, r: string, st: string) => {
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams();
        if (s.trim()) q.set("search", s.trim());
        if (r !== "ALL") q.set("role", r);
        if (st !== "ALL") q.set("status", st);
        q.set("page", String(p));
        q.set("limit", String(PAGE_LIMIT));
        const d = await apiGet<{ items: AdminUserRow[]; total: number; totalPages: number }>(
          `/api/admin/users?${q.toString()}`
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

  const reload = () => load(page, search, role, status);

  useLive(reload);

  const runAction = async () => {
    if (!pendingAction) return;
    setBusy(true);
    try {
      await apiSend(`/api/admin/users/${pendingAction.row.id}`, "PATCH", {
        action: pendingAction.action,
        role: pendingAction.role,
      });
      setToast(
        pendingAction.action === "SUSPEND"
          ? "User suspended"
          : pendingAction.action === "ACTIVATE"
            ? "User activated"
            : `Role set to ${pendingAction.role}`
      );
      setPendingAction(null);
      reload();
    } catch (e) {
      setToast((e as Error).message);
      setPendingAction(null);
    } finally {
      setBusy(false);
    }
  };

  const openAdjust = (scope: "USER" | "ALL", row?: AdminUserRow) => {
    setAdjust({ scope, row });
    setAdjDirection("CREDIT");
    setAdjAmount("");
    setAdjNote("");
  };

  const runAdjust = async () => {
    if (!adjust) return;
    const amount = Number(adjAmount);
    if (!amount || amount <= 0) {
      setToast("Enter a valid amount");
      return;
    }
    if (adjNote.trim().length < 3) {
      setToast("Add a note at least 3 characters long");
      return;
    }
    setBusy(true);
    try {
      const res = await apiSend<{ scope: string; applied: number }>("/api/admin/adjustments", "POST", {
        scope: adjust.scope,
        userId: adjust.row?.id,
        direction: adjDirection,
        amount,
        note: adjNote.trim(),
      });
      setToast(
        adjust.scope === "ALL"
          ? `${res.applied} user${res.applied === 1 ? "" : "s"} adjusted`
          : `Balance ${adjDirection === "CREDIT" ? "credited" : "debited"}`
      );
      setAdjust(null);
      setAdjAmount("");
      setAdjNote("");
      reload();
    } catch (e) {
      setToast((e as Error).message);
      setAdjust(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminUserRow>[] = [
    {
      label: "Name",
      render: (u) => (
        <div className="adm-user-cell">
          <img
            src={u.avatarUrl}
            alt=""
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
          <div style={{ minWidth: 0 }}>
            <b>{u.name}</b>
            <span>{u.referralCode}</span>
          </div>
        </div>
      ),
    },
    {
      label: "Email",
      render: (u) => (
        <a className="adm-contact" href={`mailto:${u.email}`} title={`Email ${u.email}`}>
          {u.email}
        </a>
      ),
    },
    {
      label: "Contact",
      render: (u) =>
        u.phone ? (
          <a
            className="adm-contact"
            href={`tel:${u.phone.replace(/[^\d+]/g, "")}`}
            title={`Call ${u.name}`}
          >
            {u.phone}
          </a>
        ) : (
          <span className="adm-none">Not provided</span>
        ),
    },
    { label: "Role", render: (u) => <StatusPill status={u.role === "ADMIN" ? "Admin" : "User"} /> },
    { label: "Status", render: (u) => <StatusPill status={u.status === "SUSPENDED" ? "Suspended" : "Active"} /> },
    { label: "KYC", render: (u) => `Level ${u.kycLevel}` },
    {
      label: "Wallet",
      render: (u) =>
        u.walletAddress ? (
          <a
            className="adm-wallet-cell"
            href={`https://etherscan.io/address/${u.walletAddress}`}
            target="_blank"
            rel="noreferrer noopener"
            title={u.walletAddress}
          >
            {u.walletAddress.slice(0, 6)}…{u.walletAddress.slice(-4)}
          </a>
        ) : (
          <span className="adm-wallet-cell none">—</span>
        ),
    },
    { label: "Balance", render: (u) => <span className="num">{fmtMoney(u.balanceCents)}</span> },
    { label: "Available", render: (u) => <span className="num">{fmtMoney(u.availableCents)}</span> },
    { label: "Deposits", render: (u) => <span className="num">{fmtMoney(u.depositCents)}</span> },
    { label: "Withdrawals", render: (u) => <span className="num">{fmtMoney(u.withdrawalCents)}</span> },
    { label: "Referred", render: (u) => <span className="num">{u.referredCount}</span> },
    { label: "Member Since", render: (u) => <span style={{ whiteSpace: "nowrap" }}>{fmtDate(u.memberSince).split(",")[0]}</span> },
    {
      label: "",
      className: "num",
      render: (u) => (
        <div className="adm-actions-cell">
          <button className="adm-link-btn" onClick={() => openAdjust("USER", u)}>
            Adjust
          </button>
          {u.status === "SUSPENDED" ? (
            <button className="adm-link-btn good" onClick={() => setPendingAction({ row: u, action: "ACTIVATE" })}>
              Activate
            </button>
          ) : (
            <button className="adm-link-btn danger" onClick={() => setPendingAction({ row: u, action: "SUSPEND" })}>
              Suspend
            </button>
          )}
          {u.role === "ADMIN" ? (
            <button className="adm-link-btn" onClick={() => setPendingAction({ row: u, action: "SET_ROLE", role: "USER" })}>
              Remove admin
            </button>
          ) : (
            <button className="adm-link-btn" onClick={() => setPendingAction({ row: u, action: "SET_ROLE", role: "ADMIN" })}>
              Make admin
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Every account with its name, email and contact number. Suspending a user revokes their active sessions."
        actions={
          <button className="adm-btn primary" onClick={() => openAdjust("ALL")}>
            Adjust all users
          </button>
        }
      />

      <div className="adm-inline-form">
        <div className="adm-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className="adm-input"
            placeholder="Search name, email, phone, referral code, wallet…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              load(1, e.target.value, role, status);
            }}
          />
        </div>
        <select
          className="adm-select"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            load(1, search, e.target.value, status);
          }}
        >
          <option value="ALL">All roles</option>
          <option value="USER">Users</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select
          className="adm-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            load(1, search, role, e.target.value);
          }}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {loading && !data ? (
        <Spinner label="Loading users…" />
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
              load(p, search, role, status);
            }}
          />
        </>
      ) : null}

      {pendingAction && (
        <Confirm
          title={
            pendingAction.action === "SUSPEND"
              ? "Suspend user"
              : pendingAction.action === "ACTIVATE"
                ? "Activate user"
                : `Set role to ${pendingAction.role === "ADMIN" ? "Admin" : "User"}`
          }
          text={
            pendingAction.action === "SUSPEND"
              ? `Suspend ${pendingAction.row.name}? Their sessions will be revoked and they will be unable to log in until activated again.`
              : pendingAction.action === "ACTIVATE"
                ? `Activate ${pendingAction.row.name}? They will regain access immediately.`
                : `Change ${pendingAction.row.name}'s role to ${pendingAction.role?.toLowerCase()}?`
          }
          danger={pendingAction.action === "SUSPEND"}
          busy={busy}
          onConfirm={runAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {adjust && (
        <Modal
          title={adjust.scope === "ALL" ? "Adjust all users" : `Adjust ${adjust.row?.name ?? "user"}`}
          onClose={() => setAdjust(null)}
        >
          {adjust.scope === "ALL" ? (
            <p className="adm-confirm-text">
              Applies to every non-admin account, active and suspended alike. Admins are excluded.
            </p>
          ) : (
            <p className="adm-confirm-text">
              {adjust.row?.name} — balance {fmtMoney(adjust.row?.balanceCents ?? 0)}, available{" "}
              {fmtMoney(adjust.row?.availableCents ?? 0)}. Debits cannot exceed the available balance.
            </p>
          )}
          <div className="adm-inline-form" style={{ alignItems: "flex-end" }}>
            <Field label="Direction">
              <select
                className="adm-select"
                value={adjDirection}
                onChange={(e) => setAdjDirection(e.target.value as "CREDIT" | "DEBIT")}
              >
                <option value="CREDIT">Credit (add profit)</option>
                <option value="DEBIT">Debit (deduct)</option>
              </select>
            </Field>
            <Field label="Amount (USD)">
              <input
                className="adm-input"
                inputMode="decimal"
                placeholder="100.00"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Note" hint="Shown to the user and recorded in the audit log">
            <input
              className="adm-input"
              placeholder="e.g. Q3 performance bonus"
              value={adjNote}
              onChange={(e) => setAdjNote(e.target.value)}
            />
          </Field>
          <div className="adm-row-end" style={{ marginTop: 16 }}>
            <button className="adm-btn ghost" onClick={() => setAdjust(null)} disabled={busy}>
              Cancel
            </button>
            <button
              className={`adm-btn ${adjDirection === "DEBIT" ? "danger" : "primary"}`}
              onClick={runAdjust}
              disabled={busy}
            >
              {busy ? "Working…" : adjDirection === "CREDIT" ? "Credit balance" : "Debit balance"}
            </button>
          </div>
        </Modal>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}