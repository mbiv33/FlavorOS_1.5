import { StatStrip, type Stat } from "./StatStrip";

export function GoalsStrip({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-muted">
        No milestones from sync yet — goals will appear after artifacts load.
      </p>
    );
  }
  return <StatStrip stats={stats} />;
}
