import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { getPushStatus, subscribeToPush, unsubscribeFromPush, sendTestPush, pushSupported } from "../lib/notify";
import { AccentCard, PageCommand } from "../components/ui";

const numberOrBlank = (value) => value === "" ? "" : Number(value);
const numberOrNull = (value) => value === "" || value == null || Number.isNaN(Number(value)) ? null : Number(value);

const DEFAULT_PREFS = {
  quote_enabled: 1,
  workout_enabled: 1,
  meal_enabled: 1,
  supp_enabled: 1,
  cardio_enabled: 1,
  routine_enabled: 0,
  family_enabled: 0,
  sleep_enabled: 1
};

const PREF_ROWS = [
  { key: "quote_enabled", label: "Daily quote", sub: "07:00 motivation" },
  { key: "workout_enabled", label: "Training", sub: "Check-in, gym prep and workout blocks" },
  { key: "meal_enabled", label: "Meals", sub: "Split meals, OMAD and nutrition windows" },
  { key: "supp_enabled", label: "Supplements", sub: "Morning and evening supplement blocks" },
  { key: "cardio_enabled", label: "Cardio", sub: "Walks, LISS, HIIT and football blocks" },
  { key: "sleep_enabled", label: "Sleep", sub: "Bedtime target and wind-down" },
  { key: "routine_enabled", label: "Routine", sub: "Wake-up, commute, prep and transitions" },
  { key: "family_enabled", label: "Family", sub: "Kids and family blocks" }
];

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout, refresh } = useAuth();
  const [pushStatus, setPushStatus] = useState("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    start_date: user?.start_date || "2026-04-20",
    start_weight: user?.start_weight || 93,
    target_weight: user?.target_weight || 73,
    height_cm: user?.height_cm || 177
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => { getPushStatus().then(setPushStatus); }, []);
  useEffect(() => {
    api.get("/push/prefs").then((p) => setPrefs({ ...DEFAULT_PREFS, ...p })).catch(() => {});
  }, []);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 1500);
  };

  const onPushEnable = async () => {
    setPushBusy(true);
    try { setPushStatus(await subscribeToPush()); }
    catch (e) { setPushStatus(e.message || "denied"); }
    finally { setPushBusy(false); }
  };

  const onPushDisable = async () => {
    setPushBusy(true);
    try { await unsubscribeFromPush(); setPushStatus("default"); }
    finally { setPushBusy(false); }
  };

  const onPushTest = async () => { try { await sendTestPush(); } catch {} };

  const togglePref = async (key) => {
    const next = { ...DEFAULT_PREFS, ...prefs, [key]: prefs[key] ? 0 : 1 };
    setPrefs(next);
    setPrefsBusy(true);
    try { await api.put("/push/prefs", next); }
    finally { setPrefsBusy(false); }
  };

  const save = async () => {
    await api.put("/auth/me", {
      ...form,
      start_weight: numberOrNull(form.start_weight),
      target_weight: numberOrNull(form.target_weight),
      height_cm: numberOrNull(form.height_cm)
    });
    await refresh();
    flash(t("settings.saved"));
  };

  return (
    <div className="page page-settings">
      <PageCommand
        accent="#64d2ff"
        kicker="system setup"
        title="Settings"
      />

      <div className="section-label">{t("settings.profile")}</div>
      <AccentCard accent="#64d2ff" className="p-4" contentClassName="pl-2 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("auth.name")}</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">{t("settings.start_date")}</span>
          <input className="input mono" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[["start_weight", "start_weight", "kg"], ["target_weight", "target_weight", "kg"], ["height_cm", "height", "cm"]].map(([k, tk, unit]) => (
            <label key={k} className="flex flex-col gap-1 justify-end">
              <span className="mono text-[.62rem] text-mute uppercase tracking-[.14em] leading-tight flex flex-col">
                <span>{t(`settings.${tk}`)}</span>
                <span className="text-mute/60">({unit})</span>
              </span>
              <input className="input mono" type="number" step="0.1" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: numberOrBlank(e.target.value) })} />
            </label>
          ))}
        </div>
        <button className="btn-primary" onClick={save}>{t("settings.save")}</button>
        {msg && <div className="mono text-xs text-signal text-center">{msg}</div>}
      </AccentCard>

      {pushSupported() && (
        <>
          <div className="section-label">Notifications</div>
          <AccentCard accent="#30d158" contentClassName="pl-2 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="mono text-[.62rem] text-ink2 uppercase tracking-[.14em]">coach mode</div>
                <div className="mono text-[.58rem] text-mute uppercase tracking-[.14em] mt-[2px]">
                  schedule starts · high-value reminders first
                </div>
              </div>
              <div className="mono text-[.58rem] uppercase tracking-[.14em]"
                style={{ color: pushStatus === "subscribed" ? "#4ade80" : pushStatus === "denied" ? "#fb7185" : "#6d6d70" }}>
                {pushStatus === "subscribed" ? "on" : pushStatus === "denied" ? "blocked" : "off"}
              </div>
            </div>
            {pushStatus === "subscribed" ? (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn" onClick={onPushTest} disabled={pushBusy}>send test</button>
                <button className="btn text-warn" onClick={onPushDisable} disabled={pushBusy}>disable</button>
              </div>
            ) : pushStatus === "denied" ? (
              <div className="mono text-[.64rem] text-warn">Blocked in browser settings.</div>
            ) : (
              <button className="btn-primary" onClick={onPushEnable} disabled={pushBusy}>
                {pushBusy ? "..." : "enable push"}
              </button>
            )}
          </AccentCard>

          {pushStatus === "subscribed" && (
            <>
              <div className="section-label">Reminder Groups</div>
              <AccentCard accent="#bf5af2" contentClassName="pl-2 flex flex-col gap-[2px]">
                {PREF_ROWS.map(({ key, label, sub }) => (
                  <label key={key} className="flex items-center justify-between gap-3 py-2 border-b border-line/40 last:border-0 cursor-pointer">
                    <div className="min-w-0">
                      <div className="text-[.78rem] text-ink">{label}</div>
                      <div className="mono text-[.58rem] text-mute uppercase tracking-[.12em] mt-[2px] leading-tight">{sub}</div>
                    </div>
                    <button
                      type="button"
                      aria-label={`${label} notifications`}
                      className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 overflow-hidden border border-line/60"
                      style={{ background: prefs[key] ? "#4ade80" : "#3a3a3c" }}
                      onClick={() => !prefsBusy && togglePref(key)}
                    >
                      <span
                        className="absolute left-0 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                        style={{ transform: prefs[key] ? "translateX(20px)" : "translateX(4px)" }}
                      />
                    </button>
                  </label>
                ))}
              </AccentCard>
            </>
          )}
        </>
      )}

      <button className="btn text-warn" onClick={logout}>{t("auth.logout")}</button>

      <div className="mono text-[.6rem] text-mute text-center mt-4 uppercase tracking-[.14em]">
        {user?.email}
      </div>
    </div>
  );
}
