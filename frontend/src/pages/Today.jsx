import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PLAN, todayStr, fmtDate, getWeekNum, getPhase, getDayPlan, getEatingTarget, daysBetween } from "../lib/plan";
import { useAuth } from "../lib/auth.jsx";
import { api } from "../lib/api";
import { dailyReadiness, recoveryCoachNote } from "../lib/coaching";
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

const recoverySnapshotKey = (value = {}) => JSON.stringify({
  energy: value.energy === "" || value.energy == null ? null : Number(value.energy),
  hunger: value.hunger === "" || value.hunger == null ? null : Number(value.hunger),
  headache: value.headache === "" || value.headache == null ? null : Number(value.headache)
});

const hasRecoveryValue = (value = {}) =>
  ["energy", "hunger", "headache"].some((field) => value[field] !== "" && value[field] != null);

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
  label: `${foodChoice.label} · ${gymChoice.label}`,
  detail: `${foodChoice.hint} · ${gymChoice.hint}`
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
    waterLiters: isFastDay ? 3.0 : 2.5,
    supplements: {
      morning: ["D3+K2", "Omega-3 (vegan)"],
      evening: ["Magnesium", "B12"],
      note: "Oruç günlerinde de supplement al"
    },
    session
  };
};

function RecoveryCheck({ value, onChange, onSave, saving, saved, coachNote }) {
  const fields = [
    { id: "energy", label: "energy", low: "flat", high: "sharp", color: "#30d158" },
    { id: "hunger", label: "hunger", low: "quiet", high: "loud", color: "#ff9f0a" },
    { id: "headache", label: "headache", low: "none", high: "hard", color: "#64d2ff" }
  ];
  return (
    <AccentCard accent="#64d2ff">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="card-title">Recovery signal</div>
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] mt-[2px]">
            fasting · sleep · training readiness
          </div>
        </div>
        <button className="btn-ghost shrink-0" onClick={onSave} disabled={saving || saved}>
          {saving ? "..." : saved ? "saved" : "save"}
        </button>
      </div>
      <div className="grid gap-3">
        {fields.map((f) => (
          <div key={f.id}>
            <div className="flex justify-between mono text-[.56rem] uppercase tracking-[.14em] mb-1">
              <span className="text-mute">{f.label}</span>
              <span className="text-ink2">{value[f.id] || "--"}/5</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = Number(value[f.id]) === n;
                return (
                  <button
                    key={n}
                    className="h-8 rounded-md border mono text-xs transition"
                    style={{
                      borderColor: active ? f.color : "rgba(72,72,74,.75)",
                      background: active ? f.color : "rgba(28,28,30,.65)",
                      color: active ? "#000000" : "#d1d1d6"
                    }}
                    onClick={() => onChange(f.id, n)}
                    type="button"
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mono text-[.5rem] text-mute uppercase tracking-[.14em] mt-1">
              <span>{f.low}</span><span>{f.high}</span>
            </div>
          </div>
        ))}
      </div>
      {coachNote && (
        <div className="mt-3 soft-band px-3 py-2 mono text-[.64rem] text-ink2 leading-snug">
          {coachNote}
        </div>
      )}
    </AccentCard>
  );
}

