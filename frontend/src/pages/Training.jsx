import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { todayStr, getWeekNum } from "../lib/plan";
import { GYM80_MACHINES } from "../lib/gym80Catalog";
import { AccentCard, Icon, PageCommand } from "../components/ui";

const GYM80_BY_CODE = new Map(GYM80_MACHINES.map((machine) => [machine.code, machine]));

const RAW_STUDIO_CODES = [
  "3041", "3043", "3016", "5014", "3020", "3044", "3098", "3040", "3036", "5012",
  "3010", "3002", "3050", "3011", "3008", "3005", "5011", "3001", "3018", "3017",
  "4366", "4355", "4379", "4383", "4319", "4018", "4385", "3031", "4023", "4012",
  "4170", "4329", "4002", "4374", "4038", "4159n", "4314", "4384", "3031", "5014",
  "3018", "5013"
];

const resolveCode = (raw) => {
  const upper = String(raw || "").trim().toUpperCase();
  if (!upper) return null;
  if (GYM80_BY_CODE.has(upper)) return upper;
  if (GYM80_BY_CODE.has(`${upper}N`)) return `${upper}N`;
  return null;
};

const STUDIO_CODES = new Set(RAW_STUDIO_CODES.map(resolveCode).filter(Boolean));

const STUDIO_MACHINES = GYM80_MACHINES.filter((machine) => STUDIO_CODES.has(machine.code));

function buildDoneMap(sets = []) {
  const map = new Map();
  sets.forEach((set) => {
    if (!set.exercise_id) return;
    if (!map.has(set.exercise_id)) map.set(set.exercise_id, []);
    map.get(set.exercise_id).push(set.id);
  });
  return map;
}

function pickMachine(visibleMachines, usedIds, candidateCodes) {
  for (const code of candidateCodes) {
    const machine = visibleMachines.find((item) => item.code === code && !usedIds.has(item.id));
    if (machine) return machine;
  }
  return null;
}

function buildPlan(visibleMachines) {
  const sections = [
    {
      day: "Day 1",
      title: "Push A",
      focus: "chest / shoulders / triceps / core",
      slots: [
        { label: "chest", codes: ["3041", "3016", "4329N", "5014", "5901", "3014"] },
        { label: "shoulders", codes: ["3043", "5902", "4388", "3050", "4385", "3099"] },
        { label: "triceps", codes: ["3011", "4379", "5006", "3036", "5904", "5104"] },
        { label: "core", codes: ["5012", "3037", "3008", "4342N", "4119"] }
      ]
    },
    {
      day: "Day 2",
      title: "Pull A",
      focus: "back / biceps / glute support / core",
      slots: [
        { label: "lat", codes: ["3044", "3020", "4116", "5003", "4042", "5908"] },
        { label: "row", codes: ["3040", "4319", "4018", "4383", "4900", "4016"] },
        { label: "biceps", codes: ["3098", "3010", "4355", "4366", "5004", "80CL0009"] },
        { label: "support", codes: ["5012", "3038", "4119", "5002", "4384", "4374", "3005"] }
      ]
    },
    {
      day: "Day 3",
      title: "Upper B",
      focus: "chest / back / shoulders / arms",
      slots: [
        { label: "chest", codes: ["4329N", "3041", "3016", "5014", "3014", "3097"] },
        { label: "back", codes: ["4319", "3044", "3040", "4018", "4383", "4340"] },
        { label: "shoulders", codes: ["3043", "5902", "4385", "3050", "5015", "4388"] },
        { label: "arms", codes: ["3011", "4379", "4366", "4355", "5006", "5104"] }
      ]
    },
    {
      day: "Day 4",
      title: "Pull B",
      focus: "back / shoulders / glute support / core",
      slots: [
        { label: "back", codes: ["3044", "4319", "4018", "4383", "4340", "5003"] },
        { label: "delts", codes: ["5015", "5014", "3043", "3050", "4385", "3099"] },
        { label: "touch", codes: ["3017", "3036", "5904", "3011", "4379", "3016"] },
        { label: "support", codes: ["5012", "3038", "4119", "5002", "4384", "4374", "3005"] }
      ]
    }
  ];

  return sections.map((section) => {
    const usedIds = new Set();
    const machines = section.slots
      .map((slot) => {
        const machine = pickMachine(visibleMachines, usedIds, slot.codes);
        if (!machine) return null;
        usedIds.add(machine.id);
        return { ...slot, machine };
      })
      .filter(Boolean);
    return { ...section, machines };
  });
}

