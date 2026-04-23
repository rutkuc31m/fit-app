import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { api } from "../lib/api";
import { todayStr } from "../lib/plan";
import { COMMON_FOODS, scaleByPieces } from "../lib/commonFoods";
import BarcodeScanner from "../components/BarcodeScanner";
import { AccentCard, Empty, Icon, PageCommand } from "../components/ui";

const emptyItem = { name: "", amount_g: 100, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, barcode: null };
const numberOrBlank = (value) => value === "" ? "" : Number(value);
const cleanNumber = (value) => value === "" || value == null || Number.isNaN(Number(value)) ? 0 : Number(value);
const isQuickEntry = (item) =>
  Number(item?.amount_g || 0) <= 0 &&
  Number(item?.protein_g || 0) === 0 &&
  Number(item?.carbs_g || 0) === 0 &&
  Number(item?.fat_g || 0) === 0;

const quickSignature = (item) => `${String(item?.name || "").trim().toLowerCase()}|${Math.round(Number(item?.kcal) || 0)}`;

export default function Log() {
  const { t } = useTranslation();
  const lang = (i18n.language || "en").startsWith("de") ? "de" : "en";
  const [date, setDate] = useState(todayStr());
  const [meals, setMeals] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState("gram"); // gram | piece | quick
  const [pieceFood, setPieceFood] = useState(null);
  const [pieces, setPieces] = useState(1);
  const [editingItemId, setEditingItemId] = useState(null);

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

  const load = async () => setMeals(await api.get(`/meals?date=${date}`));
  const loadRecent = async () => setRecentFoods(await api.get("/foods/recent").catch(() => []));
  useEffect(() => { load(); }, [date]);
  useEffect(() => { loadRecent(); }, []);

  // Ensure a meal exists for the day, return its id
  const ensureMeal = async () => {
    if (meals.length > 0) return meals[0].id;
    const time = new Date().toTimeString().slice(0, 5);
    const m = await api.post("/meals", { date, time, name: null });
    await load();
    return m.id;
  };

  const deleteItem = async (id) => { await api.del(`/meals/items/${id}`); load(); };

  // All items flat across all meals
  const allItems = meals.flatMap((m) => m.items);
  const recentQuick = [];
  const seenQuick = new Set();
  for (const item of recentFoods) {
    if (!isQuickEntry(item)) continue;
    const sig = quickSignature(item);
    if (!item.name || seenQuick.has(sig)) continue;
    seenQuick.add(sig);
    recentQuick.push(item);
    if (recentQuick.length >= 4) break;
  }

  const totals = allItems.reduce((a, i) => {
    a.kcal    += i.kcal     || 0;
    a.protein += i.protein_g || 0;
    a.carbs   += i.carbs_g  || 0;
    a.fat     += i.fat_g    || 0;
    return a;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

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
    if (!draft || mode !== "gram" || search.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const h = setTimeout(async () => {
      try { setResults(await api.get(`/foods/search?q=${encodeURIComponent(search.trim())}`)); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(h);
  }, [search, draft, mode]);

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
      return {
        ...d,
        name: [item.brand, item.name].filter(Boolean).join(" — ") || r.name,
        barcode: item.barcode || null,
        _per100: { kcal: item.kcal_100g, p: item.protein_100g, c: item.carbs_100g, f: item.fat_100g },
        kcal:      +((item.kcal_100g    || 0) * k).toFixed(1),
        protein_g: +((item.protein_100g || 0) * k).toFixed(1),
        carbs_g:   +((item.carbs_100g   || 0) * k).toFixed(1),
        fat_g:     +((item.fat_100g     || 0) * k).toFixed(1),
      };
    });
    setSearch(""); setResults([]);
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

  const openAdd = () => { setDraft({ ...emptyItem }); setEditingItemId(null); setMode("gram"); setPieceFood(null); setPieces(1); setSearch(""); };
  const openQuick = (item = null) => {
    setDraft({ ...emptyItem, ...(item ? { name: item.name, kcal: Math.round(Number(item.kcal) || 0), amount_g: 0 } : { amount_g: 0 }) });
    setEditingItemId(null);
    setMode("quick");
    setPieceFood(null);
    setPieces(1);
    setSearch("");
  };
  const openScan = () => { setEditingItemId(null); setScanOpen(true); };
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
    setSearch("");
  };

  const saveDraft = async () => {
    const { _per100, _analyzing, _noData, _pieces, _pieceFoodId, _gPerPiece, ...clean } = draft;
    clean.amount_g = mode === "quick" ? 0 : cleanNumber(clean.amount_g);
    clean.kcal = cleanNumber(clean.kcal);
    clean.protein_g = mode === "quick" ? 0 : cleanNumber(clean.protein_g);
    clean.carbs_g = mode === "quick" ? 0 : cleanNumber(clean.carbs_g);
    clean.fat_g = mode === "quick" ? 0 : cleanNumber(clean.fat_g);
    if (editingItemId) await api.put(`/meals/items/${editingItemId}`, clean);
    else {
      const mealId = await ensureMeal();
      await api.post(`/meals/${mealId}/items`, clean);
    }
    setDraft(null); setEditingItemId(null); setMode("gram"); setPieceFood(null); setPieces(1); setSearch(""); load(); loadRecent();
  };

  const closeDraft = () => { setDraft(null); setEditingItemId(null); setMode("gram"); setPieceFood(null); setPieces(1); setSearch(""); };

  return (
    <div className="page page-log">
      <PageCommand
        accent="#ff9f0a"
        kicker="nutrition control"
        title="Log fast. Stay honest."
        sub="Scan · edit grams · protect protein"
        metrics={[
          { label: "kcal", value: Math.round(totals.kcal), className: "text-amber" },
          { label: "protein", value: `${Math.round(totals.protein)}g`, className: "text-lime" },
          { label: "carbs", value: `${Math.round(totals.carbs)}g`, className: "text-amber" },
          { label: "fat", value: `${Math.round(totals.fat)}g`, className: "text-ink2" }
        ]}
      />

      {/* Date navigator */}
      <AccentCard accent="#64d2ff" className="p-2" contentClassName="pl-2 flex items-center gap-2">
        <button className="btn-icon" aria-label="prev day" onClick={() => shiftDate(-1)}>
          <Icon.chev size={16} className="rotate-180" />
        </button>
        <div className="flex-1 text-center">
          <div className="mono text-sm text-ink font-bold tabular-nums">{dateLabel}</div>
          <div className="mono text-[.6rem] text-mute tabular-nums">{date}</div>
        </div>
        <button className="btn-icon" aria-label="next day" onClick={() => shiftDate(1)} disabled={isToday}>
          <Icon.chev size={16} className={isToday ? "opacity-30" : ""} />
        </button>
        {!isToday && (
          <button className="mono text-[.6rem] text-signal uppercase tracking-[.14em] px-2 hover:text-ink" onClick={() => setDate(todayStr())}>
            {t("log.today")}
          </button>
        )}
      </AccentCard>

      {/* Action buttons */}
      <div className="action-row">
        <button className="btn flex-1 flex items-center justify-center gap-2" onClick={openScan}>
          <Icon.scan size={15} /> Tarama
        </button>
        <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={openAdd}>
          <Icon.plus size={15} /> Ekle
        </button>
      </div>

      {recentQuick.length > 0 && (
        <AccentCard accent="#ff9f0a" className="p-3" contentClassName="pl-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="card-title">{t("log.recent_quick")}</div>
            <button className="mono text-[.58rem] text-amber uppercase tracking-[.14em] hover:text-ink" onClick={() => openQuick()}>
              {t("log.mode_quick")}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {recentQuick.map((item) => (
              <button
                key={quickSignature(item)}
                type="button"
                className="soft-band px-2 py-2 text-left hover:border-amber/60 transition min-w-0"
                onClick={() => openQuick(item)}
              >
                <div className="text-[.76rem] text-ink truncate">{item.name}</div>
                <div className="mono text-[.62rem] text-amber tabular-nums mt-[2px]">{Math.round(item.kcal)} kcal</div>
              </button>
            ))}
          </div>
        </AccentCard>
      )}

      {/* Flat food list */}
      {allItems.length === 0 && (
        <Empty icon={<Icon.utensils size={22} />} label={t("log.title")} hint="Yemek eklemek için Ekle veya Tarama'ya bas" />
      )}

      {allItems.length > 0 && (
        <AccentCard accent="#ff9f0a" className="overflow-hidden" contentClassName="pl-2">
          <div className="divide-y divide-line">
            {allItems.map((it) => (
              <div key={it.id} className="px-4 py-3 flex items-start justify-between gap-3">
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
                      ? t("log.quick_kcal_hint")
                      : <><span>{it.amount_g}g</span> · <span className="text-lime">P</span>{Math.round(it.protein_g)} <span className="text-amber">C</span>{Math.round(it.carbs_g)} <span className="text-ink2">F</span>{Math.round(it.fat_g)}</>}
                  </div>
                </button>
                <div className="flex items-center gap-3 shrink-0 pt-[2px]">
                  <div className="mono text-sm text-amber font-bold tabular-nums">{Math.round(it.kcal)}</div>
                  <button className="text-mute hover:text-signal mono text-[.62rem] uppercase tracking-[.14em] leading-none" onClick={() => openEdit(it)}>{t("log.edit")}</button>
                  <button className="text-mute hover:text-danger text-lg leading-none" onClick={() => deleteItem(it.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </AccentCard>
      )}

      {/* Barcode Scanner */}
      {scanOpen && <BarcodeScanner
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

            <input className="input" placeholder="Name" value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} />

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

            {/* GRAMM mode — search */}
            {mode === "gram" && (
              <div className="relative">
                <input className="input" placeholder="Ürün ara…" value={search}
                  onChange={(e) => setSearch(e.target.value)} />
                {(searching || results.length > 0) && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 card max-h-52 overflow-y-auto shadow-[0_10px_30px_-10px_rgba(0,0,0,.8)]">
                    {searching && <div className="px-3 py-2 mono text-[.66rem] text-mute">searching…</div>}
                    {!searching && results.length === 0 && search.trim().length >= 2 && (
                      <div className="px-3 py-2 mono text-[.66rem] text-mute">no matches</div>
                    )}
                    {results.map((r, i) => (
                      <button key={i} type="button" onClick={() => pickResult(r)}
                        className="w-full text-left px-3 py-2 border-b border-line last:border-0 hover:bg-bg2">
                        <div className="text-sm text-ink truncate">{r.name}</div>
                        <div className="mono text-[.62rem] text-mute truncate">
                          {r.brand || "—"} {r.kcal_100g ? `· ${Math.round(r.kcal_100g)} kcal/100g` : "· no macros (AI fallback)"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === "quick" && (
              <div className="soft-band px-3 py-3">
                <div className="mono text-[.62rem] text-amber uppercase tracking-[.14em]">{t("log.quick_kcal")}</div>
                <div className="mono text-[.62rem] text-mute leading-relaxed mt-1">{t("log.quick_kcal_hint")}</div>
              </div>
            )}

            {/* Macro inputs */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-amber uppercase tracking-[.14em]">{t("log.kcal")}</span>
                <input className="input mono" type="number" value={draft.kcal}
                  onChange={(e) => setDraft({ ...draft, kcal: numberOrBlank(e.target.value) })} />
              </label>
              {mode !== "quick" && (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("log.amount_g")}</span>
                    <input className="input mono" type="number" value={draft.amount_g}
                      onChange={(e) => updateAmount(numberOrBlank(e.target.value))} />
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
