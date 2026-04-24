export const eatenPct = (item) => {
  const pct = Number(item?.eaten_pct);
  return Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 100;
};

export const eatenFactor = (item) => eatenPct(item) / 100;

export const effectiveMacro = (item, key) => (Number(item?.[key]) || 0) * eatenFactor(item);

export const effectiveMacros = (item) => ({
  kcal: effectiveMacro(item, "kcal"),
  protein_g: effectiveMacro(item, "protein_g"),
  carbs_g: effectiveMacro(item, "carbs_g"),
  fat_g: effectiveMacro(item, "fat_g")
});

export const sumMealMacros = (meals = []) => meals.reduce((acc, meal) => {
  (meal.items || []).forEach((item) => {
    acc.kcal += effectiveMacro(item, "kcal");
    acc.protein += effectiveMacro(item, "protein_g");
    acc.carbs += effectiveMacro(item, "carbs_g");
    acc.fat += effectiveMacro(item, "fat_g");
  });
  return acc;
}, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
