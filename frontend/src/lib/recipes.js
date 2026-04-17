// OMAD recipes — single big meal hits the day's kcal target.
// Two modes: OMAD (~1800kcal training-day) and LOW (~1300kcal rest-day, lower carb).
// Style: gluten-free, high-protein, high-fiber, healthy fats. Mediterranean / clean bowl format.
// Whole library complies with: glutenFree, sugarFree (no added sugar), noPork.

export const RECIPE_TAGS = { glutenFree: true, sugarFree: true, noPork: true };

export const RECIPES = [
  // ─── OMAD · ~1800 kcal · 150P / 115C / 75F ───
  {
    id: "omad_chicken_quinoa", mode: "OMAD",
    name: { en: "Chicken Quinoa Power Plate", de: "Hähnchen Quinoa Power-Teller" },
    kcal: 1810, p: 152, c: 118, f: 72,
    ingredients: [
      { item: "chicken_breast", g: 350, cat: "meat" },
      { item: "quinoa_dry",     g: 110, cat: "pantry" },
      { item: "broccoli",       g: 200, cat: "produce" },
      { item: "bell_pepper",    g: 150, cat: "produce" },
      { item: "avocado",        g: 100, cat: "produce" },
      { item: "feta",           g: 50,  cat: "dairy" },
      { item: "olive_oil",      g: 20,  cat: "pantry" },
      { item: "walnuts",        g: 20,  cat: "pantry" },
      { item: "lemon",          g: 30,  cat: "produce" }
    ],
    steps: {
      en: ["Cook quinoa in salted water", "Roast veg with olive oil 18min", "Grill chicken 6min/side, slice", "Plate quinoa + veg + chicken", "Top with avocado, feta, walnuts, lemon"],
      de: ["Quinoa in Salzwasser kochen", "Gemüse mit Olivenöl 18 Min rösten", "Hähnchen 6 Min/Seite grillen, schneiden", "Quinoa + Gemüse + Hähnchen anrichten", "Mit Avocado, Feta, Walnüssen, Zitrone toppen"]
    }
  },
  {
    id: "omad_salmon_sweetpotato", mode: "OMAD",
    name: { en: "Salmon Sweet Potato Bowl", de: "Lachs Süßkartoffel Bowl" },
    kcal: 1790, p: 148, c: 110, f: 78,
    ingredients: [
      { item: "salmon_fillet",  g: 350, cat: "meat" },
      { item: "sweet_potato",   g: 350, cat: "produce" },
      { item: "spinach",        g: 200, cat: "produce" },
      { item: "broccoli",       g: 150, cat: "produce" },
      { item: "avocado",        g: 100, cat: "produce" },
      { item: "olive_oil",      g: 18,  cat: "pantry" },
      { item: "walnuts",        g: 20,  cat: "pantry" },
      { item: "garlic",         g: 10,  cat: "produce" },
      { item: "lemon",          g: 30,  cat: "produce" }
    ],
    steps: {
      en: ["Roast sweet potato cubes 25min", "Steam broccoli", "Wilt spinach with garlic + oil", "Pan salmon 4min/side", "Plate everything, top avocado + walnuts + lemon"],
      de: ["Süßkartoffelwürfel 25 Min rösten", "Brokkoli dämpfen", "Spinat mit Knoblauch + Öl dünsten", "Lachs 4 Min/Seite anbraten", "Alles anrichten, mit Avocado + Walnüssen + Zitrone toppen"]
    }
  },
  {
    id: "omad_turkey_chili", mode: "OMAD",
    name: { en: "Turkey Bean Chili Bowl", de: "Pute Bohnen Chili Bowl" },
    kcal: 1820, p: 158, c: 120, f: 70,
    ingredients: [
      { item: "turkey_ground",  g: 350, cat: "meat" },
      { item: "kidney_beans",   g: 200, cat: "pantry" },
      { item: "tomato_canned",  g: 250, cat: "pantry" },
      { item: "rice_brown_dry", g: 90,  cat: "pantry" },
      { item: "onion",          g: 100, cat: "produce" },
      { item: "bell_pepper",    g: 150, cat: "produce" },
      { item: "avocado",        g: 100, cat: "produce" },
      { item: "olive_oil",      g: 18,  cat: "pantry" },
      { item: "spice_chili",    g: 5,   cat: "pantry" }
    ],
    steps: {
      en: ["Cook brown rice", "Sauté onion + pepper", "Brown turkey", "Add beans + tomato + chili spice", "Simmer 25min", "Serve over rice with avocado"],
      de: ["Vollkornreis kochen", "Zwiebel + Paprika anbraten", "Putenhack scharf anbraten", "Bohnen + Tomate + Chili dazu", "25 Min köcheln", "Über Reis mit Avocado servieren"]
    }
  },
  {
    id: "omad_beef_rice", mode: "OMAD",
    name: { en: "Beef Brown-Rice Bowl", de: "Rind Vollkornreis Bowl" },
    kcal: 1830, p: 155, c: 115, f: 75,
    ingredients: [
      { item: "beef_strips",    g: 320, cat: "meat" },
      { item: "rice_brown_dry", g: 100, cat: "pantry" },
      { item: "broccoli",       g: 200, cat: "produce" },
      { item: "edamame",        g: 100, cat: "produce" },
      { item: "bell_pepper",    g: 120, cat: "produce" },
      { item: "tamari_gf",      g: 20,  cat: "pantry" },
      { item: "sesame_oil",     g: 12,  cat: "pantry" },
      { item: "olive_oil",      g: 10,  cat: "pantry" },
      { item: "garlic",         g: 10,  cat: "produce" }
    ],
    steps: {
      en: ["Cook brown rice", "Stir-fry veg + edamame in olive oil", "Sear beef strips with garlic 3min", "Toss with soy + sesame oil", "Serve over rice"],
      de: ["Vollkornreis kochen", "Gemüse + Edamame in Olivenöl anbraten", "Rinderstreifen mit Knoblauch 3 Min scharf anbraten", "Mit Sojasauce + Sesamöl mischen", "Über Reis servieren"]
    }
  },
  {
    id: "omad_tofu_lentil", mode: "OMAD",
    name: { en: "Tofu Lentil Mediterranean Plate", de: "Tofu Linsen Mediterran-Teller" },
    kcal: 1780, p: 145, c: 122, f: 72,
    ingredients: [
      { item: "tofu_firm",      g: 300, cat: "produce" },
      { item: "lentils_dry",    g: 130, cat: "pantry" },
      { item: "spinach",        g: 200, cat: "produce" },
      { item: "tomato",         g: 200, cat: "produce" },
      { item: "cucumber",       g: 150, cat: "produce" },
      { item: "feta",           g: 60,  cat: "dairy" },
      { item: "olive_oil",      g: 22,  cat: "pantry" },
      { item: "walnuts",        g: 20,  cat: "pantry" },
      { item: "lemon",          g: 30,  cat: "produce" },
      { item: "garlic",         g: 10,  cat: "produce" }
    ],
    steps: {
      en: ["Boil lentils 22min", "Cube + sear tofu with garlic", "Wilt spinach", "Chop tomato + cucumber salad", "Plate lentils + tofu + greens, top feta + walnuts + oil + lemon"],
      de: ["Linsen 22 Min kochen", "Tofu würfeln + mit Knoblauch anbraten", "Spinat dünsten", "Tomate + Gurken-Salat hacken", "Linsen + Tofu + Grünes anrichten, mit Feta + Walnüssen + Öl + Zitrone toppen"]
    }
  },

  // ─── LOW · ~1300 kcal · 130P / 60C / 65F (low-carb rest day) ───
  {
    id: "low_salmon_cauli", mode: "LOW",
    name: { en: "Salmon + Cauliflower Mash", de: "Lachs + Blumenkohlpüree" },
    kcal: 1320, p: 128, c: 55, f: 68,
    ingredients: [
      { item: "salmon_fillet",  g: 320, cat: "meat" },
      { item: "cauliflower",    g: 400, cat: "produce" },
      { item: "spinach",        g: 200, cat: "produce" },
      { item: "avocado",        g: 80,  cat: "produce" },
      { item: "olive_oil",      g: 18,  cat: "pantry" },
      { item: "garlic",         g: 10,  cat: "produce" },
      { item: "lemon",          g: 30,  cat: "produce" },
      { item: "walnuts",        g: 15,  cat: "pantry" }
    ],
    steps: {
      en: ["Steam cauliflower 12min, mash with oil", "Wilt spinach with garlic", "Pan salmon 4min/side", "Plate everything, top avocado + walnuts + lemon"],
      de: ["Blumenkohl 12 Min dämpfen, mit Öl stampfen", "Spinat mit Knoblauch dünsten", "Lachs 4 Min/Seite anbraten", "Alles anrichten, mit Avocado + Walnüssen + Zitrone toppen"]
    }
  },
  {
    id: "low_beef_zoodles", mode: "LOW",
    name: { en: "Beef Zucchini Noodles", de: "Rind Zucchini-Nudeln" },
    kcal: 1290, p: 132, c: 50, f: 65,
    ingredients: [
      { item: "beef_strips",    g: 280, cat: "meat" },
      { item: "zucchini",       g: 400, cat: "produce" },
      { item: "tomato",         g: 200, cat: "produce" },
      { item: "spinach",        g: 100, cat: "produce" },
      { item: "parmesan",       g: 40,  cat: "dairy" },
      { item: "olive_oil",      g: 18,  cat: "pantry" },
      { item: "garlic",         g: 10,  cat: "produce" }
    ],
    steps: {
      en: ["Spiralize zucchini", "Sear beef strips with garlic 3min", "Add tomato + spinach, simmer 5min", "Toss zoodles in pan briefly", "Top parmesan + oil"],
      de: ["Zucchini in Spiralen schneiden", "Rinderstreifen mit Knoblauch 3 Min anbraten", "Tomate + Spinat dazu, 5 Min köcheln", "Zoodles kurz mitschwenken", "Mit Parmesan + Öl toppen"]
    }
  },
  {
    id: "low_chicken_avo_salad", mode: "LOW",
    name: { en: "Big Chicken Avocado Salad", de: "Großer Hähnchen Avocado Salat" },
    kcal: 1310, p: 130, c: 45, f: 72,
    ingredients: [
      { item: "chicken_breast", g: 320, cat: "meat" },
      { item: "avocado",        g: 150, cat: "produce" },
      { item: "salad_mix",      g: 200, cat: "produce" },
      { item: "tomato",         g: 150, cat: "produce" },
      { item: "cucumber",       g: 150, cat: "produce" },
      { item: "feta",           g: 60,  cat: "dairy" },
      { item: "olive_oil",      g: 22,  cat: "pantry" },
      { item: "walnuts",        g: 20,  cat: "pantry" },
      { item: "lemon",          g: 30,  cat: "produce" }
    ],
    steps: {
      en: ["Grill chicken, slice", "Toss greens + tomato + cucumber + avocado", "Add chicken on top", "Crumble feta + walnuts", "Dress with oil + lemon"],
      de: ["Hähnchen grillen, schneiden", "Salat + Tomate + Gurke + Avocado mischen", "Hähnchen darüber geben", "Feta + Walnüsse zerbröseln", "Mit Öl + Zitrone anmachen"]
    }
  },
  {
    id: "low_tuna_egg_plate", mode: "LOW",
    name: { en: "Tuna Egg Mediterranean Plate", de: "Thunfisch Ei Mediterran-Teller" },
    kcal: 1280, p: 135, c: 38, f: 68,
    ingredients: [
      { item: "tuna_can",       g: 250, cat: "pantry" },
      { item: "eggs_whole",     g: 200, cat: "dairy" },
      { item: "avocado",        g: 120, cat: "produce" },
      { item: "salad_mix",      g: 150, cat: "produce" },
      { item: "tomato",         g: 150, cat: "produce" },
      { item: "olive_oil",      g: 20,  cat: "pantry" },
      { item: "feta",           g: 50,  cat: "dairy" },
      { item: "lemon",          g: 30,  cat: "produce" }
    ],
    steps: {
      en: ["Hard-boil eggs 9min, halve", "Drain tuna", "Plate greens + tomato + avocado + tuna + eggs", "Top feta + oil + lemon"],
      de: ["Eier 9 Min hart kochen, halbieren", "Thunfisch abtropfen", "Salat + Tomate + Avocado + Thunfisch + Eier anrichten", "Mit Feta + Öl + Zitrone toppen"]
    }
  }
];

