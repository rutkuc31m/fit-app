import { useEffect, useState } from "react";

/* ─────────── Icons (stroke, 20px) ─────────── */
const Svg = ({ d, size = 20, fill = "none", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

export const Icon = {
  home:    (p) => <Svg {...p} d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />,
  utensils:(p) => <Svg {...p} d={<><path d="M7 2v9M4 2v5a3 3 0 0 0 3 3M10 2v5a3 3 0 0 1-3 3M7 11v11" /><path d="M17 2c-1.5 3-2 5-2 8 0 2 1 3 2 3v9" /></>} />,
  dumbbell:(p) => <Svg {...p} d={<><path d="M6 7v10M3 10v4M18 7v10M21 10v4M7 12h10" /></>} />,
  chart:   (p) => <Svg {...p} d={<><path d="M3 3v18h18" /><path d="M7 15l4-6 4 3 5-8" /></>} />,
  cog:     (p) => <Svg {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>} />,
  scan:    (p) => <Svg {...p} d={<><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" /><path d="M4 12h16" /></>} />,
  plus:    (p) => <Svg {...p} d="M12 5v14M5 12h14" />,
  check:   (p) => <Svg {...p} d="M20 6L9 17l-5-5" />,
  close:   (p) => <Svg {...p} d="M18 6L6 18M6 6l12 12" />,
  trash:   (p) => <Svg {...p} d={<><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6M10 11v6M14 11v6" /></>} />,
  flame:   (p) => <Svg {...p} d="M12 2s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0-2-1-3-1-5zM9.5 15a3 3 0 0 0 5 0" />,
  zap:     (p) => <Svg {...p} d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  clock:   (p) => <Svg {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  trend:   (p) => <Svg {...p} d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  ruler:   (p) => <Svg {...p} d={<><path d="M3 14l7-11 11 7-7 11z" /><path d="M7 11l2 1M10 8l2 1M13 5l2 1M9 15l2 1M12 12l2 1" /></>} />,
  logout:  (p) => <Svg {...p} d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />,
  chev:    (p) => <Svg {...p} d="M9 6l6 6-6 6" />,
  moon:    (p) => <Svg {...p} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  drop:    (p) => <Svg {...p} d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z" />,
  book:    (p) => <Svg {...p} d={<><path d="M4 4a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2zM4 20v2h14" /><path d="M8 6h6M8 10h6" /></>} />,
  cart:    (p) => <Svg {...p} d={<><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M2 3h3l3 12h11l2-8H6" /></>} />
};

/* ─────────── Bracket corners wrapper ─────────── */
export const Brackets = ({ children, className = "" }) => (
  <div className={`brackets ${className}`}>
    <span className="bk tl" /><span className="bk tr" /><span className="bk bl" /><span className="bk br" />
    {children}
  </div>
);

/* ─────────── Ring gauge ─────────── */
export function Ring({ value = 0, target = 100, size = 110, stroke = 8, label, unit, over = false, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, target > 0 ? value / target : 0));
  const dash = c * pct;
  const color = over ? "#ff9500" : "#30d158";
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#2c2c2e" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}aa)`, transition: "stroke-dasharray .5s cubic-bezier(.2,.8,.2,1)" }} />
        {/* Tick marks every 10% */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * 2 * Math.PI - Math.PI / 2;
          const x1 = size/2 + (r - stroke/2 - 2) * Math.cos(a);
          const y1 = size/2 + (r - stroke/2 - 2) * Math.sin(a);
          const x2 = size/2 + (r - stroke/2 - (i % 6 === 0 ? 6 : 3)) * Math.cos(a);
          const y2 = size/2 + (r - stroke/2 - (i % 6 === 0 ? 6 : 3)) * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#48484a" strokeWidth="1" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
        {children ? (
          <>
            <div className={`mono font-bold leading-none ${over ? "text-warn" : "text-signal"}`} style={{ fontSize: size * 0.26 }}>
              {Math.round(value)}
            </div>
            {unit && <div className="mono text-[.55rem] text-mute uppercase tracking-[.2em] mt-1">{unit}</div>}
            {label && <div className="mono text-[.54rem] text-ink2 mt-[2px]">{label}</div>}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────── Mini ring (compact macro display) ─────────── */
export function MiniRing({ value = 0, target = 100, size = 54, stroke = 5, color = "#30d158" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, target > 0 ? value / target : 0));
  return (
    <svg width={size} height={size} className="-rotate-90 overflow-visible">
      <circle cx={size/2} cy={size/2} r={r} stroke="#2c2c2e" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}aa)`, transition: "stroke-dasharray .5s cubic-bezier(.2,.8,.2,1)" }} />
    </svg>
  );
}

/* ─────────── Mini bar (for macros) ─────────── */
export function Bar({ value = 0, target = 100, tone = "signal" }) {
  const pct = target > 0 ? Math.min(150, (value / target) * 100) : 0;
  const over = pct > 100;
  const cls = over ? "over" : tone === "cool" ? "dim" : tone === "warn" ? "warn" : "";
  return (
    <div className={`meter ${cls}`}>
      <span style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

/* ─────────── Sparkline (tiny trend) ─────────── */
export function Sparkline({ values = [], width = 200, height = 32, color = "#30d158" }) {
  const pts = values.filter((v) => v != null && !isNaN(v));
  if (pts.length < 2) return <div style={{ height }} className="mono text-[.58rem] text-mute flex items-center">no trend yet</div>;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const step = width / (pts.length - 1);
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(height - ((v - min) / span) * height).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const lastX = (pts.length - 1) * step;
  const lastY = height - ((last - min) / span) * height;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} stroke={color} strokeWidth="1.3" fill="none" style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
      <circle cx={lastX} cy={lastY} r="2.2" fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
    </svg>
  );
}

/* ─────────── Phase strip (P1..P4 segmented) ─────────── */
export function PhaseStrip({ phases = [], currentPhase }) {
  return (
    <div className="flex items-center gap-[3px]">
      {phases.map((p) => (
        <div key={p.id}
          className={`phase-seg ${p.id < currentPhase ? "done" : p.id === currentPhase ? "now" : ""}`}
          title={`P${p.id}`} />
      ))}
    </div>
  );
}

/* ─────────── Day glyph (A=triangle, B=square, C=hex) ─────────── */
export function DayGlyph({ type = "A", size = 34 }) {
  const shapes = {
    A: <polygon points={`${size/2},4 ${size-4},${size-4} 4,${size-4}`} />,
    B: <rect x="5" y="5" width={size-10} height={size-10} rx="2" />,
    C: (() => {
      const cx = size/2, cy = size/2, r = size/2 - 4;
      const pts = Array.from({ length: 6 }).map((_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      }).join(" ");
      return <polygon points={pts} />;
    })()
  };
  const shape = shapes[type] || null;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-signal" style={{ filter: "drop-shadow(0 0 6px rgba(48,209,88,.4))" }}>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">{shape}</g>
      <text x={size/2} y={size/2 + 4} textAnchor="middle" className="mono" fontSize={size * 0.32} fill="currentColor" fontWeight="700">{type}</text>
    </svg>
  );
}

/* ─────────── Skeleton ─────────── */
export const Skeleton = ({ className = "h-4 w-full" }) => <div className={`skeleton ${className}`} />;

/* ─────────── Empty state ─────────── */
export function Empty({ label, hint, icon, action }) {
  return (
    <div className="card p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 hatch opacity-60 pointer-events-none" />
      <div className="relative flex flex-col items-center gap-2">
        {icon && <div className="text-mute2 mb-1">{icon}</div>}
        <div className="mono text-xs text-ink2 caps">{label}</div>
        {hint && <div className="mono text-[.68rem] text-mute max-w-[28ch] leading-relaxed">{hint}</div>}
        {action}
      </div>
    </div>
  );
}

/* ─────────── Callsign header strip (date/clock/id) ─────────── */
export function Callsign({ left, right }) {
  return (
    <div className="flex items-center justify-between mono text-[.6rem] text-mute uppercase tracking-[.2em] px-1">
      <div className="flex items-center gap-[6px]">{left}</div>
      <div className="flex items-center gap-[6px]">{right}</div>
    </div>
  );
}

/* ─────────── Live clock (HH:MM:SS mono) ─────────── */
export function LiveClock({ className = "" }) {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const p2 = (n) => String(n).padStart(2, "0");
  return (
    <span className={`mono tabular-nums ${className}`}>
      {p2(t.getHours())}:{p2(t.getMinutes())}<span className="opacity-60">:{p2(t.getSeconds())}</span>
    </span>
  );
}

/* ─────────── Number stepper (good for quick weight / reps) ─────────── */
export function Stepper({ value, onChange, step = 0.1, min, max, suffix, big = false }) {
  const dec = () => onChange(Math.max(min ? -Infinity, +(Number(value || 0) - step).toFixed(2)));
  const inc = () => onChange(Math.min(max ? Infinity,  +(Number(value || 0) + step).toFixed(2)));
  return (
    <div className="flex items-stretch gap-2">
      <button type="button" className="step-btn" onClick={dec} aria-label="decrement">−</button>
      <div className={`flex-1 relative border border-line rounded-lg bg-gradient-to-b from-[#0a0a0b] to-[#1c1c1e] overflow-hidden ${big ? "min-h-[64px]" : ""}`}>
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/30 to-transparent" />
        <input type="number" step={step} inputMode="decimal"
          value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : +e.target.value)}
          className={`w-full h-full text-center mono font-bold text-signal bg-transparent border-none outline-none ${big ? "text-[2rem]" : "text-lg"} py-2`}
          style={{ textShadow: "0 0 14px rgba(48,209,88,.35)" }}
          placeholder="0" />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2 mono text-xs text-mute pointer-events-none">{suffix}</div>}
      </div>
      <button type="button" className="step-btn" onClick={inc} aria-label="increment">+</button>
    </div>
  );
}
