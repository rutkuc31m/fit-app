// Piece-countable foods — user enters count, app converts to grams.
// Macros are per-100g. Gram values are rough/average; adjust `amount_g` manually if needed.
// Aligned with recipe library (gluten-free, no pork, low-sugar bias).

export const COMMON_FOODS = [
  // ─── Eggs & dairy ───
  { id: "egg_m",       name: { en: "Egg (M)",         de: "Ei (M)" },         g_per_piece: 55,  kcal_100g: 155, protein_100g: 13,  carbs_100g: 1.1,  fat_100g: 11, cat: "dairy", icon: "egg" },
  { id: "egg_l",       name: { en: "Egg (L)",         de: "Ei (L)" },         g_per_piece: 63,  kcal_100g: 155, protein_100g: 13,  carbs_100g: 1.1,  fat_100g: 11, cat: "dairy", icon: "egg" },
  { id: "cheese_slice",name: { en: "Cheese slice",    de: "Käsescheibe" },    g_per_piece: 25,  kcal_100g: 350, protein_100g: 25,  carbs_100g: 2,    fat_100g: 27, cat: "dairy", icon: "cheese" },
  { id: "feta_cube",   name: { en: "Feta cube",       de: "Feta-Würfel" },    g_per_piece: 30,  kcal_100g: 265, protein_100g: 14,  carbs_100g: 4,    fat_100g: 21, cat: "dairy", icon: "cheese" },

  // ─── Fruit ───
  { id: "banana",      name: { en: "Banana",          de: "Banane" },         g_per_piece: 120, kcal_100g: 89,  protein_100g: 1.1, carbs_100g: 23,   fat_100g: 0.3, cat: "produce", icon: "fruit" },
  { id: "apple",       name: { en: "Apple",           de: "Apfel" },          g_per_piece: 150, kcal_100g: 52,  protein_100g: 0.3, carbs_100g: 14,   fat_100g: 0.2, cat: "produce", icon: "fruit" },
  { id: "pear",        name: { en: "Pear",            de: "Birne" },          g_per_piece: 170, kcal_100g: 57,  protein_100g: 0.4, carbs_100g: 15,   fat_100g: 0.1, cat: "produce", icon: "fruit" },
  { id: "orange",      name: { en: "Orange",          de: "Orange" },         g_per_piece: 180, kcal_100g: 47,  protein_100g: 0.9, carbs_100g: 12,   fat_100g: 0.1, cat: "produce", icon: "fruit" },
  { id: "mandarin",    name: { en: "Mandarin",        de: "Mandarine" },      g_per_piece: 80,  kcal_100g: 53,  protein_100g: 0.8, carbs_100g: 13,   fat_100g: 0.3, cat: "produce", icon: "fruit" },
  { id: "kiwi",        name: { en: "Kiwi",            de: "Kiwi" },           g_per_piece: 75,  kcal_100g: 61,  protein_100g: 1.1, carbs_100g: 15,   fat_100g: 0.5, cat: "produce", icon: "fruit" },
  { id: "avocado",     name: { en: "Avocado",         de: "Avocado" },        g_per_piece: 170, kcal_100g: 160, protein_100g: 2,   carbs_100g: 9,    fat_100g: 15,  cat: "produce", icon: "fruit" },
  { id: "lemon",       name: { en: "Lemon",           de: "Zitrone" },        g_per_piece: 60,  kcal_100g: 29,  protein_100g: 1.1, carbs_100g: 9,    fat_100g: 0.3, cat: "produce", icon: "fruit" },
  { id: "strawberries",name: { en: "Strawberry",      de: "Erdbeere" },       g_per_piece: 15,  kcal_100g: 32,  protein_100g: 0.7, carbs_100g: 7.7,  fat_100g: 0.3, cat: "produce", icon: "fruit" },

  // ─── Veg (countable) ───
  { id: "tomato",      name: { en: "Tomato",          de: "Tomate" },         g_per_piece: 120, kcal_100g: 18,  protein_100g: 0.9, carbs_100g: 3.9,  fat_100g: 0.2, cat: "produce", icon: "veg" },
  { id: "tomato_small",name: { en: "Cherry tomato",   de: "Cocktailtomate" }, g_per_piece: 17,  kcal_100g: 18,  protein_100g: 0.9, carbs_100g: 3.9,  fat_100g: 0.2, cat: "produce", icon: "veg" },
  { id: "cucumber",    name: { en: "Cucumber",        de: "Gurke" },          g_per_piece: 300, kcal_100g: 15,  protein_100g: 0.7, carbs_100g: 3.6,  fat_100g: 0.1, cat: "produce", icon: "veg" },
  { id: "cucumber_small", name: { en: "Small cucumber", de: "Kleine Gurke" }, g_per_piece: 120, kcal_100g: 15,  protein_100g: 0.7, carbs_100g: 3.6,  fat_100g: 0.1, cat: "produce", icon: "veg" },
  { id: "bell_pepper", name: { en: "Bell pepper",     de: "Paprika" },        g_per_piece: 150, kcal_100g: 31,  protein_100g: 1,   carbs_100g: 6,    fat_100g: 0.3, cat: "produce", icon: "veg" },
  { id: "spitz_paprika", name: { en: "Pointed pepper", de: "Spitzpaprika" },  g_per_piece: 100, kcal_100g: 31,  protein_100g: 1,   carbs_100g: 6,    fat_100g: 0.3, cat: "produce", icon: "veg" },
  { id: "onion",       name: { en: "Onion",           de: "Zwiebel" },        g_per_piece: 110, kcal_100g: 40,  protein_100g: 1.1, carbs_100g: 9,    fat_100g: 0.1, cat: "produce", icon: "veg" },
  { id: "garlic_clove",name: { en: "Garlic clove",    de: "Knoblauchzehe" },  g_per_piece: 4,   kcal_100g: 149, protein_100g: 6.4, carbs_100g: 33,   fat_100g: 0.5, cat: "produce", icon: "veg" },
  { id: "carrot",      name: { en: "Carrot",          de: "Karotte" },        g_per_piece: 80,  kcal_100g: 41,  protein_100g: 0.9, carbs_100g: 10,   fat_100g: 0.2, cat: "produce", icon: "veg" },
  { id: "zucchini",    name: { en: "Zucchini",        de: "Zucchini" },       g_per_piece: 200, kcal_100g: 17,  protein_100g: 1.2, carbs_100g: 3.1,  fat_100g: 0.3, cat: "produce", icon: "veg" },
  { id: "corn_cob_small", name: { en: "Small corn cob", de: "Kleiner Maiskolben" }, g_per_piece: 90, kcal_100g: 100, protein_100g: 3.3, carbs_100g: 21.1, fat_100g: 1.3, cat: "produce", icon: "veg" },
  { id: "sweet_potato",name: { en: "Sweet potato",    de: "Süßkartoffel" },   g_per_piece: 200, kcal_100g: 86,  protein_100g: 1.6, carbs_100g: 20,   fat_100g: 0.1, cat: "produce", icon: "veg" },
  { id: "potato",      name: { en: "Potato",          de: "Kartoffel" },      g_per_piece: 150, kcal_100g: 77,  protein_100g: 2,   carbs_100g: 17,   fat_100g: 0.1, cat: "produce", icon: "veg" },

  // ─── Nuts & seeds (handful ~30g, single ~1g) ───
  { id: "walnut_half", name: { en: "Walnut half",     de: "Walnusshälfte" },  g_per_piece: 2,   kcal_100g: 654, protein_100g: 15,  carbs_100g: 14,   fat_100g: 65,  cat: "pantry", icon: "nut" },
  { id: "almond",      name: { en: "Almond",          de: "Mandel" },         g_per_piece: 1.2, kcal_100g: 579, protein_100g: 21,  carbs_100g: 22,   fat_100g: 50,  cat: "pantry", icon: "nut" },
  { id: "nuts_handful",name: { en: "Nuts (handful)",  de: "Nüsse (Handvoll)" },g_per_piece: 30, kcal_100g: 620, protein_100g: 18,  carbs_100g: 18,   fat_100g: 55,  cat: "pantry", icon: "nut" },

  // ─── Protein supplements ───
  { id: "whey_scoop",  name: { en: "Whey scoop",      de: "Whey-Messlöffel" },g_per_piece: 30,  kcal_100g: 400, protein_100g: 75,  carbs_100g: 7,    fat_100g: 6,   cat: "pantry", icon: "scoop" },

  // ─── Canned / ready ───
  { id: "tuna_can",    name: { en: "Tuna can",        de: "Thunfischdose" },  g_per_piece: 130, kcal_100g: 116, protein_100g: 26,  carbs_100g: 0,    fat_100g: 1,   cat: "pantry", icon: "can" },
  { id: "sardine_can", name: { en: "Sardine can",     de: "Sardinendose" },   g_per_piece: 120, kcal_100g: 208, protein_100g: 25,  carbs_100g: 0,    fat_100g: 12,  cat: "pantry", icon: "can" },

  // ─── Dark chocolate square (no added sugar variants exist — fallback 85% cocoa) ───
  { id: "chocolate_square_dark", name: { en: "Dark chocolate square (85%)", de: "Zartbitter-Stück (85%)" }, g_per_piece: 10, kcal_100g: 598, protein_100g: 10, carbs_100g: 19, fat_100g: 50, cat: "pantry", icon: "chocolate" },

  // ─── Olives ───
  { id: "olive",       name: { en: "Olive",           de: "Olive" },          g_per_piece: 5,   kcal_100g: 115, protein_100g: 0.8, carbs_100g: 6,    fat_100g: 11,  cat: "pantry", icon: "fruit" }
];

// Scale preset to a piece count → draft item ready to save
export const scaleByPieces = (food, pieces) => {
  const amount_g = +(food.g_per_piece * pieces).toFixed(1);
  const k = amount_g / 100;
  return {
    name: food.name, // caller picks lang
    amount_g,
    kcal:      +((food.kcal_100g   || 0) * k).toFixed(1),
    protein_g: +((food.protein_100g|| 0) * k).toFixed(1),
    carbs_g:   +((food.carbs_100g  || 0) * k).toFixed(1),
    fat_g:     +((food.fat_100g    || 0) * k).toFixed(1),
    _per100:   { kcal: food.kcal_100g, p: food.protein_100g, c: food.carbs_100g, f: food.fat_100g },
    _pieces:   pieces,
    _pieceFoodId: food.id,
    _gPerPiece: food.g_per_piece
  };
};
