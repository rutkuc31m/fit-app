// Curated high-protein, high-fiber, healthy-fat recipes
// Macros are approximate per serving as listed.

export const RECIPES = [
  // ─── IF · BREAKFAST (~500kcal · 35P/45C/18F) ───
  {
    id: "skyr_bowl", mode: "IF", slot: "breakfast",
    name: { en: "Skyr Power Bowl", de: "Skyr Power Bowl" },
    kcal: 480, p: 38, c: 52, f: 14,
    ingredients: [
      { item: "skyr_natural", g: 250, cat: "dairy" },
      { item: "oats_rolled",  g: 40,  cat: "pantry" },
      { item: "blueberries",  g: 80,  cat: "produce" },
      { item: "walnuts",      g: 15,  cat: "pantry" },
      { item: "honey",        g: 10,  cat: "pantry" }
    ],
    steps: { en: ["Mix skyr + oats", "Top with berries, walnuts, honey"], de: ["Skyr + Haferflocken mischen", "Mit Beeren, Walnüssen und Honig toppen"] }
  },
  {
    id: "egg_white_omelette", mode: "IF", slot: "breakfast",
    name: { en: "Egg White Veggie Omelette", de: "Eiweiß-Gemüse-Omelett" },
    kcal: 510, p: 42, c: 38, f: 20,
    ingredients: [
      { item: "egg_whites",     g: 200, cat: "dairy" },
      { item: "eggs_whole",     g: 100, cat: "dairy" },
      { item: "spinach",        g: 80,  cat: "produce" },
      { item: "feta",           g: 40,  cat: "dairy" },
      { item: "bread_wholegrain", g: 60, cat: "bakery" },
      { item: "olive_oil",      g: 8,   cat: "pantry" }
    ],
    steps: { en: ["Sauté spinach", "Pour egg mix", "Crumble feta", "Serve with toast"], de: ["Spinat anbraten", "Eimasse darüber gießen", "Feta zerbröseln", "Mit Toast servieren"] }
  },

  // ─── IF · LUNCH (~700kcal · 55P/55C/25F) ───
  {
    id: "chicken_quinoa", mode: "IF", slot: "lunch",
    name: { en: "Chicken Quinoa Bowl", de: "Hähnchen Quinoa Bowl" },
    kcal: 720, p: 58, c: 60, f: 22,
    ingredients: [
      { item: "chicken_breast", g: 180, cat: "meat" },
      { item: "quinoa_dry",     g: 70,  cat: "pantry" },
      { item: "broccoli",       g: 150, cat: "produce" },
      { item: "bell_pepper",    g: 100, cat: "produce" },
      { item: "olive_oil",      g: 12,  cat: "pantry" },
      { item: "lemon",          g: 30,  cat: "produce" }
    ],
    steps: { en: ["Cook quinoa", "Roast veg with oil", "Grill chicken", "Combine + lemon"], de: ["Quinoa kochen", "Gemüse mit Öl rösten", "Hähnchen grillen", "Vermengen + Zitrone"] }
  },
  {
    id: "lentil_feta", mode: "IF", slot: "lunch",
    name: { en: "Lentil Feta Bowl", de: "Linsen Feta Bowl" },
    kcal: 690, p: 50, c: 70, f: 20,
    ingredients: [
      { item: "lentils_dry",    g: 90,  cat: "pantry" },
      { item: "chicken_breast", g: 120, cat: "meat" },
      { item: "feta",           g: 60,  cat: "dairy" },
      { item: "tomato",         g: 150, cat: "produce" },
      { item: "cucumber",       g: 100, cat: "produce" },
      { item: "olive_oil",      g: 10,  cat: "pantry" }
    ],
    steps: { en: ["Boil lentils", "Pan chicken", "Toss with veg + feta + oil"], de: ["Linsen kochen", "Hähnchen in Pfanne braten", "Mit Gemüse, Feta und Öl mischen"] }
  },

  // ─── IF · DINNER (~600kcal · 50P/35C/30F) ───
  {
    id: "salmon_sweetpotato", mode: "IF", slot: "dinner",
    name: { en: "Salmon + Sweet Potato", de: "Lachs + Süßkartoffel" },
    kcal: 620, p: 48, c: 42, f: 28,
    ingredients: [
      { item: "salmon_fillet",  g: 180, cat: "meat" },
      { item: "sweet_potato",   g: 200, cat: "produce" },
      { item: "broccoli",       g: 150, cat: "produce" },
      { item: "olive_oil",      g: 10,  cat: "pantry" }
    ],
    steps: { en: ["Roast sweet potato", "Steam broccoli", "Pan salmon 4min/side"], de: ["Süßkartoffel rösten", "Brokkoli dämpfen", "Lachs 4 Min/Seite anbraten"] }
  },
  {
    id: "turkey_chili", mode: "IF", slot: "dinner",
    name: { en: "Turkey Bean Chili", de: "Pute Bohnen Chili" },
    kcal: 580, p: 52, c: 48, f: 18,
    ingredients: [
      { item: "turkey_ground",  g: 180, cat: "meat" },
      { item: "kidney_beans",   g: 150, cat: "pantry" },
      { item: "tomato_canned",  g: 200, cat: "pantry" },
      { item: "onion",          g: 80,  cat: "produce" },
      { item: "olive_oil",      g: 8,   cat: "pantry" },
      { item: "spice_chili",    g: 5,   cat: "pantry" }
    ],
    steps: { en: ["Sauté onion", "Brown turkey", "Add beans + tomato + spice", "Simmer 20min"], de: ["Zwiebel anbraten", "Putenhack scharf anbraten", "Bohnen + Tomate + Gewürz dazu", "20 Min köcheln"] }
  },
  {
    id: "tofu_stirfry", mode: "IF", slot: "dinner",
    name: { en: "Tofu Brown-Rice Stir-fry", de: "Tofu Vollkornreis Pfanne" },
    kcal: 610, p: 38, c: 60, f: 22,
    ingredients: [
      { item: "tofu_firm",      g: 200, cat: "produce" },
      { item: "rice_brown_dry", g: 70,  cat: "pantry" },
      { item: "bell_pepper",    g: 120, cat: "produce" },
      { item: "edamame",        g: 80,  cat: "produce" },
      { item: "soy_sauce",      g: 15,  cat: "pantry" },
      { item: "sesame_oil",     g: 10,  cat: "pantry" }
    ],
    steps: { en: ["Cook rice", "Cube + sear tofu", "Stir-fry veg + edamame", "Toss with soy + oil"], de: ["Reis kochen", "Tofu würfeln + scharf anbraten", "Gemüse + Edamame anbraten", "Mit Sojasauce + Öl mischen"] }
  },

  // ─── IF_LOW · LUNCH (~600kcal · 60P/25C/30F) ───
  {
    id: "chicken_salad_avocado", mode: "IF_LOW", slot: "lunch",
    name: { en: "Chicken Avocado Salad", de: "Hähnchen Avocado Salat" },
    kcal: 590, p: 55, c: 22, f: 32,
    ingredients: [
      { item: "chicken_breast", g: 180, cat: "meat" },
      { item: "avocado",        g: 100, cat: "produce" },
      { item: "salad_mix",      g: 120, cat: "produce" },
      { item: "tomato",         g: 100, cat: "produce" },
      { item: "olive_oil",      g: 12,  cat: "pantry" },
      { item: "lemon",          g: 20,  cat: "produce" }
    ],
    steps: { en: ["Grill chicken", "Toss greens + avocado + tomato", "Dress oil + lemon"], de: ["Hähnchen grillen", "Salat + Avocado + Tomate mischen", "Mit Öl + Zitrone anmachen"] }
  },
  {
    id: "tuna_chickpea", mode: "IF_LOW", slot: "lunch",
    name: { en: "Tuna Chickpea Plate", de: "Thunfisch Kichererbsen" },
    kcal: 560, p: 58, c: 35, f: 22,
    ingredients: [
      { item: "tuna_can",       g: 160, cat: "pantry" },
      { item: "chickpeas",      g: 120, cat: "pantry" },
      { item: "cucumber",       g: 120, cat: "produce" },
      { item: "red_onion",      g: 30,  cat: "produce" },
      { item: "olive_oil",      g: 10,  cat: "pantry" }
    ],
    steps: { en: ["Drain tuna + chickpeas", "Chop veg", "Mix + drizzle oil"], de: ["Thunfisch + Kichererbsen abtropfen", "Gemüse hacken", "Mischen + mit Öl beträufeln"] }
  },

  // ─── IF_LOW · DINNER (~700kcal · 70P/35C/35F) ───
  {
    id: "salmon_cauli", mode: "IF_LOW", slot: "dinner",
    name: { en: "Salmon + Cauliflower Mash", de: "Lachs + Blumenkohlpüree" },
    kcal: 680, p: 62, c: 28, f: 38,
    ingredients: [
      { item: "salmon_fillet",  g: 220, cat: "meat" },
      { item: "cauliflower",    g: 300, cat: "produce" },
      { item: "spinach",        g: 100, cat: "produce" },
      { item: "olive_oil",      g: 12,  cat: "pantry" },
      { item: "garlic",         g: 10,  cat: "produce" }
    ],
    steps: { en: ["Steam + mash cauli", "Wilt spinach with garlic", "Pan salmon 4min/side"], de: ["Blumenkohl dämpfen + stampfen", "Spinat mit Knoblauch dünsten", "Lachs 4 Min/Seite anbraten"] }
  },
  {
    id: "beef_zoodles", mode: "IF_LOW", slot: "dinner",
    name: { en: "Beef Zucchini Noodles", de: "Rind Zucchini-Nudeln" },
    kcal: 720, p: 65, c: 30, f: 38,
    ingredients: [
      { item: "beef_strips",    g: 200, cat: "meat" },
      { item: "zucchini",       g: 350, cat: "produce" },
      { item: "tomato",         g: 150, cat: "produce" },
      { item: "olive_oil",      g: 12,  cat: "pantry" },
      { item: "parmesan",       g: 25,  cat: "dairy" }
    ],
    steps: { en: ["Spiralize zucchini", "Sear beef strips", "Combine with tomato", "Top parmesan"], de: ["Zucchini in Spiralen schneiden", "Rinderstreifen scharf anbraten", "Mit Tomate vermengen", "Mit Parmesan toppen"] }
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
  soy_sauce:         { en: "Soy sauce",           de: "Sojasauce" },
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
  produce: { en: "Produce",  de: "Obst & Gemüse" },
  meat:    { en: "Meat/Fish", de: "Fleisch/Fisch" },
  dairy:   { en: "Dairy",    de: "Milchprodukte" },
  bakery:  { en: "Bakery",   de: "Backwaren" },
  pantry:  { en: "Pantry",   de: "Vorrat" }
};

const dayHash = (dateStr) => {
  let h = 0;
  for (const ch of dateStr) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

const pickFromPool = (pool, dateStr, salt) =>
  pool.length === 0 ? null : pool[(dayHash(dateStr + salt)) % pool.length];

// Get day's recipe set based on eating mode (deterministic by date)
export function getDayRecipes(dateStr, eating) {
  if (eating === "FAST") return [];
  const slots = eating === "IF" ? ["breakfast", "lunch", "dinner"] : ["lunch", "dinner"];
  return slots.map((slot) => {
    const pool = RECIPES.filter((r) => r.mode === eating && r.slot === slot);
    return pickFromPool(pool, dateStr, slot);
  }).filter(Boolean);
}

// Aggregate ingredients across a list of recipes → grouped by cat
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

// Get all recipes for the next N days starting from dateStr (using weeklyPattern)
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
