import { expect, test, type Page } from "@playwright/test";

/**
 * Every robot carries a `last_checked` date, and a bare date lets a fact age
 * quietly: "3 Sep 2026" looks the same the week it was checked and a year
 * later. These specs assert the age is rendered, that it is derived from the
 * date on the row rather than written in, and that a row past the window is
 * marked rather than left to the reader to work out.
 *
 * Nothing here hard-codes a date or a count. Each row exposes its own
 * `data-checked` and `data-stale`, so the suite still passes after a re-check
 * moves the dates.
 */

/** The window the site treats as stale, mirroring STALE_AFTER_DAYS. */
const STALE_AFTER_DAYS = 60;

/** Midnight UTC today — the same instant `todayIso()` reduces to on the server. */
const TODAY_UTC = (() => {
  const n = new Date();
  return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
})();

function daysSince(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((TODAY_UTC - Date.UTC(y, m - 1, d)) / 86_400_000);
}

/**
 * The page is prerendered, so its "today" can be a build earlier than the
 * test's. That only matters for a row sitting on the boundary, which is
 * skipped rather than asserted either way.
 */
function onBoundary(days: number): boolean {
  return Math.abs(days - STALE_AFTER_DAYS) <= 1;
}

async function rowFreshness(page: Page) {
  return page.locator("table tbody tr[data-robot-row]").evaluateAll((rows) =>
    rows.map((row) => ({
      checked: row.getAttribute("data-checked") ?? "",
      stale: row.getAttribute("data-stale") === "true",
      // The age lives in the row's last cell, the Checked column.
      age: (row.querySelector("td:last-child")?.textContent ?? "").trim(),
    })),
  );
}

test("every index row shows an age derived from its own checked date", async ({ page }) => {
  await page.goto("/");
  const rows = await rowFreshness(page);
  expect(rows.length).toBeGreaterThanOrEqual(20);

  for (const row of rows) {
    expect(row.checked, "a row rendered without a checked date").toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Every row says how old it is, in words, not just a date.
    expect(row.age, `${row.checked} rendered no age`).toMatch(
      /today|yesterday|\d+ (days|weeks|months?) ago/,
    );

    const days = daysSince(row.checked);
    if (onBoundary(days)) continue;
    expect(row.stale, `${row.checked} is ${days} days old but data-stale=${row.stale}`).toBe(
      days >= STALE_AFTER_DAYS,
    );
  }
});

test("a stale row is marked, and the index says how many are due", async ({ page }) => {
  await page.goto("/");
  const rows = await rowFreshness(page);
  const due = rows.filter((r) => r.stale).length;

  const summary = page.getByText(/robots? (have|has) gone more than \d+ days/);
  if (due === 0) {
    // Nothing overdue, so there is nothing to announce.
    await expect(summary).toHaveCount(0);
    return;
  }

  // Nothing goes stale silently: the count on the page is the count in the table.
  await expect(summary).toContainText(`${due} of ${rows.length}`);
  await expect(summary).toContainText(String(STALE_AFTER_DAYS));

  // The mark itself explains the window on hover rather than only looking different.
  const marks = page.locator(`table tbody tr[data-stale="true"] td:last-child [title*="re-check window"]`);
  await expect(marks).toHaveCount(due);
});

test("sorting by Checked brings the oldest check to the top", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sort by Checked" }).click();

  const dates = (await rowFreshness(page)).map((r) => r.checked);
  expect(dates.length).toBeGreaterThan(1);
  // ISO dates sort lexicographically; ascending means oldest first.
  expect(dates).toEqual([...dates].sort());

  await expect(page.locator('table thead th[aria-sort="ascending"]')).toHaveCount(1);
});

test("a robot page dates its facts and says when they are overdue", async ({ page }) => {
  await page.goto("/");
  const rows = await rowFreshness(page);
  const stale = rows.find((r) => r.stale && !onBoundary(daysSince(r.checked)));
  const href = await page.locator('table a[href^="/robots/"]').first().getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!);
  // The SDK verdict block carries the exact date and the age next to it.
  const verdict = page.locator("aside").first();
  // en-GB abbreviates September to "Sept", so the month is 3 to 5 letters.
  await expect(verdict).toContainText(/\d{1,2} \w{3,5} \d{4}/);
  await expect(verdict.locator('[title*="Checked"]')).toHaveCount(1);

  if (!stale) return;
  // With something overdue in the table, an overdue robot page says so in words.
  await page.goto(`/robots/${await firstStaleSlug(page)}`);
  await expect(page.getByText(/last checked .*more than \d+ days/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "report a correction" }).first()).toBeVisible();
});

/** The slug of the first row the table marks stale. */
async function firstStaleSlug(page: Page): Promise<string> {
  await page.goto("/");
  const href = await page
    .locator('table tbody tr[data-stale="true"]')
    .first()
    .evaluate((row) => {
      // The row's expand panel follows it and holds the "Full details" link.
      const panel = row.nextElementSibling;
      return panel?.querySelector('a[href^="/robots/"]')?.getAttribute("href") ?? "";
    });
  expect(href).toMatch(/^\/robots\//);
  return href.replace("/robots/", "");
}
