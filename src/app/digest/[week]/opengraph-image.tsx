import { ImageResponse } from "next/og";
import { getNews, getRobots } from "@/lib/data";
import { buildDigest, weeksWithContent } from "@/lib/digest";
import { isoDate } from "@/lib/format";
import { OG, OG_CONTENT_TYPE, OG_SDK, OG_SIZE, ogFonts } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";
import { SDK_LABELS } from "@/lib/types";
import { currentWeek, isFuture, parseWeekId } from "@/lib/weeks";

export const alt = "Weekly digest card: the week, and what the index approved and re-checked in it.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The same weeks the page prerenders: the ones with content, plus the week in progress. */
export async function generateStaticParams() {
  const [robots, news] = await Promise.all([getRobots(), getNews()]);
  const weeks = new Set(weeksWithContent(robots, news));
  weeks.add(currentWeek().id);
  return [...weeks].map((week) => ({ week }));
}

const STATES = ["full", "gated", "none"] as const;

export default async function Image({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const w = parseWeekId(week);
  const fonts = await ogFonts();

  // The page 404s on a malformed or future week; the card says so rather than
  // throwing, because a crawler may ask for the image before the page.
  if (!w || isFuture(w)) {
    return new ImageResponse(<Fallback id={week} />, { ...OG_SIZE, fonts });
  }

  const [robots, news] = await Promise.all([getRobots(), getNews()]);
  const digest = buildDigest(w, robots, news);
  const prices = digest.rechecks.reduce((n, r) => n + r.tiers.length, 0);
  const sources = digest.rechecks.reduce((n, r) => n + r.sources.length, 0);
  const inProgress = w.id === currentWeek().id;

  // The only colour on the card, as everywhere else: the SDK state of the
  // robots this week touched.
  const mix = STATES.map((s) => ({
    state: s,
    count: digest.rechecks.filter((r) => r.robot.sdk_access === s).length,
  })).filter((m) => m.count > 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: OG.bg,
          color: OG.text,
          fontFamily: "Geist",
          padding: "52px 64px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, color: OG.muted }}>{`${SITE_NAME} · Weekly digest`}</div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginTop: 14,
            }}
          >
            {`Week of ${isoDate(w.start)}`}
          </div>
          <div style={{ fontSize: 26, color: OG.muted, marginTop: 14 }}>
            {`${isoDate(w.start)} – ${isoDate(w.end)} · ${w.id}${inProgress ? " · in progress" : ""}`}
          </div>
        </div>

        {digest.empty ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: OG.panel,
              border: `1px solid ${OG.line}`,
              borderRadius: 14,
              padding: "26px 30px",
            }}
          >
            <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Nothing cleared the review queue.
            </div>
            <div style={{ fontSize: 23, color: OG.muted, lineHeight: 1.35, marginTop: 10 }}>
              The price watcher runs weekly and the news scout twice a week. What they find waits
              for a human before it reaches this page.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16 }}>
            <Tile n={digest.news.length} label="Buyer changes" />
            <Tile n={digest.rechecks.length} label="Robots re-checked" />
            <Tile n={prices} label="Tier prices checked" />
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            color: OG.muted,
            borderTop: `1px solid ${OG.line}`,
            paddingTop: 18,
          }}
        >
          <div>
            {sources > 0
              ? `${sources} source${sources === 1 ? "" : "s"} dated in this week.`
              : digest.empty
                ? "Every fact in the index has a source URL and a last-checked date."
                : "Every line links to its robot and its source."}
          </div>
          {mix.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div>SDK</div>
              {mix.map((m) => (
                <div key={m.state} style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: OG_SDK[m.state].fg,
                      marginRight: 8,
                    }}
                  />
                  {`${m.count} ${SDK_LABELS[m.state].toLowerCase()}`}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

function Tile({ n, label }: { n: number; label: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: OG.panel,
        border: `1px solid ${OG.line}`,
        borderRadius: 14,
        padding: "18px 24px",
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.02em" }}>{String(n)}</div>
      <div style={{ fontSize: 21, color: OG.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Fallback({ id }: { id: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG.bg,
        color: OG.text,
        fontFamily: "Geist",
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em" }}>
        No digest for that week
      </div>
      <div style={{ fontSize: 24, color: OG.muted, marginTop: 12 }}>
        {`${SITE_NAME} · ${id.slice(0, 24)}`}
      </div>
    </div>
  );
}
