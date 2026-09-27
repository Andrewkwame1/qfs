"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LIVE_MS, LiveBadge, useLive } from "@/lib/use-live";
import {
  ArrowDown,
  ArrowRedo,
  ArrowUp,
  Bell,
  Card,
  Check,
  ChevronDown,
  ChevronRight,
  Close,
  Copy,
  DashboardIcon,
  FilePdf,
  Gift,
  InfoIcon,
  ListIcon,
  LogOut,
  MapPin,
  Menu,
  MinusCircle,
  PlusCircle,
  RightArrow,
  Search,
  Share,
  Star,
  Sun,
  Moon,
  SwapVert,
  Timer,
  TrendingUp,
  Wallet,
} from "./icons";
import {
  DOCUMENTS,
  INVESTMENT_PLANS,
  LOAN_CURRENCIES,
  LOAN_PERIODS,
  LOAN_TYPES,
  MARKET_COLORS,
  METALS,
  QUICK_ACTIONS,
  REVIEW_RATINGS,
  STOCKS,
  CRYPTO,
} from "./data";
import type { InvestPlanItem, OverviewData } from "@/lib/api-types";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const QUICK_ICONS: Record<string, ReactNode> = {
  down: <ArrowDown />,
  trending: <TrendingUp />,
  redo: <ArrowRedo />,
  card: <Card />,
  wallet: <Wallet />,
  list: <ListIcon />,
  swap: <SwapVert />,
  gift: <Gift />,
};

const TX_ICONS: Record<string, ReactNode> = {
  dep: <ArrowDown />,
  inv: <TrendingUp />,
  wd: <ArrowUp />,
  earn: <Wallet />,
  ref: <Wallet />,
};

const MODAL_TITLES: Record<string, string> = {
  invest: "Start New Investment",
  deposit: "Add Funds",
  withdraw: "Make New withdrawal",
  cards: "Manage Cards",
  loans: "My Loans",
  history: "Transactions",
  loanApply: "Loan Application",
  notifications: "Notifications",
  noteligible: "Not Eligible",
  notavailable: "Feature Not Available",
  noreward: "Rewards Not Available",
  pdf: "Company Presentation",
};

const DEPOSIT_METHODS = ["Bank Transfer", "Bitcoin", "Ethereum", "USDT (TRC20)", "USDT (BEP20)"];
const WITHDRAW_METHODS = ["Bank Transfer", "Bitcoin", "Ethereum"];

/* Methods that pay out to a connected wallet address rather than bank details. */
const WALLET_METHODS = new Set(["Bitcoin", "Ethereum", "USDT (TRC20)", "USDT (BEP20)"]);

type WalletRow = { address: string; chainId: number; label: string };

