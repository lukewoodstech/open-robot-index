import type { Metadata } from "next";
import { ReviewQueue } from "@/components/review-queue";
import type { Proposal } from "@/lib/proposals";
import { currentAdmin, supabaseAdmin } from "@/lib/supabase-server";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Review queue", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const who = await currentAdmin();
  const { status = "pending" } = await searchParams;
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("proposals")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const { count: pendingCount } = await db.from("proposals").select("id", { count: "exact", head: true }).eq("status", "pending");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
          <p className="mt-1 text-sm text-muted">
            {pendingCount ?? 0} pending · Signed in as {who} · Keys: J/K move, A approve, R reject
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <a key={s} href={`/admin/review?status=${s}`} className={s === status ? "text-text" : "text-muted hover:text-text"}>
              {s}
            </a>
          ))}
          <form action={signOut}>
            <button className="text-muted hover:text-text">Sign out</button>
          </form>
        </div>
      </div>
      <ReviewQueue proposals={(data ?? []) as Proposal[]} readOnly={status !== "pending"} />
    </div>
  );
}
