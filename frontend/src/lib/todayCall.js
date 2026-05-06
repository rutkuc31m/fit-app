export const TODAY_CALL_KEY = "fitapp:today-call";

export const FOOD_CHOICES = [
  { id: "FAST", label: "FAST", kcal: 0, protein: 0, carbs: 0, fat: 0, window: null, tone: "#64d2ff", hint: "water / coffee" },
  { id: "LOW", label: "LOW", kcal: 1300, protein: 130, carbs: 60, fat: 65, window: { start: "18:00", end: "19:00" }, tone: "#ff9f0a", hint: "omad low" },
  { id: "OMAD", label: "OMAD", kcal: 1800, protein: 150, carbs: 115, fat: 75, window: { start: "19:30", end: "20:45" }, tone: "#30d158", hint: "one meal" },
  { id: "TRAIN", label: "TRAIN", kcal: 1800, protein: 150, carbs: 115, fat: 75, window: { start: "13:00", end: "22:00" }, tone: "#30d158", hint: "split meal" },
  { id: "CHEAT", label: "CHEAT", kcal: 2200, protein: 140, carbs: 160, fat: 80, window: { start: "18:00", end: "21:00" }, tone: "#ff453a", hint: "free meal" }
];

export const GYM_CHOICES = [
  { id: "REST", label: "REST", hint: "walk only", tone: "#64d2ff" },
  { id: "GYM", label: "GYM", hint: "full session", tone: "#30d158" },
  { id: "LIGHT", label: "LIGHT", hint: "pump / mobility", tone: "#ff9f0a" },
  { id: "CARDIO", label: "CARDIO", hint: "walk / bike", tone: "#bf5af2" },
  { id: "CUSTOM", label: "CUSTOM", hint: "your call", tone: "#64d2ff" }
];

const todayCallKey = (date) => `${TODAY_CALL_KEY}:${date}`;

export const readTodayCallPrefs = (date, fallback = {}) => {
  try {
    const raw = JSON.parse(localStorage.getItem(todayCallKey(date)) || "{}");
    return {
      foodId: raw.foodId || fallback.foodId || "TRAIN",
      gymId: raw.gymId || fallback.gymId || "GYM"
    };
  } catch {
    return {
      foodId: fallback.foodId || "TRAIN",
      gymId: fallback.gymId || "GYM"
    };
  }
};

export const writeTodayCallPrefs = (date, prefs) => {
  try {
    localStorage.setItem(todayCallKey(date), JSON.stringify(prefs));
  } catch {}
};

export const findFoodChoice = (id) => FOOD_CHOICES.find((choice) => choice.id === id) || FOOD_CHOICES[3];
export const findGymChoice = (id) => GYM_CHOICES.find((choice) => choice.id === id) || GYM_CHOICES[1];
