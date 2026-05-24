import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { api } from "../lib/api";
import { todayStr } from "../lib/plan";
import { FOOD_CHOICES, findFoodChoice, readTodayCallPrefs, writeTodayCallPrefs } from "../lib/todayCall";
import { COMMON_FOODS, scaleByPieces } from "../lib/commonFoods";
import { MEAL_TEMPLATES, mealTemplateMarker, mealTemplatePartMarker } from "../lib/mealTemplates";
import { normalizeQuickText, parseQuickFoodEntry, pickBestFoodMatch } from "../lib/quickFoodEntry";
import { eatenPct, effectiveMacros, sumMealMacros } from "../lib/nutrition";
import BarcodeScanner from "../components/BarcodeScanner";
import { AccentCard, Empty, Icon } from "../components/ui";

const emptyItem = { name: "", amount_g: 100, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, eaten_pct: 100, barcode: null };
const numberOrBlank = (value) => value === "" ? "" : Number(value);
const cleanNumber = (value, fallback = 0) => value === "" || value == null || Number.isNaN(Number(value)) ? fallback : Number(value);
const isQuickEntry = (item) =>
  Number(item?.amount_g || 0) <= 0 &&
  Number(item?.protein_g || 0) === 0 &&
  Number(item?.carbs_g || 0) === 0 &&
  Number(item?.fat_g || 0) === 0;
