import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Icon = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const items = [
  { to: "/",         k: "nav.today",    d: "M3 12l9-9 9 9M5 10v10h14V10" },
  { to: "/log",      k: "nav.log",      d: "M4 6h16M4 12h16M4 18h10" },
  { to: "/training", k: "nav.training", d: "M6 6l12 12M4 20l4-4M16 8l4-4M2 12h4M18 12h4" },
  { to: "/progress", k: "nav.progress", d: "M3 20h18M6 16l4-6 4 3 5-8" },
  { to: "/settings", k: "nav.settings", d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-2-3-2 1a7 7 0 00-2-1l-1-2h-4l-1 2a7 7 0 00-2 1l-2-1-2 3 2 1a7 7 0 000 2l-2 1 2 3 2-1a7 7 0 002 1l1 2h4l1-2a7 7 0 002-1l2 1 2-3-2-1a7 7 0 000-2z" }
];

export default function NavBar() {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-bg/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[680px] mx-auto grid grid-cols-5">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 mono text-[.6rem] uppercase tracking-[.14em] transition ${isActive ? "text-signal" : "text-mute hover:text-ink2"}`}>
            <Icon d={it.d} />
            <span>{t(it.k)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
