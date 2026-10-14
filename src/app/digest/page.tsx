import type { Metadata } from "next";
import Link from "next/link";
import { getNews, getRobots } from "@/lib/data";
import { buildDigest, weeksWithContent } from "@/lib/digest";
import { isoDate } from "@/lib/format";
import { currentWeek, parseWeekId } from "@/lib/weeks";

export const metadata: Metadata = {
  title: "Weekly digest",
  description:
    "Week by week: the buyer changes approved and the prices re-checked in the index. Built from the dates on the rows, every line sourced.",
  alternates: { canonical: "/digest" },
};
export const revalidate = 3600;

export default async function DigestIndexPage() {
  const [robots, news] = await Promise.all([getRobots(), getNews()]);
  const now = currentWeek();
  const ids = [now.id, ...weeksWithContent(robots, news).filter((id) => id !== now.id)];

  const weeks = ids
    .map((id) => parseWeekId(id))
    .filter((w) => w)
    .map((w) => buildDigest(w!, robots, news));

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none">Weekly digest</h1>
      <p className="mt-2 text-muted max-w-[65ch]">
        One page per week: the buyer changes that were approved and the prices that were re-checked.
        Written from the data, not generated at read time, so every line still carries its source and
        its date.
      </p>

      <ul className="mt-6 divide-y divide-line border-y border-line max-w-[80ch]">
        {weeks.map((d, i) => (
          <li key={d.week.id} className="py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <Link href={`/digest/${d.week.id}`} className="font-medium hover:underline">
                Week of {isoDate(d.week.start)}
              </Link>
              <span className="text-xs text-muted tabular-nums">
                {d.week.id}
                {i === 0 ? " · in progress" : ""}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {d.empty
                ? "Nothing cleared the review queue."
                : [
                    d.news.length > 0 &&
                      `${d.news.length} buyer change${d.news.length === 1 ? "" : "s"}`,
                    d.rechecks.length > 0 &&
                      `${d.rechecks.length} robot${d.rechecks.length === 1 ? "" : "s"} re-checked`,
                  ]
                    .filter((s) => s)
                    .join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-muted max-w-[65ch]">
        Weeks appear here once something in them clears the review queue. The full feed lives at{" "}
        <Link href="/news" className="text-accent hover:underline">News</Link>, and{" "}
        <Link href="/about" className="text-accent hover:underline">About</Link> explains what an agent
        can change on its own.
      </p>
    </div>
  );
}
