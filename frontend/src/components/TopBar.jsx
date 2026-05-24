import { Link } from "react-router-dom";
import { getWeekNum, getPhase, todayStr, PLAN, daysBetween } from "../lib/plan";
import { Icon, LiveClock } from "./ui";

export default function TopBar() {
  const week = getWeekNum();
  const phase = getPhase(week);
  const elapsed = Math.max(0, daysBetween(PLAN.startDate, todayStr()));
  const totalDays = daysBetween(PLAN.startDate, PLAN.endDate) || 1;
  const dayN = Math.min(totalDays, elapsed + 1);

  return (
    <div className="sticky top-0 z-40 top-shell">
      <div className="max-w-[760px] mx-auto h-14 px-4 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity duration-150">
          <div className="brand-mark w-7 h-7 rounded-md bg-signal grid place-items-center text-bg font-semibold text-xs shrink-0">
            F
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink truncate">
              Fit
            </div>
          </div>
        </Link>
        <div className="top-status px-2 py-1 flex items-center gap-2 mono text-[.68rem] shrink-0">
          <LiveClock className="text-ink2 hidden min-[430px]:inline" />
          <span className="hidden min-[430px]:inline w-px h-3 bg-line2" />
          <span className="text-ink2">P{phase.id}</span>
          <span className="text-ink2">W{String(week).padStart(2, "0")}</span>
          <span className="text-ink2">D{String(dayN).padStart(3, "0")}</span>
        </div>
        <Link to="/settings" className="btn-icon" aria-label="Settings">
          <Icon.cog size={17} />
        </Link>
      </div>
    </div>
  );
}
