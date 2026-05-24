import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "./ui";

const items = [
  { to: "/",         k: "nav.today",    i: Icon.home },
  { to: "/log",      k: "nav.recipes",  i: Icon.utensils },
  { to: "/training", k: "nav.training", i: Icon.dumbbell },
  { to: "/progress", k: "nav.progress", i: Icon.chart }
];

export default function NavBar() {
  const { t } = useTranslation();
  return (
    <nav className="app-nav fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[760px] mx-auto px-3 pb-2">
        <div className="nav-shell grid grid-cols-4">
        {items.map(({ to, k, i: Ic }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-[4px] my-[5px] py-[8px] rounded-lg mono text-[.54rem] uppercase tracking-[.14em] transition-colors duration-200 ${
                isActive ? "text-ink bg-signal/[.12]" : "text-mute hover:text-ink2 hover:bg-white/[.04]"
              }`
            }>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-[5px] left-1/2 -translate-x-1/2 w-6 h-[2px] bg-signal rounded-full shadow-[0_0_10px_theme(colors.signal)]" />
                )}
                <Ic size={20} />
                <span>{t(k)}</span>
              </>
            )}
          </NavLink>
        ))}
        </div>
      </div>
    </nav>
  );
}
