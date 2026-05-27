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

const MOVEMENT_CUES = {
  chestPressFly: [
    "Schulterblätter hinten unten halten; Brust bleibt hoch.",
    "Drücken: Ellbogen leicht unter Schulterhöhe, nicht ganz durchknallen.",
    "Fly: Arme leicht gebeugt, Bewegung aus der Brust schließen.",
    "Langsam zurücklassen; Gewicht nur so schwer, dass Brust arbeitet."
  ],
  shoulderPressRaise: [
    "Press: Sitz so einstellen, dass Griffe etwa auf Kinn/Ohrenhöhe starten.",
    "Rippen unten halten; kein extremes Hohlkreuz.",
    "Lateral raise: Ellbogen führt, Hände bleiben leicht unter Ellbogen.",
    "Oben kurz halten, kontrolliert senken, nicht schwingen."
  ],
  triceps: [
    "Ellbogen bleiben eng und möglichst fest an einer Position.",
    "Schulter bleibt ruhig; nur Unterarm bewegt sich.",
    "Unten sauber strecken und Trizeps kurz hart anspannen.",
    "Negativ kontrollieren; kein Körpergewicht in den Stack werfen."
  ],
  abCrunch: [
    "Becken ruhig lassen; nicht aus der Hüfte reißen.",
    "Rippen Richtung Becken einrollen, als würdest du Bauch kurz machen.",
    "Ausatmen beim Crunch, oben kurz halten.",
    "Langsam öffnen; Spannung im Bauch nicht komplett verlieren."
  ],
  latPulldown: [
    "Brust hoch, Schulterblätter zuerst nach unten ziehen.",
    "Ellbogen Richtung Hüfte führen, nicht mit Bizeps curlen.",
    "Oben komplett lang werden, aber Schultern nicht an die Ohren fallen lassen.",
    "Unten kurz halten; Rücken fühlen, Griff nicht totquetschen."
  ],
  row: [
    "Brust bleibt stabil; nicht mit Schwung nach hinten lehnen.",
    "Ellbogen nach hinten ziehen und Schulterblätter zusammenführen.",
    "Griff zum unteren Brustkorb/Bauch, je nach Maschine.",
    "Vorne kontrolliert strecken, ohne Rücken rund zu machen."
  ],
  biceps: [
    "Oberarm bleibt fest; Ellbogen wandert nicht nach vorne.",
    "Handgelenk neutral halten, nicht abknicken.",
    "Oben hart anspannen, unten fast ganz strecken.",
    "Kein Schwung; lieber leichter und sauber."
  ],
  backExtension: [
    "Wirbelsäule neutral halten; Bewegung kommt aus Hüfte/Rumpf.",
    "Oben nicht überstrecken, nur bis Körperlinie.",
    "Glutes und unteren Rücken kontrolliert anspannen.",
    "Langsam ablassen; keine schnellen Reps."
  ],
  upperChestPress: [
    "Bank/Sitz so einstellen, dass Druck leicht nach oben läuft.",
    "Brust hoch, Schulterblätter hinten unten fixieren.",
    "Ellbogen nicht zu weit außen; sauber durch die Brust drücken.",
    "Nicht lockout-jagen; Spannung oben halten."
  ],
  backBalance: [
    "Wenn Breite fehlt: Pulldown wählen; wenn Dicke fehlt: Row wählen.",
    "Erste Bewegung immer Schulterblatt, danach Arm.",
    "Rumpf ruhig halten; kein Ziehen mit Schwung.",
    "Letzte Wiederholungen schwer, aber Rücken muss spürbar bleiben."
  ],
  arms: [
    "Trizeps: Ellbogen eng, unten voll strecken.",
    "Bizeps: Oberarm ruhig, kontrolliert curlen.",
    "Kabelzug sauber einstellen, Zuglinie muss angenehm sein.",
    "Als Finisher schwer genug, aber ohne Technikbruch."
  ],
  rearSideDelts: [
    "Reverse: Brust an Pad, Schulterblätter nicht komplett zusammenquetschen.",
    "Arka omuz fühlen; Gewicht nicht mit Rücken reißen.",
    "Lateral: Ellbogen führt seitlich hoch.",
    "Kleine saubere Range ist besser als schweres Schwingen."
  ],
  dipPattern: [
    "Brust leicht hoch, Schulter bleibt tief und stabil.",
    "Ellbogen kontrolliert beugen; nicht unten reinfallen.",
    "Trizeps-Fokus: aufrechter bleiben; Brust-Fokus: leicht vorlehnen.",
    "Unten sauber stoppen, oben stark drücken."
  ]
};

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
      regions: "Göğüs, omuz, arka kol, karın",
      priority: "Önce göğüs + omuz, sonra triceps ve karın.",
      slots: [
        { label: "chest", move: "chest press / butterfly", area: "mid chest / pecs / orta göğüs", choice: "Göğüs: press, pec deck, butterfly veya cable fly olur.", info: "main goal: press or fly for the middle chest. If the press is busy, butterfly/cable fly is fine.", target: "3x10", codes: ["3041", "3016", "5014", "5901", "3014"], cues: MOVEMENT_CUES.chestPressFly },
        { label: "shoulders", move: "shoulder press / lateral raise", area: "front + side delts / ön + yan omuz", choice: "Omuz: press veya lateral raise makinesi olur.", info: "main goal: shoulder cap. Press hits front delts, lateral raise hits side delts.", target: "3x10", codes: ["3043", "5902", "4388", "3050", "4385", "3099"], cues: MOVEMENT_CUES.shoulderPressRaise },
        { label: "triceps", move: "rope pushdown / triceps extension", area: "triceps / arka kol", choice: "Arka kol: cable pushdown, triceps machine veya dip machine olur.", info: "main goal: back arm. On 4012 use high cable rope pushdown, elbows close to the body.", target: "3x10", codes: ["4012", "3011", "4379", "3036", "5104"], cues: MOVEMENT_CUES.triceps },
        { label: "core", move: "total ab / ab crunch", area: "upper abs / üst karın", choice: "Karın: 3008 Total Ab öncelik; 5012 tamir olana kadar bunu kullan.", info: "main goal: controlled crunch for upper abs. Keep hips quiet and curl the rib cage down.", target: "3x10", codes: ["3008", "5012", "3037", "4342N", "4119"], cues: MOVEMENT_CUES.abCrunch }
      ]
    },
    {
      day: "Day 2",
      title: "Pull A",
      focus: "back / biceps / glute support / core",
      regions: "Kanat, orta sırt, ön kol, alt sırt/kalça",
      priority: "Önce sırt genişliği + sırt kalınlığı, sonra biceps ve destek.",
      slots: [
        { label: "lat", move: "lat pulldown", area: "lats / kanat / sırt genişliği", choice: "Kanat: lat pulldown veya high row olur.", info: "main goal: wing width. Pull elbows down, do not turn it into a biceps curl.", target: "3x10", codes: ["3044", "3020", "4116", "5003", "4042", "5908"], cues: MOVEMENT_CUES.latPulldown },
        { label: "row", move: "seated row / t-bar row", area: "mid back / traps / orta sırt", choice: "Orta sırt: seated row, low row veya t-bar row olur.", info: "main goal: middle back thickness. Pull elbows back and squeeze shoulder blades.", target: "3x10", codes: ["3040", "4319", "4018", "4383", "4900", "4016"], cues: MOVEMENT_CUES.row },
        { label: "biceps", move: "biceps curl", area: "biceps / ön kol", choice: "Ön kol: herhangi biceps curl makinesi veya cable curl olur.", info: "main goal: front arm. Optional lighter finisher if biceps are already tired from back work.", target: "3x10", codes: ["3098", "3010", "4355", "4366", "5004", "80CL0009"], cues: MOVEMENT_CUES.biceps },
        { label: "support", move: "glute support / back combo", area: "glutes / alt sırt destek", choice: "5012 bozuksa destek için 3005 veya 4384 seç; lower-back birebir alternatif yok.", info: "main goal: lower back and hip support. Controlled hinge, no swinging.", target: "3x10", codes: ["3005", "4384", "4374", "5012", "3038", "4119", "5002"], cues: MOVEMENT_CUES.backExtension }
      ]
    },
    {
      day: "Day 3",
      title: "Upper B",
      focus: "chest / back / shoulders / arms",
      regions: "Üst göğüs, sırt, omuz, kol",
      priority: "Üst göğüs + sırt denge, sonra omuz ve kol bitiriş.",
      slots: [
        { label: "chest", move: "incline chest press / chest press", area: "upper chest / üst göğüs", choice: "Üst göğüs: incline press öncelik; doluysa normal chest press olur.", info: "main goal: upper chest line. Incline press preferred; normal chest press is okay if needed.", target: "3x10", codes: ["3041", "3016", "5014", "3014", "3097"], cues: MOVEMENT_CUES.upperChestPress },
        { label: "back", move: "row / lat pulldown", area: "lats + mid back / kanat + orta sırt", choice: "Sırt: o gün boş olana göre pulldown veya row seç.", info: "main goal: back balance. Use pulldown for width or row for thickness when gym is busy.", target: "3x10", codes: ["4170", "3044", "3040", "4018", "4383", "4340"], cues: MOVEMENT_CUES.backBalance },
        { label: "shoulders", move: "shoulder press / lateral raise", area: "front + side delts / ön + yan omuz", choice: "Omuz: press, lateral raise veya shoulder/lat combo olur.", info: "main goal: shoulder cap. 3050/lateral raise is a good substitute when press machines are busy.", target: "3x10", codes: ["3043", "5902", "4385", "3050", "5015", "4388"], cues: MOVEMENT_CUES.shoulderPressRaise },
        { label: "arms", move: "rope pushdown / biceps curl", area: "triceps / biceps / arka kol + ön kol", choice: "Kol: triceps veya biceps makinesi/cable; hangi taraf eksikse onu bitir.", info: "main goal: arm finisher. On 4012 use high cable for triceps, low cable for biceps.", target: "3x10", codes: ["4012", "3011", "4379", "4366", "4355", "5104"], cues: MOVEMENT_CUES.arms }
      ]
    },
    {
      day: "Day 4",
      title: "Pull B",
      focus: "back / shoulders / glute support / core",
      regions: "Sırt, arka/yan omuz, alt göğüs-triceps, alt sırt/kalça",
      priority: "Sırt + arka omuz ana iş, destekli dip ile alt göğüs/triceps.",
      slots: [
        { label: "back", move: "row / lat pulldown", area: "lats + mid back / kanat + orta sırt", choice: "Sırt: row, high row veya pulldown; boş olan iyi alternatiftir.", info: "main goal: back width or thickness. Pick the free pull machine and feel the back, not only arms.", target: "3x10", codes: ["3044", "4319", "4018", "4383", "4340", "5003"], cues: MOVEMENT_CUES.backBalance },
        { label: "delts", move: "reverse butterfly / lateral raise", area: "rear + side delts / arka + yan omuz", choice: "Arka/yan omuz: reverse butterfly veya lateral raise olur.", info: "main goal: rear and side shoulder. Reverse butterfly for rear delts, lateral raise for side delts.", target: "3x10", codes: ["5015", "5014", "3043", "3050", "4385", "3099"], cues: MOVEMENT_CUES.rearSideDelts },
        { label: "touch", move: "dip / triceps extension", area: "lower chest / triceps / alt göğüs + arka kol", choice: "Alt göğüs/triceps: destekli dip öncelik; doluysa dip/triceps makinesi.", info: "main goal: dip pattern. 3017 is best here; chest and triceps should both work.", target: "3x10", codes: ["3017", "3036", "5904", "3011", "4379", "3016"], cues: MOVEMENT_CUES.dipPattern },
        { label: "support", move: "glute support / back combo", area: "glutes / alt sırt destek", choice: "5012 bozuksa destek için 3005 veya 4384 seç; lower-back birebir alternatif yok.", info: "main goal: lower back and hip support. Smooth reps, stop before form breaks.", target: "3x10", codes: ["3005", "4384", "4374", "5012", "3038", "4119", "5002"], cues: MOVEMENT_CUES.backExtension }
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
const WEIGHT_MAX = 250;
const WEIGHT_STEP = 5;
const WEIGHT_START = 20;
const MACHINE_SEARCH_LIMIT = 8;

const clampWeight = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(n / WEIGHT_STEP) * WEIGHT_STEP));
};

