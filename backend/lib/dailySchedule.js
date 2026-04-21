const PLAN = {
  startDate: "2026-04-20",
  endDate: "2026-10-19",
  phases: [
    { id: 1, weeks: [1, 4] },
    { id: 2, weeks: [5, 12] },
    { id: 3, weeks: [13, 20] },
    { id: 4, weeks: [21, 26] }
  ],
  weeklyPattern: {
    1: { type: "A", eating: "OMAD" },
    2: { type: "rest", eating: "FAST" },
    3: { type: "B", eating: "OMAD" },
    4: { type: "rest", eating: "LOW" },
    5: { type: "C", eating: "OMAD" },
    6: { type: "rest", eating: "FAST" },
    0: { type: "rest", eating: "LOW" }
  }
};

const CARDIO = {
  1: { weeks: [1, 4], stepTarget: { start: 3000, end: 5000, weeklyIncrement: 500 }, liss: { sessionsPerWeek: 1, durationMin: 20 }, hiit: { allowed: false } },
  2: { weeks: [5, 12], stepTarget: { start: 5000, end: 7000, weeklyIncrement: 500 }, liss: { sessionsPerWeek: 2, durationMin: 30 }, hiit: { allowed: false } },
  3: {
    weeks: [13, 20],
    stepTarget: { start: 7000, end: 10000, weeklyIncrement: 500 },
    liss: { sessionsPerWeek: 2, durationMin: 35 },
    hiit: { allowed: true, durationMin: 15, format: "30s hard / 60s easy x 8-10" },
    football: {
      allowed: true,
      progression: [
        { weeks: [13, 14], mode: "solo_technique", durationMin: 30, note: "Passes, shots, ball control only" },
        { weeks: [15, 16], mode: "light_jog_ball", durationMin: 30, note: "Jogging with ball, no matches" },
        { weeks: [17, 20], mode: "small_sided", durationMin: 45, note: "5v5 or 6v6, controlled" }
      ]
    }
  },
  4: {
    weeks: [21, 26],
    stepTarget: { start: 8000, end: 10000, weeklyIncrement: 0 },
    liss: { sessionsPerWeek: 2, durationMin: 30 },
    hiit: { allowed: true, durationMin: 15 },
    football: { allowed: true, mode: "normal", note: "Full matches OK" }
  }
};

const dateAtNoon = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

const daysBetween = (a, b) => Math.floor((dateAtNoon(b) - dateAtNoon(a)) / 86400000);

const getWeekNum = (dateStr) => Math.max(1, Math.floor(daysBetween(PLAN.startDate, dateStr) / 7) + 1);

const getPhase = (weekNum) =>
  PLAN.phases.find((p) => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]) || PLAN.phases[PLAN.phases.length - 1];

const getCardio = (weekNum) => CARDIO[getPhase(weekNum).id];

const getFootballMode = (weekNum) => {
  const football = getCardio(weekNum)?.football;
  if (!football?.allowed) return null;
  if (football.mode === "normal") return { mode: "normal", note: football.note, durationMin: 45 };
  return football.progression?.find((p) => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]) || null;
};

