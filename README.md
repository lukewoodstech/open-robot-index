# Open Robot Index

A directory of robots under $25K scored on whether you can actually program them. Every fact has a source URL and a last-checked date. See [CLAUDE.md](CLAUDE.md) for the full brief.

## Run locally (no backend needed)

```bash
npm install
npm run dev
```

Without Supabase env vars the site serves `src/data/seed.ts` directly, so every page works offline.

## Deploy (Phase 1)

1. **Supabase.** Create a project. In the SQL editor run `supabase/migrations/0001_init.sql`. Copy the project URL, anon key and service role key into `.env.local` (see `.env.example`).
2. **Seed.** `npm run seed` upserts the 22 robots, their tiers and sources. Safe to re-run.
3. **Vercel.** Push to GitHub, import the repo in Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables, deploy. Pages revalidate hourly.

## Admin and agents

- `/admin/review` is the proposal queue. Sign in with the email in `ADMIN_EMAILS`. Keys: J/K move, A approve, R reject.
- `/corrections` files reader corrections into the same queue.
- Agents file proposals with `POST /api/proposals` (bearer `CRON_SECRET`); `/api/proposals/apply` runs the auto-approval policy (sourced price and availability changes from trusted domains only). See `agents/` for the routine playbooks and `ROADMAP.md` for what the builder works on next.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed Supabase from `src/data/seed.ts` |

## Layout

```
supabase/migrations/   schema (enums, tables, RLS: public select only)
scripts/seed.ts        seed script (service role key)
src/data/seed.ts       the 22-robot DATA array, all last_checked 2026-09-03
src/lib/data.ts        the only data access layer (Supabase or seed fallback)
src/lib/types.ts       shared types and label maps
src/components/        SDK badge, confidence mark, index table
src/app/               / , /robots/[slug], /about
```