// Ingredient display names (en/de)
export const INGREDIENT_NAMES = {
  skyr_natural:      { en: "Skyr (plain)",       de: "Skyr (natur)" },
  oats_rolled:       { en: "Rolled oats",         de: "Haferflocken" },
  blueberries:       { en: "Blueberries",         de: "Blaubeeren" },
  walnuts:           { en: "Walnuts",             de: "Walnüsse" },
  honey:             { en: "Honey",               de: "Honig" },
  egg_whites:        { en: "Egg whites",          de: "Eiweiß" },
  eggs_whole:        { en: "Whole eggs",          de: "Vollei" },
  spinach:           { en: "Spinach",             de: "Spinat" },
  feta:              { en: "Feta",                de: "Feta" },
  bread_wholegrain:  { en: "Wholegrain bread",    de: "Vollkornbrot" },
  olive_oil:         { en: "Olive oil",           de: "Olivenöl" },
  chicken_breast:    { en: "Chicken breast",      de: "Hähnchenbrust" },
  quinoa_dry:        { en: "Quinoa (dry)",        de: "Quinoa (trocken)" },
  broccoli:          { en: "Broccoli",            de: "Brokkoli" },
  bell_pepper:       { en: "Bell pepper",         de: "Paprika" },
  lemon:             { en: "Lemon",               de: "Zitrone" },
  lentils_dry:       { en: "Lentils (dry)",       de: "Linsen (trocken)" },
  tomato:            { en: "Tomato",              de: "Tomate" },
  cucumber:          { en: "Cucumber",            de: "Gurke" },
  salmon_fillet:     { en: "Salmon fillet",       de: "Lachsfilet" },
  sweet_potato:      { en: "Sweet potato",        de: "Süßkartoffel" },
  turkey_ground:     { en: "Ground turkey",       de: "Putenhack" },
  kidney_beans:      { en: "Kidney beans",        de: "Kidneybohnen" },
  tomato_canned:     { en: "Canned tomato",       de: "Dosentomaten" },
  onion:             { en: "Onion",               de: "Zwiebel" },
  spice_chili:       { en: "Chili spice",         de: "Chili-Gewürz" },
  tofu_firm:         { en: "Firm tofu",           de: "Tofu (fest)" },
  rice_brown_dry:    { en: "Brown rice (dry)",    de: "Vollkornreis (trocken)" },
  edamame:           { en: "Edamame",             de: "Edamame" },
  tamari_gf:         { en: "Tamari (GF soy sauce)", de: "Tamari (GF Sojasauce)" },
  sesame_oil:        { en: "Sesame oil",          de: "Sesamöl" },
  avocado:           { en: "Avocado",             de: "Avocado" },
  salad_mix:         { en: "Salad mix",           de: "Blattsalat-Mix" },
  tuna_can:          { en: "Tuna (canned)",       de: "Thunfisch (Dose)" },
  chickpeas:         { en: "Chickpeas",           de: "Kichererbsen" },
  red_onion:         { en: "Red onion",           de: "Rote Zwiebel" },
  cauliflower:       { en: "Cauliflower",         de: "Blumenkohl" },
  garlic:            { en: "Garlic",              de: "Knoblauch" },
  beef_strips:       { en: "Beef strips",         de: "Rinderstreifen" },
  zucchini:          { en: "Zucchini",            de: "Zucchini" },
  parmesan:          { en: "Parmesan",            de: "Parmesan" }
};

