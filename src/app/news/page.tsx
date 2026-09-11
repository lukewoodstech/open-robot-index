import type { Metadata } from "next";
import Link from "next/link";
import { getNews, getRobots } from "@/lib/data";
import { isoDate } from "@/lib/format";

export const metadata: Metadata = { title: "News", description: "What changed for buyers: price cuts, new SKUs, SDK releases, stock changes, and new open-source rigs under $25K." };
export const revalidate = 1800;

const CATEGORIES = ["price_change", "new_sku", "sdk_change", "availability", "new_open_source", "funding", "other"] as const;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [news, robots] = await Promise.all([getNews(), getRobots()]);
  const items = category ? news.filter((n) => n.category === category) : news;
  const bySlug = new Map(robots.map((r) => [r.id, r]));

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none">What changed for buyers</h1>
      <p className="mt-2 text-muted max-w-[60ch]">Price cuts, new SKUs, SDK releases, stock changes and new open-source rigs. Each item links to its robot and the original source. Written in our own words; reviewed before it appears.</p>

      <div className="mt-6 flex flex-wrap gap-1 text-xs border-y border-line py-3">
        <Link href="/news" className={`rounded-md border px-2.5 py-1 ${!category ? "border-line bg-panel-2 text-text" : "border-transparent text-muted hover:text-text"}`}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/news?category=${c}`} className={`rounded-md border px-2.5 py-1 ${category === c ? "border-line bg-panel-2 text-text" : "border-transparent text-muted hover:text-text"}`}>
            {c.replace("_", " ")}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-muted">Nothing here yet. The news scout runs twice a week and every item is reviewed before it shows up.{category ? " Try All categories." : ""}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line/60 max-w-[80ch]">
          {items.map((n) => (
            <li key={n.id} className="py-4">
              <a href={n.url} target="_blank" rel="noopener" className="font-medium text-base hover:underline">{n.title}</a>
              <p className="mt-1 text-sm">{n.summary}</p>
              <p className="mt-2 text-xs text-muted flex flex-wrap gap-x-3">
                <span>{n.category.replace("_", " ")}</span>
                {n.publisher && <span>{n.publisher}</span>}
                {n.published_at && <span>{isoDate(n.published_at)}</span>}
                {n.robot_ids.map((id) => bySlug.get(id)).filter(Boolean).map((r) => (
                  <Link key={r!.id} href={`/robots/${r!.slug}`} className="text-accent hover:underline">{r!.name}</Link>
                ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
