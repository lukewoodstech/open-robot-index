import { expect, test, type APIResponse } from "@playwright/test";

/**
 * The digest weeks have their own Open Graph cards. A week unfurls on its own
 * terms — naming the week and its counts — and an empty week has to unfurl too,
 * because an empty week is still a real page people link to.
 *
 * Nothing here hard-codes a week id: the ids are read off /digest, and an empty
 * week is found by walking back from the current one, so a re-check that moves
 * the dates does not break the suite.
 */

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** A 1200x630 PNG, read from the IHDR chunk that follows the signature. */
async function assertOgCard(res: APIResponse, what: string) {
  expect(res.status(), `${what} did not render`).toBe(200);
  expect(res.headers()["content-type"], `${what} was not a PNG`).toContain("image/png");
  const body = await res.body();
  expect(body.subarray(0, 8).equals(PNG), `${what} was not PNG bytes`).toBe(true);
  expect(body.readUInt32BE(16), `${what} was the wrong width`).toBe(1200);
  expect(body.readUInt32BE(20), `${what} was the wrong height`).toBe(630);
}

/** Every week id listed on /digest, newest first. */
async function weekIds(page: import("@playwright/test").Page): Promise<string[]> {
  await page.goto("/digest");
  const hrefs = await page.locator('a[href^="/digest/"]').evaluateAll((as) =>
    as.map((a) => a.getAttribute("href") ?? ""),
  );
  const ids = hrefs.map((h) => h.replace("/digest/", "")).filter((id) => /^\d{4}-W\d{2}$/.test(id));
  expect(ids.length, "/digest listed no weeks").toBeGreaterThan(0);
  return [...new Set(ids)];
}

test("a week with content renders its own card", async ({ page, request }) => {
  const ids = await weekIds(page);

  // The weeks on /digest that actually report something; the in-progress week
  // at the top may well be empty.
  let withContent: string | null = null;
  for (const id of ids) {
    await page.goto(`/digest/${id}`);
    const hasCounts = await page.getByRole("heading", { name: "What changed for buyers" }).count();
    if (hasCounts > 0) {
      withContent = id;
      break;
    }
  }
  expect(withContent, "no digest week reported any content").not.toBeNull();

  await assertOgCard(
    await request.get(`/digest/${withContent}/opengraph-image`),
    `the card for ${withContent}`,
  );
});

test("an empty week still renders a card", async ({ page, request }) => {
  // Walk back from the current week to the first one that reports nothing.
  const [newest] = await weekIds(page);
  const [year, week] = newest.split("-W").map(Number);

  let empty: string | null = null;
  for (let i = 0; i < 12 && week - i >= 1; i++) {
    const id = `${year}-W${String(week - i).padStart(2, "0")}`;
    const res = await page.goto(`/digest/${id}`);
    if (res?.status() !== 200) continue;
    if (await page.getByText("Nothing cleared the review queue").count()) {
      empty = id;
      break;
    }
  }
  expect(empty, "found no empty week to check").not.toBeNull();

  await assertOgCard(await request.get(`/digest/${empty}/opengraph-image`), `the card for ${empty}`);
});

test("a week page points at its own card and the site default is unchanged", async ({
  page,
  request,
}) => {
  const [newest] = await weekIds(page);
  await page.goto(`/digest/${newest}`);
  const og = page.locator('meta[property="og:image"]');
  await expect(og).toHaveCount(1);
  expect(await og.getAttribute("content")).toContain(`/digest/${newest}/opengraph-image`);

  // The site default is its own card, not a digest week's.
  await page.goto("/");
  const site = page.locator('meta[property="og:image"]');
  await expect(site).toHaveCount(1);
  const siteUrl = await site.getAttribute("content");
  expect(siteUrl).toContain("/opengraph-image");
  expect(siteUrl).not.toContain("/digest/");
  await assertOgCard(await request.get("/opengraph-image"), "the site default card");
});
