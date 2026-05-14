import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { todayStr, getWeekNum } from "../lib/plan";
import { GYM80_MACHINES } from "../lib/gym80Catalog";
import { AccentCard, Icon, PageCommand } from "../components/ui";

const GYM80_BY_CODE = new Map(GYM80_MACHINES.map((machine) => [machine.code, machine]));

const RAW_STUDIO_CODES = [
  "3041", "3043", "3016", "5014", "3020", "3044", "3098", "3040", "3036", "5012",
  "3010", "3002", "3050", "3011", "3008", "3005", "5011", "3001", "3018", "3017",
  "4366", "4355", "4379", "4383", "4319", "4018", "4385", "3031", "4023", "4012",
  "4170", "4329", "4002", "4374", "4038", "4159n", "4314", "4384", "3031", "5014",
  "3018", "5013"
];

const resolveCode = (raw) => {
  const upper = String(raw || "").trim().toUpperCase();
  if (!upper) return null;
  if (GYM80_BY_CODE.has(upper)) return upper;
  if (GYM80_BY_CODE.has(`${upper}N`)) return `${upper}N`;
  return null;
};

const STUDIO_CODES = new Set(RAW_STUDIO_CODES.map(resolveCode).filter(Boolean));

const STUDIO_MACHINES = GYM80_MACHINES.filter((machine) => STUDIO_CODES.has(machine.code));

function pickMachine(visibleMachines, usedIds, candidateCodes) {
  for (const code of candidateCodes) {
    const machine = visibleMachines.find((item) => item.code === code && !usedIds.has(item.id));
    if (machine) return machine;
  }
  return null;
}

function pickAlternatives(visibleMachines, usedIds, candidateCodes, limit = 3) {
  const found = [];
  for (const code of candidateCodes) {
    const machine = visibleMachines.find((item) => item.code === code && !usedIds.has(item.id) && !found.some((m) => m.id === item.id));
    if (machine) found.push(machine);
    if (found.length >= limit) break;
  }
  return found;
}

function buildPlan(visibleMachines) {
  const sections = [
    {
      day: "Day 1",
      title: "Push A",
      focus: "chest / shoulders / triceps / core",
      slots: [
        { label: "chest", move: "chest press / butterfly", area: "mid chest / pecs", target: "3x10", codes: ["3041", "3016", "5014", "5901", "3014"] },
        { label: "shoulders", move: "shoulder press / lateral raise", area: "front + side delts", target: "3x10", codes: ["3043", "5902", "4388", "3050", "4385", "3099"] },
        { label: "triceps", move: "rope pushdown / triceps extension", area: "triceps", target: "3x10", codes: ["4012", "3011", "4379", "3036", "5104"] },
        { label: "core", move: "ab crunch", area: "upper abs", target: "3x10", codes: ["5012", "3037", "3008", "4342N", "4119"] }
      ]
    },
    {
      day: "Day 2",
      title: "Pull A",
      focus: "back / biceps / glute support / core",
      slots: [
        { label: "lat", move: "lat pulldown", area: "lats / upper back width", target: "3x10", codes: ["3044", "3020", "4116", "5003", "4042", "5908"] },
        { label: "row", move: "seated row / t-bar row", area: "mid back / traps", target: "3x10", codes: ["3040", "4319", "4018", "4383", "4900", "4016"] },
        { label: "biceps", move: "biceps curl", area: "biceps", target: "3x10", codes: ["3098", "3010", "4355", "4366", "5004", "80CL0009"] },
        { label: "support", move: "back extension", area: "lower back / glutes", target: "3x10", codes: ["5012", "3038", "4119", "5002", "4384", "4374", "3005"] }
      ]
    },
    {
      day: "Day 3",
      title: "Upper B",
      focus: "chest / back / shoulders / arms",
      slots: [
        { label: "chest", move: "incline chest press / chest press", area: "upper chest / pecs", target: "3x10", codes: ["3041", "3016", "5014", "3014", "3097"] },
        { label: "back", move: "row / lat pulldown", area: "lats + mid back", target: "3x10", codes: ["4170", "3044", "3040", "4018", "4383", "4340"] },
        { label: "shoulders", move: "shoulder press / lateral raise", area: "front + side delts", target: "3x10", codes: ["3043", "5902", "4385", "3050", "5015", "4388"] },
        { label: "arms", move: "rope pushdown / biceps curl", area: "triceps / biceps", target: "3x10", codes: ["4012", "3011", "4379", "4366", "4355", "5104"] }
      ]
    },
    {
      day: "Day 4",
      title: "Pull B",
      focus: "back / shoulders / glute support / core",
      slots: [
        { label: "back", move: "row / lat pulldown", area: "lats + mid back", target: "3x10", codes: ["3044", "4319", "4018", "4383", "4340", "5003"] },
        { label: "delts", move: "reverse butterfly / lateral raise", area: "rear + side delts", target: "3x10", codes: ["5015", "5014", "3043", "3050", "4385", "3099"] },
        { label: "touch", move: "dip / triceps extension", area: "lower chest / triceps", target: "3x10", codes: ["3017", "3036", "5904", "3011", "4379", "3016"] },
        { label: "support", move: "back extension", area: "lower back / glutes", target: "3x10", codes: ["5012", "3038", "4119", "5002", "4384", "4374", "3005"] }
      ]
    }
  ];

  return sections.map((section) => {
    const usedIds = new Set();
    const machines = section.slots
      .map((slot) => {
        const machine = pickMachine(visibleMachines, usedIds, slot.codes);
        if (!machine) return null;
        usedIds.add(machine.id);
        const alternatives = pickAlternatives(visibleMachines, usedIds, slot.codes.filter((code) => code !== machine.code), 2);
        return {
          ...slot,
          entryId: `${section.day}|${slot.label}|${machine.id}`,
          machine,
          day: section.day,
          alternatives
        };
      })
      .filter(Boolean);
    return { ...section, machines };
  });
}

