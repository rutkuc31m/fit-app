import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "./ui";

const items = [
  { to: "/",         k: "nav.today",    i: Icon.home },
  { to: "/log",      k: "nav.recipes",  i: Icon.utensils },
  { to: "/training", k: "nav.training", i: Icon.dumbbell },
  { to: "/progress", k: "nav.progress", i: Icon.chart },
  { to: "/settings", k: "nav.settings", i: Icon.cog }
];

export default function NavBar() {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-bg/94 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="absolute top-0 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-line2 to-transparent" />
      <div className="max-w-[760px] mx-auto grid grid-cols-5 px-1">
        {items.map(({ to, k, i: Ic }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-[4px] my-2 py-[8px] rounded-lg mono text-[.54rem] uppercase tracking-[.16em] transition ${
                isActive ? "text-signal bg-signal/[.07]" : "text-mute hover:text-ink2 hover:bg-surface/60"
              }`
            }>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-signal rounded-b-full shadow-[0_0_10px_theme(colors.signal)]" />
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