function CommandCard({ readiness, day, leftKg, journeyPct, foodChoice, gymChoice, headline, onFoodChange, onGymChange }) {
  if (!readiness) return null;
  const fastDay = !foodChoice?.window;
  const timing = windowState(foodChoice);
  const accent = readiness.color;
  return (
    <div className="command-card" style={{ borderColor: `${accent}70`, background: `linear-gradient(135deg, ${accent}14 0%, rgba(28,28,30,.94) 48%, rgba(10,10,11,.94) 100%)` }}>
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent, boxShadow: `0 0 14px ${accent}90` }} />
      <div className="pl-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mono text-[.58rem] uppercase tracking-[.18em]" style={{ color: accent }}>
            today's call
          </div>
          <div className="font-display text-[1.65rem] leading-none text-ink mt-1"
            style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
            {headline.label}
          </div>
          <div className="mono text-[.7rem] text-ink2 leading-snug mt-2">{headline.detail}</div>
          <div className="mono text-[.62rem] text-mute leading-snug mt-1">{readiness.detail}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pl-2">
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
          <div className="mono text-[.56rem] uppercase tracking-[.16em]" style={{ color: fastDay ? "#64d2ff" : accent }}>
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
            <div className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-amber shadow-[0_0_6px_rgba(251,191,36,.8)]"
                 style={{ left: `${timing.nowPct}%` }} />
          </div>
        )}
      </div>

      <div className="mt-3 pl-2">
        <div className="flex items-center justify-between mono text-[.56rem] uppercase tracking-[.14em] mb-1">
          <span className="text-mute">journey</span>
          <span className="text-lime tabular-nums">-{leftKg.toFixed(1)}kg left</span>
        </div>
        <div className="h-[4px] bg-bg2 rounded-full overflow-hidden border border-line/50">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${journeyPct}%`,
              background: `linear-gradient(90deg, #ff9f0a 0%, ${accent} 100%)`,
              boxShadow: `0 0 8px ${accent}80`
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
  const [waterMl, setWaterMl] = useState(0);
  const [coffeeMl, setCoffeeMl] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [mealsTotals, setMealsTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 });
  const [session, setSession] = useState(null);
  const [recovery, setRecovery] = useState({ energy: "", hunger: "", headache: "" });
  const [savedRecoveryKey, setSavedRecoveryKey] = useState(null);
  const [recoverySaving, setRecoverySaving] = useState(false);
  const [, setClockTick] = useState(0);
  const [callPrefs, setCallPrefs] = useState(() => readTodayCallPrefs(todayStr()));
  const week = getWeekNum(date);
  const phase = getPhase(week);
  const dayIdx = daysBetween(PLAN.startDate, date) + 1;
  const phaseStartDay = (phase.weeks[0] - 1) * 7 + 1;
  const isPhaseFirstDay = dayIdx === phaseStartDay;
  const recoverySaved = hasRecoveryValue(recovery) && savedRecoveryKey === recoverySnapshotKey(recovery);

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
  const readiness = effectiveDay ? dailyReadiness({ day: effectiveDay, recovery, mealsTotals, session }) : null;
  const recoveryNote = recoverySaved ? recoveryCoachNote(recovery, !foodChoice?.window) : null;

  useEffect(() => {
    setCallPrefs(readTodayCallPrefs(date));
  }, [date]);

  useEffect(() => {
    writeTodayCallPrefs(date, callPrefs);
  }, [date, callPrefs]);

  useEffect(() => {
    let cancelled = false;
    setSavedRecoveryKey(null);
    api.get(`/logs/${date}`).then((l) => {
      if (cancelled) return;
      setWaterMl(l?.water_ml || 0);
      setCoffeeMl(l?.coffee_ml || 0);
      if (l?.weight_kg != null) {
        setCurrentWeight(l.weight_kg);
        setWeightInput(String(l.weight_kg));
      } else {
        setWeightInput("");
      }
      const nextRecovery = {
        energy: l?.energy ?? "",
        hunger: l?.hunger ?? "",
        headache: l?.headache ?? ""
      };
      setRecovery(nextRecovery);
      setSavedRecoveryKey(hasRecoveryValue(nextRecovery) ? recoverySnapshotKey(nextRecovery) : null);
    }).catch(() => {});
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

  const saveWeight = async () => {
    const n = parseFloat(weightInput);
    if (!Number.isFinite(n) || n <= 0) return;
    await api.put(`/logs/${date}`, { weight_kg: n });
    setCurrentWeight(n);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 600);
  };

  const saveWater = async (ml) => {
    const next = Math.max(0, ml);
    setWaterMl(next);
    await api.put(`/logs/${date}`, { water_ml: next });
  };

  const saveCoffee = async (ml) => {
    const next = Math.max(0, ml);
    setCoffeeMl(next);
    await api.put(`/logs/${date}`, { coffee_ml: next });
  };

  const saveRecovery = async () => {
    setRecoverySaving(true);
    try {
      const clean = Object.fromEntries(
        Object.entries(recovery).map(([key, value]) => [key, value === "" ? null : Number(value)])
      );
      await api.put(`/logs/${date}`, clean);
      setSavedRecoveryKey(recoverySnapshotKey(clean));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 600);
    } finally {
      setRecoverySaving(false);
    }
  };

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
        <AccentCard accent="#ff9f0a" className="text-center">
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

      {/* Phase transition celebration */}
      {isPhaseFirstDay && (
        <AccentCard accent={phase.color} className="text-center">
          <div className="mono text-[.62rem] uppercase tracking-[.22em] font-bold animate-pulse"
            style={{ color: phase.color, textShadow: `0 0 10px ${phase.color}99` }}>
            ★ phase {phase.id} unlocked
          </div>
        </AccentCard>
      )}

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

      <RecoveryCheck
        value={recovery}
        saving={recoverySaving}
        saved={recoverySaved}
        coachNote={recoveryNote}
        onChange={(field, score) => setRecovery((prev) => ({ ...prev, [field]: score }))}
        onSave={saveRecovery}
      />

      {/* Weight card */}
      <AccentCard accent="#30d158">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">weight</div>
            <div className="font-display text-[1.5rem] text-ink leading-none tabular-nums mt-[2px]"
              style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
              {currentWeight != null ? currentWeight.toFixed(1) : "—"}<span className="text-[.8rem] text-ink2 font-light ml-[4px]">kg</span>
            </div>
          </div>
          {currentWeight != null && (
            <div className="text-right">
              <div className={`mono text-[.72rem] tabular-nums font-bold ${sw - currentWeight >= 0 ? "text-lime" : "text-coral"}`}>
                {sw - currentWeight >= 0 ? "−" : "+"}{Math.abs(sw - currentWeight).toFixed(1)}kg
              </div>
              <div className="mono text-[.54rem] text-mute uppercase tracking-[.18em] mt-[2px]">vs start</div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            className="input flex-1 mono text-sm"
            placeholder="kg"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />
          <button className="btn-ghost" onClick={saveWeight}>save</button>
          {savedFlash && <span className="mono text-[.58rem] text-signal uppercase tracking-[.14em]">✓</span>}
        </div>
      </AccentCard>

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
          <AccentCard as={Link} to="/log" accent="#ff9f0a" className="block hover:brightness-110">
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
                  {ring(kcalPct, "#ff9f0a", "kcal", Math.round(mealsTotals.kcal), kcalTarget, "")}
                  {ring(protPct, "#30d158", "protein", Math.round(mealsTotals.protein), protTarget, "g")}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="metric-tile px-2 py-2 text-center">
                    <div className="metric-label">kcal left</div>
                    <div className="metric-value text-[.86rem] text-amber">{Math.max(0, Math.round(kcalTarget - mealsTotals.kcal))}</div>
                  </div>
                </div>
              </>
            )}
          </AccentCard>
        );
      })()}

      {/* Water tracker */}
      {(() => {
        const target = (day.waterLiters || 3) * 1000;
        const glassSize = 250;
        const totalGlasses = Math.ceil(target / glassSize);
        const totalMl = waterMl + coffeeMl;
        const filled = Math.floor(totalMl / glassSize);
        const pct = Math.min(100, Math.round((totalMl / target) * 100));
        const drinkControl = (label, value, colorClass, onMinus, onPlus) => (
          <div className="soft-band px-2 py-2 flex items-center gap-2">
            <div className="min-w-[54px]">
              <div className={`mono text-[.56rem] uppercase tracking-[.14em] ${colorClass}`}>{label}</div>
              <div className="mono text-[.62rem] text-ink2 tabular-nums">{(value / 1000).toFixed(2)}L</div>
            </div>
            <button
              className="h-10 w-10 rounded-md bg-bg2 hover:bg-surface3 border border-line text-lg leading-none text-mute transition grid place-items-center shrink-0"
              onClick={onMinus}
              disabled={value <= 0}
              title={`-250ml ${label}`}
              type="button"
            >
              −
            </button>
            <button
              className={`h-10 w-10 rounded-md bg-bg2 hover:bg-surface3 border border-line text-lg leading-none transition grid place-items-center shrink-0 ${colorClass}`}
              onClick={onPlus}
              title={`+250ml ${label}`}
              type="button"
            >
              +
            </button>
          </div>
        );
        return (
          <AccentCard accent="#64d2ff">
            <div className="flex items-start justify-between mb-2 gap-3">
              <div>
                <div className="mono text-[.58rem] text-cyan uppercase tracking-[.2em]">hydration</div>
                <div className="font-display text-[1.5rem] text-cyan leading-none tabular-nums mt-[2px]"
                  style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
                  {(totalMl / 1000).toFixed(2)}<span className="text-[.8rem] text-ink2 font-light ml-[4px]">L</span>
                  <span className="text-mute text-[.7rem] font-light ml-[6px]">/ {(target / 1000).toFixed(1)}L</span>
                </div>
                <div className="mono text-[.56rem] text-mute uppercase tracking-[.14em] mt-1">
                  water {(waterMl / 1000).toFixed(2)}L · coffee {(coffeeMl / 1000).toFixed(2)}L
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 mb-2">
              {drinkControl("water", waterMl, "text-cyan", () => saveWater(waterMl - 250), () => saveWater(waterMl + 250))}
              {drinkControl("coffee", coffeeMl, "text-amber", () => saveCoffee(coffeeMl - 250), () => saveCoffee(coffeeMl + 250))}
            </div>
            <div className="flex gap-[3px] mt-1">
              {Array.from({ length: totalGlasses }).map((_, i) => (
                <div key={i} className={`flex-1 h-[6px] rounded-sm transition ${i < filled ? "bg-cyan shadow-[0_0_6px_rgba(100,210,255,.5)]" : "bg-bg2 border border-line/50"}`} />
              ))}
            </div>
            <div className="mt-1 mono text-[.52rem] text-mute uppercase tracking-[.18em] text-right">{pct}%</div>
          </AccentCard>
        );
      })()}

      {/* Training card */}
      {effectiveDay.training ? (
        <AccentCard as={Link} to="/training" accent="#30d158" className="block hover:brightness-110">
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
        <AccentCard accent="#64d2ff">
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">training</div>
          <div className="mono text-[.7rem] text-ink2 mt-1">{gymChoice.label} · {gymChoice.hint}</div>
        </AccentCard>
      )}

      {/* Checkpoint banner */}
      {day.isCheckpointDay && day.checkpoint && (
        <AccentCard as={Link} to="/checkin" accent="#64d2ff" className="block hover:brightness-110">
          <div className="mono text-[.62rem] text-cyan uppercase tracking-[.14em] mb-1">
            {t("checkin.title")}
          </div>
          <div className="mono text-xs text-ink2">{day.checkpoint.tasks.join(" · ")}</div>
        </AccentCard>
      )}


      {/* Supplements footer */}
      {day.supplements && (
        <AccentCard accent="#bf5af2">
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] mb-1">Supplements</div>
          <div className="grid min-[420px]:grid-cols-2 gap-2">
            <div className="soft-band px-2 py-2">
              <div className="mono text-[.52rem] text-mute uppercase tracking-[.14em]">AM</div>
              <div className="mono text-[.66rem] text-ink2 mt-1">{day.supplements.morning.join(", ")}</div>
            </div>
            <div className="soft-band px-2 py-2">
              <div className="mono text-[.52rem] text-mute uppercase tracking-[.14em]">PM</div>
              <div className="mono text-[.66rem] text-ink2 mt-1">{day.supplements.evening.join(", ")}</div>
            </div>
          </div>
        </AccentCard>
      )}
    </div>
  );
}
