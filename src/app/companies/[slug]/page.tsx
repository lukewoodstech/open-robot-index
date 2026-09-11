import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SdkBadge } from "@/components/badges";
import { RobotThumb } from "@/components/robot-thumb";
import { getNews, getRobots } from "@/lib/data";
import { isoDate, usd } from "@/lib/format";
import { FORM_LABELS, entryTier } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const robots = await getRobots();
  return Array.from(new Set(robots.map((r) => r.company.slug))).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const robots = (await getRobots()).filter((r) => r.company.slug === slug);
  if (!robots.length) return { title: "Not found" };
  return { title: robots[0].company.name, description: robots[0].company.description ?? undefined };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [all, news] = await Promise.all([getRobots(), getNews()]);
  const robots = all.filter((r) => r.company.slug === slug);
  if (!robots.length) notFound();
  const company = robots[0].company;
  const related = news.filter((n) => n.company_ids.includes(company.id) || n.robot_ids.some((id) => robots.some((r) => r.id === id)));

  return (
    <article>
      <nav className="text-xs text-muted mb-4">
        <Link href="/" className="hover:text-text">Robots</Link>
        <span className="mx-1.5">/</span>
        <span>{company.name}</span>
      </nav>
      <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-none">{company.name}</h1>
      <p className="mt-2 text-muted">
        {company.country ?? ""}
        {company.country && company.website ? " · " : ""}
        {company.website && <a href={company.website} target="_blank" rel="noopener" className="underline hover:text-text">{company.website.replace(/^https?:\/\/(www\.)?/, "")}</a>}
      </p>
      {company.description && <p className="mt-4 max-w-[70ch]">{company.description}</p>}

      <h2 className="mt-10 text-lg font-semibold tracking-tight">Robots in the index</h2>
      <ul className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {robots.map((r) => (
          <li key={r.id}>
            <Link href={`/robots/${r.slug}`} className="block rounded-lg border border-line bg-panel hover:border-muted overflow-hidden">
              <RobotThumb r={r} size={0} className="!w-full aspect-[4/3] rounded-none border-0" sizes="(min-width: 1024px) 25vw, 50vw" />
              <div className="p-3">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted">{FORM_LABELS[r.form]}</div>
                <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                  <SdkBadge value={r.sdk_access} />
                  <span className="tabular-nums">{usd(entryTier(r)?.price_usd)}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-semibold tracking-tight">News</h2>
      {related.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No buyer-relevant news recorded for {company.name} yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line/60 max-w-[80ch]">
          {related.map((n) => (
            <li key={n.id} className="py-3 text-sm">
              <a href={n.url} target="_blank" rel="noopener" className="font-medium hover:underline">{n.title}</a>
              <p className="mt-1 text-muted">{n.summary}</p>
              <p className="mt-1 text-xs text-muted">{n.category.replace("_", " ")} · {n.publisher ?? ""} · {n.published_at ? isoDate(n.published_at) : ""}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
