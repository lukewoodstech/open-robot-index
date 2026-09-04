import type { Confidence, SdkAccess } from "@/lib/types";
import { CONFIDENCE_LABELS, SDK_LABELS } from "@/lib/types";

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
