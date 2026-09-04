import { RobotTable } from "@/components/robot-table";
import { getRobots } from "@/lib/data";

export const revalidate = 3600;

export default async function IndexPage() {
  const robots = await getRobots();
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none">
        Robots you can actually program.
      </h1>
      <p className="mt-2 mb-6 text-muted max-w-[60ch]">
        Every robot under $25K with real developer access: which tier unlocks the SDK, what it costs, and a source for each fact.
      </p>
      <RobotTable robots={robots} />
    </div>
  );
}
