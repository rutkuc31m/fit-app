// Phase-based protocols: cardio, habits, activity restrictions, checkpoints
// Consumed alongside plan.js — these are the behavioral/contextual layer.

export const PROTOCOLS = {
  // ─── CARDIO PROGRESSION ───
  cardio: {
    1: {
      weeks: [1, 4],
      stepTarget: { start: 3000, end: 5000, weeklyIncrement: 500 },
      liss: {
        sessionsPerWeek: 1,
        durationMin: 20,
        intensity: "low",
        notes: "Post-workout on Day C only — incline walk or bike"
      },
      hiit: { allowed: false, reason: "Body not adapted, back recovery priority" },
      forbidden: ["running", "stairmaster", "rowing", "football", "jumping", "hiit"],
      rationale: "Walking + weights only. Let the body adapt before adding intensity."
    },
    2: {
      weeks: [5, 12],
      stepTarget: { start: 5000, end: 7000, weeklyIncrement: 500 },
      liss: {
        sessionsPerWeek: 2,
        durationMin: 30,
        intensity: "moderate",
        heartRateRange: [120, 140],
        notes: "1x post-Day C, 1x separate weekend session (bike / long walk)"
      },
      hiit: { allowed: false, reason: "Wait until body composition improves" },
      forbidden: ["football", "stairmaster", "heavy_plyometrics"],
      rationale: "Real fat burn phase. Cardio supplements deficit, doesn't replace it."
    },
    3: {
      weeks: [13, 20],
      stepTarget: { start: 7000, end: 10000, weeklyIncrement: 500 },
      liss: {
        sessionsPerWeek: 2,
        durationMin: 35,
        intensity: "moderate"
      },
      hiit: {
        allowed: true,
        sessionsPerWeek: 1,
        durationMin: 15,
        format: "30s hard / 60s easy × 8-10",
        notes: "Separate day from heavy lifting — back needs recovery"
      },
      football: {
        allowed: true,
        startWeek: 13,
        progression: [
          { weeks: [13, 14], mode: "solo_technique", durationMin: 30, note: "Passes, shots, ball control only" },
          { weeks: [15, 16], mode: "light_jog_ball", durationMin: 30, note: "Jogging with ball, no matches" },
          { weeks: [17, 20], mode: "small_sided", durationMin: 45, note: "5v5 or 6v6 halı saha, controlled" }
        ]
      },
      rationale: "Shaping phase. Body is 80kg±, back strong enough for dynamic movement."
    },
    4: {
      weeks: [21, 26],
      stepTarget: { start: 8000, end: 10000, weeklyIncrement: 0 },
      liss: {
        sessionsPerWeek: 2,
        durationMin: 30,
        intensity: "moderate"
      },
      hiit: { allowed: true, sessionsPerWeek: 1, durationMin: 15 },
      football: { allowed: true, mode: "normal", note: "Full matches OK" },
      rationale: "Maintenance. Habits locked in. Enjoy the body you built."
    }
  },

  // ─── DAILY HABITS CHECKLIST ───
  habits: {
    1: {
      morning: [
        { id: "water", label: "500ml water on wake", icon: "water" },
        { id: "supp_am", label: "D3+K2, Omega-3", icon: "pill" },
        { id: "core_routine", label: "5min core routine (dead bug, bird dog, glute bridge)", icon: "yoga" }
      ],
      throughout: [
        { id: "posture", label: "Stand/walk 2min every hour", icon: "chair" },
        { id: "water_total", label: "2.5L+ water", icon: "water" }
      ],
      evening: [
        { id: "supp_pm", label: "Magnesium, B12", icon: "pill" },
        { id: "sleep", label: "7+ hours sleep", icon: "moon" },
        { id: "no_screen", label: "Screens off 30min before bed", icon: "phone_off" }
      ],
      weekly: [
        { id: "weigh_in", label: "Monday morning fasted weigh-in", icon: "scale", day: 1 },
        { id: "photo", label: "Progress photo (same light, same pose)", icon: "camera", day: 1 },
        { id: "measurements", label: "Waist, chest, arm", icon: "ruler", day: 1, biweekly: true }
      ]
    },
    2: {
      morning: [
        { id: "water", label: "500ml water on wake", icon: "water" },
        { id: "supp_am", label: "D3+K2, Omega-3", icon: "pill" },
        { id: "core_routine", label: "5min core routine", icon: "yoga" }
      ],
      throughout: [
        { id: "logbook", label: "Log training weights", icon: "book" },
        { id: "water_total", label: "2.5L+ water", icon: "water" }
      ],
      evening: [
        { id: "supp_pm", label: "Magnesium, B12", icon: "pill" },
        { id: "sleep", label: "7+ hours sleep", icon: "moon" }
      ],
      weekly: [
        { id: "weigh_in", label: "Monday morning fasted weigh-in", icon: "scale", day: 1 },
        { id: "photo", label: "Progress photo", icon: "camera", day: 1 },
        { id: "measurements", label: "Body measurements", icon: "ruler", day: 1, biweekly: true },
        { id: "refeed", label: "Refeed day (every 14d — maintenance kcal)", icon: "plate", biweekly: true }
      ]
    },
    3: {
      morning: [
        { id: "water", label: "500ml water on wake", icon: "water" },
        { id: "supp_am", label: "D3+K2, Omega-3", icon: "pill" }
      ],
      throughout: [
        { id: "logbook", label: "Log training weights", icon: "book" },
        { id: "water_total", label: "3L+ water", icon: "water" }
      ],
      evening: [
        { id: "supp_pm", label: "Magnesium, B12", icon: "pill" },
        { id: "sleep", label: "7-8 hours sleep", icon: "moon" }
      ],
      weekly: [
        { id: "weigh_in", label: "Monday morning fasted weigh-in", icon: "scale", day: 1 },
        { id: "photo", label: "Progress photo", icon: "camera", day: 1 },
        { id: "measurements", label: "Body measurements", icon: "ruler", day: 1 },
        { id: "refeed", label: "Refeed day (weekly — maintenance kcal)", icon: "plate" }
      ]
    },
    4: {
      morning: [
        { id: "water", label: "500ml water on wake", icon: "water" },
        { id: "supp_am", label: "D3+K2, Omega-3", icon: "pill" }
      ],
      throughout: [
        { id: "logbook", label: "Log training weights", icon: "book" }
      ],
      evening: [
        { id: "supp_pm", label: "Magnesium, B12", icon: "pill" },
        { id: "sleep", label: "7-8 hours sleep", icon: "moon" }
      ],
      weekly: [
        { id: "weigh_in", label: "Weekly average weight (not daily)", icon: "scale" },
        { id: "reverse_diet", label: "Reverse diet: +100 kcal this week", icon: "trend_up" }
      ]
    }
  },

  // ─── INJURY / RESTRICTION FLAGS ───
  restrictions: {
    lowerBack: {
      activeInPhases: [1],
      description: "Lower back stiffness — protocol adjusted until body adapts",
      rules: [
        "No deadlifts in Phase 1 — use Hip Thrust",
        "No Romanian Deadlift in Phase 1 — use Seated Leg Curl",
        "No free-weight squats in Phase 1 — use Leg Press",
        "Seated Overhead Press (machine) instead of standing",
        "Daily 5min core routine: dead bug, bird dog, glute bridge",
        "Lumbar support cushion at desk",
        "Pillow between knees when sleeping",
        "No running, jumping, or football until Phase 3",
        "See Hausarzt if pain radiates, numbness, or night pain"
      ],
      warningSymptoms: [
        "Pain radiating to leg",
        "Numbness or tingling",
        "Leg weakness",
        "Night pain that wakes you",
        "Bowel/bladder issues"
      ]
    }
  },

  // ─── WEEKLY CHECKPOINTS (Monday morning) ───
  weeklyCheckpoint: {
    order: [
      { id: "weight", label: "Fasted weight (kg)", type: "number" },
      { id: "photo_front", label: "Front photo", type: "photo" },
      { id: "photo_side", label: "Side photo", type: "photo" },
      { id: "photo_back", label: "Back photo", type: "photo" },
      { id: "waist", label: "Waist at navel (cm)", type: "number", biweekly: true },
      { id: "chest", label: "Chest (cm)", type: "number", biweekly: true },
      { id: "arm", label: "Arm flexed (cm)", type: "number", biweekly: true },
      { id: "energy", label: "Energy level (1-5)", type: "scale" },
      { id: "sleep_quality", label: "Sleep quality (1-5)", type: "scale" },
      { id: "motivation", label: "Motivation (1-5)", type: "scale" },
      { id: "adherence_pct", label: "Plan adherence this week (%)", type: "percent" },
      { id: "notes", label: "What worked / what struggled", type: "text" }
    ],
    reminderText: "Monday morning — fasted, after bathroom, before any food or coffee."
  },

  // ─── PLATEAU PROTOCOL ───
  plateau: {
    triggerDays: 14,
    description: "If scale doesn't move for 2+ weeks",
    steps: [
      "1 week at maintenance kcal (2200) — diet break",
      "Re-check adherence honestly (weigh food, no untracked bites)",
      "Verify protein hitting target",
      "Check sleep (<7h tanks fat loss)",
      "Resume deficit — expect whoosh in week after break"
    ]
  },

  // ─── 80% RULE ───
  adherenceRule: {
    principle: "Be consistent, not perfect",
    target: 80,
    message: "Hit the plan 80% of the week → results come. Miss a day, resume next day. Don't spiral."
  }
};

