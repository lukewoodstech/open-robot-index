import { ImageResponse } from "next/og";
import { getRobots } from "@/lib/data";
import { isoDate, usd } from "@/lib/format";
import { OG, OG_CONTENT_TYPE, OG_SDK, OG_SIZE, ogFonts } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";
import { SDK_LABELS, entryTier } from "@/lib/types";

export const alt =
  "Open Robot Index: robots under $25K scored on whether you can actually program them.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The three SDK states are the only colour on the site, so they are the card. */
const STATES = ["full", "gated", "none"] as const;

const BLURB: Record<(typeof STATES)[number], string> = {
  full: "SDK on every unit",
  gated: "SDK on one tier",
  none: "No developer SDK",
};

export default async function Image() {
  const [robots, fonts] = await Promise.all([getRobots(), ogFonts()]);
  const counts = Object.fromEntries(
    STATES.map((s) => [s, robots.filter((r) => r.sdk_access === s).length]),
  ) as Record<(typeof STATES)[number], number>;
  const prices = robots
    .map((r) => entryTier(r)?.price_usd)
    .filter((p): p is number => p != null);
  const cheapest = prices.length ? Math.min(...prices) : null;
  const latest = robots.map((r) => r.last_checked).sort().at(-1);

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
          <div style={{ fontSize: 24, color: OG.muted }}>{SITE_NAME}</div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginTop: 14,
            }}
          >
            Robots you can actually program.
          </div>
          <div style={{ fontSize: 27, color: OG.muted, lineHeight: 1.35, marginTop: 18, maxWidth: 930 }}>
            {`${robots.length} robots under $25K${cheapest != null ? `, from ${usd(cheapest)}` : ""}: which tier unlocks the SDK, what it costs, and a source for each fact.`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {STATES.map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                backgroundColor: OG.panel,
                border: `2px solid ${OG_SDK[s].edge}`,
                borderRadius: 14,
                padding: "18px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", fontSize: 25, color: OG_SDK[s].fg }}>
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 6,
                    backgroundColor: OG_SDK[s].fg,
                    marginRight: 10,
                  }}
                />
                {`SDK ${SDK_LABELS[s]}`}
              </div>
              <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 10 }}>
                {String(counts[s])}
              </div>
              <div style={{ fontSize: 20, color: OG.muted, marginTop: 2 }}>{BLURB[s]}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            color: OG.muted,
            borderTop: `1px solid ${OG.line}`,
            paddingTop: 18,
          }}
        >
          <div>Every fact has a source URL and a last-checked date.</div>
          {latest && <div>{`Last checked ${isoDate(latest)}`}</div>}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
