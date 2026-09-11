import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { dataSourceLabel } from "@/lib/data";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Open Robot Index",
    template: "%s · Open Robot Index",
  },
  description:
    "Robots under $25K scored on whether you can actually program them: SDK access, price by tier, open hardware, LeRobot support. Every fact sourced and dated.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line">
          <nav className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center gap-6 text-sm">
            <Link href="/" className="font-semibold tracking-tight text-text">
              Open Robot Index
            </Link>
            <Link href="/" className="text-muted hover:text-text">
              Robots
            </Link>
            <Link href="/news" className="text-muted hover:text-text">
              News
            </Link>
            <Link href="/compare" className="text-muted hover:text-text">
              Compare
            </Link>
            <Link href="/about" className="text-muted hover:text-text">
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
            <Link href="/corrections" className="hover:text-text">
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
