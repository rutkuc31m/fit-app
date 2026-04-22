import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { PLAN, todayStr } from "../lib/plan";

const numberOrBlank = (value) => value === "" ? "" : Number(value);
const cleanMeasurement = (draft = {}) => Object.fromEntries(
  Object.entries(draft).filter(([, value]) => value !== "" && value != null && !Number.isNaN(Number(value)))
);
const MEASUREMENT_FIELDS = ["waist", "chest", "arm", "hip"];
const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};
const fmt = (value, digits = 1) => value == null ? "--" : Number(value).toFixed(digits);
const measurementDraftFromLast = (last) => last ? ({
  waist_cm: last.waist_cm ?? "",
  chest_cm: last.chest_cm ?? "",
  arm_cm: last.arm_cm ?? "",
  hip_cm: last.hip_cm ?? ""
}) : {};

function WeightChart({ logs }) {
  const data = logs.filter((l) => l.weight_kg != null).map((l) => ({ date: l.date, w: l.weight_kg }));
  if (!data.length) return <div className="mono text-xs text-mute text-center py-6">—</div>;
  const trend = data.map((p, i) => {
    const slice = data.slice(Math.max(0, i - 6), i + 1);
    return { ...p, avg: slice.reduce((sum, row) => sum + row.w, 0) / slice.length };
  });
  const min = Math.min(...data.map((d) => d.w), PLAN.targetWeight - 1);
  const max = Math.max(...data.map((d) => d.w), PLAN.startWeight + 1);
  const W = 600, H = 180, pad = 24;
  const x = (i) => pad + (i / Math.max(1, data.length - 1)) * (W - pad * 2);
  const y = (w) => H - pad - ((w - min) / (max - min || 1)) * (H - pad * 2);
  const d = data.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.w)}`).join(" ");
  const trendD = trend.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.avg)}`).join(" ");
  const targetY = y(PLAN.targetWeight);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[180px]">
      <line x1={pad} y1={targetY} x2={W - pad} y2={targetY} stroke="#248a3d" strokeDasharray="3 4" strokeWidth="1" opacity=".6" />
      <text x={W - pad} y={targetY - 4} textAnchor="end" fontSize="9" fill="#248a3d" fontFamily="'JetBrains Mono', monospace" opacity=".7">TARGET {PLAN.targetWeight}kg</text>
      <path d={d} stroke="#3a3a3c" strokeWidth="1.5" fill="none" opacity=".85" />
      <path d={trendD} stroke="#30d158" strokeWidth="2.5" fill="none" filter="drop-shadow(0 0 6px rgba(48,209,88,.5))" />
      {data.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.w)} r="2.5" fill="#30d158" />)}
      <text x={pad} y={16} fontSize="9" fill="#a1a1a6" fontFamily="'JetBrains Mono', monospace">daily</text>
      <text x={pad + 44} y={16} fontSize="9" fill="#30d158" fontFamily="'JetBrains Mono', monospace">7d trend</text>
    </svg>
  );
}

