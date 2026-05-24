export const TODAY_CALL_KEY = "fitapp:today-call";

export const FOOD_CHOICES = [
  { id: "FAST", label: "FAST", kcal: 0, protein: 0, carbs: 0, fat: 0, window: null, tone: "#9a9a9a", hint: "water / coffee" },
  { id: "TRAIN", label: "TRAIN", kcal: 1700, protein: 170, carbs: 105, fat: 65, window: { start: "13:00", end: "22:00" }, tone: "#00d4aa", hint: "split meal" },
  { id: "CHEAT", label: "CHEAT", kcal: 2200, protein: 140, carbs: 160, fat: 80, window: { start: "18:00", end: "21:00" }, tone: "#ff453a", hint: "free meal" }
];

export const GYM_CHOICES = [
  { id: "REST", label: "REST", hint: "walk only", tone: "#9a9a9a" },
  { id: "GYM", label: "GYM", hint: "full session", tone: "#00d4aa" },
  { id: "CARDIO", label: "CARDIO", hint: "walk / bike", tone: "#bf5af2" }
];

const todayCallKey = (date) => `${TODAY_CALL_KEY}:${date}`;

const normalizeFoodId = (id) => {
  if (id === "LOW" || id === "OMAD") return "TRAIN";
  return id;
};

const normalizeGymId = (id) => {
  if (id === "LIGHT" || id === "CUSTOM") return "GYM";
  return id;
};

export const readTodayCallPrefs = (date, fallback = {}) => {
  try {
    const raw = JSON.parse(localStorage.getItem(todayCallKey(date)) || "{}");
    return {
      foodId: normalizeFoodId(raw.foodId || fallback.foodId || "TRAIN"),
      gymId: normalizeGymId(raw.gymId || fallback.gymId || "GYM")
    };
  } catch {
    return {
      foodId: normalizeFoodId(fallback.foodId || "TRAIN"),
      gymId: normalizeGymId(fallback.gymId || "GYM")
    };
  }
};

export const writeTodayCallPrefs = (date, prefs) => {
  try {
    localStorage.setItem(todayCallKey(date), JSON.stringify({
      foodId: normalizeFoodId(prefs?.foodId),
      gymId: normalizeGymId(prefs?.gymId)
    }));
  } catch {}
};

export const findFoodChoice = (id) => FOOD_CHOICES.find((choice) => choice.id === normalizeFoodId(id)) || FOOD_CHOICES[1];
export const findGymChoice = (id) => GYM_CHOICES.find((choice) => choice.id === normalizeGymId(id)) || GYM_CHOICES[1];
