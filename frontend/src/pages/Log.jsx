import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { api } from "../lib/api";
import { todayStr } from "../lib/plan";
import { FOOD_CHOICES, findFoodChoice, readTodayCallPrefs, writeTodayCallPrefs } from "../lib/todayCall";
import { MEAL_TEMPLATES, mealTemplateMarker, mealTemplatePartMarker } from "../lib/mealTemplates";
import { effectiveMacros, sumMealMacros } from "../lib/nutrition";
import { AccentCard, Empty, Icon } from "../components/ui";

const cleanNumber = (value, fallback = 0) =>
  value === "" || value == null || Number.isNaN(Number(value)) ? fallback : Number(value);

function MealTemplatePicker({ templates, items, onToggle }) {
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const itemsForTemplate = (template) =>
    items.filter((item) => item.barcode === mealTemplateMarker(template.id) || item.barcode?.startsWith(`${mealTemplateMarker(template.id)}:`));

  const itemsForPart = (template, part) => {
    const marker = mealTemplatePartMarker(template.id, part.id);
    const legacyMarker = mealTemplateMarker(template.id);
    const partNames = new Set(part.items.map((entry) => entry.name));
    return items.filter((item) => item.barcode === marker || (item.barcode === legacyMarker && partNames.has(item.name)));
  };

  const handleToggle = async (template, part) => {
    const partKey = `${template.id}:${part.id}`;
    if (busyId) return;
    setBusyId(partKey);
    try {
      await onToggle(template, part, itemsForPart(template, part));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AccentCard accent="#00d4aa" className="p-3" contentClassName="pl-2">
      <div className="section-label mt-0 mb-2">Gerichte</div>
      <div className="grid grid-cols-1 min-[430px]:grid-cols-2 gap-2">
        {templates.map((template) => {
          const logged = itemsForTemplate(template).length > 0;
          return (
            <div
              key={template.id}
              className={`soft-band overflow-hidden border ${logged ? "border-signal/70 bg-signal/10" : "border-line/70"}`}
            >
              <div className="px-3 py-2 border-b border-line/60">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[.82rem] text-ink leading-snug font-semibold">{template.title}</div>
                    <div className="mono text-[.56rem] text-mute uppercase tracking-[.12em] mt-[2px]">{template.type}</div>
                  </div>
                  <div className="mono text-[.62rem] text-mute tabular-nums mt-2">
                    <span className="text-amber">{Math.round(template.totals.kcal)}</span> kcal · <span className="text-lime">P</span>{Math.round(template.totals.protein)}g
                  </div>
                </div>
              </div>

              <div className="divide-y divide-line/60">
                {template.parts.map((part) => {
                  const partKey = `${template.id}:${part.id}`;
                  const open = openId === partKey;
                  const partLogged = itemsForPart(template, part).length > 0;
                  return (
                    <div key={partKey}>
                      <div className="flex items-stretch">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left px-3 py-2 hover:bg-bg2/60 active:bg-bg2 transition-colors duration-150"
                          onClick={() => setOpenId(open ? null : partKey)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[.76rem] text-ink leading-snug font-medium">{part.title}</div>
                              <div className="mono text-[.58rem] text-mute tabular-nums mt-[2px]">
                                <span className="text-amber">{Math.round(part.totals.kcal)}</span> kcal · <span className="text-lime">P</span>{Math.round(part.totals.protein)}g
                              </div>
                            </div>
                            <Icon.chev size={14} className={`text-mute shrink-0 mt-[2px] transition-transform duration-150 ${open ? "rotate-90" : ""}`} />
                          </div>
                        </button>
                        <button
                          type="button"
                          className={`w-12 grid place-items-center border-l border-line/70 transition-colors duration-150 ${partLogged ? "text-signal bg-signal/10" : "text-mute hover:text-signal hover:bg-bg2/60"}`}
                          onClick={() => handleToggle(template, part)}
                          aria-label={partLogged ? "remove meal part" : "add meal part"}
                          disabled={busyId === partKey}
                        >
                          {busyId === partKey ? <span className="mono text-[.62rem]">...</span> : <Icon.check size={17} />}
                        </button>
                      </div>

                      {open && (
                        <div className="px-3 py-2 bg-bg2/30">
                          <div className="grid grid-cols-4 gap-1 mb-2">
                            <div className="metric-tile"><div className="metric-label">kcal</div><div className="metric-value text-amber">{Math.round(part.totals.kcal)}</div></div>
                            <div className="metric-tile"><div className="metric-label">protein</div><div className="metric-value text-lime">{Math.round(part.totals.protein)}g</div></div>
                            <div className="metric-tile"><div className="metric-label">carbs</div><div className="metric-value text-amber">{Math.round(part.totals.carbs)}g</div></div>
                            <div className="metric-tile"><div className="metric-label">fat</div><div className="metric-value">{Math.round(part.totals.fat)}g</div></div>
                          </div>
                          <div className="divide-y divide-line/60">
                            {part.items.map((item) => (
                              <div key={`${partKey}-${item.name}`} className="py-[6px] flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-[.72rem] text-ink leading-snug">{item.name}</div>
                                  <div className="mono text-[.54rem] text-mute tabular-nums mt-[1px]">{Math.round(Number(item.amount_g) || 0)}g</div>
                                </div>
                                <div className="mono text-[.58rem] text-mute tabular-nums shrink-0">
                                  <span className="text-amber">{Math.round(Number(item.kcal) || 0)}</span> · <span className="text-lime">P</span>{Math.round(Number(item.protein_g) || 0)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AccentCard>
  );
}

function LogCommand({ totals, date, dateLabel, isToday, onToday, onShiftDate, todayLabel, foodPrefs, onFoodChoice, foodTarget }) {
  const kcalDelta = Math.round((foodTarget?.kcal || 0) - totals.kcal);
  const proteinDelta = Math.round((foodTarget?.protein || 0) - totals.protein);
  const targetLabel = foodTarget?.kcal
    ? `${Math.max(0, kcalDelta)} kcal · P ${Math.max(0, proteinDelta)}g`
    : "FAST";
  const metrics = [
    { label: "kcal", value: Math.round(totals.kcal), className: "text-amber" },
    { label: "protein", value: `${Math.round(totals.protein)}g`, className: "text-lime" },
    { label: "carbs", value: `${Math.round(totals.carbs)}g`, className: "text-amber" },
    { label: "fat", value: `${Math.round(totals.fat)}g`, className: "text-ink2" }
  ];

  return (
    <AccentCard accent="#d9a441" className="p-3" contentClassName="pl-2">
      <div className="flex items-center justify-between gap-2">
        <button className="btn-icon" aria-label="prev day" onClick={() => onShiftDate(-1)}>
          <Icon.chev size={16} className="rotate-180" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="mono text-[.62rem] text-amber uppercase tracking-[.2em]">Essen</div>
          <div className="mono text-sm text-ink font-bold tabular-nums leading-tight">{dateLabel}</div>
          <div className="mono text-[.56rem] text-mute tabular-nums">{date}</div>
        </div>
        <button className="btn-icon" aria-label="next day" onClick={() => onShiftDate(1)} disabled={isToday}>
          <Icon.chev size={16} className={isToday ? "opacity-30" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 my-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-tile px-2 py-2 text-center">
            <div className="metric-label">{metric.label}</div>
            <div className={`metric-value text-[.82rem] ${metric.className}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-bg2/45 p-1.5">
        <div className="grid grid-cols-3 gap-1">
          {FOOD_CHOICES.map((choice) => {
            const active = foodPrefs?.foodId === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                className={`h-9 rounded-md mono text-[.66rem] font-bold transition-colors duration-150 ${
                  active ? "bg-surface2 text-ink border border-line2" : "text-mute hover:text-ink2 hover:bg-surface2/60"
                }`}
                onClick={() => onFoodChoice(choice.id)}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
          <span className="mono text-[.56rem] text-mute uppercase tracking-[.14em]">remaining</span>
          <span className="mono text-[.62rem] text-ink tabular-nums">{targetLabel}</span>
        </div>
      </div>

      {!isToday && (
        <button className="btn-ghost w-full h-[38px] mt-3" onClick={onToday}>
          {todayLabel}
        </button>
      )}
    </AccentCard>
  );
}

function CodexReview({ meals, totals, foodTarget }) {
  const items = meals.flatMap((meal) => (meal.items || []).map((item) => ({ ...item, meal_time: meal.time })));
  if (!items.length) return null;
  const kcalDelta = Math.round((foodTarget?.kcal || 0) - totals.kcal);
  const proteinDelta = Math.round((foodTarget?.protein || 0) - totals.protein);
  const sorted = [...items].sort((a, b) => {
    const at = a.created_at || "";
    const bt = b.created_at || "";
    if (at !== bt) return bt.localeCompare(at);
    return Number(b.id || 0) - Number(a.id || 0);
  });
  const last = sorted[0];
  const lastLabel = last?.created_at
    ? new Date(`${String(last.created_at).replace(" ", "T")}Z`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : last?.meal_time || "--";
  const status = foodTarget?.kcal === 0
    ? totals.kcal <= 50 ? ["fast clean", "text-lime"] : ["fast breached", "text-amber"]
    : kcalDelta < 0 ? [`${Math.abs(kcalDelta)} kcal over`, "text-amber"]
      : proteinDelta <= 0 ? ["protein done", "text-lime"]
        : [`P ${proteinDelta}g left`, "text-cyan"];
  const grouped = meals.map((meal) => ({
    id: meal.id,
    label: meal.name || meal.time || "meal",
    count: meal.items?.length || 0,
    kcal: sumMealMacros([meal]).kcal
  })).filter((meal) => meal.count > 0);

  return (
    <AccentCard accent={status[1] === "text-lime" ? "#00d4aa" : "#d9a441"} className="p-3" contentClassName="pl-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="section-label mt-0 mb-1">Codex check</div>
          <div className={`mono text-sm font-bold tabular-nums ${status[1]}`}>{status[0]}</div>
        </div>
        <div className="mono text-[.56rem] text-mute uppercase tracking-[.14em] text-right shrink-0">
          last<br /><span className="text-ink">{lastLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        <div className="metric-tile text-center">
          <div className="metric-label">items</div>
          <div className="metric-value text-[.82rem]">{items.length}</div>
        </div>
        <div className="metric-tile text-center">
          <div className="metric-label">kcal gap</div>
          <div className={`metric-value text-[.82rem] ${kcalDelta < 0 ? "text-amber" : "text-ink"}`}>{kcalDelta}</div>
        </div>
        <div className="metric-tile text-center">
          <div className="metric-label">protein gap</div>
          <div className={`metric-value text-[.82rem] ${proteinDelta <= 0 ? "text-lime" : "text-cyan"}`}>{proteinDelta}g</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {grouped.map((meal) => (
          <div key={meal.id} className="chip chip-mute shrink-0">
            {meal.label} · {meal.count} · {Math.round(meal.kcal)}
          </div>
        ))}
      </div>
    </AccentCard>
  );
}

export default function Log() {
  const { t } = useTranslation();
  const lang = (i18n.language || "en").startsWith("de") ? "de" : "en";
  const [date, setDate] = useState(todayStr());
  const [meals, setMeals] = useState([]);
  const [foodPrefs, setFoodPrefs] = useState(() => readTodayCallPrefs(todayStr()));

  const shiftDate = (delta) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    setDate(next.toISOString().slice(0, 10));
  };

  const isToday = date === todayStr();
  const dateLabel = (() => {
    const d = new Date(date);
    const today = new Date(todayStr());
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return t("log.today");
    if (diff === -1) return t("log.yesterday");
    return d.toLocaleDateString(lang, { weekday: "short", day: "2-digit", month: "2-digit" });
  })();

  const loadMeals = async () => setMeals(await api.get(`/meals?date=${date}`));

  useEffect(() => { loadMeals(); }, [date]);
  useEffect(() => { setFoodPrefs(readTodayCallPrefs(date)); }, [date]);

  const ensureMeal = async () => {
    if (meals.length > 0) return meals[0].id;
    const time = new Date().toTimeString().slice(0, 5);
    const meal = await api.post("/meals", { date, time, name: null });
    await loadMeals();
    return meal.id;
  };

  const allItems = meals.flatMap((meal) => meal.items);
  const totals = sumMealMacros(meals);
  const foodTarget = findFoodChoice(foodPrefs.foodId);

  const updateFoodChoice = (foodId) => {
    const next = { ...foodPrefs, foodId };
    setFoodPrefs(next);
    writeTodayCallPrefs(date, next);
  };

  const itemPayload = (item) => ({
    name: item.name,
    barcode: item.barcode || null,
    amount_g: cleanNumber(item.amount_g, 100),
    kcal: cleanNumber(item.kcal),
    protein_g: cleanNumber(item.protein_g),
    carbs_g: cleanNumber(item.carbs_g),
    fat_g: cleanNumber(item.fat_g),
    eaten_pct: 100
  });

  const toggleMealTemplate = async (template, part, loggedItems = []) => {
    if (loggedItems.length > 0) {
      await Promise.all(loggedItems.map((item) => api.del(`/meals/items/${item.id}`)));
      await loadMeals();
      return;
    }
    const mealId = await ensureMeal();
    const marker = mealTemplatePartMarker(template.id, part.id);
    await Promise.all(part.items.map((item) => api.post(`/meals/${mealId}/items`, itemPayload({ ...item, barcode: marker }))));
    await loadMeals();
  };

  return (
    <div className="page page-log">
      <LogCommand
        totals={totals}
        date={date}
        dateLabel={dateLabel}
        isToday={isToday}
        onToday={() => setDate(todayStr())}
        onShiftDate={shiftDate}
        todayLabel={t("log.today")}
        foodPrefs={foodPrefs}
        onFoodChoice={updateFoodChoice}
        foodTarget={foodTarget}
      />

      <CodexReview meals={meals} totals={totals} foodTarget={foodTarget} />

      <MealTemplatePicker templates={MEAL_TEMPLATES} items={allItems} onToggle={toggleMealTemplate} />

      {allItems.length === 0 && (
        <Empty icon={<Icon.utensils size={22} />} label={t("log.title")} />
      )}

      {allItems.length > 0 && (
        <AccentCard accent="#d9a441" className="overflow-hidden" contentClassName="pl-2">
          <div className="divide-y divide-line">
            {allItems.map((item) => {
              const eff = effectiveMacros(item);
              return (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-sm text-ink leading-snug"
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      >
                        {item.name}
                      </div>
                      <div className="mono text-[.62rem] text-mute tabular-nums mt-[2px]">
                        <span>{item.amount_g}g</span> · <span className="text-lime">P</span>{Math.round(eff.protein_g)} <span className="text-amber">C</span>{Math.round(eff.carbs_g)} <span className="text-ink2">F</span>{Math.round(eff.fat_g)}
                      </div>
                    </div>
                    <div className="mono text-sm text-amber font-bold tabular-nums shrink-0 pt-[2px]">{Math.round(eff.kcal)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </AccentCard>
      )}
    </div>
  );
}
