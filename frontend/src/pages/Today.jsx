import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PLAN, todayStr, fmtDate, getWeekNum } from "../lib/plan";
import { useAuth } from "../lib/auth.jsx";
import FULL_SCHEDULE from "../lib/daily_schedule";
import { api } from "../lib/api";
import { quoteForDate } from "../lib/quotes";
import { getHabitsForPhase } from "../lib/protocols";
import { getPushStatus, subscribeToPush, unsubscribeFromPush, sendTestPush, pushSupported } from "../lib/notify";
import { Icon, Empty } from "../components/ui";

// ─── Accelerometer pedometer (mobile browsers) ───
// Peak-detection on vertical accel magnitude — coarse but workable.
function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [supported, setSupported] = useState(true);
  const lastPeakRef = useRef(0);
  const handlerRef = useRef(null);

  const start = async () => {
    if (typeof DeviceMotionEvent === "undefined") {
      setSupported(false);
      return;
    }
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== "granted") { setSupported(false); return; }
      } catch { setSupported(false); return; }
    }
    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      const now = Date.now();
      // Threshold ~12 m/s² with 350ms debounce — empirical walking cadence
      if (mag > 12 && now - lastPeakRef.current > 350) {
        lastPeakRef.current = now;
        setSteps((s) => s + 1);
      }
    };
    handlerRef.current = onMotion;
    window.addEventListener("devicemotion", onMotion);
    setRunning(true);
  };

  const stop = () => {
    if (handlerRef.current) {
      window.removeEventListener("devicemotion", handlerRef.current);
      handlerRef.current = null;
    }
    setRunning(false);
  };

  const reset = () => setSteps(0);

  useEffect(() => () => {
    if (handlerRef.current) window.removeEventListener("devicemotion", handlerRef.current);
  }, []);

  return { steps, running, supported, start, stop, reset };
}

