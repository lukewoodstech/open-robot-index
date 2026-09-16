/**
 * Shared pieces for the generated Open Graph cards.
 *
 * The cards are drawn by next/og (satori + resvg) at build time, so everything
 * here loads from disk first and only falls back to the network for a robot that
 * appeared after the last deploy.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { siteUrl } from "@/lib/site";
import type { RobotFull } from "@/lib/types";
import { heroImage } from "@/lib/types";

/** The size every unfurl expects: 1.91:1. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** The palette from CLAUDE.md. Colour only ever means SDK state. */
export const OG = {
  bg: "#0F1216",
  panel: "#171B21",
  line: "#262C35",
  text: "#EDEFF2",
  muted: "#8B93A1",
} as const;

export const OG_SDK = {
  full: { fg: "#3DD68C", tint: "rgba(61,214,140,0.12)", edge: "rgba(61,214,140,0.45)" },
  gated: { fg: "#F2B84B", tint: "rgba(242,184,75,0.12)", edge: "rgba(242,184,75,0.45)" },
  none: { fg: "#F26B6B", tint: "rgba(242,107,107,0.12)", edge: "rgba(242,107,107,0.45)" },
} as const;

// ---------------------------------------------------------------------------
// Fonts

const FONT_DIR = path.join(process.cwd(), "src/lib/og-fonts");

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: "normal";
}

let fonts: Promise<OgFont[]> | null = null;

/** Geist, the site's one family. Read once per process. */
export function ogFonts(): Promise<OgFont[]> {
  fonts ??= Promise.all([
    fs.readFile(path.join(FONT_DIR, "Geist-Regular.ttf")),
    fs.readFile(path.join(FONT_DIR, "Geist-SemiBold.ttf")),
  ]).then(([regular, semibold]): OgFont[] => [
    { name: "Geist", data: toArrayBuffer(regular), weight: 400, style: "normal" },
    { name: "Geist", data: toArrayBuffer(semibold), weight: 600, style: "normal" },
  ]);
  return fonts;
}

function toArrayBuffer(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

// ---------------------------------------------------------------------------
// Hero images

/**
 * resvg cannot decode WebP, so a hero stored as .webp keeps a JPEG sibling next
 * to it (`hero.og.jpg`) for the card only. Regenerate one with:
 *   npx sharp-cli -i hero.webp -o hero.og.jpg resize 1100 1100 --fit inside
 * The page itself still serves the original .webp.
 */
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/** The robot's hero as a data URL satori can embed, or null to draw the empty state. */
export async function ogHero(r: RobotFull): Promise<string | null> {
  const img = heroImage(r);
  if (!img) return null;
  const candidates = img.url.endsWith(".webp")
    ? [img.url.replace(/\.webp$/, ".og.jpg"), img.url]
    : [img.url];
  for (const url of candidates) {
    const mime = MIME[path.extname(url).toLowerCase()];
    if (!mime) continue;
    const bytes = (await readPublic(url)) ?? (await fetchRemote(url));
    if (bytes) return `data:${mime};base64,${bytes.toString("base64")}`;
  }
  return null;
}

async function readPublic(url: string): Promise<Buffer | null> {
  if (!url.startsWith("/")) return null;
  try {
    return await fs.readFile(path.join(process.cwd(), "public", url));
  } catch {
    return null;
  }
}

/** Only reached for a robot added after the last deploy, whose files are on the CDN. */
async function fetchRemote(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url.startsWith("http") ? url : `${siteUrl()}${url}`);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------

/** Keep a long robot name on two lines at most without clipping it. */
export function nameSize(name: string): number {
  if (name.length > 34) return 40;
  if (name.length > 22) return 48;
  if (name.length > 14) return 58;
  return 68;
}
