import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { dataSourceLabel } from "@/lib/data";
import { SITE_NAME, siteUrl } from "@/lib/site";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Robots under $25K scored on whether you can actually program them: SDK access, price by tier, open hardware, LeRobot support. Every fact sourced and dated.";

export const metadata: Metadata = {
  // Resolves the generated opengraph-image to an absolute URL, which unfurls need.
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line">
          <nav className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/"
              className="inline-flex items-center h-full shrink-0 whitespace-nowrap font-semibold tracking-tight text-text"
            >
              Open Robot Index
            </Link>
            {/* The wordmark already links to the index, so below sm the duplicate
                label is dropped: with it the five items did not fit 380px and the
                wordmark wrapped onto three lines. */}
            <Link href="/" className="hidden sm:inline-flex items-center h-full px-1 text-muted hover:text-text">
              Robots
            </Link>
            <Link href="/news" className="inline-flex items-center h-full px-1 text-muted hover:text-text">
              News
            </Link>
            <Link href="/compare" className="inline-flex items-center h-full px-1 text-muted hover:text-text">
              Compare
            </Link>
            <Link href="/about" className="inline-flex items-center h-full px-1 text-muted hover:text-text">
              About
            </Link>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 text-xs text-muted flex flex-wrap gap-x-6 gap-y-2">
            <span>Every fact has a source URL and a last-checked date.</span>
            <span>Prices in USD unless noted. Nothing here is affiliate-linked.</span>
            <Link href="/corrections" className="tap hover:text-text">
              Report a correction
            </Link>
            {dataSourceLabel() === "seed" && (
              <span className="text-sdk-gated">Serving built-in seed data; database not connected.</span>
            )}
          </div>
        </footer>
      </body>
    </html>
  );
}
