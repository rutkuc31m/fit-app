import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { todayStr, fmtDate } from "../lib/plan";
import FULL_SCHEDULE from "../lib/daily_schedule";
import { Icon, Empty } from "../components/ui";

const CAT_STYLE = {
  routine:    { dot: "#8a8f98", label: "ROUT" },
  supplement: { dot: "#b070ff", label: "SUPP" },
  checkpoint: { dot: "#ff6c8a", label: "CHK"  },
  exercise:   { dot: "#4ad0ff", label: "EXR"  },
  activity:   { dot: "#4ad0ff", label: "ACT"  },
  cardio:     { dot: "#4ad0ff", label: "CAR"  },
  training:   { dot: "#d4ff3a", label: "GYM"  },
  nutrition:  { dot: "#ffb84a", label: "EAT"  },
  family:     { dot: "#ff6c8a", label: "FAM"  },
  sleep:      { dot: "#5b6cff", label: "SLP"  }
};

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function Today() {
  const { t } = useTranslation();
  const [date, setDate] = useState(todayStr());
  const now = nowHHMM();

  const day = useMemo(
    () => FULL_SCHEDULE.days.find((d) => d.date === date),
    [date]
  );

  const shiftDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(fmtDate(d));
  };

  if (!day) {
    return (
      <div className="page">
        <Empty
          icon={<Icon.clock size={22} />}
          label="—"
          hint={date}
          action={
            <button className="btn-ghost mt-2" onClick={() => setDate(todayStr())}>
              {t("log.today")}
            </button>
          }
        />
      </div>
    );
  }

  // Current-time indicator index
  let currentIdx = -1;
  for (let i = 0; i < day.schedule.length; i++) {
    if (day.schedule[i].time <= now) currentIdx = i;
    else break;
  }

  return (
    <div className="page">
      {/* Date nav */}
      <div className="flex items-center justify-between px-1">
        <button className="btn-ghost" onClick={() => shiftDate(-1)} aria-label="prev">
          <Icon.chev size={14} className="rotate-180" />
        </button>
        <div className="text-center">
          <div className="mono text-sm text-ink">{day.date}</div>
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">
            {day.dayName} · D{day.dayNumber}/182 · W{day.weekNumber}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => shiftDate(1)} aria-label="next">
          <Icon.chev size={14} />
        </button>
      </div>

      {/* Phase + eating header */}
      <div className="card p-3 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md grid place-items-center mono text-xs font-bold shrink-0"
          style={{ background: day.phase.color + "22", color: day.phase.color, border: `1px solid ${day.phase.color}55` }}
        >
          P{day.phase.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="card-title truncate">{day.phase.name}</div>
          <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">
            {day.eating.label}
            {day.eating.window && ` · ${day.eating.window.start}–${day.eating.window.end}`}
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-sm text-signal font-bold tabular-nums">{day.eating.targets.kcal}</div>
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em]">kcal</div>
        </div>
      </div>

      {/* Quick chips */}
      <div className="grid grid-cols-3 gap-[10px]">
        <div className="card p-2 text-center">
          <div className="mono text-sm text-ink font-bold tabular-nums">{day.stepTarget}</div>
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em]">{t("cardio.step_target")}</div>
        </div>
        <div className="card p-2 text-center">
          <div className="mono text-sm text-ink font-bold tabular-nums">{day.waterLiters}L</div>
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em]">water</div>
        </div>
        <div className="card p-2 text-center">
          <div className="mono text-sm text-ink font-bold tabular-nums">{day.sleepHours}h</div>
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em]">sleep</div>
        </div>
      </div>

      {/* Restriction banner */}
      {day.restrictions && day.restrictions.length > 0 && (
        <div className="card p-3 border-warn/40 bg-warn/[.05]">
          <div className="mono text-[.62rem] text-warn uppercase tracking-[.14em] mb-1">
            {t("restrictions.lower_back")}
          </div>
          <div className="mono text-xs text-ink2">{day.restrictions[0]}</div>
        </div>
      )}

      {/* Checkpoint banner */}
      {day.isCheckpointDay && day.checkpoint && (
        <Link to="/checkin" className="card p-3 border-signal/40 bg-signal/[.05] hover:border-signal/60 transition block">
          <div className="mono text-[.62rem] text-signal uppercase tracking-[.14em] mb-1">
            {t("checkin.title")}
          </div>
          <div className="mono text-xs text-ink2">{day.checkpoint.tasks.join(" · ")}</div>
        </Link>
      )}

      {/* Timeline */}
      <div className="section-label">Schedule</div>
      <div className="flex flex-col gap-1">
        {day.schedule.map((item, i) => {
          const style = CAT_STYLE[item.category] || CAT_STYLE.routine;
          const isCurrent = i === currentIdx && date === todayStr();
          const isPast = i < currentIdx && date === todayStr();
          return (
            <div
              key={`${item.time}-${i}`}
              className={`card p-2 flex items-start gap-2 transition ${
                isCurrent ? "border-signal/60 bg-signal/[.06]" : ""
              } ${isPast ? "opacity-50" : ""}`}
            >
              <div className="mono text-[.7rem] text-ink tabular-nums w-11 shrink-0 pt-[2px]">
                {item.time}
              </div>
              <div className="shrink-0 pt-[6px]">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: style.dot }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="mono text-xs text-ink truncate">{item.action}</div>
                  {item.duration && (
                    <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] shrink-0">
                      {item.duration}
                    </div>
                  )}
                </div>
                <div className="mono text-[.64rem] text-mute leading-tight mt-[2px]">
                  {item.details}
                </div>
              </div>
              <div
                className="mono text-[.54rem] uppercase tracking-[.18em] shrink-0 pt-[3px]"
                style={{ color: style.dot }}
              >
                {style.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplements footer */}
      {day.supplements && (
        <div className="card p-3">
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] mb-1">Supplements</div>
          <div className="mono text-[.7rem] text-ink2">
            AM: {day.supplements.morning.join(", ")}
          </div>
          <div className="mono text-[.7rem] text-ink2">
            PM: {day.supplements.evening.join(", ")}
          </div>
          {day.supplements.note && (
            <div className="mono text-[.62rem] text-mute mt-1">{day.supplements.note}</div>
          )}
        </div>
      )}
    </div>
  );
}
