import { expect, test, type Page } from "@playwright/test";

/**
 * The accessibility guarantees, asserted against the rendered page rather than
 * the source: a keyboard can reach and operate the index, collapsed row panels
 * stay out of the tab order, every control has a name, and the colours that
 * carry meaning clear their WCAG AA ratio.
 *
 * Contrast is computed from the colours the browser actually resolves, so
 * editing a token in globals.css fails here rather than on the live site.
 */

/**
 * Contrast ratio between two CSS custom properties on :root. The raw token can
 * be any colour syntax, so it is assigned to an element and read back as the
 * browser's resolved `rgb(...)` before the luminance is taken.
 */
async function tokenContrast(page: Page, a: string, b: string): Promise<number> {
  return page.evaluate(([aName, bName]) => {
    const probe = document.createElement("span");
    document.body.appendChild(probe);

    const luminance = (name: string) => {
      probe.style.color = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      const parts = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g);
      if (!parts) throw new Error(`${name} did not resolve to a colour`);
      const [r, g, b] = parts.slice(0, 3).map(Number);
      const channel = (v: number) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    const la = luminance(aName);
    const lb = luminance(bName);
    probe.remove();
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }, [a, b] as const);
}

/** The browser's resolved `rgb(...)` for a :root custom property. */
async function tokenColor(page: Page, name: string): Promise<string> {
  return page.evaluate((prop) => {
    const probe = document.createElement("span");
    probe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue(prop)
      .trim();
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, name);
}

test("the skip link is the first tab stop and moves focus to main", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skip = page.locator("a.skip-link");
  await expect(skip).toBeFocused();
  // Off-screen until focused, on-screen once it has focus.
  await expect(skip).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("a row expands from the keyboard alone", async ({ page }) => {
  await page.goto("/");

  const toggle = page.locator("table tbody button[aria-expanded]").first();
  const panelId = await toggle.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  // Matched on the attribute, not `#id`, so an id that is legal HTML but not a
  // legal CSS identifier still resolves.
  const panel = page.locator(`[id="${panelId}"]`);

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveAttribute("inert", "");

  // Focus it without a mouse, then operate it with the keyboard.
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(panel).not.toHaveAttribute("inert", "");
  await expect(panel.locator('a[href^="/robots/"]')).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("collapsed row panels are not in the tab order", async ({ page }) => {
  await page.goto("/");

  // Every row's panel holds a "Full details" link. With all rows collapsed none
  // may be reachable, or there is an invisible tab stop behind every row.
  const total = await page.locator('table a[href^="/robots/"]').count();
  expect(total).toBeGreaterThanOrEqual(20);

  const reachable = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('table a[href^="/robots/"]')).filter(
        (el) => !el.closest("[inert]"),
      ).length,
  );
  expect(reachable).toBe(0);
});

test("sortable headers report their sort state and say what they do", async ({ page }) => {
  await page.goto("/");

  // The table opens sorted by price, and only that one header says so.
  const sorted = page.locator("table thead th[aria-sort]");
  await expect(sorted).toHaveCount(1);
  await expect(sorted).toHaveAttribute("aria-sort", "ascending");

  // The button's name is the action, not just the column heading.
  const byName = page.getByRole("button", { name: "Sort by Robot" });
  await byName.click();
  await expect(page.locator('table thead th[aria-sort="ascending"]')).toHaveCount(1);

  // The same header again flips the direction.
  await byName.click();
  await expect(page.locator('table thead th[aria-sort="descending"]')).toHaveCount(1);
});

test("every visible select and text field has an accessible name", async ({ page }) => {
  for (const path of ["/", "/compare", "/corrections"]) {
    await page.goto(path);
    const fields = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "select, input:not([type=hidden]), textarea",
        ),
      )
        .filter((el) => el.getAttribute("aria-hidden") !== "true" && el.offsetParent !== null)
        .map((el) => {
          const id = el.getAttribute("id");
          const forLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
          return {
            tag: el.tagName.toLowerCase(),
            name: el.getAttribute("name") ?? "",
            label:
              el.closest("label")?.textContent?.trim() ||
              forLabel?.textContent?.trim() ||
              el.getAttribute("aria-label") ||
              "",
          };
        }),
    );

    expect(fields.length, `${path} rendered no fields`).toBeGreaterThan(0);
    for (const field of fields) {
      expect(field.label, `${path}: <${field.tag} name="${field.name}"> has no name`).not.toBe("");
    }
  }
});

test("text and control borders clear their WCAG AA ratio", async ({ page }) => {
  await page.goto("/");

  // Body text needs 4.5:1 (WCAG 1.4.3). --muted is the one at risk, grey on grey.
  for (const surface of ["--bg", "--panel", "--panel-2"]) {
    for (const ink of ["--text", "--muted", "--accent"]) {
      expect(
        await tokenContrast(page, ink, surface),
        `${ink} on ${surface}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }

  // The edge of a form control needs 3:1 (WCAG 1.4.11). The decorative --line
  // does not pass, which is why controls use --line-control instead.
  for (const surface of ["--bg", "--panel", "--panel-2"]) {
    expect(
      await tokenContrast(page, "--line-control", surface),
      `--line-control on ${surface}`,
    ).toBeGreaterThanOrEqual(3);
  }

  // The focus ring has to be visible against whatever it lands on.
  for (const surface of ["--bg", "--panel"]) {
    expect(
      await tokenContrast(page, "--accent", surface),
      `focus ring on ${surface}`,
    ).toBeGreaterThanOrEqual(3);
  }
});

test("form controls use the border tone that passes, not the decorative one", async ({ page }) => {
  await page.goto("/corrections");

  const want = await tokenColor(page, "--line-control");
  const controls = page.locator("form select, form input[name], form textarea");
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const control = controls.nth(i);
    // The honeypot is display:none and carries no border.
    if (!(await control.isVisible())) continue;
    const border = await control.evaluate((el) => getComputedStyle(el).borderTopColor);
    const name = await control.getAttribute("name");
    expect(border, `${name} border`).toBe(want);
  }
});
