"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16 max-w-[50ch]">
      <h1 className="text-2xl font-semibold tracking-tight">Could not load robots.</h1>
      <p className="mt-2 text-muted text-sm">
        The database did not answer. Try again, or go back to the index. If this keeps happening the Supabase project may be paused or the environment variables are missing.
      </p>
      <p className="mt-2 text-xs text-muted break-all">{error.message}</p>
      <div className="mt-4 flex gap-4 text-sm">
        <button onClick={reset} className="text-accent hover:underline">Try again</button>
        <Link href="/" className="text-accent hover:underline">Back to the index</Link>
      </div>
    </div>
  );
}
