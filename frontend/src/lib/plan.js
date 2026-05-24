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
    supplements: ["magnesium", "d3_k2"]
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
      kcal: 1700,
      protein: 170,
      carbs: 105,
      fat: 65,
      windowStart: "13:00",
      windowEnd:   "22:00",
      mealSplit: {
        mainMeal: { time: "13:00", kcal: 1050, note: "protein + clean carbs before evening gym" },
        postWorkout: { time: "20:45", kcal: 400, protein: 45, note: "whey + skyr, light enough before sleep" }
      }
    },
    OMAD: {
      kcal: 1700,
      protein: 170,
      carbs: 105,
      fat: 65,
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
