import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { todayStr, getWeekNum } from "../lib/plan";
import { getHabitsForPhase } from "../lib/protocols";
import { Brackets, Icon } from "../components/ui";

const SECTIONS = [
  { key: "morning",    icon: "sun" },
  { key: "throughout", icon: "clock" },
  { key: "evening",    icon: "moon" }
];

const todayDow = () => new Date().getDay();

export default function Habits() {
  const { t } = useTranslation();
  const date = todayStr();
  const week = getWeekNum(date);
  const habits = useMemo(() => getHabitsForPhase(week), [week]);
  const [logs, setLogs] = useState({});
  const [streak, setStreak] = useState(0);

  const load = async () => {
    const [m, s] = await Promise.all([
      api.get(`/habits/${date}`),
      api.get(`/habits/streak/current`).catch(() => ({ streak: 0 }))
    ]);
    setLogs(m || {});
    setStreak(s?.streak || 0);
  };
  useEffect(() => { load(); }, [date]);

  const toggle = async (habitId) => {
    const next = !logs[habitId];
    setLogs((prev) => ({ ...prev, [habitId]: next }));
    await api.post(`/habits/${date}`, { habit_id: habitId, completed: next });
    if (!next) load(); // refresh streak only on uncheck (cheap)
  };

  const allItems = [
    ...(habits.morning || []), ...(habits.throughout || []),
    ...(habits.evening || []), ...(habits.weekly || [])
  ];
  const dailyItems = [...(habits.morning || []), ...(habits.throughout || []), ...(habits.evening || [])];
  const dailyDone = dailyItems.filter((h) => logs[h.id]).length;
  const dailyTotal = dailyItems.length;
  const dow = todayDow();

  const renderRow = (h) => {
    const done = !!logs[h.id];
    return (
      <button key={h.id} onClick={() => toggle(h.id)}
        className={`relative w-full px-4 py-3 flex items-center gap-3 border-b border-line last:border-0 text-left transition ${done ? "bg-lime/[.04]" : "hover:bg-bg2"}`}>
        <span className={`absolute left-0 top-0 bottom-0 w-[2px] transition ${done ? "bg-lime shadow-[0_0_8px_rgba(212,255,58,.5)]" : "bg-amber/40"}`} />
        <span className={`shrink-0 w-5 h-5 rounded border grid place-items-center transition ${done ? "bg-lime border-lime text-[#0a0c00]" : "border-amber/40 bg-amber/[.04]"}`}>
          {done && <Icon.check size={12} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm leading-tight ${done ? "text-mute line-through" : "text-ink"}`}>{h.label}</div>
        </div>
      </button>
    );
  };

  return (
    <div className="page page-habits">
      <div className="section-label">{t("habits.title")}</div>

      <Brackets>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <div className="card-title">{t("habits.title")}</div>
            <div className="mono text-[.62rem] uppercase tracking-[.14em] mt-1 tabular-nums">
              <span className={dailyTotal > 0 && dailyDone === dailyTotal ? "text-lime" : dailyDone > 0 ? "text-amber" : "text-mute"}>
                {dailyDone}
              </span>
              <span className="text-mute">/{dailyTotal}</span>
              <span className="text-mute"> {t("habits.completion", { done: "", total: "" }).replace(/[0-9/]/g, "").trim()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl text-lime leading-none tabular-nums italic" style={{ textShadow: "0 0 14px rgba(212,255,58,.5)" }}>
              {streak}
            </div>
            <div className="mono text-[.58rem] text-mute uppercase tracking-[.18em] mt-1">{t("habits.streak", { count: streak })}</div>
          </div>
        </div>
      </Brackets>

      {SECTIONS.map(({ key }) => (
        habits[key]?.length > 0 && (
          <div key={key}>
            <div className="section-label">{t(`habits.${key}`)}</div>
            <div className="card overflow-hidden">{habits[key].map(renderRow)}</div>
          </div>
        )
      ))}

      {habits.weekly?.length > 0 && (
        <div>
          <div className="section-label">{t("habits.weekly")}</div>
          <div className="card overflow-hidden">
            {habits.weekly.filter((h) => !h.day || h.day === dow).map(renderRow)}
          </div>
        </div>
      )}
    </div>
  );
}
