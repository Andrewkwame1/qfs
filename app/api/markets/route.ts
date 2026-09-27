import { NextRequest } from "next/server";
import { handle } from "@/lib/api/helpers";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handle(async () => {
    await requireUser();
    const type = new URL(req.url).searchParams.get("type")?.toUpperCase();
    const assets = await prisma.marketAsset.findMany({
      where: { isActive: true, ...(type ? { type: type as any } : {}) },
      orderBy: [{ type: "asc" }, { sort: "asc" }],
    });
    return assets;
  });
}