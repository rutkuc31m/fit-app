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
      <div className="max-w-[760px] mx-auto h-[66px] px-[12px] flex items-center gap-2">
        <div className="top-capsule w-full px-2 py-2 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-[9px] flex-1 min-w-0 hover:opacity-85 transition-opacity duration-200">
          <div className="brand-mark relative w-[34px] h-[34px] rounded-lg bg-signal grid place-items-center text-[#090806] mono font-black text-[.76rem] shrink-0">
            FC
            <span className="absolute -bottom-[2px] -right-[2px] w-[8px] h-[8px] rounded-full bg-amber border border-bg shadow-[0_0_9px_theme(colors.amber)]" />
          </div>
          <div className="min-w-0">
            <div className="mono text-[.75rem] font-black uppercase tracking-[.14em] text-ink truncate">
              fit control
            </div>
            <div className="mono text-[.5rem] text-amber uppercase tracking-[.18em] truncate">
              cut OS · live
            </div>
          </div>
        </Link>
        <div className="top-status px-2.5 py-1.5 flex items-center gap-[8px] mono text-[.56rem] uppercase tracking-[.12em] shrink-0">
          <LiveClock className="text-ink2 hidden min-[430px]:inline" />
          <span className="hidden min-[430px]:inline w-px h-[12px] bg-line2" />
          <span className="text-signal font-bold">P{phase.id}</span>
          <span className="text-ink2">W{String(week).padStart(2, "0")}</span>
          <span className="text-ink2">D{String(dayN).padStart(3, "0")}</span>
        </div>
        <Link to="/settings" className="btn-icon" aria-label="Settings">
          <Icon.cog size={17} />
        </Link>
        </div>
      </div>
    </div>
  );
}
