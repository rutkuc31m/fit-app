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
        <div className="nav-shell grid grid-cols-4">
        {items.map(({ to, k, i: Ic }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 py-2 text-xs transition-colors duration-150 ${
                isActive ? "text-ink bg-surface2" : "text-mute hover:text-ink2 hover:bg-surface2/65"
              }`
            }>
            {({ isActive }) => (
              <>
                <Ic size={18} />
                <span className={isActive ? "font-medium" : ""}>{t(k)}</span>
              </>
            )}
          </NavLink>
        ))}
        </div>
      </div>
    </nav>
  );
}
