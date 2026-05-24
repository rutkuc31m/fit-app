const n = (value) => Number(value) || 0;

const item = (name, amount_g, kcal, protein_g, carbs_g, fat_g) => ({
  name,
  amount_g,
  kcal,
  protein_g,
  carbs_g,
  fat_g,
  eaten_pct: 100
});

const withTotals = (template) => {
  const parts = template.parts || splitTemplateParts(template.items);
  const items = parts.flatMap((part) => part.items);
  const totals = items.reduce((acc, entry) => {
    acc.kcal += n(entry.kcal);
    acc.protein += n(entry.protein_g);
    acc.carbs += n(entry.carbs_g);
    acc.fat += n(entry.fat_g);
    return acc;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  return { ...template, items, parts: parts.map((part) => ({ ...part, totals: totalsFor(part.items) })), totals };
};

const totalsFor = (items) =>
  items.reduce((acc, entry) => {
    acc.kcal += n(entry.kcal);
    acc.protein += n(entry.protein_g);
    acc.carbs += n(entry.carbs_g);
    acc.fat += n(entry.fat_g);
    return acc;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

const isShakeItem = (entry) =>
  /^(Skyr natur|ON Whey Isolate|Zero Mandelmilch|Beerenmix TK)$/i.test(entry.name);

const splitTemplateParts = (items) => [
  { id: "main", title: "Ana öğün", items: items.filter((entry) => !isShakeItem(entry)) },
  { id: "shake", title: "Shake", items: items.filter(isShakeItem) }
].filter((part) => part.items.length > 0);

export const mealTemplateMarker = (templateId) => `template:${templateId}`;
export const mealTemplatePartMarker = (templateId, partId) => `${mealTemplateMarker(templateId)}:${partId}`;

export const MEAL_TEMPLATES = [
  withTotals({
    id: "potato_chicken",
    title: "Patates + Tavuk",
    type: "potato",
    accent: "#30d158",
    items: [
      item("Kartoffeln gekocht aus 500g roh", 500, 390, 9, 88, 0.5),
      item("Hähnchenbrust", 350, 395.5, 82.3, 0, 6.3),
      item("Fitline Körniger Frischkäse", 200, 164, 25, 6, 4),
      item("Gemüse frei: Paprika / Gurke / Salat", 250, 70, 3, 12, 0.5),
      item("Skyr natur", 300, 192, 33, 12, 0.6),
      item("ON Whey Isolate", 30, 108, 25, 1.2, 0.4),
      item("Zero Mandelmilch", 200, 27, 0.8, 0.2, 2.2),
      item("Beerenmix TK", 150, 75, 1.2, 15, 0.8)
    ]
  }),
  withTotals({
    id: "potato_salmon_egg",
    title: "Patates + Lachs",
    type: "potato",
    accent: "#64d2ff",
    items: [
      item("Kartoffeln gekocht aus 500g roh", 500, 390, 9, 88, 0.5),
      item("Lachsfilet", 250, 420, 50, 0, 18),
      item("Ei M x3", 180, 222, 18.9, 1.2, 15.9),
      item("Fitline Körniger Frischkäse", 200, 164, 25, 6, 4),
      item("Gemüse frei: Paprika / Gurke / Salat", 250, 70, 3, 12, 0.5),
      item("Skyr natur", 400, 256, 44, 16, 0.8),
      item("ON Whey Isolate", 30, 108, 25, 1.2, 0.4),
      item("Zero Mandelmilch", 200, 27, 0.8, 0.2, 2.2),
      item("Beerenmix TK", 150, 75, 1.2, 15, 0.8)
    ]
  }),
  withTotals({
    id: "potato_tuna",
    title: "Patates + Thunfisch",
    type: "potato",
    accent: "#ff9f0a",
    items: [
      item("Kartoffeln gekocht aus 500g roh", 500, 390, 9, 88, 0.5),
      item("Thunfisch", 260, 302, 67.6, 0, 2.6),
      item("Fitline Körniger Frischkäse", 200, 164, 25, 6, 4),
      item("Paprika / Salat / Zwiebel", 250, 70, 3, 12, 0.5),
      item("Senf + Zero Ketchup", 20, 14, 0.5, 1.8, 0.4),
      item("Skyr natur", 150, 96, 16.5, 6, 0.3),
      item("ON Whey Isolate", 60, 216, 50, 2.4, 0.8),
      item("Zero Mandelmilch", 200, 27, 0.8, 0.2, 2.2),
      item("Beerenmix TK", 150, 75, 1.2, 15, 0.8)
    ]
  }),
  withTotals({
    id: "wrap_chicken",
    title: "Wrap + Tavuk",
    type: "wrap",
    accent: "#30d158",
    items: [
      item("Ja! Vollkorn Wraps", 124, 380, 12, 64, 9),
      item("Hähnchenbrust", 350, 395.5, 82.3, 0, 6.3),
      item("Fitline Körniger Frischkäse", 200, 164, 25, 6, 4),
      item("Paprika / Zwiebel / Salat", 250, 70, 3, 12, 0.5),
      item("Senf + Zero Ketchup", 20, 14, 0.5, 1.8, 0.4),
      item("Skyr natur", 300, 192, 33, 12, 0.6),
      item("ON Whey Isolate", 30, 108, 25, 1.2, 0.4),
      item("Zero Mandelmilch", 200, 27, 0.8, 0.2, 2.2),
      item("Beerenmix TK", 150, 75, 1.2, 15, 0.8)
    ]
  }),
  withTotals({
    id: "wrap_rinderhack",
    title: "Wrap + Hack",
    type: "wrap",
    accent: "#ff453a",
    items: [
      item("Ja! Vollkorn Wraps", 124, 380, 12, 64, 9),
      item("REWE Bio Rinderhack 11%", 350, 616, 66.5, 0, 38.5),
      item("Skyr natur Sauce", 400, 256, 44, 16, 0.8),
      item("Paprika / Zwiebel / Salat", 250, 70, 3, 12, 0.5),
      item("Senf + Zero Ketchup", 20, 14, 0.5, 1.8, 0.4),
      item("ON Whey Isolate", 60, 216, 50, 2.4, 0.8),
      item("Zero Mandelmilch", 200, 27, 0.8, 0.2, 2.2)
    ]
  }),
  withTotals({
    id: "rice_chicken",
    title: "Reis + Tavuk",
    type: "rice",
    accent: "#30d158",
    items: [
      item("Reis gekocht aus 80g roh", 240, 280, 6, 62, 0.6),
      item("Hähnchenbrust", 350, 395.5, 82.3, 0, 6.3),
      item("Fitline Körniger Frischkäse", 200, 164, 25, 6, 4),
      item("Paprika / Zwiebel / Salat", 250, 70, 3, 12, 0.5),
      item("Olivenöl", 10, 90, 0, 0, 10),
      item("Skyr natur", 300, 192, 33, 12, 0.6),
      item("ON Whey Isolate", 30, 108, 25, 1.2, 0.4),
      item("Zero Mandelmilch", 200, 27, 0.8, 0.2, 2.2),
      item("Beerenmix TK", 150, 75, 1.2, 15, 0.8)
    ]
  })
];
