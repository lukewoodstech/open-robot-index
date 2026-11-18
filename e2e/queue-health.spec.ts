import { expect, test } from "@playwright/test";
import { QUEUE_OVERDUE_DAYS, elapsed, queueHealth, type QueueRow } from "../src/lib/queue-health";

/**
 * The review-queue health summary.
 *
 * `/admin/review` is behind the admin session, so there is no page here to
 * drive without a secret. What matters is derived rather than rendered: the
 * summary is computed from the same pending rows the table is built from, so
 * these assert that the counts add up, that the oldest wait is the oldest row,
 * and that the overdue mark flips exactly at the window — the three ways the
 * header could lie about a backlog.
 */

const NOW = new Date("2026-11-18T12:00:00.000Z");

/** A pending row filed `days` days and `hours` hours before NOW. */
function row(kind: QueueRow["kind"], days: number, hours = 0): QueueRow {
  const t = NOW.getTime() - days * 86_400_000 - hours * 3_600_000;
  return { kind, created_at: new Date(t).toISOString() };
}

test("an empty queue reports clear, with no oldest and no kinds", () => {
  const h = queueHealth([], NOW);
  expect(h.pending).toBe(0);
  expect(h.oldest).toBeNull();
  expect(h.byKind).toEqual([]);
});

test("the breakdown adds up to the pending count", () => {
  const rows = [
    row("tier_update", 1),
    row("tier_update", 2),
    row("news_item", 3),
    row("new_robot", 0, 4),
    row("field_update", 9),
  ];
  const h = queueHealth(rows, NOW);
  expect(h.pending).toBe(rows.length);
  expect(h.byKind.reduce((n, k) => n + k.count, 0)).toBe(h.pending);
  // Most waiting first.
  expect(h.byKind[0]).toMatchObject({ kind: "tier_update", count: 2, label: "2 tier updates" });
  // Singular wording where there is one.
  expect(h.byKind.map((k) => k.label)).toContain("1 news item");
});

test("a kind with nothing pending is left out rather than shown as zero", () => {
  const h = queueHealth([row("news_item", 1)], NOW);
  expect(h.byKind.map((k) => k.kind)).toEqual(["news_item"]);
});

test("the oldest wait is the earliest row, in words", () => {
  const oldest = row("field_update", 9);
  const h = queueHealth([row("tier_update", 1), oldest, row("news_item", 3)], NOW);
  expect(h.oldest?.created_at).toBe(oldest.created_at);
  expect(h.oldest?.days).toBe(9);
  expect(h.oldest?.age).toBe("9 days ago");
});

test("overdue flips at the review window, not before", () => {
  const justInside = queueHealth([row("tier_update", QUEUE_OVERDUE_DAYS - 1, 23)], NOW);
  expect(justInside.oldest?.overdue).toBe(false);

  const justOutside = queueHealth([row("tier_update", QUEUE_OVERDUE_DAYS)], NOW);
  expect(justOutside.oldest?.overdue).toBe(true);
});

test("a wait under a day is counted in minutes and hours, not called today", () => {
  expect(elapsed(new Date(NOW.getTime() - 30_000).toISOString(), NOW)?.age).toBe("just now");
  expect(elapsed(new Date(NOW.getTime() - 60_000).toISOString(), NOW)?.age).toBe("1 minute ago");
  expect(elapsed(new Date(NOW.getTime() - 45 * 60_000).toISOString(), NOW)?.age).toBe("45 minutes ago");
  expect(elapsed(new Date(NOW.getTime() - 3_600_000).toISOString(), NOW)?.age).toBe("1 hour ago");
  expect(elapsed(new Date(NOW.getTime() - 5 * 3_600_000).toISOString(), NOW)?.age).toBe("5 hours ago");
  expect(elapsed(new Date(NOW.getTime() - 86_400_000).toISOString(), NOW)?.age).toBe("yesterday");
});

test("longer waits use the same words as the freshness marks", () => {
  expect(elapsed(new Date(NOW.getTime() - 21 * 86_400_000).toISOString(), NOW)?.age).toBe("3 weeks ago");
  expect(elapsed(new Date(NOW.getTime() - 120 * 86_400_000).toISOString(), NOW)?.age).toBe("4 months ago");
});

test("an unparseable or future timestamp never throws", () => {
  expect(elapsed("not a date", NOW)).toBeNull();
  expect(elapsed(new Date(NOW.getTime() + 60_000).toISOString(), NOW)?.age).toBe("dated ahead");

  const h = queueHealth([{ kind: "news_item", created_at: "not a date" }], NOW);
  expect(h.pending).toBe(1);
  expect(h.oldest).toBeNull();
  expect(h.byKind).toEqual([{ kind: "news_item", count: 1, label: "1 news item" }]);
});
