# Open Robot Index: Claude Code project brief

Build in phases in order. Do not start Phase 3 until Phase 1 is deployed.

## What this is

A directory of robots real people can buy (roughly under $25K) scored on whether you can actually program them: SDK access tier, language, price by tier, open hardware, LeRobot support, sim support, availability. Plus a weekly "what changed for buyers" news feed. Audience: developers, students, and small teams choosing hardware. The site's one job: answer "can I write code for this, and what does that tier cost" faster and more honestly than any reseller.

## Non-negotiables

- Every fact has a source URL and a last-checked date, shown on the page.
- Every robot has a confidence mark (High / Medium / Verify) and Verify rows say what's contested.
- AI agents never publish directly. They write proposals to a review queue; a human approves in one tap.
- SDK access is a three-state field (full / gated / none) with a required note explaining which tier unlocks it. No numeric "openness score."
- Images come from manufacturer press kits, official product pages, or open-source project repos, stored with the source URL and attribution. No hotlinking random images, no scraped reseller photos.

## Stack

- Next.js 15 (App Router, TypeScript), Tailwind
- Supabase (Postgres) for robots, companies, sources, news items, proposals, images
- Vercel hosting; Vercel Cron triggers the agent jobs
- Anthropic API (Claude) for the agents, with web search tool enabled
- Auth: Supabase auth, single admin user for the review queue

## Data model (Supabase)

companies: id, name, slug, country, website, description, logo_url, logo_source
robots: id, slug, name, company_id, form (arm | bimanual | desktop | mobile_base | mobile_manipulator | quadruped | humanoid), summary, sdk_access (full | gated | none), sdk_note (required), languages[], access_level (text), open_hardware (yes | partial | no), open_hardware_note, lerobot_support (native | supported | compatible | community | none), sim_support (text), availability (text), confidence (high | medium | verify), confidence_note, dof, payload_kg, height_cm, weight_kg, hero_image_id, last_checked
robot_tiers: id, robot_id, tier_name, price_usd, price_note, currency_note, includes_sdk (bool), compute, source_id, checked_at
sources: id, url, title, publisher, retrieved_at, quote (short excerpt under 15 words)
images: id, robot_id, url, storage_path, source_url, attribution, kind (hero | gallery | logo)
news_items: id, title, summary (2 to 3 sentences, own words), url, publisher, published_at, category (price_change | new_sku | sdk_change | availability | new_open_source | funding | other), robot_ids[], company_ids[], status (draft | approved | rejected)
proposals: id, kind (new_robot | field_update | tier_update | news_item), target_table, target_id, payload (jsonb diff), evidence (source_id[]), agent_notes, status (pending | approved | rejected), created_at, reviewed_at

## Pages

/ : the table. Filters on one line (SDK tier chips, form, price ceiling, LeRobot toggle). Sortable columns. Row expands inline. This is the hero; no marketing hero above it, just a headline and one sentence.
/robots/[slug] : one robot. Hero image, one-paragraph summary, the SDK verdict in a prominent block (tier, note, what you get), tier price table, spec strip (DoF, payload, height, weight), open hardware and LeRobot and sim facts, availability, gallery, sources list with dates, "report a correction" link, related news items.
/companies/[slug] : company page listing its robots and news.
/news : the buyer-changes feed. Filter by category. Each item links to its robot and the original source.
/compare?a=&b= : two or three robots side by side, same fields.
/about : how scoring works, the three SDK states defined, how agents and review work, how to submit a correction.
/admin/review : the proposal queue. Each proposal shows the diff, the evidence links, agent notes, and Approve / Reject. Approving writes the change and stamps last_checked.

## Design direction

"Sexy, high tech, easy to digest" means precision, not neon. Avoid the two defaults: warm cream with a serif and terracotta, and near-black with one acid accent.

- Base: cool dark graphite (#0F1216) with a lighter panel tone (#171B21) and high-contrast off-white text (#EDEFF2). Muted secondary (#8B93A1). One accent for interaction (#5B8DEF). The only other colors on the site are the three SDK states: full (#3DD68C), gated (#F2B84B), none (#F26B6B). Color means something or it isn't there.
- Type: one family with tabular numerals (Geist). Big, tight headlines; small, calm data. No all-caps labels, no mono for data.
- Layout: dense but breathable table on the index, generous product page with a large hero image left and the SDK verdict block right, above the fold. Left-aligned throughout.
- Motion: one moment only. Row expand and the review approve action animate; nothing else moves on its own. Respect prefers-reduced-motion.
- Empty and error states tell the user what to do ("No robots match. Clear the price filter or switch SDK to All.").
- Responsive down to 380px: table collapses to cards with name, price, SDK badge, confidence.

## Agent pipeline (Phase 3)

Three jobs on Vercel Cron, each a Claude call with web search, each writing only to proposals:

1. Price and tier watcher (weekly): for each robot, search the manufacturer store and two known resellers, compare against robot_tiers, propose tier_update with source URLs when a price or SKU differs. Never overwrite; propose.
2. Buyer-news scout (twice weekly): search for price cuts, new SKUs, SDK releases, stock changes, and new open-source rigs under $25K. Propose news_item with a 2 to 3 sentence summary in its own words, a category, linked robot_ids, and the source URL. Skip funding news unless it changes a product.
3. New robot scout (monthly): search for newly announced robots under $25K with developer access. Propose new_robot with all fields it can source and confidence = verify.

Rules baked into every agent prompt: cite a URL for every field; write summaries in own words, no quotes over 15 words; if two sources disagree, propose both and flag it; never invent a price for quote-only robots.

## Review queue UX

Cards, newest first. Each card: what would change (before / after), why (agent notes), evidence (links, opened in a new tab). Two buttons. Keyboard: J/K to move, A approve, R reject. Approving a tier_update also updates last_checked on the robot.

## Build phases

Phase 1 (deploy this first): Supabase schema, seed script from the seed data (22 robots), index table page, robot pages, about page, Vercel deploy. No agents, no news.
Phase 2: company pages, compare page, images with attribution, corrections form (writes a proposal), admin review queue.
Phase 3: the three cron agents writing to proposals. Then /news reads approved news_items.
Phase 4: SEO (per-robot metadata, OG images from the hero + SDK badge), sitemap, weekly digest email from approved news.

## Seed data

`src/data/seed.ts` holds the DATA array (same shape as the original open-robot-index.html). Map sdk → sdk_access, priceNote → the first robot_tiers row, src → a sources row, conf → confidence, notes → summary. All rows last_checked 2026-09-03.

## Things deliberately not built

General robotics news, funding tracker, investor directory, user accounts, comments, ratings, affiliate links (for now), any robot over $25K, any agent that can write to public tables.

## Repo conventions

- `supabase/migrations/*.sql` is the schema. Apply with the Supabase SQL editor or `supabase db push`.
- `npm run seed` runs `scripts/seed.ts` against `SUPABASE_SERVICE_ROLE_KEY`. It upserts by slug and is safe to re-run.
- `src/lib/data.ts` is the only place pages read data from. It reads Supabase when `NEXT_PUBLIC_SUPABASE_URL` is set and falls back to `src/data/seed.ts` otherwise, so the site runs locally with no backend.
- Public reads use the anon key with RLS `select` policies. Nothing on the public site ever writes.
