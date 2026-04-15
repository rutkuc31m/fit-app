import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { todayStr } from "../lib/plan";
import BarcodeScanner from "../components/BarcodeScanner";
import { Empty, Icon } from "../components/ui";

const emptyItem = { name: "", amount_g: 100, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, barcode: null };

export default function Log() {
  const { t } = useTranslation();
  const [date] = useState(todayStr());
  const [meals, setMeals] = useState([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState(null);
  const [draft, setDraft] = useState(null); // item being edited

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

  const saveDraft = async () => {
    await api.post(`/meals/${activeMeal}/items`, draft);
    setDraft(null); setActiveMeal(null); load();
  };

  const totals = meals.reduce((a, m) => {
    m.items.forEach((i) => { a.kcal += i.kcal || 0; a.protein += i.protein_g || 0; });
    return a;
  }, { kcal: 0, protein: 0 });

  return (
    <div className="page">
      <div className="flex items-center justify-between">
        <div className="section-label flex-1">{t("log.title")}</div>
        <button className="btn-primary" onClick={addMeal}>{t("log.add_meal")}</button>
      </div>

      <div className="card p-4">
        <div className="flex justify-between items-baseline">
          <div className="card-title">{t("log.totals")}</div>
          <div className="mono text-signal text-sm font-bold">{Math.round(totals.kcal)} kcal</div>
        </div>
        <div className="mt-2 mono text-xs text-ink2">
          {t("log.protein")}: <span className="text-ink">{Math.round(totals.protein)}g</span>
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
                    <div className="mono text-[.66rem] text-mute">
                      {it.amount_g}g · P{Math.round(it.protein_g)} C{Math.round(it.carbs_g)} F{Math.round(it.fat_g)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="mono text-sm text-signal font-bold">{Math.round(it.kcal)}</div>
                    <button className="text-mute hover:text-warn text-lg" onClick={() => deleteItem(it.id)}>×</button>
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
          setDraft((d) => ({
            ...(d || emptyItem),
            name: [f.brand, f.name].filter(Boolean).join(" — ") || "photo item",
            _per100: { kcal: f.kcal_100g, p: f.protein_100g, c: f.carbs_100g, f: f.fat_100g },
            _analyzing: false
          }));
        }}
        onError={(msg) => {
          setDraft((d) => ({ ...(d || emptyItem), name: `err: ${msg}`, _analyzing: false }));
        }}
        onClose={() => setScanOpen(false)} />}

      {draft && activeMeal && (
        <div className="fixed inset-0 z-50 bg-bg/90 backdrop-blur flex items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
          <div className="card w-full max-w-md p-4 flex flex-col gap-3">
            <div className="section-label">{t("log.add_item")}</div>
            {draft._noData && (
              <div className="mono text-[.62rem] text-warn uppercase tracking-[.14em] bg-warn/10 border border-warn/40 rounded-lg px-3 py-2">
                no nutrition data — enter manually
              </div>
            )}
            <input className="input" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("log.amount_g")}</span>
                <input className="input mono" type="number" value={draft.amount_g} onChange={(e) => updateAmount(+e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("log.kcal")}</span>
                <input className="input mono" type="number" value={draft.kcal} onChange={(e) => setDraft({ ...draft, kcal: +e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("log.protein")}</span>
                <input className="input mono" type="number" value={draft.protein_g} onChange={(e) => setDraft({ ...draft, protein_g: +e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("log.carbs")}</span>
                <input className="input mono" type="number" value={draft.carbs_g} onChange={(e) => setDraft({ ...draft, carbs_g: +e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 col-span-2">
                <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("log.fat")}</span>
                <input className="input mono" type="number" value={draft.fat_g} onChange={(e) => setDraft({ ...draft, fat_g: +e.target.value })} />
              </label>
            </div>
            <div className="flex gap-2 mt-1">
              <button className="btn flex-1" onClick={() => setDraft(null)}>{t("log.cancel")}</button>
              <button className="btn-primary flex-1" onClick={saveDraft}>{t("log.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
