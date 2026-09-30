# Roadmap

The builder routine works this list top to bottom. One item per run. Each item has
acceptance criteria; the routine ships it as a pull request that must pass CI.
When it finishes an item it moves the line to **Done** with the PR number.
When the list runs low it audits the site against CLAUDE.md and appends new items.

Rules for every item: keep the design direction in CLAUDE.md, never add color that
does not mean something, never add a robot over $25K, never let an agent write to a
public table, keep every fact sourced and dated.

## Next

1. **Upgrade Verify rows.** For each robot with `confidence = verify`, re-check the
   official page and file a `field_update` proposal (via `POST /api/proposals`) with a
   fresh source that upgrades confidence, or a `confidence_note` update saying exactly
   what is still contested. Acceptance: proposals filed for every Verify row, with URLs.
   > **Blocked for the builder routine (2026-09-30).** The three Verify rows are HopeJR,
   > TurtleBot 4 and Waveshare RoArm-M3. The cloud sandbox's egress proxy refuses
   > `clearpathrobotics.com`, `turtlebot.com`, `waveshare.com` and `huggingface.co`, so no
   > official page can be fetched first-hand. Web search only re-surfaces the same May 2025
   > HopeJR announcement already cited. Filing proposals anyway would cite pages nobody
   > read, and `autoApprovable` in `src/lib/proposals.ts` holds unfetched sources for a
   > human by design. Needs a human: either allowlist those domains for the routine, or
   > do this check by hand.
2. **Compare picker on the index.** A checkbox on each row (max 3) and a sticky
   "Compare (n)" bar that links to `/compare?a=&b=&c=`. Acceptance: works with
   keyboard; state survives filter changes.
3. **Gallery images.** For robots with only a hero, add one or two gallery images from
   the same manufacturer page or repo, stored under `public/robots/<slug>/` with source
   URL and attribution in `src/data/seed.ts`. Prefer JPEG or PNG: the OG cards are
   drawn by resvg, which cannot decode WebP, so a `.webp` hero needs a `hero.og.jpg`
   sibling. Acceptance: at least ten robots have a gallery; every image has
   attribution shown.
4. **Weekly digest page.** `/digest/[week]` summarising approved news and applied
   proposals for the week, written from the data (no LLM at render time). Acceptance:
   the current week renders; older weeks are linked.
5. **Playwright smoke tests.** Index loads with 20+ rows, a robot page shows a source
   list, compare renders two robots, corrections form validates. Runs in CI.
6. **Accessibility pass.** Focus order, contrast of muted text on panel (aim for 4.5:1),
   labels on all selects, `aria-sort` on sortable headers, skip link.
7. **Company logos.** From official press kits or the repo's own assets only, with
   `logo_source` set. Show on company pages and in the index row's company line.

## Done

- Phase 1: schema, seed, index table, robot pages, about page, Vercel + Supabase deploy.
- Phase 2: images with attribution, admin review queue, corrections form, compare,
  company pages, news feed, auto-approval of sourced price updates.
- Agents: price watcher, news scout, new-robot scout, builder (cloud routines).
- Sitemap, robots.txt and canonical URLs: `/sitemap.xml` lists all 23 robots, 22
  companies and the five public pages with real `lastmod` dates; every public page
  declares a canonical, and `/compare` collapses argument order to one URL (#4).
- Mobile pass at 380px: the wordmark no longer wraps onto three lines, every
  standalone control (SDK chips, filter selects, the LeRobot checkbox, news category
  filters, compare and correction form fields, review-queue Approve/Reject) is at
  least 40px on phones while desktop keeps its density, and the robot page's
  six-column tier table stacks into cards instead of an in-page scroller. No
  horizontal scroll on any page at 380px (#6). Inline links inside a sentence keep
  their natural size, which WCAG 2.5.8 exempts.
- Per-robot OG images: `opengraph-image` cards for all 23 robots plus a site default,
  drawn with next/og in Geist on the graphite palette (#3).
