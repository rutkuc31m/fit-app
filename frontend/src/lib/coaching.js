const score = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export function recoveryCoachNote(recovery = {}, fastDay = false) {
  const energy = score(recovery.energy);
  const hunger = score(recovery.hunger);
  const headache = score(recovery.headache);

  if (headache != null && headache >= 4) {
    return "Hard headache: water, salt carefully, walk only, protect sleep.";
  }
  if (energy != null && energy <= 2) {
    return fastDay
      ? "Flat energy on a fast day: no extra training, keep movement easy."
      : "Low energy: reduce load, keep reps clean, skip intensity work.";
  }
  if (hunger != null && hunger >= 4 && fastDay) {
    return "Fast-day hunger is noise. Hydrate, stay busy, do not compensate.";
  }
  if ([energy, hunger, headache].some((v) => v != null)) {
    return "Plan intact. Keep the day boring and measurable.";
  }
  return "Log recovery to get today's guardrail.";
}

export function dailyReadiness({ day, recovery = {}, mealsTotals = {}, session = null } = {}) {
  const energy = score(recovery.energy);
  const hunger = score(recovery.hunger);
  const headache = score(recovery.headache);
  const fastDay = !day?.eating?.window;
  const trainingDay = Boolean(day?.training);
  const fastBreach = fastDay && (mealsTotals.kcal || 0) > 50;

  if ((headache != null && headache >= 4) || (energy != null && energy <= 1)) {
    return {
      level: "red",
      color: "#ff453a",
      label: "recovery day",
      action: "Walk easy. Hydrate. No bonus training.",
      detail: recoveryCoachNote(recovery, fastDay)
    };
  }

  if (fastBreach) {
    return {
      level: "yellow",
      color: "#ff9f0a",
      label: "audit fast",
      action: "Stop the bleed. Return to water, coffee, sleep.",
      detail: "Fast-day calories are logged. Do not chase with extra cardio."
    };
  }

  if ((headache != null && headache >= 3) || (energy != null && energy <= 2) || (hunger != null && hunger >= 5)) {
    return {
      level: "yellow",
      color: "#ff9f0a",
      label: "hold back",
      action: trainingDay ? "Train lighter. Skip HIIT. Keep form strict." : "Keep steps easy. No intensity.",
      detail: recoveryCoachNote(recovery, fastDay)
    };
  }

  if (session?.completed) {
    return {
      level: "green",
      color: "#30d158",
      label: "done",
      action: "Training is logged. Finish food, water, sleep.",
      detail: "No need to add work."
    };
  }

  return {
    level: "green",
    color: fastDay ? "#64d2ff" : "#30d158",
    label: fastDay ? "fast guardrail" : "plan intact",
    action: fastDay ? "Zero calories. Easy walk only." : "Run the plan exactly.",
    detail: recoveryCoachNote(recovery, fastDay)
  };
}

export function trainingAdjustment(recovery = {}) {
  const energy = score(recovery.energy);
  const headache = score(recovery.headache);

  if ((headache != null && headache >= 4) || (energy != null && energy <= 1)) {
    return {
      tone: "text-coral",
      label: "recovery override",
      note: "Skip hard work today. Walk only, hydrate, sleep."
    };
  }
  if ((headache != null && headache >= 3) || (energy != null && energy <= 2)) {
    return {
      tone: "text-amber",
      label: "reduce load",
      note: "Use 90% load, leave 2 reps in reserve, skip HIIT."
    };
  }
  return {
    tone: "text-lime",
    label: "normal load",
    note: "Progress if reps are clean. Do not add bonus volume."
  };
}
