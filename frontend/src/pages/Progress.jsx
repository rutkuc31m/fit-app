import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { PLAN, todayStr } from "../lib/plan";

function WeightChart({ logs }) {
  const data = logs.filter((l) => l.weight_kg != null).map((l) => ({ date: l.date, w: l.weight_kg }));
  if (!data.length) return <div className="mono text-xs text-mute text-center py-6">—</div>;
  const min = Math.min(...data.map((d) => d.w), PLAN.targetWeight - 1);
  const max = Math.max(...data.map((d) => d.w), PLAN.startWeight + 1);
  const W = 600, H = 180, pad = 24;
  const x = (i) => pad + (i / Math.max(1, data.length - 1)) * (W - pad * 2);
  const y = (w) => H - pad - ((w - min) / (max - min || 1)) * (H - pad * 2);
  const d = data.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.w)}`).join(" ");
  const targetY = y(PLAN.targetWeight);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[180px]">
      <line x1={pad} y1={targetY} x2={W - pad} y2={targetY} stroke="#9bc41a" strokeDasharray="3 4" strokeWidth="1" opacity=".6" />
      <text x={W - pad} y={targetY - 4} textAnchor="end" fontSize="9" fill="#9bc41a" fontFamily="'IBM Plex Mono', monospace" opacity=".7">TARGET {PLAN.targetWeight}kg</text>
      <path d={d} stroke="#ff4d6d" strokeWidth="2" fill="none" filter="drop-shadow(0 0 6px rgba(255,77,109,.55))" />
      {data.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.w)} r="2.5" fill="#ff4d6d" />)}
    </svg>
  );
}

export default function Progress() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [meas, setMeas] = useState([]);
  const [draft, setDraft] = useState(null);

  const load = async () => {
    const [l, m] = await Promise.all([
      api.get(`/logs?from=${PLAN.startDate}&to=${todayStr()}`),
      api.get("/measurements")
    ]);
    setLogs(l); setMeas(m);
  };
  useEffect(() => { load(); }, []);

  const saveMeas = async () => {
    await api.post("/measurements", { date: todayStr(), ...draft });
    setDraft(null); load();
  };

  const last = meas[meas.length - 1];

  return (
    <div className="page page-progress">
      <div className="section-label">{t("progress.weight_chart")}</div>
      <div className="card p-4"><WeightChart logs={logs} /></div>

      <div className="section-label">{t("progress.phases")}</div>
      <div className="flex flex-col gap-2">
        {PLAN.phases.map((p) => (
          <div key={p.id} className="card p-3 flex items-center gap-3">
            <div className="w-1 self-stretch rounded-full" style={{ background: p.color }} />
            <div className="flex-1">
              <div className="mono text-xs text-ink">P{p.id} · W{p.weeks[0]}–{p.weeks[1]}</div>
              <div className="mono text-[.66rem] text-mute">{p.from} → {p.to}kg</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="section-label flex-1">{t("progress.measurements")}</div>
        <button className="btn-primary" onClick={() => setDraft({})}>{t("progress.add_measurement")}</button>
      </div>

      {last && (
        <div className="card p-4 grid grid-cols-5 gap-2">
          {[["waist", last.waist_cm], ["chest", last.chest_cm], ["arm", last.arm_cm], ["hip", last.hip_cm], ["thigh", last.thigh_cm]].map(([k, v]) => (
            <div key={k} className="text-center">
              <div className="mono text-sm font-bold text-cyan tabular-nums">{v ?? "—"}</div>
              <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] mt-1">{t(`progress.${k}`)}</div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 bg-bg/90 backdrop-blur flex items-center justify-center p-4" onClick={() => setDraft(null)}>
          <div className="card w-full max-w-md p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="section-label">{t("progress.add_measurement")}</div>
            {["waist", "chest", "arm", "hip", "thigh"].map((k) => (
              <label key={k} className="flex items-center gap-3">
                <span className="mono text-xs text-mute uppercase tracking-[.14em] w-20">{t(`progress.${k}`)}</span>
                <input type="number" step="0.1" className="input mono flex-1"
                  onChange={(e) => setDraft({ ...draft, [`${k}_cm`]: +e.target.value })} />
                <span className="mono text-xs text-mute">{t("progress.cm")}</span>
              </label>
            ))}
            <div className="flex gap-2 mt-1">
              <button className="btn flex-1" onClick={() => setDraft(null)}>{t("log.cancel")}</button>
              <button className="btn-primary flex-1" onClick={saveMeas}>{t("log.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
