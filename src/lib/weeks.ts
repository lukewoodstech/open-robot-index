/**
 * ISO-8601 week helpers for the weekly digest.
 *
 * Weeks run Monday to Sunday and week 1 is the week holding the first Thursday
 * of the year. All arithmetic is in UTC so a digest covers the same seven days
 * whatever timezone the reader or the build machine is in.
 */

const DAY = 86_400_000;

export interface Week {
  /** `2026-W42`. */
  id: string;
  /** Monday, as `YYYY-MM-DD`. */
  start: string;
  /** Sunday, as `YYYY-MM-DD`. */
  end: string;
}

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The Monday of the ISO week holding `d`, at midnight UTC. */
function isoMonday(d: Date): Date {
  const weekday = d.getUTCDay() || 7; // Monday 1 … Sunday 7
  const midnight = utc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  return new Date(midnight.getTime() - (weekday - 1) * DAY);
}

function pad(week: number): string {
  return String(week).padStart(2, "0");
}

/** The ISO week id holding `d`, e.g. `2026-W42`. */
export function isoWeekId(d: Date): string {
  const monday = isoMonday(d);
  // The Thursday of the week decides which year the week belongs to.
  const year = new Date(monday.getTime() + 3 * DAY).getUTCFullYear();
  const week1 = isoMonday(utc(year, 1, 4));
  const week = Math.round((monday.getTime() - week1.getTime()) / (7 * DAY)) + 1;
  return `${year}-W${pad(week)}`;
}

/** The ISO week id holding a `YYYY-MM-DD` date, or an ISO timestamp's date part. */
export function weekOf(date: string): string {
  return isoWeekId(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

/** Parse `2026-W42` into its Monday and Sunday. Null when the id is not a real week. */
export function parseWeekId(id: string): Week | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(id);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  const start = new Date(isoMonday(utc(year, 1, 4)).getTime() + (week - 1) * 7 * DAY);
  // A 53rd week only exists in some years; when it does not, the Monday above
  // lands in the next year's week 1 and the round trip catches it.
  if (isoWeekId(start) !== `${year}-W${pad(week)}`) return null;
  return { id, start: ymd(start), end: ymd(new Date(start.getTime() + 6 * DAY)) };
}

/** The week `delta` weeks from `id`, or null if that is not a real week. */
export function shiftWeek(id: string, delta: number): Week | null {
  const w = parseWeekId(id);
  if (!w) return null;
  const monday = new Date(`${w.start}T00:00:00Z`);
  return parseWeekId(isoWeekId(new Date(monday.getTime() + delta * 7 * DAY)));
}

/** The week holding today. */
export function currentWeek(now: Date = new Date()): Week {
  const w = parseWeekId(isoWeekId(now));
  if (!w) throw new Error(`Could not resolve the current ISO week from ${now.toISOString()}`);
  return w;
}

/** True when the week has not started yet. */
export function isFuture(w: Week, now: Date = new Date()): boolean {
  return w.start > ymd(now);
}

/** True when a `YYYY-MM-DD` date falls inside the week. */
export function inWeek(date: string, w: Week): boolean {
  const d = date.slice(0, 10);
  return d >= w.start && d <= w.end;
}
