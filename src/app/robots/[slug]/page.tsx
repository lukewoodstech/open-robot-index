import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfidenceMark, SdkBadge } from "@/components/badges";
import { RobotThumb, heroImage } from "@/components/robot-thumb";
import { getNews, getRobot, getRobotSlugs, getRobots } from "@/lib/data";
import { isoDate, num, usd } from "@/lib/format";
import {
  CONFIDENCE_LABELS,
  FORM_LABELS,
  LEROBOT_LABELS,
  SDK_LABELS,
  entryTier,
  sdkTier,
} from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getRobotSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRobot(slug);
  if (!r) return { title: "Not found" };
  const t = sdkTier(r);
  return {
    title: r.name,
    description: `${r.name} by ${r.company.name}: SDK ${SDK_LABELS[r.sdk_access].toLowerCase()}${t?.price_usd != null ? ` from ${usd(t.price_usd)}` : ""}. ${r.summary}`,
  };
}

const SDK_VERDICT: Record<string, string> = {
  full: "You can program this. The SDK comes with every unit.",
  gated: "You can program this, but only on a specific tier.",
  none: "No developer SDK is offered.",
};

export default async function RobotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [r, all, news] = await Promise.all([getRobot(slug), getRobots(), getNews()]);
  if (!r) notFound();
  const related_news = news.filter((n) => n.robot_ids.includes(r.id)).slice(0, 8);

  const hero = heroImage(r);
  const gallery = r.images.filter((i) => i.id !== hero?.id);
  const related = all
    .filter((x) => x.id !== r.id && x.form === r.form)
    .sort((a, b) => (entryTier(a)?.price_usd ?? Infinity) - (entryTier(b)?.price_usd ?? Infinity))
    .slice(0, 4);
  const sdkT = sdkTier(r);
  const borderTone = { full: "border-sdk-full/50", gated: "border-sdk-gated/50", none: "border-sdk-none/50" }[r.sdk_access];

  return (
    <article>
      <nav className="text-xs text-muted mb-4">
        <Link href="/" className="hover:text-text">Robots</Link>
        <span className="mx-1.5">/</span>
        <span>{r.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-none">{r.name}</h1>
        <p className="mt-2 text-muted">
          <Link href={`/companies/${r.company.slug}`} className="hover:text-text underline decoration-line">{r.company.name}</Link>
          {r.company.country ? ` · ${r.company.country}` : ""} · {FORM_LABELS[r.form]}
          <span className="mx-2">·</span>
          <Link href={`/compare?a=${r.slug}`} className="text-accent hover:underline">Compare</Link>
        </p>
      </header>

      {/* Above the fold: hero left, SDK verdict right. */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] items-start">
        <div className="relative rounded-lg bg-panel border border-line aspect-[4/3] overflow-hidden">
          {hero ? (
            <Image
              src={hero.url}
              alt={r.name}
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center text-muted text-sm px-6">
              <div>
                <div className="text-text">{FORM_LABELS[r.form]}</div>
                <div className="mt-1">No manufacturer image on file yet.</div>
              </div>
            </div>
          )}
        </div>

        <aside className={`rounded-lg bg-panel border-2 ${borderTone} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">SDK access</span>
            <SdkBadge value={r.sdk_access} size="lg" />
          </div>
          <p className="mt-3 text-lg font-medium leading-snug">{SDK_VERDICT[r.sdk_access]}</p>
          <p className="mt-2 text-sm leading-relaxed">{r.sdk_note}</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Tier</dt>
            <dd>
              {sdkT ? (
                <>
                  {sdkT.tier_name}
                  <span className="ml-2 tabular-nums">{usd(sdkT.price_usd)}</span>
                </>
              ) : (
                "No tier includes an SDK"
              )}
            </dd>
            <dt className="text-muted">Languages</dt>
            <dd>{r.languages.length ? r.languages.join(", ") : "—"}</dd>
            {r.access_level && (
              <>
                <dt className="text-muted">You get</dt>
                <dd>{r.access_level}</dd>
              </>
            )}
          </dl>
          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
            <ConfidenceMark value={r.confidence} note={r.confidence_note} />
            <span>Checked {isoDate(r.last_checked)}</span>
          </div>
        </aside>
      </div>

      {hero && (
        <p className="mt-2 text-xs text-muted">
          Image: {hero.attribution} ·{" "}
          <a href={hero.source_url} target="_blank" rel="noopener" className="hover:text-text underline">source</a>
        </p>
      )}

      <p className="mt-8 max-w-[70ch] text-base leading-relaxed">{r.summary}</p>

      {r.confidence === "verify" && r.confidence_note && (
        <div className="mt-4 max-w-[70ch] rounded-md border border-line bg-panel px-4 py-3 text-sm">
          <span className="text-muted">Verify: </span>
          {r.confidence_note}
        </div>
      )}

      {/* Tiers */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Price by tier</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-left">
              <tr className="border-b border-line">
                <th className="font-normal py-2 pr-3">Tier</th>
                <th className="font-normal py-2 pr-3 text-right">USD</th>
                <th className="font-normal py-2 pr-3">SDK</th>
                <th className="font-normal py-2 pr-3">Compute</th>
                <th className="font-normal py-2 pr-3">Note</th>
                <th className="font-normal py-2 text-right">Checked</th>
              </tr>
            </thead>
            <tbody>
              {r.tiers.map((t) => (
                <tr key={t.id} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-3 font-medium">{t.tier_name}</td>
                  <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                    {usd(t.price_usd)}
                    {t.currency_note && <div className="text-xs text-muted">{t.currency_note}</div>}
                  </td>
                  <td className="py-2 pr-3">
                    {t.includes_sdk ? <span className="text-sdk-full">Included</span> : <span className="text-muted">No</span>}
                  </td>
                  <td className="py-2 pr-3 text-muted">{t.compute ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted max-w-[40ch]">{t.price_note ?? "—"}</td>
                  <td className="py-2 text-right text-muted whitespace-nowrap">{isoDate(t.checked_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Spec strip */}
      <section className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line rounded-lg overflow-hidden border border-line">
        <Spec label="DoF" value={num(r.dof)} />
        <Spec label="Payload" value={num(r.payload_kg, " kg")} />
        <Spec label="Height" value={num(r.height_cm, " cm")} />
        <Spec label="Weight" value={num(r.weight_kg, " kg")} />
      </section>

      {/* Facts */}
      <section className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2 max-w-[90ch]">
        <Fact label="Open hardware" value={r.open_hardware} note={r.open_hardware_note} />
        <Fact label="LeRobot" value={LEROBOT_LABELS[r.lerobot_support]} />
        <Fact label="Simulation" value={r.sim_support ?? "Not documented"} />
        <Fact label="Availability" value={r.availability ?? "Unknown"} />
        <Fact label="Confidence" value={CONFIDENCE_LABELS[r.confidence]} note={r.confidence_note} />
        <Fact
          label="Company"
          value={
            r.company.website ? (
              <a href={r.company.website} target="_blank" rel="noopener" className="underline hover:text-accent">
                {r.company.name}
              </a>
            ) : (
              r.company.name
            )
          }
          note={r.company.description}
        />
      </section>

      {gallery.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Gallery</h2>
          <ul className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.map((img) => (
              <li key={img.id} className="text-xs text-muted">
                <div className="relative rounded-md border border-line aspect-[4/3] overflow-hidden bg-panel">
                  <Image src={img.url} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
                </div>
                <div className="mt-1">
                  {img.attribution} ·{" "}
                  <a href={img.source_url} target="_blank" rel="noopener" className="underline">source</a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sources */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Sources</h2>
        <ul className="mt-3 divide-y divide-line/60 max-w-[90ch]">
          {r.sources.map((s) => (
            <li key={s.id} className="py-2 text-sm flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <a href={s.url} target="_blank" rel="noopener" className="underline hover:text-accent break-all">
                {s.title ?? s.url}
              </a>
              {s.publisher && <span className="text-muted">{s.publisher}</span>}
              <span className="text-muted">Retrieved {isoDate(s.retrieved_at)}</span>
              {s.quote && <span className="w-full text-muted">“{s.quote}”</span>}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Something wrong?{" "}
          <Link href={`/corrections?robot=${r.slug}`} className="text-accent hover:underline">
            Report a correction for {r.name}
          </Link>
          .
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Also consider</h2>
          <p className="mt-1 text-sm text-muted">Other {FORM_LABELS[r.form].toLowerCase()} robots in the index, cheapest first.</p>
          <ul className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {related.map((x) => (
              <li key={x.id}>
                <Link href={`/robots/${x.slug}`} className="block rounded-lg border border-line bg-panel hover:border-muted overflow-hidden">
                  <RobotThumb r={x} size={0} className="!w-full aspect-[4/3] rounded-none border-0" sizes="(min-width: 1024px) 25vw, 50vw" />
                  <div className="p-3">
                    <div className="font-medium truncate">{x.name}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                      <SdkBadge value={x.sdk_access} />
                      <span className="tabular-nums">{usd(entryTier(x)?.price_usd)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 text-sm">
        <h2 className="text-lg font-semibold tracking-tight">Related news</h2>
        {related_news.length === 0 ? (
          <p className="mt-2 text-muted">No buyer-relevant news recorded for {r.name} yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line/60 max-w-[80ch]">
            {related_news.map((n) => (
              <li key={n.id} className="py-3">
                <a href={n.url} target="_blank" rel="noopener" className="font-medium hover:underline">{n.title}</a>
                <p className="mt-1 text-muted">{n.summary}</p>
                <p className="mt-1 text-xs text-muted">{n.category.replace("_", " ")} · {n.publisher ?? ""} · {n.published_at ? isoDate(n.published_at) : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-xl tabular-nums">{value}</div>
    </div>
  );
}

function Fact({ label, value, note }: { label: string; value: React.ReactNode; note?: string | null }) {
  return (
    <div className="text-sm">
      <div className="text-muted">{label}</div>
      <div className="mt-0.5 capitalize-first">{value}</div>
      {note && <div className="mt-1 text-muted leading-relaxed">{note}</div>}
    </div>
  );
}
