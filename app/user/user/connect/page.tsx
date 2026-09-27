import "@/styles/dashboard.css";
import "@/styles/wallet.css";
import ConnectWallet from "./ConnectWallet";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export const metadata = {
  title: "Connect Wallet | QFS",
};

export const dynamic = "force-dynamic";

export default async function ConnectWalletPage() {
  const user = await getSessionUser();
  if (!user) redirect("/user/user/login");

  return (
    <div className="qfs-dash" data-theme="dark">
      <ConnectWallet />
    </div>
  );
}
