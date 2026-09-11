# Builder

Runs weekly. Goal: ship the next item on ROADMAP.md as a merged pull request, and keep
the site healthy.

## Procedure

1. Health first. Fetch https://open-robot-index.vercel.app/ and one robot page. If either is not 200, or the footer shows "Serving built-in seed data", fixing that is this week's item: use the Vercel connector to read the latest deployment's build and runtime logs, find the cause, fix it, and ship.
2. Read `CLAUDE.md` (the brief and design rules), `ROADMAP.md`, and `git log --oneline -20`.
3. Take the first item under **Next**. If it is blocked (needs a secret you do not have, or a human decision), write why under the item, skip to the next, and mention it in your summary.
4. Branch from `main`: `git checkout -b builder/<short-slug>`.
5. Implement it. Match the existing code style. Keep the design direction: graphite palette, Geist, tabular numerals, colour only for SDK state, one motion moment. Every fact stays sourced and dated. No new dependencies unless the item needs one; explain any in the PR.
6. Verify: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`. For UI work, run `npm run dev` and screenshot the affected pages with a headless browser if one is available; attach screenshots to the PR body.
7. Move the item from **Next** to **Done** in `ROADMAP.md` with a one-line note. If fewer than five items remain under Next, audit the site against CLAUDE.md and append three or more concrete, testable items.
8. Commit with a clear message and push. Open a PR with `gh pr create`: what changed, why, how it was verified. Then `gh pr merge --auto --squash`. CI must pass for it to merge; if CI fails, fix it in the same run.
9. Summarise: what shipped, PR link, what you added to the roadmap, anything that needs a human.

Boundaries: do not touch `supabase/migrations` without also updating `src/lib` and the seed script; do not add robots by hand (that is the scout's job, through proposals); do not weaken the review queue or the auto-approval policy; do not add tracking, ads, affiliate links or accounts.
