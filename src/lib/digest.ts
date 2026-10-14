/**
 * The weekly digest, assembled from the data the site already serves. Nothing
 * is written at render time and no model is called: a week is just a slice of
 * the dates already on the rows.
 *
 * Two things make up a week:
 *
 * - Approved news items published in it.
 * - Every re-check applied in it. `proposals` has no public read policy, so the
 *   digest reads the stamps applying one leaves behind instead: a tier's
 *   `checked_at`, a robot's `last_checked`, and the `retrieved_at` of the
 *   sources the change cited. That keeps the digest to facts the page can show
 *   with a URL and a date, which is the whole point of the index.
 */
import type { NewsItem } from "@/lib/data";
import type { RobotFull, RobotTier, Source } from "@/lib/types";
import { type Week, inWeek, weekOf } from "@/lib/weeks";

export interface DigestRecheck {
  robot: RobotFull;
  /** Tiers whose price was re-checked in the week. */
  tiers: RobotTier[];
  /** Sources retrieved in the week, newest first. */
  sources: Source[];
  /** True when the robot's own `last_checked` falls in the week. */
  robotStamped: boolean;
}

export interface Digest {
  week: Week;
  news: NewsItem[];
  rechecks: DigestRecheck[];
  /** Nothing cleared the queue in this week. */
  empty: boolean;
}

export function buildDigest(week: Week, robots: RobotFull[], news: NewsItem[]): Digest {
  const items = news
    .filter((n) => n.published_at && inWeek(n.published_at, week))
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

  const rechecks: DigestRecheck[] = [];
  for (const robot of robots) {
    const tiers = robot.tiers.filter((t) => inWeek(t.checked_at, week));
    const robotStamped = inWeek(robot.last_checked, week);
    if (tiers.length === 0 && !robotStamped) continue;
    const sources = robot.sources
      .filter((s) => inWeek(s.retrieved_at, week))
      .sort((a, b) => b.retrieved_at.localeCompare(a.retrieved_at));
    rechecks.push({ robot, tiers, sources, robotStamped });
  }
  rechecks.sort((a, b) => a.robot.name.localeCompare(b.robot.name));

  return { week, news: items, rechecks, empty: items.length === 0 && rechecks.length === 0 };
}

/** Every week with something in it, newest first. */
export function weeksWithContent(robots: RobotFull[], news: NewsItem[]): string[] {
  const ids = new Set<string>();
  for (const n of news) if (n.published_at) ids.add(weekOf(n.published_at));
  for (const r of robots) {
    ids.add(weekOf(r.last_checked));
    for (const t of r.tiers) ids.add(weekOf(t.checked_at));
  }
  return [...ids].sort().reverse();
}
