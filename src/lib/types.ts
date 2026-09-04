export type RobotForm =
  | "arm"
  | "bimanual"
  | "desktop"
  | "mobile_base"
  | "mobile_manipulator"
  | "quadruped"
  | "humanoid";

export type SdkAccess = "full" | "gated" | "none";
export type OpenHardware = "yes" | "partial" | "no";
export type LerobotSupport = "native" | "supported" | "compatible" | "community" | "none";
export type Confidence = "high" | "medium" | "verify";

export const FORM_LABELS: Record<RobotForm, string> = {
  arm: "Arm",
  bimanual: "Bimanual",
  desktop: "Desktop",
  mobile_base: "Mobile base",
  mobile_manipulator: "Mobile manipulator",
  quadruped: "Quadruped",
  humanoid: "Humanoid",
};

export const SDK_LABELS: Record<SdkAccess, string> = {
  full: "Full",
  gated: "Gated",
  none: "None",
};

export const LEROBOT_LABELS: Record<LerobotSupport, string> = {
  native: "Native",
  supported: "Supported",
  compatible: "Compatible",
  community: "Community",
  none: "None",
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: "High",
  medium: "Medium",
  verify: "Verify",
};

export interface Company {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  logo_source: string | null;
}

export interface Source {
  id: string;
  url: string;
  title: string | null;
  publisher: string | null;
  retrieved_at: string; // ISO date
  quote: string | null;
}

export interface RobotTier {
  id: string;
  robot_id: string;
  tier_name: string;
  price_usd: number | null;
  price_note: string | null;
  currency_note: string | null;
  includes_sdk: boolean;
  compute: string | null;
  source_id: string | null;
  checked_at: string;
  sort_order: number;
}

export interface RobotImage {
  id: string;
  robot_id: string;
  url: string;
  storage_path: string | null;
  source_url: string;
  attribution: string;
  kind: "hero" | "gallery" | "logo";
}

export interface Robot {
  id: string;
  slug: string;
  name: string;
  company_id: string;
  form: RobotForm;
  summary: string;
  sdk_access: SdkAccess;
  sdk_note: string;
  languages: string[];
  access_level: string | null;
  open_hardware: OpenHardware;
  open_hardware_note: string | null;
  lerobot_support: LerobotSupport;
  sim_support: string | null;
  availability: string | null;
  confidence: Confidence;
  confidence_note: string | null;
  dof: number | null;
  payload_kg: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  hero_image_id: string | null;
  last_checked: string;
}

/** A robot with everything the pages need, already joined. */
export interface RobotFull extends Robot {
  company: Company;
  tiers: RobotTier[];
  sources: Source[];
  images: RobotImage[];
}

/** The lowest priced tier, used for the index table and sorting. */
export function entryTier(r: RobotFull): RobotTier | null {
  const priced = r.tiers.filter((t) => t.price_usd != null);
  if (priced.length === 0) return r.tiers[0] ?? null;
  return priced.reduce((a, b) => (a.price_usd! <= b.price_usd! ? a : b));
}

/** The cheapest tier that includes the SDK, or null when no tier does. */
export function sdkTier(r: RobotFull): RobotTier | null {
  const priced = r.tiers.filter((t) => t.includes_sdk);
  if (priced.length === 0) return null;
  const withPrice = priced.filter((t) => t.price_usd != null);
  if (withPrice.length === 0) return priced[0];
  return withPrice.reduce((a, b) => (a.price_usd! <= b.price_usd! ? a : b));
}
