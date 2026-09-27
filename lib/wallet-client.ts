"use client";

/* Thin EIP-1193 wrapper. No wagmi/ethers — the flow is one connect and one
   personal_sign, so a direct provider call keeps the bundle small. */

export type EthProvider = {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: EthProvider & { isMetaMask?: boolean };
  }
}

export const ETH_MAINNET = {
  chainId: 1,
  hexChainId: "0x1",
  name: "Ethereum Mainnet",
} as const;

export function getProvider(): EthProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function hasProvider(): boolean {
  return getProvider() !== null;
}

/** Normalises the EIP-1193 error shape into something worth showing a user. */
export function describeProviderError(err: unknown): string {
  const e = err as { code?: number; message?: string } | null;
  if (e?.code === 4001) return "Request rejected. You cancelled the signature.";
  if (e?.code === -32002) return "Another wallet request is already open.";
  if (e?.code === 4902) return "This wallet does not have Ethereum Mainnet enabled.";
  if (e?.code === -32001) return "No Ethereum wallet found. Install MetaMask to continue.";
  return e?.message || "Could not reach your wallet.";
}

export async function getChainId(): Promise<number> {
  const provider = getProvider();
  if (!provider) throw new Error("No wallet detected.");
  const raw = (await provider.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(raw, 16);
}

export async function getAccounts(): Promise<string[]> {
  const provider = getProvider();
  if (!provider) return [];
  try {
    const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

/** Prompts for access. Must be called from a user gesture or the wallet will refuse. */
export async function requestAccounts(): Promise<string[]> {
  const provider = getProvider();
  if (!provider) throw new Error("No Ethereum wallet found. Install MetaMask to continue.");
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error("No account was shared by the wallet.");
  }
  return accounts;
}

export async function switchToMainnet(): Promise<void> {
  const provider = getProvider();
  if (!provider) throw new Error("No Ethereum wallet found.");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ETH_MAINNET.hexChainId }],
    });
  } catch (err) {
    // 4902 = chain not added yet, so offer to add it.
    if ((err as { code?: number })?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ETH_MAINNET.hexChainId,
            chainName: ETH_MAINNET.name,
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://cloudflare-eth.com"],
            blockExplorerUrls: ["https://etherscan.io"],
          },
        ],
      });
      return;
    }
    throw err;
  }
}

/** personal_sign. MetaMask puts the message first, the address second. */
export async function signMessage(message: string, address: string): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error("No Ethereum wallet found.");
  return (await provider.request({
    method: "personal_sign",
    params: [message, address],
  })) as string;
}

export function shortAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function explorerAddress(address: string): string {
  return `https://etherscan.io/address/${address}`;
}
