import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { PLAN, todayStr, getDayPlan, getWeekNum, getPhase, getEatingTarget, daysBetween } from "../lib/plan";
import { getActiveRestrictions, getStepTarget, getCardioProtocol } from "../lib/protocols";
import { Ring, Brackets, Empty, Icon, PhaseStrip, DayGlyph, MiniRing } from "../components/ui";

const sumMacros = (meals) => meals.reduce((a, m) => {
  m.items.forEach((it) => {
    a.kcal += it.kcal || 0; a.protein += it.protein_g || 0;
    a.carbs += it.carbs_g || 0; a.fat += it.fat_g || 0;
  });
  return a;
}, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [date] = useState(todayStr());
  const [log, setLog] = useState(null);
  const [meals, setMeals] = useState([]);
  const [quickWt, setQuickWt] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const dayPlan = getDayPlan(date);
  const week = getWeekNum(date);
  const phase = getPhase(week);
  const target = getEatingTarget(dayPlan.eating);
  const macros = sumMacros(meals);
  const restrictions = getActiveRestrictions(week);
  const stepTarget = getStepTarget(week);
  const cardio = getCardioProtocol(week);

  const load = async () => {
    const [l, m] = await Promise.all([
      api.get(`/logs/${date}`),
      api.get(`/meals?date=${date}`)
    ]);
    setLog(l); setMeals(m);
    if (l?.weight_kg) setQuickWt(String(l.weight_kg));
    else setQuickWt("");
  };
  useEffect(() => { load(); }, [date]);

  const saveWeight = async () => {
    const v = parseFloat(quickWt);
    if (!v) return;
    const l = await api.put(`/logs/${date}`, { weight_kg: v, fasting_type: dayPlan.eating });
    setLog(l);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 600);
    load();
  };

  const sw = user?.start_weight || PLAN.startWeight;
  const tw = user?.target_weight || PLAN.targetWeight;
  const cur = log?.weight_kg || sw;
  const lost = Math.max(0, sw - cur);
  const needed = sw - tw;
  const pct = Math.min(100, Math.round((lost / needed) * 100));
  const daysLeft = Math.max(0, daysBetween(date, PLAN.endDate));

  const dayLabelKey =
    dayPlan.eating === "FAST" ? "dashboard.fast_day" :
    dayPlan.type !== "rest"   ? "dashboard.training_day" : "dashboard.rest_day";

  return (
    <div className="page page-dashboard">
      {/* Phase strip */}
      <div className="flex items-center gap-2 px-1">
        <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">P{phase.id}/4</div>
        <PhaseStrip phases={PLAN.phases} currentPhase={phase.id} />
        <div className="mono text-[.58rem] text-mute uppercase tracking-[.2em]">W{week}</div>
      </div>

      {/* Hero — Journey gauge (iOS Health style) */}
      <div className="hero-card overflow-hidden p-5">
        {/* Top meta row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="mono text-[.58rem] text-mute uppercase tracking-[.24em]">transformation</div>
            <div
              className="font-display text-[1.9rem] leading-[1] text-ink tracking-[-.02em] mt-[2px]"
              style={{ fontVariationSettings: '"SOFT" 60, "opsz" 96' }}
            >
              Day <span className="tabular-nums">{daysBetween(PLAN.startDate, date) + 1}</span>
              <span className="text-ink2 font-light"> / 182</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-[3px]">
            <div className="mono text-[.58rem] text-amber uppercase tracking-[.2em] font-bold">{t(dayLabelKey)}</div>
            <div className="mono text-[.58rem] flex items-center gap-[5px] uppercase tracking-[.16em]">
              <span style={{ color: phase.color }} className="font-bold">P{phase.id}</span>
              <span className="text-mute2">·</span>
              <span className="text-ink2">WK {week}</span>
            </div>
          </div>
        </div>

        {/* Progress ring + stats */}
        <div className="flex items-center gap-5">
          <div className="relative w-[124px] h-[124px] shrink-0">
            <svg viewBox="0 0 124 124" className="w-full h-full -rotate-90">
              <defs>
                <linearGradient id="heroRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#ff375f" />
                  <stop offset="55%"  stopColor="#ff9f0a" />
                  <stop offset="100%" stopColor="#30d158" />
                </linearGradient>
              </defs>
              <circle cx="62" cy="62" r="54" stroke="#2c2c2e" strokeWidth="10" fill="none" />
              <circle
                cx="62" cy="62" r="54"
                stroke="url(#heroRing)" strokeWidth="10" fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={(1 - pct / 100) * 2 * Math.PI * 54}
                style={{ transition: "stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)", filter: "drop-shadow(0 0 6px rgba(255,159,10,.45))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="font-display text-[1.9rem] text-ink leading-none tabular-nums"
                style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}
              >
                {pct}<span className="text-[1rem] text-ink2 font-light">%</span>
              </div>
              <div className="mono text-[.5rem] text-mute uppercase tracking-[.22em] mt-[3px]">journey</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div>
              <div className="mono text-[.54rem] text-mute uppercase tracking-[.2em]">lost</div>
              <div
                className="font-display text-[1.5rem] text-coral leading-none tabular-nums mt-[3px]"
                style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}
              >
                −{lost.toFixed(1)}
                <span className="text-[.72rem] text-ink2 font-light ml-[4px]">kg</span>
              </div>
            </div>
            <div>
              <div className="mono text-[.54rem] text-mute uppercase tracking-[.2em]">to go</div>
              <div
                className="font-display text-[1.5rem] text-lime leading-none tabular-nums mt-[3px]"
                style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}
              >
                −{Math.max(0, (sw - tw) - lost).toFixed(1)}
                <span className="text-[.72rem] text-ink2 font-light ml-[4px]">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className="mt-5 pt-4 border-t border-line/70 grid grid-cols-3">
          <div className="flex flex-col items-center gap-[3px]">
            <div className="mono text-[.54rem] text-mute uppercase tracking-[.22em]">start</div>
            <div className="mono text-sm text-ink2 tabular-nums">
              {sw.toFixed(0)}<span className="text-[.6rem] text-mute ml-[3px]">kg</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-[3px] border-x border-line/50">
            <div className="mono text-[.54rem] text-mute uppercase tracking-[.22em]">target</div>
            <div className="mono text-sm text-lime tabular-nums">
              {tw.toFixed(0)}<span className="text-[.6rem] text-mute ml-[3px]">kg</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-[3px]">
            <div className="mono text-[.54rem] text-mute uppercase tracking-[.22em]">days left</div>
            <div className="mono text-sm text-cyan tabular-nums">{daysLeft}</div>
          </div>
        </div>
      </div>

      {/* Quick weigh-in */}
      <div className="card p-4">
        <div className="card-title mb-2">{t("dashboard.quick_weigh")}</div>
        <div className="flex gap-2">
          <input className="input flex-1 mono text-lg text-signal" type="number" step="0.1"
            value={quickWt} onChange={(e) => setQuickWt(e.target.value)} placeholder="00.0" />
          <button className={`btn-primary ${savedFlash ? "flash-ok" : ""}`} onClick={saveWeight}>✓</button>
        </div>
      </div>

      {/* Calorie ring + macros */}
      <Brackets>
        <div className="card p-4">
          <div className="flex justify-between items-baseline mb-3">
            <div className="card-title">{t("dashboard.kcal")}</div>
            <div className="mono text-[.64rem] text-mute uppercase tracking-[.18em]">
              {Math.round(macros.kcal)} / {target.kcal}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Ring value={macros.kcal} target={target.kcal || 1} size={118} stroke={9}
              over={target.kcal > 0 && macros.kcal > target.kcal}
              unit="kcal" label={`${Math.max(0, target.kcal - Math.round(macros.kcal))} left`} />
            <div className="flex-1 grid grid-cols-3 gap-2">
              {[
                { k: "protein", v: macros.protein, t: target.protein, color: "#30d158" },
                { k: "carbs",   v: macros.carbs,   t: target.carbs,   color: "#64d2ff" },
                { k: "fat",     v: macros.fat,     t: target.fat,     color: "#ff9f0a" }
              ].map((m) => {
                const pct = m.t > 0 ? (m.v / m.t) : 0;
                const over = pct > 1;
                const c = over ? "#ff453a" : m.color;
                return (
                  <div key={m.k} className="flex flex-col items-center">
                    <MiniRing value={m.v} target={m.t} color={c} size={54} stroke={5} />
                    <div className="mono text-[.56rem] text-mute uppercase tracking-[.18em] mt-1">{t(`dashboard.${m.k}`)}</div>
                    <div className="mono text-[.62rem] text-ink tabular-nums">{Math.round(m.v)}<span className="text-mute opacity-70">/{m.t}g</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Brackets>

      {/* Today plan */}
      <div className="section-label">{t("dashboard.today_plan")}</div>
      <div className="grid grid-cols-2 gap-[10px]">
        <Link to="/training" className="card p-4 hover:border-line2 transition flex items-center gap-3">
          <div className="shrink-0">
            {dayPlan.type === "rest"
              ? <div className="w-[34px] h-[34px] rounded-full border border-dashed border-line2 grid place-items-center text-mute mono text-xs">z</div>
              : <DayGlyph type={dayPlan.type} size={34} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="card-title mb-1">{t("nav.training")}</div>
            <div className="mono text-[.7rem] text-mute uppercase tracking-[.14em] mt-1 truncate">
              {dayPlan.type === "rest" ? t("training.rest") : t(`training.day_${dayPlan.type.toLowerCase()}`)}
            </div>
          </div>
        </Link>
        <Link to="/log" className="card p-4 hover:border-line2 transition">
          <div className="card-title mb-1">{t("nav.log")}</div>
          <div className="mono font-bold text-xl text-signal">{dayPlan.eating}</div>
          <div className="mono text-[.7rem] text-mute uppercase tracking-[.14em] mt-1">{target.kcal} kcal</div>
          {target.windowStart && target.windowEnd && (
            <div className="mono text-[.62rem] text-warn mt-[2px]">
              {t("eating.omad_window", { start: target.windowStart, end: target.windowEnd })}
            </div>
          )}
          {dayPlan.eating === "FAST" && (
            <div className="mono text-[.62rem] text-mute mt-[2px]">{t("eating.fast_allowed")}</div>
          )}
        </Link>
      </div>

      {/* Step target + cardio chip */}
      {stepTarget && (
        <div className="card p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon.zap size={16} className="text-signal" />
            <div className="mono text-[.7rem] text-ink uppercase tracking-[.14em]">{t("cardio.step_target")}</div>
          </div>
          <div className="mono text-sm text-signal font-bold tabular-nums">{stepTarget.toLocaleString()}</div>
        </div>
      )}

      {/* Active restriction banner */}
      {restrictions.length > 0 && (
        <div className="card p-3 border-warn/40 bg-warn/[.05]">
          <div className="flex items-start gap-2">
            <span className="mono text-[.7rem] text-warn font-bold">⚠</span>
            <div className="flex-1">
              <div className="mono text-[.66rem] text-warn uppercase tracking-[.14em] font-bold">
                {t("restrictions.lower_back")}
              </div>
              <div className="mono text-[.62rem] text-ink2 mt-1 leading-relaxed">
                {restrictions[0].description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today timeline + Habits + Check-in quick links */}
      <Link to="/today" className="card p-3 hover:border-line2 transition flex items-center gap-2">
        <Icon.clock size={16} className="text-signal" />
        <div className="flex-1">
          <div className="card-title">Schedule</div>
          <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">Hour-by-hour · D{daysBetween(PLAN.startDate, date) + 1}/182</div>
        </div>
        <Icon.chev size={14} className="text-mute" />
      </Link>
      <div className="grid grid-cols-2 gap-[10px]">
        <Link to="/habits" className="card p-3 hover:border-line2 transition flex items-center gap-2">
          <Icon.check size={16} className="text-signal" />
          <div>
            <div className="card-title">{t("habits.title")}</div>
            <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("habits.morning")} · {t("habits.evening")}</div>
          </div>
        </Link>
        <Link to="/checkin" className="card p-3 hover:border-line2 transition flex items-center gap-2">
          <Icon.ruler size={16} className="text-signal" />
          <div>
            <div className="card-title">{t("checkin.title")}</div>
            <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">W{week}</div>
          </div>
        </Link>
      </div>

      {/* Meals today */}
      <div className="section-label">{t("dashboard.meals_today")}</div>
      {meals.length === 0 ? (
        <Empty icon={<Icon.utensils size={22} />} label={t("dashboard.no_meals")} hint={t("dashboard.meals_today")}
          action={<Link to="/log" className="btn-ghost mt-2">+ {t("log.add_meal")}</Link>} />
      ) : (
        <div className="flex flex-col gap-2">
          {meals.map((m) => {
            const kcal = Math.round(m.items.reduce((a, i) => a + (i.kcal || 0), 0));
            return (
              <div key={m.id} className="card p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md border border-line bg-bg2 grid place-items-center text-ink2 shrink-0">
                  <Icon.utensils size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mono text-xs text-ink truncate">{m.name || m.time || "—"}</div>
                  <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{m.items.length} · {m.time}</div>
                </div>
                <div className="mono text-sm text-signal font-bold tabular-nums">{kcal}<span className="text-mute text-[.6rem] ml-1">kcal</span></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
