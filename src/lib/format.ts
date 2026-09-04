export function usd(n: number | null | undefined): string {
  if (n == null) return "Quote";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function isoDate(d: string): string {
  // Render ISO dates as "3 Sep 2026" without timezone drift.
  const [y, m, day] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function num(n: number | null | undefined, unit = ""): string {
  if (n == null) return "—";
  return `${n}${unit}`;
}
