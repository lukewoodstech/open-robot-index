"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfidenceMark, SdkBadge } from "@/components/badges";
import { RobotThumb, heroImage } from "@/components/robot-thumb";
import { isoDate, usd } from "@/lib/format";
import {
  FORM_LABELS,
  LEROBOT_LABELS,
  entryTier,
  sdkTier,
  type RobotForm,
  type RobotFull,
  type SdkAccess,
} from "@/lib/types";

type SortKey = "name" | "price" | "sdk" | "form" | "lerobot" | "company";
type SortDir = "asc" | "desc";

const PRICE_CEILINGS = [
  { label: "Any price", value: Infinity },
  { label: "≤ $500", value: 500 },
  { label: "≤ $1K", value: 1000 },
  { label: "≤ $3K", value: 3000 },
  { label: "≤ $10K", value: 10000 },
];

const FORM_ORDER: RobotForm[] = ["arm", "bimanual", "desktop", "mobile_base", "mobile_manipulator", "quadruped", "humanoid"];
const SDK_ORDER: Record<SdkAccess, number> = { full: 0, gated: 1, none: 2 };
const LEROBOT_ORDER = { native: 0, supported: 1, compatible: 2, community: 3, none: 4 };

export function RobotTable({ robots }: { robots: RobotFull[] }) {
  const [sdk, setSdk] = useState<SdkAccess | "all">("all");
  const [form, setForm] = useState<RobotForm | "all">("all");
  const [ceiling, setCeiling] = useState<number>(Infinity);
  const [lerobotOnly, setLerobotOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [open, setOpen] = useState<string | null>(null);

  const formTiles = useMemo(() => {
    return FORM_ORDER.map((f) => {
      const list = robots.filter((r) => r.form === f);
      if (list.length === 0) return null;
      const priced = list.map((r) => entryTier(r)?.price_usd).filter((p): p is number => p != null);
      const withImage = list.find((r) => heroImage(r)) ?? list[0];
      return { form: f, count: list.length, from: priced.length ? Math.min(...priced) : null, rep: withImage };
    }).filter((t): t is NonNullable<typeof t> => t != null);
  }, [robots]);

  const rows = useMemo(() => {
    const filtered = robots.filter((r) => {
      if (sdk !== "all" && r.sdk_access !== sdk) return false;
      if (form !== "all" && r.form !== form) return false;
      if (lerobotOnly && r.lerobot_support === "none") return false;
      if (ceiling !== Infinity) {
        const t = entryTier(r);
        if (t?.price_usd == null || t.price_usd > ceiling) return false;
      }
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      let v = 0;
      switch (sortKey) {
        case "name":
          v = a.name.localeCompare(b.name);
          break;
        case "company":
          v = a.company.name.localeCompare(b.company.name);
          break;
        case "form":
          v = FORM_ORDER.indexOf(a.form) - FORM_ORDER.indexOf(b.form);
          break;
        case "sdk":
          v = SDK_ORDER[a.sdk_access] - SDK_ORDER[b.sdk_access];
          break;
        case "lerobot":
          v = LEROBOT_ORDER[a.lerobot_support] - LEROBOT_ORDER[b.lerobot_support];
          break;
        case "price": {
          const pa = entryTier(a)?.price_usd ?? Number.POSITIVE_INFINITY;
          const pb = entryTier(b)?.price_usd ?? Number.POSITIVE_INFINITY;
          v = pa - pb;
          break;
        }
      }
      return v === 0 ? a.name.localeCompare(b.name) : v * dir;
    });
  }, [robots, sdk, form, ceiling, lerobotOnly, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setSdk("all");
    setForm("all");
    setCeiling(Infinity);
    setLerobotOnly(false);
  }

  const filtersActive = sdk !== "all" || form !== "all" || ceiling !== Infinity || lerobotOnly;

  return (
    <div>
      {/* Browse by form: image tiles that double as the form filter. */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
        <div className="flex gap-2 min-w-max sm:min-w-0 sm:grid sm:grid-cols-4 lg:grid-cols-7">
          {formTiles.map((t) => {
            const active = form === t.form;
            const hero = heroImage(t.rep);
            return (
              <button
                key={t.form}
                onClick={() => setForm(active ? "all" : t.form)}
                aria-pressed={active}
                className={`group relative w-[150px] sm:w-auto aspect-[5/4] overflow-hidden rounded-lg border text-left transition-colors ${
                  active ? "border-accent" : "border-line hover:border-muted"
                }`}
              >
                {hero ? (
                  <Image src={hero.url} alt="" fill sizes="(min-width: 1024px) 14vw, (min-width: 640px) 25vw, 150px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-panel-2" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/95 via-bg/70 to-transparent px-3 pt-8 pb-2.5">
                  <div className="text-sm font-medium leading-tight">{FORM_LABELS[t.form]}</div>
                  <div className="text-xs text-muted tabular-nums">
                    {t.count} · from {usd(t.from)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters: one line on desktop, wraps on small screens. */}
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm border-y border-line py-3">
        <div className="flex items-center gap-1" role="group" aria-label="SDK access">
          <Chip active={sdk === "all"} onClick={() => setSdk("all")}>All SDK</Chip>
          <Chip active={sdk === "full"} onClick={() => setSdk("full")} tone="full">Full</Chip>
          <Chip active={sdk === "gated"} onClick={() => setSdk("gated")} tone="gated">Gated</Chip>
          <Chip active={sdk === "none"} onClick={() => setSdk("none")} tone="none">None</Chip>
        </div>

        <Select
          label="Form"
          value={form}
          onChange={(v) => setForm(v as RobotForm | "all")}
          options={[{ value: "all", label: "All forms" }, ...formTiles.map((t) => ({ value: t.form, label: FORM_LABELS[t.form] }))]}
        />

        <Select
          label="Price ceiling"
          value={String(ceiling)}
          onChange={(v) => setCeiling(Number(v))}
          options={PRICE_CEILINGS.map((p) => ({ value: String(p.value), label: p.label }))}
        />

        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lerobotOnly}
            onChange={(e) => setLerobotOnly(e.target.checked)}
            className="size-3.5 accent-accent"
          />
          <span className="text-muted">LeRobot</span>
        </label>

        <span className="ml-auto text-muted tabular-nums">
          {rows.length} of {robots.length}
          {filtersActive && (
            <button onClick={clearFilters} className="ml-3 text-accent hover:underline">
              Clear
            </button>
          )}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center text-muted text-sm">
          <p className="text-text mb-1">No robots match.</p>
          <p>
            {ceiling !== Infinity ? "Raise or clear the price filter" : "Loosen a filter"}
            {sdk !== "all" ? ", or switch SDK to All" : ""}
            {lerobotOnly ? ", or turn off LeRobot" : ""}.
          </p>
          <button onClick={clearFilters} className="mt-4 text-accent hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted text-left">
                  <Th onClick={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir} className="w-[30%]">Robot</Th>
                  <Th onClick={() => toggleSort("form")} active={sortKey === "form"} dir={sortDir}>Form</Th>
                  <Th onClick={() => toggleSort("sdk")} active={sortKey === "sdk"} dir={sortDir}>SDK</Th>
                  <Th onClick={() => toggleSort("price")} active={sortKey === "price"} dir={sortDir} className="text-right">From</Th>
                  <th className="font-normal py-2 pr-3 text-right">SDK tier</th>
                  <Th onClick={() => toggleSort("lerobot")} active={sortKey === "lerobot"} dir={sortDir}>LeRobot</Th>
                  <th className="font-normal py-2 pr-3">Languages</th>
                  <th className="font-normal py-2 pr-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Row key={r.id} r={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-line">
            {rows.map((r) => {
              const t = entryTier(r);
              return (
                <li key={r.id} className="py-3">
                  <Link href={`/robots/${r.slug}`} className="flex items-center gap-3">
                    <RobotThumb r={r} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted truncate">{r.company.name} · {FORM_LABELS[r.form]}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <SdkBadge value={r.sdk_access} />
                        <ConfidenceMark value={r.confidence} note={r.confidence_note} />
                      </div>
                    </div>
                    <div className="tabular-nums text-right shrink-0">{usd(t?.price_usd)}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Row({ r, open, onToggle }: { r: RobotFull; open: boolean; onToggle: () => void }) {
  const entry = entryTier(r);
  const sdkT = sdkTier(r);
  const hero = heroImage(r);
  return (
    <>
      <tr
        className={`border-t border-line cursor-pointer hover:bg-panel ${open ? "bg-panel" : ""}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <td className="py-2 pr-3">
          <div className="flex items-center gap-3">
            <RobotThumb r={r} size={48} />
            <div className="min-w-0">
              <div className="font-medium truncate">{r.name}</div>
              <div className="text-xs text-muted truncate">{r.company.name}</div>
            </div>
          </div>
        </td>
        <td className="py-2 pr-3 text-muted">{FORM_LABELS[r.form]}</td>
        <td className="py-2 pr-3"><SdkBadge value={r.sdk_access} /></td>
        <td className="py-2 pr-3 text-right tabular-nums">{usd(entry?.price_usd)}</td>
        <td className="py-2 pr-3 text-right tabular-nums text-muted">
          {sdkT ? (sdkT.price_usd == null ? "Quote" : sdkT.id === entry?.id ? "same" : usd(sdkT.price_usd)) : "—"}
        </td>
        <td className="py-2 pr-3 text-muted">{LEROBOT_LABELS[r.lerobot_support]}</td>
        <td className="py-2 pr-3 text-muted">{r.languages.join(", ")}</td>
        <td className="py-2 pr-3"><ConfidenceMark value={r.confidence} note={r.confidence_note} /></td>
      </tr>
      <tr className="border-0">
        <td colSpan={8} className="p-0">
          <div className="row-expand" data-open={open}>
            <div>
              <div className="px-3 pb-4 pt-3 grid gap-5 md:grid-cols-[200px_1fr_minmax(240px,300px)] bg-panel border-t border-line/60">
                <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-panel-2 border border-line">
                  {hero ? (
                    <Image src={hero.url} alt={r.name} fill sizes="200px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">No image yet</div>
                  )}
                </div>
                <div>
                  <p className="text-sm leading-relaxed max-w-[70ch]">{r.summary}</p>
                  <p className="mt-3 text-sm">
                    <span className="text-muted">SDK: </span>
                    {r.sdk_note}
                  </p>
                  {r.confidence === "verify" && r.confidence_note && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted">Verify: </span>
                      {r.confidence_note}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>Open hardware: <span className="text-text">{r.open_hardware}</span></span>
                    <span>Availability: <span className="text-text">{r.availability ?? "—"}</span></span>
                    <span>Checked {isoDate(r.last_checked)}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <table className="w-full">
                    <tbody>
                      {r.tiers.map((t) => (
                        <tr key={t.id} className="align-top">
                          <td className="py-0.5 pr-2">
                            {t.tier_name}
                            {t.includes_sdk && <span className="ml-1.5 text-xs text-sdk-full">SDK</span>}
                          </td>
                          <td className="py-0.5 text-right tabular-nums whitespace-nowrap">{usd(t.price_usd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link
                    href={`/robots/${r.slug}`}
                    className="mt-3 inline-block text-accent hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Full details and sources →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
  className?: string;
}) {
  return (
    <th
      className={`font-normal py-2 pr-3 ${className}`}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
    >
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-text ${active ? "text-text" : ""}`}
      >
        {children}
        {active && <span aria-hidden className="text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

function Chip({
  children,
  active,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone?: SdkAccess;
}) {
  const toneClass = tone
    ? { full: "text-sdk-full", gated: "text-sdk-gated", none: "text-sdk-none" }[tone]
    : "";
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border px-2.5 py-1 text-xs leading-tight ${
        active ? `border-line bg-panel-2 ${toneClass || "text-text"}` : `border-transparent text-muted hover:text-text`
      }`}
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-text"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
