/**
 * The sitemap. Every public page, with a real lastModified so crawlers re-fetch
 * a robot when its facts were re-checked rather than on a guess.
 *
 * /admin is left out on purpose: those pages are noindex and behind the
 * middleware allowlist.
 */
import type { MetadataRoute } from "next";
import { getNews, getRobots } from "@/lib/data";
import { weeksWithContent } from "@/lib/digest";
import { siteUrl } from "@/lib/site";
import { currentWeek, parseWeekId } from "@/lib/weeks";

export const revalidate = 3600;

/** The newest of a set of date strings, as a Date. Undefined when the set is empty. */
function newest(dates: (string | null)[]): Date | undefined {
  const latest = dates.filter((d): d is string => Boolean(d)).sort().at(-1);
  return latest ? new Date(latest) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [robots, news] = await Promise.all([getRobots(), getNews()]);

  const indexChecked = newest(robots.map((r) => r.last_checked));
  const newsChecked = newest(news.map((n) => n.published_at));

  const companySlugs = Array.from(new Set(robots.map((r) => r.company.slug))).sort();

  // Only the weeks that have something in them, plus the week in progress. An
  // empty week renders but is noindex, so it stays out of here.
  const thisWeek = currentWeek();
  const digestWeeks = Array.from(new Set([thisWeek.id, ...weeksWithContent(robots, news)]));

  return [
    { url: `${base}/`, lastModified: indexChecked, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/news`, lastModified: newsChecked, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/digest`, lastModified: indexChecked, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/compare`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/corrections`, changeFrequency: "yearly", priority: 0.3 },
    ...robots.map((r) => ({
      url: `${base}/robots/${r.slug}`,
      lastModified: newest([r.last_checked]),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...digestWeeks.map((id) => ({
      url: `${base}/digest/${id}`,
      // A week stops changing once it is over, so its Sunday is its lastmod. The
      // week in progress gets today instead: its Sunday has not happened yet.
      lastModified: id === thisWeek.id ? new Date() : newest([parseWeekId(id)?.end ?? null]),
      changeFrequency: id === thisWeek.id ? ("daily" as const) : ("yearly" as const),
      priority: 0.3,
    })),
    ...companySlugs.map((slug) => ({
      url: `${base}/companies/${slug}`,
      lastModified: newest(robots.filter((r) => r.company.slug === slug).map((r) => r.last_checked)),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
