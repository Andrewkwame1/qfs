/* Netlify scheduled function: runs the daily earnings sweep.
 *
 * Lives outside the Next.js app because Netlify's scheduler invokes a deployed
 * function directly and cannot attach the `x-cron-secret` header that
 * POST /api/cron/accrue requires. Both call the same service, so behaviour is
 * identical either way.
 *
 * Schedule is declared in netlify.toml. */

import type { Handler } from "@netlify/functions";
import { runAccrualSweep } from "../../lib/services/accrual";

export default async (): Promise<{ statusCode: number; body: string }> => {
  try {
    const result = await runAccrualSweep();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, ...result }),
    };
  } catch (err) {
    // Surface the failure in the Netlify function log so it is not silent.
    console.error("accrual sweep failed", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "accrual sweep failed",
      }),
    };
  }
} satisfies Handler;
