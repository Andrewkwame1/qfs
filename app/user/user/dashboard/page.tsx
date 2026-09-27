import "@/styles/dashboard.css";
import DashboardApp from "@/components/dashboard/DashboardApp";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getDashboardOverview } from "@/lib/services/overview";

export const metadata = {
  title: "Dashboard | QFS",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/user/user/login");

  const overview = await getDashboardOverview(user.id);
  return <DashboardApp overview={overview} />;
}