import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { todayStr, getWeekNum } from "../lib/plan";
import { GYM80_AREAS, GYM80_MACHINES } from "../lib/gym80Catalog";
import { AccentCard, Icon, PageCommand } from "../components/ui";

const areaTone = (areaId) => GYM80_AREAS.find((area) => area.id === areaId)?.tone || "#64d2ff";
const GYM80_AVAILABLE_KEY = "fitapp:gym80:available";

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
  if ((counts.upper || 0) >= 3 && !(counts.lower || 0)) return "Üst gövde doldu; sıradaki gymde lower seç.";
  if ((counts.lower || 0) >= 3 && !(counts.upper || 0)) return "Bacak doldu; sıradaki gymde upper seç.";
  if (!(counts.core || 0) && doneMachines.length >= 4) return "Core/bel stabilitesi eksik kalıyor.";
  return "Denge iyi; boş kalan bölgeye göre devam.";
}

export default function Training() {
  const { t } = useTranslation();
  const [date] = useState(todayStr());
  const week = getWeekNum(date);
  const [session, setSession] = useState(null);
  const [areaFilter, setAreaFilter] = useState("recommended");
  const [query, setQuery] = useState("");
  const [availableIds, setAvailableIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(GYM80_AVAILABLE_KEY) || "[]"));
    } catch {
      return new Set();
    }
  });

  const load = async () => {
    const s = await api.get(`/training/session?date=${date}&day_type=GYM80`);
    setSession(s || null);
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
    setAvailableIds((current) => {
      const next = new Set(current);
      if (next.has(machine.id)) next.delete(machine.id);
      else next.add(machine.id);
      localStorage.setItem(GYM80_AVAILABLE_KEY, JSON.stringify([...next]));
      return next;
    });
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
