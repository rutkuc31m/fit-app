// Exercise library — video references, muscle groups, form tips
// Each exercise has:
// - YouTube search terms (English + German for gym staff communication)
// - Target muscles
// - Form cues
// - Common mistakes
// - Beginner alternatives
// Integrate into app as a lookup: EXERCISES[id]

export const EXERCISES = {
  // ─── GÜN A — ÜST VÜCUT ───
  bp: {
    id: "bp",
    name: { en: "Bench Press", de: "Bankdrücken", tr: "Bench Press (Barbell ile Göğüs Press)" },
    gifPath: "/gifs/bp.gif",
    targetMuscles: ["chest", "shoulders_front", "triceps"],
    equipment: "barbell_or_dumbbells",
    videoSearch: {
      en: "bench press proper form beginner",
      de: "Bankdrücken richtig ausführen Anfänger"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=bankdr%C3%BCcken+richtige+form+anf%C3%A4nger",
    formCues: [
      "Sırtın banka yapışık, poponu kaldırma",
      "Bar omuz hizasında bench'e iner (göğüs ortası)",
      "Dirsekler 45° açı (vücuda yapışık veya 90° değil)",
      "Ayaklar yerde sabit",
      "Bar indirerken nefes al, iterken nefes ver"
    ],
    commonMistakes: [
      "Bar'ı boyuna veya çok aşağı indirmek",
      "Poponu kaldırmak (bel sakatlığı)",
      "Çok ağır → son rep kontrolsüz düşer"
    ],
    beginnerAlt: "Dumbbell Bench Press (daha kontrollü, başlangıç için daha iyi)",
    machineAlt: "Chest Press Machine (ilk hafta için de güvenli seçim)"
  },

  dr: {
    id: "dr",
    name: { en: "Dumbbell Row", de: "Einarmiges Kurzhantelrudern", tr: "Tek El Dambıl Row" },
    gifPath: "/gifs/dr.gif",
    targetMuscles: ["back", "biceps", "rear_delts"],
    equipment: "dumbbell_bench",
    videoSearch: {
      en: "one arm dumbbell row proper form",
      de: "einarmiges Kurzhantelrudern Form"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=einarmiges+kurzhantelrudern+anf%C3%A4nger",
    formCues: [
      "Bir elin ve dizin bench'te, diğer ayak yerde",
      "Sırt düz, yere paralel",
      "Dambılı karna doğru çek (göbek yanı)",
      "Dirsek vücuda yakın, geriye doğru",
      "Sıkıştır, sonra yavaş bırak"
    ],
    commonMistakes: [
      "Sırt kambur → beli sakatlar",
      "Vücudu döndürerek çekme (momentum)",
      "Dambılı yana çekme (omuza gider)"
    ],
    beginnerAlt: "Seated Cable Row (makinede, form daha kolay)",
    machineAlt: "Cable Row Machine"
  },

  op: {
    id: "op",
    name: { en: "Overhead Press", de: "Schulterdrücken (Langhantel stehend)", tr: "Omuz Press (Ayakta)" },
    targetMuscles: ["shoulders", "triceps", "core"],
    equipment: "barbell",
    phase1Alt: "seated_shoulder_press",
    videoSearch: {
      en: "overhead press barbell form",
      de: "Schulterdrücken Langhantel richtige Ausführung"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=schulterdr%C3%BCcken+langhantel+form",
    formCues: [
      "FAZ 1'DE YAPMA — oturarak (Seated) versiyonu kullan",
      "Bar omuzda başlar (clavicle üstü)",
      "Core sıkı, popoyu sıkıştır",
      "Yukarı iterken baş geri, sonra başın üstünden öne"
    ],
    phase1Note: "Bel koruması için Faz 1 boyunca Seated Shoulder Press (makine) yap",
    beginnerAlt: "Seated Dumbbell Shoulder Press",
    machineAlt: "Seated Shoulder Press Machine (FAZ 1 için bu)"
  },

  seated_shoulder_press: {
    id: "seated_shoulder_press",
    name: { en: "Seated Shoulder Press (Machine)", de: "Schulterdrücken Gerät (sitzend)", tr: "Makinede Oturarak Omuz Press" },
    gifPath: "/gifs/seated_shoulder_press.gif",
    targetMuscles: ["shoulders", "triceps"],
    equipment: "machine",
    videoSearch: {
      en: "seated shoulder press machine form",
      de: "Schulterdrücken Maschine sitzend"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=schulterdr%C3%BCcken+maschine",
    formCues: [
      "Koltukta dik otur, sırtını tam yasla",
      "Kollar omuz hizasında başlar",
      "Yukarı it, kolları tam uzatma (kilitleme)",
      "Yavaş kontrollü geri"
    ],
    commonMistakes: ["Kollar aşırı kilitlenmiş → eklemde stres", "Sırtı yaslamamak"],
    isPhase1Safe: true
  },

  lp: {
    id: "lp",
    name: { en: "Lat Pulldown", de: "Latzug", tr: "Lat Pulldown (Kablo ile Yukardan Çekiş)" },
    gifPath: "/gifs/lp.gif",
    targetMuscles: ["lats", "biceps", "rear_delts"],
    equipment: "cable_machine",
    videoSearch: {
      en: "lat pulldown proper form",
      de: "Latzug richtige Form"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=latzug+anf%C3%A4nger+form",
    formCues: [
      "Geniş tutuş (omuzdan geniş)",
      "Barı göğüs üstüne çek (ÇENEYE DEĞİL)",
      "Dirsekler aşağı ve geri",
      "Omuz bıçaklarını sıkıştır",
      "Yavaş yukarı bırak"
    ],
    commonMistakes: [
      "Barı boynun arkasına çekme (omuz sakatlığı)",
      "Vücudu sallamak (momentum)",
      "Çok ağır → kol kullanır, sırt çalışmaz"
    ]
  },

  fp: {
    id: "fp",
    name: { en: "Face Pull", de: "Face Pulls (Gesichtszug)", tr: "Face Pull (Yüze Doğru Kablo Çekiş)" },
    gifPath: "/gifs/fp.gif",
    targetMuscles: ["rear_delts", "rhomboids", "rotator_cuff"],
    equipment: "cable_machine_rope",
    videoSearch: {
      en: "face pull proper form shoulder health",
      de: "Face Pull richtig ausführen Schultergesundheit"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=face+pulls+anleitung",
    formCues: [
      "Kablo yüksek konumda (alın hizasında)",
      "İpi yüze doğru çek — eller yüzünü geçer",
      "Dirsekler yukarıda, arkaya doğru",
      "Omuz bıçaklarını sıkıştır",
      "HAFİF AĞIRLIK — bu güç için değil, omuz sağlığı için"
    ],
    importance: "KRİTİK — masabaşı iş yapan herkes için şart. Bench press'in dengeleyicisi.",
    commonMistakes: ["Çok ağır → sırt yerine kol kullanır", "İpi göğüse doğru çekmek (Face Pull DEĞİL)"]
  },

  bc: {
    id: "bc",
    name: { en: "Bicep Curl", de: "Bizepscurl", tr: "Biceps Curl (Kol Bükme)" },
    gifPath: "/gifs/bc.gif",
    targetMuscles: ["biceps", "forearms"],
    equipment: "dumbbells_or_barbell",
    videoSearch: {
      en: "bicep curl proper form dumbbell",
      de: "Bizepscurl Kurzhantel Form"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=bizepscurl+richtig",
    formCues: [
      "Dirsekler vücudun yanında SABİT",
      "Sadece önkol hareket eder",
      "Yukarıda 1sn sıkıştır",
      "Yavaş aşağı bırak (eksantrik önemli)"
    ],
    commonMistakes: [
      "Gövdeyi sallamak (momentum)",
      "Dirseği öne atmak",
      "Çok hızlı aşağı bırakma"
    ]
  },

  tp: {
    id: "tp",
    name: { en: "Tricep Pushdown", de: "Trizepsdrücken am Kabel", tr: "Triceps Pushdown (Kablo ile Aşağı İtiş)" },
    gifPath: "/gifs/tp.gif",
    targetMuscles: ["triceps"],
    equipment: "cable_machine",
    videoSearch: {
      en: "tricep pushdown cable proper form",
      de: "Trizepsdrücken Kabel richtig"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=trizepsdr%C3%BCcken+kabel",
    formCues: [
      "Dirsekler vücuda yapışık ve SABİT",
      "Sadece önkol hareket eder",
      "Aşağıda tam uzat, sıkıştır",
      "Yavaş yukarı kontrol"
    ],
    tip: "Bicep Curl ile superset yapabilirsin (süre kazandırır)"
  },

  // ─── GÜN B — ALT VÜCUT ───
  sq: {
    id: "sq",
    name: { en: "Squat", de: "Kniebeuge", tr: "Squat (Çömelme) - Barbell veya Leg Press" },
    targetMuscles: ["quads", "glutes", "core", "hamstrings"],
    equipment: "barbell_rack_or_leg_press",
    phase1Alt: "leg_press",
    videoSearch: {
      en: "squat proper form beginner",
      de: "Kniebeuge Anfänger richtige Form"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=kniebeuge+anf%C3%A4nger+form",
    phase1Note: "FAZ 1: Leg Press (makine) kullan — bel koruması için"
  },

  leg_press: {
    id: "leg_press",
    name: { en: "Leg Press", de: "Beinpresse", tr: "Leg Press (Yatarak Bacak İtiş)" },
    gifPath: "/gifs/leg_press.gif",
    targetMuscles: ["quads", "glutes", "hamstrings"],
    equipment: "machine",
    videoSearch: {
      en: "leg press proper form",
      de: "Beinpresse richtig ausführen"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=beinpresse+richtig",
    formCues: [
      "Ayaklar omuz genişliğinde",
      "Dizler parmak uçlarını geçmez",
      "Alt pozisyonda diz 90° (aşırı derine inme)",
      "İtte dizi TAMAMEN kilitleme (eklem stresi)",
      "Sırt ve popo yere yapışık"
    ],
    commonMistakes: [
      "Dizleri içeri yıkma",
      "Çok derin — bel kalkar",
      "Dizi kilitlemek"
    ],
    isPhase1Safe: true
  },

  rd: {
    id: "rd",
    name: { en: "Romanian Deadlift", de: "Rumänisches Kreuzheben (RDL)", tr: "Romanian Deadlift (Düz Bacak Deadlift)" },
    targetMuscles: ["hamstrings", "glutes", "lower_back"],
    equipment: "barbell_or_dumbbells",
    phase1Alt: "seated_leg_curl",
    videoSearch: {
      en: "romanian deadlift RDL proper form",
      de: "rumänisches Kreuzheben richtige Ausführung"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=rum%C3%A4nisches+kreuzheben+form",
    phase1Note: "FAZ 1: Seated Leg Curl (makine) — bel koruması"
  },

  seated_leg_curl: {
    id: "seated_leg_curl",
    name: { en: "Seated Leg Curl", de: "Beinbeuger sitzend", tr: "Oturarak Bacak Bükme" },
    gifPath: "/gifs/seated_leg_curl.gif",
    targetMuscles: ["hamstrings"],
    equipment: "machine",
    videoSearch: {
      en: "seated leg curl proper form",
      de: "Beinbeuger sitzend Gerät"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=beinbeuger+sitzend",
    formCues: [
      "Pad ayak bileğinin üstünde",
      "Yavaş büküş, altta 1sn sıkıştır",
      "Tam geri uzatma (ama kilitleme)"
    ],
    isPhase1Safe: true
  },

  lc: {
    id: "lc",
    name: { en: "Leg Curl (lying or seated)", de: "Beinbeuger", tr: "Leg Curl (Bacak Bükme Makinesi)" },
    gifPath: "/gifs/lc.gif",
    targetMuscles: ["hamstrings"],
    equipment: "machine",
    videoSearch: {
      en: "leg curl machine form",
      de: "Beinbeuger Maschine"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=beinbeuger+maschine"
  },

  le: {
    id: "le",
    name: { en: "Leg Extension", de: "Beinstrecker", tr: "Leg Extension (Bacak Uzatma Makinesi)" },
    gifPath: "/gifs/le.gif",
    targetMuscles: ["quads"],
    equipment: "machine",
    videoSearch: {
      en: "leg extension machine form",
      de: "Beinstrecker Maschine"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=beinstrecker+maschine",
    formCues: [
      "Diz pad'in üstünde değil, hemen altında",
      "Tam uzat, 1sn sıkıştır",
      "Yavaş geri"
    ]
  },

  cr: {
    id: "cr",
    name: { en: "Calf Raise", de: "Wadenheben", tr: "Calf Raise (Baldır Kaldırma)" },
    gifPath: "/gifs/cr.gif",
    targetMuscles: ["calves"],
    equipment: "machine_or_step",
    videoSearch: {
      en: "standing calf raise form",
      de: "Wadenheben stehend"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=wadenheben+form",
    formCues: [
      "Tam yukarı kalk (topukları yukarı)",
      "1sn tut, yavaş aşağı",
      "Topuklar yere değmeden tekrar"
    ]
  },

  pl: {
    id: "pl",
    name: { en: "Plank", de: "Unterarmstütz (Plank)", tr: "Plank (Düzlemde Destek)" },
    gifPath: "/gifs/pl.gif",
    targetMuscles: ["core", "shoulders"],
    equipment: "bodyweight",
    videoSearch: {
      en: "plank proper form",
      de: "Unterarmstütz Plank richtig"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=plank+richtige+form",
    formCues: [
      "Önkolllar yerde, dirsekler omuz altında",
      "Vücut düz çizgi (kafa-popo-topuk)",
      "Poponu kaldırma, çökertme",
      "Core sıkı, nefes almayı unutma"
    ]
  },

  // ─── FAZ 1 CORE & REHAB ───
  db: {
    id: "db",
    name: { en: "Dead Bug", de: "Dead Bug (Toter Käfer)", tr: "Dead Bug (Ters Böcek - Core Egzersizi)" },
    gifPath: "/gifs/db.gif",
    targetMuscles: ["core", "lower_back_stability"],
    equipment: "bodyweight",
    videoSearch: {
      en: "dead bug exercise proper form",
      de: "Dead Bug Übung richtig"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=dead+bug+%C3%BCbung+anleitung",
    formCues: [
      "Sırt üstü yat, kollar ve bacaklar yukarıda",
      "Diz ve kalça 90°",
      "Karşı kol ve karşı bacak YAVAŞ uzat (sağ kol + sol bacak)",
      "Bel SÜREKLİ yere yapışık (boşluk bırakma)",
      "Geri getir, öbür taraf"
    ],
    importance: "BEL İÇİN ALTIN EGZERSİZ — senin için kritik",
    isPhase1Safe: true
  },

  bd: {
    id: "bd",
    name: { en: "Bird Dog", de: "Bird Dog (Vogelhund)", tr: "Bird Dog (Kuş Köpeği - Core Egzersizi)" },
    gifPath: "/gifs/bd.gif",
    targetMuscles: ["core", "lower_back", "glutes"],
    equipment: "bodyweight",
    videoSearch: {
      en: "bird dog exercise proper form",
      de: "Bird Dog Übung Ausführung"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=bird+dog+%C3%BCbung",
    formCues: [
      "Dörtlü pozisyon (eller omuz altında, dizler kalça altında)",
      "Sırt düz (masa gibi)",
      "Karşı kol + karşı bacak uzat (sağ kol + sol bacak)",
      "2sn tut, yavaş geri",
      "Bel çökmesin, poponu sallanmasın"
    ],
    importance: "Bel stabilitesi için",
    isPhase1Safe: true
  },

  gb: {
    id: "gb",
    name: { en: "Glute Bridge", de: "Glute Bridge (Hüftbrücke)", tr: "Glute Bridge (Kalça Köprüsü)" },
    gifPath: "/gifs/gb.gif",
    targetMuscles: ["glutes", "hamstrings", "core"],
    equipment: "bodyweight",
    videoSearch: {
      en: "glute bridge proper form",
      de: "Glute Bridge Hüftbrücke Übung"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=glute+bridge+%C3%BCbung",
    formCues: [
      "Sırt üstü, dizler bükülü, ayaklar yere düz",
      "Popoyu sıkıştırarak yukarı kaldır",
      "Diz-kalça-omuz düz çizgi üstte",
      "1sn tut, yavaş aşağı",
      "KALÇA HAREKET EDİYOR — beli kullanma"
    ],
    importance: "Kalça güçlenmesi = belin en iyi dostu",
    isPhase1Safe: true
  },

  // ─── GÜN C — FULL BODY ───
  dl: {
    id: "dl",
    name: { en: "Deadlift", de: "Kreuzheben", tr: "Deadlift (Yerden Kaldırma)" },
    targetMuscles: ["entire_posterior_chain", "back", "glutes", "hamstrings"],
    equipment: "barbell",
    phase1Alt: "hip_thrust",
    videoSearch: {
      en: "deadlift proper form beginner",
      de: "Kreuzheben Anfänger richtige Form"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=kreuzheben+anf%C3%A4nger+form",
    phase1Note: "FAZ 1: Hip Thrust (makine/barbell) — bel yüklenmez"
  },

  hip_thrust: {
    id: "hip_thrust",
    name: { en: "Hip Thrust", de: "Hip Thrust (Hüftstoß)", tr: "Hip Thrust (Kalça İtiş)" },
    gifPath: "/gifs/hip_thrust.gif",
    targetMuscles: ["glutes", "hamstrings"],
    equipment: "barbell_bench_or_machine",
    videoSearch: {
      en: "hip thrust barbell proper form",
      de: "Hip Thrust Langhantel Ausführung"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=hip+thrust+anleitung+deutsch",
    formCues: [
      "Üst sırt bench'te, ayaklar yerde",
      "Bar kalçaya yaslanır (yumuşak pad kullan)",
      "Kalçayı yukarı it — diz-kalça-omuz düz çizgi",
      "Üstte popoyu SIK!",
      "Yavaş aşağı"
    ],
    isPhase1Safe: true,
    importance: "Deadlift'in bel-dostu versiyonu"
  },

  ip: {
    id: "ip",
    name: { en: "Incline Dumbbell Press", de: "Schrägbankdrücken Kurzhantel", tr: "Eğimli Bench Dambıl Press" },
    gifPath: "/gifs/ip.gif",
    targetMuscles: ["upper_chest", "shoulders", "triceps"],
    equipment: "dumbbells_incline_bench",
    videoSearch: {
      en: "incline dumbbell press proper form",
      de: "Schrägbankdrücken Kurzhantel"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=schr%C3%A4gbankdr%C3%BCcken+kurzhantel",
    formCues: [
      "Bench 30-45° eğim",
      "Dambıllar göğüs hizasında başlar",
      "Yukarı it, dambılar üstte birbirine YAKLAŞIR (değmez)",
      "Yavaş aşağı"
    ]
  },

  cw: {
    id: "cw",
    name: { en: "Cable Row", de: "Kabelrudern sitzend", tr: "Cable Row (Oturarak Kablo Çekiş)" },
    gifPath: "/gifs/cw.gif",
    targetMuscles: ["back", "biceps", "rear_delts"],
    equipment: "cable_machine",
    videoSearch: {
      en: "seated cable row proper form",
      de: "Kabelrudern sitzend richtig"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=kabelrudern+sitzend",
    formCues: [
      "Otur, ayaklar pedalda, dizler hafif bükülü",
      "Sırt düz, göğüs ileri",
      "Kolu karına doğru çek (göbek altı)",
      "Omuz bıçaklarını sıkıştır",
      "Yavaş geri"
    ]
  },

  gs: {
    id: "gs",
    name: { en: "Goblet Squat", de: "Goblet Squat", tr: "Goblet Squat (Göğüs Önünde Dambıl ile Squat)" },
    gifPath: "/gifs/gs.gif",
    targetMuscles: ["quads", "glutes", "core"],
    equipment: "dumbbell_or_kettlebell",
    phase1Alt: "leg_press_light",
    videoSearch: {
      en: "goblet squat proper form",
      de: "Goblet Squat Ausführung"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=goblet+squat+form"
  },

  lr: {
    id: "lr",
    name: { en: "Lateral Raise", de: "Seitheben", tr: "Lateral Raise (Yan Omuz Kaldırma)" },
    gifPath: "/gifs/lr.gif",
    targetMuscles: ["side_delts"],
    equipment: "dumbbells",
    videoSearch: {
      en: "lateral raise dumbbell proper form",
      de: "Seitheben Kurzhantel"
    },
    recommendedVideo: "https://www.youtube.com/results?search_query=seitheben+kurzhantel",
    formCues: [
      "Dambıllar ellerinde, kollar yanda",
      "Hafif dirsek bükülü",
      "Yana kaldır, paralel olana kadar (omuz hizası)",
      "Baş parmaklar hafif aşağıya (su döker gibi)",
      "Yavaş aşağı"
    ],
    commonMistakes: [
      "Çok ağır → momentum kullanır",
      "Kolları tam düz (dirsek stresi)",
      "Omuzu kulaklara çekme"
    ]
  },

  cd: {
    id: "cd",
    name: { en: "Cardio (Incline Walk / Bike)", de: "Cardio (Laufband mit Steigung / Fahrrad)", tr: "Kardiyo (Eğimli Yürüyüş Bandı veya Bisiklet)" },
    targetMuscles: ["cardiovascular_system", "fat_burn"],
    equipment: "treadmill_or_bike",
    videoSearch: null,
    formCues: [
      "Yürüyüş bandı: Hız 5-6 km/h, eğim %8-12",
      "Bisiklet: Orta direnç, kalp atışı 120-140",
      "Konuşabiliyor ama şarkı söyleyemiyor → doğru yoğunluk"
    ]
  }
};

// Helper to get exercise details by ID
export const getExercise = (id) => EXERCISES[id];

// Get YouTube search URL for an exercise in user's language
export const getVideoUrl = (exerciseId, lang = "de") => {
  const ex = EXERCISES[exerciseId];
  if (!ex) return null;
  return ex.recommendedVideo || `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.videoSearch?.[lang] || ex.videoSearch?.en || "")}`;
};

// Muscle group labels (for UI display)
export const MUSCLE_LABELS = {
  chest: { en: "Chest", de: "Brust", tr: "Göğüs" },
  back: { en: "Back", de: "Rücken", tr: "Sırt" },
  shoulders: { en: "Shoulders", de: "Schultern", tr: "Omuzlar" },
  shoulders_front: { en: "Front Shoulders", de: "vordere Schulter", tr: "Ön Omuz" },
  rear_delts: { en: "Rear Delts", de: "hintere Schulter", tr: "Arka Omuz" },
  side_delts: { en: "Side Delts", de: "seitliche Schulter", tr: "Yan Omuz" },
  biceps: { en: "Biceps", de: "Bizeps", tr: "Biceps" },
  triceps: { en: "Triceps", de: "Trizeps", tr: "Triceps" },
  forearms: { en: "Forearms", de: "Unterarme", tr: "Önkol" },
  core: { en: "Core", de: "Rumpf/Core", tr: "Core/Karın" },
  lats: { en: "Lats", de: "Latissimus", tr: "Kanat Sırt" },
  rhomboids: { en: "Rhomboids", de: "Rhomboiden", tr: "Orta Sırt" },
  rotator_cuff: { en: "Rotator Cuff", de: "Rotatorenmanschette", tr: "Omuz Manşeti" },
  quads: { en: "Quads", de: "Oberschenkelvorderseite", tr: "Ön Bacak" },
  hamstrings: { en: "Hamstrings", de: "Oberschenkelrückseite", tr: "Arka Bacak" },
  glutes: { en: "Glutes", de: "Gesäß", tr: "Kalça" },
  calves: { en: "Calves", de: "Waden", tr: "Baldır" },
  lower_back: { en: "Lower Back", de: "unterer Rücken", tr: "Bel" },
  lower_back_stability: { en: "Lower Back Stability", de: "Rumpfstabilität", tr: "Bel Stabilitesi" },
  upper_chest: { en: "Upper Chest", de: "obere Brust", tr: "Üst Göğüs" },
  entire_posterior_chain: { en: "Posterior Chain", de: "hintere Kette", tr: "Arka Zincir" },
  cardiovascular_system: { en: "Cardio", de: "Herz-Kreislauf", tr: "Kalp-Damar" },
  fat_burn: { en: "Fat Burn", de: "Fettverbrennung", tr: "Yağ Yakımı" }
};
