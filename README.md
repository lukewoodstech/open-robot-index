
# Open Robot Index

**Robots under $25K, ranked on whether you can actually program them.**

[Live site](https://open-robot-index.vercel.app) · Next.js 15 · Supabase · Tailwind v4 · Claude agents

<img alt="Open Robot Index home page" src="https://github.com/user-attachments/assets/32411894-235e-4782-8588-5e0853ba0775" />

## Why I built it

I wanted to get into robotics and couldn't find a straight answer to a simple question: if I buy this robot, do I get a real SDK, or is it locked behind a higher tier? Spec pages bury it and reviews skip it. So I built the index I wanted. Every robot gets an SDK verdict (full, gated or none), the tier that unlocks it, supported languages, LeRobot and sim support, and a source URL plus a last checked date for every fact.

## What's in it

- **Index table** with filter chips, sortable columns and rows that expand inline for the details
- **Robot, company and compare pages**, plus a news feed for price cuts, new SKUs and SDK releases
- **Corrections form** so readers can flag anything wrong
- **Agent pipeline**: Claude agents watch prices, scout news and find new robots. They never publish. They file proposals into a review queue
- **Review queue** at `/admin/review` built for speed: J/K to move, A to approve, R to reject
- **Per robot OG images**, sitemap and robots.txt so shared links look right

## Design decisions

- **Color only where it means something.** The UI is graphite and off white with one accent for interaction. The only other colors are the three SDK states, so green, amber and red always mean the same thing.
- **Tabular numerals for all data** (Geist) so prices and counts line up and scan fast.
- **One motion moment.** Rows expand with a `grid-template-rows` transition. Nothing else moves on its own, and it all respects `prefers-reduced-motion`.
- **Accessible tables.** `aria-sort` on columns, `aria-pressed` on filters, `aria-expanded` on rows, visible focus rings.
- **Humans stay in the loop.** Agents propose, a person approves. Only low risk, well sourced price changes from trusted domains can auto approve.
- **Works without a backend.** With no Supabase keys the site reads straight from `src/data/seed.ts`, so anyone can clone it and run it in seconds.

## Run it

```bash
npm install
npm run dev
```

That's it. No env vars needed for local dev. To run the full thing with Supabase, copy `.env.example` to `.env.local`, run `supabase/migrations/0001_init.sql`, then `npm run seed`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | Type check |
| `npm run seed` | Seed Supabase from `src/data/seed.ts` |

## Stack

Next.js 15 (App Router), React 19, Tailwind v4, Supabase (Postgres with RLS and auth), Vercel with a daily cron, Anthropic API for the agents, GitHub Actions for lint, typecheck and build.

See [ROADMAP.md](ROADMAP.md) for what's next and [agents/](agents) for the agent playbooks.