const getSpeechRecognitionCtor = () =>
  (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;

const foodName = (food, lang) => food?.name?.[lang] || food?.name?.en || food?.name?.de || "";

const findCommonFoodMatch = (query, lang) => {
  const q = normalizeQuickText(query);
  if (!q) return null;
  const aliases = {
    egg_m: ["yumurta", "egg"],
    egg_l: ["yumurta", "egg"],
    banana: ["muz", "banana"],
    apple: ["elma", "apple"],
    pear: ["armut", "pear"],
    orange: ["portakal", "orange"],
    mandarin: ["mandalina", "mandarin"],
    kiwi: ["kivi", "kiwi"],
    avocado: ["avokado", "avocado"],
    lemon: ["limon", "lemon"],
    strawberries: ["cilek", "çilek", "strawberry"],
    tomato: ["domates", "tomato"],
    tomato_small: ["cherry tomato", "cocktail tomato", "cherrytomate"],
    cucumber: ["salatalik", "salatalık", "cucumber", "gurke"],
    cucumber_small: ["kucuk salatalik", "kleine gurke", "small cucumber"],
    bell_pepper: ["paprika", "bell pepper"],
    spitz_paprika: ["spitz paprika", "spitzpaprika"],
    onion: ["sogan", "soğan", "zwiebel", "onion"],
    garlic_clove: ["sarımsak", "sarimsak", "knoblauch", "garlic"],
    carrot: ["havuc", "havuç", "karotte", "carrot"],
    zucchini: ["kabak", "zucchini"],
    corn_cob_small: ["misir", "mısır", "mais", "corn"],
    sweet_potato: ["tatli patates", "süßkartoffel", "sweet potato"],
    potato: ["patates", "kartoffel", "potato"],
    walnut_half: ["ceviz", "walnut"],
    almond: ["badem", "mandel", "almond"],
    nuts_handful: ["kuruyemis", "kuruyemiş", "nuts"],
    whey_scoop: ["whey", "protein powder", "protein tozu"],
    tuna_can: ["ton balik", "ton balığı", "tuna"],
    sardine_can: ["sardalya", "sardine"],
    chocolate_square_dark: ["bitter cikolata", "bitter çikolata", "dark chocolate"],
    olive: ["zeytin", "olive"]
  };
  const items = COMMON_FOODS.map((food) => ({
    food,
    label: normalizeQuickText(foodName(food, lang)),
    alt: normalizeQuickText(foodName(food, lang === "de" ? "en" : "de")),
    aliases: aliases[food.id] || []
  }));
  const exact = items.find(({ label, alt, aliases: foodAliases }) =>
    label === q || alt === q || foodAliases.some((alias) => q === normalizeQuickText(alias))
  );
  if (exact) return exact.food;
  const contains = items.find(({ label, alt, aliases: foodAliases }) =>
    label.includes(q) || alt.includes(q) || q.includes(label) || q.includes(alt) ||
    foodAliases.some((alias) => {
      const a = normalizeQuickText(alias);
      return a && (q.includes(a) || a.includes(q));
    })
  );
  return contains?.food || null;
};

function FoodShortcutRow({ title, items, onAdd, onRemove, limit = 12 }) {
  if (!items?.length) return null;
  return (
    <AccentCard accent={title === "Favoriten" ? "#00d4aa" : "#9a9a9a"} className="p-3" contentClassName="pl-2">
      <div className="section-label mt-0 mb-2">{title} · {items.length}</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.slice(0, limit).map((item) => (
          <button
            key={`${item.id || item.name}-${item.amount_g}-${item.kcal}`}
            type="button"
            onClick={() => onAdd(item)}
            className="soft-band min-w-[132px] max-w-[156px] px-3 py-2 text-left hover:border-signal/50 transition"
          >
            <div className="text-[.76rem] text-ink leading-snug truncate">{item.name}</div>
            <div className="mono text-[.58rem] text-mute tabular-nums mt-1">
              {Math.round(Number(item.amount_g) || 0)}g · <span className="text-amber">{Math.round(Number(item.kcal) || 0)}</span> kcal
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="mono text-[.56rem] text-lime tabular-nums">P{Math.round(Number(item.protein_g) || 0)}g</div>
              {onRemove && (
                <span
                  role="button"
                  tabIndex={0}
                  className="mono text-[.7rem] text-mute hover:text-danger"
                  onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(item.id);
                    }
                  }}
                >
                  ×
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </AccentCard>
  );
}

function HistoryPicker({ items, onAdd }) {
  const [open, setOpen] = useState(false);
  if (!items?.length) return null;
  return (
    <>
      <AccentCard accent="#9a9a9a" className="p-3" contentClassName="pl-2">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 text-left"
          onClick={() => setOpen(true)}
        >
          <div className="section-label mt-0 mb-0 flex-1">History</div>
          <Icon.chev size={16} className="text-cyan shrink-0" />
        </button>
      </AccentCard>
      {open && (
        <div className="modal-shell" onClick={() => setOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div className="section-label mt-0 mb-0 flex-1">History</div>
              <button className="btn-icon" type="button" onClick={() => setOpen(false)} aria-label="close">
                <Icon.close size={15} />
              </button>
            </div>
            <div className="rounded-lg border border-line bg-bg2/55 overflow-hidden max-h-[62dvh] overflow-y-auto">
              {items.slice(0, 100).map((item) => (
                <button
                  key={`${item.id || item.name}-${item.amount_g}-${item.kcal}`}
                  type="button"
                  onClick={() => { onAdd(item); setOpen(false); }}
                  className="w-full px-3 py-2 border-b border-line last:border-0 text-left hover:bg-surface2/70 active:bg-surface2 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[.78rem] text-ink leading-snug truncate">{item.name}</div>
                      <div className="mono text-[.56rem] text-mute tabular-nums mt-[2px]">
                        {Math.round(Number(item.amount_g) || 0)}g · <span className="text-lime">P</span>{Math.round(Number(item.protein_g) || 0)}g
                      </div>
                    </div>
                    <div className="mono text-[.72rem] text-amber font-bold tabular-nums shrink-0">
                      {Math.round(Number(item.kcal) || 0)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
          const loggedItems = itemsForTemplate(template);
          const logged = loggedItems.length > 0;
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
                  const partLoggedItems = itemsForPart(template, part);
                  const partLogged = partLoggedItems.length > 0;
                  return (
                    <div key={partKey}>
                      <div className="flex items-stretch">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left px-3 py-2 hover:bg-bg2/60 active:bg-bg2 transition"
                          onClick={() => setOpenId(open ? null : partKey)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[.76rem] text-ink leading-snug font-medium">{part.title}</div>
                              <div className="mono text-[.58rem] text-mute tabular-nums mt-[2px]">
                                <span className="text-amber">{Math.round(part.totals.kcal)}</span> kcal · <span className="text-lime">P</span>{Math.round(part.totals.protein)}g
                              </div>
                            </div>
                            <Icon.chev size={14} className={`text-mute shrink-0 mt-[2px] transition ${open ? "rotate-90" : ""}`} />
                          </div>
                        </button>
                        <button
                          type="button"
                          className={`w-12 grid place-items-center border-l border-line/70 transition ${partLogged ? "text-signal bg-signal/10" : "text-mute hover:text-signal hover:bg-bg2/60"}`}
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

function LogCommand({
  totals,
  date,
  dateLabel,
  isToday,
  onToday,
  onShiftDate,
  showAddMenu,
  setShowAddMenu,
  openCamera,
  openPiece,
  openManual,
  openQuickVoice,
  quickListening,
  todayLabel,
  foodPrefs,
  onFoodChoice,
  foodTarget
}) {
  const kcalLeft = Math.max(0, Math.round((foodTarget?.kcal || 0) - totals.kcal));
  const proteinLeft = Math.max(0, Math.round((foodTarget?.protein || 0) - totals.protein));
  const targetLabel = foodTarget?.kcal
    ? `${kcalLeft} kcal · P ${proteinLeft}g`
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
        {metrics.map((m) => (
          <div key={m.label} className="metric-tile px-2 py-2 text-center">
            <div className="metric-label">{m.label}</div>
            <div className={`metric-value text-[.82rem] ${m.className}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 rounded-lg border border-line bg-bg2/45 p-1.5">
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

      <div className="flex items-center gap-2">
        {!isToday && (
          <button className="btn-ghost h-[40px] px-3" onClick={onToday}>
            {todayLabel}
          </button>
        )}
        <div className="relative flex-1">
          <button className="btn-primary w-full h-[40px] flex items-center justify-center gap-2" onClick={() => setShowAddMenu((v) => !v)}>
            <Icon.plus size={16} /> Ekle
          </button>
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowAddMenu(false)} />
              <div className="absolute left-0 right-0 top-full mt-2 z-30 card overflow-hidden border border-line">
                <button className="w-full text-left px-4 py-3 border-b border-line hover:bg-bg2 active:bg-bg2 flex items-center gap-3 transition-colors duration-200" onClick={openCamera}>
                  <Icon.camera size={16} className="text-signal shrink-0" />
                  <div className="mono text-sm text-ink">Kamera / Barkod</div>
                </button>
                <button className="w-full text-left px-4 py-3 border-b border-line hover:bg-bg2 active:bg-bg2 flex items-center gap-3 transition-colors duration-200" onClick={openPiece}>
                  <Icon.cart size={16} className="text-signal shrink-0" />
                  <div className="mono text-sm text-ink">Stückwahl</div>
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-bg2 active:bg-bg2 flex items-center gap-3 transition-colors duration-200" onClick={openManual}>
                  <Icon.plus size={16} className="text-signal shrink-0" />
                  <div className="mono text-sm text-ink">Manuell</div>
                </button>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          className={`btn-icon h-[40px] w-[40px] ${quickListening ? "text-signal border-signal/50" : ""}`}
          onClick={openQuickVoice}
          aria-label="quick voice add"
        >
          <Icon.mic size={16} />
        </button>
      </div>
    </AccentCard>
  );
}

export default function Log() {
  const { t } = useTranslation();
  const lang = (i18n.language || "en").startsWith("de") ? "de" : "en";
  const [date, setDate] = useState(todayStr());
  const [meals, setMeals] = useState([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [suppressSearchFor, setSuppressSearchFor] = useState("");
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState("gram"); // gram | piece | quick
  const [pieceFood, setPieceFood] = useState(null);
  const [pieces, setPieces] = useState(1);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickText, setQuickText] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickListening, setQuickListening] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [foodPrefs, setFoodPrefs] = useState(() => readTodayCallPrefs(todayStr()));
  const quickTextRef = useRef("");
  const recognitionRef = useRef(null);
  const quickListenTimerRef = useRef(null);

  const shiftDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
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
  const loadLibrary = async () => {
    const [recent, favorites] = await Promise.all([
      api.get("/foods/history").catch(() => api.get("/foods/recent").catch(() => [])),
      api.get("/foods/favorites").catch(() => [])
    ]);
    setRecentItems(recent || []);
    setFavoriteItems(favorites || []);
  };
  const load = async () => {
    await Promise.all([loadMeals(), loadLibrary()]);
  };
  useEffect(() => { load(); }, [date]);
  useEffect(() => { setFoodPrefs(readTodayCallPrefs(date)); }, [date]);
  useEffect(() => { quickTextRef.current = quickText; }, [quickText]);
  useEffect(() => () => {
    try { recognitionRef.current?.abort?.(); } catch {}
  }, []);

  // Ensure a meal exists for the day, return its id
  const ensureMeal = async () => {
    if (meals.length > 0) return meals[0].id;
    const time = new Date().toTimeString().slice(0, 5);
    const m = await api.post("/meals", { date, time, name: null });
    await loadMeals();
    return m.id;
  };

  const deleteItem = async (id) => { await api.del(`/meals/items/${id}`); load(); };
  const setItemEatenPct = async (item, pct) => {
    await api.put(`/meals/items/${item.id}`, { ...item, eaten_pct: pct });
    load();
  };

  // All items flat across all meals
  const allItems = meals.flatMap((m) => m.items);
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
  const addFoodItem = async (item) => {
    const mealId = await ensureMeal();
    await api.post(`/meals/${mealId}/items`, itemPayload(item));
    await load();
  };
  const toggleMealTemplate = async (template, part, loggedItems = []) => {
    if (loggedItems.length > 0) {
      await Promise.all(loggedItems.map((item) => api.del(`/meals/items/${item.id}`)));
      await load();
      return;
    }
    const mealId = await ensureMeal();
    const marker = mealTemplatePartMarker(template.id, part.id);
    await Promise.all(part.items.map((item) => api.post(`/meals/${mealId}/items`, itemPayload({ ...item, barcode: marker }))));
    await load();
  };
  const saveFavorite = async (item) => {
    await api.post("/foods/favorites", itemPayload(item));
    await loadLibrary();
  };
  const removeFavorite = async (id) => {
    await api.del(`/foods/favorites/${id}`);
    await loadLibrary();
  };

  const updateAmount = (g) => {
    if (g === "") return setDraft({ ...draft, amount_g: "" });
    if (!draft?._per100) return setDraft({ ...draft, amount_g: g });
    const factor = g / 100;
    setDraft({
      ...draft, amount_g: g,
      kcal:      +(draft._per100.kcal * factor).toFixed(1),
      protein_g: +((draft._per100.p || 0) * factor).toFixed(1),
      carbs_g:   +((draft._per100.c || 0) * factor).toFixed(1),
      fat_g:     +((draft._per100.f || 0) * factor).toFixed(1),
    });
  };

  useEffect(() => {
    const query = (draft?.name || "").trim();
    if (!draft || mode !== "gram" || query.length < 2 || query === suppressSearchFor) { setResults([]); return; }
    const h = setTimeout(async () => {
      try { setResults(await api.get(`/foods/search?q=${encodeURIComponent(query)}`)); }
      catch { setResults([]); }
    }, 350);
    return () => clearTimeout(h);
  }, [draft?.name, mode, suppressSearchFor]);

  const updateDraftName = (name) => {
    setSuppressSearchFor("");
    setResults([]);
    setDraft((d) => d ? { ...d, name } : d);
  };

  const pickResult = async (r) => {
    let item = r;
    if (item.kcal_100g == null || item.protein_100g == null) {
      try { item = await api.post("/foods/lookup-name", { name: r.name, brand: r.brand }); item.barcode = r.barcode; }
      catch {}
    }
    setDraft((d) => {
      if (!d) return d;
      const amt = d.amount_g || 100;
      const k = amt / 100;
      const name = [item.brand, item.name].filter(Boolean).join(" — ") || r.name;
      return {
        ...d,
        name,
        barcode: item.barcode || null,
        _per100: { kcal: item.kcal_100g, p: item.protein_100g, c: item.carbs_100g, f: item.fat_100g },
        kcal:      +((item.kcal_100g    || 0) * k).toFixed(1),
        protein_g: +((item.protein_100g || 0) * k).toFixed(1),
        carbs_g:   +((item.carbs_100g   || 0) * k).toFixed(1),
        fat_g:     +((item.fat_100g     || 0) * k).toFixed(1),
      };
    });
    setSuppressSearchFor([item.brand, item.name].filter(Boolean).join(" — ") || r.name);
    setResults([]);
  };

  const pickPieceFood = (food) => {
    setPieceFood(food);
    setPieces(1);
    const scaled = scaleByPieces(food, 1);
    setDraft((d) => ({ ...(d || emptyItem), ...scaled, name: food.name[lang], barcode: null }));
  };

  const updatePieces = (n) => {
    if (n === "") {
      setPieces("");
      return;
    }
    if (!pieceFood || n < 0) return;
    setPieces(n);
    const scaled = scaleByPieces(pieceFood, n);
    setDraft((d) => ({ ...(d || emptyItem), ...scaled, name: pieceFood.name[lang], barcode: null }));
  };

  const openCamera = () => { setShowAddMenu(false); setEditingItemId(null); setMode("gram"); setPieceFood(null); setPieces(1); setSuppressSearchFor(""); setScanOpen(true); };
  const openPiece = () => { setShowAddMenu(false); setEditingItemId(null); setMode("piece"); setPieceFood(null); setPieces(1); setSuppressSearchFor(""); setDraft({ ...emptyItem }); };
  const openManual = () => { setShowAddMenu(false); setEditingItemId(null); setMode("gram"); setPieceFood(null); setPieces(1); setSuppressSearchFor(""); setDraft({ ...emptyItem }); };
  const closeQuick = () => {
    if (quickListenTimerRef.current) {
      clearTimeout(quickListenTimerRef.current);
      quickListenTimerRef.current = null;
    }
    setQuickOpen(false);
    setQuickText("");
    setQuickBusy(false);
    setQuickError("");
    setQuickListening(false);
    try { recognitionRef.current?.abort?.(); } catch {}
    recognitionRef.current = null;
  };
  const openQuick = () => {
    setShowAddMenu(false);
    setQuickError("");
    setQuickText("");
    setQuickOpen(true);
  };
  const openQuickVoice = () => {
    openQuick();
    startListening();
  };
  const openEdit = (item) => {
    const quick = isQuickEntry(item);
    const amount = quick ? 100 : (Number(item.amount_g) || 100);
    setDraft({
      ...emptyItem,
      ...item,
      _per100: {
        kcal: ((Number(item.kcal) || 0) / amount) * 100,
        p: ((Number(item.protein_g) || 0) / amount) * 100,
        c: ((Number(item.carbs_g) || 0) / amount) * 100,
        f: ((Number(item.fat_g) || 0) / amount) * 100,
      },
    });
    setEditingItemId(item.id);
    setMode(quick ? "quick" : "gram");
    setPieceFood(null);
    setPieces(1);
    setSuppressSearchFor(item.name || "");
  };

  const submitQuickAdd = async (rawText) => {
    const parsed = parseQuickFoodEntry(rawText);
    const text = parsed?.query || "";
    if (!text) {
      setQuickError("metin okunamadı");
      return;
    }

    setQuickBusy(true);
    setQuickError("");
    try {
      const explicitMassUnit = /\b(?:g|gr|gram|gramm|kg|kgs?|kilo|el|essl?offel|tbsp|tablespoon|tl|teel?offel|tsp|teaspoon)\b/.test(normalizeQuickText(rawText));
      const commonFood = findCommonFoodMatch(text, lang);
      if (commonFood && parsed.amount != null && (parsed.unit === "piece" || parsed.kind === "count" || !explicitMassUnit)) {
        const amount = parsed.amount;
        const scaled = scaleByPieces(commonFood, amount);
        const item = {
          name: foodName(commonFood, lang),
          amount_g: scaled.amount_g,
          kcal: scaled.kcal,
          protein_g: scaled.protein_g,
          carbs_g: scaled.carbs_g,
          fat_g: scaled.fat_g,
          barcode: null
        };
        await addFoodItem(item);
        closeQuick();
        return;
      }

      const searchResults = await api.get(`/foods/search?q=${encodeURIComponent(text)}`).catch(() => []);
      let best = pickBestFoodMatch(searchResults, text);

      if ((!best || best.kcal_100g == null || best.protein_100g == null || best.carbs_100g == null || best.fat_100g == null) && text.length > 1) {
        try {
          const fallback = await api.post("/foods/lookup-name", { name: text, brand: best?.brand || null });
          if (fallback) best = { ...(best || {}), ...fallback };
        } catch {}
      }

      if (!best) {
        setQuickError("ürün bulunamadı");
        return;
      }

      const amount_g = parsed?.amount != null
        ? parsed.unit === "kg"
          ? parsed.amount * 1000
          : parsed.amount
        : 100;
      const factor = amount_g / 100;
      const name = [best.brand, best.name].filter(Boolean).join(" — ") || text;
      const item = {
        name,
        barcode: best.barcode || null,
        amount_g,
        kcal: +((Number(best.kcal_100g) || 0) * factor).toFixed(1),
        protein_g: +((Number(best.protein_100g) || 0) * factor).toFixed(1),
        carbs_g: +((Number(best.carbs_100g) || 0) * factor).toFixed(1),
        fat_g: +((Number(best.fat_100g) || 0) * factor).toFixed(1)
      };
      await addFoodItem(item);
      closeQuick();
    } catch (err) {
      setQuickError(String(err?.message || err || "quick_add_failed"));
    } finally {
      setQuickBusy(false);
      setQuickListening(false);
    }
  };

  const startListening = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || quickListening || quickBusy) return;
    setQuickError("");
    setQuickListening(true);
    const recognition = new Ctor();
    recognition.lang = lang === "de" ? "de-DE" : "tr-TR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    if (quickListenTimerRef.current) clearTimeout(quickListenTimerRef.current);
    quickListenTimerRef.current = setTimeout(() => {
      try { recognitionRef.current?.stop?.(); } catch {}
      setQuickListening(false);
      setQuickError("mikrofon zaman asimi");
    }, 12000);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) {
        quickTextRef.current = transcript;
        setQuickText(transcript);
      }
    };
    recognition.onerror = () => {
      if (quickListenTimerRef.current) {
        clearTimeout(quickListenTimerRef.current);
        quickListenTimerRef.current = null;
      }
      setQuickListening(false);
      setQuickError("mikrofon okunamadi");
    };
    recognition.onend = () => {
      if (quickListenTimerRef.current) {
        clearTimeout(quickListenTimerRef.current);
        quickListenTimerRef.current = null;
      }
      setQuickListening(false);
    };
    try {
      recognition.start();
    } catch {
      if (quickListenTimerRef.current) {
        clearTimeout(quickListenTimerRef.current);
        quickListenTimerRef.current = null;
      }
      setQuickListening(false);
      setQuickError("mikrofon baslatilamadi");
    }
  };

  const saveDraft = async () => {
    const { _per100, _analyzing, _noData, _pieces, _pieceFoodId, _gPerPiece, ...clean } = draft;
    clean.amount_g = mode === "quick" ? 0 : cleanNumber(clean.amount_g);
    clean.kcal = cleanNumber(clean.kcal);
    clean.protein_g = mode === "quick" ? 0 : cleanNumber(clean.protein_g);
    clean.carbs_g = mode === "quick" ? 0 : cleanNumber(clean.carbs_g);
    clean.fat_g = mode === "quick" ? 0 : cleanNumber(clean.fat_g);
    clean.eaten_pct = Math.max(0, Math.min(100, cleanNumber(clean.eaten_pct, 100)));
    if (editingItemId) await api.put(`/meals/items/${editingItemId}`, clean);
    else {
      const mealId = await ensureMeal();
      await api.post(`/meals/${mealId}/items`, clean);
    }
    setDraft(null); setEditingItemId(null); setMode("gram"); setPieceFood(null); setPieces(1); setSuppressSearchFor(""); load();
  };

  const closeDraft = () => { setDraft(null); setEditingItemId(null); setMode("gram"); setPieceFood(null); setPieces(1); setSuppressSearchFor(""); };

  return (
    <div className="page page-log">
      <LogCommand
        totals={totals}
        date={date}
        dateLabel={dateLabel}
        isToday={isToday}
        onToday={() => setDate(todayStr())}
        onShiftDate={shiftDate}
        showAddMenu={showAddMenu}
        setShowAddMenu={setShowAddMenu}
        openCamera={openCamera}
        openPiece={openPiece}
        openManual={openManual}
        openQuickVoice={openQuickVoice}
        quickListening={quickListening}
        todayLabel={t("log.today")}
        foodPrefs={foodPrefs}
        onFoodChoice={updateFoodChoice}
        foodTarget={foodTarget}
      />

      <MealTemplatePicker templates={MEAL_TEMPLATES} items={allItems} onToggle={toggleMealTemplate} />

      <FoodShortcutRow title="Favoriten" items={favoriteItems} onAdd={addFoodItem} onRemove={removeFavorite} />
      <HistoryPicker items={recentItems} onAdd={addFoodItem} />

      {/* Flat food list */}
      {allItems.length === 0 && (
        <Empty icon={<Icon.utensils size={22} />} label={t("log.title")} />
      )}

      {allItems.length > 0 && (
        <AccentCard accent="#d9a441" className="overflow-hidden" contentClassName="pl-2">
          <div className="divide-y divide-line">
            {allItems.map((it) => {
              const pct = eatenPct(it);
              const eff = effectiveMacros(it);
              return (
              <div key={it.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openEdit(it)}>
                  <div className="flex items-start gap-2">
                    {/* Name: 2-line clamp instead of truncate */}
                    <div className="text-sm text-ink leading-snug flex-1 min-w-0" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {it.name}
                    </div>
                    {isQuickEntry(it) && (
                      <span className="chip chip-energy shrink-0 mt-[1px]">
                        {t("log.mode_quick")}
                      </span>
                    )}
                  </div>
                  <div className="mono text-[.62rem] text-mute tabular-nums mt-[2px]">
                    {isQuickEntry(it)
                      ? t("log.mode_quick")
                      : <><span>{it.amount_g}g</span> · <span className="text-lime">P</span>{Math.round(eff.protein_g)} <span className="text-amber">C</span>{Math.round(eff.carbs_g)} <span className="text-ink2">F</span>{Math.round(eff.fat_g)}</>}
                  </div>
                </button>
                <div className="flex items-center gap-3 shrink-0 pt-[2px]">
                  <div className="mono text-sm text-amber font-bold tabular-nums">{Math.round(eff.kcal)}</div>
                  <button
                    className="text-mute hover:text-lime text-base leading-none"
                    aria-label="favorite"
                    onClick={(e) => { e.stopPropagation(); saveFavorite(it); }}
                  >
                    ☆
                  </button>
                  <button className="text-mute hover:text-signal mono text-[.62rem] uppercase tracking-[.14em] leading-none" onClick={() => openEdit(it)}>{t("log.edit")}</button>
                  <button className="text-mute hover:text-danger text-lg leading-none" onClick={() => deleteItem(it.id)}>×</button>
                </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="range"
                    min={0} max={100} step={10}
                    value={pct}
                    onChange={(e) => setItemEatenPct(it, Number(e.target.value))}
                    className="flex-1 accent-amber h-2 cursor-pointer"
                  />
                  <span className="mono text-[.62rem] text-amber font-bold tabular-nums w-[2.4rem] text-right">{pct}%</span>
                </div>
              </div>
              );
            })}
          </div>
        </AccentCard>
      )}

      {/* Barcode Scanner */}
      {scanOpen && <BarcodeScanner
        date={date}
        onCapture={() => {
          setScanOpen(false);
          setDraft({ ...emptyItem, name: "analyzing…", _analyzing: true });
        }}
        onPhoto={(food) => {
          const f = food || {};
          setDraft((d) => {
            if (!d) return d;
            const amt = d.amount_g || 100;
            const k = amt / 100;
            return {
              ...d,
              name: [f.brand, f.name].filter(Boolean).join(" — ") || "photo item",
              photo_path: f.photo_path || null,
              _per100: { kcal: f.kcal_100g, p: f.protein_100g, c: f.carbs_100g, f: f.fat_100g },
              kcal:      +((f.kcal_100g    || 0) * k).toFixed(1),
              protein_g: +((f.protein_100g || 0) * k).toFixed(1),
              carbs_g:   +((f.carbs_100g   || 0) * k).toFixed(1),
              fat_g:     +((f.fat_100g     || 0) * k).toFixed(1),
              _analyzing: false
            };
          });
        }}
        onError={(msg) => {
          setDraft((d) => ({ ...(d || emptyItem), name: `err: ${msg}`, _analyzing: false }));
        }}
        onClose={() => setScanOpen(false)} />}

      {/* Quick add modal */}
      {quickOpen && (
        <div className="modal-shell" onClick={closeQuick}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div className="section-label mt-0 mb-0 flex-1">Ses / Hızlı ekle</div>
              <button className="btn-icon" type="button" onClick={closeQuick} aria-label="close">
                <Icon.close size={15} />
              </button>
            </div>

            <div className="flex items-stretch gap-2">
              <input
                className="input flex-1"
                placeholder="200 gr more protein wraps"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitQuickAdd(quickText);
                  }
                }}
              />
              <button
                type="button"
                className={`btn-icon ${quickListening ? "text-signal" : ""}`}
                onClick={startListening}
                aria-label="mic"
                disabled={quickBusy || !getSpeechRecognitionCtor()}
              >
                <Icon.mic size={16} />
              </button>
            </div>

            {quickError && (
              <div className="mono text-[.62rem] text-warn uppercase tracking-[.14em] bg-warn/10 border border-warn/40 rounded-lg px-3 py-2">
                {quickError}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn flex-1" onClick={closeQuick}>{t("log.cancel")}</button>
              <button
                className="btn-primary flex-1"
                onClick={() => void submitQuickAdd(quickText)}
                disabled={quickBusy || !quickText.trim()}
              >
                {quickBusy ? "..." : "Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal */}
      {draft && (
        <div className="modal-shell">
          <div className="modal-panel">
            <div className="section-label">{editingItemId ? t("log.edit_item") : t("log.add_item")}</div>

            {/* Mode toggle */}
            <div className="soft-band p-1 flex gap-1">
              {["gram", "piece", "quick"].map((k) => (
                <button key={k} onClick={() => setMode(k)}
                  className={`flex-1 mono text-[.66rem] caps py-[8px] rounded-lg transition ${mode === k ? "bg-signal text-[#000000] font-bold" : "text-ink2 hover:bg-bg2"}`}>
                  {t(`log.mode_${k}`)}
                </button>
              ))}
            </div>

            {draft._noData && (
              <div className="mono text-[.62rem] text-warn uppercase tracking-[.14em] bg-warn/10 border border-warn/40 rounded-lg px-3 py-2">
                no nutrition data — enter manually
              </div>
            )}

            <div className="relative">
              <input
                className="input"
                placeholder={mode === "gram" ? "Name oder Produkt suchen…" : "Name"}
                value={draft.name}
                onChange={(e) => updateDraftName(e.target.value)}
              />
              {mode === "gram" && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 card max-h-52 overflow-y-auto">
                  {results.map((r, i) => (
                    <button key={i} type="button" onClick={() => pickResult(r)}
                      className="w-full text-left px-3 py-2 border-b border-line last:border-0 hover:bg-bg2">
                      <div className="text-sm text-ink truncate">{r.name}</div>
                      <div className="mono text-[.62rem] text-mute truncate">
                        {r.brand || "—"} {r.kcal_100g ? `· ${Math.round(r.kcal_100g)} kcal/100g` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* STÜCK mode */}
            {mode === "piece" && (
              <>
                {pieceFood ? (
                  <div className="soft-band p-3 border-line2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-ink">{pieceFood.name[lang]}</div>
                      <button className="mono text-[.6rem] text-mute hover:text-warn uppercase tracking-[.14em]"
                        onClick={() => { setPieceFood(null); setPieces(1); }}>change</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="step-btn" onClick={() => updatePieces(Math.max(0, (Number(pieces) || 0) - 1))}>−</button>
                      <input type="number" step="0.5" className="input mono text-center text-lg text-signal flex-1"
                        value={pieces} onChange={(e) => updatePieces(numberOrBlank(e.target.value))} />
                      <button className="step-btn" onClick={() => updatePieces((Number(pieces) || 0) + 1)}>+</button>
                      <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">×{pieceFood.g_per_piece}g</span>
                    </div>
                    <div className="mt-2 mono text-[.66rem] text-ink2 text-center tabular-nums">
                      ≈ {draft.amount_g}g · <span className="text-amber">{Math.round(draft.kcal)}</span> kcal · <span className="text-lime">P</span>{Math.round(draft.protein_g)} <span className="text-amber">C</span>{Math.round(draft.carbs_g)} <span className="text-ink2">F</span>{Math.round(draft.fat_g)}
                    </div>
                  </div>
                ) : (
                  /* Compact scrollable grid — smaller items */
                  <div className="grid grid-cols-3 gap-1 max-h-[180px] overflow-y-auto rounded-xl">
                    {COMMON_FOODS.map((f) => (
                      <button key={f.id} onClick={() => pickPieceFood(f)}
                        className="soft-band py-[6px] px-2 text-center hover:border-signal/50 transition flex flex-col gap-[1px]">
                        <div className="text-[.68rem] text-ink leading-tight truncate w-full">{f.name[lang]}</div>
                        <div className="mono text-[.52rem] text-mute">~{f.g_per_piece}g</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Macro inputs */}
            <div className="grid grid-cols-2 gap-2">
              {mode !== "quick" && (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("log.amount_g")}</span>
                    <input className="input mono" type="number" value={draft.amount_g}
                      onChange={(e) => updateAmount(numberOrBlank(e.target.value))} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="mono text-[.62rem] text-amber uppercase tracking-[.14em]">{t("log.kcal")}</span>
                    <input className="input mono" type="number" value={draft.kcal}
                      onChange={(e) => setDraft({ ...draft, kcal: numberOrBlank(e.target.value) })} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="mono text-[.62rem] text-lime uppercase tracking-[.14em]">{t("log.protein")}</span>
                    <input className="input mono" type="number" value={draft.protein_g}
                      onChange={(e) => setDraft({ ...draft, protein_g: numberOrBlank(e.target.value) })} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="mono text-[.62rem] text-amber uppercase tracking-[.14em]">{t("log.carbs")}</span>
                    <input className="input mono" type="number" value={draft.carbs_g}
                      onChange={(e) => setDraft({ ...draft, carbs_g: numberOrBlank(e.target.value) })} />
                  </label>
                  <label className="flex flex-col gap-1 col-span-2">
                    <span className="mono text-[.62rem] text-ink2 uppercase tracking-[.14em]">{t("log.fat")}</span>
                    <input className="input mono" type="number" value={draft.fat_g}
                      onChange={(e) => setDraft({ ...draft, fat_g: numberOrBlank(e.target.value) })} />
                  </label>
                </>
              )}
              {mode === "quick" && (
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="mono text-[.62rem] text-amber uppercase tracking-[.14em]">{t("log.kcal")}</span>
                  <input className="input mono" type="number" value={draft.kcal}
                    onChange={(e) => setDraft({ ...draft, kcal: numberOrBlank(e.target.value) })} />
                </label>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn flex-1" onClick={closeDraft}>{t("log.cancel")}</button>
              <button className="btn-primary flex-1" onClick={saveDraft}>{t("log.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
