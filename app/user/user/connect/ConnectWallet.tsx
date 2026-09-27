"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ETH_MAINNET,
  describeProviderError,
  explorerAddress,
  getAccounts,
  getChainId,
  getProvider,
  hasProvider,
  requestAccounts,
  shortAddress,
  signMessage,
  switchToMainnet,
} from "@/lib/wallet-client";

type Wallet = { address: string; chainId: number; label: string; lastUsedAt: string };

type Status =
  | { kind: "idle" }
  | { kind: "working"; step: string }
  | { kind: "error"; message: string }
  | { kind: "done"; message: string };

export default function ConnectWalletPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [liveAccount, setLiveAccount] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (json?.ok) setWallets(json.data.wallets as Wallet[]);
    } catch {
      /* leave the list as-is; the connect button reports its own errors */
    }
  }, []);

  useEffect(() => {
    setInstalled(hasProvider());
    void load();

    const provider = getProvider();
    if (!provider?.on) return;

    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setLiveAccount(accounts?.[0] ?? null);
    };
    const onChain = (...args: unknown[]) => {
      const raw = args[0] as string;
      setChainId(Number.parseInt(raw, 16));
    };
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);

    void getChainId()
      .then(setChainId)
      .catch(() => setChainId(null));
    void getAccounts().then((a) => setLiveAccount(a[0] ?? null));

    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [load]);

  const onWrongNetwork = chainId !== null && chainId !== ETH_MAINNET.chainId;

  const connect = async () => {
    setStatus({ kind: "working", step: "Opening your wallet…" });
    try {
      const [account] = await requestAccounts();
      setLiveAccount(account);

      let chain = await getChainId();
      if (chain !== ETH_MAINNET.chainId) {
        setStatus({ kind: "working", step: `Switching to ${ETH_MAINNET.name}…` });
        await switchToMainnet();
        chain = await getChainId();
      }
      setChainId(chain);

      setStatus({ kind: "working", step: "Preparing signature…" });
      const challenge = await postJson<{ nonce: string; message: string }>("/api/wallet/challenge", {
        address: account,
      });

      setStatus({ kind: "working", step: "Confirm the signature in your wallet…" });
      const signature = await signMessage(challenge.message, account);

      setStatus({ kind: "working", step: "Verifying…" });
      const res = await postJson<{ alreadyConnected: boolean }>("/api/wallet/verify", {
        address: account,
        signature,
        nonce: challenge.nonce,
        chainId,
      });

      await load();
      setStatus({
        kind: "done",
        message: res.alreadyConnected
          ? "Wallet reconnected."
          : "Wallet connected and verified.",
      });
    } catch (err) {
      setStatus({ kind: "error", message: describeProviderError(err) });
    }
  };

  const disconnect = async (address: string) => {
    setStatus({ kind: "working", step: "Disconnecting…" });
    try {
      await postJson("/api/wallet", { address });
      await load();
      setStatus({ kind: "done", message: "Wallet disconnected." });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    }
  };

  const working = status.kind === "working";

  return (
    <div className="wrap">
      <div className="wc-head">
        <h1>Connect Wallet</h1>
        <p>
          Link an Ethereum address to use it for deposits and withdrawals. Connecting
          only proves you control the address — it never moves money on its own.
        </p>
      </div>

      {installed === false && (
        <div className="wc-note">
          <strong>No Ethereum wallet detected.</strong> Install MetaMask (or another
          EIP-1193 wallet) in this browser, then reload this page.
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer noopener">
            Get MetaMask
          </a>
        </div>
      )}

      {onWrongNetwork && (
        <div className="wc-note wc-note-warn">
          Your wallet is on chain {chainId}. Switch to {ETH_MAINNET.name} to connect.
          <button
            type="button"
            className="wc-btn wc-btn-ghost"
            onClick={async () => {
              try {
                await switchToMainnet();
                setChainId(await getChainId());
                setStatus({ kind: "idle" });
              } catch (err) {
                setStatus({ kind: "error", message: describeProviderError(err) });
              }
            }}
          >
            Switch network
          </button>
        </div>
      )}

      <div className="wc-card">
        <button
          type="button"
          className="wc-btn wc-btn-primary"
          onClick={connect}
          disabled={working || installed === false || onWrongNetwork}
        >
          {wallets.length > 0 ? "Connect another wallet" : "Connect wallet"}
        </button>

        {status.kind === "working" && (
          <p className="wc-status" role="status">
            {status.step}
          </p>
        )}
        {status.kind === "error" && (
          <p className="wc-status wc-status-error" role="alert">
            {status.message}
          </p>
        )}
        {status.kind === "done" && (
          <p className="wc-status wc-status-ok" role="status">
            {status.message}
          </p>
        )}
      </div>

      <section className="wc-list">
        <h2>Your wallets</h2>
        {wallets.length === 0 ? (
          <p className="wc-empty">No wallets connected yet.</p>
        ) : (
          <ul>
            {wallets.map((w) => (
              <li key={w.address} className="wc-item">
                <div>
                  <a
                    className="wc-addr"
                    href={explorerAddress(w.address)}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={w.address}
                  >
                    {shortAddress(w.address)}
                  </a>
                  <span className="wc-meta">
                    {w.chainId === ETH_MAINNET.chainId ? ETH_MAINNET.name : `Chain ${w.chainId}`}
                    {liveAccount && liveAccount.toLowerCase() === w.address.toLowerCase()
                      ? " · active in this browser"
                      : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="wc-btn wc-btn-ghost"
                  onClick={() => disconnect(w.address)}
                  disabled={working}
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="wc-foot">
        Withdrawals are still reviewed by an administrator before funds are released.
      </p>
    </div>
  );
}

async function postJson<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error?.message ?? "Request failed. Please try again.");
  }
  return json.data as T;
}
