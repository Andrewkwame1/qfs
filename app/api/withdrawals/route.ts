import { NextRequest } from "next/server";
import { handle, parseJson, assertSameOrigin } from "@/lib/api/helpers";
import { requireUser } from "@/lib/session";
import { withdrawSchema } from "@/lib/validators";
import { dollarsToCents } from "@/lib/money";
import { createWithdrawal } from "@/lib/services/account";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export function POST(req: NextRequest) {
  return handle(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const body = await parseJson(req);

    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid withdrawal data");
    }

    const result = await createWithdrawal(user.id, {
      amountCents: dollarsToCents(parsed.data.amount),
      method: parsed.data.method,
      details: parsed.data.details,
      reference: parsed.data.reference,
      walletAddress: parsed.data.walletAddress,
    });

    return {
      request: result.request,
      created: result.created,
      status: result.request.status,
    };
  });
}