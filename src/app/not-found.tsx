import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 max-w-[50ch]">
      <h1 className="text-2xl font-semibold tracking-tight">No robot here.</h1>
      <p className="mt-2 text-muted text-sm">
        The link may be out of date or the robot may have been removed for being over $25K.
      </p>
      <Link href="/" className="mt-4 inline-block text-accent hover:underline text-sm">
        Back to the index
      </Link>
    </div>
  );
}
