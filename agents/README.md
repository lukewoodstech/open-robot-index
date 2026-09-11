# Agent playbooks

Cloud routines clone this repo and read the playbook for their job. Keep each
playbook self-contained: the routine starts with zero context.

| Routine | Playbook | Schedule |
| --- | --- | --- |
| Price and tier watcher | [price-watch.md](price-watch.md) | Weekly, Monday |
| Buyer-news scout | [news-scout.md](news-scout.md) | Tuesday and Friday |
| New robot scout | [new-robot-scout.md](new-robot-scout.md) | Monthly, the 1st |
| Builder | [builder.md](builder.md) | Weekly, Wednesday |

## How agents write

Agents never write to public tables. They file rows in the `proposals` table and
nothing else. The cloud sandbox may block outbound HTTP to arbitrary hosts, so the
primary write path is the Supabase MCP connector (project `bdtvvzkoocymycqafkqb`):

```sql
insert into proposals (kind, target_table, summary, agent, agent_notes, payload)
values ('tier_update', 'robots', 'unitree-go2: Go2 Pro $2,800 → $2,600', 'price-watch',
        'Price on the official store dropped; page fetched.', '{...json payload...}'::jsonb);
```

Insert several rows in one statement. You may run `select` on any table for context.
You may not `update`, `delete`, or `insert` into any table other than `proposals`.

If outbound HTTP works in your session, the equivalent API is
`POST https://open-robot-index.vercel.app/api/proposals` with
`Authorization: Bearer <secret>` (secret from
`select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'`; never print it).
Either path is fine; the table is the same.

Auto-approval runs daily via Vercel Cron (`/api/proposals/apply`). It applies only
`tier_update` and availability changes whose first source is on a trusted domain
(the manufacturer's site or a domain already cited for that robot), was actually
fetched (`page_fetched: true`), and carries a verbatim `quote` under 15 words that
contains the value. Everything else waits for a human at `/admin/review`.

## When page fetches are blocked

If WebFetch or curl is denied by the network policy, you may still use WebSearch
result snippets as evidence. Then set `page_fetched: false` on the source, put the
snippet text in `quote` only if it is verbatim, and say in `agent_notes` that the page
was not fetched. Such proposals are never auto-applied; a human checks them. Filing a
held proposal is better than filing nothing, as long as the URL is the original page.

## Payload shapes

See `src/lib/proposals.ts` for the exact TypeScript types. In short:

- `tier_update`: `{ robot_slug, tier_name, new_tier?, before: { price_usd, price_note }, after: { price_usd, price_note, currency_note?, includes_sdk?, compute?, availability? }, sources: [{ url, title, publisher, quote, field, page_fetched }] }`
- `field_update`: `{ robot_slug, field, before, after, note, sources }` where `field` is one of the editable robot fields listed in `EDITABLE_ROBOT_FIELDS`.
- `new_robot`: `{ company: { slug, name, country, website, description }, robot: { ...all robot columns except ids... }, tiers: [...], sources: [...] }` with `confidence: "verify"`.
- `news_item`: `{ title, summary, url, publisher, published_at, category, robot_slugs, company_slugs }`.

## Rules baked into every agent

- Cite a URL for every field you propose. No URL, no proposal.
- Quotes from sources are under 15 words. Summaries are your own words.
- If two sources disagree, file both values in one proposal and say so in `agent_notes`.
- Never invent a price for a quote-only robot. `price_usd: null` with a note is correct.
- Never propose a robot whose cheapest buyable tier is over $25,000.
- Manufacturer store or official project page first; resellers only as a second source.
- Do not file a proposal that duplicates a pending one. Check `select summary from proposals where status = 'pending'` first.
