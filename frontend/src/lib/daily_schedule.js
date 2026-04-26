// 182-day daily schedule generator for fit-app
// Import into app or run standalone to produce full calendar JSON.
// Every day: what to do morning → evening, family-friendly, gym at 19-20h.

import { PLAN, getWeekNum, getPhase, getDayPlan, getExercisesForDay } from "./plan.js";
import { getCardioProtocol, getHabitsForPhase, getFootballMode } from "./protocols.js";

// ─── SCHEDULE GENERATOR ───

export function generateFullSchedule() {
  const start = new Date(PLAN.startDate);
  const days = [];

  for (let i = 0; i < 182; i++) {
    const date = new Date(start.getTime() + i * 86400000);
    const dateStr = date.toISOString().split("T")[0];
    const dow = date.getDay();
    const weekNum = getWeekNum(dateStr);
    const phase = getPhase(weekNum);
    const dayPlan = getDayPlan(dateStr);
    const cardio = getCardioProtocol(weekNum);
    const habits = getHabitsForPhase(weekNum);
    const football = getFootballMode(weekNum);

    const isTrainingDay = dayPlan.type !== "rest";
    const isFastDay = dayPlan.eating === "FAST";
    const isLowDay = dayPlan.eating === "LOW";
    const isWeekend = dow === 0 || dow === 6;
    const isFreeMealDay = dow === 0 && isLowDay;

    // Step target interpolation
    const phaseWeekStart = phase.weeks[0];
    const weeksIntoPhase = weekNum - phaseWeekStart;
    const stepTarget = Math.min(
      cardio.stepTarget.end,
      cardio.stepTarget.start + weeksIntoPhase * cardio.stepTarget.weeklyIncrement
    );

    // Monday checkpoint
    const isCheckpointDay = dow === 1;

    const day = {
      date: dateStr,
      dayNumber: i + 1,
      weekNumber: weekNum,
      dayOfWeek: dow,
      dayName: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][dow],
      phase: {
        id: phase.id,
        name: ["", "Temel Atma", "İvme", "Şekillendirme", "Kalıcılık"][phase.id],
        color: phase.color
      },

      // ── EATING ──
      eating: {
        mode: dayPlan.eating,
        label: isFastDay ? "ORUÇ" : isFreeMealDay ? "CHEAT MEAL" : isLowDay ? "DÜŞÜK KALORİ" : "OMAD",
        freeMeal: isFreeMealDay ? {
          label: "controlled free meal",
          note: "Protein first. One meal, not a cheat day."
        } : null,
        window: isFastDay ? null : {
          start: isTrainingDay ? "19:30" : "18:00",
          end: isTrainingDay ? "20:45" : "19:00"
        },
        targets: isFastDay
          ? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
          : isFreeMealDay
            ? { kcal: 2000, protein: 130, carbs: 160, fat: 80 }
          : isLowDay
            ? { kcal: 1300, protein: 130, carbs: 60, fat: 65 }
            : { kcal: 1800, protein: 150, carbs: 115, fat: 75 },
        preShake: isTrainingDay && !isFastDay ? {
          time: "19:30",
          desc: "30g whey + su",
          kcal: 120,
          protein: 25
        } : null
      },

      // ── TRAINING ──
      training: isTrainingDay ? {
        type: dayPlan.type,
        label: { A: "Üst Vücut (Push/Pull)", B: "Alt Vücut", C: "Full Body + Kardiyo" }[dayPlan.type],
        timeSlot: "18:30 – 19:30",
        exercises: getExercisesForDay(dayPlan.type, weekNum)?.exercises || [],
        postCardio: dayPlan.type === "C" ? {
          type: "LISS",
          activity: "Eğimli yürüyüş bandı veya bisiklet",
          durationMin: cardio.liss.durationMin,
          heartRate: cardio.liss.heartRateRange || [110, 130]
        } : null
      } : null,

      // ── CARDIO (non-training days) ──
      cardio: !isTrainingDay ? {
        weekendLiss: isWeekend && !isFastDay && cardio.liss.sessionsPerWeek >= 2 ? {
          type: "LISS",
          activity: "Uzun yürüyüş, bisiklet veya eliptik",
          durationMin: cardio.liss.durationMin + 5,
          note: "Çocuklarla yürüyüş de sayılır"
        } : null,
        hiit: cardio.hiit?.allowed && dow === 4 && phase.id >= 3 ? {
          type: "HIIT",
          format: cardio.hiit.format || "30s hızlı / 60s yavaş × 8",
          durationMin: cardio.hiit.durationMin || 15,
          note: "Ağırlık antrenmanından ayrı günde"
        } : null,
        football: football ? {
          allowed: true,
          mode: football.mode,
          durationMin: football.durationMin || 45,
          note: football.note
        } : { allowed: false, unlocksWeek: 13 },
        fastDayNote: isFastDay ? "Oruç günü — sadece hafif yürüyüş. Yüklenmek yok." : null
      } : null,

      // ── DAILY SCHEDULE ──
      schedule: generateDaySchedule({
        isTrainingDay,
        isFastDay,
        isLowDay,
        isFreeMealDay,
        isWeekend,
        dayType: dayPlan.type,
        weekNum,
        phase: phase.id,
        stepTarget,
        cardio,
        isCheckpointDay,
        football
      }),

      // ── TARGETS ──
      stepTarget,
      waterLiters: isFastDay ? 3.0 : 2.5,
      sleepHours: 7,

      // ── FLAGS ──
      isCheckpointDay,
      checkpoint: isCheckpointDay ? {
        tasks: [
          "Aç karnına tartıl",
          "3 fotoğraf (ön, yan, arka)",
          weekNum % 2 === 1 ? "Ölçüm al (bel, göğüs, kol)" : null,
          "Haftalık değerlendirme yap"
        ].filter(Boolean)
      } : null,

      restrictions: null,

      // ── SUPPLEMENTS ──
      supplements: {
        morning: ["D3+K2", "Omega-3 (vegan)"],
        evening: ["Magnesium", "B12"],
        note: "Oruç günlerinde de supplement al"
      }
    };

    days.push(day);
  }

  return {
    meta: {
      version: "3.0",
      generated: new Date().toISOString(),
      totalDays: 182,
      startDate: PLAN.startDate,
      endDate: PLAN.endDate,
      startWeight: PLAN.startWeight,
      targetWeight: PLAN.targetWeight,
      heightCm: PLAN.heightCm,
      dietary: PLAN.dietary
    },
    days
  };
}

