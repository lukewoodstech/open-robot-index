import { NextResponse } from "next/server";
import { autoApprovePending } from "@/lib/proposals";
import { supabaseAdmin } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Runs the auto-approval policy over pending proposals.
 * Called by Vercel Cron daily and by agents after they file proposals.
 * Auth: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const results = await autoApprovePending(supabaseAdmin());
  if (results.some((r) => r.outcome === "auto-approved")) revalidatePath("/", "layout");
  return NextResponse.json({ checked: results.length, results });
}
