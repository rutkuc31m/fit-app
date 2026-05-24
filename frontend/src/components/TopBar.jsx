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
      <div className="max-w-[760px] mx-auto h-[58px] px-[16px] flex items-center gap-3">
        <Link to="/" className="flex items-center gap-[9px] flex-1 min-w-0 hover:opacity-80 transition">
          <div className="brand-mark relative w-[30px] h-[30px] rounded-lg bg-signal grid place-items-center text-[#000000] mono font-bold text-[.72rem] shrink-0">
            F
            <span className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-signal shadow-[0_0_8px_theme(colors.signal)] animate-[pulse_1.4s_ease-in-out_infinite]" />
          </div>
          <div className="min-w-0">
            <div className="mono text-[.72rem] font-semibold uppercase tracking-[.18em] text-ink truncate">
              fit<span className="text-signal font-bold"> control</span>
            </div>
            <div className="mono text-[.5rem] text-mute uppercase tracking-[.18em] truncate">
              cut · strength · signal
            </div>
          </div>
        </Link>
        <div className="top-status px-2 py-1 flex items-center gap-[8px] mono text-[.58rem] uppercase tracking-[.12em] shrink-0">
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
  );
}