const CAT_STYLE = {
  routine:    { dot: "#a1a1a6", label: "ROUT" },
  supplement: { dot: "#bf5af2", label: "SUPP" },
  checkpoint: { dot: "#30d158", label: "CHK"  },
  exercise:   { dot: "#ff9f0a", label: "EXR"  },
  activity:   { dot: "#ff9f0a", label: "ACT"  },
  cardio:     { dot: "#64d2ff", label: "CAR"  },
  training:   { dot: "#30d158", label: "GYM"  },
  nutrition:  { dot: "#ff9f0a", label: "EAT"  },
  family:     { dot: "#bf5af2", label: "FAM"  },
  sleep:      { dot: "#0a84ff", label: "SLP"  }
};

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const hhmmToMin = (s) => {
  if (!s) return 0;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

function FastingClock({ eating }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const d = new Date();
  const nowMin = d.getHours() * 60 + d.getMinutes();

  if (!eating?.window) {
    // FAST day — whole day fasting
    return (
      <div className="card p-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">fasting</div>
            <div className="font-display text-[1.5rem] text-cyan leading-none tabular-nums mt-[2px]"
              style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
              all day
            </div>
          </div>
          <div className="mono text-[.62rem] text-cyan uppercase tracking-[.14em]">0 kcal</div>
        </div>
      </div>
    );
  }

  const wStart = hhmmToMin(eating.window.start);
  const wEnd = hhmmToMin(eating.window.end);
  const inWindow = nowMin >= wStart && nowMin <= wEnd;
  const beforeWindow = nowMin < wStart;

  let label, value, unit, color;
  if (inWindow) {
    const mins = wEnd - nowMin;
    label = "eat window · left";
    value = `${Math.floor(mins / 60)}h ${mins % 60}m`;
    color = "lime";
  } else if (beforeWindow) {
    const mins = wStart - nowMin;
    label = "until eat window";
    value = `${Math.floor(mins / 60)}h ${mins % 60}m`;
    color = "cyan";
  } else {
    const mins = (24 * 60 - nowMin) + wStart;
    label = "closed · next window";
    value = `${Math.floor(mins / 60)}h ${mins % 60}m`;
    color = "cyan";
  }

  // 24h bar with eat window highlighted
  const nowPct = (nowMin / (24 * 60)) * 100;
  const wStartPct = (wStart / (24 * 60)) * 100;
  const wWidthPct = ((wEnd - wStart) / (24 * 60)) * 100;

  return (
    <div className="card p-3">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className={`mono text-[.58rem] text-${color} uppercase tracking-[.2em]`}>{label}</div>
          <div className={`font-display text-[1.5rem] text-${color} leading-none tabular-nums mt-[2px]`}
            style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
            {value}
          </div>
        </div>
        <div className="mono text-[.58rem] text-ink2 tabular-nums">
          {eating.window.start}<span className="text-mute">–</span>{eating.window.end}
        </div>
      </div>
      <div className="relative h-[6px] bg-bg2 rounded-full overflow-hidden border border-line/50">
        <div className="absolute top-0 bottom-0 bg-cyan/40 border-l border-r border-cyan/70"
             style={{ left: `${wStartPct}%`, width: `${wWidthPct}%` }} />
        <div className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-amber shadow-[0_0_6px_theme(colors.amber)]"
             style={{ left: `${nowPct}%` }} />
      </div>
      <div className="mt-1 flex justify-between mono text-[.5rem] text-mute uppercase tracking-[.16em]">
        <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
      </div>
    </div>
  );
}

export default function Today() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [date, setDate] = useState(todayStr());
  const now = nowHHMM();
  const [stepsLogged, setStepsLogged] = useState(0);
  const [stepInput, setStepInput] = useState("");
  const [waterMl, setWaterMl] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pushStatus, setPushStatus] = useState("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [mealsTotals, setMealsTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 });
  const [session, setSession] = useState(null);
  const [habitLogs, setHabitLogs] = useState({});
  const pedo = useStepCounter();
  const quote = useMemo(() => quoteForDate(date), [date]);
  const week = getWeekNum(date);
  const habitsMap = useMemo(() => getHabitsForPhase(week), [week]);

  const sw = user?.start_weight || PLAN.startWeight;
  const tw = user?.target_weight || PLAN.targetWeight;
  const totalJourney = sw - tw;
  const lost = currentWeight ? Math.max(0, sw - currentWeight) : 0;
  const journeyPct = totalJourney > 0 ? Math.min(100, Math.round((lost / totalJourney) * 100)) : 0;

  useEffect(() => { getPushStatus().then(setPushStatus); }, []);

  useEffect(() => {
    const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    api.get(`/logs?from=${from}&to=${todayStr()}`)
      .then((range) => {
        const latest = [...(range || [])].reverse().find((r) => r.weight_kg != null);
        if (latest) setCurrentWeight(latest.weight_kg);
      })
      .catch(() => {});
  }, []);

  const onSubscribe = async () => {
    setPushBusy(true);
    try {
      const s = await subscribeToPush();
      setPushStatus(s);
    } catch (e) {
      setPushStatus(e.message || "denied");
    } finally {
      setPushBusy(false);
    }
  };
  const onUnsubscribe = async () => {
    setPushBusy(true);
    try { await unsubscribeFromPush(); setPushStatus("default"); }
    finally { setPushBusy(false); }
  };
  const onTest = async () => {
    try { await sendTestPush(); } catch (e) { console.error(e); }
  };

  const day = useMemo(
    () => FULL_SCHEDULE.days.find((d) => d.date === date),
    [date]
  );

  useEffect(() => {
    let cancelled = false;
    api.get(`/logs/${date}`).then((l) => {
      if (cancelled) return;
      const v = l?.steps || 0;
      setStepsLogged(v);
      setStepInput(v ? String(v) : "");
      setWaterMl(l?.water_ml || 0);
      if (l?.weight_kg != null) {
        setCurrentWeight(l.weight_kg);
        setWeightInput(String(l.weight_kg));
      } else {
        setWeightInput("");
      }
    }).catch(() => {});
    api.get(`/meals?date=${date}`).then((meals) => {
      if (cancelled) return;
      const totals = (meals || []).reduce((acc, m) => {
        (m.items || []).forEach((it) => {
          acc.kcal += it.kcal || 0;
          acc.protein += it.protein_g || 0;
          acc.carbs += it.carbs_g || 0;
          acc.fat += it.fat_g || 0;
        });
        return acc;
      }, { kcal: 0, protein: 0, carbs: 0, fat: 0, count: (meals || []).length });
      setMealsTotals(totals);
    }).catch(() => {});
    api.get(`/training/session?date=${date}`).then((s) => {
      if (!cancelled) setSession(s);
    }).catch(() => { if (!cancelled) setSession(null); });
    api.get(`/habits/${date}`).then((h) => {
      if (!cancelled) setHabitLogs(h || {});
    }).catch(() => {});
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

  const saveSteps = async (val) => {
    const n = parseInt(val, 10);
    if (!Number.isFinite(n) || n < 0) return;
    await api.put(`/logs/${date}`, { steps: n });
    setStepsLogged(n);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 600);
  };

  const saveWater = async (ml) => {
    const next = Math.max(0, ml);
    setWaterMl(next);
    await api.put(`/logs/${date}`, { water_ml: next });
  };

  const commitPedoToDay = async () => {
    const n = stepsLogged + pedo.steps;
    await saveSteps(n);
    setStepInput(String(n));
    pedo.reset();
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

  // Current-time indicator index
  let currentIdx = -1;
  for (let i = 0; i < day.schedule.length; i++) {
    if (day.schedule[i].time <= now) currentIdx = i;
    else break;
  }

  return (
    <div className="page page-today">
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
          <div className="mono text-sm text-amber font-bold tabular-nums">{day.eating.targets.kcal}</div>
          <div className="mono text-[.58rem] text-amber/70 uppercase tracking-[.14em]">kcal</div>
        </div>
      </div>

      {/* Fasting window clock */}
      <FastingClock eating={day.eating} />

      {/* Journey — to go */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-[6px]">
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">journey</div>
          <div className="mono text-[.62rem] uppercase tracking-[.14em] flex items-center gap-[6px]">
            <span className="text-lime tabular-nums">−{Math.max(0, totalJourney - lost).toFixed(1)}kg to go</span>
          </div>
        </div>
        <div className="h-[3px] bg-bg2 rounded-full overflow-hidden border border-line/50">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${journeyPct}%`,
              background: "linear-gradient(90deg, #ff9f0a 0%, #30d158 100%)",
              boxShadow: "0 0 8px rgba(48,209,88,.4)"
            }}
          />
        </div>
        <div className="mt-[6px] flex justify-between mono text-[.52rem] uppercase tracking-[.18em] tabular-nums">
          <span className="text-mute">start {sw.toFixed(0)}</span>
          <span className="text-lime">target {tw.toFixed(0)}</span>
        </div>
      </div>

      {/* Weight card */}
      <div className="card p-3">
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
      </div>

      {/* Meals ring */}
      {(() => {
        const kcalTarget = day.eating.targets.kcal || 0;
        const protTarget = day.eating.targets.protein || 0;
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
          <Link to="/log" className="card p-3 block hover:border-line/80 transition">
            <div className="flex items-center justify-between mb-2">
              <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">nutrition</div>
              <div className="mono text-[.58rem] text-ink2 uppercase tracking-[.14em]">
                {mealsTotals.count} meal{mealsTotals.count !== 1 ? "s" : ""} <span className="text-mute">→</span>
              </div>
            </div>
            {kcalTarget === 0 ? (
              <div className="mono text-[.7rem] text-cyan text-center py-2">fast day · 0 kcal</div>
            ) : (
              <div className="flex justify-around">
                {ring(kcalPct, "#ff9f0a", "kcal", Math.round(mealsTotals.kcal), kcalTarget, "")}
                {ring(protPct, "#30d158", "protein", Math.round(mealsTotals.protein), protTarget, "g")}
              </div>
            )}
          </Link>
        );
      })()}

      {/* Push notification panel */}
      {date === todayStr() && pushSupported() && (
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="pulse-dot" />
            <div className="card-title flex-1">Daily push</div>
            <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em]">
              {pushStatus === "subscribed" ? "on" : pushStatus === "denied" ? "blocked" : "off"}
            </div>
          </div>
          <div className="mono text-[.62rem] text-mute mb-2">
            Random time 07:00–21:00 · quote + reminder, sent from server
          </div>
          {pushStatus === "subscribed" ? (
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={onTest} disabled={pushBusy}>send test</button>
              <button className="btn-ghost flex-1" onClick={onUnsubscribe} disabled={pushBusy}>disable</button>
            </div>
          ) : pushStatus === "denied" ? (
            <div className="mono text-[.6rem] text-warn">Permission blocked — enable in browser settings</div>
          ) : (
            <button className="btn-primary w-full" onClick={onSubscribe} disabled={pushBusy}>
              {pushBusy ? "…" : "enable push"}
            </button>
          )}
        </div>
      )}

      {/* Water tracker */}
      {(() => {
        const target = (day.waterLiters || 3) * 1000;
        const glassSize = 250;
        const totalGlasses = Math.ceil(target / glassSize);
        const filled = Math.floor(waterMl / glassSize);
        const pct = Math.min(100, Math.round((waterMl / target) * 100));
        return (
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="mono text-[.58rem] text-cyan uppercase tracking-[.2em]">hydration</div>
                <div className="font-display text-[1.5rem] text-cyan leading-none tabular-nums mt-[2px]"
                  style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
                  {(waterMl / 1000).toFixed(2)}<span className="text-[.8rem] text-ink2 font-light ml-[4px]">L</span>
                  <span className="text-mute text-[.7rem] font-light ml-[6px]">/ {(target / 1000).toFixed(1)}L</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn-icon text-cyan" onClick={() => saveWater(waterMl - 250)} title="−250ml">−</button>
                <button className="btn-icon text-cyan" onClick={() => saveWater(waterMl + 250)} title="+250ml">+</button>
              </div>
            </div>
            <div className="flex gap-[3px] mt-1">
              {Array.from({ length: totalGlasses }).map((_, i) => (
                <div key={i} className={`flex-1 h-[6px] rounded-sm transition ${i < filled ? "bg-cyan shadow-[0_0_6px_rgba(100,210,255,.5)]" : "bg-bg2 border border-line/50"}`} />
              ))}
            </div>
            <div className="mt-1 mono text-[.52rem] text-mute uppercase tracking-[.18em] text-right">{pct}%</div>
          </div>
        );
      })()}

      {/* Step counter */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">
            Steps · {stepsLogged.toLocaleString()} / {day.stepTarget.toLocaleString()}
          </div>
          {savedFlash && <div className="mono text-[.58rem] text-signal uppercase tracking-[.14em]">✓ saved</div>}
        </div>

        {/* Progress bar — amber fill (energy) that brightens to lime at 100% */}
        <div className="h-2 bg-bg2 rounded overflow-hidden mb-3">
          <div
            className={`h-full transition-all ${stepsLogged >= day.stepTarget ? "bg-lime shadow-[0_0_10px_rgba(48,209,88,.5)]" : "bg-amber shadow-[0_0_8px_rgba(255,159,10,.4)]"}`}
            style={{ width: `${Math.min(100, Math.round((stepsLogged / day.stepTarget) * 100))}%` }}
          />
        </div>

        {/* Manual input */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            inputMode="numeric"
            className="input flex-1 mono text-sm"
            placeholder="manual steps"
            value={stepInput}
            onChange={(e) => setStepInput(e.target.value)}
          />
          <button className="btn-ghost" onClick={() => saveSteps(stepInput)}>save</button>
        </div>

        {/* Pedometer (accelerometer-based) */}
        {pedo.supported && date === todayStr() && (
          <div className="flex items-center gap-2">
            <div className="flex-1 mono text-[.7rem] text-ink2">
              {pedo.running
                ? <>Counting… <span className="text-amber font-bold tabular-nums">+{pedo.steps}</span></>
                : "Pedometer (phone in pocket)"}
            </div>
            {!pedo.running ? (
              <button className="btn-ghost" onClick={pedo.start}>start</button>
            ) : (
              <>
                <button className="btn-ghost" onClick={pedo.stop}>pause</button>
                <button className="btn-ghost" onClick={commitPedoToDay} disabled={!pedo.steps}>+ log</button>
              </>
            )}
          </div>
        )}
        {!pedo.supported && (
          <div className="mono text-[.6rem] text-mute">
            Pedometer not supported on this device — type manually
          </div>
        )}
      </div>

      {/* Training card */}
      {day.training ? (
        <Link to="/training" className="card p-3 block hover:border-line/80 transition">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="mono text-[.58rem] text-lime uppercase tracking-[.2em]">training · day {day.training.type}</div>
              <div className="font-display text-[1.25rem] text-ink leading-none tabular-nums mt-[2px]"
                style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
                {day.training.label}
              </div>
              <div className="mono text-[.6rem] text-mute uppercase tracking-[.14em] mt-1">
                {day.training.timeSlot} · {day.training.exercises.length} exercises
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
        </Link>
      ) : (
        <div className="card p-3">
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">training</div>
          <div className="mono text-[.7rem] text-ink2 mt-1">rest day · recovery</div>
        </div>
      )}

      {/* Habits mini */}
      {(() => {
        const sections = [
          { key: "morning",    color: "#ff9f0a" },
          { key: "throughout", color: "#64d2ff" },
          { key: "evening",    color: "#bf5af2" }
        ];
        const daily = [...(habitsMap.morning || []), ...(habitsMap.throughout || []), ...(habitsMap.evening || [])];
        const done = daily.filter((h) => habitLogs[h.id]).length;
        const total = daily.length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        const perSection = sections.map((s) => {
          const items = habitsMap[s.key] || [];
          const d = items.filter((h) => habitLogs[h.id]).length;
          return { ...s, d, t: items.length };
        });
        return (
          <Link to="/habits" className="card p-3 block hover:border-line/80 transition">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">habits</div>
                <div className="font-display text-[1.25rem] leading-none tabular-nums mt-[2px]"
                  style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
                  <span className={done === total && total > 0 ? "text-lime" : done > 0 ? "text-amber" : "text-mute"}>{done}</span>
                  <span className="text-mute text-[.8rem]">/{total}</span>
                </div>
              </div>
              <div className="mono text-[.62rem] text-ink2 uppercase tracking-[.14em]">{pct}% →</div>
            </div>
            <div className="flex gap-2">
              {perSection.map((s) => (
                <div key={s.key} className="flex-1">
                  <div className="h-[4px] rounded-full bg-bg2 border border-line/50 overflow-hidden">
                    <div className="h-full transition-all"
                      style={{ width: s.t ? `${(s.d / s.t) * 100}%` : "0%", background: s.color, boxShadow: `0 0 6px ${s.color}99` }} />
                  </div>
                  <div className="mt-[3px] mono text-[.5rem] text-mute uppercase tracking-[.14em] text-center">{s.key} {s.d}/{s.t}</div>
                </div>
              ))}
            </div>
          </Link>
        );
      })()}

      {/* Quote of the day — amber/lime subtle tint */}
      <div className="card p-4 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, rgba(255,159,10,.04) 0%, rgba(48,209,88,.04) 100%)"
      }}>
        <div className="absolute top-2 left-3 font-display text-[2.5rem] leading-none text-amber/40 select-none italic">"</div>
        <div className="pl-6 pt-1">
          <div className="mono text-[.78rem] text-ink leading-snug italic">{quote.q}</div>
          <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em] mt-2">— {quote.a}</div>
        </div>
      </div>

      {/* Checkpoint banner */}
      {day.isCheckpointDay && day.checkpoint && (
        <Link to="/checkin" className="card p-3 border-cyan/40 bg-cyan/[.05] hover:border-cyan/60 transition block">
          <div className="mono text-[.62rem] text-cyan uppercase tracking-[.14em] mb-1">
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
                isCurrent ? "border-amber/60 bg-amber/[.06] shadow-[0_0_0_1px_rgba(255,159,10,.15)]" : ""
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
