"use client";

import { useFetch, Spinner, ErrorBanner, fmtMoney } from "@/components/admin/ui";
import { DashboardIcon, TrendingUp, Wallet, ArrowDown, ArrowUp } from "@/components/dashboard/icons";
import type { AdminStats } from "@/lib/api-types";
import type { ReactNode } from "react";

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: ReactNode; icon: ReactNode }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-top">
        <span className="adm-stat-label">{label}</span>
        <span className="adm-stat-ico">{icon}</span>
      </div>
      <div className="adm-stat-value">{value}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data, error, loading, reload } = useFetch<AdminStats>("/api/admin/stats");

  // `error` alone must not blank the screen: a failed background poll keeps the
  // last good numbers on display until the next successful one.
  if (loading && !data) return <Spinner label="Loading overview…" />;
  if (!data) return <ErrorBanner message={error ?? "Failed to load overview"} onRetry={reload} />;

  return (
    <div>
      <div className="adm-hero">
        <div>
          <h2>Operations Overview</h2>
          <p>
            Monitor account balances, pending reviews and platform activity at a glance. Approve
            deposits and withdrawals from the Requests section — every action is recorded in the
            audit log.
          </p>
        </div>
        <div className="adm-hero-actions">
          <a className="adm-btn primary" href="/user/admin/requests">
            Review Requests
          </a>
          <a className="adm-btn ghost" href="/user/admin/transactions">
            All Transactions
          </a>
        </div>
      </div>

      <div className="adm-stats-grid">
        <Stat label="Total Users" value={String(data.totalUsers)} sub={<>+{data.newUsers30d} new in 30d</>} icon={<DashboardIcon />} />
        <Stat label="Active Users" value={String(data.activeUsers)} sub={`${data.suspendedUsers} suspended`} icon={<Wallet />} />
        <Stat label="Platform Balance" value={data.totalBalance} sub="All user accounts" icon={<Wallet />} />
        <Stat label="Total Deposits" value={data.totalDeposits} sub="Lifetime, credited" icon={<ArrowDown />} />
        <Stat label="Total Withdrawals" value={data.totalWithdrawals} sub="Lifetime, paid out" icon={<ArrowUp />} />
        <Stat label="Pending Deposits" value={String(data.pendingDeposits.count)} sub={`${fmtMoney(data.pendingDeposits.sumCents)} awaiting review`} icon={<ArrowDown />} />
        <Stat label="Pending Withdrawals" value={String(data.pendingWithdrawals.count)} sub={`${fmtMoney(data.pendingWithdrawals.sumCents)} awaiting review`} icon={<ArrowUp />} />
        <Stat label="Pending Loans" value={String(data.pendingLoans)} sub="Loan applications to review" icon={<Wallet />} />
        <Stat label="Active Investments" value={String(data.activeInvestments)} sub={`${fmtMoney(data.activeInvestmentsCents)} committed`} icon={<TrendingUp />} />
        <Stat label="Active Plans" value={String(data.totalPlans)} sub="Investment plans online" icon={<TrendingUp />} />
        <Stat label="Approvals (30d)" value={String(data.approvals30d)} sub="Audited admin actions" icon={<DashboardIcon />} />
      </div>

      <div className="adm-card adm-card-pad">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <b style={{ fontSize: 14 }}>Priority queue</b>
          <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>Updated live</span>
        </div>
        <div className="adm-notice" style={{ marginBottom: 10 }}>
          <ArrowDown />
          <span>
            <b style={{ color: "var(--dash-text)" }}>{data.pendingDeposits.count} deposit request(s)</b>{" "}
            totaling <b style={{ color: "var(--dash-text)" }}>{fmtMoney(data.pendingDeposits.sumCents)}</b>{" "}
            are under review. Head to{" "}
            <a className="adm-link-btn" href="/user/admin/requests">
              Requests
            </a>{" "}
            to approve or reject them.
          </span>
        </div>
        <div className="adm-notice" style={{ marginBottom: 10 }}>
          <ArrowUp />
          <span>
            <b style={{ color: "var(--dash-text)" }}>{data.pendingWithdrawals.count} withdrawal request(s)</b>{" "}
            totaling <b style={{ color: "var(--dash-text)" }}>{fmtMoney(data.pendingWithdrawals.sumCents)}</b>{" "}
            are under review — funds are already reserved for these payouts.
          </span>
        </div>
        <div className="adm-notice">
          <Wallet />
          <span>
            <b style={{ color: "var(--dash-text)" }}>{data.pendingLoans} pending loan application(s)</b> in the
            queue. Review them in the Loans section.
          </span>
        </div>
      </div>
    </div>
  );
}