// ─── Helpers ───
const phaseFromWeek = (weekNum) =>
  weekNum <= 4 ? 1 : weekNum <= 12 ? 2 : weekNum <= 20 ? 3 : 4;

export const getCardioProtocol = (weekNum) => PROTOCOLS.cardio[phaseFromWeek(weekNum)];

export const getHabitsForPhase = (weekNum) => PROTOCOLS.habits[phaseFromWeek(weekNum)];

export const getActiveRestrictions = (weekNum) => {
  const phaseId = phaseFromWeek(weekNum);
  return Object.entries(PROTOCOLS.restrictions)
    .filter(([, r]) => r.activeInPhases.includes(phaseId))
    .map(([key, r]) => ({ key, ...r }));
};

export const isFootballAllowed = (weekNum) => {
  const cardio = getCardioProtocol(weekNum);
  return cardio?.football?.allowed === true;
};

export const getFootballMode = (weekNum) => {
  const cardio = getCardioProtocol(weekNum);
  if (!cardio?.football?.allowed) return null;
  if (cardio.football.mode === "normal") return { mode: "normal", note: cardio.football.note };
  const prog = cardio.football.progression?.find(
    (p) => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]
  );
  return prog || null;
};

// Returns step target for a given week (interpolated within phase range)
export const getStepTarget = (weekNum) => {
  const cardio = getCardioProtocol(weekNum);
  if (!cardio?.stepTarget) return null;
  const { start, end, weeklyIncrement } = cardio.stepTarget;
  const phaseStartWeek = cardio.weeks[0];
  const weeksInPhase = weekNum - phaseStartWeek;
  const target = Math.min(end, start + weeksInPhase * weeklyIncrement);
  return target;
};