function buildDaySchedule(opts) {
  const {
    isTrainingDay, isFastDay, isWeekend, dayType, phase, stepTarget, cardio,
    isCheckpointDay, football
  } = opts;
  const schedule = [];

  schedule.push({ time: "07:00", action: "Kalkis", details: "500ml su ic", category: "routine" });
  schedule.push({ time: "07:05", action: "Supplement", details: "D3+K2, Omega-3", category: "supplement" });

  if (isCheckpointDay) {
    schedule.push({ time: "07:10", action: "Haftalik Check-in", details: "Ac karnina tartil, 3 fotograf cek", category: "checkpoint" });
  }

  if (!isWeekend) {
    schedule.push({ time: "07:30", action: "Ise gidis", details: isFastDay ? "Sadece su ve siyah kahve" : "Kahve serbest, yemek yok", category: "routine" });
    schedule.push({ time: "10:00", action: "Kisa mola", details: "Ayaga kalk, 2dk yuru, su ic", category: "activity" });
    schedule.push({ time: "12:00", action: "Ogle yuruyusu", details: "30dk rahat tempo yuruyus", category: "cardio", duration: "30dk" });
    schedule.push({ time: "15:00", action: "Ikindi molasi", details: "500ml su, 5dk ayakta mola", category: "routine" });
    schedule.push({ time: "16:30", action: "Isten cikis", details: "Eve gelis", category: "routine" });
    schedule.push({ time: "17:00", action: "Cocuklarla vakit", details: "Park, oyun, sohbet - 2 saat kaliteli zaman", category: "family", duration: "2sa" });
  }

  if (isWeekend) {
    schedule.push({ time: "08:00", action: "Sabah", details: isFastDay ? "Kahve/cay, kahvalti hazirla; sen yeme" : "Cocuklarla vakit, acik hava", category: "routine" });
    if (!isFastDay && cardio.liss.sessionsPerWeek >= 2) {
      schedule.push({ time: "10:00", action: "Hafta sonu kardiyo", details: `${cardio.liss.durationMin + 5}dk yuruyus veya bisiklet`, category: "cardio" });
    }
    if (football?.mode) {
      schedule.push({ time: "11:00", action: "Futbol", details: `${football.mode === "normal" ? "Tam mac" : football.note} - ${football.durationMin || 45}dk`, category: "cardio" });
    }
    schedule.push({ time: "14:00", action: "Aile zamani", details: "Cocuklarla aktivite - park, oyun, yuruyus", category: "family" });
  }

  if (isTrainingDay) {
    schedule.push({ time: "18:50", action: "Gym hazirlik", details: "Gym cantasi, su sisesi, kulaklik", category: "training" });
    schedule.push({ time: "19:00", action: `GYM - Gun ${dayType}`, details: { A: "Ust Vucut (Push/Pull)", B: "Alt Vucut", C: "Full Body + Kardiyo" }[dayType], category: "training", duration: "45-60dk" });
    if (dayType === "C") {
      schedule.push({ time: "19:45", action: "Post-training LISS", details: `${cardio.liss.durationMin}dk egimli yuruyus bandi veya bisiklet`, category: "cardio" });
    }
    schedule.push({ time: "20:00", action: "Post-workout shake", details: "30g whey + su", category: "nutrition" });
    schedule.push({ time: "20:15", action: "OMAD - Ana ogun", details: "Protein once, sonra sebze, en son karbonhidrat", category: "nutrition", duration: "45-60dk" });
    schedule.push({ time: "21:15", action: "Aksam yuruyusu", details: "30dk sakin yuruyus - sindirim ve toparlanma", category: "cardio", duration: "30dk" });
  }

  if (!isTrainingDay && !isFastDay) {
    if (cardio.hiit?.allowed && phase >= 3) {
      schedule.push({ time: "17:30", action: "HIIT (opsiyonel)", details: `${cardio.hiit.format} - ${cardio.hiit.durationMin}dk`, category: "cardio" });
    }
    schedule.push({ time: "18:00", action: "OMAD - Ana ogun", details: "Tek ogun, dusuk karbonhidrat, yuksek protein", category: "nutrition", duration: "30-45dk" });
    schedule.push({ time: "19:30", action: "Aksam yuruyusu", details: "30dk rahat tempo - cocuklarla da yapilabilir", category: "cardio", duration: "30dk" });
  }

  if (isFastDay) {
    schedule.push({ time: "18:00", action: "Cocuklara aksam yemegi", details: "Sen yemek yok - su, cay", category: "routine" });
    schedule.push({ time: "19:30", action: "Aksam yuruyusu", details: "30dk hafif yuruyus - yuklenmek yok", category: "cardio", duration: "30dk" });
  }

  schedule.push({ time: "22:00", action: "Supplement + rahatlama", details: "Magnesium, B12. Ekranlari azalt", category: "supplement" });
  schedule.push({ time: "22:30", action: "Uyku hazirligi", details: "Telefon birak", category: "routine" });
  schedule.push({ time: "23:00", action: "Uyku", details: "Hedef: 8 saat", category: "sleep" });

  return schedule;
}

export function getScheduleForDate(dateStr) {
  const date = dateAtNoon(dateStr);
  const dow = date.getDay();
  const weekNum = getWeekNum(dateStr);
  const phase = getPhase(weekNum);
  const dayPlan = PLAN.weeklyPattern[dow];
  const cardio = getCardio(weekNum);
  const football = getFootballMode(weekNum);
  const isTrainingDay = dayPlan.type !== "rest";
  const isFastDay = dayPlan.eating === "FAST";
  const isWeekend = dow === 0 || dow === 6;
  const weeksIntoPhase = weekNum - phase.weeks[0];
  const stepTarget = Math.min(
    cardio.stepTarget.end,
    cardio.stepTarget.start + weeksIntoPhase * cardio.stepTarget.weeklyIncrement
  );

  return buildDaySchedule({
    isTrainingDay,
    isFastDay,
    isWeekend,
    dayType: dayPlan.type,
    phase: phase.id,
    stepTarget,
    cardio,
    isCheckpointDay: dow === 1,
    football
  });
}
