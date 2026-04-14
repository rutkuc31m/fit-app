import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "./ui";

const items = [
  { to: "/",         k: "nav.today",    i: Icon.home },
  { to: "/log",      k: "nav.log",      i: Icon.utensils },
  { to: "/training", k: "nav.training", i: Icon.dumbbell },
  { to: "/progress", k: "nav.progress", i: Icon.chart },
  { to: "/settings", k: "nav.settings", i: Icon.cog }
];

export default function NavBar() {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-bg/92 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="absolute top-0 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-line2 to-transparent" />
      <div className="max-w-[680px] mx-auto grid grid-cols-5">
        {items.map(({ to, k, i: Ic }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-[3px] py-[10px] mono text-[.56rem] uppercase tracking-[.18em] transition ${
                isActive ? "text-signal" : "text-mute hover:text-ink2"
              }`
            }>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-[2px] bg-signal rounded-b-full shadow-[0_0_10px_theme(colors.signal)]" />
                )}
                <Ic size={20} />
                <span>{t(k)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