function buildEntryIndex(planDays) {
  const entries = [];
  const byEntryId = new Map();
  const byMachineId = new Map();
  const byDaySlot = new Map();

  planDays.forEach((day) => {
    day.machines.forEach((entry) => {
      entries.push(entry);
      byEntryId.set(entry.entryId, entry);
      byDaySlot.set(`${entry.day}|${entry.label}`, entry);
      const key = String(entry.machine.id);
      if (!byMachineId.has(key)) byMachineId.set(key, []);
      byMachineId.get(key).push(entry);
    });
  });

  return { entries, byEntryId, byMachineId, byDaySlot };
}

function buildDoneMap(sets = [], planDays = []) {
  const { entries, byEntryId, byMachineId, byDaySlot } = buildEntryIndex(planDays);
  const map = new Map();

  const queueSet = (entryId, setId) => {
    if (!map.has(entryId)) map.set(entryId, []);
    map.get(entryId).push(setId);
  };

  sets.forEach((set) => {
    if (!set.exercise_id) return;
    const exerciseId = String(set.exercise_id);
    if (byEntryId.has(exerciseId)) {
      queueSet(exerciseId, set.id);
      return;
    }
  });

  sets.forEach((set) => {
    if (!set.exercise_id) return;
    const exerciseId = String(set.exercise_id);
    if (byEntryId.has(exerciseId)) return;
    const [day, slot] = exerciseId.split("|");
    const daySlotTarget = byDaySlot.get(`${day}|${slot}`);
    if (daySlotTarget && !map.has(daySlotTarget.entryId)) {
      queueSet(daySlotTarget.entryId, set.id);
      return;
    }
    const candidates = byMachineId.get(exerciseId) || [];
    const target = candidates.find((entry) => !map.has(entry.entryId));
    if (target) queueSet(target.entryId, set.id);
  });

  return { map, entries };
}

function sessionProgress(session, planDays) {
  if (!session?.sets?.length) return { done: 0, total: 0, complete: false };
  const { map, entries } = buildDoneMap(session.sets, planDays);
  const total = entries.length;
  const done = [...map.keys()].length;
  return { done, total, complete: total > 0 && done >= total };
}

const TARGET_REPS = 10;
const WEIGHT_MIN = 0;
const WEIGHT_MAX = 100;
const WEIGHT_STEP = 5;
const WEIGHT_START = 20;

const clampWeight = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(n / WEIGHT_STEP) * WEIGHT_STEP));
};

const formatWeight = (value) => {
  if (!Number.isFinite(value)) return "—";
  return value % 1 === 0 ? `${value.toFixed(0)} kg` : `${value.toFixed(1)} kg`;
};

