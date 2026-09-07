/**
 * The only place pages read data from.
 *
 * With NEXT_PUBLIC_SUPABASE_URL set, reads Supabase. Otherwise serves the seed
 * file directly so the site runs locally with no backend. Both paths return the
 * same RobotFull shape.
 */
import { cache } from "react";
import { COMPANIES, DATA, LAST_CHECKED, type SeedRobot } from "@/data/seed";
import { supabaseConfigured, supabasePublic } from "@/lib/supabase";
import type {
  Company,
  Robot,
  RobotFull,
  RobotImage,
  RobotTier,
  Source,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Seed fallback

function seedToFull(r: SeedRobot): RobotFull {
  const c = COMPANIES.find((x) => x.slug === r.company);
  if (!c) throw new Error(`Seed robot ${r.slug} references unknown company ${r.company}`);
  const company: Company = {
    id: `company:${c.slug}`,
    name: c.name,
    slug: c.slug,
    country: c.country,
    website: c.website,
    description: c.description,
    logo_url: null,
    logo_source: null,
  };
  const allSources = [r.src, ...(r.extraSources ?? [])];
  const sources: Source[] = allSources.map((s, i) => ({
    id: `source:${r.slug}:${i}`,
    url: s.url,
    title: s.title,
    publisher: s.publisher,
    retrieved_at: LAST_CHECKED,
    quote: s.quote ?? null,
  }));
  const tiers: RobotTier[] = r.tiers.map((t, i) => ({
    id: `tier:${r.slug}:${i}`,
    robot_id: `robot:${r.slug}`,
    tier_name: t.name,
    price_usd: t.price,
    price_note: t.note ?? (i === 0 ? r.priceNote : null),
    currency_note: t.currencyNote ?? null,
    includes_sdk: t.includesSdk,
    compute: t.compute ?? null,
    source_id: sources[0]?.id ?? null,
    checked_at: LAST_CHECKED,
    sort_order: i,
  }));
  const images: RobotImage[] = (r.images ?? []).map((im, i) => ({
    id: `image:${r.slug}:${i}`,
    robot_id: `robot:${r.slug}`,
    url: `/robots/${r.slug}/${im.file}`,
    storage_path: `public/robots/${r.slug}/${im.file}`,
    source_url: im.sourceUrl,
    attribution: im.attribution,
    kind: im.kind,
  }));
  return {
    id: `robot:${r.slug}`,
    slug: r.slug,
    name: r.name,
    company_id: company.id,
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
    hero_image_id: images.find((i) => i.kind === "hero")?.id ?? null,
    last_checked: LAST_CHECKED,
    company,
    tiers,
    sources,
    images,
  };
}

// ---------------------------------------------------------------------------
// Supabase

type RobotRow = Robot & {
  companies: Company;
  robot_tiers: RobotTier[];
  images: RobotImage[];
  robot_sources: { sources: Source }[];
};

const ROBOT_SELECT =
  "*, companies(*), robot_tiers(*), images!robot_id(*), robot_sources(sources(*))";

function rowToFull(row: RobotRow): RobotFull {
  const { companies, robot_tiers, images, robot_sources, ...robot } = row;
  return {
    ...robot,
    payload_kg: robot.payload_kg == null ? null : Number(robot.payload_kg),
    height_cm: robot.height_cm == null ? null : Number(robot.height_cm),
    weight_kg: robot.weight_kg == null ? null : Number(robot.weight_kg),
    company: companies,
    tiers: [...robot_tiers]
      .map((t) => ({ ...t, price_usd: t.price_usd == null ? null : Number(t.price_usd) }))
      .sort((a, b) => a.sort_order - b.sort_order),
    images,
    sources: robot_sources.map((rs) => rs.sources),
  };
}

// ---------------------------------------------------------------------------
// Public API

export const getRobots = cache(async (): Promise<RobotFull[]> => {
  if (!supabaseConfigured()) {
    return DATA.map(seedToFull).sort((a, b) => a.name.localeCompare(b.name));
  }
  const { data, error } = await supabasePublic()
    .from("robots")
    .select(ROBOT_SELECT)
    .order("name");
  if (error) throw new Error(`Supabase robots query failed: ${error.message}`);
  return (data as unknown as RobotRow[]).map(rowToFull);
});

export const getRobot = cache(async (slug: string): Promise<RobotFull | null> => {
  if (!supabaseConfigured()) {
    const r = DATA.find((x) => x.slug === slug);
    return r ? seedToFull(r) : null;
  }
  const { data, error } = await supabasePublic()
    .from("robots")
    .select(ROBOT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Supabase robot query failed: ${error.message}`);
  return data ? rowToFull(data as unknown as RobotRow) : null;
});

export const getRobotSlugs = cache(async (): Promise<string[]> => {
  if (!supabaseConfigured()) return DATA.map((r) => r.slug);
  const { data, error } = await supabasePublic().from("robots").select("slug");
  if (error) throw new Error(`Supabase slugs query failed: ${error.message}`);
  return data.map((r) => r.slug as string);
});

export function dataSourceLabel(): "supabase" | "seed" {
  return supabaseConfigured() ? "supabase" : "seed";
}
