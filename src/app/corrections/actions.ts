"use server";

import { redirect } from "next/navigation";
import { EDITABLE_ROBOT_FIELDS } from "@/lib/proposals";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function submitCorrection(form: FormData) {
  // Honeypot: real users never fill this.
  if (String(form.get("website") ?? "")) redirect("/corrections?sent=1");

  const robot = String(form.get("robot") ?? "").trim();
  const field = String(form.get("field") ?? "").trim();
  const after = String(form.get("after") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);

  const fail = (msg: string) => redirect(`/corrections?robot=${encodeURIComponent(robot)}&error=${encodeURIComponent(msg)}`);
  if (!robot) fail("Pick a robot.");
  if (!after) fail("Say what the correct value is.");
  if (!/^https?:\/\/\S+$/.test(url)) fail("A source URL is required so we can verify it.");

  const db = supabaseAdmin();
  const { data: r } = await db.from("robots").select("id, name").eq("slug", robot).maybeSingle();
  if (!r) fail("Unknown robot.");

  const isTier = field === "price";
  const payload = isTier
    ? {
        robot_slug: robot,
        tier_name: String(form.get("tier") ?? "").trim() || "(unspecified)",
        after: { price_note: `Reader-reported: ${after}` },
        sources: [{ url, title: "Reader-submitted source", field: "price" }],
      }
    : {
        robot_slug: robot,
        field: (EDITABLE_ROBOT_FIELDS as readonly string[]).includes(field) ? field : "confidence_note",
        after,
        note,
        sources: [{ url, title: "Reader-submitted source", field }],
      };

  const { error } = await db.from("proposals").insert({
    kind: isTier ? "tier_update" : "field_update",
    target_table: "robots",
    target_id: r!.id,
    payload,
    summary: `Reader correction on ${r!.name}: ${isTier ? "price" : field}`,
    agent_notes: note || null,
    agent: "corrections-form",
  });
  if (error) fail("Could not save. Try again in a minute.");
  redirect("/corrections?sent=1");
}
