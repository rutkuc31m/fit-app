import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { todayStr, getDayPlan, getEatingTarget, PLAN } from "../lib/plan";
import { getDayRecipes, getWeekRecipes, buildShoppingList, INGREDIENT_NAMES, CAT_ORDER, CAT_LABEL, RECIPE_TAGS } from "../lib/recipes";
import { Empty, Icon, Brackets } from "../components/ui";

export default function Recipes() {
  const { t } = useTranslation();
  const lang = (i18n.language || "en").startsWith("de") ? "de" : "en";
  const [tab, setTab] = useState("today"); // today | week | shop
  const [checked, setChecked] = useState({});
  const date = todayStr();
  const dayPlan = getDayPlan(date);

  const todayRecipes = useMemo(() => getDayRecipes(date, dayPlan.eating), [date, dayPlan.eating]);
  const target = getEatingTarget(dayPlan.eating);
  const weekRecipes  = useMemo(() => getWeekRecipes(date, PLAN.weeklyPattern, 7), [date]);
  const shopping     = useMemo(() => buildShoppingList(weekRecipes), [weekRecipes]);

  const toggleCheck = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }));

  return (
    <div className="page">
      <div className="section-label">{t("recipes.title")}</div>

      <div className="card p-1 flex gap-1">
        {["today", "week", "shop"].map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 mono text-[.66rem] caps py-[10px] rounded-lg transition ${
              tab === k ? "bg-signal text-[#000000] font-bold" : "text-ink2 hover:bg-bg2"
            }`}>
            {t(`recipes.tab_${k}`)}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <>
          <Brackets>
            <div className="card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="card-title">{t("recipes.eating_today")}</div>
                  <div className="mono text-xl text-signal font-bold mt-1">{dayPlan.eating}</div>
                </div>
                <div className="text-right">
                  <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("recipes.target")}</div>
                  <div className="mono text-sm text-ink">{todayRecipes.reduce((a, r) => a + r.kcal, 0)} kcal</div>
                </div>
              </div>
              {target.windowStart && target.windowEnd && (
                <div className="mt-2 mono text-[.66rem] text-warn uppercase tracking-[.14em]">
                  {t("eating.omad_window", { start: target.windowStart, end: target.windowEnd })}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {RECIPE_TAGS.glutenFree && <span className="chip chip-signal">gluten free</span>}
                {RECIPE_TAGS.sugarFree && <span className="chip chip-signal">no sugar</span>}
              </div>
            </div>
          </Brackets>

          {dayPlan.eating === "OMAD" && target.preShake && (
            <div className="card p-3 border-line2">
              <div className="flex justify-between items-baseline">
                <div className="card-title">{t("eating.pre_shake")}</div>
                <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{target.preShake.time}</div>
              </div>
              <div className="mono text-[.7rem] text-ink2 mt-1">{target.preShake.kcal} kcal · {target.preShake.protein}g protein</div>
              <div className="mono text-[.62rem] text-mute mt-1">{target.preShake.note}</div>
            </div>
          )}

          {dayPlan.eating === "OMAD" && todayRecipes.length > 0 && (
            <div className="section-label">{t("eating.main_meal")}</div>
          )}

          {todayRecipes.length === 0 ? (
            <Empty icon={<Icon.moon size={22} />} label={t("recipes.fast_day")} hint={t("recipes.fast_hint")} />
          ) : todayRecipes.map((r, i) => (
            <div key={r.id + i} className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-line flex justify-between items-baseline">
                <div>
                  <div className="mono text-[.62rem] text-mute uppercase tracking-[.18em]">{t("recipes.the_meal")}</div>
                  <div className="text-sm text-ink mt-[2px]">{r.name[lang]}</div>
                </div>
                <div className="mono text-sm text-signal font-bold tabular-nums">{r.kcal} kcal</div>
              </div>
              <div className="px-4 py-2 mono text-[.64rem] text-ink2 flex gap-3">
                <span>P{r.p}</span><span className="text-cool">C{r.c}</span><span className="text-warn">F{r.f}</span>
              </div>
              <div className="px-4 py-2 border-t border-line">
                <div className="card-title mb-2">{t("recipes.ingredients")}</div>
                <ul className="grid grid-cols-2 gap-y-1 mono text-[.7rem] text-ink2">
                  {r.ingredients.map((ing, j) => (
                    <li key={j} className="flex justify-between pr-2">
                      <span className="truncate">{INGREDIENT_NAMES[ing.item]?.[lang] || ing.item}</span>
                      <span className="text-mute tabular-nums">{ing.g}g</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-4 py-2 border-t border-line">
                <div className="card-title mb-2">{t("recipes.steps")}</div>
                <ol className="list-decimal list-inside text-sm text-ink2 leading-relaxed marker:text-signal marker:font-bold">
                  {(r.steps[lang] || r.steps.en || r.steps).map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "week" && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(new Date(date).getTime() + i * 86400000);
            const ds = d.toISOString().slice(0, 10);
            const dp = getDayPlan(ds);
            const rs = getDayRecipes(ds, dp.eating);
            const dow = d.toLocaleDateString(lang, { weekday: "short" });
            const total = rs.reduce((a, r) => a + r.kcal, 0);
            return (
              <div key={i} className="card p-3">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <div className="mono text-[.62rem] text-mute uppercase tracking-[.18em]">{dow} · {ds.slice(5)}</div>
                    <div className="mono text-sm text-signal font-bold mt-[2px]">{dp.eating}</div>
                  </div>
                  <div className="mono text-sm text-ink tabular-nums">{total} kcal</div>
                </div>
                {rs.length === 0
                  ? <div className="mono text-[.66rem] text-mute">{t("recipes.fast_day")}</div>
                  : rs.map((r, j) => (
                      <div key={j} className="flex justify-between mono text-[.7rem] py-[2px]">
                        <span className="text-ink2 truncate pr-2">{r.name[lang]}</span>
                        <span className="text-mute tabular-nums shrink-0">{r.kcal}</span>
                      </div>
                    ))}
              </div>
            );
          })}
        </div>
      )}

      {tab === "shop" && (
        <div className="flex flex-col gap-3">
          <div className="mono text-[.62rem] text-mute uppercase tracking-[.18em] px-1">{t("recipes.shop_hint")}</div>
          {CAT_ORDER.map((cat) => {
            const list = shopping[cat];
            if (!list || list.length === 0) return null;
            return (
              <div key={cat} className="card overflow-hidden">
                <div className="px-4 py-2 border-b border-line bg-bg2/40 flex justify-between">
                  <div className="card-title">{CAT_LABEL[cat]?.[lang] || cat}</div>
                  <div className="mono text-[.62rem] text-mute">{list.length}</div>
                </div>
                <ul>
                  {list.map((it) => (
                    <li key={it.item} onClick={() => toggleCheck(it.item)}
                      className="px-4 py-2 border-b border-line last:border-0 flex justify-between items-center cursor-pointer hover:bg-bg2 select-none">
                      <span className={`text-sm ${checked[it.item] ? "text-mute line-through" : "text-ink"}`}>
                        <span className={`inline-block w-4 h-4 rounded border align-middle mr-3 ${checked[it.item] ? "bg-signal border-signal" : "border-line"}`} />
                        {INGREDIENT_NAMES[it.item]?.[lang] || it.item}
                      </span>
                      <span className="mono text-[.7rem] text-mute tabular-nums">
                        {it.g >= 1000 ? `${(it.g/1000).toFixed(1)}kg` : `${it.g}g`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
