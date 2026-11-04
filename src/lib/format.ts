export function usd(n: number | null | undefined): string {
  if (n == null) return "Quote";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function isoDate(d: string): string {
  // Render ISO dates as "3 Sep 2026" without timezone drift.
  const [y, m, day] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function num(n: number | null | undefined, unit = ""): string {
  if (n == null) return "—";
  return `${n}${unit}`;
}

/**
 * How long a fact may go unchecked before the site calls it stale. A price or
 * an availability line two months old is not a lie, but it is not evidence
 * either, so the row says so rather than letting the date sit there quietly.
 */
export const STALE_AFTER_DAYS = 60;

/**
 * Today as an ISO date, UTC.
 *
 * Ages are always derived from a date computed on the server and passed down.
 * A client component that read its own clock would render a different age than
 * the server put in the HTML, and the index is revalidated hourly, so the two
 * would disagree on every hydration.
 */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function utcDay(d: string): number {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day) / 86_400_000;
}

/** Whole days between two ISO dates, in UTC, so no timezone or DST drift. */
export function daysSince(iso: string, today: string): number {
  return Math.round(utcDay(today) - utcDay(iso));
}

export interface Freshness {
  /** Age in whole days. Negative if the date is in the future. */
  days: number;
  /** The age alone, no leading verb: "today", "9 weeks ago". */
  age: string;
  /** Past the re-check window, so the fact is shown as due. */
  stale: boolean;
}

/** The coarsest unit that still reads honestly for a given age. */
function ageLabel(days: number): string {
  if (days < 0) return "dated ahead";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 70) return `${Math.round(days / 7)} weeks ago`;
  const months = Math.round(days / 30.44);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
}

/** How old a checked date is, relative to a server-supplied today. */
export function freshness(iso: string, today: string): Freshness {
  const days = daysSince(iso, today);
  return { days, age: ageLabel(days), stale: days >= STALE_AFTER_DAYS };
}
