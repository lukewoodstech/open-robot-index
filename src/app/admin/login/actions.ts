"use server";

import { redirect } from "next/navigation";
import { adminEmails, supabaseSession } from "@/lib/supabase-server";

export async function signIn(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin/review");
  if (!adminEmails().includes(email)) redirect(`/admin/login?error=${encodeURIComponent("That account is not an admin.")}`);
  const sb = await supabaseSession();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  redirect(next.startsWith("/admin") ? next : "/admin/review");
}

export async function signOut() {
  const sb = await supabaseSession();
  await sb.auth.signOut();
  redirect("/admin/login");
}
