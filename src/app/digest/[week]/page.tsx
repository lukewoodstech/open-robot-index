import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SdkBadge } from "@/components/badges";
import { getNews, getRobots } from "@/lib/data";
import { type Digest, buildDigest, weeksWithContent } from "@/lib/digest";
import { isoDate, usd } from "@/lib/format";
import { currentWeek, isFuture, parseWeekId, shiftWeek, type Week } from "@/lib/weeks";

export const revalidate = 3600;

/** Pre-render the weeks that have something in them, plus the week in progress. */
export async function generateStaticParams() {
  const [robots, news] = await Promise.all([getRobots(), getNews()]);
  const weeks = new Set(weeksWithContent(robots, news));
  weeks.add(currentWeek().id);
  return [...weeks].map((week) => ({ week }));
}

async function digestFor(week: Week): Promise<Digest> {
  const [robots, news] = await Promise.all([getRobots(), getNews()]);
  return buildDigest(week, robots, news);
}

function range(w: Week): string {
  return `${isoDate(w.start)} – ${isoDate(w.end)}`;
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params;
  const w = parseWeekId(week);
  if (!w) return { title: "Not found" };
  const d = await digestFor(w);
  const title = `Digest ${w.id}`;
  const description = d.empty
    ? `Nothing cleared the review queue in the week of ${isoDate(w.start)}.`
    : `${w.id}: ${d.news.length} buyer change${d.news.length === 1 ? "" : "s"} and ${d.rechecks.length} robot${d.rechecks.length === 1 ? "" : "s"} re-checked, ${range(w)}.`;
  return {
    title,
    description,
    alternates: { canonical: `/digest/${w.id}` },
    // An empty week is a thin page; let crawlers keep the ones with facts on them.
    robots: d.empty ? { index: false, follow: true } : undefined,
    openGraph: { type: "article", title, description, url: `/digest/${w.id}` },
  };
}

export default async function DigestWeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const w = parseWeekId(week);
  if (!w || isFuture(w)) notFound();

  const [digest, robots, news] = await Promise.all([digestFor(w), getRobots(), getNews()]);
  const prev = shiftWeek(w.id, -1);
  const next = shiftWeek(w.id, 1);
  const nextLinkable = next && !isFuture(next) ? next : null;
  const others = weeksWithContent(robots, news).filter((id) => id !== w.id);
  const latest = others[0];

  return (
    <article>
      <nav className="text-xs text-muted mb-4">
        <Link href="/digest" className="tap px-1 -ml-1 hover:text-text">Digest</Link>
        <span className="mx-1.5">/</span>
        <span>{w.id}</span>
      </nav>

      <header>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none">
          Week of {isoDate(w.start)}
        </h1>
        <p className="mt-2 text-muted max-w-[65ch]">
          {range(w)} · {w.id}. What the index approved and re-checked in these seven days, built
          from the dates on the rows themselves. Every line links to its robot and its source.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-line py-3 text-xs">
        {prev ? (
          <Link href={`/digest/${prev.id}`} className="tap text-accent hover:underline">← {prev.id}</Link>
        ) : (
          <span className="text-muted">← earlier</span>
        )}
        {nextLinkable ? (
          <Link href={`/digest/${nextLinkable.id}`} className="tap text-accent hover:underline">{nextLinkable.id} →</Link>
        ) : (
          <span className="text-muted">this is the latest week</span>
        )}
        <Link href="/digest" className="tap text-muted hover:text-text">All weeks</Link>
      </div>

      {digest.empty ? (
        <p className="mt-10 text-sm text-muted max-w-[65ch]">
          Nothing cleared the review queue in this week, so there is nothing to report. The price
          watcher runs weekly and the news scout twice a week; what they find waits for a human at
          the review queue before it reaches this page.{" "}
          {latest ? (
            <>
              The most recent week with changes is{" "}
              <Link href={`/digest/${latest}`} className="text-accent hover:underline">{latest}</Link>.
            </>
          ) : (
            <>
              Start from <Link href="/" className="text-accent hover:underline">the index</Link>.
            </>
          )}
        </p>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">What changed for buyers</h2>
            {digest.news.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No news items were approved this week.{" "}
                <Link href="/news" className="text-accent hover:underline">See the full feed</Link>.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line/60 max-w-[80ch]">
                {digest.news.map((n) => (
                  <li key={n.id} className="py-4">
                    <a href={n.url} target="_blank" rel="noopener" className="font-medium hover:underline">{n.title}</a>
                    <p className="mt-1 text-sm">{n.summary}</p>
                    <p className="mt-2 text-xs text-muted flex flex-wrap gap-x-3">
                      <span>{n.category.replace("_", " ")}</span>
                      {n.publisher && <span>{n.publisher}</span>}
                      {n.published_at && <span>{isoDate(n.published_at)}</span>}
                      {n.robot_ids
                        .map((id) => robots.find((r) => r.id === id))
                        .filter((r) => r)
                        .map((r) => (
                          <Link key={r!.id} href={`/robots/${r!.slug}`} className="text-accent hover:underline">{r!.name}</Link>
                        ))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">Re-checked this week</h2>
            <p className="mt-1 text-sm text-muted max-w-[80ch]">
              {digest.rechecks.length} robot{digest.rechecks.length === 1 ? "" : "s"} carry a check date
              in this week. A sourced price or availability change from a trusted domain applies on its
              own; every other field waits for a human.{" "}
              <Link href="/about" className="text-accent hover:underline">How that works</Link>.
            </p>
            {digest.rechecks.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No robot was re-checked this week.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line/60 max-w-[90ch]">
                {digest.rechecks.map(({ robot, tiers, sources, robotStamped }) => (
                  <li key={robot.id} className="py-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link href={`/robots/${robot.slug}`} className="font-medium hover:underline">{robot.name}</Link>
                      <SdkBadge value={robot.sdk_access} />
                      <span className="text-xs text-muted">{robot.company.name}</span>
                    </div>

                    {tiers.length > 0 && (
                      <ul className="mt-2 text-sm">
                        {tiers.map((t) => (
                          <li key={t.id} className="flex flex-wrap items-baseline gap-x-3 py-0.5">
                            <span className="text-muted">{t.tier_name}</span>
                            <span className="tabular-nums whitespace-nowrap">{usd(t.price_usd)}</span>
                            <span className="text-xs text-muted whitespace-nowrap">checked {isoDate(t.checked_at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {tiers.length === 0 && robotStamped && (
                      <p className="mt-2 text-sm text-muted">
                        Facts re-checked {isoDate(robot.last_checked)}; no tier price changed.
                      </p>
                    )}

                    {sources.length > 0 && (
                      <p className="mt-2 text-xs text-muted flex flex-wrap gap-x-3 gap-y-1">
                        {sources.map((s) => (
                          <a key={s.id} href={s.url} target="_blank" rel="noopener" className="underline hover:text-accent">
                            {/* The title, not the publisher: a robot often cites the
                                same publisher twice and two identical links read
                                like a mistake. */}
                            {s.title ?? s.publisher ?? s.url}
                          </a>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {others.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <h2 className="text-sm font-semibold tracking-tight">Older weeks</h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {others.slice(0, 12).map((id) => (
              <li key={id}>
                <Link href={`/digest/${id}`} className="tap text-accent hover:underline">{id}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
