import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PLAN, todayStr, fmtDate, getWeekNum, getPhase, getDayPlan, getEatingTarget, daysBetween } from "../lib/plan";
import { useAuth } from "../lib/auth.jsx";
import { api } from "../lib/api";
import { dailyReadiness } from "../lib/coaching";
import { effectiveMacro } from "../lib/nutrition";
import { FOOD_CHOICES, GYM_CHOICES, findFoodChoice, findGymChoice, readTodayCallPrefs, writeTodayCallPrefs } from "../lib/todayCall";
import { AccentCard, Icon, Empty } from "../components/ui";

const hhmmToMin = (s) => {
  if (!s) return 0;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

const windowState = (eating) => {
  if (!eating?.window) {
    return { label: "fasting all day", value: "0 kcal", nowPct: 0, startPct: 0, widthPct: 100, inWindow: false };
  }
  const d = new Date();
  const nowMin = d.getHours() * 60 + d.getMinutes();
  const wStart = hhmmToMin(eating.window.start);
  const wEnd = hhmmToMin(eating.window.end);
  const inWindow = nowMin >= wStart && nowMin <= wEnd;
  const beforeWindow = nowMin < wStart;
  let label, value;
  if (inWindow) {
    const mins = wEnd - nowMin;
    label = "eat window · left";
    value = `${Math.floor(mins / 60)}h ${mins % 60}m`;
  } else if (beforeWindow) {
    const mins = wStart - nowMin;
    label = "until eat window";
    value = `${Math.floor(mins / 60)}h ${mins % 60}m`;
  } else {
    const mins = (24 * 60 - nowMin) + wStart;
    label = "closed · next window";
    value = `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
  return {
    label,
    value,
    nowPct: (nowMin / (24 * 60)) * 100,
    startPct: (wStart / (24 * 60)) * 100,
    widthPct: ((wEnd - wStart) / (24 * 60)) * 100,
    inWindow
  };
};

const fastGuardrails = ["water", "coffee", "easy walk", "sleep"];

const buildEffectiveDay = (day, foodChoice, gymChoice) => ({
  ...day,
  eating: {
    ...day.eating,
    mode: foodChoice.id,
    label: foodChoice.label,
    window: foodChoice.window,
    targets: {
      ...day.eating.targets,
      kcal: foodChoice.kcal,
      protein: foodChoice.protein
    }
  },
  training: gymChoice.id === "REST"
    ? null
    : {
        ...(day.training || {}),
        type: gymChoice.id,
        label: gymChoice.label,
        timeSlot: day.training?.timeSlot || "18:30 – 19:30"
  }
});

const buildCallHeadline = (foodChoice, gymChoice) => ({
  label: `${foodChoice.label} · ${gymChoice.label}`
});

const buildTodayDay = (date, session) => {
  const sourceDate = date < PLAN.startDate ? PLAN.startDate : date;
  const weekNumber = getWeekNum(sourceDate);
  const phase = getPhase(weekNumber);
  const dayPlan = getDayPlan(sourceDate);
  const dow = new Date(`${sourceDate}T12:00:00`).getDay();
  const isFastDay = dayPlan?.eating === "FAST";
  const isTrainingFuelDay = dayPlan?.eating === "TRAINING";
  const isLowDay = dayPlan?.eating === "LOW";
  const targets = getEatingTarget(dayPlan?.eating);
  const training = dayPlan?.type !== "rest"
    ? {
        type: dayPlan.type,
        label: { A: "Üst Vücut (Push/Pull)", B: "Alt Vücut", C: "Full Body + Kardiyo" }[dayPlan.type],
        timeSlot: "18:30 – 19:30"
      }
    : null;
  const freeMeal = dow === 0 && isLowDay
    ? {
        label: "controlled free meal",
        note: "Protein first. One meal, not a cheat day."
      }
    : null;

  return {
    date: sourceDate,
    dayName: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][dow],
    dayNumber: daysBetween(PLAN.startDate, sourceDate) + 1,
    weekNumber,
    phase,
    isCheckpointDay: dow === 1,
    checkpoint: dow === 1 ? {
      tasks: [
        "Aç karnına tartıl",
        "3 fotoğraf (ön, yan, arka)",
        weekNumber % 2 === 1 ? "Ölçüm al (bel, göğüs, kol)" : null,
        "Haftalık değerlendirme yap"
      ].filter(Boolean)
    } : null,
    eating: {
      mode: dayPlan?.eating,
      label: isFastDay ? "ORUÇ" : freeMeal ? "CHEAT MEAL" : isTrainingFuelDay ? "SPLIT MEAL" : isLowDay ? "DÜŞÜK KALORİ" : "OMAD",
      freeMeal,
      window: isFastDay ? null : {
        start: isTrainingFuelDay ? "13:00" : "18:00",
        end: isTrainingFuelDay ? "22:00" : "19:00"
      },
      targets
    },
    training,
    supplements: {
      morning: ["D3+K2 · Pazar/Çarşamba"],
      evening: ["Magnesium"],
      note: "B12/Omega yok. Alerji sezonunda Loratadin."
    },
    session
  };
};

function CommandCard({ readiness, day, leftKg, journeyPct, foodChoice, gymChoice, headline, onFoodChange, onGymChange }) {
  if (!readiness) return null;
  const fastDay = !foodChoice?.window;
  const timing = windowState(foodChoice);
  const accent = readiness.color;
  return (
    <div className="command-card">
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent, boxShadow: `0 0 14px ${accent}90` }} />
      <div className="pl-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mono text-[.58rem] uppercase tracking-[.18em]" style={{ color: accent }}>
            today's call
          </div>
          <div className="font-display text-[1.25rem] leading-tight text-ink mt-1"
            style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
            {headline.label}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3 pl-2">
        <div className="command-metric">
          <div className="metric-label">food</div>
          <div className="metric-value text-[.78rem]" style={{ color: foodChoice.tone }}>{foodChoice.label}</div>
        </div>
        <div className="command-metric">
          <div className="metric-label">kcal</div>
          <div className="metric-value text-[.78rem] text-amber">{foodChoice.kcal}</div>
        </div>
        <div className="command-metric">
          <div className="metric-label">gym</div>
          <div className="metric-value text-[.78rem]" style={{ color: gymChoice.tone }}>{gymChoice.label}</div>
        </div>
        <div className="command-metric">
          <div className="metric-label">left</div>
          <div className="metric-value text-[.78rem] text-lime">-{leftKg.toFixed(1)}</div>
        </div>
      </div>

      <div className="grid gap-2 mt-3 pl-2">
        <div>
          <div className="mono text-[.52rem] text-mute uppercase tracking-[.18em] mb-2">food</div>
          <div className="flex flex-wrap gap-1.5">
            {FOOD_CHOICES.map((choice) => {
              const active = choice.id === foodChoice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={`chip ${active ? "chip-signal" : "chip-mute"}`}
                  style={active ? { borderColor: choice.tone, color: choice.tone, background: `${choice.tone}14` } : null}
                  onClick={() => onFoodChange(choice.id)}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mono text-[.52rem] text-mute uppercase tracking-[.18em] mb-2">gym</div>
          <div className="flex flex-wrap gap-1.5">
            {GYM_CHOICES.map((choice) => {
              const active = choice.id === gymChoice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={`chip ${active ? "chip-signal" : "chip-mute"}`}
                  style={active ? { borderColor: choice.tone, color: choice.tone, background: `${choice.tone}14` } : null}
                  onClick={() => onGymChange(choice.id)}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 pl-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="mono text-[.56rem] uppercase tracking-[.16em]" style={{ color: fastDay ? "#9a9a9a" : accent }}>
            {timing.label}
          </div>
          <div className="mono text-[.7rem] text-ink tabular-nums">{timing.value}</div>
        </div>
        {fastDay ? (
          <div className="grid grid-cols-4 gap-1">
            {fastGuardrails.map((item) => (
              <div key={item} className="soft-band px-2 py-[6px] text-center mono text-[.52rem] text-cyan uppercase tracking-[.1em]">
                {item}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative h-[7px] bg-bg2 rounded-full overflow-hidden border border-line/50">
            <div className="absolute top-0 bottom-0 bg-cyan/35 border-l border-r border-cyan/70"
                 style={{ left: `${timing.startPct}%`, width: `${timing.widthPct}%` }} />
            <div className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-amber"
                 style={{ left: `${timing.nowPct}%` }} />
          </div>
        )}
      </div>

      <div className="mt-3 pl-2">
        <div className="flex items-center justify-between mono text-[.54rem] uppercase tracking-[.14em] mb-1">
          <span className="text-mute">journey</span>
          <span className="text-lime tabular-nums">{journeyPct}%</span>
        </div>
        <div className="h-[4px] bg-bg2 rounded-full overflow-hidden border border-line/50">
          <div
            className="h-full transition-[width] duration-700"
            style={{
              width: `${journeyPct}%`,
              background: accent
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Today() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [currentWeight, setCurrentWeight] = useState(null);
  const [mealsTotals, setMealsTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 });
  const [session, setSession] = useState(null);
  const [, setClockTick] = useState(0);
  const [callPrefs, setCallPrefs] = useState(() => readTodayCallPrefs(todayStr()));
  const week = getWeekNum(date);
  const phase = getPhase(week);
  const dayIdx = daysBetween(PLAN.startDate, date) + 1;
  const phaseStartDay = (phase.weeks[0] - 1) * 7 + 1;
  const isPhaseFirstDay = dayIdx === phaseStartDay;

  const sw = user?.start_weight || PLAN.startWeight;
  const tw = user?.target_weight || PLAN.targetWeight;
  const totalJourney = sw - tw;
  const lost = currentWeight ? Math.max(0, sw - currentWeight) : 0;
  const leftKg = Math.max(0, totalJourney - lost);
  const journeyPct = totalJourney > 0 ? Math.min(100, Math.round((lost / totalJourney) * 100)) : 0;

  useEffect(() => {
    const id = setInterval(() => setClockTick((tick) => tick + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    api.get(`/logs?from=${from}&to=${todayStr()}`)
      .then((range) => {
        const latest = [...(range || [])].reverse().find((r) => r.weight_kg != null);
        if (latest) setCurrentWeight(latest.weight_kg);
      })
      .catch(() => {});
  }, []);

  const day = useMemo(() => buildTodayDay(date, session), [date, session]);
  const foodChoice = useMemo(() => findFoodChoice(callPrefs.foodId), [callPrefs.foodId]);
  const gymChoice = useMemo(() => findGymChoice(callPrefs.gymId), [callPrefs.gymId]);
  const callHeadline = useMemo(() => buildCallHeadline(foodChoice, gymChoice), [foodChoice, gymChoice]);
  const effectiveDay = useMemo(() => buildEffectiveDay(day, foodChoice, gymChoice), [day, foodChoice, gymChoice]);
  const preStart = date < PLAN.startDate;
  const readiness = effectiveDay ? dailyReadiness({ day: effectiveDay, recovery: {}, mealsTotals, session }) : null;

  useEffect(() => {
    setCallPrefs(readTodayCallPrefs(date));
  }, [date]);

  useEffect(() => {
    writeTodayCallPrefs(date, callPrefs);
  }, [date, callPrefs]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/meals?date=${date}`).then((meals) => {
      if (cancelled) return;
      const totals = (meals || []).reduce((acc, m) => {
        (m.items || []).forEach((it) => {
          acc.kcal += effectiveMacro(it, "kcal");
          acc.protein += effectiveMacro(it, "protein_g");
          acc.carbs += effectiveMacro(it, "carbs_g");
          acc.fat += effectiveMacro(it, "fat_g");
        });
        return acc;
      }, { kcal: 0, protein: 0, carbs: 0, fat: 0, count: (meals || []).length });
      setMealsTotals(totals);
    }).catch(() => {});
    api.get(`/training/session?date=${date}`).then((s) => {
      if (!cancelled) setSession(s);
    }).catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, [date]);

  const shiftDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(fmtDate(d));
  };

  if (!day) {
    return (
      <div className="page page-today">
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

  return (
    <div className="page page-today">
      {preStart && (
        <AccentCard accent="#d9a441" className="text-center">
          <div className="mono text-[.62rem] text-amber uppercase tracking-[.22em] font-bold">
            plan starts {PLAN.startDate} · preview of day 1
          </div>
        </AccentCard>
      )}

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

      <CommandCard
        readiness={readiness}
        day={effectiveDay}
        leftKg={leftKg}
        journeyPct={journeyPct}
        foodChoice={foodChoice}
        gymChoice={gymChoice}
        headline={callHeadline}
        onFoodChange={(foodId) => setCallPrefs((prev) => ({ ...prev, foodId }))}
        onGymChange={(gymId) => setCallPrefs((prev) => ({ ...prev, gymId }))}
      />

      {/* Meals ring */}
      {(() => {
        const kcalTarget = foodChoice.kcal || 0;
        const protTarget = foodChoice.protein || 0;
        const kcalPct = kcalTarget ? Math.min(100, Math.round((mealsTotals.kcal / kcalTarget) * 100)) : 0;
        const protPct = protTarget ? Math.min(100, Math.round((mealsTotals.protein / protTarget) * 100)) : 0;
        const ring = (pct, color, label, value, total, unit) => {
          const r = 20, c = 2 * Math.PI * r;
          const off = c - (pct / 100) * c;
          return (
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <svg width="52" height="52" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r={r} stroke="rgba(255,255,255,.08)" strokeWidth="4" fill="none" />
                  <circle cx="26" cy="26" r={r} stroke={color} strokeWidth="4" fill="none"
                    strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                    style={{ transition: "stroke-dashoffset .7s" }} />
                </svg>
                <div className="absolute inset-0 grid place-items-center mono text-[.62rem] tabular-nums" style={{ color }}>{pct}%</div>
              </div>
              <div className="mono text-[.52rem] text-mute uppercase tracking-[.18em]">{label}</div>
              <div className="mono text-[.58rem] text-ink2 tabular-nums">{value}<span className="text-mute">/{total}{unit}</span></div>
            </div>
          );
        };
        return (
          <AccentCard as={Link} to="/log" accent="#d9a441" className="block hover:brightness-110">
            <div className="flex items-center justify-between mb-2">
              <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">nutrition</div>
              <div className="mono text-[.58rem] text-ink2 uppercase tracking-[.14em]">
                {mealsTotals.count} meal{mealsTotals.count !== 1 ? "s" : ""} <span className="text-mute">→</span>
              </div>
            </div>
            {kcalTarget === 0 ? (
              <div className="mono text-[.7rem] text-cyan text-center py-2">{foodChoice.label} · 0 kcal</div>
            ) : (
              <>
                {foodChoice.id === "CHEAT" && (
                  <div className="soft-band px-3 py-2 mb-3 text-center">
                    <div className="mono text-[.58rem] text-amber uppercase tracking-[.16em]">free meal</div>
                  </div>
                )}
                <div className="flex justify-around">
                  {ring(kcalPct, "#d9a441", "kcal", Math.round(mealsTotals.kcal), kcalTarget, "")}
                  {ring(protPct, "#00d4aa", "protein", Math.round(mealsTotals.protein), protTarget, "g")}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="metric-tile px-2 py-2 text-center">
                    <div className="metric-label">kcal left</div>
                    <div className="metric-value text-[.86rem] text-amber">{Math.max(0, Math.round(kcalTarget - mealsTotals.kcal))}</div>
                  </div>
                  <div className="metric-tile px-2 py-2 text-center">
                    <div className="metric-label">protein left</div>
                    <div className="metric-value text-[.86rem] text-lime">{Math.max(0, Math.round(protTarget - mealsTotals.protein))}g</div>
                  </div>
                </div>
              </>
            )}
          </AccentCard>
        );
      })()}

      {/* Training card */}
      {effectiveDay.training ? (
        <AccentCard as={Link} to="/training" accent="#00d4aa" className="block hover:brightness-110">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="mono text-[.58rem] text-lime uppercase tracking-[.2em]">training · {gymChoice.label}</div>
              <div className="font-display text-[1.25rem] text-ink leading-none tabular-nums mt-[2px]"
                style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
                {effectiveDay.training.label}
              </div>
              <div className="mono text-[.6rem] text-mute uppercase tracking-[.14em] mt-1">
                {effectiveDay.training.timeSlot}
              </div>
            </div>
            <div className="text-right shrink-0 pl-2">
              {session?.completed ? (
                <div className="mono text-[.62rem] text-lime uppercase tracking-[.14em]">✓ done</div>
              ) : (session?.sets?.length > 0) ? (
                <div className="mono text-[.62rem] text-amber uppercase tracking-[.14em]">{session.sets.length} sets</div>
              ) : (
                <div className="mono text-[.62rem] text-ink2 uppercase tracking-[.14em]">start →</div>
              )}
            </div>
          </div>
        </AccentCard>
      ) : (
        <AccentCard accent="#9a9a9a">
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">training</div>
          <div className="mono text-[.7rem] text-ink2 mt-1">{gymChoice.label} · {gymChoice.hint}</div>
        </AccentCard>
      )}

    </div>
  );
}
