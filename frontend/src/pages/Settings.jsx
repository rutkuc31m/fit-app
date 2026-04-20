import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, getToken } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { getPushStatus, subscribeToPush, unsubscribeFromPush, sendTestPush, pushSupported } from "../lib/notify";

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout, refresh } = useAuth();
  const [pushStatus, setPushStatus] = useState("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [prefs, setPrefs] = useState({ quote_enabled: 1, workout_enabled: 1, meal_enabled: 1, supp_enabled: 1 });
  const [prefsBusy, setPrefsBusy] = useState(false);

  useEffect(() => { getPushStatus().then(setPushStatus); }, []);
  useEffect(() => {
    api.get("/push/prefs").then(setPrefs).catch(() => {});
  }, []);

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
    const next = { ...prefs, [key]: prefs[key] ? 0 : 1 };
    setPrefs(next);
    setPrefsBusy(true);
    try { await api.put("/push/prefs", next); }
    finally { setPrefsBusy(false); }
  };
  const [form, setForm] = useState({
    name: user?.name || "",
    start_date: user?.start_date || "2026-04-20",
    start_weight: user?.start_weight || 93,
    target_weight: user?.target_weight || 73,
    height_cm: user?.height_cm || 177
  });
  const [msg, setMsg] = useState(null);

  const save = async () => {
    await api.put("/auth/me", form);
    await refresh();
    setMsg(t("settings.saved"));
    setTimeout(() => setMsg(null), 1500);
  };

  return (
    <div className="page page-settings">
      <div className="section-label">{t("settings.profile")}</div>
      <div className="card p-4 flex flex-col gap-3">
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
              <input className="input mono" type="number" step="0.1" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: +e.target.value })} />
            </label>
          ))}
        </div>
        <button className="btn-primary" onClick={save}>{t("settings.save")}</button>
        {msg && <div className="mono text-xs text-signal text-center">{msg}</div>}
      </div>

{pushSupported() && (
        <>
          <div className="section-label">Push Bildirimleri</div>
          <div className="card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">
                07:00 özlü söz · günlük hatırlatmalar
              </div>
              <div className="mono text-[.58rem] uppercase tracking-[.14em]"
                style={{ color: pushStatus === "subscribed" ? "#4ade80" : pushStatus === "denied" ? "#fb7185" : "#6d6d70" }}>
                {pushStatus === "subscribed" ? "on" : pushStatus === "denied" ? "blocked" : "off"}
              </div>
            </div>
            {pushStatus === "subscribed" ? (
              <div className="flex gap-2">
                <button className="btn flex-1" onClick={onPushTest} disabled={pushBusy}>send test</button>
                <button className="btn flex-1 text-warn" onClick={onPushDisable} disabled={pushBusy}>disable</button>
              </div>
            ) : pushStatus === "denied" ? (
              <div className="mono text-[.6rem] text-warn">Blocked — enable in browser settings</div>
            ) : (
              <button className="btn-primary" onClick={onPushEnable} disabled={pushBusy}>
                {pushBusy ? "…" : "enable push"}
              </button>
            )}
          </div>

          {pushStatus === "subscribed" && (
            <>
              <div className="section-label">Bildirim Kategorileri</div>
              <div className="card p-3 flex flex-col gap-[2px]">
                {[
                  { key: "quote_enabled",   label: "Günlük özlü söz",     sub: "Her sabah 07:00" },
                  { key: "workout_enabled", label: "Antrenman hatırlatmaları", sub: "Gym hazırlık · post-workout · check-in" },
                  { key: "meal_enabled",    label: "Öğün hatırlatmaları",  sub: "OMAD · oruç · düşük kalori · su" },
                  { key: "supp_enabled",    label: "Supplement & uyku",    sub: "21:00 Mg+B12 · 22:45 uyku hazırlığı" },
                ].map(({ key, label, sub }) => (
                  <label key={key} className="flex items-center justify-between py-2 border-b border-line/40 last:border-0 cursor-pointer">
                    <div>
                      <div className="text-[.76rem] text-ink">{label}</div>
                      <div className="mono text-[.58rem] text-mute uppercase tracking-[.12em] mt-[2px]">{sub}</div>
                    </div>
                    <div
                      className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
                      style={{ background: prefs[key] ? "#30d158" : "#3a3a3c" }}
                      onClick={() => !prefsBusy && togglePref(key)}
                    >
                      <div
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                        style={{ transform: prefs[key] ? "translateX(20px)" : "translateX(4px)" }}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="section-label">Shortcut Auto-Sync</div>
      <div className="card p-3 flex flex-col gap-2">
        <div className="mono text-[.62rem] text-mute uppercase tracking-[.14em]">
          iphone shortcut → steps otomatik sync
        </div>
        <button
          className="btn"
          onClick={() => {
            const token = getToken();
            if (!token) return;
            navigator.clipboard.writeText(token);
            setMsg("token copied");
            setTimeout(() => setMsg(null), 1500);
          }}
        >
          Copy API token
        </button>
        <button
          className="btn"
          onClick={() => {
            navigator.clipboard.writeText("https://api.fit.rutkuc.com/api");
            setMsg("url copied");
            setTimeout(() => setMsg(null), 1500);
          }}
        >
          Copy API URL
        </button>
      </div>

      <button className="btn text-warn" onClick={logout}>{t("auth.logout")}</button>

      <div className="mono text-[.6rem] text-mute text-center mt-4 uppercase tracking-[.14em]">
        {user?.email}
      </div>
    </div>
  );
}