export const CAT_ORDER = ["produce", "meat", "dairy", "bakery", "pantry"];
export const CAT_LABEL = {
  produce: { en: "Produce",   de: "Obst & Gemüse" },
  meat:    { en: "Meat/Fish", de: "Fleisch/Fisch" },
  dairy:   { en: "Dairy",     de: "Milchprodukte" },
  bakery:  { en: "Bakery",    de: "Backwaren" },
  pantry:  { en: "Pantry",    de: "Vorrat" }
};

const dayHash = (dateStr) => {
  let h = 0;
  for (const ch of dateStr) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

// One meal per day (OMAD or LOW). FAST → no meal.
export function getDayRecipes(dateStr, eating) {
  if (eating === "FAST") return [];
  const pool = RECIPES.filter((r) => r.mode === eating);
  if (pool.length === 0) return [];
  return [pool[dayHash(dateStr) % pool.length]];
}

export function buildShoppingList(recipes) {
  const totals = {};
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const k = ing.item;
      if (!totals[k]) totals[k] = { item: k, g: 0, cat: ing.cat };
      totals[k].g += ing.g;
    }
  }
  const grouped = {};
  for (const v of Object.values(totals)) {
    if (!grouped[v.cat]) grouped[v.cat] = [];
    grouped[v.cat].push(v);
  }
  for (const cat of Object.keys(grouped)) grouped[cat].sort((a, b) => b.g - a.g);
  return grouped;
}

export function getWeekRecipes(startDate, weeklyPattern, days = 7) {
  const all = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const dow = d.getDay();
    const eating = weeklyPattern[dow]?.eating;
    all.push(...getDayRecipes(d.toISOString().slice(0, 10), eating));
  }
  return all;
}