function focusLine(doneMachines) {
  if (doneMachines.length === 0) return "Bugün ilk üst vücut makinesini seç.";
  const counts = doneMachines.reduce((acc, machine) => {
    if (machine.area === "upper") acc.upper += 1;
    if (machine.area === "core" || (machine.muscles || []).includes("lower_back")) acc.support += 1;
    return acc;
  }, { upper: 0, support: 0 });
  if (counts.upper >= 4) return "Upper hacmi iyi; bir sonraki seans açı değiştir.";
  if (counts.support >= 2) return "Core ve support da doluyor; denge iyi.";
  return "Chest, back, shoulders ve arms dengesini koru.";
}

export default function Training() {
  const [date] = useState(todayStr());
  const week = getWeekNum(date);
  const [session, setSession] = useState(null);

  const load = async () => {
    const s = await api.get(`/training/session?date=${date}&day_type=GYM80`);
    setSession(s || null);
  };

  useEffect(() => {
    load();
  }, [date]);

  const studioMachines = STUDIO_MACHINES;

  const doneSetIdsByMachine = useMemo(() => buildDoneMap(session?.sets || []), [session]);
  const doneIds = useMemo(() => new Set([...doneSetIdsByMachine.keys()]), [doneSetIdsByMachine]);
  const sessionSetIds = useMemo(() => (session?.sets || []).map((set) => set.id), [session]);

  const doneMachines = useMemo(
    () => studioMachines.filter((machine) => doneIds.has(machine.id)),
    [studioMachines, doneIds]
  );

  const planDays = useMemo(() => buildPlan(studioMachines), [studioMachines]);
  const allDaysDone = planDays.length > 0 && planDays.every((day) => day.machines.length > 0 && day.machines.every(({ machine }) => doneIds.has(machine.id)));

  const areaCounts = useMemo(() => {
    const counts = { upper: 0, core: 0, support: 0 };
    doneMachines.forEach((machine) => {
      if (machine.area === "upper") counts.upper += 1;
      if (machine.area === "core") counts.core += 1;
      if (machine.area === "core" || (machine.muscles || []).includes("glutes") || (machine.muscles || []).includes("lower_back")) {
        counts.support += 1;
      }
    });
    return counts;
  }, [doneMachines]);

  const toggleMachine = async (machine) => {
    if (!session) return;
    const existingIds = doneSetIdsByMachine.get(machine.id) || [];
    if (existingIds.length > 0) {
      await Promise.all(existingIds.map((id) => api.del(`/training/set/${id}`)));
      load();
      return;
    }
    await api.post(`/training/session/${session.id}/set`, {
      exercise_id: machine.id,
      exercise_name: `${machine.code} ${machine.name}`,
      set_number: 1,
      weight_kg: null,
      reps: null
    });
    load();
  };

  const toggleDay = async (day) => {
    if (!session || day.machines.length === 0) return;
    const complete = day.machines.every(({ machine }) => doneIds.has(machine.id));
    const relevantSetIds = day.machines.flatMap(({ machine }) => doneSetIdsByMachine.get(machine.id) || []);
    if (complete) {
      await Promise.all(relevantSetIds.map((id) => api.del(`/training/set/${id}`)));
      load();
      return;
    }
    const missing = day.machines.filter(({ machine }) => !doneIds.has(machine.id));
    await Promise.all(missing.map(({ machine }) => api.post(`/training/session/${session.id}/set`, {
      exercise_id: machine.id,
      exercise_name: `${machine.code} ${machine.name}`,
      set_number: 1,
      weight_kg: null,
      reps: null
    })));
    load();
  };

  const resetAll = async () => {
    if (!session) return;
    await Promise.all(sessionSetIds.map((id) => api.del(`/training/set/${id}`)));
    load();
  };

  return (
    <div className="page page-training">
      <PageCommand
        accent="#30d158"
        kicker="gym80 logbook"
        title="Gym plan"
        sub={focusLine(doneMachines)}
        metrics={[
          { label: "done", value: doneMachines.length, className: "text-lime" },
          { label: "upper", value: areaCounts.upper || 0, className: "text-cyan" },
          { label: "core", value: areaCounts.core || 0, className: "text-amber" },
          { label: "gym", value: studioMachines.length, className: "text-amber" }
        ]}
      />

      <AccentCard accent="#64d2ff" className="p-3" contentClassName="pl-2 flex flex-col gap-3">
        <div className="section-label mt-0 mb-0">4-day upper rotation</div>
        <div className="mono text-[.58rem] text-mute uppercase tracking-[.12em]">
          chest / back / shoulders / arms x2, glute + core support
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {planDays.map((day) => (
            <div
              key={day.day}
              className={`rounded-lg border p-3 transition ${day.machines.length > 0 && day.machines.every(({ machine }) => doneIds.has(machine.id)) ? "border-lime/60 bg-lime/10" : "border-line bg-bg2/70"}`}
            >
              <button type="button" className="w-full text-left" onClick={() => toggleDay(day)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="mono text-[.6rem] text-cyan uppercase tracking-[.14em]">{day.day}</div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="mono text-[.55rem] text-mute uppercase tracking-[.12em] truncate">{day.title}</div>
                    <Icon.check size={12} className={day.machines.length > 0 && day.machines.every(({ machine }) => doneIds.has(machine.id)) ? "text-lime" : "text-mute opacity-30"} />
                  </div>
                </div>
                <div className="text-xs text-ink2 mt-1">{day.focus}</div>
                <div className="mono text-[.54rem] text-mute uppercase tracking-[.12em] mt-1">
                  {day.machines.filter(({ machine }) => doneIds.has(machine.id)).length}/{day.machines.length} checked
                </div>
              </button>
              <div className="mt-3 flex flex-col gap-1.5">
                {day.machines.map(({ label, machine }) => (
                  <button
                    key={`${day.day}-${label}-${machine.id}`}
                    type="button"
                    onClick={() => toggleMachine(machine)}
                    className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left transition ${doneIds.has(machine.id) ? "border-lime/50 bg-lime/10" : "border-line/80 bg-bg/60 hover:border-signal/50"}`}
                  >
                    <div className="min-w-0">
                      <div className="mono text-[.55rem] uppercase tracking-[.12em] text-mute shrink-0">{label}</div>
                      <div className="text-[.62rem] text-ink text-left truncate" title={`${machine.code} ${machine.name}`}>
                        {machine.code} · {machine.name}
                      </div>
                    </div>
                    <Icon.check size={12} className={doneIds.has(machine.id) ? "text-lime shrink-0" : "text-mute opacity-25 shrink-0"} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>

      {allDaysDone && (
        <AccentCard accent="#30d158" className="p-3" contentClassName="pl-2 flex items-center justify-between gap-3">
          <div>
            <div className="section-label mt-0 mb-1">all done</div>
            <div className="mono text-[.62rem] text-mute uppercase tracking-[.12em]">hepsi yeşil. reset ile yeniden seçebilirsin.</div>
          </div>
          <button className="btn-primary shrink-0" type="button" onClick={resetAll}>
            Reset
          </button>
        </AccentCard>
      )}

      {doneMachines.length > 0 && (
        <AccentCard accent="#30d158" className="p-3" contentClassName="pl-2">
          <div className="section-label mt-0 mb-2">today</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {doneMachines.map((machine) => (
              <button
                key={machine.id}
                type="button"
                className="chip chip-muscle shrink-0"
                onClick={() => toggleMachine(machine)}
              >
                <Icon.check size={12} /> {machine.code}
              </button>
            ))}
          </div>
        </AccentCard>
      )}

    </div>
  );
}
