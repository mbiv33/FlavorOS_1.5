import { StatStrip } from "./StatStrip";
import { goalsAndMilestones } from "@/lib/fixtures";

export function GoalsStrip() {
  return <StatStrip stats={goalsAndMilestones} />;
}
