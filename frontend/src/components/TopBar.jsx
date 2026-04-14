import { useTranslation } from "react-i18next";
import { getWeekNum, getPhase } from "../lib/plan";

export default function TopBar() {
  const { t } = useTranslation();
  const week = getWeekNum();
  const phase = getPhase(week);
  return (
    <div className="sticky top-0 z-40 border-b border-line backdrop-blur bg-bg/85">
      <div className="max-w-[680px] mx-auto h-[52px] px-[18px] flex items-center gap-[10px]">
        <div className="flex items-center gap-[9px] flex-1">
          <div className="w-[22px] h-[22px] rounded-md bg-signal grid place-items-center text-[#0a0c00] mono font-bold text-[.72rem] shadow-[0_0_18px_-4px_theme(colors.signal)]">F</div>
          <div className="mono text-[.78rem] font-semibold uppercase tracking-[.22em] text-ink">
            fit·<span className="text-signal font-bold">rutkuc</span>
          </div>
        </div>
        <div className="mono text-[.68rem] text-ink2 uppercase tracking-[.12em]">
          <span className="text-signal">P{phase.id}</span> · {t("dashboard.week")} {week}
        </div>
      </div>
    </div>
  );
}
