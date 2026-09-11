import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Confidence, LerobotSupport, OpenHardware, RobotForm, SdkAccess } from "@/lib/types";

export type ProposalKind = "new_robot" | "field_update" | "tier_update" | "news_item";
export type ProposalStatus = "pending" | "approved" | "rejected";

export interface ProposalSource {
  url: string;
  title?: string;
  publisher?: string;
  /** Under 15 words. */
  quote?: string;
  field?: string;
  /** True only if the agent actually fetched this page and read the value on it. */
  page_fetched?: boolean;
}

/** A price, note or availability change on one tier of an existing robot. */
export interface TierUpdatePayload {
  robot_slug: string;
  tier_name: string;
  /** Set when the tier does not exist yet (new SKU). */
  new_tier?: boolean;
  before?: { price_usd?: number | null; price_note?: string | null; availability?: string | null };
  after: {
    price_usd?: number | null;
    price_note?: string | null;
    currency_note?: string | null;
    includes_sdk?: boolean;
    compute?: string | null;
    availability?: string | null;
  };
  sources: ProposalSource[];
}

export const EDITABLE_ROBOT_FIELDS = [
  "summary", "sdk_access", "sdk_note", "languages", "access_level", "open_hardware",
  "open_hardware_note", "lerobot_support", "sim_support", "availability", "confidence",
  "confidence_note", "dof", "payload_kg", "height_cm", "weight_kg",
] as const;
export type EditableRobotField = (typeof EDITABLE_ROBOT_FIELDS)[number];

export interface FieldUpdatePayload {
  robot_slug: string;
  field: EditableRobotField;
  before?: unknown;
  after: unknown;
  note?: string;
  sources: ProposalSource[];
}

export interface NewRobotPayload {
  company: { slug: string; name: string; country?: string | null; website?: string | null; description?: string | null };
  robot: {
    slug: string; name: string; form: RobotForm; summary: string; sdk_access: SdkAccess; sdk_note: string;
    languages: string[]; access_level?: string | null; open_hardware: OpenHardware; open_hardware_note?: string | null;
    lerobot_support: LerobotSupport; sim_support?: string | null; availability?: string | null;
    confidence: Confidence; confidence_note?: string | null; dof?: number | null; payload_kg?: number | null;
    height_cm?: number | null; weight_kg?: number | null;
  };
  tiers: { tier_name: string; price_usd: number | null; price_note?: string | null; currency_note?: string | null; includes_sdk: boolean; compute?: string | null }[];
  sources: ProposalSource[];
}

export interface NewsItemPayload {
  title: string;
  summary: string;
  url: string;
  publisher?: string;
  published_at?: string;
  category: "price_change" | "new_sku" | "sdk_change" | "availability" | "new_open_source" | "funding" | "other";
  robot_slugs?: string[];
  company_slugs?: string[];
}

