import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { setLang } from "../i18n";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, logout, refresh } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    start_date: user?.start_date || "2026-04-20",
    start_weight: user?.start_weight || 95,
    target_weight: user?.target_weight || 72,
    height_cm: user?.height_cm || 177
  });
  const [msg, setMsg] = useState(null);

  const save = async () => {
    await api.put("/auth/me", form);
    await refresh();
    setMsg(t("settings.saved"));
    setTimeout(() => setMsg(null), 1500);
  };

  const chLang = async (lng) => {
    setLang(lng);
    await api.put("/auth/me", { lang: lng });
    await refresh();
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

      <div className="section-label">{t("settings.language")}</div>
      <div className="card p-3 flex gap-2">
        {["en", "de"].map((lng) => (
          <button key={lng}
            className={i18n.language === lng ? "btn-primary flex-1" : "btn flex-1"}
            onClick={() => chLang(lng)}>
            {lng.toUpperCase()}
          </button>
        ))}
      </div>

      <button className="btn text-warn" onClick={logout}>{t("auth.logout")}</button>

      <div className="mono text-[.6rem] text-mute text-center mt-4 uppercase tracking-[.14em]">
        {user?.email}
      </div>
    </div>
  );
}