const formatWeight = (value) => {
  if (!Number.isFinite(value)) return "—";
  return value % 1 === 0 ? `${value.toFixed(0)} kg` : `${value.toFixed(1)} kg`;
};

const machineExerciseId = (machine) => `machine:${machine.id}`;

export default function Training() {
  const [date] = useState(todayStr());
  const week = getWeekNum(date);
  const [session, setSession] = useState(null);
  const [historyByExercise, setHistoryByExercise] = useState({});
  const [weightDrafts, setWeightDrafts] = useState({});
  const [expandedEntryIds, setExpandedEntryIds] = useState(() => new Set());
  const [machineQuery, setMachineQuery] = useState("");
  const [machineWeightInputs, setMachineWeightInputs] = useState({});

  const studioMachines = STUDIO_MACHINES;

  const filteredMachines = useMemo(() => {
    const q = machineQuery.trim().toUpperCase();
    if (!q) return [];
    return studioMachines
      .filter((machine) => (
        machine.code.toUpperCase().includes(q) ||
        machine.name.toUpperCase().includes(q) ||
        machine.series.toUpperCase().includes(q)
      ))
      .slice(0, MACHINE_SEARCH_LIMIT);
  }, [machineQuery, studioMachines]);

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
    () => [...new Set([
      ...planEntries.map((entry) => entry.entryId),
      ...filteredMachines.map(machineExerciseId)
    ])],
    [planEntries, filteredMachines]
  );

  const load = async () => {
    const recent = await api.get(`/training/sessions?date=${date}&day_type=GYM80&until=${date}&limit=14`);
    const recentWithProgress = (recent || []).map((item) => ({ item, progress: sessionProgress(item, planDays) }));
    const todayExisting = (recent || []).find((item) => item.date === date);
    if (todayExisting) {
      setSession(todayExisting);
      return;
    }
    const latestComplete = recentWithProgress.find(({ progress }) => progress.complete);
    const candidates = latestComplete
      ? recentWithProgress.filter(({ item }) =>
          String(item.date).localeCompare(String(latestComplete.item.date)) > 0 ||
          (item.date === latestComplete.item.date && item.id > latestComplete.item.id)
        )
      : recentWithProgress;
    const open = candidates
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
  const progressDone = doneIds.size;
  const progressTotal = planEntries.length;

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
      reps: TARGET_REPS,
      logged_date: date
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
        reps: TARGET_REPS,
        logged_date: date
      });
    }
    setWeightDrafts((prev) => ({ ...prev, [entry.entryId]: clean }));
    load();
  };

  const getEntryWeight = (entry) => {
    return weightDrafts[entry.entryId] ?? sessionWeightByEntry[entry.entryId] ?? historyByExercise[entry.entryId] ?? null;
  };

  const getMachineWeight = (machine) => {
    const id = machineExerciseId(machine);
    return weightDrafts[id] ?? sessionWeightByEntry[id] ?? historyByExercise[id] ?? null;
  };

  const saveMachineWeight = async (machine, nextWeight) => {
    if (!session) return;
    const clean = clampWeight(nextWeight);
    if (clean == null) return;
    const exerciseId = machineExerciseId(machine);
    const existingIds = (session?.sets || [])
      .filter((set) => String(set.exercise_id) === exerciseId)
      .map((set) => set.id);
    if (existingIds.length > 0) {
      await Promise.all(existingIds.map((id) => api.put(`/training/set/${id}`, {
        weight_kg: clean,
        reps: TARGET_REPS
      })));
    } else {
      await api.post(`/training/session/${session.id}/set`, {
        exercise_id: exerciseId,
        exercise_name: `Machine ${machine.code} ${machine.name}`,
        set_number: 1,
        weight_kg: clean,
        reps: TARGET_REPS,
        logged_date: date
      });
    }
    setWeightDrafts((prev) => ({ ...prev, [exerciseId]: clean }));
    setMachineWeightInputs((prev) => ({ ...prev, [exerciseId]: String(clean) }));
    load();
  };

  const stepMachineWeight = async (machine, delta) => {
    const raw = getMachineWeight(machine);
    const current = raw == null ? WEIGHT_START : Number(raw);
    const next = raw == null && delta > 0 ? WEIGHT_START : current + delta;
    await saveMachineWeight(machine, next);
  };

  const toggleEntryDetails = (entryId) => {
    setExpandedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
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
      reps: TARGET_REPS,
      logged_date: date
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
        accent="#00d4aa"
        kicker="gym80"
        title="Training"
        metrics={[
          { label: "done", value: `${progressDone}/${progressTotal}`, className: "text-lime" },
          { label: "cycle", value: allDaysDone ? "done" : "open", className: allDaysDone ? "text-lime" : "text-amber" }
        ]}
      />

      <AccentCard accent="#00d4aa" className="p-3" contentClassName="pl-2">
        <div className="flex items-center gap-2">
          <Icon.scan size={15} className="text-lime shrink-0" />
          <input
            className="input h-10 flex-1 mono text-sm"
            value={machineQuery}
            onChange={(event) => setMachineQuery(event.target.value)}
            placeholder="Makine arama: 3041, 5014, butterfly..."
            inputMode="search"
            autoCapitalize="none"
          />
        </div>
        {filteredMachines.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {filteredMachines.map((machine) => {
              const exerciseId = machineExerciseId(machine);
              const savedWeight = getMachineWeight(machine);
              const inputValue = machineWeightInputs[exerciseId] ?? (savedWeight == null ? "" : String(savedWeight));
              return (
                <div key={machine.id} className="rounded-md border border-line/80 bg-bg/60 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[.72rem] text-ink leading-snug">
                        {machine.code} · {machine.name}
                      </div>
                      <div className="mono text-[.54rem] text-mute uppercase tracking-[.08em] mt-[2px] truncate">
                        {machine.series} · last {formatWeight(savedWeight ?? NaN)}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        className="h-8 w-8 rounded-md border border-line/70 bg-bg/80 text-mute text-sm leading-none"
                        onClick={() => stepMachineWeight(machine, -WEIGHT_STEP)}
                        aria-label="decrease machine weight"
                      >
                        −
                      </button>
                      <input
                        className="h-8 w-[4.2rem] rounded-md border border-line/70 bg-bg/80 px-2 mono text-[.7rem] text-ink text-center tabular-nums"
                        value={inputValue}
                        onChange={(event) => setMachineWeightInputs((prev) => ({ ...prev, [exerciseId]: event.target.value }))}
                        onBlur={(event) => saveMachineWeight(machine, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        inputMode="decimal"
                        aria-label={`${machine.code} weight`}
                      />
                      <button
                        type="button"
                        className="h-8 w-8 rounded-md border border-line/70 bg-bg/80 text-mute text-sm leading-none"
                        onClick={() => stepMachineWeight(machine, WEIGHT_STEP)}
                        aria-label="increase machine weight"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-md border border-line/70 bg-bg/80 grid place-items-center"
                        onClick={() => saveMachineWeight(machine, inputValue)}
                        aria-label="save machine weight"
                      >
                        <Icon.check size={12} className={savedWeight == null ? "text-mute opacity-30" : "text-lime"} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AccentCard>

      <AccentCard accent="#9a9a9a" className="p-3" contentClassName="pl-2 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {planDays.map((day) => (
            <div
              key={day.day}
              className={`rounded-lg border p-2.5 transition-colors duration-200 ${day.machines.length > 0 && day.machines.every(({ entryId }) => doneIds.has(entryId)) ? "border-lime/60 bg-lime/10" : "border-line bg-bg2/70"}`}
            >
              <button type="button" className="w-full text-left" onClick={() => toggleDay(day)}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="mono text-[.6rem] text-cyan uppercase tracking-[.14em]">{day.day} · {day.title}</div>
                    <div className="text-[.68rem] text-ink leading-snug mt-1">{day.regions}</div>
                    <div className="text-[.58rem] text-ink2 leading-snug mt-[2px]">{day.priority}</div>
                    <div className="mono text-[.54rem] text-mute uppercase tracking-[.1em] mt-[2px]">{day.machines.filter(({ entryId }) => doneIds.has(entryId)).length}/{day.machines.length}</div>
                  </div>
                  <Icon.check size={12} className={day.machines.length > 0 && day.machines.every(({ entryId }) => doneIds.has(entryId)) ? "text-lime" : "text-mute opacity-30"} />
                </div>
              </button>
              <div className="mt-2 flex flex-col gap-1.5">
                {day.machines.map((entry) => {
                  const expanded = expandedEntryIds.has(entry.entryId);
                  return (
                    <div
                      key={entry.entryId}
                      className={`rounded-md border px-2.5 py-2 text-left transition-colors duration-200 ${doneIds.has(entry.entryId) ? "border-lime/50 bg-lime/10" : "border-line/80 bg-bg/60 hover:border-signal/50"}`}
                    >
                      <div className="flex items-stretch justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleEntryDetails(entry.entryId)}
                          className="min-w-0 flex-1 text-left"
                          aria-expanded={expanded}
                        >
                          <div className="flex items-start gap-1.5">
                            <Icon.chev size={12} className={`text-mute shrink-0 mt-[2px] transition-transform duration-150 ${expanded ? "rotate-90" : ""}`} />
                            <div className="min-w-0">
                              <div className="text-[.68rem] text-ink text-left leading-snug">
                                {entry.machine.code} · {entry.machine.name}
                              </div>
                              <div className="mono text-[.55rem] text-ink2 uppercase tracking-[.08em] leading-snug mt-1">
                                {entry.move}
                              </div>
                              {entry.choice && (
                                <div className="text-[.58rem] text-ink2 leading-snug mt-[2px]">
                                  {entry.choice}
                                </div>
                              )}
                              <div className="mono text-[.54rem] text-lime uppercase tracking-[.1em] leading-snug mt-[2px]">
                                {entry.area} · {entry.target}
                              </div>
                              <div className="mono text-[.55rem] text-lime uppercase tracking-[.1em] leading-snug mt-[2px]">
                                {formatWeight(getEntryWeight(entry) ?? NaN)}
                              </div>
                              {entry.alternatives?.length > 0 && (
                                <div className="mono text-[.5rem] text-mute uppercase tracking-[.08em] leading-snug mt-[2px] truncate">
                                  alt: {entry.alternatives.map((machine) => machine.code).join(" · ")}
                                </div>
                              )}
                            </div>
                          </div>
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
                          <button
                            type="button"
                            className="h-7 w-7 rounded-md border border-line/70 bg-bg/80 grid place-items-center"
                            onClick={() => toggleMachine(entry)}
                            aria-label="toggle exercise done"
                          >
                            <Icon.check size={12} className={doneIds.has(entry.entryId) ? "text-lime shrink-0" : "text-mute opacity-25 shrink-0"} />
                          </button>
                        </div>
                      </div>
                      {expanded && entry.cues?.length > 0 && (
                        <ul className="mt-2 ml-[18px] border-t border-line/60 pt-2 text-[.62rem] leading-snug text-ink2 space-y-1.5">
                          {entry.cues.map((cue) => (
                            <li key={cue} className="flex gap-2">
                              <span className="mt-[7px] h-1 w-1 rounded-full bg-lime/70 shrink-0" />
                              <span>{cue}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>

      {allDaysDone && (
        <AccentCard accent="#00d4aa" className="p-3" contentClassName="pl-2 flex items-center justify-between gap-3">
          <div className="section-label mt-0 mb-0">all done</div>
          <button className="btn-primary shrink-0" type="button" onClick={resetAll}>
            Reset
          </button>
        </AccentCard>
      )}

      {doneMachines.length > 0 && (
        <AccentCard accent="#00d4aa" className="p-3" contentClassName="pl-2">
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
