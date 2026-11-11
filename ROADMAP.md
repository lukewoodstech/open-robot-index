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
   > **Blocked for the builder routine (2026-11-04).** Same egress wall as item 2,
   > re-checked this run: seeedstudio.com, robotis.us, ufactory.cc, trossenrobotics.com,
   > pollen-robotics.com and huggingface.co all refused by the sandbox proxy, and
   > github.com answers only 400. Only raw.githubusercontent.com resolves, which reaches
   > the handful of open-source projects' repos and none of the 22 companies' press kits.
   > A logo lifted from anywhere else would breach the images non-negotiable. Needs a
   > human: allowlist those domains for the routine, or drop in the logo files by hand
   > with their `logo_source`.
4. **Review-queue health on `/admin/review`.** A header line with the pending count, the
   age of the oldest pending proposal, and a breakdown by kind, so a backlog is visible
   on arrival. Read-only: it must not change the auto-approval policy or the queue's
   buttons. Acceptance: the counts match the table; an empty queue says so.
5. **Announce the filtered count on the index.** Clicking an SDK chip or changing a
   select rewrites the table silently: the "N of M" counter updates but nothing is
   announced, so a screen-reader user cannot tell a filter did anything. Put the
   counter in an `aria-live="polite"` region and give the "No robots match" state a
   role so it is announced too. Acceptance: a Playwright test asserts the live
   region's text changes after a chip is clicked, and that nothing is announced on
   first paint.
6. **Real focus in the review queue.** `/admin/review` moves a cursor with J/K, but
   it only repaints a border — `document.activeElement` never moves, so a keyboard
   or screen-reader user cannot tell which proposal A/R will act on. Make the
   selected card actually take focus, keep the accent border, and label it so the
   move is announced. Acceptance: J/K moves `document.activeElement` to the
   selected card, A/R still act on it, and Tab from a card reaches its own
   Approve/Reject before the next card's.
7. **Say when a compare slug is unknown.** `/compare?a=nope&b=so-101` silently drops
   the bad slug and falls through to "Pick at least two robots", which blames the
   reader for a bad link. Name the slug that did not resolve and offer the picker.
   Acceptance: an unknown slug renders a message naming it; a valid pair is
   unaffected; the canonical still collapses argument order.

8. **OG cards for company pages.** `/companies/[slug]` unfurls as the generic site card,
   so a link to a maker says nothing about what they sell. Draw a card in the same Geist
   on graphite: the company name, how many robots of theirs are in the index, their SDK
   mix in the three state colours, and the cheapest entry price across them. Acceptance:
   every company prerenders a 1200x630 PNG; a one-robot company and a many-robot company
   both render; the site default is unchanged.

9. **An OG card for a comparison.** `/compare?a=&b=` is the page most likely to be pasted
   into a chat, and today it unfurls as the generic site card, so the link does not say
   which robots are being compared. Note before starting: a file-based `opengraph-image`
   is handed `params` only, never `searchParams`, so this needs a route handler that takes
   the slugs in its own path or query and `openGraph.images` set from `generateMetadata`.
   Acceptance: two and three robots each render a card naming them with their SDK state
   and entry price; no slugs or only bad slugs falls back to the site card; swapping
   argument order produces the same image URL, as the canonical already does.

10. **Age the facts on company pages.** The freshness pass reached the index and the robot
   pages, but `/companies/[slug]` still lists its robots with a bare date, so a maker whose
   whole range is four months stale reads exactly like one checked last week. Carry the
   same `freshness()` age and stale mark onto each row there, and say in the page's
   summary line how many of that company's robots are due. Acceptance: every row exposes
   its own `data-checked` and renders an age in words; a Playwright spec derives the
   expected stale marks from those dates rather than hard-coding a company.

## Done
- OG cards for digest weeks: `/digest/[week]/opengraph-image` draws a card per week in the
  same Geist on graphite as the robot cards — the week in words, its date range and ISO id,
  and three counts read straight off the digest (buyer changes, robots re-checked, tier
  prices checked). An empty week unfurls too, saying in the card what the page says: nothing
  cleared the review queue, and why that is normal. The only colour is the SDK mix of the
  robots the week touched, which is the one thing colour is allowed to mean here; the counts
  sit in plain graphite panels. A malformed or future week renders a named "no digest for
  that week" card rather than throwing, because a crawler can ask for the image before the
  page. Prerendered for the same weeks the page prerenders. Three Playwright specs read the
  week ids off `/digest` rather than hard-coding them, assert both cards are 1200x630 PNGs
  from their IHDR bytes, and hold the site default card unchanged (#PRNUM).

- Freshness signal: every row and every robot page now says how old its facts are, not
  just when they were checked. A new `freshness()` in `src/lib/format.ts` turns a
  `last_checked` date into an age ("9 weeks ago") and a stale flag at 60 days, and the
  index grew a sortable Checked column so one click surfaces the oldest first. Past the
  window a row's mark becomes bordered and full-contrast instead of quiet muted text —
  no new colour, since colour here only ever means SDK state — and the robot page spells
  the overdue case out in words with a link to the manufacturer and to the corrections
  form. Nothing goes stale silently: the index footer states how many of the rows are
  due. The age is computed on the server and passed into the client table, because a
  component reading its own clock would disagree with the hourly-revalidated HTML it
  hydrates. Four Playwright specs lock it in from each row's own `data-checked`, so a
  re-check that moves the dates does not break the suite (#11).

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
