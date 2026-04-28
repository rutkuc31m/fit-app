import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { todayStr, getWeekNum, getExercisesForDay } from "../lib/plan";
import { getCardioProtocol } from "../lib/protocols";
import { EXERCISES, MUSCLE_LABELS } from "../lib/exercises";
import { trainingAdjustment } from "../lib/coaching";
import { AccentCard, Icon, PageCommand } from "../components/ui";

const numberOrNull = (value) => value === "" ? null : Number(value);
const clampNumber = (value, min = 0) => Math.max(min, Number(value) || 0);

const REGION_RULES = [
  {
    id: "chest_push",
    label: "Göğüs / itme",
    short: "Göğüs",
    tone: "#30d158",
    muscles: ["chest", "upper_chest", "shoulders_front", "triceps"],
    match: ["chest", "upper_chest"]
  },
  {
    id: "back_pull",
    label: "Sırt / çekiş",
    short: "Sırt",
    tone: "#64d2ff",
    muscles: ["back", "lats", "rear_delts", "rhomboids", "biceps"],
    match: ["back", "lats", "rhomboids", "rear_delts"]
  },
  {
    id: "shoulders_arms",
    label: "Omuz / kol",
    short: "Omuz-kol",
    tone: "#ff9f0a",
    muscles: ["shoulders", "side_delts", "shoulders_front", "biceps", "triceps", "forearms"],
    match: ["shoulders", "side_delts", "shoulders_front", "biceps", "triceps", "forearms", "rotator_cuff"]
  },
  {
    id: "legs_front",
    label: "Ön bacak",
    short: "Ön bacak",
    tone: "#30d158",
    muscles: ["quads", "glutes", "calves"],
    match: ["quads", "calves"]
  },
  {
    id: "posterior_chain",
    label: "Arka bacak / kalça",
    short: "Arka zincir",
    tone: "#64d2ff",
    muscles: ["hamstrings", "glutes", "lower_back", "entire_posterior_chain"],
    match: ["hamstrings", "glutes", "lower_back", "entire_posterior_chain"]
  },
  {
    id: "core_stability",
    label: "Core / bel stabilitesi",
    short: "Core",
    tone: "#ff9f0a",
    muscles: ["core", "lower_back_stability", "lower_back"],
    match: ["core", "lower_back_stability"]
  },
  {
    id: "cardio",
    label: "Kardiyo",
    short: "Kardiyo",
    tone: "#64d2ff",
    muscles: ["cardiovascular_system", "fat_burn"],
    match: ["cardiovascular_system", "fat_burn"]
  }
];

const TRAINING_DAYS = [
  { type: "A", day: "Pazartesi", accent: "#30d158", label: "upper" },
  { type: "B", day: "Carsamba", accent: "#64d2ff", label: "lower" },
  { type: "C", day: "Cuma", accent: "#ff9f0a", label: "full body" }
];

const muscleLabel = (id, lang) => MUSCLE_LABELS[id]?.[lang] || MUSCLE_LABELS[id]?.tr || MUSCLE_LABELS[id]?.en || id;
const unique = (arr) => [...new Set(arr.filter(Boolean))];

const resolveExerciseLibrary = (ex) => {
  const altId = ex.substituted && EXERCISES[ex.id]?.phase1Alt;
  return EXERCISES[altId || ex.id] || EXERCISES[ex.id] || null;
};

const regionForMuscles = (muscles = []) =>
  REGION_RULES.find((rule) => rule.match.some((m) => muscles.includes(m))) || REGION_RULES[0];

const repTextForGroup = (items = []) => {
  const parts = unique(items.map(({ ex }) => `${ex.reps}${ex.unit || ""}`));
  if (parts.length <= 2) return parts.join(" / ");
  return `${parts[0]}-${parts[parts.length - 1]}`;
};

