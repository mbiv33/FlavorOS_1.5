import { MOCK_TODAY_STATUS } from "@/lib/mock/today";
import { MOCK_USER } from "@/lib/mock/profile";
import type { TodayStatus, WellnessState } from "@/lib/types/today";

const wellnessLabel: Record<WellnessState, string> = {
  steady: "Wellness: steady",
  stretched: "Wellness: stretched a bit",
  elevated: "Wellness: elevated",
};

const wellnessDot: Record<WellnessState, string> = {
  steady: "bg-ok",
  stretched: "bg-warn",
  elevated: "bg-warn animate-pulse",
};

interface GreetingProps {
  /** Pass null to render the calm-state greeting (PRD 04 §4.1 calm state). */
  status?: TodayStatus | null;
}

export function Greeting({ status = MOCK_TODAY_STATUS }: GreetingProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="px-1 pt-4 pb-1.5">
      <h1 className="m-0 mb-1 text-[28px] font-bold tracking-tight">
        {greeting}, {MOCK_USER.firstName}.
      </h1>
      {status ? (
        <div className="text-[13.5px] text-ink-2 flex items-center gap-2 flex-wrap">
          <span aria-hidden className={`inline-block w-[7px] h-[7px] rounded-full ${wellnessDot[status.wellness]}`} />
          {wellnessLabel[status.wellness]}
          {status.overnight ? (
            <>
              <span className="text-ink-3" aria-hidden>·</span>
              {status.overnight}
            </>
          ) : null}
          {status.brief ? (
            <>
              <span className="text-ink-3" aria-hidden>·</span>
              {status.brief}
            </>
          ) : null}
        </div>
      ) : (
        <div className="text-[13.5px] text-ink-2">
          Nothing needs you yet. Khadijah is putting your day together.
        </div>
      )}
    </div>
  );
}
