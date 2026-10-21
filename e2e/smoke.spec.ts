import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * The paths that have to work for the site to do its job: the index lists the
 * robots and its filters narrow them, a robot page shows where its facts came
 * from, compare puts two robots side by side, and a correction cannot be sent
 * without a source.
 *
 * Everything is derived from what the page renders — no slug or price is
 * hard-coded — so adding a robot never breaks the suite.
 */

/** The one data row per robot in the desktop table (the expand panel has no aria-expanded). */
function indexRows(page: Page): Locator {
  return page.locator("table tbody tr[aria-expanded]");
}

/** "Full details and sources →", one per row, carries each robot's slug. */
function robotLinks(page: Page): Locator {
  return page.locator('table a[href^="/robots/"]');
}

/** The "shown of total" counter in the filter bar. It grows a Clear button
 *  once a filter is on, so it is matched on its leading text. */
function counter(page: Page): Locator {
  return page.getByText(/^\d+ of \d+/);
}

async function failsValidation(target: Locator): Promise<boolean> {
  return target.evaluate((el: HTMLInputElement | HTMLSelectElement) => !el.checkValidity());
}

test("the index lists every robot with its SDK state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Robots you can actually program.");

  const count = await indexRows(page).count();
  expect(count).toBeGreaterThanOrEqual(20);

  // The counter in the filter bar agrees with the rows actually rendered.
  await expect(counter(page)).toContainText(`${count} of ${count}`);

  // Color only ever means SDK state, so every row has to carry that badge.
  await expect(page.locator('table [title^="SDK access:"]')).toHaveCount(count);
});

test("the SDK filter narrows the table and Clear restores it", async ({ page }) => {
  await page.goto("/");
  const all = await indexRows(page).count();

  await page.getByRole("button", { name: "Full", exact: true }).click();
  const full = await indexRows(page).count();
  expect(full).toBeGreaterThan(0);
  expect(full).toBeLessThanOrEqual(all);

  // The counter reads "shown of total", and only full-SDK rows survive the chip.
  await expect(counter(page)).toContainText(`${full} of ${all}`);
  await expect(page.locator('table tbody tr[aria-expanded] [title^="SDK access:"]')).toHaveText(
    Array(full).fill("Full"),
  );

  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(indexRows(page)).toHaveCount(all);
});

test("a robot page shows its sources with retrieval dates", async ({ page }) => {
  await page.goto("/");
  const href = await robotLinks(page).first().getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!);
  // The SDK verdict is the page's reason to exist, and it sits above the fold.
  await expect(page.locator('[title^="SDK access:"]').first()).toBeVisible();

  const sources = page.locator("section").filter({ has: page.getByRole("heading", { name: "Sources" }) });
  const items = sources.locator("li");
  expect(await items.count()).toBeGreaterThan(0);
  // Every source is a real link with a date on it.
  await expect(items.first().locator('a[href^="http"]')).toBeVisible();
  await expect(sources).toContainText("Retrieved");
  await expect(sources.getByRole("link", { name: /^Report a correction for / })).toBeVisible();
});

test("compare renders two robots side by side", async ({ page }) => {
  await page.goto("/");
  const links = robotLinks(page);
  const slugs = await Promise.all(
    [0, 1].map(async (i) => (await links.nth(i).getAttribute("href"))!.split("/").pop()!),
  );
  expect(new Set(slugs).size).toBe(2);

  await page.goto(`/compare?a=${slugs[0]}&b=${slugs[1]}`);
  await expect(page.getByText("Pick at least two robots.")).toHaveCount(0);

  // One spacer column plus one per robot, each headed by a link back to it.
  const table = page.locator("table");
  await expect(table.locator("thead th")).toHaveCount(3);
  for (const slug of slugs) {
    await expect(table.locator(`thead a[href="/robots/${slug}"]`)).toBeVisible();
  }
  // The rows every comparison must answer.
  for (const label of ["SDK access", "From", "Open hardware", "LeRobot", "Last checked"]) {
    await expect(table.locator("tbody th", { hasText: new RegExp(`^${label}$`) })).toBeVisible();
  }
});

test("the corrections form will not submit without a robot, a value and a source URL", async ({ page }) => {
  await page.goto("/corrections");
  const form = page.locator("form");
  const submit = page.getByRole("button", { name: "Send to review" });

  // Empty: the submit is blocked and the required robot select is what blocks it.
  await submit.click();
  await expect(page).toHaveURL(/\/corrections$/);
  expect(await failsValidation(form.locator('select[name="robot"]'))).toBe(true);

  // Filled in, but the source is not a URL: still blocked, now on that field.
  await form.locator('select[name="robot"]').selectOption({ index: 1 });
  await form.locator('input[name="after"]').fill("$1,234 as of today");
  await form.locator('input[name="url"]').fill("not-a-url");
  await submit.click();
  await expect(page).toHaveURL(/\/corrections$/);
  expect(await failsValidation(form.locator('input[name="url"]'))).toBe(true);

  // With a real source the form satisfies every constraint. It is checked, not
  // sent: sending writes a proposal, and the suite runs without a database.
  await form.locator('input[name="url"]').fill("https://example.com/price");
  expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(true);
  await expect(page.getByRole("heading", { name: "Thanks." })).toHaveCount(0);
});
