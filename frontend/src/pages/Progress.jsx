import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { PLAN, todayStr } from "../lib/plan";
import { sumMealMacros } from "../lib/nutrition";
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
      <path d={trendD} stroke="#00d4aa" strokeWidth="2.5" fill="none" />
      {data.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.w)} r="2.5" fill="#00d4aa" />)}
      <text x={pad} y={16} fontSize="9" fill="#a1a1a6" fontFamily="'JetBrains Mono', monospace">daily</text>
      <text x={pad + 44} y={16} fontSize="9" fill="#00d4aa" fontFamily="'JetBrains Mono', monospace">7d trend</text>
    </svg>
  );
}

function TodaySummary({ today }) {
  const items = [
    ["kcal", Math.round(today?.totals?.kcal || 0), "text-amber"],
    ["protein", `${Math.round(today?.totals?.protein || 0)}g`, "text-lime"],
    ["weight", today?.log?.weight_kg ? `${Number(today.log.weight_kg).toFixed(1)}kg` : "--", "text-cyan"],
    ["gym", today?.training ? `${today.training.done}/${today.training.total || 16}` : "--", "text-lime"],
    ["football", today?.football ? `${today.football.minutes || 0}m` : "--", "text-amber"]
  ];
  return (
    <AccentCard accent="#00d4aa" className="p-3" contentClassName="pl-2">
      <div className="section-label mt-0 mb-2">today</div>
      <div className="grid grid-cols-5 gap-1">
        {items.map(([label, value, cls]) => (
          <div key={label} className="metric-tile px-1.5 py-2 text-center">
            <div className="metric-label">{label}</div>
            <div className={`metric-value text-[.78rem] ${cls}`}>{value}</div>
          </div>
        ))}
      </div>
    </AccentCard>
  );
}

function WeeklyReviewCard({ review }) {
  if (!review) return null;
  const signalCopy = {
    strong: ["strong week", "text-lime"],
    audit: ["audit week", "text-amber"],
    keep_going: ["collect signal", "text-ink"]
  }[review.signal] || ["collect signal", "text-ink"];
  const weightDelta = review.weight_delta == null ? "--" : `${review.weight_delta > 0 ? "+" : ""}${fmt(review.weight_delta)}kg`;
  const metrics = [
    ["adherence", `${review.adherence_pct ?? "--"}%`],
    ["meal score", `${review.meal_consistency_pct ?? "--"}%`],
    ["avg weight", `${fmt(review.avg_weight)}kg`],
    ["vs last week", weightDelta],
    ["training", `${review.training_done}/${review.training_planned || 0}`],
    ["football", `${review.football_minutes || 0}m`],
    ["protein days", `${review.protein_days ?? 0}/5`],
    ["fast clean", `${review.fast_clean_days ?? 0}/2`]
  ];
  return (
    <AccentCard accent={review.signal === "audit" ? "#d9a441" : "#00d4aa"} className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="section-label mt-0 mb-1">weekly review</div>
          <div className={`font-display text-[1.35rem] leading-none ${signalCopy[1]}`}
            style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
            {signalCopy[0]}
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
    </AccentCard>
  );
}

