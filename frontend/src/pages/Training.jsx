import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { PLAN, todayStr, getDayPlan } from "../lib/plan";
import { Empty, Icon } from "../components/ui";

export default function Training() {
  const { t } = useTranslation();
  const [date] = useState(todayStr());
  const plan = getDayPlan(date);
  const dayType = plan.type === "rest" ? "A" : plan.type;
  const day = PLAN.training[dayType];
  const [session, setSession] = useState(null);
  const [lastByEx, setLastByEx] = useState({});

  const load = async () => {
    const s = await api.get(`/training/session?date=${date}&day_type=${dayType}`);
    setSession(s);
    const hist = await Promise.all(day.exercises.map((e) => api.get(`/training/exercise/${e.id}/history`).catch(() => [])));
    const map = {};
    day.exercises.forEach((e, i) => {
      const rows = hist[i].filter((r) => r.date !== date);
      if (rows.length) map[e.id] = rows.slice(0, 3);
    });
    setLastByEx(map);
  };
  useEffect(() => { load(); }, [date, dayType]);

  const setsFor = (exId) => (session?.sets || []).filter((s) => s.exercise_id === exId);

  const addSet = async (ex) => {
    const existing = setsFor(ex.id);
    const lastSet = existing[existing.length - 1];
    const body = {
      exercise_id: ex.id, exercise_name: ex.name,
      set_number: existing.length + 1,
      weight_kg: lastSet?.weight_kg || null,
      reps: lastSet?.reps || ex.reps
    };
    await api.post(`/training/session/${session.id}/set`, body);
    load();
  };

  const updateSet = async (s, patch) => {
    await api.del(`/training/set/${s.id}`);
    await api.post(`/training/session/${session.id}/set`, {
      exercise_id: s.exercise_id, exercise_name: s.exercise_name,
      set_number: s.set_number,
      weight_kg: patch.weight_kg ?? s.weight_kg, reps: patch.reps ?? s.reps
    });
    load();
  };

  const complete = async () => {
    await api.put(`/training/session/${session.id}`, { completed: 1 });
    load();
  };

  return (
    <div className="page">
      <div className="section-label">
        {t("training.title")} · <span className="text-signal">{dayType}</span> · {t(`training.${day.nameKey}`)}
      </div>

      {plan.type === "rest" && (
        <Empty icon={<Icon.moon size={22} />} label={t("training.rest")} hint={t("dashboard.rest_day")} />
      )}

      {day.exercises.map((ex) => {
        const sets = setsFor(ex.id);
        const last = lastByEx[ex.id];
        return (
          <div key={ex.id} className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex justify-between items-baseline">
              <div>
                <div className="text-sm text-ink font-semibold">{ex.name}</div>
                <div className="mono text-[.66rem] text-mute uppercase tracking-[.14em] mt-[2px]">
                  {ex.sets}×{ex.reps}{ex.unit ? ex.unit : ""}
                </div>
              </div>
              {last && (
                <div className="mono text-[.62rem] text-ink2 text-right">
                  <div className="text-mute uppercase tracking-[.14em]">{t("training.last_time")}</div>
                  <div>{last.map((r) => `${r.weight_kg || "-"}×${r.reps}`).join(" · ")}</div>
                </div>
              )}
            </div>

            <div className="flex flex-col divide-y divide-line">
              {sets.map((s) => (
                <div key={s.id} className="px-4 py-2 flex items-center gap-2">
                  <span className="chip chip-signal w-7 justify-center">{s.set_number}</span>
                  <input type="number" className="input mono flex-1 text-center" defaultValue={s.weight_kg || ""} placeholder="kg"
                    onBlur={(e) => e.target.value !== String(s.weight_kg || "") && updateSet(s, { weight_kg: +e.target.value })} />
                  <span className="mono text-mute">×</span>
                  <input type="number" className="input mono flex-1 text-center" defaultValue={s.reps || ""} placeholder="reps"
                    onBlur={(e) => e.target.value !== String(s.reps || "") && updateSet(s, { reps: +e.target.value })} />
                </div>
              ))}
              <button className="mono text-xs caps text-signal py-3 hover:bg-surface2 transition flex items-center justify-center gap-2" onClick={() => addSet(ex)}>
                <Icon.plus size={14} /> {t("training.add_set")}
              </button>
            </div>
          </div>
        );
      })}

      {plan.type !== "rest" && session && (
        <button
          className={session.completed ? "btn" : "btn-primary"}
          onClick={complete}
          disabled={session.completed}>
          {session.completed ? <span className="inline-flex items-center gap-2 justify-center"><Icon.check size={14} /> {t("training.complete")}</span> : t("training.complete")}
        </button>
      )}
    </div>
  );
}
