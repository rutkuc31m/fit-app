import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { todayStr, getDayPlan, getWeekNum, getExercisesForDay } from "../lib/plan";
import { getCardioProtocol, getStepTarget } from "../lib/protocols";
import { EXERCISES, getVideoUrl, MUSCLE_LABELS } from "../lib/exercises";
import { Empty, Icon } from "../components/ui";

export default function Training() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "tr").slice(0, 2);
  const [openInfo, setOpenInfo] = useState({});
  const [date] = useState(todayStr());
  const plan = getDayPlan(date);
  const week = getWeekNum(date);
  const dayType = plan.type === "rest" ? "A" : plan.type;
  const day = useMemo(() => getExercisesForDay(dayType, week), [dayType, week]);
  const cardio = useMemo(() => getCardioProtocol(week), [week]);
  const stepTarget = useMemo(() => getStepTarget(week), [week]);
  const [session, setSession] = useState(null);
  const [lastByEx, setLastByEx] = useState({});

  const mainExercises = day.exercises.filter((e) => !e.phase1Only);
  const coreExercises = day.exercises.filter((e) => e.phase1Only);

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

  const renderExerciseCard = (ex) => {
    const sets = setsFor(ex.id);
    const last = lastByEx[ex.id];
    const libId = ex.substituted && EXERCISES[ex.id]?.phase1Alt ? EXERCISES[ex.id].phase1Alt : ex.id;
    const lib = EXERCISES[libId];
    const videoUrl = lib ? getVideoUrl(libId, lang) : null;
    const isOpen = !!openInfo[ex.id];
    const muscles = (lib?.targetMuscles || []).map((m) => MUSCLE_LABELS[m]?.[lang] || MUSCLE_LABELS[m]?.en || m);
    return (
      <div key={ex.id} className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex justify-between items-baseline gap-2">
          <div className="min-w-0">
            <div className="text-sm text-ink font-semibold truncate">{ex.name}</div>
            <div className="mono text-[.66rem] text-mute uppercase tracking-[.14em] mt-[2px]">
              {ex.sets}×{ex.reps}{ex.unit ? ex.unit : ""}
            </div>
            {muscles.length > 0 && (
              <div className="mono text-[.58rem] text-ink2 uppercase tracking-[.14em] mt-[3px] truncate">
                {muscles.slice(0, 3).join(" · ")}
              </div>
            )}
            {ex.substituted && (
              <div className="mt-1 inline-flex items-center gap-1 mono text-[.55rem] uppercase tracking-[.14em] text-warn bg-warn/10 px-[6px] py-[2px] rounded">
                ⚠ {t("training_v2.substituted")}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {last && (
              <div className="mono text-[.62rem] text-ink2 text-right">
                <div className="text-mute uppercase tracking-[.14em]">{t("training.last_time")}</div>
                <div>{last.map((r) => `${r.weight_kg || "-"}×${r.reps}`).join(" · ")}</div>
              </div>
            )}
            {lib && (
              <div className="flex items-center gap-1">
                {videoUrl && (
                  <a href={videoUrl} target="_blank" rel="noreferrer"
                     className="mono text-[.58rem] uppercase tracking-[.14em] text-signal bg-surface2 hover:bg-surface3 px-[8px] py-[3px] rounded inline-flex items-center gap-1">
                    ▶ Video
                  </a>
                )}
                <button
                  className="mono text-[.58rem] uppercase tracking-[.14em] text-ink2 bg-surface2 hover:bg-surface3 px-[8px] py-[3px] rounded"
                  onClick={() => setOpenInfo((s) => ({ ...s, [ex.id]: !s[ex.id] }))}>
                  {isOpen ? "−" : "i"}
                </button>
              </div>
            )}
          </div>
        </div>

        {isOpen && lib && (
          <div className="px-4 py-3 border-b border-line bg-surface2/40 space-y-2">
            {lib.formCues?.length > 0 && (
              <div>
                <div className="mono text-[.55rem] text-signal uppercase tracking-[.14em] mb-1">{t("training_v2.form_cues", "Form")}</div>
                <ul className="text-[.72rem] text-ink2 space-y-[2px] list-disc pl-4">
                  {lib.formCues.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {lib.commonMistakes?.length > 0 && (
              <div>
                <div className="mono text-[.55rem] text-warn uppercase tracking-[.14em] mb-1">{t("training_v2.mistakes", "Hatalar")}</div>
                <ul className="text-[.72rem] text-ink2 space-y-[2px] list-disc pl-4">
                  {lib.commonMistakes.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {lib.importance && (
              <div className="mono text-[.62rem] text-amber bg-amber/10 px-2 py-1 rounded">★ {lib.importance}</div>
            )}
            {lib.beginnerAlt && (
              <div className="text-[.68rem] text-ink2"><span className="text-mute mono uppercase tracking-[.14em] text-[.55rem] mr-1">Alt:</span>{lib.beginnerAlt}</div>
            )}
            {lib.phase1Note && !ex.substituted && (
              <div className="text-[.62rem] text-warn">{lib.phase1Note}</div>
            )}
          </div>
        )}

        <div className="flex flex-col divide-y divide-line">
          {sets.map((s) => (
            <div key={s.id} className="px-4 py-2 flex items-center gap-2">
              <span className="chip chip-muscle w-7 justify-center">{s.set_number}</span>
              <input type="number" className="input mono flex-1 text-center" defaultValue={s.weight_kg || ""} placeholder="kg"
                onBlur={(e) => e.target.value !== String(s.weight_kg || "") && updateSet(s, { weight_kg: +e.target.value })} />
              <span className="mono text-mute">×</span>
              <input type="number" className="input mono flex-1 text-center" defaultValue={s.reps || ""} placeholder="reps"
                onBlur={(e) => e.target.value !== String(s.reps || "") && updateSet(s, { reps: +e.target.value })} />
            </div>
          ))}
          <button className="mono text-xs caps text-amber py-3 hover:bg-surface2 transition flex items-center justify-center gap-2" onClick={() => addSet(ex)}>
            <Icon.plus size={14} /> {t("training.add_set")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page page-training">
      <div className="section-label">
        {t("training.title")} · <span className="text-signal">{dayType}</span> · {t(`training.${day.nameKey}`)}
      </div>

      {plan.type === "rest" && (
        <Empty icon={<Icon.moon size={22} />} label={t("training.rest")} hint={t("dashboard.rest_day")} />
      )}

      {/* Day C: cardio block on top */}
      {plan.type === "C" && cardio && (
        <div className="card p-3 border-cyan/30 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan shadow-[0_0_10px_rgba(100,210,255,.5)]" />
          <div className="flex justify-between items-baseline pl-2">
            <div className="card-title text-cyan">{t("cardio.liss_today")}</div>
            <div className="mono text-[.62rem] text-cyan/80 uppercase tracking-[.14em] tabular-nums">{cardio.liss?.durationMin}min · {cardio.liss?.intensity}</div>
          </div>
          {cardio.liss?.notes && <div className="mono text-[.66rem] text-ink2 mt-1 pl-2">{cardio.liss.notes}</div>}
        </div>
      )}

      {/* Step target banner (any day) */}
      {stepTarget && (
        <div className="card p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon.zap size={16} className="text-amber" />
            <div className="mono text-[.7rem] text-ink uppercase tracking-[.14em]">{t("cardio.step_target")}</div>
          </div>
          <div className="mono text-sm text-amber font-bold tabular-nums">{stepTarget.toLocaleString()}</div>
        </div>
      )}

      {/* Main exercises */}
      {mainExercises.map(renderExerciseCard)}

      {/* Core & Rehab section (Phase 1 only) */}
      {coreExercises.length > 0 && (
        <>
          <div className="section-label flex items-center gap-2">
            <span>{t("training_v2.core_rehab")}</span>
            <span className="mono text-[.55rem] text-warn uppercase tracking-[.14em] bg-warn/10 px-[6px] py-[1px] rounded">P1</span>
          </div>
          {coreExercises.map(renderExerciseCard)}
        </>
      )}

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