function AdherenceCard({ review }) {
  if (!review) return null;
  const pct = review.adherence_pct ?? 0;
  const r = 24;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  const items = [
    ["meals", `${review.meal_consistency_pct ?? "--"}%`],
    ["protein", `${review.protein_days ?? 0}/5`],
    ["fast", `${review.fast_clean_days ?? 0}/2`],
    ["recovery", `${review.recovery_days ?? 0}/7`],
    ["water", `${review.hydration_days ?? 0}/7`]
  ];
  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <div className="relative w-[64px] h-[64px] shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r={r} stroke="rgba(255,255,255,.08)" strokeWidth="5" fill="none" />
            <circle cx="32" cy="32" r={r} stroke="#30d158" strokeWidth="5" fill="none"
              strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 grid place-items-center mono text-sm text-lime font-bold tabular-nums">{pct}%</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="section-label mt-0 mb-2">adherence</div>
          <div className="grid grid-cols-2 min-[460px]:grid-cols-5 gap-1">
            {items.map(([label, value]) => (
              <div key={label} className="metric-tile px-2 py-1 text-center">
                <div className="metric-label">{label}</div>
                <div className="metric-value text-[.78rem]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyReviewCard({ review }) {
  if (!review) return null;
  const signalCopy = {
    strong: {
      label: "strong week",
      tone: "text-lime",
      note: "Training, tracking and recovery are aligned. Keep the exact rhythm."
    },
    recover: {
      label: "recovery first",
      tone: "text-cyan",
      note: "Energy or headache signal is high. Walk easy, salt carefully, sleep hard."
    },
    audit: {
      label: "audit week",
      tone: "text-amber",
      note: "Weight trend is pushing up. Check hidden calories, late salt and meal portions."
    },
    keep_going: {
      label: "collect signal",
      tone: "text-ink",
      note: "Keep logging weight, meals and recovery so the next adjustment is obvious."
    }
  }[review.signal] || {
    label: "collect signal",
    tone: "text-ink",
    note: "Keep logging weight, meals and recovery so the next adjustment is obvious."
  };

  const weightDelta = review.weight_delta == null ? "--" : `${review.weight_delta > 0 ? "+" : ""}${fmt(review.weight_delta)}kg`;
  const waistDelta = review.waist_change == null ? "--" : `${review.waist_change > 0 ? "+" : ""}${fmt(review.waist_change)}cm`;
  const metrics = [
    ["adherence", `${review.adherence_pct ?? "--"}%`],
    ["meal score", `${review.meal_consistency_pct ?? "--"}%`],
    ["avg weight", `${fmt(review.avg_weight)}kg`],
    ["vs last week", weightDelta],
    ["waist", `${fmt(review.latest_waist_cm)}cm`],
    ["waist delta", waistDelta],
    ["training", `${review.training_done}/${review.training_planned || 0}`],
    ["meal days", `${review.meal_days}/7`],
    ["protein days", `${review.protein_days ?? 0}/5`],
    ["fast clean", `${review.fast_clean_days ?? 0}/2`],
    ["kcal avg", fmt(review.avg_kcal, 0)],
    ["protein avg", `${fmt(review.avg_protein_g, 0)}g`],
    ["energy", `${fmt(review.avg_energy)}/5`],
    ["hunger", `${fmt(review.avg_hunger)}/5`],
    ["headache", `${fmt(review.avg_headache)}/5`]
  ];

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="section-label mt-0 mb-1">weekly review</div>
          <div className={`font-display text-[1.35rem] leading-none ${signalCopy.tone}`}
            style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
            {signalCopy.label}
          </div>
        </div>
        <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] text-right tabular-nums">
          {review.from}<br />{review.to}
        </div>
      </div>
      <div className="grid grid-cols-2 min-[460px]:grid-cols-4 gap-2">
        {metrics.map(([label, value]) => (
          <div key={label} className="metric-tile">
            <div className="metric-label">{label}</div>
            <div className="metric-value text-[.95rem]">{value}</div>
          </div>
        ))}
      </div>
      <div className="mono text-[.66rem] text-ink2 leading-snug mt-3">{signalCopy.note}</div>
    </div>
  );
}

export default function Progress() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [meas, setMeas] = useState([]);
  const [draft, setDraft] = useState(null);
  const [review, setReview] = useState(null);

  const load = async () => {
    const to = todayStr();
    const from = addDays(to, -6);
    const [l, m, r] = await Promise.all([
      api.get(`/logs?from=${PLAN.startDate}&to=${to}`),
      api.get("/measurements"),
      api.get(`/stats/weekly-review?from=${from}&to=${to}`).catch(() => null)
    ]);
    setLogs(l); setMeas(m); setReview(r);
  };
  useEffect(() => { load(); }, []);

  const saveMeas = async () => {
    await api.post("/measurements", { date: todayStr(), ...cleanMeasurement(draft) });
    setDraft(null); load();
  };

  const last = meas[meas.length - 1];
  const latestWeight = [...logs].reverse().find((l) => l.weight_kg != null)?.weight_kg ?? null;
  const lost = latestWeight != null ? Math.max(0, PLAN.startWeight - latestWeight) : 0;
  const left = Math.max(0, (PLAN.startWeight - PLAN.targetWeight) - lost);

  return (
    <div className="page page-progress">
      <div className="page-hero">
        <div className="relative z-10">
          <div className="page-hero-kicker">body data</div>
          <div className="page-hero-title">Trend over mood.</div>
          <div className="page-hero-sub">Weight · waist · phase checkpoints</div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="metric-tile">
              <div className="metric-label">current</div>
              <div className="metric-value">{latestWeight != null ? latestWeight.toFixed(1) : "--"}<span className="text-mute text-[.62rem] ml-1">kg</span></div>
            </div>
            <div className="metric-tile">
              <div className="metric-label">lost</div>
              <div className="metric-value text-lime">{lost.toFixed(1)}<span className="text-mute text-[.62rem] ml-1">kg</span></div>
            </div>
            <div className="metric-tile">
              <div className="metric-label">left</div>
              <div className="metric-value text-amber">{left.toFixed(1)}<span className="text-mute text-[.62rem] ml-1">kg</span></div>
            </div>
          </div>
        </div>
      </div>

      <WeeklyReviewCard review={review} />
      <AdherenceCard review={review} />

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
        <button className="btn-primary" onClick={() => setDraft(measurementDraftFromLast(last))}>{t("progress.add_measurement")}</button>
      </div>

      {last && (
        <div className="card p-4 grid grid-cols-4 gap-2">
          {MEASUREMENT_FIELDS.map((k) => (
            <div key={k} className="text-center">
              <div className="mono text-sm font-bold text-cyan tabular-nums">{last[`${k}_cm`] ?? "—"}</div>
              <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] mt-1">{t(`progress.${k}`)}</div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="modal-shell" onClick={() => setDraft(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="section-label">{t("progress.add_measurement")}</div>
            {MEASUREMENT_FIELDS.map((k) => (
              <label key={k} className="flex items-center gap-3">
                <span className="mono text-xs text-mute uppercase tracking-[.14em] w-20">{t(`progress.${k}`)}</span>
                <input type="number" step="0.1" className="input mono flex-1"
                  value={draft[`${k}_cm`] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [`${k}_cm`]: numberOrBlank(e.target.value) })} />
                <span className="mono text-xs text-mute">{t("progress.cm")}</span>
              </label>
            ))}
            <div className="modal-actions">
              <button className="btn flex-1" onClick={() => setDraft(null)}>{t("log.cancel")}</button>
              <button className="btn-primary flex-1" onClick={saveMeas}>{t("log.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
