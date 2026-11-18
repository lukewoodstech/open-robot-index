import { QUEUE_OVERDUE_DAYS, type QueueHealth } from "@/lib/queue-health";

/**
 * The state of the review queue, stated on arrival.
 *
 * Three facts, in the order a reviewer needs them: how much is waiting, how
 * long the longest wait has run, and what kind of decisions they are. Server
 * rendered from the same rows the table below is built from, so the numbers
 * cannot drift apart.
 *
 * No colour: the three hues on this site mean SDK state and nothing else, so
 * an overdue wait earns its weight from a border and full-contrast text, the
 * same treatment a stale fact gets on the index.
 */
export function QueueHealthStrip({ health, shown }: { health: QueueHealth; shown?: number }) {
  if (health.pending === 0) {
    return (
      <section aria-label="Queue health" className="mb-6 rounded-lg border border-line bg-panel px-4 py-3 text-sm">
        <span>Queue clear.</span>{" "}
        <span className="text-muted">Nothing is waiting for a decision.</span>
      </section>
    );
  }

  const { oldest } = health;
  const truncated = shown != null && shown < health.pending;

  return (
    <section aria-label="Queue health" className="mb-6">
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        <Cell label="Pending">
          <span className="text-lg font-semibold tracking-tight">{health.pending}</span>
          <span className="text-muted"> awaiting a decision</span>
        </Cell>

        <Cell label="Oldest">
          {oldest ? (
            oldest.overdue ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-md border border-muted px-1.5 py-0.5"
                title={`Filed ${new Date(oldest.created_at).toLocaleString()} — past the ${QUEUE_OVERDUE_DAYS}-day review window.`}
              >
                <span className="size-1.5 rounded-full border border-current" aria-hidden />
                {oldest.age}
                <span className="sr-only">, past the {QUEUE_OVERDUE_DAYS}-day review window</span>
              </span>
            ) : (
              <span title={`Filed ${new Date(oldest.created_at).toLocaleString()}.`}>{oldest.age}</span>
            )
          ) : (
            <span className="text-muted">unknown</span>
          )}
        </Cell>

        <Cell label="By kind">
          {/* A separator between the counts would be read out by a screen
              reader and, worse, start a wrapped line with a stray middot, so
              the gap does the separating. */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {health.byKind.map((k) => (
              <li key={k.kind}>{k.label}</li>
            ))}
          </ul>
        </Cell>
      </div>
      {truncated && (
        <p className="mt-2 text-xs text-muted">
          Showing the newest {shown} of {health.pending}. Decide some to see the rest.
        </p>
      )}
    </section>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-panel px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
