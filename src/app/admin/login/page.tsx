import type { Metadata } from "next";
import { signIn } from "./actions";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
      <p className="mt-1 text-sm text-muted">Review queue access only.</p>
      <form action={signIn} className="mt-6 space-y-3">
        <input type="hidden" name="next" value={next ?? "/admin/review"} />
        <label className="block text-sm">
          <span className="text-muted">Email</span>
          <input name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" />
        </label>
        {error && <p className="text-sm text-sdk-none">{error}</p>}
        <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg">Sign in</button>
      </form>
    </div>
  );
}
