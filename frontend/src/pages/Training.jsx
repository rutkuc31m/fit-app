import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { todayStr, getWeekNum } from "../lib/plan";
import { GYM80_AREAS, GYM80_MACHINES } from "../lib/gym80Catalog";
import { AccentCard, Icon, PageCommand } from "../components/ui";

const areaTone = (areaId) => GYM80_AREAS.find((area) => area.id === areaId)?.tone || "#64d2ff";
const GYM80_AVAILABLE_KEY = "fitapp:gym80:available";
const GYM80_BY_CODE = new Map(GYM80_MACHINES.map((machine) => [machine.code, machine]));

const machineFromCode = (code) => GYM80_BY_CODE.get(code);

const PROGRAM_TEMPLATES = {
  3: [
    {
      day: "Day 1",
      title: "Push",
      focus: "chest · shoulders · triceps",
      codes: ["3016", "3023N", "3043", "3050", "3011", "5901"]
    },
    {
      day: "Day 2",
      title: "Pull",
      focus: "lats · rows · biceps",
      codes: ["3044", "3040", "4319", "4340", "3012N", "3098"]
    },
    {
      day: "Day 3",
      title: "Glute/Core",
      focus: "glutes · abs · lower back",
      codes: ["3028", "5012", "3038", "4119", "3008", "3037"]
    }
  ],
  4: [
    {
      day: "Day 1",
      title: "Push",
      focus: "chest · shoulders · triceps",
      codes: ["3016", "3023N", "3043", "3050", "3011", "5904"]
    },
    {
      day: "Day 2",
      title: "Pull",
      focus: "lats · row · biceps",
      codes: ["3044", "3040", "4319", "4340", "3012N", "3098"]
    },
    {
      day: "Day 3",
      title: "Chest",
      focus: "flat · incline · fly",
      codes: ["3041", "3042", "3014", "3097", "5909", "4364"]
    },
    {
      day: "Day 4",
      title: "Glute/Core",
      focus: "glutes · abs · back support",
      codes: ["3028", "5012", "3038", "4119", "3008", "3037"]
    }
  ],
  5: [
    {
      day: "Day 1",
      title: "Push A",
      focus: "chest first",
      codes: ["3016", "3023N", "3043", "3050", "3011", "5901"]
    },
    {
      day: "Day 2",
      title: "Pull A",
      focus: "back thickness",
      codes: ["3044", "3040", "4319", "4340", "3012N", "3098"]
    },
    {
      day: "Day 3",
      title: "Chest B",
      focus: "press · incline · fly",
      codes: ["3041", "3042", "3014", "3097", "5909", "4364"]
    },
    {
      day: "Day 4",
      title: "Shoulders",
      focus: "delts · rear delts · press",
      codes: ["3043", "3050", "3099", "5014", "4385", "4388"]
    },
    {
      day: "Day 5",
      title: "Glute/Core",
      focus: "glutes · abs · lower back",
      codes: ["3028", "5012", "3038", "4119", "3010", "3011"]
    }
  ]
};

const buildProgram = (days, availableIds) =>
  (PROGRAM_TEMPLATES[days] || PROGRAM_TEMPLATES[3]).map((slot) => ({
    ...slot,
    machines: slot.codes
      .map((code) => machineFromCode(code))
      .filter(Boolean)
      .map((machine) => ({
        ...machine,
        available: availableIds.has(machine.id)
      }))
  }));

const readLocalAvailableIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(GYM80_AVAILABLE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const writeLocalAvailableIds = (ids) => {
  try {
    localStorage.setItem(GYM80_AVAILABLE_KEY, JSON.stringify([...ids]));
  } catch {}
};

function buildDoneMap(sets = []) {
  const map = new Map();
  sets.forEach((set) => {
    if (!set.exercise_id) return;
    if (!map.has(set.exercise_id)) map.set(set.exercise_id, []);
    map.get(set.exercise_id).push(set.id);
  });
  return map;
}

function focusLine(doneMachines) {
  if (doneMachines.length === 0) return "Bugün ilk makineyi seç.";
  const counts = doneMachines.reduce((acc, machine) => {
    acc[machine.area] = (acc[machine.area] || 0) + 1;
    return acc;
  }, {});
  if ((counts.upper || 0) >= 4) return "Upper volume iyi; bir sonraki sefer açı değiştir.";
  if (doneMachines.length >= 5) return "Denge iyi; chest, back, shoulders ve glutes arasında ilerle.";
  return "Hips-up odaklı devam; chest, back, shoulders, arms ve glutes dengesini koru.";
}

function ProgramCard({ days, availableIds, onDaysChange }) {
  const program = useMemo(() => buildProgram(days, availableIds), [days, availableIds]);

  return (
    <AccentCard accent="#bf5af2" className="p-3" contentClassName="pl-2 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="section-label mt-0 mb-1">recommended program</div>
          <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em]">hips-up · glutes/core included · starred machines highlighted</div>
        </div>
        <div className="flex items-center gap-1">
          {[3, 4, 5].map((count) => (
            <button
              key={count}
              type="button"
              className={`h-8 min-w-8 px-3 rounded-md border mono text-[.62rem] transition ${
                days === count ? "border-violet-400/70 bg-violet-400/10 text-ink" : "border-line bg-bg2 text-mute hover:border-line2"
              }`}
              onClick={() => onDaysChange(count)}
            >
              {count}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        {program.map((slot, idx) => (
          <div key={slot.day} className="soft-band px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mono text-[.58rem] text-cyan uppercase tracking-[.14em]">{slot.day}</div>
                <div className="font-display text-[1.05rem] text-ink leading-none mt-[2px]">{slot.title}</div>
                <div className="mono text-[.56rem] text-mute uppercase tracking-[.12em] mt-1">{slot.focus}</div>
              </div>
              <div className="mono text-[.54rem] text-mute uppercase tracking-[.14em]">#{idx + 1}</div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {slot.machines.map((machine) => (
              <div
                key={machine.id}
                className={`rounded-md border px-2 py-1.5 min-w-0 ${
                    machine.available ? "border-lime/40 bg-lime/10" : "border-line bg-bg2/70"
                }`}
              >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`mono text-[.56rem] shrink-0 ${machine.available ? "text-lime" : "text-cyan"}`}>
                      {machine.code}
                    </span>
                    <span className="mono text-[.58rem] text-ink2 truncate">{machine.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AccentCard>
  );
}

export default function Training() {
  const { t } = useTranslation();
  const [date] = useState(todayStr());
  const week = getWeekNum(date);
  const [session, setSession] = useState(null);
  const [areaFilter, setAreaFilter] = useState("recommended");
  const [query, setQuery] = useState("");
  const [availableIds, setAvailableIds] = useState(() => readLocalAvailableIds());
  const [programDays, setProgramDays] = useState(3);

  const load = async () => {
    const [s, remoteFavorites] = await Promise.all([
      api.get(`/training/session?date=${date}&day_type=GYM80`),
      api.get("/training/favorite-machines").catch(() => [])
    ]);
    setSession(s || null);

    const remoteIds = new Set((remoteFavorites || []).map((row) => row.machine_id).filter(Boolean));
    const localIds = readLocalAvailableIds();

    if (remoteIds.size === 0 && localIds.size > 0) {
      const machinesToSync = GYM80_MACHINES.filter((machine) => localIds.has(machine.id));
      await Promise.all(machinesToSync.map((machine) => api.post("/training/favorite-machines", {
        machine_id: machine.id,
        code: machine.code,
        name: machine.name,
        series: machine.series,
        area: machine.area,
        muscles: machine.muscles || []
      }).catch(() => null)));
      setAvailableIds(localIds);
      writeLocalAvailableIds(localIds);
      return;
    }

    setAvailableIds(remoteIds);
    writeLocalAvailableIds(remoteIds);
  };

  useEffect(() => { load(); }, [date]);

  const doneSetIdsByMachine = useMemo(() => buildDoneMap(session?.sets || []), [session]);
  const doneIds = useMemo(() => new Set(doneSetIdsByMachine.keys()), [doneSetIdsByMachine]);
  const doneMachines = useMemo(
    () => GYM80_MACHINES.filter((machine) => doneIds.has(machine.id)),
    [doneIds]
  );

  const areaCounts = useMemo(() => {
    const counts = { upper: 0, lower: 0, core: 0, full: 0 };
    doneMachines.forEach((machine) => { counts[machine.area] = (counts[machine.area] || 0) + 1; });
    return counts;
  }, [doneMachines]);

  const filteredMachines = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return GYM80_MACHINES.filter((machine) => {
      if (areaFilter === "available" && !availableIds.has(machine.id)) return false;
      if (areaFilter === "recommended" && !machine.recommended) return false;
      if (!["all", "recommended", "available"].includes(areaFilter) && machine.area !== areaFilter) return false;
      if (!needle) return true;
      return [machine.code, machine.name, machine.series, machine.area, ...(machine.muscles || [])]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [areaFilter, availableIds, query]);

  const toggleAvailable = (machine) => {
    const next = new Set(availableIds);
    const isOn = next.has(machine.id);
    if (isOn) next.delete(machine.id);
    else next.add(machine.id);
    setAvailableIds(next);
    writeLocalAvailableIds(next);
    if (isOn) {
      api.del(`/training/favorite-machines/${encodeURIComponent(machine.id)}`).catch(() => null);
    } else {
      api.post("/training/favorite-machines", {
        machine_id: machine.id,
        code: machine.code,
        name: machine.name,
        series: machine.series,
        area: machine.area,
        muscles: machine.muscles || []
      }).catch(() => null);
    }
  };

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

  const complete = async () => {
    if (!session) return;
    await api.put(`/training/session/${session.id}`, { completed: 1 });
    load();
  };

  const renderMachineCard = (machine) => {
    const done = doneIds.has(machine.id);
    const available = availableIds.has(machine.id);
    return (
      <AccentCard
        key={machine.id}
        accent={done ? "#30d158" : areaTone(machine.area)}
        className={`p-3 transition ${done ? "border-lime/70 bg-lime/10" : "hover:border-line2"}`}
        contentClassName="pl-2"
      >
        <div className="w-full flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${done ? "border-lime/60 bg-lime/15 text-lime" : "border-line bg-bg2 text-mute"}`}>
            {done ? <Icon.check size={17} /> : <Icon.plus size={17} />}
          </div>
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => toggleMachine(machine)}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="mono text-[.6rem] text-cyan uppercase tracking-[.14em] shrink-0">{machine.code}</div>
              <div className="mono text-[.55rem] text-mute uppercase tracking-[.12em] truncate">{machine.series}</div>
            </div>
            <div className="text-sm text-ink font-semibold leading-snug mt-[2px] truncate">{machine.name}</div>
            <div className="mono text-[.56rem] text-ink2 uppercase tracking-[.12em] mt-[3px] truncate">
              {available ? "in gym · " : ""}{machine.recommended ? "recommended · " : ""}{machine.area} · {(machine.muscles || []).slice(0, 4).join(" · ")}
            </div>
          </button>
          <button
            type="button"
            className={`btn-icon shrink-0 ${available ? "text-amber border-amber/50 bg-amber/10" : "text-mute"}`}
            onClick={() => toggleAvailable(machine)}
            aria-label="mark machine in gym"
            title="mark machine in gym"
          >
            <Icon.star size={15} fill={available ? "currentColor" : "none"} />
          </button>
        </div>
      </AccentCard>
    );
  };

  return (
    <div className="page page-training">
      <PageCommand
        accent="#30d158"
        kicker="gym80 logbook"
        title="Machine tracker"
        sub={focusLine(doneMachines)}
        metrics={[
          { label: "done", value: doneMachines.length, className: "text-lime" },
          { label: "upper", value: areaCounts.upper || 0, className: "text-cyan" },
          { label: "lower", value: areaCounts.lower || 0, className: "text-lime" },
          { label: "gym", value: availableIds.size, className: "text-amber" }
        ]}
      />

      <ProgramCard
        days={programDays}
        availableIds={availableIds}
        onDaysChange={setProgramDays}
      />

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

      <AccentCard accent="#64d2ff" className="p-3" contentClassName="pl-2 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {GYM80_AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              className={`metric-tile text-center transition ${areaFilter === area.id ? "border-cyan/60 bg-cyan/10" : "hover:border-line2"}`}
              onClick={() => setAreaFilter(area.id)}
            >
              <div className="metric-value text-[.72rem]" style={{ color: area.tone }}>{area.label}</div>
            </button>
          ))}
        </div>
        <input
          className="input mono text-sm w-full"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="search machine / muscle"
        />
      </AccentCard>

      <div className="section-label flex items-center justify-between gap-3">
        <span>gym80 machines</span>
        <span className="mono text-[.58rem] text-mute">W{String(week).padStart(2, "0")} · {filteredMachines.length}/{GYM80_MACHINES.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {filteredMachines.map(renderMachineCard)}
      </div>

      {session && (
        <button
          className={session.completed ? "btn" : "btn-primary"}
          onClick={complete}
          disabled={session.completed}
        >
          {session.completed ? <span className="inline-flex items-center gap-2 justify-center"><Icon.check size={14} /> {t("training.complete")}</span> : t("training.complete")}
        </button>
      )}
    </div>
  );
}
