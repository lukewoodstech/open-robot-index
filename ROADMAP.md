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
2. **Gallery images.** For robots with only a hero, add one or two gallery images from
   the same manufacturer page or repo, stored under `public/robots/<slug>/` with source
   URL and attribution in `src/data/seed.ts`. Prefer JPEG or PNG: the OG cards are
   drawn by resvg, which cannot decode WebP, so a `.webp` hero needs a `hero.og.jpg`
   sibling. Acceptance: at least ten robots have a gallery; every image has
   attribution shown.
   > **Blocked for the builder routine (2026-10-14).** Every manufacturer domain cited in
   > the seed is refused by the sandbox's egress proxy — checked this run: seeedstudio.com,
   > robotis.us, shop.elephantrobotics.com, ufactory.cc, global.agilex.ai,
   > store.trossenrobotics.com, shop.deeprobotics.us, waveshare.com, anninrobotics.com,
   > dobot-robots.com, lite.berkeley-humanoid.org, openarm.dev, norirobotics.com,
   > mangdang.store, hello-stretch3.com, pollen-robotics.com, clearpathrobotics.com,
   > xlerobot.readthedocs.io, huggingface.co. No press kit or product page can be opened, and
   > github.com, the GitHub API and user-attachments are refused too. Only
   > raw.githubusercontent.com answers, which covers four robots with usable repo photos
   > (SO-101, Koch v1.1, LeKiwi, OpenArm) and a banner for Stretch 3 — short of the ten the
   > acceptance asks for, and no reseller photo may stand in. Needs a human: allowlist those
   > domains for the routine, or lower the bar to the repo-backed four and say so here.
3. **Company logos.** From official press kits or the repo's own assets only, with
   `logo_source` set. Show on company pages and in the index row's company line.
4. **Freshness signal.** Every robot still reads `last checked 3 Sept 2026`. Show the age
   of `last_checked` on the index and the robot page ("checked 6 weeks ago"), and mark a
   row past 60 days so a stale fact looks stale. Acceptance: the age is on both pages, it
   is computed from the data, and nothing goes stale silently.
5. **OG cards for digest weeks.** `/digest/[week]/opengraph-image` in the same Geist on
   graphite as the robot cards, naming the week and its counts. Acceptance: a week with
   content and an empty week both render a card; the site default is unchanged.
6. **Review-queue health on `/admin/review`.** A header line with the pending count, the
   age of the oldest pending proposal, and a breakdown by kind, so a backlog is visible
   on arrival. Read-only: it must not change the auto-approval policy or the queue's
   buttons. Acceptance: the counts match the table; an empty queue says so.
7. **Announce the filtered count on the index.** Clicking an SDK chip or changing a
   select rewrites the table silently: the "N of M" counter updates but nothing is
   announced, so a screen-reader user cannot tell a filter did anything. Put the
   counter in an `aria-live="polite"` region and give the "No robots match" state a
   role so it is announced too. Acceptance: a Playwright test asserts the live
   region's text changes after a chip is clicked, and that nothing is announced on
   first paint.
8. **Real focus in the review queue.** `/admin/review` moves a cursor with J/K, but
   it only repaints a border — `document.activeElement` never moves, so a keyboard
   or screen-reader user cannot tell which proposal A/R will act on. Make the
   selected card actually take focus, keep the accent border, and label it so the
   move is announced. Acceptance: J/K moves `document.activeElement` to the
   selected card, A/R still act on it, and Tab from a card reaches its own
   Approve/Reject before the next card's.
9. **Say when a compare slug is unknown.** `/compare?a=nope&b=so-101` silently drops
   the bad slug and falls through to "Pick at least two robots", which blames the
   reader for a bad link. Name the slug that did not resolve and offer the picker.
   Acceptance: an unknown slug renders a message naming it; a valid pair is
   unaffected; the canonical still collapses argument order.

## Done

- Accessibility pass: the index table could not be expanded without a mouse — the
  row was a `<tr>` with an `onClick`, which cannot take focus — so the robot name
  is now a real button carrying `aria-expanded`/`aria-controls`, and the row stays
  clickable for the pointer. Collapsed panels are `inert`, which removes the
  invisible "Full details" tab stop each of the 23 rows had been leaving in the tab
  order. A skip link is the first focusable element on every page and moves focus
  to `<main>`, not just the scroll position. Sort buttons say "Sort by <column>"
  rather than repeating the heading, and `scope="col"` is on every header.
  Measured rather than eyeballed: all text already cleared 4.5:1 (muted is 5.58:1
  on a panel), so the palette is unchanged — but form controls were bounded only by
  `--line` at 1.2:1, failing WCAG 1.4.11, so inputs, selects and textareas now use a
  new `--line-control` at 3.2–3.7:1. Seven Playwright specs lock all of it in,
  including contrast computed from the tokens the browser resolves (#10).

- Playwright smoke tests in CI: five specs over the four paths that have to work — the
  index renders a row and an SDK badge per robot and its counter agrees, the SDK chip
  narrows the table and Clear restores it, a robot page lists its sources with retrieval
  dates and a correction link, `/compare?a=&b=` renders two columns with the rows every
  comparison answers, and the corrections form refuses to submit without a robot, a
  value and a real URL. Nothing is hard-coded: slugs and counts are read off the page,
  so adding a robot does not break the suite. They run against the production build on
  the seed fallback, so CI still needs no secrets, and the report uploads on failure.
  The one new dependency is `@playwright/test` (#9).

- Weekly digest: `/digest` lists the weeks and `/digest/[week]` renders one, built from
  the dates already on the rows — approved news published in the week, and every tier,
  robot and source stamped in it — so nothing is generated at read time. `proposals` has
  no public read policy, so an applied change is shown through the public stamps it
  leaves rather than by opening the queue. Empty weeks render, say what to do and are
  noindex; weeks with content are in the sitemap (#8). Fixed along the way: an unlayered
  `a { color: inherit }` in `globals.css` was beating every layered utility, so
  `text-accent` had never rendered on any page and the one interaction accent was
  invisible site-wide.
- Phase 1: schema, seed, index table, robot pages, about page, Vercel + Supabase deploy.
- Phase 2: images with attribution, admin review queue, corrections form, compare,
  company pages, news feed, auto-approval of sourced price updates.
- Agents: price watcher, news scout, new-robot scout, builder (cloud routines).
- Compare picker on the index: a checkbox on every row and mobile card (three at a
  time, the rest disabled at the cap) and a sticky bar that names the picks and links
  to `/compare?a=&b=&c=`. Picks are held above the filters, so a robot the current
  filters hide stays in the comparison; the checkbox click is stopped at its cell so
  picking never expands the row. Keyboard throughout: real checkboxes, Space to
  toggle, chips to remove (#7).
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
