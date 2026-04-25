import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { PLAN, todayStr } from "../lib/plan";
import { AccentCard, Icon, PageCommand } from "../components/ui";

const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};
const fmt = (value, digits = 1) => value == null ? "--" : Number(value).toFixed(digits);

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
    <AccentCard accent="#30d158" className="p-4">
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
    </AccentCard>
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
  const metrics = [
    ["adherence", `${review.adherence_pct ?? "--"}%`],
    ["meal score", `${review.meal_consistency_pct ?? "--"}%`],
    ["avg weight", `${fmt(review.avg_weight)}kg`],
    ["vs last week", weightDelta],
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
    <AccentCard accent={review.signal === "recover" ? "#64d2ff" : review.signal === "audit" ? "#ff9f0a" : "#30d158"} className="p-4">
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
    </AccentCard>
  );
}

export default function Progress() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [review, setReview] = useState(null);

  const load = async () => {
    const to = todayStr();
    const from = addDays(to, -6);
    const [l, r] = await Promise.all([
      api.get(`/logs?from=${PLAN.startDate}&to=${to}`),
      api.get(`/stats/weekly-review?from=${from}&to=${to}`).catch(() => null)
    ]);
    setLogs(l); setReview(r);
  };
  useEffect(() => { load(); }, []);

  const latestWeight = [...logs].reverse().find((l) => l.weight_kg != null)?.weight_kg ?? null;
  const lost = latestWeight != null ? Math.max(0, PLAN.startWeight - latestWeight) : 0;
  const left = Math.max(0, (PLAN.startWeight - PLAN.targetWeight) - lost);

  return (
    <div className="page page-progress">
      <PageCommand
        accent="#64d2ff"
        kicker="body data"
        title="Trend over mood."
        sub="Weight · photos · phase checkpoints"
        metrics={[
          { label: "current", value: <>{latestWeight != null ? latestWeight.toFixed(1) : "--"}<span className="text-mute text-[.62rem] ml-1">kg</span></> },
          { label: "lost", value: <>{lost.toFixed(1)}<span className="text-mute text-[.62rem] ml-1">kg</span></>, className: "text-lime" },
          { label: "left", value: <>{left.toFixed(1)}<span className="text-mute text-[.62rem] ml-1">kg</span></>, className: "text-amber" }
        ]}
      />

      <AccentCard as={Link} to="/checkin" accent="#64d2ff" className="hover:border-line2" contentClassName="pl-2 flex items-center gap-3 w-full">
        <div className="w-10 h-10 rounded-md border border-cyan/40 bg-cyan/[.08] grid place-items-center text-cyan shrink-0">
          <Icon.camera size={19} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="card-title">Progress photos</div>
          <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em] truncate">front · side · back · weekly check-in</div>
        </div>
        <Icon.chev size={14} className="text-mute shrink-0" />
      </AccentCard>

      <WeeklyReviewCard review={review} />
      <AdherenceCard review={review} />

      <div className="section-label">{t("progress.weight_chart")}</div>
      <AccentCard accent="#64d2ff" className="p-4"><WeightChart logs={logs} /></AccentCard>

      <div className="section-label">{t("progress.phases")}</div>
      <div className="flex flex-col gap-2">
        {PLAN.phases.map((p) => (
          <AccentCard key={p.id} accent={p.color} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="mono text-xs text-ink">P{p.id} · W{p.weeks[0]}–{p.weeks[1]}</div>
              <div className="mono text-[.66rem] text-mute">{p.from} → {p.to}kg</div>
            </div>
          </AccentCard>
        ))}
      </div>

    </div>
  );
}
