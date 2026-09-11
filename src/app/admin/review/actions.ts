"use server";

import { revalidatePath } from "next/cache";
import { approveProposal, rejectProposal } from "@/lib/proposals";
import { currentAdmin, supabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin() {
  const who = await currentAdmin();
  if (!who) throw new Error("Not signed in as an admin");
  return who;
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function approve(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const who = await requireAdmin();
    await approveProposal(supabaseAdmin(), id, `human:${who}`);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function reject(id: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const who = await requireAdmin();
    await rejectProposal(supabaseAdmin(), id, `human:${who}`, note);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