export interface Proposal {
  id: string;
  kind: ProposalKind;
  target_table: string | null;
  target_id: string | null;
  payload: TierUpdatePayload | FieldUpdatePayload | NewRobotPayload | NewsItemPayload;
  evidence: string[];
  agent_notes: string | null;
  summary: string | null;
  agent: string | null;
  status: ProposalStatus;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function quoteOk(q?: string) {
  return !q || q.trim().split(/\s+/).length <= 15;
}

async function insertSources(db: SupabaseClient, robotId: string | null, sources: ProposalSource[]): Promise<string[]> {
  if (!sources?.length) return [];
  const { data, error } = await db
    .from("sources")
    .insert(sources.map((s) => ({
      url: s.url,
      title: s.title ?? null,
      publisher: s.publisher ?? null,
      retrieved_at: today(),
      quote: quoteOk(s.quote) ? s.quote ?? null : null,
    })))
    .select("id");
  if (error) throw new Error(`sources: ${error.message}`);
  const ids = data.map((d) => d.id as string);
  if (robotId) {
    const { error: lErr } = await db.from("robot_sources").insert(
      ids.map((id, i) => ({ robot_id: robotId, source_id: id, field: sources[i].field ?? null })),
    );
    if (lErr) throw new Error(`robot_sources: ${lErr.message}`);
  }
  return ids;
}

async function robotBySlug(db: SupabaseClient, slug: string) {
  const { data, error } = await db
    .from("robots")
    .select("id, slug, name, company_id, companies(website)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Unknown robot ${slug}`);
  return data as unknown as { id: string; slug: string; name: string; company_id: string; companies: { website: string | null } | null };
}

/** Apply an approved proposal. Throws on any failure; callers mark status only after success. */
export async function applyProposal(db: SupabaseClient, p: Proposal): Promise<void> {
  switch (p.kind) {
    case "tier_update": {
      const pl = p.payload as TierUpdatePayload;
      const robot = await robotBySlug(db, pl.robot_slug);
      const srcIds = await insertSources(db, robot.id, pl.sources);
      const patch: Record<string, unknown> = { checked_at: today(), source_id: srcIds[0] ?? null };
      for (const k of ["price_usd", "price_note", "currency_note", "includes_sdk", "compute"] as const) {
        if (k in pl.after) patch[k] = pl.after[k];
      }
      const { data: existing } = await db.from("robot_tiers").select("id").eq("robot_id", robot.id).eq("tier_name", pl.tier_name).maybeSingle();
      if (existing) {
        const { error } = await db.from("robot_tiers").update(patch).eq("id", existing.id);
        if (error) throw new Error(`robot_tiers: ${error.message}`);
      } else if (pl.new_tier) {
        const { count } = await db.from("robot_tiers").select("id", { count: "exact", head: true }).eq("robot_id", robot.id);
        const { error } = await db.from("robot_tiers").insert({ robot_id: robot.id, tier_name: pl.tier_name, includes_sdk: false, sort_order: count ?? 0, ...patch });
        if (error) throw new Error(`robot_tiers insert: ${error.message}`);
      } else {
        throw new Error(`Tier "${pl.tier_name}" not found on ${pl.robot_slug} and new_tier is not set`);
      }
      const robotPatch: Record<string, unknown> = { last_checked: today() };
      if (pl.after.availability != null) robotPatch.availability = pl.after.availability;
      const { error: rErr } = await db.from("robots").update(robotPatch).eq("id", robot.id);
      if (rErr) throw new Error(`robots: ${rErr.message}`);
      return;
    }
    case "field_update": {
      const pl = p.payload as FieldUpdatePayload;
      if (!EDITABLE_ROBOT_FIELDS.includes(pl.field)) throw new Error(`Field ${pl.field} is not editable`);
      const robot = await robotBySlug(db, pl.robot_slug);
      await insertSources(db, robot.id, pl.sources);
      const { error } = await db.from("robots").update({ [pl.field]: pl.after, last_checked: today() }).eq("id", robot.id);
      if (error) throw new Error(`robots: ${error.message}`);
      return;
    }
    case "new_robot": {
      const pl = p.payload as NewRobotPayload;
      const { data: company, error: cErr } = await db
        .from("companies")
        .upsert({ slug: pl.company.slug, name: pl.company.name, country: pl.company.country ?? null, website: pl.company.website ?? null, description: pl.company.description ?? null }, { onConflict: "slug" })
        .select("id")
        .single();
      if (cErr) throw new Error(`companies: ${cErr.message}`);
      const { data: robot, error: rErr } = await db
        .from("robots")
        .upsert({ ...pl.robot, company_id: company.id, last_checked: today() }, { onConflict: "slug" })
        .select("id")
        .single();
      if (rErr) throw new Error(`robots: ${rErr.message}`);
      const srcIds = await insertSources(db, robot.id, pl.sources);
      const { error: tErr } = await db.from("robot_tiers").upsert(
        pl.tiers.map((t, i) => ({ robot_id: robot.id, ...t, source_id: srcIds[0] ?? null, checked_at: today(), sort_order: i })),
        { onConflict: "robot_id,tier_name" },
      );
      if (tErr) throw new Error(`robot_tiers: ${tErr.message}`);
      return;
    }
    case "news_item": {
      const pl = p.payload as NewsItemPayload;
      const robotIds = pl.robot_slugs?.length
        ? ((await db.from("robots").select("id").in("slug", pl.robot_slugs)).data ?? []).map((r) => r.id)
        : [];
      const companyIds = pl.company_slugs?.length
        ? ((await db.from("companies").select("id").in("slug", pl.company_slugs)).data ?? []).map((r) => r.id)
        : [];
      const { error } = await db.from("news_items").insert({
        title: pl.title,
        summary: pl.summary,
        url: pl.url,
        publisher: pl.publisher ?? null,
        published_at: pl.published_at ?? today(),
        category: pl.category,
        robot_ids: robotIds,
        company_ids: companyIds,
        status: "approved",
      });
      if (error) throw new Error(`news_items: ${error.message}`);
      return;
    }
  }
}

/**
 * Auto-approval policy. Only sourced price or availability changes on existing
 * robots qualify, and only when the source is the manufacturer's own domain or a
 * domain already cited for that robot. Everything else waits for a human.
 */
export async function autoApprovable(db: SupabaseClient, p: Proposal): Promise<{ ok: boolean; reason: string }> {
  if (p.kind === "tier_update" || (p.kind === "field_update" && (p.payload as FieldUpdatePayload).field === "availability")) {
    const pl = p.payload as TierUpdatePayload | FieldUpdatePayload;
    if (!pl.sources?.length) return { ok: false, reason: "no source" };
    const robot = await robotBySlug(db, pl.robot_slug);
    const { data: cited } = await db.from("robot_sources").select("sources(domain)").eq("robot_id", robot.id);
    const trusted = new Set<string>();
    if (robot.companies?.website) trusted.add(host(robot.companies.website));
    for (const row of cited ?? []) {
      const d = (row as unknown as { sources: { domain: string | null } | null }).sources?.domain;
      if (d) trusted.add(d);
    }
    const src = pl.sources[0];
    const srcHost = host(src.url);
    if (!trusted.has(srcHost)) return { ok: false, reason: `source ${srcHost} is not a trusted domain for ${robot.slug}` };
    if (!src.page_fetched || !src.quote?.trim()) {
      return { ok: false, reason: "source page was not fetched with a verbatim quote; needs a human" };
    }
    if (p.kind === "tier_update") {
      const t = pl as TierUpdatePayload;
      if (t.new_tier) return { ok: false, reason: "new SKU needs a human" };
      const b = t.before?.price_usd, a = t.after.price_usd;
      if (typeof b === "number" && typeof a === "number" && (a > b * 1.5 || a < b * 0.5)) {
        return { ok: false, reason: "price moved more than 50%" };
      }
    }
    return { ok: true, reason: "sourced price or availability change on a trusted domain" };
  }
  return { ok: false, reason: `${p.kind} always needs a human` };
}

/** Approve and apply. Marks approved only after apply succeeds. */
export async function approveProposal(db: SupabaseClient, id: string, reviewedBy: string, note?: string) {
  const { data, error } = await db.from("proposals").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  const p = data as Proposal;
  if (p.status !== "pending") throw new Error("Proposal is not pending");
  await applyProposal(db, p);
  const { error: uErr } = await db
    .from("proposals")
    .update({ status: "approved", reviewed_by: reviewedBy, review_note: note ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (uErr) throw new Error(uErr.message);
}

export async function rejectProposal(db: SupabaseClient, id: string, reviewedBy: string, note?: string) {
  const { error } = await db
    .from("proposals")
    .update({ status: "rejected", reviewed_by: reviewedBy, review_note: note ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
}

/** Run the auto-approval policy over every pending proposal. Returns what happened. */
export async function autoApprovePending(db: SupabaseClient) {
  const { data, error } = await db.from("proposals").select("*").eq("status", "pending").order("created_at");
  if (error) throw new Error(error.message);
  const results: { id: string; summary: string | null; outcome: string }[] = [];
  for (const row of (data ?? []) as Proposal[]) {
    try {
      const verdict = await autoApprovable(db, row);
      if (!verdict.ok) {
        results.push({ id: row.id, summary: row.summary, outcome: `held: ${verdict.reason}` });
        continue;
      }
      await approveProposal(db, row.id, "auto", verdict.reason);
      results.push({ id: row.id, summary: row.summary, outcome: "auto-approved" });
    } catch (e) {
      results.push({ id: row.id, summary: row.summary, outcome: `error: ${(e as Error).message}` });
    }
  }
  return results;
}
