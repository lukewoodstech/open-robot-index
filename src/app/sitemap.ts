/**
 * The sitemap. Every public page, with a real lastModified so crawlers re-fetch
 * a robot when its facts were re-checked rather than on a guess.
 *
 * /admin is left out on purpose: those pages are noindex and behind the
 * middleware allowlist.
 */
import type { MetadataRoute } from "next";
import { getNews, getRobots } from "@/lib/data";
import { siteUrl } from "@/lib/site";

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

  return [
    { url: `${base}/`, lastModified: indexChecked, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/news`, lastModified: newsChecked, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/compare`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/corrections`, changeFrequency: "yearly", priority: 0.3 },
    ...robots.map((r) => ({
      url: `${base}/robots/${r.slug}`,
      lastModified: newest([r.last_checked]),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...companySlugs.map((slug) => ({
      url: `${base}/companies/${slug}`,
      lastModified: newest(robots.filter((r) => r.company.slug === slug).map((r) => r.last_checked)),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