const buildRegionGroups = (exercises = []) => {
  const map = new Map();
  exercises.forEach((ex) => {
    const lib = resolveExerciseLibrary(ex);
    const muscles = lib?.targetMuscles || [];
    const rule = regionForMuscles(muscles);
    const current = map.get(rule.id) || { ...rule, items: [], muscles: [] };
    current.items.push({ ex, lib, muscles });
    current.muscles = unique([...current.muscles, ...muscles, ...rule.muscles]);
    map.set(rule.id, current);
  });
  return Array.from(map.values()).map((group) => ({
    ...group,
    sets: group.items.reduce((sum, item) => sum + (Number(item.ex.sets) || 0), 0),
    reps: repTextForGroup(group.items),
    phase1Count: group.items.filter((item) => item.ex.substituted || item.lib?.isPhase1Safe).length
  }));
};

function MuscleDiagram({ muscles = [], title = "target area" }) {
  const active = new Set(muscles);
  const is = (...ids) => ids.some((id) => active.has(id));
  const fill = (on) => on ? "#30d158" : "rgba(255,255,255,.08)";
  const stroke = (on) => on ? "#30d158" : "rgba(255,255,255,.22)";
  const glow = (on) => on ? "drop-shadow(0 0 10px rgba(48,209,88,.65))" : "none";

  return (
    <div className="muscle-diagram" aria-label={title}>
      <svg viewBox="0 0 260 360" role="img">
        <text x="68" y="18" className="mono" fontSize="9" fill="#8e8e93">FRONT</text>
        <text x="184" y="18" className="mono" fontSize="9" fill="#8e8e93">BACK</text>

        <g className="body-front">
          <circle cx="78" cy="43" r="16" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.22)" />
          <path d="M58 63 Q78 54 98 63 L105 142 Q78 158 51 142 Z" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.22)" />
          <path d="M52 72 Q32 95 28 143" fill="none" stroke={stroke(is("shoulders", "shoulders_front", "side_delts"))} strokeWidth="12" strokeLinecap="round" style={{ filter: glow(is("shoulders", "shoulders_front", "side_delts")) }} />
          <path d="M104 72 Q124 95 128 143" fill="none" stroke={stroke(is("shoulders", "shoulders_front", "side_delts"))} strokeWidth="12" strokeLinecap="round" style={{ filter: glow(is("shoulders", "shoulders_front", "side_delts")) }} />
          <path d="M31 143 Q36 176 34 204" fill="none" stroke={stroke(is("biceps", "triceps", "forearms"))} strokeWidth="10" strokeLinecap="round" style={{ filter: glow(is("biceps", "triceps", "forearms")) }} />
          <path d="M125 143 Q120 176 122 204" fill="none" stroke={stroke(is("biceps", "triceps", "forearms"))} strokeWidth="10" strokeLinecap="round" style={{ filter: glow(is("biceps", "triceps", "forearms")) }} />
          <path d="M58 75 Q78 64 98 75 L94 103 Q78 112 62 103 Z" fill={fill(is("chest", "upper_chest"))} stroke={stroke(is("chest", "upper_chest"))} style={{ filter: glow(is("chest", "upper_chest")) }} />
          <path d="M64 108 Q78 114 92 108 L95 143 Q78 153 61 143 Z" fill={fill(is("core", "lower_back_stability"))} stroke={stroke(is("core", "lower_back_stability"))} style={{ filter: glow(is("core", "lower_back_stability")) }} />
          <path d="M55 148 Q70 158 76 246 L55 246 Q45 188 55 148 Z" fill={fill(is("quads"))} stroke={stroke(is("quads"))} style={{ filter: glow(is("quads")) }} />
          <path d="M101 148 Q86 158 80 246 L101 246 Q111 188 101 148 Z" fill={fill(is("quads"))} stroke={stroke(is("quads"))} style={{ filter: glow(is("quads")) }} />
          <path d="M58 249 L75 249 L72 326 L57 326 Z" fill={fill(is("calves"))} stroke={stroke(is("calves"))} style={{ filter: glow(is("calves")) }} />
          <path d="M81 249 L98 249 L99 326 L84 326 Z" fill={fill(is("calves"))} stroke={stroke(is("calves"))} style={{ filter: glow(is("calves")) }} />
        </g>

        <g className="body-back">
          <circle cx="190" cy="43" r="16" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.22)" />
          <path d="M170 63 Q190 54 210 63 L217 142 Q190 158 163 142 Z" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.22)" />
          <path d="M164 72 Q144 95 140 143" fill="none" stroke={stroke(is("rear_delts", "rotator_cuff", "shoulders"))} strokeWidth="12" strokeLinecap="round" style={{ filter: glow(is("rear_delts", "rotator_cuff", "shoulders")) }} />
          <path d="M216 72 Q236 95 240 143" fill="none" stroke={stroke(is("rear_delts", "rotator_cuff", "shoulders"))} strokeWidth="12" strokeLinecap="round" style={{ filter: glow(is("rear_delts", "rotator_cuff", "shoulders")) }} />
          <path d="M170 76 Q190 66 210 76 L207 127 Q190 143 173 127 Z" fill={fill(is("back", "lats", "rhomboids", "rear_delts", "entire_posterior_chain"))} stroke={stroke(is("back", "lats", "rhomboids", "rear_delts", "entire_posterior_chain"))} style={{ filter: glow(is("back", "lats", "rhomboids", "rear_delts", "entire_posterior_chain")) }} />
          <path d="M178 130 Q190 138 202 130 L205 150 Q190 158 175 150 Z" fill={fill(is("lower_back", "lower_back_stability", "core"))} stroke={stroke(is("lower_back", "lower_back_stability", "core"))} style={{ filter: glow(is("lower_back", "lower_back_stability", "core")) }} />
          <path d="M170 151 Q190 164 210 151 L208 184 Q190 196 172 184 Z" fill={fill(is("glutes"))} stroke={stroke(is("glutes"))} style={{ filter: glow(is("glutes")) }} />
          <path d="M167 185 Q182 195 187 247 L166 247 Q157 211 167 185 Z" fill={fill(is("hamstrings"))} stroke={stroke(is("hamstrings"))} style={{ filter: glow(is("hamstrings")) }} />
          <path d="M213 185 Q198 195 193 247 L214 247 Q223 211 213 185 Z" fill={fill(is("hamstrings"))} stroke={stroke(is("hamstrings"))} style={{ filter: glow(is("hamstrings")) }} />
          <path d="M170 249 L187 249 L184 326 L169 326 Z" fill={fill(is("calves"))} stroke={stroke(is("calves"))} style={{ filter: glow(is("calves")) }} />
          <path d="M193 249 L210 249 L211 326 L196 326 Z" fill={fill(is("calves"))} stroke={stroke(is("calves"))} style={{ filter: glow(is("calves")) }} />
        </g>
      </svg>
    </div>
  );
}

