# Price and tier watcher

Runs weekly. Goal: every robot's tier prices and availability match what its cited
source shows today.

## Procedure

1. Get the current data. Query Supabase (project `bdtvvzkoocymycqafkqb`) with the MCP connector:
   ```sql
   select r.slug, r.name, r.availability, r.last_checked, c.website,
          t.tier_name, t.price_usd, t.price_note,
          s.url as source_url
   from robots r
   join companies c on c.id = r.company_id
   join robot_tiers t on t.robot_id = r.id
   left join sources s on s.id = t.source_id
   order by r.last_checked asc, r.slug, t.sort_order;
   ```
   Also read `select summary from proposals where status = 'pending'` so you do not duplicate.
2. Work through robots oldest `last_checked` first. Budget: all robots if time allows, at least the 10 stalest.
3. For each tier, fetch the cited `source_url` (WebFetch). If it no longer shows a price, search the manufacturer store, then at most two resellers.
4. Compare. File a `tier_update` proposal when:
   - the price differs from `price_usd` by any amount;
   - the SKU name changed or was discontinued (set `price_note` to say so);
   - availability changed (in stock, sold out, preorder, discontinued) — put it in `after.availability`.
   Include `before` from the database and the exact page URL in `sources[0]` with a quote under 15 words that contains the price.
5. If a source is unreachable twice, file nothing for that tier; mention it in your final summary.
6. POST all proposals to `/api/proposals` in one request, then POST `/api/proposals/apply`.
7. Finish with a short summary: robots checked, proposals filed, which were auto-approved, which are waiting for a human, and any pages that blocked you.

Do not modify the repo. Do not write to any table.
