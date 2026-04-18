import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { api } from "../lib/api";
import { todayStr } from "../lib/plan";
import { COMMON_FOODS, scaleByPieces } from "../lib/commonFoods";
import BarcodeScanner from "../components/BarcodeScanner";
import { Empty, Icon } from "../components/ui";

const emptyItem = { name: "", amount_g: 100, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, barcode: null };

export default function Log() {
  const { t } = useTranslation();
  const lang = (i18n.language || "en").startsWith("de") ? "de" : "en";
  const [date, setDate] = useState(todayStr());
  const [meals, setMeals] = useState([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState(null);
  const [draft, setDraft] = useState(null); // item being edited
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState("gram"); // gram | piece
  const [pieceFood, setPieceFood] = useState(null);
  const [pieces, setPieces] = useState(1);

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
  useEffect(() => { load(); }, [date]);

  const addMeal = async () => {
    const time = new Date().toTimeString().slice(0, 5);
    await api.post("/meals", { date, time, name: null });
    load();
  };
  const deleteMeal = async (id) => { await api.del(`/meals/${id}`); load(); };
  const deleteItem = async (id) => { await api.del(`/meals/items/${id}`); load(); };

  const updateAmount = (g) => {
    if (!draft?._per100) return setDraft({ ...draft, amount_g: g });
    const factor = g / 100;
    setDraft({
      ...draft, amount_g: g,
      kcal: +(draft._per100.kcal * factor).toFixed(1),
      protein_g: +((draft._per100.p || 0) * factor).toFixed(1),
      carbs_g: +((draft._per100.c || 0) * factor).toFixed(1),
      fat_g: +((draft._per100.f || 0) * factor).toFixed(1)
    });
  };

  useEffect(() => {
    if (!draft || search.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const h = setTimeout(async () => {
      try { setResults(await api.get(`/foods/search?q=${encodeURIComponent(search.trim())}`)); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(h);
  }, [search, draft]);

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
        kcal: +((item.kcal_100g || 0) * k).toFixed(1),
        protein_g: +((item.protein_100g || 0) * k).toFixed(1),
        carbs_g: +((item.carbs_100g || 0) * k).toFixed(1),
        fat_g: +((item.fat_100g || 0) * k).toFixed(1),
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
    if (!pieceFood || n < 0) return;
    setPieces(n);
    const scaled = scaleByPieces(pieceFood, n);
    setDraft((d) => ({ ...(d || emptyItem), ...scaled, name: pieceFood.name[lang], barcode: null }));
  };

  const saveDraft = async () => {
    const { _per100, _analyzing, _noData, _pieces, _pieceFoodId, _gPerPiece, ...clean } = draft;
    await api.post(`/meals/${activeMeal}/items`, clean);
    setDraft(null); setActiveMeal(null); setMode("gram"); setPieceFood(null); setPieces(1); load();
  };

  const totals = meals.reduce((a, m) => {
    m.items.forEach((i) => { a.kcal += i.kcal || 0; a.protein += i.protein_g || 0; });
    return a;
  }, { kcal: 0, protein: 0 });

  return (
    <div className="page page-log">
      <div className="flex items-center justify-between">
        <div className="section-label flex-1">{t("log.title")}</div>
        <button className="btn-primary" onClick={addMeal}>{t("log.add_meal")}</button>
      </div>

      {/* Date navigator */}
      <div className="card p-2 flex items-center gap-2">
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
      </div>

      <div className="card p-4">
        <div className="flex justify-between items-baseline">
          <div className="card-title">{t("log.totals")}</div>
          <div className="mono text-amber text-sm font-bold tabular-nums">{Math.round(totals.kcal)} <span className="text-amber/70 text-[.66rem]">kcal</span></div>
        </div>
        <div className="mt-2 mono text-xs text-ink2">
          <span className="text-lime">{t("log.protein")}</span>: <span className="text-ink tabular-nums">{Math.round(totals.protein)}g</span>
        </div>
      </div>

      {meals.length === 0 && (
        <Empty icon={<Icon.utensils size={22} />} label={t("log.title")} hint={t("log.add_meal")}
          action={<button className="btn-ghost mt-2" onClick={addMeal}>+ {t("log.add_meal")}</button>} />
      )}

      {meals.map((m) => (
        <div key={m.id} className="card overflow-hidden">
          <div className="px-4 py-3 flex justify-between items-center border-b border-line">
            <div>
              <div className="mono text-xs text-ink">{m.name || m.time || "—"}</div>
              <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em] mt-[2px]">{m.time}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-icon" aria-label="scan" onClick={() => { setActiveMeal(m.id); setScanOpen(true); }}><Icon.scan size={16} /></button>
              <button className="btn-icon" aria-label="add item" onClick={() => { setActiveMeal(m.id); setDraft({ ...emptyItem }); }}><Icon.plus size={16} /></button>
              <button className="btn-icon hover:!text-warn" aria-label="delete meal" onClick={() => deleteMeal(m.id)}><Icon.trash size={15} /></button>
            </div>
          </div>
          {m.items.length > 0 && (
            <div className="divide-y divide-line">
              {m.items.map((it) => (
                <div key={it.id} className="px-4 py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm text-ink truncate">{it.name}</div>
                    <div className="mono text-[.66rem] text-mute tabular-nums">
                      {it.amount_g}g · <span className="text-lime">P</span>{Math.round(it.protein_g)} <span className="text-amber">C</span>{Math.round(it.carbs_g)} <span className="text-ink2">F</span>{Math.round(it.fat_g)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="mono text-sm text-amber font-bold tabular-nums">{Math.round(it.kcal)}</div>
                    <button className="text-mute hover:text-danger text-lg" onClick={() => deleteItem(it.id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

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
              kcal: +((f.kcal_100g || 0) * k).toFixed(1),
              protein_g: +((f.protein_100g || 0) * k).toFixed(1),
              carbs_g: +((f.carbs_100g || 0) * k).toFixed(1),
              fat_g: +((f.fat_100g || 0) * k).toFixed(1),
              _analyzing: false
            };
          });
        }}
        onError={(msg) => {
          setDraft((d) => ({ ...(d || emptyItem), name: `err: ${msg}`, _analyzing: false }));
        }}
        onClose={() => setScanOpen(false)} />}

      {draft && activeMeal && (
        <div className="fixed inset-0 z-50 bg-bg/90 backdrop-blur flex items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
          <div className="card w-full max-w-md p-4 flex flex-col gap-3 relative max-h-[88vh] overflow-y-auto">
            <div className="section-label">{t("log.add_item")}</div>

            {/* Mode toggle: Gram | Stück */}
            <div className="card p-1 flex gap-1">
              {["gram", "piece"].map((k) => (
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
            <input className="input" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />

            {mode === "piece" && (
              <>
                {pieceFood ? (
                  <div className="card p-3 border-line2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-ink">{pieceFood.name[lang]}</div>
                      <button className="mono text-[.6rem] text-mute hover:text-warn uppercase tracking-[.14em]" onClick={() => { setPieceFood(null); setPieces(1); }}>change</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="step-btn" onClick={() => updatePieces(Math.max(0, pieces - 1))}>−</button>
                      <input type="number" step="0.5" className="input mono text-center text-lg text-signal flex-1" value={pieces} onChange={(e) => updatePieces(+e.target.value || 0)} />
                      <button className="step-btn" onClick={() => updatePieces(pieces + 1)}>+</button>
                      <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">×{pieceFood.g_per_piece}g</span>
                    </div>
                    <div className="mt-2 mono text-[.66rem] text-ink2 text-center tabular-nums">
                      ≈ {draft.amount_g}g · <span className="text-amber">{Math.round(draft.kcal)}</span> kcal · <span className="text-lime">P</span>{Math.round(draft.protein_g)} <span className="text-amber">C</span>{Math.round(draft.carbs_g)} <span className="text-ink2">F</span>{Math.round(draft.fat_g)}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
                    {COMMON_FOODS.map((f) => (
                      <button key={f.id} onClick={() => pickPieceFood(f)}
                        className="card p-2 text-center hover:border-signal/50 transition flex flex-col gap-[2px]">
                        <div className="text-[.72rem] text-ink leading-tight truncate">{f.name[lang]}</div>
                        <div className="mono text-[.55rem] text-mute">~{f.g_per_piece}g</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {mode === "gram" && <div className="relative">
              <input className="input" placeholder="search product…" value={search} onChange={(e) => setSearch(e.target.value)} />
              {(searching || results.length > 0) && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 card max-h-60 overflow-y-auto shadow-[0_10px_30px_-10px_rgba(0,0,0,.8)]">
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
            </div>}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("log.amount_g")}</span>
                <input className="input mono" type="number" value={draft.amount_g} onChange={(e) => updateAmount(+e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-amber uppercase tracking-[.14em]">{t("log.kcal")}</span>
                <input className="input mono" type="number" value={draft.kcal} onChange={(e) => setDraft({ ...draft, kcal: +e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-lime uppercase tracking-[.14em]">{t("log.protein")}</span>
                <input className="input mono" type="number" value={draft.protein_g} onChange={(e) => setDraft({ ...draft, protein_g: +e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-amber uppercase tracking-[.14em]">{t("log.carbs")}</span>
                <input className="input mono" type="number" value={draft.carbs_g} onChange={(e) => setDraft({ ...draft, carbs_g: +e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 col-span-2">
                <span className="mono text-[.62rem] text-coral uppercase tracking-[.14em]">{t("log.fat")}</span>
                <input className="input mono" type="number" value={draft.fat_g} onChange={(e) => setDraft({ ...draft, fat_g: +e.target.value })} />
              </label>
            </div>
            <div className="flex gap-2 mt-1">
              <button className="btn flex-1" onClick={() => { setDraft(null); setMode("gram"); setPieceFood(null); setPieces(1); }}>{t("log.cancel")}</button>
              <button className="btn-primary flex-1" onClick={saveDraft}>{t("log.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
