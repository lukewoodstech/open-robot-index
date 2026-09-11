import type { Metadata } from "next";
import { SdkBadge } from "@/components/badges";

export const metadata: Metadata = {
  title: "About",
  description: "How the Open Robot Index scores SDK access, what the confidence marks mean, and how corrections and agent proposals are reviewed.",
};

export default function AboutPage() {
  return (
    <article className="max-w-[70ch]">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none">About</h1>
      <p className="mt-3 text-muted">
        The Open Robot Index answers one question for developers, students and small teams buying hardware: can I write code for this robot, and what does that tier cost.
      </p>

      <Section title="What is listed">
        <p>
          Robots a person or small team can actually order for roughly $25,000 or less, from a manufacturer, an authorized distributor, or an open-source project with a published bill of materials. Nothing over the ceiling, no concept robots, no funding news.
        </p>
      </Section>

      <Section title="The three SDK states">
        <p>SDK access is a three-state field, never a score. Each state carries a required note saying which tier unlocks it and what you get.</p>
        <dl className="mt-4 space-y-4">
          <State value="full">
            Every unit ships with a developer SDK or the design is fully open. You can write and run your own code on the cheapest tier listed.
          </State>
          <State value="gated">
            A developer SDK exists but only on a specific tier, license or edition. The note names that tier; the price table shows what it costs. The cheapest tier will not let you program the robot properly.
          </State>
          <State value="none">
            No developer SDK is offered at any tier. App control, scripting through a vendor GUI, or community reverse-engineering do not count.
          </State>
        </dl>
      </Section>

      <Section title="Confidence marks">
        <ul className="space-y-2">
          <li><span className="text-text">High.</span> The price and SDK claim were read on the manufacturer&rsquo;s own store or the project&rsquo;s official page on the check date.</li>
          <li><span className="text-text">Medium.</span> At least one fact comes from a distributor, a secondary listing, or a page that has since changed. The note says which.</li>
          <li><span className="text-text">Verify.</span> Sources disagree, the price is an announced target, or the official page could not be checked. Verify rows always say what is contested. Treat the number as a starting point, not a quote.</li>
        </ul>
      </Section>

      <Section title="Sources and dates">
        <p>
          Every price, SDK claim and spec on a robot page links to the source it came from, with the date it was retrieved. Quotes from sources are kept under fifteen words. Prices are US dollars as shown on the cited page; tax, shipping and regional pricing vary and are noted where known.
        </p>
      </Section>

      <Section title="Other fields">
        <ul className="space-y-2">
          <li><span className="text-text">Open hardware.</span> Yes means CAD, BOM and firmware are published under an open license. Partial means the software is open but the mechanical design is not, or only some files are published. No means closed.</li>
          <li><span className="text-text">LeRobot.</span> Native means the robot is in the Hugging Face LeRobot core robot list. Supported means the vendor publishes and maintains an integration. Compatible means the vendor claims compatibility. Community means a third-party integration exists. None means none of the above.</li>
          <li><span className="text-text">Price by tier.</span> Each SKU or edition is a row. The index table shows the cheapest tier and the cheapest tier that includes the SDK, because those are usually different numbers.</li>
        </ul>
      </Section>

      <Section title="How agents and review work">
        <p>
          Scheduled jobs powered by Claude search manufacturer stores, resellers and project pages for price changes, new SKUs, SDK releases and newly announced robots. They never write to the public tables. Every finding becomes a proposal in a review queue with the before and after values, the agent&rsquo;s notes and the source links. A human approves or rejects each proposal in one tap, and approving stamps a new last-checked date. Until that happens, nothing on the site changes.
        </p>
      </Section>

      <Section title="Corrections" id="corrections">
        <p>
          If a price, tier or SDK claim is wrong, use the{" "}
          <a href="/corrections" className="text-accent hover:underline">correction form</a>. It asks for the robot, the correct value and a URL that shows it, and files straight into the same review queue the agents use. Sourced price changes from a manufacturer domain apply automatically; everything else waits for a human.
        </p>
      </Section>

      <Section title="Not built on purpose">
        <p>
          General robotics news, a funding tracker, an investor directory, user accounts, comments, ratings, affiliate links, robots over $25K, and any automated process that can publish without a human.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 text-sm leading-relaxed text-muted scroll-mt-20">
      <h2 className="text-lg font-semibold tracking-tight text-text mb-2">{title}</h2>
      {children}
    </section>
  );
}

function State({ value, children }: { value: "full" | "gated" | "none"; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 items-start">
      <dt className="pt-0.5"><SdkBadge value={value} /></dt>
      <dd>{children}</dd>
    </div>
  );
}