function RestTimer({ seconds, onClose }) {
  const [left, setLeft] = useState(seconds);
  const firedRef = useRef(false);
  useEffect(() => {
    if (left <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch {}
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; g.gain.value = 0.15;
          o.start(); o.stop(ctx.currentTime + 0.3);
        } catch {}
      }
      return;
    }
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const mm = Math.floor(Math.max(0, left) / 60);
  const ss = Math.max(0, left) % 60;
  const done = left <= 0;
  return (
    <div className="fixed bottom-[76px] left-0 right-0 z-40 px-3 pointer-events-none">
      <AccentCard
        accent={done ? "#30d158" : "#64d2ff"}
        className={`max-w-[680px] mx-auto pointer-events-auto ${done ? "border-lime/60" : ""}`}
        contentClassName="pl-2 flex items-center gap-3 w-full"
        style={done ? { boxShadow: "0 0 24px -4px rgba(48,209,88,.6)" } : {}}
      >
        <div className="relative w-[56px] h-[56px] shrink-0">
          <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="24" stroke="#2c2c2e" strokeWidth="4" fill="none" />
            <circle cx="28" cy="28" r="24" stroke={done ? "#30d158" : "#64d2ff"} strokeWidth="4" fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={(1 - Math.max(0, left) / seconds) * 2 * Math.PI * 24}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`mono text-[.58rem] uppercase tracking-[.2em] ${done ? "text-lime" : "text-cyan"}`}>
            {done ? "rest done" : "rest"}
          </div>
          <div className="font-display text-[1.6rem] text-ink leading-none tabular-nums mt-[2px]"
            style={{ fontVariationSettings: '"SOFT" 40, "opsz" 96', fontWeight: 500 }}>
            {mm}:{String(ss).padStart(2, "0")}
          </div>
        </div>
        <div className="flex gap-1">
          {!done && <button className="btn-icon" onClick={() => setLeft((n) => n + 15)} title="+15s">+15</button>}
          <button className="btn-icon" onClick={onClose} title="close"><Icon.close size={14} /></button>
        </div>
      </AccentCard>
    </div>
  );
}

