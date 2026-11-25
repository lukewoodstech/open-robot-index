import { expect, test, type Page } from "@playwright/test";

/**
 * Filtering the index has to be audible, not only visible.
 *
 * The "N of M" counter is the only thing on the page that says a chip or a
 * select did anything, so it is a polite live region; the "No robots match"
 * panel is a second one, because when the table goes it takes every visible
 * clue with it.
 *
 * An announcement is a change to a live region after the document is parsed.
 * So "nothing is announced on first paint" is asserted twice over: the server
 * already renders the full count (the region is not an empty box a script
 * fills in), and the text is still that same string when the first click lands
 * (hydration did not repaint it).
 */

const ROWS = "table tbody tr[data-robot-row]";

function region(page: Page) {
  return page.locator("[data-filter-status]");
}

/** The count the region is currently reading out. */
async function shown(page: Page): Promise<number> {
  const text = (await region(page).textContent()) ?? "";
  const match = /^(\d+) of (\d+)/.exec(text);
  if (!match) throw new Error(`the counter did not read "N of M": ${JSON.stringify(text)}`);
  return Number(match[1]);
}

test.describe("with scripting off", () => {
  test.use({ javaScriptEnabled: false });

  test("the server renders the full count inside the region", async ({ page }) => {
    // Parsed, not loaded: with scripting off the `load` event never settles
    // here, and the markup is complete well before it would.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const total = await page.locator(ROWS).count();
    expect(total).toBeGreaterThan(0);
    // Not "" and not "0 of 0": a region that starts empty and is filled on
    // mount announces itself to a screen reader the moment the page settles.
    await expect(region(page)).toHaveText(`${total} of ${total} robots shown`);
  });
});

test("the counter is a polite live region", async ({ page }) => {
  await page.goto("/");
  const counter = region(page);
  await expect(counter).toHaveAttribute("role", "status");
  await expect(counter).toHaveAttribute("aria-live", "polite");
  // Without this the count reads as a bare changed number.
  await expect(counter).toHaveAttribute("aria-atomic", "true");
  // "9 of 23" out of context names nothing it counted.
  await expect(counter).toContainText("robots shown");
});

test("an SDK chip changes what the live region says", async ({ page }) => {
  await page.goto("/");
  const total = await page.locator(ROWS).count();

  // Read immediately before the first interaction: whatever hydration did, it
  // left the region saying exactly what the server said.
  const before = await region(page).textContent();
  expect(before).toBe(`${total} of ${total} robots shown`);

  await page.getByRole("button", { name: "Full", exact: true }).click();
  const full = await page.locator(ROWS).count();
  expect(full).toBeGreaterThan(0);
  expect(full).toBeLessThan(total);

  const after = await region(page).textContent();
  expect(after).toBe(`${full} of ${total} robots shown`);
  expect(after).not.toBe(before);

  // And back again, so the announcement is not one-way.
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(region(page)).toHaveText(`${total} of ${total} robots shown`);
});

test("the no-match state announces itself", async ({ page }) => {
  await page.goto("/");
  const total = await page.locator(ROWS).count();
  const ceiling = page.getByLabel("Price ceiling");

  // Which combination empties the table is derived, not hard-coded: a cheaper
  // gated robot in the seed changes which pair is used, not whether this runs.
  let emptied = false;
  for (const sdk of ["None", "Gated", "Full"]) {
    await page.getByRole("button", { name: sdk, exact: true }).click();
    for (const limit of ["500", "1000", "3000"]) {
      await ceiling.selectOption(limit);
      if ((await shown(page)) === 0) {
        emptied = true;
        break;
      }
    }
    if (emptied) break;
    await ceiling.selectOption("Infinity");
  }
  expect(emptied, "no SDK and price pair empties the table").toBe(true);

  await expect(region(page)).toHaveText(`0 of ${total} robots shown`);
  await expect(page.locator(ROWS)).toHaveCount(0);

  const empty = page.locator("[data-empty-state]");
  await expect(empty).toHaveAttribute("role", "status");
  await expect(empty).toHaveAttribute("aria-live", "polite");
  await expect(empty).toContainText("No robots match.");
  // The message has to say what to do about it, not just that it happened.
  await expect(empty).toContainText("Raise or clear the price filter");
  // The way out is a control the user operates, so it sits outside the
  // announcement rather than being read as part of it.
  await expect(empty.getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Clear all filters" })).toBeVisible();
});
