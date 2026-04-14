import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { PLAN, todayStr, getDayPlan, getWeekNum, getPhase, getEatingTarget, daysBetween } from "../lib/plan";
import { Ring, Bar, Brackets, Empty, Icon } from "../components/ui";

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

  const dayPlan = getDayPlan(date);
  const week = getWeekNum(date);
  const phase = getPhase(week);
  const target = getEatingTarget(dayPlan.eating);
  const macros = sumMacros(meals);

  const load = async () => {
    const [l, m] = await Promise.all([api.get(`/logs/${date}`), api.get(`/meals?date=${date}`)]);
    setLog(l); setMeals(m);
    if (l?.weight_kg) setQuickWt(String(l.weight_kg));
  };
  useEffect(() => { load(); }, [date]);

  const saveWeight = async () => {
    const v = parseFloat(quickWt);
    if (!v) return;
    const l = await api.put(`/logs/${date}`, { weight_kg: v, fasting_type: dayPlan.eating });
    setLog(l);
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
    <div className="page">
      {/* Hero */}
      <div className="hero-glow rounded-xl overflow-hidden">
        <div className="px-4 pt-3 flex items-center justify-between">
          <div className="mono text-[.66rem] font-bold text-signal uppercase tracking-[.22em] flex items-center gap-[6px]">
            <span className="pulse-dot" />{t(dayLabelKey)}
          </div>
          <div className="mono text-[.66rem] text-ink2 uppercase tracking-[.14em]">
            P{phase.id} · W{week}
          </div>
        </div>
        <div className="px-4 pt-1 pb-4">
          <div className="mono font-bold text-signal leading-[.95] text-[clamp(2.6rem,11vw,3.8rem)] tracking-[-0.04em] [text-shadow:0_0_40px_rgba(212,255,58,.35)] flex items-baseline gap-1">
            {cur.toFixed(1)}<span className="text-[.32em] text-ink2">{t("dashboard.kg")}</span>
          </div>
          <div className="mt-2 mono text-[.78rem] text-ink">
            <span className="text-mute">{t("dashboard.target")}:</span> {tw}{t("dashboard.kg")} ·{" "}
            <span className="text-mute">Δ</span> {(cur - tw).toFixed(1)}{t("dashboard.kg")}
          </div>
        </div>
        <div className="h-[6px] bg-bg2 relative">
          <div className="h-full bg-signal" style={{ width: `${pct}%`, boxShadow: "0 0 20px theme(colors.signal)" }} />
        </div>
        <div className="px-4 py-2 flex justify-between mono text-[.66rem] uppercase tracking-[.14em] text-mute border-t border-dashed border-line2">
          <span>{pct}% · {t("dashboard.progress_to_goal")}</span>
          <span>{daysLeft} {t("dashboard.days_left")}</span>
        </div>
      </div>

      {/* Quick weigh-in */}
      <div className="card p-4">
        <div className="card-title mb-2">{t("dashboard.quick_weigh")}</div>
        <div className="flex gap-2">
          <input className="input flex-1 mono text-lg text-signal" type="number" step="0.1"
            value={quickWt} onChange={(e) => setQuickWt(e.target.value)} placeholder="00.0" />
          <button className="btn-primary" onClick={saveWeight}>✓</button>
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
            <div className="flex-1 flex flex-col gap-[10px] min-w-0">
              {[
                { k: "protein", v: macros.protein, t: target.protein, tone: "signal" },
                { k: "carbs",   v: macros.carbs,   t: target.carbs,   tone: "cool" },
                { k: "fat",     v: macros.fat,     t: target.fat,     tone: "signal" }
              ].map((m) => (
                <div key={m.k}>
                  <div className="flex justify-between mono text-[.62rem] uppercase tracking-[.16em] mb-[3px]">
                    <span className="text-ink2">{t(`dashboard.${m.k}`)}</span>
                    <span className="text-mute">{Math.round(m.v)}<span className="opacity-60">/{m.t}</span>g</span>
                  </div>
                  <Bar value={m.v} target={m.t || 1} tone={m.tone} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Brackets>

      {/* Today plan */}
      <div className="section-label">{t("dashboard.today_plan")}</div>
      <div className="grid grid-cols-2 gap-[10px]">
        <Link to="/training" className="card p-4 hover:border-line2 transition">
          <div className="card-title mb-1">{t("nav.training")}</div>
          <div className="mono font-bold text-xl text-ink">
            {dayPlan.type === "rest" ? "—" : dayPlan.type}
          </div>
          <div className="mono text-[.7rem] text-mute uppercase tracking-[.14em] mt-1">
            {dayPlan.type === "rest" ? t("training.rest") : t(`training.day_${dayPlan.type.toLowerCase()}`)}
          </div>
        </Link>
        <Link to="/log" className="card p-4 hover:border-line2 transition">
          <div className="card-title mb-1">{t("nav.log")}</div>
          <div className="mono font-bold text-xl text-signal">{dayPlan.eating}</div>
          <div className="mono text-[.7rem] text-mute uppercase tracking-[.14em] mt-1">{target.kcal} kcal</div>
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
