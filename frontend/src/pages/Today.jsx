import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PLAN, todayStr, fmtDate, getWeekNum, getPhase, daysBetween } from "../lib/plan";
import { useAuth } from "../lib/auth.jsx";
import FULL_SCHEDULE from "../lib/daily_schedule";
import { api } from "../lib/api";
import { quoteForDate } from "../lib/quotes";
import { Icon, Empty } from "../components/ui";

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

function FastDayAssistant({ day }) {
  if (day.eating?.window) return null;
  const items = [
    ["hydrate", "700ml water + 1/2 lemon + tiny pinch natron"],
    ["salt", "Tiny pinch salt only if headache or flat energy appears"],
    ["move", "Easy walk only; no bonus training, no ego cardio"],
    ["sleep", "Protect sleep tonight; recovery is the fat-loss multiplier"]
  ];
  return (
    <div className="card p-3 border-cyan/30 bg-cyan/[.035]">
      <div className="flex items-start gap-2">
        <Icon.zap size={16} className="text-cyan mt-[2px] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="card-title text-cyan">Fast day assistant</div>
          <div className="mt-2 grid gap-2">
            {items.map(([key, text]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="mt-[5px] w-[6px] h-[6px] rounded-full bg-cyan shadow-[0_0_8px_rgba(100,210,255,.5)] shrink-0" />
                <div className="mono text-[.66rem] text-ink2 leading-snug">{text}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 mono text-[.58rem] text-mute uppercase tracking-[.14em]">
            Dizziness or hard headache means slow down first.
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoveryCheck({ value, onChange, onSave, saving }) {
  const fields = [
    { id: "energy", label: "energy", low: "flat", high: "sharp", color: "#30d158" },
    { id: "hunger", label: "hunger", low: "quiet", high: "loud", color: "#ff9f0a" },
    { id: "headache", label: "headache", low: "none", high: "hard", color: "#64d2ff" }
  ];
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="card-title">Recovery signal</div>
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] mt-[2px]">
            fasting · sleep · training readiness
          </div>
        </div>
        <button className="btn-ghost shrink-0" onClick={onSave} disabled={saving}>
          {saving ? "..." : "save"}
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
    </div>
  );
}

export default function Today() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [date, setDate] = useState(todayStr());
  const now = nowHHMM();
  const [waterMl, setWaterMl] = useState(0);
  const [coffeeMl, setCoffeeMl] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [mealsTotals, setMealsTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 });
  const [session, setSession] = useState(null);
  const [recovery, setRecovery] = useState({ energy: "", hunger: "", headache: "" });
  const [recoverySaving, setRecoverySaving] = useState(false);
  const quote = useMemo(() => quoteForDate(date), [date]);
  const week = getWeekNum(date);
  const phase = getPhase(week);
  const dayIdx = daysBetween(PLAN.startDate, date) + 1;
  const phaseStartDay = (phase.weeks[0] - 1) * 7 + 1;
  const isPhaseFirstDay = dayIdx === phaseStartDay;

  const sw = user?.start_weight || PLAN.startWeight;
  const tw = user?.target_weight || PLAN.targetWeight;
  const totalJourney = sw - tw;
  const lost = currentWeight ? Math.max(0, sw - currentWeight) : 0;
  const journeyPct = totalJourney > 0 ? Math.min(100, Math.round((lost / totalJourney) * 100)) : 0;

  useEffect(() => {
    const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    api.get(`/logs?from=${from}&to=${todayStr()}`)
      .then((range) => {
        const latest = [...(range || [])].reverse().find((r) => r.weight_kg != null);
        if (latest) setCurrentWeight(latest.weight_kg);
      })
      .catch(() => {});
  }, []);

  const day = useMemo(() => {
    const hit = FULL_SCHEDULE.days.find((d) => d.date === date);
    if (hit) return hit;
    // Pre-start: show Day 1 as preview so page isn't empty
    if (date < PLAN.startDate) return FULL_SCHEDULE.days[0];
    return null;
  }, [date]);
  const preStart = date < PLAN.startDate;

  useEffect(() => {
    let cancelled = false;
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
      setRecovery({
        energy: l?.energy ?? "",
        hunger: l?.hunger ?? "",
        headache: l?.headache ?? ""
      });
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

  // Current-time indicator index
  let currentIdx = -1;
  for (let i = 0; i < day.schedule.length; i++) {
    if (day.schedule[i].time <= now) currentIdx = i;
    else break;
  }

  return (
    <div className="page page-today">
      {preStart && (
        <div className="card p-3 text-center border-amber/40 bg-amber/[.06]">
          <div className="mono text-[.62rem] text-amber uppercase tracking-[.22em] font-bold">
            plan starts {PLAN.startDate} · preview of day 1
          </div>
        </div>
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

      <div className="page-hero">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="page-hero-kicker">
              six month cut
            </div>
            <div className="page-hero-title text-[2rem] min-[420px]:text-[2.35rem]">
              {sw.toFixed(0)} <span className="text-mute text-[1.25rem]">to</span> {tw.toFixed(0)}
              <span className="text-[.9rem] text-ink2 font-light ml-2">kg</span>
            </div>
            <div className="page-hero-sub mt-2">
              fat loss · smaller waist · keep muscle
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="mono text-[.56rem] text-mute uppercase tracking-[.18em]">lean target</div>
            <div className="mono text-[1.05rem] text-cyan font-bold tabular-nums mt-[2px]">10-13%</div>
            <div className="mono text-[.54rem] text-mute uppercase tracking-[.16em]">body fat</div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-2 mt-4">
          <div className="metric-tile">
            <div className="mono text-[.52rem] text-mute uppercase tracking-[.18em]">current</div>
            <div className="mono text-sm text-ink tabular-nums mt-1">
              {currentWeight != null ? currentWeight.toFixed(1) : "--"}<span className="text-mute text-[.62rem] ml-1">kg</span>
            </div>
          </div>
          <div className="metric-tile">
            <div className="mono text-[.52rem] text-mute uppercase tracking-[.18em]">lost</div>
            <div className="mono text-sm text-lime tabular-nums mt-1">
              {lost.toFixed(1)}<span className="text-mute text-[.62rem] ml-1">kg</span>
            </div>
          </div>
          <div className="metric-tile">
            <div className="mono text-[.52rem] text-mute uppercase tracking-[.18em]">left</div>
            <div className="mono text-sm text-amber tabular-nums mt-1">
              {Math.max(0, totalJourney - lost).toFixed(1)}<span className="text-mute text-[.62rem] ml-1">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase transition celebration */}
      {isPhaseFirstDay && (
        <div className="card p-3 text-center border" style={{ borderColor: `${phase.color}66`, background: `${phase.color}0a` }}>
          <div className="mono text-[.62rem] uppercase tracking-[.22em] font-bold animate-pulse"
            style={{ color: phase.color, textShadow: `0 0 10px ${phase.color}99` }}>
            ★ phase {phase.id} unlocked
          </div>
        </div>
      )}

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
      <FastDayAssistant day={day} />
      <RecoveryCheck
        value={recovery}
        saving={recoverySaving}
        onChange={(field, score) => setRecovery((prev) => ({ ...prev, [field]: score }))}
        onSave={saveRecovery}
      />

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
          <Link to="/recipes" className="card p-3 block hover:border-line/80 transition">
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

      {/* Water tracker */}
      {(() => {
        const target = (day.waterLiters || 3) * 1000;
        const glassSize = 250;
        const totalGlasses = Math.ceil(target / glassSize);
        const totalMl = waterMl + coffeeMl;
        const filled = Math.floor(totalMl / glassSize);
        const pct = Math.min(100, Math.round((totalMl / target) * 100));
        return (
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
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
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  <button className="btn-icon text-cyan" onClick={() => saveWater(waterMl - 250)} title="-250ml water">−</button>
                  <button className="btn-icon text-cyan" onClick={() => saveWater(waterMl + 250)} title="+250ml water">+</button>
                </div>
                <div className="flex gap-1">
                  <button className="mono text-[.58rem] text-amber uppercase tracking-[.1em] bg-surface2 hover:bg-surface3 px-2 py-[6px] rounded-md transition"
                    onClick={() => saveCoffee(coffeeMl + 200)}
                    title="+200ml coffee">
                    +coffee
                  </button>
                  {coffeeMl > 0 && (
                    <button className="mono text-[.58rem] text-mute uppercase tracking-[.1em] bg-surface2 hover:bg-surface3 px-2 py-[6px] rounded-md transition"
                      onClick={() => saveCoffee(coffeeMl - 200)}
                      title="-200ml coffee">
                      -coffee
                    </button>
                  )}
                </div>
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
