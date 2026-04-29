// Plan definition — mirrors transformation_plan_v2.json (start 2026-04-20)
// v2: OMAD time windows, gluten-free flag, Phase 1 back-safe modifications

export const PLAN = {
  startDate: "2026-04-20",
  endDate: "2026-10-19",
  startWeight: 93,
  targetWeight: 73,
  heightCm: 177,

  // Dietary constraints — applied globally, filter for meals/recipes
  dietary: {
    glutenFree: true,
    sugarFree: true,
    noPork: true,
    supplements: ["magnesium", "b12", "d3_k2", "vegan_omega3"]
  },

  phases: [
    { id: 1, nameKey: "phase1", weeks: [1, 4],   from: 93, to: 88, color: "#ff9f0a" },
    { id: 2, nameKey: "phase2", weeks: [5, 12],  from: 88, to: 80, color: "#ff9f0a" },
    { id: 3, nameKey: "phase3", weeks: [13, 20], from: 80, to: 75, color: "#64d2ff" },
    { id: 4, nameKey: "phase4", weeks: [21, 26], from: 75, to: 73, color: "#30d158" }
  ],

  // Weekly pattern by getDay() (0=Sun..6=Sat). Gym days use split meals; rest days keep fast/OMAD-low structure.
  weeklyPattern: {
    1: { type: "A",    eating: "TRAINING" },
    2: { type: "rest", eating: "FAST" },
    3: { type: "B",    eating: "TRAINING" },
    4: { type: "rest", eating: "LOW" },
    5: { type: "C",    eating: "TRAINING" },
    6: { type: "rest", eating: "FAST" },
    0: { type: "rest", eating: "LOW" }
  },

  // Eating windows & targets
  eatingTargets: {
    TRAINING: {
      kcal: 1800,
      protein: 150,
      carbs: 115,
      fat: 75,
      windowStart: "13:00",
      windowEnd:   "22:00",
      mealSplit: {
        mainMeal: { time: "13:00", kcal: 1000, note: "protein + clean carbs before evening gym" },
        postWorkout: { time: "20:45", kcal: 500, protein: 55, note: "whey + skyr, light enough before sleep" }
      }
    },
    OMAD: {
      kcal: 1800,
      protein: 150,
      carbs: 115,
      fat: 75,
      windowStart: "19:30",
      windowEnd:   "20:45",
      preShake: {
        time: "19:30",
        protein: 25,
        kcal: 120,
        note: "Post-workout whey + water — opens the window"
      }
    },
    LOW: {
      kcal: 1300,
      protein: 130,
      carbs: 60,
      fat: 65,
      windowStart: "18:00",
      windowEnd:   "19:00"
    },
    FAST: {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      allowed: ["water", "black_coffee", "green_tea"],
      optional: ["whey_isolate_1_scoop"]
    }
  },

  // Training split — Phase 1 has back-safe substitutions (see protocols.js)
  training: {
    A: {
      nameKey: "day_a",
      exercises: [
        { id: "bp", name: "Bench Press",     sets: 3, reps: 10,
          phase1Alt: { name: "Chest Press Machine", reason: "guided_stability" } },
        { id: "dr", name: "Dumbbell Row",    sets: 3, reps: 10,
          phase1Alt: { name: "Seated Cable Row", reason: "guided_stability" } },
        { id: "op", name: "Overhead Press",  sets: 3, reps: 8,
          phase1Alt: { name: "Seated Shoulder Press (machine)", reason: "back_safe" } },
        { id: "lp", name: "Lat Pulldown",    sets: 3, reps: 10 },
        { id: "fp", name: "Face Pull",       sets: 3, reps: 15 },
        { id: "bc", name: "Bicep Curl",      sets: 3, reps: 12 },
        { id: "tp", name: "Tricep Pushdown", sets: 3, reps: 12 },
        { id: "db", name: "Dead Bug",        sets: 2, reps: 10, unit: "each",
          coreFinisher: true, reason: "core_stability" }
      ]
    },
    B: {
      nameKey: "day_b",
      exercises: [
        { id: "sq", name: "Squat / Leg Press",  sets: 3, reps: 10,
          phase1Alt: { name: "Leg Press (machine only)", reason: "back_safe" } },
        { id: "rd", name: "Romanian Deadlift",  sets: 3, reps: 10,
          phase1Alt: { name: "Seated Leg Curl", reason: "back_safe" } },
        { id: "lc", name: "Leg Curl",           sets: 3, reps: 12 },
        { id: "le", name: "Leg Extension",      sets: 3, reps: 12 },
        { id: "cr", name: "Calf Raise",         sets: 3, reps: 15 },
        { id: "pl", name: "Plank",              sets: 3, reps: 45, unit: "s",
          coreFinisher: true, reason: "core_stability" },
        { id: "gb", name: "Glute Bridge",       sets: 2, reps: 15,
          coreFinisher: true, reason: "posterior_chain_stability" }
      ]
    },
    C: {
      nameKey: "day_c",
      exercises: [
        { id: "dl", name: "Deadlift (light)",    sets: 3, reps: 8,
          phase1Alt: { name: "Hip Thrust (machine or barbell)", reason: "back_safe" } },
        { id: "ip", name: "Incline DB Press",    sets: 3, reps: 10 },
        { id: "cw", name: "Cable Row",           sets: 3, reps: 10 },
        { id: "gs", name: "Goblet Squat",        sets: 3, reps: 12,
          phase1Alt: { name: "Leg Press (light)", reason: "back_safe" } },
        { id: "lr", name: "Lateral Raise",       sets: 3, reps: 15 },
        { id: "bd", name: "Bird Dog",            sets: 2, reps: 10, unit: "each",
          coreFinisher: true, reason: "core_stability" },
        { id: "cd", name: "Cardio (incline walk)", sets: 1, reps: 20, unit: "min" }
      ]
    }
  }
};

// ─── Helpers ───
const pad2 = (n) => String(n).padStart(2, "0");
const localNoon = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

export const fmtDate = (d) => {
  const date = d instanceof Date ? d : localNoon(d);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};
export const todayStr = () => fmtDate(new Date());
export const daysBetween = (a, b) => Math.round((localNoon(b) - localNoon(a)) / 86400000);

export const getWeekNum = (dateStr = todayStr(), startDate = PLAN.startDate) =>
  Math.max(1, Math.floor(daysBetween(startDate, dateStr) / 7) + 1);

export const getPhase = (weekNum) =>
  PLAN.phases.find((p) => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]) || PLAN.phases[PLAN.phases.length - 1];

export const getDayPlan = (dateStr = todayStr()) => {
  const dow = localNoon(dateStr).getDay();
  return PLAN.weeklyPattern[dow];
};

export const getEatingTarget = (eating) => PLAN.eatingTargets[eating] || PLAN.eatingTargets.LOW;

export const getExercisesForDay = (dayType, weekNum = getWeekNum()) => {
  const day = PLAN.training[dayType];
  if (!day) return null;
  const inPhase1 = weekNum >= PLAN.phases[0].weeks[0] && weekNum <= PLAN.phases[0].weeks[1];
  const exercises = day.exercises
    .filter((ex) => inPhase1 || !ex.phase1Only)
    .map((ex) => {
      if (inPhase1 && ex.phase1Alt) {
        return { ...ex, name: ex.phase1Alt.name, substituted: true, substituteReason: ex.phase1Alt.reason };
      }
      return ex;
    });
  return { ...day, exercises };
};