export default function Training() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "tr").slice(0, 2);
  const [date] = useState(todayStr());
  const week = getWeekNum(date);
  const [selectedDayType, setSelectedDayType] = useState(null);
  const selectedDay = TRAINING_DAYS.find((d) => d.type === selectedDayType) || null;
  const day = useMemo(() => selectedDayType ? getExercisesForDay(selectedDayType, week) : null, [selectedDayType, week]);
  const cardio = useMemo(() => getCardioProtocol(week), [week]);
  const [session, setSession] = useState(null);
  const [recovery, setRecovery] = useState({});
  const [rest, setRest] = useState(null); // { seconds } when active
  const [target, setTarget] = useState(null);
  const adjustment = trainingAdjustment(recovery);

  const mainExercises = day?.exercises?.filter((e) => !e.phase1Only && !e.coreFinisher) || [];
  const coreExercises = day?.exercises?.filter((e) => e.phase1Only || e.coreFinisher) || [];
  const hasPhase1Core = coreExercises.some((e) => e.phase1Only);
  const mainRegions = useMemo(() => buildRegionGroups(mainExercises), [mainExercises]);
  const coreRegions = useMemo(() => buildRegionGroups(coreExercises), [coreExercises]);

  const load = async () => {
    const [s, log] = await Promise.all([
      selectedDayType ? api.get(`/training/session?date=${date}&day_type=${selectedDayType}`) : Promise.resolve(null),
      api.get(`/logs/${date}`).catch(() => null)
    ]);
    setSession(s || null);
    setRecovery({
      energy: log?.energy ?? "",
      hunger: log?.hunger ?? "",
      headache: log?.headache ?? ""
    });
  };
  useEffect(() => { load(); }, [date, selectedDayType]);

  const setsFor = (exId) => (session?.sets || []).filter((s) => s.exercise_id === exId);

  const addSet = async (region) => {
    if (!session) return;
    const existing = setsFor(region.id);
    const lastSet = existing[existing.length - 1];
    const body = {
      exercise_id: region.id,
      exercise_name: region.label,
      set_number: existing.length + 1,
      weight_kg: lastSet?.weight_kg || null,
      reps: lastSet?.reps || Number.parseInt(region.reps, 10) || 10
    };
    await api.post(`/training/session/${session.id}/set`, body);
    load();
  };

  const updateSet = async (s, patch) => {
    await api.put(`/training/set/${s.id}`, {
      weight_kg: Object.hasOwn(patch, "weight_kg") ? patch.weight_kg : (s.weight_kg ?? null),
      reps: Object.hasOwn(patch, "reps") ? patch.reps : (s.reps ?? null)
    });
    load();
  };

  const nudgeSet = (s, field, delta) => {
    const step = field === "weight_kg" ? 2.5 : 1;
    const next = +(clampNumber(s[field]) + (delta * step)).toFixed(1);
    updateSet(s, { [field]: next <= 0 ? null : next });
  };

  const complete = async () => {
    if (!session) return;
    await api.put(`/training/session/${session.id}`, { completed: 1 });
    load();
  };

  const toggleDay = (type) => {
    setSelectedDayType((current) => current === type ? null : type);
    setTarget(null);
    setRest(null);
  };

  const renderRegionCard = (region) => {
    const sets = setsFor(region.id);
    const muscles = unique(region.muscles).map((m) => muscleLabel(m, lang));
    const loggedSets = sets.length;
    const progress = region.sets ? Math.min(100, Math.round((loggedSets / region.sets) * 100)) : 0;

    return (
      <AccentCard key={region.id} accent={region.tone} className="overflow-hidden" contentClassName="pl-2">
        <div className="px-4 py-3 border-b border-line flex justify-between items-baseline gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => setTarget(region)}
            title="target area"
          >
            <div className="text-sm text-ink font-semibold truncate">{region.label}</div>
            <div className="mono text-[.66rem] text-mute uppercase tracking-[.14em] mt-[2px]">
              {region.sets} work sets · {region.reps} reps
            </div>
            {muscles.length > 0 && (
              <div className="mono text-[.58rem] text-ink2 uppercase tracking-[.14em] mt-[3px] truncate">
                {muscles.slice(0, 3).join(" · ")}
              </div>
            )}
            {region.phase1Count > 0 && (
              <div className="mt-1 inline-flex items-center gap-1 mono text-[.55rem] uppercase tracking-[.14em] text-warn bg-warn/10 px-[6px] py-[2px] rounded">
                guided machine area
              </div>
            )}
          </button>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setTarget(region)}
              aria-label="show target area"
              title="show target area"
            >
              <Icon.scan size={15} />
            </button>
            <div className="mono text-[.56rem] text-lime uppercase tracking-[.12em] text-right">
              {loggedSets}/{region.sets} sets
            </div>
          </div>
        </div>

        <button
          type="button"
          className="w-full px-4 py-3 border-b border-line bg-surface2/35 hover:bg-surface2/60 transition text-left"
          onClick={() => setTarget(region)}
        >
          <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 items-center">
            <MuscleDiagram muscles={region.muscles} title={region.label} />
            <div className="min-w-0">
              <div className="mono text-[.58rem] text-mute uppercase tracking-[.18em]">target map</div>
              <div className="text-sm text-ink leading-snug mt-1">{region.short}</div>
              <div className="mono text-[.62rem] text-ink2 leading-snug mt-1">
                Makinede bu bölge yazıyorsa doğru yerdesin. Alet ismine takılma; bölge ve kontrollü tekrar önemli.
              </div>
            </div>
          </div>
        </button>

        <div className="px-4 py-2 border-b border-line bg-bg2/30">
          <div className="meter muscle"><span style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="flex flex-col divide-y divide-line">
          {sets.map((s) => (
            <div key={s.id} className="px-4 py-2 grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <span className="chip chip-muscle w-7 justify-center">{s.set_number}</span>
              <div className="flex items-center gap-1 min-w-0">
                <button type="button" className="h-9 w-8 rounded-md border border-line bg-bg2 text-mute hover:text-ink hover:border-line2" onClick={() => nudgeSet(s, "weight_kg", -1)}>−</button>
                <input key={`${s.id}-weight-${s.weight_kg ?? ""}`} type="number" className="input mono flex-1 min-w-0 text-center px-1" defaultValue={s.weight_kg || ""} placeholder="kg"
                  onBlur={(e) => e.target.value !== String(s.weight_kg || "") && updateSet(s, { weight_kg: numberOrNull(e.target.value) })} />
                <button type="button" className="h-9 w-8 rounded-md border border-line bg-bg2 text-lime hover:border-lime/50" onClick={() => nudgeSet(s, "weight_kg", 1)}>+</button>
              </div>
              <span className="mono text-mute">×</span>
              <div className="flex items-center gap-1 min-w-0">
                <button type="button" className="h-9 w-8 rounded-md border border-line bg-bg2 text-mute hover:text-ink hover:border-line2" onClick={() => nudgeSet(s, "reps", -1)}>−</button>
                <input key={`${s.id}-reps-${s.reps ?? ""}`} type="number" className="input mono flex-1 min-w-0 text-center px-1" defaultValue={s.reps || ""} placeholder="reps"
                  onBlur={(e) => e.target.value !== String(s.reps || "") && updateSet(s, { reps: numberOrNull(e.target.value) })} />
                <button type="button" className="h-9 w-8 rounded-md border border-line bg-bg2 text-lime hover:border-lime/50" onClick={() => nudgeSet(s, "reps", 1)}>+</button>
              </div>
            </div>
          ))}
          <div className="flex divide-x divide-line">
            <button className="flex-1 mono text-xs caps text-amber py-3 hover:bg-surface2 transition flex items-center justify-center gap-2" onClick={() => addSet(region)}>
              <Icon.plus size={14} /> {t("training.add_set")}
            </button>
            <button className="flex-1 mono text-xs caps text-cyan py-3 hover:bg-surface2 transition flex items-center justify-center gap-2" onClick={() => setRest({ seconds: 90, key: Date.now() })}>
              <Icon.clock size={14} /> rest 90s
            </button>
          </div>
        </div>
      </AccentCard>
    );
  };

  return (
    <div className="page page-training">
      <PageCommand
        accent={selectedDay?.accent || "#30d158"}
        kicker="training block"
        title={selectedDay ? `Day ${selectedDay.type} · bölgeler` : "Training overview"}
        sub={selectedDay ? `${t(`training.${day.nameKey}`)} · hedef bölgeye göre çalış · alet ismine takılma` : "A/B/C seç · tekrar basınca kapat · sonra bölgeye göre logla"}
        metrics={[
          { label: "day", value: selectedDay?.type || "pick", className: "text-lime" },
          { label: "week", value: `W${String(week).padStart(2, "0")}` },
          { label: "liss", value: `${cardio?.liss?.durationMin || "--"}min`, className: "text-amber" }
        ]}
      />

      <div className="section-label">
        training overview
      </div>

      <AccentCard accent={selectedDay?.accent || "#30d158"} className="p-4" contentClassName="pl-2 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {TRAINING_DAYS.map((dayOption) => (
            <button
              key={dayOption.type}
              type="button"
              onClick={() => toggleDay(dayOption.type)}
              className={`metric-tile text-left transition ${selectedDayType === dayOption.type ? "border-lime/60 bg-lime/10" : "hover:border-line2"}`}
            >
              <div className="metric-label">{dayOption.day}</div>
              <div className="metric-value text-[.9rem]" style={{ color: dayOption.accent }}>Day {dayOption.type}</div>
              <div className="mono text-[.55rem] text-mute truncate">{dayOption.label}</div>
            </button>
          ))}
        </div>
        {selectedDay ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="card-title">{selectedDay.day} · Day {selectedDay.type}</div>
              <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em] mt-[2px]">
                W{week} · {mainRegions.length} main areas · {coreRegions.length} core areas
              </div>
            </div>
            <button type="button" className="btn-ghost shrink-0" onClick={() => toggleDay(selectedDay.type)}>close</button>
          </div>
        ) : (
          <div className="mono text-[.66rem] text-ink2 leading-snug bg-bg2/70 border border-line rounded-md px-3 py-2">
            Bugünkü otomatik açılmaz. Hangi günü çalışacaksan onu seç; makinedeki bölge yazısına göre ilerle.
          </div>
        )}
      </AccentCard>

      <AccentCard accent={adjustment.tone === "text-cyan" ? "#64d2ff" : adjustment.tone === "text-amber" ? "#ff9f0a" : "#30d158"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`mono text-[.58rem] uppercase tracking-[.18em] ${adjustment.tone}`}>auto-adjust</div>
            <div className="card-title mt-1">{adjustment.label}</div>
            <div className="mono text-[.66rem] text-ink2 leading-snug mt-2">{adjustment.note}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="mono text-[.52rem] text-mute uppercase tracking-[.14em]">recovery</div>
            <div className="mono text-[.72rem] text-ink2 tabular-nums mt-1">
              E{recovery.energy || "-"} · H{recovery.headache || "-"}
            </div>
          </div>
        </div>
      </AccentCard>

      {/* Day C: cardio block on top */}
      {selectedDayType === "C" && cardio && (
        <AccentCard accent="#64d2ff" className="border-cyan/30">
          <div className="flex justify-between items-baseline">
            <div className="card-title text-cyan">{t("cardio.liss_today")}</div>
            <div className="mono text-[.62rem] text-cyan/80 uppercase tracking-[.14em] tabular-nums">{cardio.liss?.durationMin}min · {cardio.liss?.intensity}</div>
          </div>
          {cardio.liss?.notes && <div className="mono text-[.66rem] text-ink2 mt-1">{cardio.liss.notes}</div>}
        </AccentCard>
      )}

      {/* Main regions */}
      {selectedDay && mainRegions.map(renderRegionCard)}

      {/* Core & stability finisher */}
      {selectedDay && coreRegions.length > 0 && (
        <>
          <div className="section-label flex items-center gap-2">
            <span>{t("training_v2.core_stability", "Core & Stability")}</span>
            {hasPhase1Core && (
              <span className="mono text-[.55rem] text-warn uppercase tracking-[.14em] bg-warn/10 px-[6px] py-[1px] rounded">P1</span>
            )}
          </div>
          {coreRegions.map(renderRegionCard)}
        </>
      )}

      {selectedDay && session && (
        <button
          className={session.completed ? "btn" : "btn-primary"}
          onClick={complete}
          disabled={session.completed}>
          {session.completed ? <span className="inline-flex items-center gap-2 justify-center"><Icon.check size={14} /> {t("training.complete")}</span> : t("training.complete")}
        </button>
      )}

      {rest && <RestTimer key={rest.key} seconds={rest.seconds} onClose={() => setRest(null)} />}
      {target && (
        <div className="gif-modal-backdrop" onClick={() => setTarget(null)} role="dialog" aria-modal="true">
          <div className="gif-modal-content gif-modal-focus" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-icon absolute right-3 top-3 z-10"
              onClick={() => setTarget(null)}
              aria-label={t("common.close")}
            >
              <Icon.close size={15} />
            </button>
            <div className="w-full flex items-start justify-between gap-3">
              <div className="min-w-0 pr-11">
                <div className="mono text-[.58rem] text-signal uppercase tracking-[.18em]">target area</div>
                <div className="text-base text-ink font-semibold leading-tight mt-1">{target.label}</div>
                <div className="mono text-[.6rem] text-mute uppercase tracking-[.14em] mt-1">
                  {unique(target.muscles).slice(0, 5).map((m) => muscleLabel(m, lang)).join(" · ")}
                </div>
              </div>
              <div className="mono text-[.62rem] text-amber uppercase tracking-[.14em] shrink-0 mr-10">{target.sets} sets</div>
            </div>
            <div className="target-stage">
              <MuscleDiagram muscles={target.muscles} title={target.label} />
            </div>
            <div className="mono text-[.66rem] text-ink2 leading-snug w-full border border-line rounded-md bg-bg2/70 px-3 py-2">
              Gym makinesinde bu bölgeyi gösteren aleti seç. Kontrollü tekrar, tam hareket aralığı ve son sette 1-3 RIR hedef.
            </div>
            <div className="target-modal-actions">
              <button className="btn w-full" onClick={() => setTarget(null)}>{t("common.close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
