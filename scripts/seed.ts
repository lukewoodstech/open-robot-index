/**
 * Seed Supabase from src/data/seed.ts.
 *
 *   npm run seed
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Upserts companies and robots by slug, replaces each robot's tiers and
 * sources, and stamps last_checked. Safe to re-run.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { COMPANIES, DATA, LAST_CHECKED } from "../src/data/seed";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

function fail(step: string, error: { message: string } | null): never {
  console.error(`✗ ${step}: ${error?.message ?? "unknown error"}`);
  process.exit(1);
}

async function main() {
  // Companies -------------------------------------------------------------
  const { data: companies, error: cErr } = await db
    .from("companies")
    .upsert(
      COMPANIES.map((c) => ({
        slug: c.slug,
        name: c.name,
        country: c.country,
        website: c.website,
        description: c.description,
      })),
      { onConflict: "slug" },
    )
    .select("id, slug");
  if (cErr) fail("companies", cErr);
  const companyId = new Map(companies!.map((c) => [c.slug, c.id]));
  console.log(`✓ ${companies!.length} companies`);

  // Robots ----------------------------------------------------------------
  let tiersWritten = 0;
  let sourcesWritten = 0;
  for (const r of DATA) {
    const cid = companyId.get(r.company);
    if (!cid) fail(r.slug, { message: `unknown company ${r.company}` });

    const { data: robot, error: rErr } = await db
      .from("robots")
      .upsert(
        {
          slug: r.slug,
          name: r.name,
          company_id: cid,
          form: r.form,
          summary: r.notes,
          sdk_access: r.sdk,
          sdk_note: r.sdkNote,
          languages: r.languages,
          access_level: r.accessLevel ?? null,
          open_hardware: r.openHardware,
          open_hardware_note: r.openHardwareNote ?? null,
          lerobot_support: r.lerobot,
          sim_support: r.sim ?? null,
          availability: r.availability,
          confidence: r.conf,
          confidence_note: r.confNote ?? null,
          dof: r.dof ?? null,
          payload_kg: r.payloadKg ?? null,
          height_cm: r.heightCm ?? null,
          weight_kg: r.weightKg ?? null,
          last_checked: LAST_CHECKED,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (rErr) fail(`robot ${r.slug}`, rErr);
    const rid = robot!.id as string;

    // Sources: replace this robot's links, insert fresh rows.
    const { data: oldLinks } = await db.from("robot_sources").select("source_id").eq("robot_id", rid);
    if (oldLinks && oldLinks.length) {
      await db.from("robot_sources").delete().eq("robot_id", rid);
      await db.from("sources").delete().in("id", oldLinks.map((l) => l.source_id));
    }
    const allSources = [r.src, ...(r.extraSources ?? [])];
    const { data: sources, error: sErr } = await db
      .from("sources")
      .insert(
        allSources.map((s) => ({
          url: s.url,
          title: s.title,
          publisher: s.publisher,
          retrieved_at: LAST_CHECKED,
          quote: s.quote ?? null,
        })),
      )
      .select("id");
    if (sErr) fail(`sources ${r.slug}`, sErr);
    const { error: lErr } = await db.from("robot_sources").insert(
      sources!.map((s, i) => ({ robot_id: rid, source_id: s.id, field: allSources[i].field ?? null })),
    );
    if (lErr) fail(`robot_sources ${r.slug}`, lErr);
    sourcesWritten += sources!.length;

    // Tiers: replace.
    await db.from("robot_tiers").delete().eq("robot_id", rid);
    const { error: tErr } = await db.from("robot_tiers").insert(
      r.tiers.map((t, i) => ({
        robot_id: rid,
        tier_name: t.name,
        price_usd: t.price,
        price_note: t.note ?? (i === 0 ? r.priceNote : null),
        currency_note: t.currencyNote ?? null,
        includes_sdk: t.includesSdk,
        compute: t.compute ?? null,
        source_id: sources![0].id,
        checked_at: LAST_CHECKED,
        sort_order: i,
      })),
    );
    if (tErr) fail(`tiers ${r.slug}`, tErr);
    tiersWritten += r.tiers.length;
    console.log(`✓ ${r.name}`);
  }
  console.log(`\nDone: ${DATA.length} robots, ${tiersWritten} tiers, ${sourcesWritten} sources. last_checked = ${LAST_CHECKED}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
