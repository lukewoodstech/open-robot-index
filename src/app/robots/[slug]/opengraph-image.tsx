import { ImageResponse } from "next/og";
import { getRobot, getRobotSlugs } from "@/lib/data";
import { isoDate, usd } from "@/lib/format";
import { OG, OG_CONTENT_TYPE, OG_SDK, OG_SIZE, nameSize, ogFonts, ogHero } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";
import {
  FORM_LABELS,
  SDK_LABELS,
  SDK_VERDICT,
  entryTier,
  sdkTier,
} from "@/lib/types";

export const alt = "Robot card: the robot, its SDK access tier and its entry price.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  const slugs = await getRobotSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [r, fonts] = await Promise.all([getRobot(slug), ogFonts()]);
  if (!r) {
    return new ImageResponse(<Fallback />, { ...OG_SIZE, fonts });
  }

  const hero = await ogHero(r);
  const tone = OG_SDK[r.sdk_access];
  const entry = entryTier(r);
  const sdkT = sdkTier(r);
  // Worth its own line only when the SDK costs more than getting in the door.
  const sdkPriceLine =
    sdkT && sdkT.price_usd != null && sdkT.id !== entry?.id
      ? `SDK from ${usd(sdkT.price_usd)} · ${sdkT.tier_name}`
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: OG.bg,
          color: OG.text,
          fontFamily: "Geist",
        }}
      >
        {/* Hero left, SDK verdict right: the robot page, at card scale. */}
        <div
          style={{
            width: 500,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: OG.panel,
            borderRight: `1px solid ${OG.line}`,
          }}
        >
          {hero ? (
            <img src={hero} width={500} height={630} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: OG.muted }}>
              <div style={{ fontSize: 30, color: OG.text }}>{FORM_LABELS[r.form]}</div>
              <div style={{ fontSize: 22, marginTop: 8 }}>No manufacturer image yet</div>
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "44px 48px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, color: OG.muted }}>
              {`${r.company.name} · ${FORM_LABELS[r.form]}`}
            </div>
            <div
              style={{
                fontSize: nameSize(r.name),
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                marginTop: 10,
              }}
            >
              {r.name}
            </div>

            <div style={{ display: "flex", marginTop: 26 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 24,
                  color: tone.fg,
                  backgroundColor: tone.tint,
                  border: `2px solid ${tone.edge}`,
                  borderRadius: 10,
                  padding: "7px 16px",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: tone.fg,
                    marginRight: 10,
                  }}
                />
                {`SDK ${SDK_LABELS[r.sdk_access]}`}
              </div>
            </div>

            <div style={{ fontSize: 25, color: OG.muted, lineHeight: 1.35, marginTop: 20 }}>
              {SDK_VERDICT[r.sdk_access]}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 21, color: OG.muted }}>
              {`Entry price${entry ? ` · ${entry.tier_name}` : ""}`}
            </div>
            <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4 }}>
              {usd(entry?.price_usd)}
            </div>
            {sdkPriceLine && (
              <div style={{ fontSize: 21, color: OG.muted, marginTop: 8 }}>{sdkPriceLine}</div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 19,
                color: OG.muted,
                borderTop: `1px solid ${OG.line}`,
                marginTop: 22,
                paddingTop: 16,
              }}
            >
              <div>{SITE_NAME}</div>
              <div>{`Checked ${isoDate(r.last_checked)}`}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

function Fallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG.bg,
        color: OG.muted,
        fontFamily: "Geist",
        fontSize: 32,
      }}
    >
      {SITE_NAME}
    </div>
  );
}
