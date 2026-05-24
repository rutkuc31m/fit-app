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
    <nav className="app-nav fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-[760px] mx-auto px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <div className="nav-shell grid grid-cols-4 gap-1 p-1">
        {items.map(({ to, k, i: Ic }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-[4px] py-[8px] rounded-md mono text-[.52rem] uppercase tracking-[.12em] transition-colors duration-200 ${
                isActive ? "text-[#090806] bg-signal shadow-[0_10px_28px_-18px_theme(colors.signal)]" : "text-mute hover:text-ink2 hover:bg-surface2/65"
              }`
            }>
            {({ isActive }) => (
              <>
                <Ic size={isActive ? 19 : 18} />
                <span className={isActive ? "font-black" : ""}>{t(k)}</span>
              </>
            )}
          </NavLink>
        ))}
        </div>
      </div>
    </nav>
  );
}
