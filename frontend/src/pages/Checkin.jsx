import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { todayStr, getWeekNum } from "../lib/plan";
import { PROTOCOLS } from "../lib/protocols";
import { Brackets, Icon } from "../components/ui";

const PHOTO_BASE = (import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE?.replace(/\/api$/, "") || "https://api.fit.rutkuc.com"));

const FIELD_TO_COL = {
  weight: "avg_weight",
  waist:  "waist_cm",
  chest:  "chest_cm",
  arm:    "arm_cm",
  energy: "energy",
  sleep_quality: "sleep_quality",
  back_pain: "back_pain",
  motivation: "motivation",
  adherence_pct: "adherence_pct",
  notes: "notes"
};

const PHOTO_FIELDS = { photo_front: "photo_front", photo_side: "photo_side", photo_back: "photo_back" };

// Semantic color per field (muscle=lime, energy=amber, hydro=cyan)
const FIELD_COLOR = {
  weight: "cyan",
  waist:  "cyan",
  chest:  "cyan",
  arm:    "cyan",
  energy: "amber",
  sleep_quality: "cyan",
  back_pain: "amber",
  motivation: "lime",
  adherence_pct: "lime"
};
const colorOf = (id) => FIELD_COLOR[id] || "lime";

export default function Checkin() {
  const { t } = useTranslation();
  const date = todayStr();
  const week = getWeekNum(date);
  const order = PROTOCOLS.weeklyCheckpoint.order;
  const isBiweekly = week % 2 === 0;
  const visible = useMemo(() => order.filter((f) => !f.biweekly || isBiweekly), [order, isBiweekly]);
  const [data, setData] = useState({});
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const row = await api.get(`/checkins/${week}`).catch(() => null);
    if (!row) return;
    const next = {};
    for (const f of order) {
      if (PHOTO_FIELDS[f.id]) { next[f.id] = row[f.id]; continue; }
      const col = FIELD_TO_COL[f.id];
      if (col && row[col] != null) next[f.id] = row[col];
    }
    setData(next);
  };
  useEffect(() => { load(); }, [week]);

  const setField = (id, v) => setData((d) => ({ ...d, [id]: v }));

  const save = async () => {
    const body = { date };
    for (const f of visible) {
      if (PHOTO_FIELDS[f.id]) continue;
      const col = FIELD_TO_COL[f.id];
      if (col && data[f.id] !== undefined && data[f.id] !== "") body[col] = data[f.id];
    }
    await api.put(`/checkins/${week}`, body);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const onPhoto = async (angle, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const out = await api.post(`/checkins/${week}/photo`, { angle: angle.replace("photo_", ""), data_url: reader.result });
      setData((d) => ({ ...d, [angle]: out.path }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="page page-checkin">
      <div className="section-label">{t("checkin.title")} · W{week}</div>

      <Brackets>
        <div className="card p-3 flex items-start gap-2">
          <Icon.clock size={16} className="text-cyan mt-[2px] shrink-0" />
          <div className="mono text-[.7rem] text-ink2 leading-relaxed">{t("checkin.reminder")}</div>
        </div>
      </Brackets>

      {visible.map((f) => {
        if (PHOTO_FIELDS[f.id]) {
          const angleKey = f.id.replace("photo_", "");
          return (
            <div key={f.id} className="card p-3">
              <div className="flex justify-between items-center">
                <div className="card-title">{t(`checkin.${angleKey}`)}</div>
                {data[f.id] && <span className="mono text-[.6rem] text-cyan">✓</span>}
              </div>
              {data[f.id] && (
                <div className="mt-2 rounded-lg overflow-hidden border border-line bg-bg2 aspect-[3/4] max-h-[260px] grid place-items-center">
                  <img src={PHOTO_BASE + data[f.id]} alt={angleKey} className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <label className="btn-ghost mt-2 inline-flex items-center justify-center gap-2 cursor-pointer w-full">
                <Icon.scan size={14} />
                <span>{data[f.id] ? "Replace" : "Upload"}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => onPhoto(f.id, e.target.files?.[0])} />
              </label>
            </div>
          );
        }
        if (f.type === "number") {
          const c = colorOf(f.id);
          return (
            <div key={f.id} className="card p-3">
              <div className="card-title mb-2">{f.label}</div>
              <input type="number" step="0.1" inputMode="decimal" className={`input mono text-lg text-${c}`}
                value={data[f.id] ?? ""} onChange={(e) => setField(f.id, e.target.value === "" ? "" : +e.target.value)} />
            </div>
          );
        }
        if (f.type === "scale") {
          const max = f.id === "back_pain" ? 5 : 5;
          const min = f.id === "back_pain" ? 0 : 1;
          const cur = data[f.id];
          const c = colorOf(f.id);
          return (
            <div key={f.id} className="card p-3">
              <div className="flex justify-between items-baseline mb-2">
                <div className="card-title">{f.label}</div>
                {cur != null && <div className={`mono text-sm text-${c} font-bold tabular-nums`}>{cur}</div>}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: max - min + 1 }).map((_, i) => {
                  const v = min + i;
                  const active = cur === v;
                  return (
                    <button key={v} onClick={() => setField(f.id, v)}
                      className={`flex-1 mono text-sm py-2 rounded-lg border transition ${active ? `bg-${c} text-[#000000] border-${c} font-bold` : "border-line text-ink2 hover:border-line2"}`}>
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        if (f.type === "percent") {
          const c = colorOf(f.id);
          return (
            <div key={f.id} className="card p-3">
              <div className="flex justify-between items-baseline mb-2">
                <div className="card-title">{f.label}</div>
                <div className={`mono text-sm text-${c} font-bold tabular-nums`}>{data[f.id] ?? 0}%</div>
              </div>
              <input type="range" min="0" max="100" step="5" value={data[f.id] ?? 80}
                onChange={(e) => setField(f.id, +e.target.value)} className={`w-full accent-${c}`} />
            </div>
          );
        }
        if (f.type === "text") {
          return (
            <div key={f.id} className="card p-3">
              <div className="card-title mb-2">{f.label}</div>
              <textarea className="input mono text-sm w-full min-h-[80px]" rows="3"
                value={data[f.id] ?? ""} onChange={(e) => setField(f.id, e.target.value)} />
            </div>
          );
        }
        return null;
      })}

      <button className={`btn-primary ${saved ? "flash-ok" : ""}`} onClick={save}>
        {saved ? <span className="inline-flex items-center gap-2 justify-center"><Icon.check size={14} /> {t("settings.saved")}</span> : t("checkin.save")}
      </button>
    </div>
  );
}
