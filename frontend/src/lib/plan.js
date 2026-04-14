// Plan definition — mirrors transformation_plan_v2.json (start 2026-04-20)
export const PLAN = {
  startDate: "2026-04-20",
  endDate: "2026-10-19",
  startWeight: 95,
  targetWeight: 72,
  heightCm: 177,
  phases: [
    { id: 1, nameKey: "phase1", weeks: [1, 4],   from: 95, to: 89, color: "#4a9e3f" },
    { id: 2, nameKey: "phase2", weeks: [5, 12],  from: 89, to: 80, color: "#3f8ae0" },
    { id: 3, nameKey: "phase3", weeks: [13, 20], from: 80, to: 74, color: "#e0c93f" },
    { id: 4, nameKey: "phase4", weeks: [21, 26], from: 74, to: 72, color: "#e06c3f" }
  ],
  // Weekly pattern by getDay() (0=Sun..6=Sat). ADF-hybrid.
  weeklyPattern: {
    1: { type: "A",    eating: "IF" },
    2: { type: "rest", eating: "FAST" },
    3: { type: "B",    eating: "IF" },
    4: { type: "rest", eating: "IF_LOW" },
    5: { type: "C",    eating: "IF" },
    6: { type: "rest", eating: "FAST" },
    0: { type: "rest", eating: "IF_LOW" }
  },
  eatingTargets: {
    IF:     { kcal: 1800, protein: 150, carbs: 115, fat: 75 },
    IF_LOW: { kcal: 1300, protein: 130, carbs: 60,  fat: 65 },
    FAST:   { kcal: 0,    protein: 0,   carbs: 0,   fat: 0 }
  },
  training: {
    A: {
      nameKey: "day_a",
      exercises: [
        { id: "bp", name: "Bench Press",     sets: 3, reps: 10 },
        { id: "dr", name: "Dumbbell Row",    sets: 3, reps: 10 },
        { id: "op", name: "Overhead Press",  sets: 3, reps: 8  },
        { id: "lp", name: "Lat Pulldown",    sets: 3, reps: 10 },
        { id: "fp", name: "Face Pull",       sets: 3, reps: 15 },
        { id: "bc", name: "Bicep Curl",      sets: 3, reps: 12 },
        { id: "tp", name: "Tricep Pushdown", sets: 3, reps: 12 }
      ]
    },
    B: {
      nameKey: "day_b",
      exercises: [
        { id: "sq", name: "Squat / Leg Press",  sets: 3, reps: 10 },
        { id: "rd", name: "Romanian Deadlift",  sets: 3, reps: 10 },
        { id: "lc", name: "Leg Curl",           sets: 3, reps: 12 },
        { id: "le", name: "Leg Extension",      sets: 3, reps: 12 },
        { id: "cr", name: "Calf Raise",         sets: 3, reps: 15 },
        { id: "pl", name: "Plank",              sets: 3, reps: 45, unit: "s" }
      ]
    },
    C: {
      nameKey: "day_c",
      exercises: [
        { id: "dl", name: "Deadlift (light)",    sets: 3, reps: 8  },
        { id: "ip", name: "Incline DB Press",    sets: 3, reps: 10 },
        { id: "cw", name: "Cable Row",           sets: 3, reps: 10 },
        { id: "gs", name: "Goblet Squat",        sets: 3, reps: 12 },
        { id: "lr", name: "Lateral Raise",       sets: 3, reps: 15 },
        { id: "cd", name: "Cardio",              sets: 1, reps: 25, unit: "min" }
      ]
    }
  }
};

export const fmtDate = (d) => (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];
export const todayStr = () => fmtDate(new Date());
export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);

export const getWeekNum = (dateStr = todayStr(), startDate = PLAN.startDate) =>
  Math.max(1, Math.floor(daysBetween(startDate, dateStr) / 7) + 1);

export const getPhase = (weekNum) =>
  PLAN.phases.find((p) => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]) || PLAN.phases[PLAN.phases.length - 1];

export const getDayPlan = (dateStr = todayStr()) => {
  const dow = new Date(dateStr).getDay();
  return PLAN.weeklyPattern[dow];
};

export const getEatingTarget = (eating) => PLAN.eatingTargets[eating] || PLAN.eatingTargets.IF_LOW;