function shortAddr(a: string) {
  return a.length < 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/**
 * Lets the user pick one of their verified wallets. Selecting is optional — the
 * forms still accept a pasted address — but a connected wallet is the only one
 * this platform can prove is theirs.
 */
function WalletPicker({
  wallets,
  value,
  onPick,
  emptyHint,
}: {
  wallets: WalletRow[];
  value?: string;
  onPick: (address: string) => void;
  emptyHint: string;
}) {
  if (wallets.length === 0) {
    return (
      <div className="dash-wallet-pick dash-wallet-empty">
        <span>{emptyHint}</span>
        <a className="dash-wallet-link" href="/user/user/connect">
          Connect wallet
        </a>
      </div>
    );
  }

  return (
    <div className="dash-wallet-pick">
      <span className="dash-wallet-label">Connected wallet</span>
      <div className="dash-wallet-row">
        {wallets.map((w) => (
          <button
            key={w.address}
            type="button"
            className={`dash-wallet-chip${value === w.address ? " active" : ""}`}
            onClick={() => onPick(value === w.address ? "" : w.address)}
            title={w.address}
          >
            {shortAddr(w.address)}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error?.message ?? "Request failed. Please try again.");
  }
  return json.data;
}

async function fetchOverview(): Promise<OverviewData | null> {
  try {
    const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
    const json = await res.json();
    if (json?.ok) return json.data as OverviewData;
    return null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Dashboard app                                                       */
/* ------------------------------------------------------------------ */

type DashboardAppProps = {
  /** Live overview payload from the server (always provided when logged in). */
  overview?: OverviewData;
};

export default function DashboardApp({ overview }: DashboardAppProps) {
  const [data, setData] = useState<OverviewData | null>(overview ?? null);

  useEffect(() => {
    if (overview) setData(overview);
  }, [overview]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [infoDialog, setInfoDialog] = useState<{ title: string; text: string } | null>(null);
  const [pdfDoc, setPdfDoc] = useState(data?.documents[0] ?? DOCUMENTS[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [marketTab, setMarketTab] = useState("metals");
  const [docsTab, setDocsTab] = useState("documents");
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [busy, setBusy] = useState(false);

  // Form state for live modals
  const [invPlan, setInvPlan] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [depAmount, setDepAmount] = useState("");
  const [depMethod, setDepMethod] = useState(DEPOSIT_METHODS[0]);
  const [depWallet, setDepWallet] = useState("");
  const [wdAmount, setWdAmount] = useState("");
  const [wdMethod, setWdMethod] = useState(WITHDRAW_METHODS[0]);
  const [wdDetails, setWdDetails] = useState("");
  const [wdWallet, setWdWallet] = useState("");
  const [lnAmount, setLnAmount] = useState("");
  const [lnType, setLnType] = useState(LOAN_TYPES[0]);
  const [lnPeriod, setLnPeriod] = useState(LOAN_PERIODS[3]);
  const [lnOcc, setLnOcc] = useState("");
  const [lnCur, setLnCur] = useState(LOAN_CURRENCIES[0]);

  /* Verified wallets, used to prefill crypto deposit/withdrawal addresses. */
  const [wallets, setWallets] = useState<WalletRow[]>([]);

  const refreshWallets = async () => {
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (json?.ok) setWallets(json.data.wallets as WalletRow[]);
    } catch {
      /* the modals fall back to manual entry */
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("qfs-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    void refreshWallets();
  }, []);

  useEffect(() => {
    localStorage.setItem("qfs-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function refreshOverview() {
    const fresh = await fetchOverview();
    if (fresh) setData(fresh);
  }

  // Balances, requests and earnings arrive on their own — no page reload needed.
  useLive(refreshOverview, LIVE_MS, false);

  const openModal = (key: string) => {
    setMenuOpen(false);
    setSidebarOpen(false);
    setModal(key);
  };

  const closeModal = () => setModal(null);

  const showInfo = (title: string, text: string) => {
    setMenuOpen(false);
    setSidebarOpen(false);
    setInfoDialog({ title, text });
  };

  /* ---------- Live data derived from the API payload ---------- */

  // No mock profile fallback: everything shown on the dashboard comes from the
  // API. `null` means the overview hasn't loaded yet.
  const profile = data
    ? {
        name: data.user.name,
        location: data.user.country,
        referral: data.referral.url,
        avatar: data.user.avatarUrl,
        memberSince: data.user.memberSince,
      }
    : null;

  const balances = data?.balanceCards ?? [];
  const availableText = data?.balance.available ?? "";
  const transactions = (data?.recentTx ?? []) as Array<
    OverviewData["recentTx"][number] & { id?: string }
  >;
  const documents = data?.documents ?? DOCUMENTS;
  const reviews = data?.reviews ?? [];
  const plans: InvestPlanItem[] =
    data?.plans ??
    INVESTMENT_PLANS.map((p, i) => ({
      id: `fb-plan-${i}`,
      name: p.name,
      min: p.min,
      roi: p.roi,
      term: p.term,
    }));
  const activeCount = data?.investmentSummary.activeCount ?? 0;
  const unreadCount = data?.notifications.unread ?? 0;
  const notifications = data?.notifications.items ?? [];
  const card = data?.cards[0] ?? null;

  type MarketRow = {
    sym: string;
    name: string;
    full: string;
    price: string;
    chg: string;
    up: boolean;
    color?: string;
  };
  const marketData: MarketRow[] =
    marketTab === "metals"
      ? (data?.markets.metals ?? METALS)
      : marketTab === "stocks"
        ? (data?.markets.stocks ?? STOCKS)
        : (data?.markets.crypto ?? CRYPTO);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profile?.referral ?? "");
    } catch {
      /* ignore — fallback below */
    }
    setCopied(true);
    setToast("Referral link copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join QFS!",
          text: "Invest Today, Thrive Tomorrow:",
          url: profile?.referral ?? "",
        });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await copyLink();
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = "/user/user/login";
  };

  /* ---------- Mutations ---------- */

  const submitDeposit = async () => {
    const amount = Number(depAmount);
    if (!amount || amount <= 0) {
      setToast("Enter a valid amount");
      return;
    }
    setBusy(true);
    try {
      await post("/api/deposits", {
        amount,
        method: depMethod,
        ...(depWallet ? { walletAddress: depWallet } : {}),
      });
      closeModal();
      setToast("Deposit submitted — awaiting review");
      setDepAmount("");
      await refreshOverview();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitInvest = async () => {
    const amount = Number(invAmount);
    if (!amount || amount <= 0 || !invPlan) {
      setToast("Choose a plan and enter an amount");
      return;
    }
    setBusy(true);
    try {
      await post("/api/investments", { planId: invPlan, amount });
      closeModal();
      setToast("Investment started 🎉");
      setInvAmount("");
      await refreshOverview();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitWithdraw = async () => {
    const amount = Number(wdAmount);
    if (!amount || amount <= 0) {
      setToast("Enter a valid amount");
      return;
    }
    setBusy(true);
    try {
      // A connected wallet is a known-good destination; a typed-in one is not.
      const details = wdDetails.trim();
      if (WALLET_METHODS.has(wdMethod) && !details) {
        setToast("Enter the wallet address to receive the funds");
        setBusy(false);
        return;
      }
      await post("/api/withdrawals", {
        amount,
        method: wdMethod,
        ...(details ? { details } : {}),
        ...(wdWallet ? { walletAddress: wdWallet } : {}),
      });
      closeModal();
      setToast("Withdrawal submitted — awaiting review");
      setWdAmount("");
      setWdDetails("");
      await refreshOverview();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitLoan = async () => {
    const amount = Number(lnAmount);
    if (!amount || amount <= 0 || !lnOcc.trim()) {
      setToast("Fill in the loan amount and your occupation");
      return;
    }
    setBusy(true);
    try {
      await post("/api/loans", {
        amount,
        type: lnType,
        period: String(parseInt(lnPeriod, 10) || 12),
        occupation: lnOcc.trim(),
        currency: lnCur,
      });
      closeModal();
      setToast("Loan application submitted for review");
      setLnAmount("");
      setLnOcc("");
      await refreshOverview();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await refreshOverview();
    } catch {
      /* ignore */
    }
  };

  /* ---------- Render pieces ---------- */

  const renderBalanceCards = () =>
    balances.map((b) => (
      <div
        key={b.key}
        className={`dash-balance-card${b.key === "balance" ? " primary" : ""}${
          b.key === "loans" ? " loans" : ""
        }`}
      >
        <div className="dash-balance-top">
          <span className="dash-balance-ico">
            {QUICK_ICONS[b.key === "loans" ? "wallet" : b.key === "withdrawals" ? "redo" : b.key === "earnings" ? "trending" : "card"]}
          </span>
        </div>
        <span className="dash-balance-label">{b.label}</span>
        <div className="dash-balance-amount">{b.amount}</div>
        <div className="dash-balance-sub">
          <span className={b.trendDir === "up" ? "up" : b.trendDir === "down" ? "down" : ""}>
            {b.trend}
          </span>
        </div>
        <button
          className={`dash-balance-action ${b.tone === "lime" ? "lime" : b.tone === "danger" ? "danger" : "ghost"}`}
          onClick={() =>
            b.actionModal === "noteligible"
              ? showInfo(
                  "Not Eligible",
                  "Unfortunately, you’re not eligible for a loan right now. Continue your activities on our platform to enhance your credit score and try again later."
                )
              : openModal(b.actionModal)
          }
        >
          {b.action}
        </button>
      </div>
    ));

  const renderMarkets = () => (
    <div className="dash-card dash-card-pad">
      <div className="dash-tabs" style={{ marginBottom: 14 }}>
        <button
          className={`dash-tab${marketTab === "metals" ? " active" : ""}`}
          onClick={() => setMarketTab("metals")}
        >
          Markets
        </button>
        <button
          className={`dash-tab${marketTab === "stocks" ? " active" : ""}`}
          onClick={() => setMarketTab("stocks")}
        >
          Stocks
        </button>
        <button
          className={`dash-tab${marketTab === "crypto" ? " active" : ""}`}
          onClick={() => setMarketTab("crypto")}
        >
          Metals &amp; Crypto
        </button>
      </div>

      <div className="dash-market-table-wrap" style={{ overflowX: "auto" }}>
        <table className="dash-market-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Price</th>
              <th>Change (24h)</th>
            </tr>
          </thead>
          <tbody>
            {marketData.map((m) => (
              <tr key={m.sym}>
                <td>
                  <div className="dash-mkt-symbol">
                    <span
                      className="dash-mkt-logo"
                      style={{ background: MARKET_COLORS[m.sym] ?? m.color ?? "#2b2b3a", color: "#fff" }}
                    >
                      {m.sym.slice(0, 1)}
                    </span>
                    <span className="dash-mkt-name">
                      <b>{m.name}</b>
                      <span>{m.full}</span>
                    </span>
                  </div>
                </td>
                <td className="dash-price">${m.price}</td>
                <td>
                  <span className={`dash-change ${m.up ? "up" : "down"}`}>{m.chg}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dash-explore-row">
        <button className="dash-btn primary" onClick={() => openModal("invest")}>
          Explore All <RightArrow size={14} />
        </button>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div>
      <ul className="dash-docs-list">
        {documents.map((d) => (
          <li
            key={d.code}
            onClick={() => {
              setPdfDoc(d);
              setModal("pdf");
            }}
          >
            <img className="dash-flag" src={d.flag} alt={d.label} />
            <span className="dash-doc-name">
              <FilePdf />
              <span>{d.label}</span>
            </span>
            <ChevronRight className="dash-chevron" size={14} />
          </li>
        ))}
      </ul>
      <div className="dash-explore-row">
        <button className="dash-btn primary block" onClick={() => {
          setPdfDoc(documents[0]);
          setModal("pdf");
        }}>
          View All PDF Documents <RightArrow size={14} />
        </button>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div>
      <div className="dash-review-head">
        <b>Customers Reviews</b>
        <span className="dash-review-badge">38K+ Reviews</span>
      </div>

      <div style={{ marginTop: 10 }}>
        {REVIEW_RATINGS.map((r) => (
          <div className="dash-rating-row" key={r.stars}>
            <span className="dash-rating-label">
              {r.stars} <Star />
            </span>
            <div className="dash-rating-track">
              <div className="dash-rating-fill" style={{ width: `${r.pct}%` }} />
            </div>
            <span className="dash-rating-pct">{r.pct}%</span>
          </div>
        ))}
      </div>

      {reviews.slice(0, 2).map((r) => (
        <div className="dash-review-card" key={r.name}>
          <div className="dash-review-card-head">
            <img src={r.avatar} alt={r.name} />
            <div style={{ minWidth: 0 }}>
              <b>{r.name}</b>
              <span>{r.meta}</span>
            </div>
            <span className="dash-review-stars">
              {Array.from({ length: r.stars }).map((_, i) => (
                <Star key={i} />
              ))}
            </span>
          </div>
          <p>{r.text}</p>
        </div>
      ))}

      <div className="dash-actions-row">
        <button className="dash-btn primary" onClick={() => showInfo("Customers Reviews", "All verified investor reviews are shown on the marketplace page (demo).")}>
          Explore Customers Reviews <RightArrow size={14} />
        </button>
        <button className="dash-btn info" onClick={() => showInfo("Add Review", "The review form opens here in production. Thank you for your feedback! (demo)")}>
          <PlusCircle size={15} /> Add Review
        </button>
      </div>
    </div>
  );

  const renderVideos = () => (
    <div>
      <div className="dash-video-wrap" onClick={() => showInfo("QFS Videos", "Company introduction &amp; platform walkthrough videos available soon (demo).")}>
        <span className="dash-play-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span>QFS Platform Introduction</span>
      </div>
    </div>
  );

  /* ---------------- Modal content pieces ---------------- */

  const renderInvestModal = () => (
    <div className="dash-modal-body">
      <div className="dash-form-group">
        <label htmlFor="inv-from">Invest From</label>
        <select id="inv-from" className="dash-select" defaultValue="main">
          <option value="main">Main Balance — {availableText}</option>
        </select>
      </div>

      <div className="dash-form-group">
        <label>Select Plan</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {plans.map((p) => {
            const selected = invPlan === p.id;
            return (
              <button
                key={p.id ?? p.name}
                type="button"
                onClick={() => setInvPlan(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: selected ? "rgba(206,255,12,0.07)" : "rgba(255,255,255,0.04)",
                  border: selected ? "1px solid var(--dash-lime-2)" : "1px solid var(--dash-border)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `2px solid ${selected ? "var(--dash-lime-2)" : "var(--dash-muted-2)"}`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {selected && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--dash-lime-2)" }} />
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13.5, display: "block" }}>{p.name}</b>
                  <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                    {p.roi} · {p.term}
                  </span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--dash-lime-2)" }}>{p.min}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="dash-form-group">
        <label htmlFor="inv-amount">Investment Amount</label>
        <div className="dash-input-suffix">
          <input
            id="inv-amount"
            className="dash-input"
            placeholder="100.00"
            inputMode="decimal"
            value={invAmount}
            onChange={(e) => setInvAmount(e.target.value)}
          />
          <span>USD</span>
        </div>
      </div>

      <button className="dash-btn primary block" disabled={busy} onClick={submitInvest}>
        {busy ? "Submitting…" : "Setup New Investment"} <RightArrow size={14} />
      </button>
    </div>
  );

  const renderDepositModal = () => (
    <div className="dash-modal-body">
      <div className="dash-form-group">
        <label htmlFor="dep-method">Deposit Method</label>
        <select
          id="dep-method"
          className="dash-select"
          value={depMethod}
          onChange={(e) => setDepMethod(e.target.value)}
        >
          {DEPOSIT_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="dash-form-group">
        <label htmlFor="dep-amount">Amount</label>
        <div className="dash-input-suffix">
          <input
            id="dep-amount"
            className="dash-input"
            placeholder="100.00"
            inputMode="decimal"
            value={depAmount}
            onChange={(e) => setDepAmount(e.target.value)}
          />
          <span>USD</span>
        </div>
      </div>
      {WALLET_METHODS.has(depMethod) && (
        <WalletPicker
          wallets={wallets}
          onPick={setDepWallet}
          emptyHint="Connect a wallet to attach an address to this deposit."
        />
      )}

      <p className="dash-input-note">
        Deposits are reviewed within 24 hours and credited to your balance. Min amount $50.00.
      </p>
      <button className="dash-btn primary block" disabled={busy} onClick={submitDeposit}>
        {busy ? "Submitting…" : "Submit Deposit Request"} <RightArrow size={14} />
      </button>
    </div>
  );

  const renderWithdrawModal = () => (
    <div className="dash-modal-body">
      <div className="dash-form-group">
        <label htmlFor="wd-method">Withdraw To</label>
        <select
          id="wd-method"
          className="dash-select"
          value={wdMethod}
          onChange={(e) => setWdMethod(e.target.value)}
        >
          {WITHDRAW_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="dash-form-group">
        <label htmlFor="wd-amount">Amount</label>
        <div className="dash-input-suffix">
          <input
            id="wd-amount"
            className="dash-input"
            placeholder="100.00"
            inputMode="decimal"
            value={wdAmount}
            onChange={(e) => setWdAmount(e.target.value)}
          />
          <span>USD</span>
        </div>
      </div>
      {WALLET_METHODS.has(wdMethod) ? (
        <WalletPicker
          wallets={wallets}
          value={wdWallet}
          onPick={(a) => {
            setWdWallet(a);
            setWdDetails(a);
          }}
          emptyHint="Connect a wallet first, or paste an address below."
        />
      ) : null}

      <div className="dash-form-group">
        <label htmlFor="wd-details">
          {wdMethod === "Bank Transfer" ? "Bank / Account Details" : "Wallet Address or Details"}
        </label>
        <input
          id="wd-details"
          className="dash-input"
          placeholder="e.g. account number, SWIFT, wallet address"
          value={wdDetails}
          onChange={(e) => {
            setWdDetails(e.target.value);
            setWdWallet("");
          }}
        />
        {WALLET_METHODS.has(wdMethod) && wdWallet && (
          <p className="dash-input-note">
            Payout will be sent to the connected wallet after admin review. Check the
            address carefully — on-chain transfers cannot be reversed.
          </p>
        )}
      </div>
      <p className="dash-input-note">
        Withdrawals are processed within 24h after review. Min amount $50.00.
      </p>
      <button className="dash-btn primary block" disabled={busy} onClick={submitWithdraw}>
        {busy ? "Submitting…" : "Proceed to Withdrawal"} <RightArrow size={14} />
      </button>
    </div>
  );

  const renderCardsModal = () => (
    <div className="dash-modal-body">
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span className="dash-inactive-badge">
          {card ? <Check size={13} /> : <Timer size={13} />}
          {card ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="dash-credit-card">
        <div className="dash-cc-top">
          <span className="dash-cc-chip" />
          <img src="/logo/logo_Asset-5-1024x318-1.png" alt="QFS Card" style={{ filter: "brightness(2)" }} />
        </div>
        <div className="dash-cc-number">**** **** **** {card ? card.last4 : "0000"}</div>
        <div className="dash-cc-bottom">
          <div>
            <div className="dash-cc-label">Card Holder</div>
            <div className="dash-cc-value">{card ? card.holder : "—"}</div>
          </div>
          <div>
            <div className="dash-cc-label">Expires</div>
            <div className="dash-cc-value">{card ? card.expiry : "00/00"}</div>
          </div>
          <span className="dash-mastercard" aria-hidden="true">
            <i />
            <i />
          </span>
        </div>
      </div>

      <div className="dash-notice">
        <InfoIcon />
        {card
          ? "Your QFS card is active and ready to use."
          : "Verify your account to activate your QFS card."}
      </div>

      <div className="dash-actions-row">
        <button className="dash-btn ghost" onClick={() => showInfo("Card Transactions", "Card transactions are shown here in production.")}>
          <ListIcon size={15} /> Transactions
        </button>
        <button className="dash-btn primary" onClick={() => (card ? showInfo("QFS Card", "Card controls are available in production.") : submitDeposit())}>
          {card ? "Card Settings" : "Fund Your Card"} <RightArrow size={14} />
        </button>
      </div>
    </div>
  );

  const loanTotal = data?.loans.total ?? "$0.00";
  const hasLoans = (data?.loans.count ?? 0) > 0;

  const renderLoansModal = () => {
    const rows: Array<[string, string]> = [
      ["Active Loans", hasLoans ? loanTotal : "$0.00"],
      ["Outstanding Balance", hasLoans ? loanTotal : "$0.00"],
      ["Next Payment", hasLoans ? "See admin approval" : "—"],
      ["Loan Limit", "$5,000.00"],
    ];
    return (
      <div className="dash-modal-body">
        {rows.map(([label, value]) => (
          <div className="dash-loan-row" key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}

        {!hasLoans && (
          <div className="dash-notice">
            <InfoIcon />
            You don’t have any loan history yet. Build your credit score by keeping an active account.
          </div>
        )}

        <div className="dash-actions-row">
          <button className="dash-btn ghost" onClick={() => showInfo("Boost Your Loan Eligibility", "To boost your eligibility and improve your credit score, continue using the platform regularly. Stay active and keep growing with us!")}>
            Boost Eligibility
          </button>
          <button className="dash-btn primary" onClick={() => setModal("loanApply")}>
            Apply for Loan <RightArrow size={14} />
          </button>
        </div>
      </div>
    );
  };

  const renderLoanApplyModal = () => (
    <div className="dash-modal-body">
      <div className="dash-form-group">
        <label htmlFor="loan-amount">Loan Amount</label>
        <div className="dash-input-suffix">
          <input
            id="loan-amount"
            className="dash-input"
            placeholder="100.00"
            inputMode="numeric"
            value={lnAmount}
            onChange={(e) => setLnAmount(e.target.value)}
          />
          <span>USD</span>
        </div>
      </div>
      <div className="dash-form-group">
        <label htmlFor="loan-type">Loan Type</label>
        <select id="loan-type" className="dash-select" value={lnType} onChange={(e) => setLnType(e.target.value)}>
          {LOAN_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="dash-form-group">
        <label htmlFor="loan-period">Loan Repayment Period</label>
        <select id="loan-period" className="dash-select" value={lnPeriod} onChange={(e) => setLnPeriod(e.target.value)}>
          {LOAN_PERIODS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="dash-form-group">
        <label htmlFor="loan-occ">Your Occupation</label>
        <input
          id="loan-occ"
          className="dash-input"
          placeholder="Enter your occupation"
          value={lnOcc}
          onChange={(e) => setLnOcc(e.target.value)}
        />
      </div>
      <div className="dash-form-group">
        <label htmlFor="loan-cur">Loan Currency</label>
        <select id="loan-cur" className="dash-select" value={lnCur} onChange={(e) => setLnCur(e.target.value)}>
          {LOAN_CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <button className="dash-btn primary block" disabled={busy} onClick={submitLoan}>
        {busy ? "Submitting…" : "Apply Loan"} <RightArrow size={14} />
      </button>
    </div>
  );

  const renderHistoryModal = () => (
    <div className="dash-modal-body" style={{ paddingTop: 8 }}>
      <div className="dash-tx-list">
        {transactions.map((t) => (
          <div className="dash-tx-item" key={t.id ?? t.title + t.date}>
            <span className={`dash-tx-ico ${t.kind}`}>{TX_ICONS[t.kind]}</span>
            <div className="dash-tx-meta">
              <b>{t.title}</b>
              <span>{t.meta}</span>
              <span>{t.date}</span>
            </div>
            <div className="dash-tx-amount">
              <b className={t.cls}>{t.amount}</b>
              <span className="dash-tx-status">{t.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationsModal = () => (
    <div className="dash-modal-body" style={{ paddingTop: 8 }}>
      {notifications.length === 0 ? (
        <div className="dash-notice">
          <InfoIcon /> You have no notifications yet.
        </div>
      ) : (
        <ul className="dash-notif-list">
          {notifications.map((n) => (
            <li key={n.id} className={n.read ? "read" : ""}>
              <b>{n.title}</b>
              {n.body && <span>{n.body}</span>}
              <small>{n.time}</small>
            </li>
          ))}
        </ul>
      )}
      {unreadCount > 0 && (
        <button className="dash-btn ghost block" onClick={markAllRead}>
          <Check size={14} /> Mark all as read
        </button>
      )}
    </div>
  );

  const renderPdfModal = () => (
    <div className="dash-modal-body">
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          background: "linear-gradient(135deg,#1c1c28,#0c0c14)",
          border: "1px solid var(--dash-border)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <img src={pdfDoc.flag} alt="" className="dash-flag" style={{ width: 40, height: 28 }} />
        <div>
          <b style={{ fontSize: 13.5, display: "block" }}>{pdfDoc.label}</b>
          <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>QFS Company Presentation · PDF</span>
        </div>
      </div>
      <p className="dash-input-note" style={{ marginBottom: 14 }}>
        The actual PDF file will be attached here in production. This is a static demo preview.
      </p>
      <div className="dash-actions-row">
        <button className="dash-btn ghost" onClick={() => showInfo("Sharing PDF", "Sharing options arrive in production.")}>
          <Share size={14} /> Share PDF
        </button>
        <button className="dash-btn primary" onClick={() => showInfo("Download PDF", "Download will be enabled when the file is uploaded.")}>
          <FilePdf size={14} /> Download PDF <RightArrow size={14} />
        </button>
      </div>
    </div>
  );

  const modalContent = useMemo(() => {
    switch (modal) {
      case "invest":
        return renderInvestModal();
      case "deposit":
        return renderDepositModal();
      case "withdraw":
        return renderWithdrawModal();
      case "cards":
        return renderCardsModal();
      case "loans":
        return renderLoansModal();
      case "loanApply":
        return renderLoanApplyModal();
      case "history":
        return renderHistoryModal();
      case "notifications":
        return renderNotificationsModal();
      case "pdf":
        return renderPdfModal();
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal, pdfDoc, plans, invPlan, busy, notifications, transactions, data]);

  return (
    <div className={`qfs-dash${sidebarOpen ? " sidebar-open" : ""}`} data-theme={theme}>
      {/* ------------ Sidebar ------------ */}
      <aside className="dash-sidebar">
        <div className="dash-sb-head">
          <img src="/logo/logo_Asset-5-1024x318-1.png" alt="QFS" />
          <button className="dash-sb-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <Close />
          </button>
        </div>

        {profile && (
          <div className="dash-sb-profile">
            <img src={profile.avatar} alt={profile.name} />
            <div className="dash-sb-profile-in">
              <strong>{profile.name}</strong>
              <span>
                <MapPin /> {profile.location}
              </span>
            </div>
          </div>
        )}

        <div className="dash-sb-balance">
          <div className="dash-sb-balance-label">Available Balance</div>
          <div className="dash-sb-balance-amount">{availableText}</div>
        </div>

        <div className="dash-sb-actions">
          <button className="dash-sb-action" onClick={() => openModal("deposit")}>
            <ArrowDown size={13} /> Add Fund
          </button>
          <button className="dash-sb-action" onClick={() => openModal("cards")}>
            <Card size={13} /> My Cards
          </button>
          <button className="dash-sb-action" onClick={() => openModal("withdraw")}>
            <ArrowRedo size={13} /> Withdraw
          </button>
          <button className="dash-sb-action dash-sb-action-danger" onClick={logout}>
            <LogOut size={13} /> Logout
          </button>
        </div>

        <nav className="dash-sb-nav">
          <div className="dash-sb-group-title">Menu</div>
          <button className="dash-sb-link active" onClick={() => setSidebarOpen(false)}>
            <span className="dash-sb-link-ico">
              <DashboardIcon />
            </span>
            Dashboard
            <span className="dash-sb-link-badge">{activeCount}</span>
          </button>

          <div className="dash-sb-group-title">Finance</div>
          <button className="dash-sb-link" onClick={() => openModal("invest")}>
            <span className="dash-sb-link-ico">
              <PlusCircle />
            </span>
            Add Investment
          </button>
          <button className="dash-sb-link" onClick={() => openModal("invest")}>
            <span className="dash-sb-link-ico">
              <ListIcon />
            </span>
            Active Investments
          </button>
          <button className="dash-sb-link" onClick={() => openModal("history")}>
            <span className="dash-sb-link-ico">
              <SwapVert />
            </span>
            Transactions
          </button>

          <div className="dash-sb-group-title">Withdrawal</div>
          <button className="dash-sb-link" onClick={() => openModal("withdraw")}>
            <span className="dash-sb-link-ico">
              <MinusCircle />
            </span>
            Request Withdrawal
          </button>
          <button className="dash-sb-link" onClick={() => openModal("history")}>
            <span className="dash-sb-link-ico">
              <ListIcon />
            </span>
            Recent Withdrawals
          </button>

          <div className="dash-sb-group-title">Others</div>
          <button className="dash-sb-link" onClick={() => openModal("cards")}>
            <span className="dash-sb-link-ico">
              <Card />
            </span>
            My Cards
          </button>
          <button className="dash-sb-link" onClick={() => openModal("loans")}>
            <span className="dash-sb-link-ico">
              <Wallet />
            </span>
            My Loans
          </button>
          <button className="dash-sb-link" onClick={() => openModal("noreward")}>
            <span className="dash-sb-link-ico">
              <Gift />
            </span>
            Rewards
          </button>
          <button className="dash-sb-link" onClick={() => openModal("notavailable")}>
            <span className="dash-sb-link-ico">
              <SwapVert />
            </span>
            Pay Bills
          </button>
        </nav>
      </aside>

      <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />

      {/* ------------ Main ------------ */}
      <div className="dash-main">
        <header className="dash-topbar">
          <button className="dash-hamburger" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <img className="dash-topbar-logo" src="/logo/logo_Asset-5-1024x318-1.png" alt="QFS" />

          <div className="dash-topbar-search">
            <Search />
            <input placeholder="Search transactions, plans…" aria-label="Search" />
          </div>

          <div className="dash-topbar-spacer" />

          <div className="dash-topbar-actions">
            <LiveBadge />

            <button
              className="dash-icon-btn"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button className="dash-icon-btn dash-hide-m" aria-label="Notifications" onClick={() => openModal("notifications")}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="dash-badge">{unreadCount}</span>}
            </button>

            <div style={{ position: "relative" }}>
              {profile && (
                <button className="dash-user-chip" onClick={() => setMenuOpen((v) => !v)}>
                  <img src={profile.avatar} alt={profile.name} />
                  <span>
                    <span className="dash-user-chip-name">{profile.name}</span>
                    <br />
                    <span className="dash-user-chip-venue">{profile.memberSince}</span>
                  </span>
                  <ChevronDown size={14} />
                </button>
              )}

              {menuOpen && (
                <div className="dash-user-menu">
                  <button onClick={() => setMenuOpen(false)}>Dashboard</button>
                  <a href="/" onClick={() => setMenuOpen(false)}>
                    View Public Site
                  </a>
                  <a href="/user/user/register" onClick={() => setMenuOpen(false)}>
                    Profile Settings
                  </a>
                  <button className="dash-user-menu-danger" onClick={logout}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dash-body">
          {/* Welcome */}
          <div className="dash-welcome">
            <div>
              <h1>Welcome Back, {profile ? profile.name.split(" ")[0] : ""} 👋</h1>
              <p>
                Here is what&apos;s happening with your QFS account today. · {profile?.memberSince ?? ""}
              </p>
            </div>
            <span className="dash-welcome-date">{formatToday()}</span>
          </div>

          {/* Balances — desktop grid */}
          <div className="dash-balance-grid">{renderBalanceCards()}</div>

          {/* Balances — mobile carousel (like the reference) */}
          <div className="dash-balance-scroller">{renderBalanceCards()}</div>

          {/* Quick actions */}
          <div className="dash-section-title">
            <h2>Quick Actions</h2>
            <a className="dash-section-link" href="/">
              Back to site
            </a>
          </div>
          <div className="dash-quick-grid">
            {QUICK_ACTIONS.map((q) => (
              <button
                key={q.key}
                className="dash-quick"
                onClick={() =>
                  q.modal === "noteligible"
                    ? showInfo(
                        "Not Eligible",
                        "Unfortunately, you’re not eligible for a loan right now. Continue your activities on our platform to enhance your credit score and try again later."
                      )
                    : q.modal === "notavailable"
                      ? showInfo(
                          "Feature Not Available",
                          "Unfortunately, this feature is not yet available on your account. Continue your activities on our platform to unlock more premium features."
                        )
                      : q.modal === "noreward"
                        ? showInfo(
                            "Rewards Not Available",
                            "Unfortunately, this feature is not yet available on your account. Continue your activities on our platform to unlock more premium features."
                          )
                        : openModal(q.key === "Add Fund" ? "deposit" : q.modal)
                }
              >
                <span className="dash-quick-ico">{QUICK_ICONS[q.tone]}</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>

          {/* Markets */}
          <div className="dash-section-title">
            <h2>Markets</h2>
            <span className="dash-section-link" style={{ cursor: "default", color: "var(--dash-muted)" }}>
              Live preview
            </span>
          </div>
          {renderMarkets()}

          {/* Referral */}
          <div className="dash-section-title">
            <h2>Referral Program</h2>
            <a className="dash-section-link" href="/user/user/register" onClick={(e) => e.preventDefault()}>
              Manage Referrals <ChevronDown size={13} />
            </a>
          </div>
          <div className="dash-card dash-card-pad">
            <div className="dash-referral-input">
              <input readOnly value={profile?.referral ?? ""} aria-label="Your referral link" />
              <button
                className={`dash-referral-copy${copied ? " copied" : ""}`}
                onClick={copyLink}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="dash-referral-row">
              <button className="dash-btn info" style={{ flex: 1 }} onClick={shareLink}>
                <Share size={14} /> Share Link
              </button>
              <p className="dash-input-note" style={{ flex: 1.4, alignSelf: "center", margin: 0 }}>
                Earn <span style={{ color: "var(--dash-lime-2)", fontWeight: 600 }}>5% commission</span> on
                every deposit made by your referrals.
              </p>
            </div>
          </div>

          {/* Documents / Reviews / Videos */}
          <div className="dash-section-title">
            <h2>Resources</h2>
          </div>
          <div className="dash-card">
            <div style={{ padding: "16px 16px 0" }}>
              <div className="dash-tabs">
                <button
                  className={`dash-tab${docsTab === "documents" ? " active" : ""}`}
                  onClick={() => setDocsTab("documents")}
                >
                  Documents
                </button>
                <button
                  className={`dash-tab${docsTab === "reviews" ? " active" : ""}`}
                  onClick={() => setDocsTab("reviews")}
                >
                  Reviews
                </button>
                <button
                  className={`dash-tab${docsTab === "videos" ? " active" : ""}`}
                  onClick={() => setDocsTab("videos")}
                >
                  Videos
                </button>
              </div>
            </div>
            <div className="dash-card-pad">
              {docsTab === "documents" && renderDocuments()}
              {docsTab === "reviews" && renderReviews()}
              {docsTab === "videos" && renderVideos()}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="dash-section-title">
            <h2>Recent Transactions</h2>
            <button className="dash-section-link" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={() => openModal("history")}>
              View All
            </button>
          </div>
          <div className="dash-card dash-card-pad">
            <div className="dash-tx-list">
              {transactions.slice(0, 5).map((t) => (
                <div className="dash-tx-item" key={t.id ?? t.title + t.date}>
                  <span className={`dash-tx-ico ${t.kind}`}>{TX_ICONS[t.kind]}</span>
                  <div className="dash-tx-meta">
                    <b>{t.title}</b>
                    <span>{t.meta}</span>
                    <span>{t.date}</span>
                  </div>
                  <div className="dash-tx-amount">
                    <b className={t.cls}>{t.amount}</b>
                    <span className="dash-tx-status">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: "center", color: "var(--dash-muted-2)", fontSize: 12, marginTop: 40 }}>
            © 2025 Qledgerpro.live — QFS Account Dashboard
          </p>
        </div>
      </div>

      {/* ------------ Modals ------------ */}
      {modal && (
        <div className="dash-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="dash-modal" role="dialog" aria-modal="true" aria-label={MODAL_TITLES[modal] ?? "Dialog"}>
            <div className="dash-modal-head">
              <h3>{MODAL_TITLES[modal] ?? "Dialog"}</h3>
              <button className="dash-modal-close" aria-label="Close dialog" onClick={closeModal}>
                <Close />
              </button>
            </div>
            {modalContent}
          </div>
        </div>
      )}

      {infoDialog && (
        <div className="dash-modal-overlay" onClick={() => setInfoDialog(null)}>
          <div className="dash-modal" role="dialog" aria-modal="true">
            <div className="dash-info-dialog">
              <div className="dash-info-ico">
                <InfoIcon size={28} />
              </div>
              <h3>{infoDialog.title}</h3>
              <p>{infoDialog.text}</p>
              <button className="dash-btn primary" onClick={() => setInfoDialog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="dash-toast" role="status">
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}