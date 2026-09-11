# Roadmap

The builder routine works this list top to bottom. One item per run. Each item has
acceptance criteria; the routine ships it as a pull request that must pass CI.
When it finishes an item it moves the line to **Done** with the PR number.
When the list runs low it audits the site against CLAUDE.md and appends new items.

Rules for every item: keep the design direction in CLAUDE.md, never add color that
does not mean something, never add a robot over $25K, never let an agent write to a
public table, keep every fact sourced and dated.

## Next

1. **Per-robot OG images.** `/robots/[slug]/opengraph-image` rendering the hero, name,
   SDK badge and entry price on the graphite background. Acceptance: every robot page
   has an `og:image` that renders in a Twitter/Slack unfurl; index and news pages have a
   default one.
2. **Sitemap and per-robot metadata.** `app/sitemap.ts` covering robots, companies,
   news, compare, about. Robot pages already set title and description; add canonical
   URLs. Acceptance: `/sitemap.xml` lists every robot and company.
3. **Upgrade Verify rows.** For each robot with `confidence = verify`, re-check the
   official page and file a `field_update` proposal (via `POST /api/proposals`) with a
   fresh source that upgrades confidence, or a `confidence_note` update saying exactly
   what is still contested. Acceptance: proposals filed for every Verify row, with URLs.
4. **Mobile pass at 380px.** Check index, robot page, compare, news, admin queue at
   380px wide. Fix overflow and tap targets under 40px. Acceptance: no horizontal
   scroll on any page at 380px; screenshots in the PR.
5. **Compare picker on the index.** A checkbox on each row (max 3) and a sticky
   "Compare (n)" bar that links to `/compare?a=&b=&c=`. Acceptance: works with
   keyboard; state survives filter changes.
6. **Gallery images.** For robots with only a hero, add one or two gallery images from
   the same manufacturer page or repo, stored under `public/robots/<slug>/` with source
   URL and attribution in `src/data/seed.ts`. Acceptance: at least ten robots have a
   gallery; every image has attribution shown.
7. **Weekly digest page.** `/digest/[week]` summarising approved news and applied
   proposals for the week, written from the data (no LLM at render time). Acceptance:
   the current week renders; older weeks are linked.
8. **Playwright smoke tests.** Index loads with 20+ rows, a robot page shows a source
   list, compare renders two robots, corrections form validates. Runs in CI.
9. **Accessibility pass.** Focus order, contrast of muted text on panel (aim for 4.5:1),
   labels on all selects, `aria-sort` on sortable headers, skip link.
10. **Company logos.** From official press kits or the repo's own assets only, with
    `logo_source` set. Show on company pages and in the index row's company line.

## Done

- Phase 1: schema, seed, index table, robot pages, about page, Vercel + Supabase deploy.
- Phase 2: images with attribution, admin review queue, corrections form, compare,
  company pages, news feed, auto-approval of sourced price updates.
- Agents: price watcher, news scout, new-robot scout, builder (cloud routines).
