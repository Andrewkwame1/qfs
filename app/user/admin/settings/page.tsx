"use client";

import { useCallback, useState } from "react";
import { useLive } from "@/lib/use-live";
import {
  apiGet,
  apiSend,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  Spinner,
  Toast,
} from "@/components/admin/ui";

type SettingsMap = Record<string, string>;

const KNOWN: Record<string, { label: string; hint: string }> = {
  site_name: { label: "Site name", hint: "Shown in the public header/footer." },
  support_email: { label: "Support email", hint: "Contact address used in notifications." },
  referral_rate_bps: { label: "Referral commission (bps)", hint: "Basis points paid per referred investment. 500 = 5%." },
  max_withdrawal_daily_cents: { label: "Max daily withdrawal (cents)", hint: "Cap per user per day, in cents." },
  min_withdrawal_cents: { label: "Min withdrawal (cents)", hint: "Minimum withdrawal amount, in cents." },
  min_deposit_cents: { label: "Min deposit (cents)", hint: "Minimum deposit amount, in cents." },
  platform_fee_bps: { label: "Platform fee (bps)", hint: "Fee applied to withdrawals, in basis points." },
  deposit_bank_name: { label: "Deposit: bank name", hint: "Bank the user transfers to, e.g. \"GTBank\"." },
  deposit_bank_account: { label: "Deposit: account number", hint: "Reveals the Bank Transfer deposit method once set." },
  deposit_bank_account_name: { label: "Deposit: account name", hint: "Name on the receiving account." },
  deposit_btc_address: { label: "Deposit: Bitcoin address", hint: "Company BTC wallet the user pays to." },
  deposit_eth_address: { label: "Deposit: Ethereum address", hint: "Company ETH wallet the user pays to." },
  deposit_usdt_trc20: { label: "Deposit: USDT (TRC20) address", hint: "Company USDT TRC20 address (T-prefixed)." },
  deposit_usdt_bep20: { label: "Deposit: USDT (BEP20) address", hint: "Company USDT BEP20 address (0x-prefixed)." },
};

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ key: string; value: string; isNew: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<SettingsMap>("/api/admin/settings"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useLive(load);

  const save = async () => {
    if (!editor) return;
    if (!editor.key.trim()) {
      setToast("A setting key is required");
      return;
    }
    setBusy(true);
    try {
      await apiSend("/api/admin/settings", "POST", { key: editor.key.trim(), value: editor.value });
      setToast(`Setting "${editor.key.trim()}" saved`);
      setEditor(null);
      load();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <Spinner label="Loading settings…" />;
  if (error && !data) return <ErrorBanner message={error} onRetry={load} />;

  const entries = Object.entries(data ?? {});

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Platform-wide configuration keyed by name. Values are stored as strings."
        actions={
          <button className="adm-btn primary" onClick={() => setEditor({ key: "", value: "", isNew: true })}>
            + New Setting
          </button>
        }
      />

      <div className="adm-stats-grid">
        {entries.length === 0 && (
          <div className="adm-notice" style={{ gridColumn: "1 / -1" }}>
            No settings yet — add your first key/value pair above.
          </div>
        )}
        {entries.map(([key, value]) => {
          const meta = KNOWN[key];
          return (
            <div className="adm-stat" key={key}>
              <div className="adm-stat-top">
                <span className="adm-stat-label">{meta?.label ?? key}</span>
                <button className="adm-link-btn" onClick={() => setEditor({ key, value, isNew: false })}>
                  Edit
                </button>
              </div>
              <div className="adm-stat-value" style={{ fontSize: 17, wordBreak: "break-all" }}>
                {value}
              </div>
              {meta && <div className="adm-stat-sub">{meta.hint}</div>}
            </div>
          );
        })}
      </div>

      <div className="adm-card adm-card-pad">
        <b style={{ fontSize: 14 }}>Referral rate</b>
        <p style={{ fontSize: 13, color: "var(--dash-muted)", lineHeight: 1.6, margin: "8px 0 0" }}>
          {KNOWN.referral_rate_bps.hint} Current value:{" "}
          <b style={{ color: "var(--dash-lime-2)" }}>{data?.referral_rate_bps ?? "500"}</b> bps.
        </p>
      </div>

      {editor && (
        <Modal title={editor.isNew ? "New Setting" : `Edit ${editor.key}`} onClose={() => !busy && setEditor(null)}>
          <Field label="Key">
            <input
              className="adm-input"
              value={editor.key}
              disabled={!editor.isNew}
              placeholder="referral_rate_bps"
              onChange={(e) => setEditor({ ...editor, key: e.target.value })}
            />
          </Field>
          <Field label="Value">
            <textarea
              className="adm-textarea"
              value={editor.value}
              placeholder="500"
              onChange={(e) => setEditor({ ...editor, value: e.target.value })}
            />
          </Field>
          <div className="adm-row-end">
            <button className="adm-btn ghost" onClick={() => setEditor(null)} disabled={busy}>
              Cancel
            </button>
            <button className="adm-btn primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save Setting"}
            </button>
          </div>
        </Modal>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}