export default function Progress() {
  const [logs, setLogs] = useState([]);
  const [review, setReview] = useState(null);
  const [today, setToday] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [footballDraft, setFootballDraft] = useState({ minutes: "", kcal: "" });
  const [footballSaving, setFootballSaving] = useState(false);

  const load = async () => {
    const date = todayStr();
    const from = addDays(date, -6);
    const [l, r, meals, log, session, football] = await Promise.all([
      api.get(`/logs?from=${PLAN.startDate}&to=${date}`),
      api.get(`/stats/weekly-review?from=${from}&to=${date}`).catch(() => null),
      api.get(`/meals?date=${date}`).catch(() => []),
      api.get(`/logs/${date}`).catch(() => null),
      api.get(`/training/session?date=${date}`).catch(() => null),
      api.get(`/training/activity?date=${date}&type=football`).catch(() => null)
    ]);
    const totals = sumMealMacros(meals || []);
    const setIds = new Set((session?.sets || []).map((set) => set.exercise_id).filter(Boolean));
    const todayState = {
      totals,
      log,
      training: session ? { done: setIds.size, total: 16 } : null,
      football
    };
    setLogs(l || []);
    setReview(r);
    setToday(todayState);
    setFootballDraft({
      minutes: football?.minutes ? String(football.minutes) : "",
      kcal: football?.kcal ? String(football.kcal) : ""
    });
  };

  useEffect(() => { load(); }, []);

  const latestWeight = [...logs].reverse().find((l) => l.weight_kg != null)?.weight_kg ?? null;
  const lost = latestWeight != null ? Math.max(0, PLAN.startWeight - latestWeight) : 0;
  const left = Math.max(0, (PLAN.startWeight - PLAN.targetWeight) - lost);

  useEffect(() => {
    setWeightInput(latestWeight != null ? String(latestWeight) : "");
  }, [latestWeight]);

  const saveWeight = async () => {
    const n = parseFloat(weightInput);
    if (!Number.isFinite(n) || n <= 0) return;
    await api.put(`/logs/${todayStr()}`, { weight_kg: n });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 700);
    await load();
  };

  const saveFootball = async (event) => {
    event.preventDefault();
    setFootballSaving(true);
    try {
      await api.put("/training/activity", {
        date: todayStr(),
        type: "football",
        minutes: footballDraft.minutes,
        kcal: footballDraft.kcal
      });
      await load();
    } finally {
      setFootballSaving(false);
    }
  };

  return (
    <div className="page page-progress">
      <PageCommand
        accent="#9a9a9a"
        kicker="body data"
        title="Stats"
        metrics={[
          { label: "current", value: <>{latestWeight != null ? latestWeight.toFixed(1) : "--"}<span className="text-mute text-[.62rem] ml-1">kg</span></> },
          { label: "lost", value: <>{lost.toFixed(1)}<span className="text-mute text-[.62rem] ml-1">kg</span></>, className: "text-lime" },
          { label: "left", value: <>{left.toFixed(1)}<span className="text-mute text-[.62rem] ml-1">kg</span></>, className: "text-amber" }
        ]}
      />

      <TodaySummary today={today} />

      <AccentCard as={Link} to="/checkin" accent="#9a9a9a" className="hover:border-line2" contentClassName="pl-2 flex items-center gap-3 w-full">
        <div className="w-10 h-10 rounded-md border border-cyan/40 bg-cyan/[.08] grid place-items-center text-cyan shrink-0">
          <Icon.camera size={19} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="card-title">Photos</div>
          <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em] truncate">timeline</div>
        </div>
        <Icon.chev size={14} className="text-mute shrink-0" />
      </AccentCard>

      <WeeklyReviewCard review={review} />

      <AccentCard accent="#d9a441" className="p-3" contentClassName="pl-2">
        <form className="flex items-end gap-2" onSubmit={saveFootball}>
          <div className="min-w-0 flex-1">
            <div className="section-label mt-0 mb-2">football</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="min-w-0">
                <span className="mono block text-[.55rem] text-mute uppercase tracking-[.12em] mb-1">time</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="600"
                  value={footballDraft.minutes}
                  onChange={(e) => setFootballDraft((prev) => ({ ...prev, minutes: e.target.value }))}
                  className="input mono text-sm"
                  placeholder="min"
                />
              </label>
              <label className="min-w-0">
                <span className="mono block text-[.55rem] text-mute uppercase tracking-[.12em] mb-1">kcal</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="5000"
                  value={footballDraft.kcal}
                  onChange={(e) => setFootballDraft((prev) => ({ ...prev, kcal: e.target.value }))}
                  className="input mono text-sm"
                  placeholder="0"
                />
              </label>
            </div>
          </div>
          <button className="btn-primary shrink-0" type="submit" disabled={footballSaving}>
            {footballSaving ? "..." : "Save"}
          </button>
        </form>
      </AccentCard>

      <AccentCard accent="#00d4aa">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <div className="card-title">Weight</div>
            <div className="mono text-sm text-mute mt-1">
              {latestWeight != null ? `${latestWeight.toFixed(1)}kg` : "--"}
            </div>
          </div>
          <div className="text-right">
            <div className="mono text-sm text-lime tabular-nums">{lost.toFixed(1)}kg</div>
            <div className="text-xs text-mute">lost</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            className="input flex-1 mono text-sm"
            placeholder="kg"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />
          <button className="btn-ghost" onClick={saveWeight}>save</button>
          {savedFlash && <span className="mono text-sm text-signal">saved</span>}
        </div>
      </AccentCard>

      <div className="section-label">Weight chart</div>
      <AccentCard accent="#9a9a9a" className="p-4"><WeightChart logs={logs} /></AccentCard>
    </div>
  );
}
