import { handle } from "@/lib/api/helpers";
import { requireUser } from "@/lib/session";
import { getDashboardOverview } from "@/lib/services/overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => {
    const user = await requireUser();
    return getDashboardOverview(user.id);
  });
}