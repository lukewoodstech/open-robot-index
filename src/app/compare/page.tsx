import type { Metadata } from "next";
import Link from "next/link";
import { ConfidenceMark, SdkBadge } from "@/components/badges";
import { RobotThumb } from "@/components/robot-thumb";
import { getRobots } from "@/lib/data";
import { isoDate, num, usd } from "@/lib/format";
import { CONFIDENCE_LABELS, FORM_LABELS, LEROBOT_LABELS, entryTier, sdkTier, type RobotFull } from "@/lib/types";

export const revalidate = 3600;

/** The robots named by ?a=&b=&c=, in order, without repeats. */
async function pickedRobots(sp: CompareParams): Promise<RobotFull[]> {
  const { a, b, c } = await sp;
  const all = await getRobots();
  const slugs = [a, b, c].filter((s): s is string => Boolean(s));
  return Array.from(new Set(slugs))
    .map((s) => all.find((r) => r.slug === s))
    .filter((r): r is RobotFull => Boolean(r));
}

export async function generateMetadata({ searchParams }: { searchParams: CompareParams }): Promise<Metadata> {
  const robots = await pickedRobots(searchParams);
  if (robots.length < 2) {
    return {
      title: "Compare",
      description: "Two or three robots side by side: SDK access, price by tier, open hardware, LeRobot support.",
      alternates: { canonical: "/compare" },
    };
  }
  // The same robots in a different order are the same comparison, so the slugs
  // are sorted before they go into the canonical.
  const query = [...robots]
    .map((r) => r.slug)
    .sort()
    .map((slug, i) => `${"abc"[i]}=${encodeURIComponent(slug)}`)
    .join("&");
  const title = robots.map((r) => r.name).join(" vs ");
  return {
    title,
    description: `${title} compared on SDK access, what the SDK tier costs, open hardware, LeRobot support and availability. Every fact sourced and dated.`,
    alternates: { canonical: `/compare?${query}` },
  };
}

type CompareParams = Promise<{ a?: string; b?: string; c?: string }>;

export default async function ComparePage({ searchParams }: { searchParams: CompareParams }) {
  const { a, b, c } = await searchParams;
  const all = await getRobots();
  const picked = await pickedRobots(searchParams);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Compare</h1>
      <p className="mt-1 text-sm text-muted">Two or three robots side by side, same fields.</p>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" method="get">
        {(["a", "b", "c"] as const).map((k, i) => (
          <label key={k} className="block">
            <span className="text-muted">Robot {i + 1}{i === 2 ? " (optional)" : ""}</span>
            <select name={k} defaultValue={[a, b, c][i] ?? ""} className="mt-1 block rounded-md border border-line bg-panel px-2 py-1.5 min-w-[200px]">
              <option value="">—</option>
              {all.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
            </select>
          </label>
        ))}
        <button className="rounded-md bg-accent px-3 py-1.5 font-medium text-bg">Compare</button>
      </form>

      {picked.length < 2 ? (
        <p className="mt-10 text-sm text-muted">Pick at least two robots.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className="w-40" />
                {picked.map((r) => (
                  <th key={r.id} className="text-left font-normal pb-3 pr-4 align-bottom">
                    <RobotThumb r={r} size={0} className="!w-full aspect-[4/3] mb-2" sizes="33vw" />
                    <Link href={`/robots/${r.slug}`} className="font-medium text-base hover:underline">{r.name}</Link>
                    <div className="text-xs text-muted">{r.company.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="SDK access" cells={picked.map((r) => <SdkBadge key={r.id} value={r.sdk_access} />)} />
              <Row label="SDK note" cells={picked.map((r) => r.sdk_note)} muted />
              <Row label="From" cells={picked.map((r) => usd(entryTier(r)?.price_usd))} />
              <Row label="SDK tier" cells={picked.map((r) => { const t = sdkTier(r); return t ? `${t.tier_name} · ${usd(t.price_usd)}` : "No tier includes an SDK"; })} />
              <Row label="Form" cells={picked.map((r) => FORM_LABELS[r.form])} />
              <Row label="Languages" cells={picked.map((r) => r.languages.join(", "))} />
              <Row label="Open hardware" cells={picked.map((r) => r.open_hardware)} />
              <Row label="LeRobot" cells={picked.map((r) => LEROBOT_LABELS[r.lerobot_support])} />
              <Row label="Simulation" cells={picked.map((r) => r.sim_support ?? "—")} muted />
              <Row label="Availability" cells={picked.map((r) => r.availability ?? "—")} muted />
              <Row label="DoF" cells={picked.map((r) => num(r.dof))} />
              <Row label="Payload" cells={picked.map((r) => num(r.payload_kg, " kg"))} />
              <Row label="Height" cells={picked.map((r) => num(r.height_cm, " cm"))} />
              <Row label="Weight" cells={picked.map((r) => num(r.weight_kg, " kg"))} />
              <Row label="Confidence" cells={picked.map((r) => <ConfidenceMark key={r.id} value={r.confidence} note={r.confidence_note} />)} />
              <Row label="Confidence note" cells={picked.map((r) => r.confidence_note ?? CONFIDENCE_LABELS[r.confidence])} muted />
              <Row label="Last checked" cells={picked.map((r) => isoDate(r.last_checked))} muted />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, cells, muted }: { label: string; cells: React.ReactNode[]; muted?: boolean }) {
  return (
    <tr className="border-t border-line align-top">
      <th className="text-left font-normal text-muted py-2 pr-4">{label}</th>
      {cells.map((c, i) => <td key={i} className={`py-2 pr-4 ${muted ? "text-muted" : ""}`}>{c}</td>)}
    </tr>
  );
}
