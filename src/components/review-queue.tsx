"use client";

import { useEffect, useState, useTransition } from "react";
import { approve, reject } from "@/app/admin/review/actions";
import type { FieldUpdatePayload, NewRobotPayload, NewsItemPayload, Proposal, TierUpdatePayload } from "@/lib/proposals";

type Outcome = { state: "approved" | "rejected" | "error"; message?: string };

export function ReviewQueue({ proposals, readOnly }: { proposals: Proposal[]; readOnly: boolean }) {
  const [cursor, setCursor] = useState(0);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [pending, start] = useTransition();

  const act = (kind: "approve" | "reject", id: string) => {
    if (readOnly || outcomes[id]?.state === "approved" || outcomes[id]?.state === "rejected") return;
    start(async () => {
      const r = kind === "approve" ? await approve(id) : await reject(id);
      setOutcomes((o) => ({ ...o, [id]: r.ok ? { state: kind === "approve" ? "approved" : "rejected" } : { state: "error", message: r.error } }));
    });
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "j" || e.key === "J") setCursor((c) => Math.min(c + 1, proposals.length - 1));
      if (e.key === "k" || e.key === "K") setCursor((c) => Math.max(c - 1, 0));
      const p = proposals[cursor];
      if (!p) return;
      if (e.key === "a" || e.key === "A") act("approve", p.id);
      if (e.key === "r" || e.key === "R") act("reject", p.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, proposals, readOnly, outcomes]);

  useEffect(() => {
    document.getElementById(`proposal-${proposals[cursor]?.id}`)?.scrollIntoView({ block: "nearest" });
  }, [cursor, proposals]);

  if (proposals.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted">
        <p className="text-text">Nothing to review.</p>
        <p className="mt-1">Agents file proposals on their schedules. Sourced price changes are applied automatically; everything else lands here.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {proposals.map((p, i) => {
        const o = outcomes[p.id];
        const focused = i === cursor;
        return (
          <li
            id={`proposal-${p.id}`}
            key={p.id}
            onClick={() => setCursor(i)}
            className={`rounded-lg border bg-panel p-4 transition-colors ${focused ? "border-accent" : "border-line"} ${
              o?.state === "approved" ? "opacity-60" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted">
                  {p.kind.replace("_", " ")} · {p.agent ?? "unknown agent"} · {new Date(p.created_at).toLocaleString()}
                </div>
                <h2 className="mt-0.5 font-medium">{p.summary ?? describe(p)}</h2>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2 text-sm">
                  {o?.state === "approved" && <span className="text-sdk-full">Approved</span>}
                  {o?.state === "rejected" && <span className="text-muted">Rejected</span>}
                  {o?.state === "error" && <span className="text-sdk-none">{o.message}</span>}
                  {!o && (
                    <>
                      <button
                        disabled={pending}
                        onClick={(e) => { e.stopPropagation(); act("approve", p.id); }}
                        className="rounded-md bg-sdk-full/15 border border-sdk-full/40 text-sdk-full px-3 py-1 hover:bg-sdk-full/25 approve-btn"
                      >
                        Approve
                      </button>
                      <button
                        disabled={pending}
                        onClick={(e) => { e.stopPropagation(); act("reject", p.id); }}
                        className="rounded-md border border-line px-3 py-1 text-muted hover:text-text"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
              {readOnly && p.reviewed_by && (
                <div className="text-xs text-muted">{p.status} by {p.reviewed_by}{p.review_note ? ` · ${p.review_note}` : ""}</div>
              )}
            </div>

            <Diff p={p} />

            {p.agent_notes && (
              <p className="mt-3 text-sm">
                <span className="text-muted">Why: </span>
                {p.agent_notes}
              </p>
            )}
            <Evidence p={p} />
          </li>
        );
      })}
    </ol>
  );
}

function describe(p: Proposal): string {
  switch (p.kind) {
    case "tier_update": {
      const pl = p.payload as TierUpdatePayload;
      return `${pl.robot_slug}: ${pl.tier_name} ${fmt(pl.before?.price_usd)} → ${fmt(pl.after.price_usd)}`;
    }
    case "field_update": {
      const pl = p.payload as FieldUpdatePayload;
      return `${pl.robot_slug}: ${pl.field}`;
    }
    case "new_robot":
      return `New robot: ${(p.payload as NewRobotPayload).robot?.name}`;
    case "news_item":
      return `News: ${(p.payload as NewsItemPayload).title}`;
  }
}

function fmt(v: unknown): string {
  if (v == null) return "quote";
  if (typeof v === "number") return `$${v.toLocaleString("en-US")}`;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function Diff({ p }: { p: Proposal }) {
  if (p.kind === "tier_update") {
    const pl = p.payload as TierUpdatePayload;
    const rows: [string, unknown, unknown][] = [];
    for (const k of Object.keys(pl.after) as (keyof TierUpdatePayload["after"])[]) {
      rows.push([k, pl.before?.[k as keyof NonNullable<TierUpdatePayload["before"]>], pl.after[k]]);
    }
    return <BeforeAfter rows={rows} />;
  }
  if (p.kind === "field_update") {
    const pl = p.payload as FieldUpdatePayload;
    return <BeforeAfter rows={[[pl.field, pl.before, pl.after]]} note={pl.note} />;
  }
  if (p.kind === "news_item") {
    const pl = p.payload as NewsItemPayload;
    return (
      <div className="mt-3 text-sm">
        <p>{pl.summary}</p>
        <p className="mt-1 text-muted">{pl.category} · {pl.publisher} · {pl.published_at} · robots: {pl.robot_slugs?.join(", ") || "none"}</p>
      </div>
    );
  }
  const pl = p.payload as NewRobotPayload;
  return (
    <div className="mt-3 text-sm grid gap-x-6 gap-y-1 sm:grid-cols-2">
      <div><span className="text-muted">Company </span>{pl.company?.name}</div>
      <div><span className="text-muted">Form </span>{pl.robot?.form}</div>
      <div><span className="text-muted">SDK </span>{pl.robot?.sdk_access}: {pl.robot?.sdk_note}</div>
      <div><span className="text-muted">Confidence </span>{pl.robot?.confidence}</div>
      <div className="sm:col-span-2"><span className="text-muted">Summary </span>{pl.robot?.summary}</div>
      <div className="sm:col-span-2">
        <span className="text-muted">Tiers </span>
        {pl.tiers?.map((t) => `${t.tier_name} ${fmt(t.price_usd)}${t.includes_sdk ? " (SDK)" : ""}`).join(" · ")}
      </div>
    </div>
  );
}

function BeforeAfter({ rows, note }: { rows: [string, unknown, unknown][]; note?: string }) {
  return (
    <div className="mt-3 text-sm">
      <table className="w-full max-w-2xl">
        <thead className="text-muted text-left text-xs">
          <tr><th className="font-normal py-1 pr-3">Field</th><th className="font-normal py-1 pr-3">Before</th><th className="font-normal py-1">After</th></tr>
        </thead>
        <tbody>
          {rows.map(([k, b, a]) => (
            <tr key={k} className="border-t border-line/60 align-top">
              <td className="py-1 pr-3 text-muted">{k}</td>
              <td className="py-1 pr-3 line-through decoration-muted/60 text-muted">{fmt(b)}</td>
              <td className="py-1">{fmt(a)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="mt-2 text-muted">{note}</p>}
    </div>
  );
}

function Evidence({ p }: { p: Proposal }) {
  const sources = (p.payload as { sources?: { url: string; title?: string; quote?: string }[] }).sources ?? [];
  const url = (p.payload as { url?: string }).url;
  const list = url ? [{ url, title: "Source" }, ...sources] : sources;
  if (list.length === 0) return <p className="mt-2 text-xs text-sdk-gated">No evidence attached.</p>;
  return (
    <ul className="mt-3 text-xs space-y-1">
      {list.map((s, i) => (
        <li key={i}>
          <a href={s.url} target="_blank" rel="noopener" className="text-accent hover:underline break-all">{s.title ?? s.url}</a>
          {"quote" in s && s.quote && <span className="text-muted"> · “{s.quote}”</span>}
        </li>
      ))}
    </ul>
  );
}
