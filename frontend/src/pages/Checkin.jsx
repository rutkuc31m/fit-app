import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { todayStr, getWeekNum } from "../lib/plan";
import { PROTOCOLS } from "../lib/protocols";
import { AccentCard, Icon, PageCommand } from "../components/ui";

const PHOTO_BASE = (import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE?.replace(/\/api$/, "") || "https://api.fit.rutkuc.com"));

const FIELD_TO_COL = {
  energy: "energy",
  sleep_quality: "sleep_quality",
  back_pain: "back_pain",
  motivation: "motivation",
  adherence_pct: "adherence_pct",
  notes: "notes"
};

const PHOTO_FIELDS = { photo_front: "photo_front", photo_side: "photo_side", photo_back: "photo_back", photo_legs: "photo_legs" };
const MAX_PHOTO_EDGE = 1600;
const PHOTO_QUALITY = 0.82;

// Semantic color per field (muscle=lime, energy=amber, hydro=cyan)
const FIELD_COLOR = {
  energy: "amber",
  sleep_quality: "cyan",
  back_pain: "amber",
  motivation: "lime",
  adherence_pct: "lime"
};
const colorOf = (id) => FIELD_COLOR[id] || "lime";
const ACCENT_HEX = { lime: "#30d158", cyan: "#64d2ff", amber: "#ff9f0a" };
const accentOf = (id) => ACCENT_HEX[colorOf(id)] || "#30d158";

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const imageToCompressedDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file?.type?.startsWith("image/")) {
    reject(new Error("invalid_image"));
    return;
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async () => {
    try {
      const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
      const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(async (blob) => {
        URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error("image_compress_failed"));
          return;
        }
        blobToDataUrl(blob).then(resolve).catch(reject);
      }, "image/jpeg", PHOTO_QUALITY);
    } catch (e) {
      URL.revokeObjectURL(url);
      reject(e);
    }
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error("image_load_failed"));
  };
  img.src = url;
});

export default function Checkin() {
  const { t } = useTranslation();
  const date = todayStr();
  const week = getWeekNum(date);
  const order = PROTOCOLS.weeklyCheckpoint.order;
  const visible = useMemo(() => order.filter((f) => !f.biweekly), [order]);
  const [data, setData] = useState({});
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(null);

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
    setUploading(angle);
    try {
      const dataUrl = await imageToCompressedDataUrl(file);
      const out = await api.post(`/checkins/${week}/photo`, { angle: angle.replace("photo_", ""), data_url: dataUrl, date });
      setData((d) => ({ ...d, [angle]: out.path }));
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="page page-checkin">
      <PageCommand
        accent="#64d2ff"
        kicker="weekly check-in"
        title="Photos tell the truth."
        sub="Front · side · back · legs"
        metrics={[
          { label: "week", value: `W${String(week).padStart(2, "0")}`, className: "text-cyan" },
          { label: "fields", value: visible.length },
          { label: "photos", value: "4", className: "text-amber" }
        ]}
      />

      <div className="section-label">{t("checkin.title")} · W{week}</div>

      <AccentCard accent="#64d2ff" contentClassName="pl-2 flex items-start gap-2">
        <Icon.clock size={16} className="text-cyan mt-[2px] shrink-0" />
        <div className="mono text-[.7rem] text-ink2 leading-relaxed">{t("checkin.reminder")}</div>
      </AccentCard>

      {visible.map((f) => {
        if (PHOTO_FIELDS[f.id]) {
          const angleKey = f.id.replace("photo_", "");
          const busy = uploading === f.id;
          return (
            <AccentCard key={f.id} accent="#64d2ff" className={busy ? "border-amber/60" : ""}>
              <div className="flex justify-between items-center gap-2">
                <div>
                  <div className="card-title">{t(`checkin.${angleKey}`)}</div>
                  <div className="mono text-[.56rem] text-mute uppercase tracking-[.14em] mt-[2px]">photo check-in</div>
                </div>
                <span className={`chip ${busy ? "chip-energy" : data[f.id] ? "chip-hydro" : "chip-mute"}`}>
                  {busy ? "uploading" : data[f.id] ? "saved" : "empty"}
                </span>
              </div>
              <div className="mt-2 rounded-lg overflow-hidden border border-line bg-bg2 aspect-[3/4] max-h-[280px] grid place-items-center relative">
                {data[f.id] ? (
                  <>
                    <img src={PHOTO_BASE + data[f.id]} alt={angleKey} className="max-h-full max-w-full object-contain" />
                    <div className="absolute left-2 right-2 bottom-2 flex items-center justify-between gap-2">
                      <span className="mono text-[.54rem] text-cyan uppercase tracking-[.14em] bg-bg/80 border border-cyan/30 rounded px-2 py-1 backdrop-blur">{angleKey}</span>
                      <span className="mono text-[.54rem] text-ink2 uppercase tracking-[.14em] bg-bg/80 border border-line rounded px-2 py-1 backdrop-blur">compressed</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <Icon.camera size={24} className="text-cyan" />
                    <div className="mono text-[.62rem] text-ink2 uppercase tracking-[.14em]">no photo yet</div>
                    <div className="mono text-[.58rem] text-mute leading-relaxed">same light · same distance · relaxed posture</div>
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm grid place-items-center">
                    <div className="mono text-[.66rem] text-amber uppercase tracking-[.16em]">compressing · uploading</div>
                  </div>
                )}
              </div>
              <label className={`btn-ghost mt-2 inline-flex items-center justify-center gap-2 cursor-pointer w-full ${busy ? "opacity-60 pointer-events-none" : ""}`}>
                <Icon.camera size={14} />
                <span>{busy ? "Uploading" : data[f.id] ? "Replace photo" : "Add photo"}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden"
                  disabled={!!uploading}
                  onChange={(e) => {
                    onPhoto(f.id, e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }} />
              </label>
            </AccentCard>
          );
        }
        if (f.type === "number") {
          const c = colorOf(f.id);
          return (
            <AccentCard key={f.id} accent={accentOf(f.id)}>
              <div className="card-title mb-2">{f.label}</div>
              <input type="number" step="0.1" inputMode="decimal" className={`input mono text-lg text-${c}`}
                value={data[f.id] ?? ""} onChange={(e) => setField(f.id, e.target.value === "" ? "" : +e.target.value)} />
            </AccentCard>
          );
        }
        if (f.type === "scale") {
          const max = f.id === "back_pain" ? 5 : 5;
          const min = f.id === "back_pain" ? 0 : 1;
          const cur = data[f.id];
          const c = colorOf(f.id);
          return (
            <AccentCard key={f.id} accent={accentOf(f.id)}>
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
            </AccentCard>
          );
        }
        if (f.type === "percent") {
          const c = colorOf(f.id);
          return (
            <AccentCard key={f.id} accent={accentOf(f.id)}>
              <div className="flex justify-between items-baseline mb-2">
                <div className="card-title">{f.label}</div>
                <div className={`mono text-sm text-${c} font-bold tabular-nums`}>{data[f.id] ?? 0}%</div>
              </div>
              <input type="range" min="0" max="100" step="5" value={data[f.id] ?? 80}
                onChange={(e) => setField(f.id, +e.target.value)} className={`w-full accent-${c}`} />
            </AccentCard>
          );
        }
        if (f.type === "text") {
          return (
            <AccentCard key={f.id} accent="#bf5af2">
              <div className="card-title mb-2">{f.label}</div>
              <textarea className="input mono text-sm w-full min-h-[80px]" rows="3"
                value={data[f.id] ?? ""} onChange={(e) => setField(f.id, e.target.value)} />
            </AccentCard>
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
