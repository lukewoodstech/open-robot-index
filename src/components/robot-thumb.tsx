import Image from "next/image";
import type { RobotFull } from "@/lib/types";
import { FORM_LABELS } from "@/lib/types";

export function heroImage(r: RobotFull) {
  return r.images.find((i) => i.kind === "hero") ?? r.images[0] ?? null;
}

/** Small image tile used in table rows and cards. Falls back to a labelled panel. */
export function RobotThumb({
  r,
  size = 56,
  className = "",
  sizes,
}: {
  r: RobotFull;
  size?: number;
  className?: string;
  sizes?: string;
}) {
  const hero = heroImage(r);
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-md bg-panel-2 border border-line ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {hero ? (
        <Image
          src={hero.url}
          alt=""
          fill
          sizes={sizes ?? `${size}px`}
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted text-center leading-tight px-1">
          {FORM_LABELS[r.form]}
        </span>
      )}
    </div>
  );
}
