import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth.jsx";
import { AccentCard, PageCommand } from "../components/ui";

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.email, form.password, form.name, i18n.language);
    } catch (ex) {
      setErr(ex.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="page pt-[80px]">
      <PageCommand
        accent="#30d158"
        kicker="fit rutkuc"
        title="Six months. One direction."
        sub="93 to 73 · fat loss · waist down · muscle kept"
        className="text-center"
      >
        <div className="relative z-10 text-center mb-4">
          <div className="mx-auto w-[48px] h-[48px] rounded-lg bg-signal grid place-items-center text-[#000000] mono font-bold text-xl shadow-[0_0_30px_-6px_theme(colors.signal)]">F</div>
        </div>
      </PageCommand>

      <AccentCard as="form" onSubmit={submit} accent="#30d158" className="p-4" contentClassName="pl-2 flex flex-col gap-3">
        <div className="section-label">{t(`auth.${mode}`)}</div>

        {mode === "register" && (
          <input className="input" placeholder={t("auth.name")} value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        )}
        <input className="input" type="email" required placeholder={t("auth.email")}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" required placeholder={t("auth.password")}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

        {err && <div className="mono text-xs text-warn">{t(`auth.${err}`, err)}</div>}

        <button className="btn-primary" disabled={busy}>{busy ? "..." : t(`auth.${mode}`)}</button>

        <button type="button" className="mono text-xs text-ink2 hover:text-signal transition"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(null); }}>
          {mode === "login" ? t("auth.or_register") : t("auth.or_login")}
        </button>
      </AccentCard>
    </div>
  );
}