// ─── DAY SCHEDULE BUILDER ───

function generateDaySchedule(opts) {
  const {
    isTrainingDay, isFastDay, isLowDay, isWeekend,
    isFreeMealDay,
    dayType, weekNum, phase, stepTarget, cardio,
    isCheckpointDay, football
  } = opts;

  const schedule = [];

  // ── MORNING ──
  schedule.push({
    time: "07:00",
    action: "Kalkış",
    details: "500ml su iç",
    category: "routine"
  });

  schedule.push({
    time: "07:05",
    action: "Supplement",
    details: "D3+K2, Omega-3",
    category: "supplement"
  });

  if (isCheckpointDay) {
    schedule.push({
      time: "07:10",
      action: "Haftalık Check-in",
      details: "Aç karnına tartıl, 3 fotoğraf çek (ön/yan/arka)",
      category: "checkpoint"
    });
  }

  // ── WORK DAY ──
  if (!isWeekend) {
    schedule.push({
      time: "07:30",
      action: "İşe gidiş",
      details: isFastDay ? "Sadece su ve siyah kahve" : "Kahve serbest, yemek yok (OMAD penceresi akşam)",
      category: "routine"
    });

    schedule.push({
      time: "10:00",
      action: "Kısa mola",
      details: "Ayağa kalk, 2dk yürü, su iç.",
      category: "activity"
    });

    schedule.push({
      time: "12:00",
      action: "Öğle yürüyüşü",
      details: "30dk rahat tempo yürüyüş",
      category: "cardio",
      duration: "30dk"
    });

    schedule.push({
      time: "15:00",
      action: "İkindi molası",
      details: "500ml su, 5dk ayakta mola",
      category: "routine"
    });

    schedule.push({
      time: "16:30",
      action: "İşten çıkış",
      details: "Eve geliş",
      category: "routine"
    });
  }

  // ── WEEKEND MORNING ──
  if (isWeekend) {
    schedule.push({
      time: "08:00",
      action: "Sabah",
      details: isFastDay
        ? "Kahve/çay, çocuklarla kahvaltı hazırla (sen yeme)"
        : "Çocuklarla vakit, açık hava",
      category: "routine"
    });

    // Weekend LISS — family friendly
    if (!isFastDay && cardio.liss.sessionsPerWeek >= 2) {
      schedule.push({
        time: "10:00",
        action: "Hafta sonu kardiyo",
        details: `${cardio.liss.durationMin + 5}dk yürüyüş veya bisiklet — çocuklarla parkta yapılabilir`,
        category: "cardio"
      });
    }

    // Football (when unlocked)
    if (football && football.mode) {
      schedule.push({
        time: "11:00",
        action: "Futbol",
        details: `${football.mode === "normal" ? "Tam maç" : football.note} — ${football.durationMin || 45}dk`,
        category: "cardio"
      });
    }
  }

  // ── AFTERNOON / KIDS TIME ──
  if (isWeekend) {
    schedule.push({
      time: "14:00",
      action: "Aile zamanı",
      details: "Çocuklarla aktivite — park, oyun, yürüyüş",
      category: "family"
    });
  }

  // ── AFTERNOON — KIDS 17:00–19:00 (all days) ──
  if (!isWeekend) {
    schedule.push({
      time: "17:00",
      action: "Çocuklarla vakit",
      details: "Park, oyun, sohbet — 2 saat kaliteli zaman",
      category: "family",
      duration: "2sa"
    });
  }

  // ── EVENING — TRAINING DAYS ──
  if (isTrainingDay) {
    schedule.push({
      time: "18:50",
      action: "Gym hazırlık",
      details: "Gym çantası, su şişesi, kulaklık",
      category: "routine"
    });

    schedule.push({
      time: "19:00",
      action: `GYM — Gün ${dayType}`,
      details: { A: "Üst Vücut (Push/Pull)", B: "Alt Vücut", C: "Full Body + Kardiyo" }[dayType],
      category: "training",
      duration: "45-60dk"
    });

    if (dayType === "C") {
      schedule.push({
        time: "19:45",
        action: "Post-training LISS",
        details: `${cardio.liss.durationMin}dk eğimli yürüyüş bandı veya bisiklet`,
        category: "cardio"
      });
    }

    schedule.push({
      time: "20:00",
      action: "Post-workout shake",
      details: "30g whey + su (120kcal, 25g protein) — yeme penceresi açılır",
      category: "nutrition"
    });

    schedule.push({
      time: "20:15",
      action: "OMAD — Ana öğün",
      details: "Tek büyük öğün (~1650-1680kcal kalan). Protein önce, sonra sebze, en son karbonhidrat.",
      category: "nutrition",
      duration: "45-60dk"
    });

    schedule.push({
      time: "21:15",
      action: "Akşam yürüyüşü",
      details: "30dk sakin yürüyüş — sindirim + toparlanma",
      category: "cardio",
      duration: "30dk"
    });
  }

  // ── EVENING — REST EATING DAYS ──
  if (!isTrainingDay && !isFastDay) {
    // HIIT on Thursday Phase 3+ (non-training day)
    if (cardio.hiit?.allowed && phase >= 3) {
      schedule.push({
        time: "17:30",
        action: "HIIT (opsiyonel)",
        details: `${cardio.hiit.format} — ${cardio.hiit.durationMin}dk. Sadece Perşembe.`,
        category: "cardio"
      });
    }

    schedule.push({
      time: "18:00",
      action: isFreeMealDay ? "Controlled free meal" : "OMAD — Ana öğün (düşük kalori)",
      details: isFreeMealDay
        ? "Tek öğün. Protein önce, keyif serbest; cheat day değil. 1800-2200kcal tavan."
        : "Çocuklarla birlikte, tek öğün (~1300kcal). Düşük karbonhidrat, yüksek protein.",
      category: "nutrition",
      duration: "30-45dk"
    });

    schedule.push({
      time: "19:30",
      action: "Akşam yürüyüşü",
      details: "30dk — çocuklarla da yapılabilir",
      category: "cardio",
      duration: "30dk"
    });
  }

  // ── EVENING — FAST DAYS ──
  if (isFastDay) {
    schedule.push({
      time: "18:00",
      action: "Çocuklara akşam yemeği",
      details: "Sen yemek yok — su, çay. Çocuklara hazırla.",
      category: "routine"
    });

    schedule.push({
      time: "19:30",
      action: "Akşam yürüyüşü",
      details: "30dk hafif yürüyüş — yüklenmek yok",
      category: "cardio",
      duration: "30dk"
    });
  }

  // ── WIND DOWN ──
  schedule.push({
    time: "22:00",
    action: "Supplement + rahatlama",
    details: "Magnesium, B12. Ekranları azalt.",
    category: "supplement"
  });

  schedule.push({
    time: "22:30",
    action: "Uyku hazırlığı",
    details: "Telefon bırak.",
    category: "routine"
  });

  schedule.push({
    time: "23:00",
    action: "Uyku",
    details: "Hedef: 8 saat (23:00 → 07:00). Uyku = kas büyümesi = yağ yakımı.",
    category: "sleep"
  });

  return schedule;
}

// ─── STATIC EXPORT — pre-generate all 182 days ───

export const FULL_SCHEDULE = generateFullSchedule();

export default FULL_SCHEDULE;
