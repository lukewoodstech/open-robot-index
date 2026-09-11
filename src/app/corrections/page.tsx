import type { Metadata } from "next";
import Link from "next/link";
import { getRobots } from "@/lib/data";
import { EDITABLE_ROBOT_FIELDS } from "@/lib/proposals";
import { submitCorrection } from "./actions";

export const metadata: Metadata = { title: "Report a correction" };
export const dynamic = "force-dynamic";

export default async function CorrectionsPage({ searchParams }: { searchParams: Promise<{ robot?: string; sent?: string; error?: string }> }) {
  const { robot, sent, error } = await searchParams;
  const robots = await getRobots();

  if (sent) {
    return (
      <div className="max-w-[60ch]">
        <h1 className="text-2xl font-semibold tracking-tight">Thanks.</h1>
        <p className="mt-2 text-sm text-muted">
          Your correction is in the review queue. Nothing changes on the site until a human checks the source you gave.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-accent hover:underline">Back to the index</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[60ch]">
      <h1 className="text-2xl font-semibold tracking-tight">Report a correction</h1>
      <p className="mt-2 text-sm text-muted">
        Wrong price, tier, SDK claim or spec? Tell us the right value and link to a page that shows it. Corrections go into the same review queue as agent proposals.
      </p>
      <form action={submitCorrection} className="mt-6 space-y-4 text-sm">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="block">
          <span className="text-muted">Robot</span>
          <select name="robot" defaultValue={robot ?? ""} required className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2">
            <option value="" disabled>Choose a robot</option>
            {robots.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-muted">What is wrong</span>
          <select name="field" defaultValue="price" className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2">
            <option value="price">Price or tier</option>
            {EDITABLE_ROBOT_FIELDS.map((f) => <option key={f} value={f}>{f.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-muted">Tier name (if price)</span>
          <input name="tier" className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" placeholder="e.g. Go2 Pro" />
        </label>
        <label className="block">
          <span className="text-muted">Correct value</span>
          <input name="after" required className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" placeholder="e.g. $2,499 as of today" />
        </label>
        <label className="block">
          <span className="text-muted">Source URL that shows it</span>
          <input name="url" type="url" required className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" placeholder="https://" />
        </label>
        <label className="block">
          <span className="text-muted">Anything else</span>
          <textarea name="note" rows={3} className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" />
        </label>
        {error && <p className="text-sdk-none">{error}</p>}
        <button className="rounded-md bg-accent px-4 py-2 font-medium text-bg">Send to review</button>
      </form>
    </div>
  );
}
