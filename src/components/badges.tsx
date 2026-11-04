import type { Confidence, SdkAccess } from "@/lib/types";
import { CONFIDENCE_LABELS, SDK_LABELS } from "@/lib/types";
import { STALE_AFTER_DAYS, freshness, isoDate } from "@/lib/format";

const SDK_CLASS: Record<SdkAccess, string> = {
  full: "text-sdk-full border-sdk-full/40 bg-sdk-full/10",
  gated: "text-sdk-gated border-sdk-gated/40 bg-sdk-gated/10",
  none: "text-sdk-none border-sdk-none/40 bg-sdk-none/10",
};

export function SdkBadge({ value, size = "sm" }: { value: SdkAccess; size?: "sm" | "lg" }) {
  const pad = size === "lg" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium leading-tight ${pad} ${SDK_CLASS[value]}`}
      title={`SDK access: ${SDK_LABELS[value]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {SDK_LABELS[value]}
    </span>
  );
}

/** Confidence is shown in neutral tones; only SDK state gets color. */
export function ConfidenceMark({ value, note }: { value: Confidence; note?: string | null }) {
  const dots = value === "high" ? 3 : value === "medium" ? 2 : 1;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted"
      title={note ?? `Confidence: ${CONFIDENCE_LABELS[value]}`}
    >
      <span className="inline-flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`size-1.5 rounded-full ${i <= dots ? "bg-text" : "bg-line"}`}
          />
        ))}
      </span>
      {CONFIDENCE_LABELS[value]}
    </span>
  );
}

/**
 * How old a checked fact is. `today` comes from the server so the age in the
 * markup and the age after hydration are the same string.
 *
 * Neutral by design: colour on this site only ever means SDK state, so a stale
 * mark earns its weight from contrast and a border rather than a hue. Fresh is
 * quiet muted text; past the window it becomes bordered, hollow-dotted and
 * full-contrast, so a stale fact looks stale at a glance.
 */
export function FreshnessMark({
  checked,
  today,
  prefix = "",
}: {
  checked: string;
  today: string;
  prefix?: string;
}) {
  const f = freshness(checked, today);
  const date = isoDate(checked);
  if (!f.stale) {
    return (
      <span className="text-xs text-muted whitespace-nowrap" title={`Checked ${date}.`}>
        {prefix}
        {f.age}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-muted px-1.5 py-0.5 text-xs text-text"
      title={`Checked ${date} — past the ${STALE_AFTER_DAYS}-day re-check window.`}
    >
      <span className="size-1.5 rounded-full border border-current" aria-hidden />
      {prefix}
      {f.age}
      <span className="sr-only">, due a re-check</span>
    </span>
  );
}
