# Buyer-news scout

Runs twice a week. Goal: surface changes that matter to someone buying a programmable
robot under $25K, in the last 7 days.

## What counts

- Price cuts or increases on robots in the index or close competitors.
- New SKUs, editions or bundles (a new EDU tier, a cheaper base model).
- SDK releases or licence changes (an SDK opened to all buyers, a new ROS 2 package, a LeRobot integration).
- Stock and availability changes (sold out, shipping started, discontinued).
- New open-source rigs under $25K with a BOM and a repo.

Skip: funding rounds (unless they change a product's price or availability), general robotics news, demos, research papers without buyable hardware, anything over $25K.

## Procedure

1. Read the index: `select slug, name from robots` and `select name, website from companies` from Supabase project `bdtvvzkoocymycqafkqb`.
2. Read pending proposals so you do not duplicate: `select summary from proposals where status = 'pending' and kind = 'news_item'`. Also `select url from news_items` to avoid re-filing an existing story.
3. Search (WebSearch) for each of the categories above. Useful queries: "<company> price", "<robot> SDK release", "open source robot arm BOM 2026", "humanoid under $20,000", "LeRobot new robot support". Check Hugging Face's LeRobot blog and GitHub releases for vendors in the index.
4. For each real item, open the original source (WebFetch) and confirm the fact.
5. File a `news_item` proposal per story: title, a 2 to 3 sentence summary in your own words, the original URL (not an aggregator), publisher, published date, category, and `robot_slugs` for robots in the index it concerns.
6. If a story changes a price or availability for a robot in the index, ALSO file the matching `tier_update` so the data changes, not just the feed.
7. POST proposals to `/api/proposals`, then `/api/proposals/apply`.
8. Summarise: stories found, filed, skipped and why.

Do not modify the repo. Do not write to any table.
