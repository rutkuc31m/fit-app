import { useTranslation } from "react-i18next";
import { getWeekNum, getPhase, todayStr, PLAN, daysBetween } from "../lib/plan";
import { LiveClock } from "./ui";

export default function TopBar() {
  const { t } = useTranslation();
  const week = getWeekNum();
  const phase = getPhase(week);
  const elapsed = Math.max(0, daysBetween(PLAN.startDate, todayStr()));
  const totalDays = daysBetween(PLAN.startDate, PLAN.endDate) || 1;
  const dayN = Math.min(totalDays, elapsed + 1);

  return (
    <div className="sticky top-0 z-40 border-b border-line backdrop-blur-md bg-bg/85">
      <div className="max-w-[680px] mx-auto h-[52px] px-[16px] flex items-center gap-3">
        <div className="flex items-center gap-[9px] flex-1 min-w-0">
          <div className="relative w-[24px] h-[24px] rounded-md bg-signal grid place-items-center text-[#000000] mono font-bold text-[.72rem] shadow-[0_0_18px_-4px_theme(colors.signal)] shrink-0">
            F
            <span className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-signal shadow-[0_0_8px_theme(colors.signal)] animate-[pulse_1.4s_ease-in-out_infinite]" />
          </div>
          <div className="mono text-[.76rem] font-semibold uppercase tracking-[.22em] text-ink truncate">
            fit·<span className="text-signal font-bold">rutkuc</span>
          </div>
        </div>
        <div className="flex items-center gap-[10px] mono text-[.62rem] uppercase tracking-[.16em] shrink-0">
          <LiveClock className="text-ink2" />
          <span className="w-px h-[12px] bg-line2" />
          <span className="text-signal">P{phase.id}</span>
          <span className="text-mute">·</span>
          <span className="text-ink2">W{String(week).padStart(2, "0")}</span>
          <span className="text-mute">·</span>
          <span className="text-ink2">D{String(dayN).padStart(3, "0")}</span>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent" />
    </div>
  );
}
