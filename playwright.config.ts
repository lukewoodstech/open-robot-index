import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests run against a production build on a port of their own, so a
 * `next dev` left running on 3000 is never mistaken for the build under test.
 *
 * No Supabase env is set here or in CI, so `src/lib/data.ts` serves
 * `src/data/seed.ts`. That keeps the suite deterministic and secret-free: the
 * tests assert shape (row counts, a source list, two compare columns, form
 * validation) rather than any one robot's price.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // `next start` needs `npm run build` to have run first; CI builds in the step
  // before this one.
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
