import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const KINDS = new Set(["new_robot", "field_update", "tier_update", "news_item"]);

/**
 * Agents file proposals here. This endpoint can write to the proposals table and
 * nothing else, which is the brief's guarantee that agents never publish directly.
 * Auth: Authorization: Bearer <CRON_SECRET>.
 * Body: { kind, summary, payload, agent_notes?, agent? } or an array of those.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const items = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
  const rows = [];
  for (const it of items) {
    if (!KINDS.has(String(it.kind))) return NextResponse.json({ error: `bad kind ${it.kind}` }, { status: 400 });
    if (!it.payload || typeof it.payload !== "object") return NextResponse.json({ error: "payload required" }, { status: 400 });
    if (!it.summary) return NextResponse.json({ error: "summary required" }, { status: 400 });
    rows.push({
      kind: it.kind,
      summary: String(it.summary).slice(0, 200),
      payload: it.payload,
      agent_notes: it.agent_notes ? String(it.agent_notes).slice(0, 2000) : null,
      agent: it.agent ? String(it.agent).slice(0, 60) : null,
      target_table: it.kind === "news_item" ? "news_items" : "robots",
    });
  }
  const { data, error } = await supabaseAdmin().from("proposals").insert(rows).select("id, kind, summary");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ filed: data.length, proposals: data }, { status: 201 });
}