export default function Training() {
  const [date] = useState(todayStr());
  const week = getWeekNum(date);
  const [session, setSession] = useState(null);
  const [historyByExercise, setHistoryByExercise] = useState({});
  const [weightDrafts, setWeightDrafts] = useState({});

  const studioMachines = STUDIO_MACHINES;

  const planDays = useMemo(() => buildPlan(studioMachines), [studioMachines]);
  const { map: doneSetIdsByEntry, entries: planEntries } = useMemo(
    () => buildDoneMap(session?.sets || [], planDays),
    [session, planDays]
  );
  const doneIds = useMemo(() => new Set([...doneSetIdsByEntry.keys()]), [doneSetIdsByEntry]);
  const sessionSetIds = useMemo(() => (session?.sets || []).map((set) => set.id), [session]);
  const sessionWeightByEntry = useMemo(() => {
    const next = {};
    (session?.sets || []).forEach((set) => {
      if (set.exercise_id && set.weight_kg != null) next[String(set.exercise_id)] = set.weight_kg;
    });
    return next;
  }, [session]);
  const exerciseIds = useMemo(
    () => [...new Set(planEntries.map((entry) => entry.entryId))],
    [planEntries]
  );

  const load = async () => {
    const recent = await api.get(`/training/sessions?date=${date}&day_type=GYM80&until=${date}&limit=14`);
    const todayExisting = (recent || []).find((item) => item.date === date);
    if (todayExisting) {
      setSession(todayExisting);
      return;
    }
    const open = (recent || [])
      .map((item) => ({ item, progress: sessionProgress(item, planDays) }))
      .filter(({ progress }) => progress.done > 0 && !progress.complete)
      .sort((a, b) => String(b.item.date).localeCompare(String(a.item.date)) || (b.item.id - a.item.id));
    if (open[0]?.item) {
      setSession(open[0].item);
      return;
    }
    const s = await api.get(`/training/session?date=${date}&day_type=GYM80`);
    setSession(s || null);
  };

  useEffect(() => {
    load();
  }, [date, planDays]);

  useEffect(() => {
    setWeightDrafts({});
  }, [session?.id]);

  const doneMachines = useMemo(
    () => planEntries.filter((entry) => doneIds.has(entry.entryId)),
    [planEntries, doneIds]
  );

  const allDaysDone = planDays.length > 0 && planDays.every((day) => day.machines.length > 0 && day.machines.every(({ entryId }) => doneIds.has(entryId)));

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      const pairs = await Promise.all(exerciseIds.map(async (exerciseId) => {
        try {
          const rows = await api.get(`/training/exercise/${encodeURIComponent(exerciseId)}/history`);
          const latest = (rows || []).find((row) => row.weight_kg != null);
          return [exerciseId, latest?.weight_kg ?? null];
        } catch {
          return [exerciseId, null];
        }
      }));
      if (cancelled) return;
      const nextHistory = Object.fromEntries(pairs);
      setHistoryByExercise(nextHistory);
    };
    if (exerciseIds.length > 0) loadHistory();
    return () => { cancelled = true; };
  }, [exerciseIds, planEntries]);

  const toggleMachine = async (entry) => {
    if (!session) return;
    const existingIds = doneSetIdsByEntry.get(entry.entryId) || [];
    if (existingIds.length > 0) {
      await Promise.all(existingIds.map((id) => api.del(`/training/set/${id}`)));
      load();
      return;
    }
    const currentWeight = getEntryWeight(entry);
    await api.post(`/training/session/${session.id}/set`, {
      exercise_id: entry.entryId,
      exercise_name: `${entry.day} ${entry.machine.code} ${entry.machine.name}`,
      set_number: 1,
      weight_kg: currentWeight,
      reps: TARGET_REPS
    });
    load();
  };

  const saveWeight = async (entry, nextWeight) => {
    if (!session) return;
    const clean = clampWeight(nextWeight);
    if (clean == null) return;
    const existingIds = doneSetIdsByEntry.get(entry.entryId) || [];
    if (existingIds.length > 0) {
      await Promise.all(existingIds.map((id) => api.put(`/training/set/${id}`, {
        weight_kg: clean,
        reps: TARGET_REPS
      })));
    } else {
      await api.post(`/training/session/${session.id}/set`, {
        exercise_id: entry.entryId,
        exercise_name: `${entry.day} ${entry.machine.code} ${entry.machine.name}`,
        set_number: 1,
        weight_kg: clean,
        reps: TARGET_REPS
      });
    }
    setWeightDrafts((prev) => ({ ...prev, [entry.entryId]: clean }));
    load();
  };

  const getEntryWeight = (entry) => {
    return weightDrafts[entry.entryId] ?? sessionWeightByEntry[entry.entryId] ?? historyByExercise[entry.entryId] ?? null;
  };

  const stepWeight = async (entry, delta) => {
    const raw = getEntryWeight(entry);
    const current = raw == null ? WEIGHT_START : Number(raw);
    const next = raw == null && delta > 0 ? WEIGHT_START : current + delta;
    await saveWeight(entry, next);
  };

  const toggleDay = async (day) => {
    if (!session || day.machines.length === 0) return;
    const complete = day.machines.every(({ entryId }) => doneIds.has(entryId));
    const relevantSetIds = day.machines.flatMap(({ entryId }) => doneSetIdsByEntry.get(entryId) || []);
    if (complete) {
      await Promise.all(relevantSetIds.map((id) => api.del(`/training/set/${id}`)));
      load();
      return;
    }
    const missing = day.machines.filter(({ entryId }) => !doneIds.has(entryId));
    await Promise.all(missing.map((entry) => api.post(`/training/session/${session.id}/set`, {
      exercise_id: entry.entryId,
      exercise_name: `${entry.day} ${entry.machine.code} ${entry.machine.name}`,
      set_number: 1,
      weight_kg: getEntryWeight(entry),
      reps: TARGET_REPS
    })));
    load();
  };

  const resetAll = async () => {
    if (!session) return;
    await Promise.all(sessionSetIds.map((id) => api.del(`/training/set/${id}`)));
    load();
  };

  return (
    <div className="page page-training">
      <PageCommand
        accent="#30d158"
        kicker="gym80 logbook"
        title="Gym plan"
      />

      <AccentCard accent="#64d2ff" className="p-3" contentClassName="pl-2 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {planDays.map((day) => (
            <div
              key={day.day}
              className={`rounded-lg border p-3 transition ${day.machines.length > 0 && day.machines.every(({ entryId }) => doneIds.has(entryId)) ? "border-lime/60 bg-lime/10" : "border-line bg-bg2/70"}`}
            >
              <button type="button" className="w-full text-left" onClick={() => toggleDay(day)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="mono text-[.6rem] text-cyan uppercase tracking-[.14em]">{day.day}</div>
                  <Icon.check size={12} className={day.machines.length > 0 && day.machines.every(({ entryId }) => doneIds.has(entryId)) ? "text-lime" : "text-mute opacity-30"} />
                </div>
              </button>
              <div className="mt-3 flex flex-col gap-1.5">
                {day.machines.map((entry) => (
                  <div
                    key={entry.entryId}
                    className={`flex items-stretch justify-between gap-2 rounded-md border px-2 py-1.5 text-left transition ${doneIds.has(entry.entryId) ? "border-lime/50 bg-lime/10" : "border-line/80 bg-bg/60 hover:border-signal/50"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMachine(entry)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="text-[.62rem] text-ink text-left truncate">
                        {entry.machine.code} · {entry.machine.name}
                      </div>
                      <div className="mono text-[.53rem] text-mute uppercase tracking-[.12em] truncate mt-[1px]">
                        {entry.move} · {entry.area} · {entry.target}
                      </div>
                      <div className="mono text-[.53rem] text-lime uppercase tracking-[.12em] truncate mt-[1px]">
                        {formatWeight(getEntryWeight(entry) ?? NaN)}
                      </div>
                      {entry.alternatives?.length > 0 && (
                        <div className="mono text-[.5rem] text-mute uppercase tracking-[.1em] truncate mt-[1px]">
                          alt: {entry.alternatives.map((machine) => machine.code).join(" · ")}
                        </div>
                      )}
                    </button>
                    <div className="shrink-0 flex items-center gap-1 self-center">
                      <button
                        type="button"
                        className="h-7 w-7 rounded-md border border-line/70 bg-bg/80 text-mute text-sm leading-none"
                        onClick={() => stepWeight(entry, -WEIGHT_STEP)}
                        aria-label="decrease weight"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="min-w-[3.9rem] rounded-md border border-line/70 bg-bg/80 px-2 py-1 mono text-[.62rem] text-ink tabular-nums"
                        onClick={() => toggleMachine(entry)}
                      >
                        {formatWeight(getEntryWeight(entry) ?? NaN)}
                      </button>
                      <button
                        type="button"
                        className="h-7 w-7 rounded-md border border-line/70 bg-bg/80 text-mute text-sm leading-none"
                        onClick={() => stepWeight(entry, WEIGHT_STEP)}
                        aria-label="increase weight"
                      >
                        +
                      </button>
                      <Icon.check size={12} className={doneIds.has(entry.entryId) ? "text-lime shrink-0 ml-1" : "text-mute opacity-25 shrink-0 ml-1"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>

      {allDaysDone && (
        <AccentCard accent="#30d158" className="p-3" contentClassName="pl-2 flex items-center justify-between gap-3">
          <div className="section-label mt-0 mb-0">all done</div>
          <button className="btn-primary shrink-0" type="button" onClick={resetAll}>
            Reset
          </button>
        </AccentCard>
      )}

      {doneMachines.length > 0 && (
        <AccentCard accent="#30d158" className="p-3" contentClassName="pl-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {doneMachines.map((entry) => (
              <button
                key={entry.entryId}
                type="button"
                className="chip chip-muscle shrink-0"
                onClick={() => toggleMachine(entry)}
              >
                <Icon.check size={12} /> {entry.day} {entry.machine.code}
              </button>
            ))}
          </div>
        </AccentCard>
      )}

    </div>
  );
}
