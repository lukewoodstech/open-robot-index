import { RobotTable } from "@/components/robot-table";
import { getRobots } from "@/lib/data";
import { isoDate, usd } from "@/lib/format";
import { entryTier } from "@/lib/types";

export const revalidate = 3600;

export default async function IndexPage() {
  const robots = await getRobots();
  const full = robots.filter((r) => r.sdk_access === "full").length;
  const open = robots.filter((r) => r.open_hardware === "yes").length;
  const prices = robots.map((r) => entryTier(r)?.price_usd).filter((p): p is number => p != null);
  const cheapest = prices.length ? Math.min(...prices) : null;
  const latest = robots.map((r) => r.last_checked).sort().at(-1);

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[0.95] max-w-[16ch]">
            Robots you can actually program.
          </h1>
          <p className="mt-3 text-muted max-w-[56ch]">
            Every robot under $25K with real developer access: which tier unlocks the SDK, what it costs, and a source for each fact.
          </p>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-sm lg:text-right">
          <Stat label="Robots" value={String(robots.length)} />
          <Stat label="Full SDK on every tier" value={String(full)} />
          <Stat label="Open hardware" value={String(open)} />
          <Stat label="Cheapest" value={usd(cheapest)} />
        </dl>
      </div>
      <RobotTable robots={robots} />
      {latest && (
        <p className="mt-6 text-xs text-muted">
          Prices in USD as shown on the cited page. Last checked {isoDate(latest)}. Hover a confidence mark to see what is contested.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="text-2xl tabular-nums leading-none">{value}</dd>
      <dt className="mt-1 text-xs text-muted">{label}</dt>
    </div>
  );
}
