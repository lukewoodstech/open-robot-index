import { ageLabel } from "@/lib/format";
import type { ProposalKind } from "@/lib/proposals";

/**
 * Review-queue health.
 *
 * The queue page used to say only how many proposals were pending, which is
 * the one number that cannot tell you whether the queue is healthy: ten
 * filed this morning and one sitting since September both read as a count.
 * This derives the two facts that do — how old the oldest decision is, and
 * what kinds are waiting — from the rows themselves, so the summary and the
 * table can never disagree.
 *
 * Read-only by construction: nothing here approves, rejects or applies
 * anything, and the auto-approval policy in `src/lib/proposals.ts` is
 * untouched.
 */

/**
 * A pending proposal older than this is called out rather than just counted.
 * The agents run weekly at their slowest, so a proposal that has outlived one
 * full cycle of its own author is a backlog, not a queue.
 */
export const QUEUE_OVERDUE_DAYS = 7;

/** Singular and plural wording for each kind, in the queue's own vocabulary. */
export const KIND_LABELS: Record<ProposalKind, [one: string, many: string]> = {
  tier_update: ["tier update", "tier updates"],
  field_update: ["field update", "field updates"],
  new_robot: ["new robot", "new robots"],
  news_item: ["news item", "news items"],
};

/** Tie-break order when two kinds have the same count: cheapest decision first. */
const KIND_ORDER: ProposalKind[] = ["tier_update", "field_update", "news_item", "new_robot"];

export interface QueueRow {
  kind: ProposalKind;
  created_at: string;
}

export interface QueueAge {
  /** The row's own timestamp, kept so the page can show the exact date. */
  created_at: string;
  /** Whole days waited. */
  days: number;
  /** The wait in words: "4 hours ago", "9 days ago". */
  age: string;
  /** Past the review window, so the page marks it rather than just printing it. */
  overdue: boolean;
}

export interface KindCount {
  kind: ProposalKind;
  count: number;
  /** "4 tier updates", already pluralised. */
  label: string;
}

export interface QueueHealth {
  /** Total pending. Always equal to the sum of `byKind`. */
  pending: number;
  /** The longest-waiting pending proposal, or null when the queue is clear. */
  oldest: QueueAge | null;
  /** Non-zero kinds only, most waiting first. */
  byKind: KindCount[];
}

/**
 * How long ago a timestamp was, in words.
 *
 * Proposals carry a real time, not a date, so a queue that was emptied an hour
 * ago should not read "today" the way a checked-on date does. Below a day this
 * counts in minutes and hours; at a day and over it hands off to the same
 * wording the freshness marks use, so one page never has two vocabularies for
 * the same span of time.
 */
export function elapsed(iso: string, now: Date): { days: number; age: string } | null {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const ms = now.getTime() - then;
  if (ms < 0) return { days: 0, age: "dated ahead" };
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return { days: 0, age: "just now" };
  if (minutes < 60) return { days: 0, age: minutes === 1 ? "1 minute ago" : `${minutes} minutes ago` };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { days: 0, age: hours === 1 ? "1 hour ago" : `${hours} hours ago` };
  const days = Math.floor(hours / 24);
  return { days, age: ageLabel(days) };
}

/** The health summary for a set of pending proposals. */
export function queueHealth(rows: QueueRow[], now: Date): QueueHealth {
  const counts = new Map<ProposalKind, number>();
  let oldestRow: QueueRow | null = null;

  for (const row of rows) {
    counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
    const t = new Date(row.created_at).getTime();
    if (Number.isNaN(t)) continue;
    if (!oldestRow || t < new Date(oldestRow.created_at).getTime()) oldestRow = row;
  }

  const byKind: KindCount[] = [...counts.entries()]
    .map(([kind, count]) => ({
      kind,
      count,
      label: `${count} ${KIND_LABELS[kind][count === 1 ? 0 : 1]}`,
    }))
    .sort((a, b) => b.count - a.count || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

  let oldest: QueueAge | null = null;
  if (oldestRow) {
    const e = elapsed(oldestRow.created_at, now);
    if (e) oldest = { created_at: oldestRow.created_at, days: e.days, age: e.age, overdue: e.days >= QUEUE_OVERDUE_DAYS };
  }

  return { pending: rows.length, oldest, byKind };
}
