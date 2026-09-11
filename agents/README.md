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

Agents never write to public tables. They file proposals through the site:

```
POST https://open-robot-index.vercel.app/api/proposals
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json

[{ "kind": "tier_update", "summary": "...", "agent": "price-watch", "agent_notes": "...", "payload": { ... } }]
```

Then they trigger the auto-approval pass, which applies only sourced price and
availability changes from a trusted domain; everything else waits for a human at
`/admin/review`:

```
POST https://open-robot-index.vercel.app/api/proposals/apply
Authorization: Bearer <CRON_SECRET>
```

The secret is stored in Supabase Vault under the name `cron_secret`. Read it with the
Supabase MCP connector: `select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'`
against project `bdtvvzkoocymycqafkqb`. Never print it, never commit it.

## Payload shapes

See `src/lib/proposals.ts` for the exact TypeScript types. In short:

- `tier_update`: `{ robot_slug, tier_name, new_tier?, before: { price_usd, price_note }, after: { price_usd, price_note, currency_note?, includes_sdk?, compute?, availability? }, sources: [{ url, title, publisher, quote, field }] }`
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
