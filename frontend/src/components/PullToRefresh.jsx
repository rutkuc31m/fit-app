import { useEffect, useRef, useState } from "react";

const THRESHOLD = 82;
const MAX_PULL = 118;

const isInteractiveTarget = (target) =>
  target?.closest?.("input, textarea, select, button, a, [role='button'], [data-no-pull-refresh]");

export default function PullToRefresh() {
  const startYRef = useRef(0);
  const pullRef = useRef(0);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const reset = () => {
      pullingRef.current = false;
      startYRef.current = 0;
      pullRef.current = 0;
      setPull(0);
    };

    const refresh = async () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      setRefreshing(true);
      try { navigator.vibrate?.(35); } catch {}
      try {
        const registration = await navigator.serviceWorker?.getRegistration?.();
        await registration?.update?.();
      } catch {}
      window.setTimeout(() => window.location.reload(), 180);
    };

    const onTouchStart = (event) => {
      if (refreshingRef.current) return;
      if (event.touches.length !== 1) return;
      if (window.scrollY > 0) return;
      if (isInteractiveTarget(event.target)) return;
      startYRef.current = event.touches[0].clientY;
      pullingRef.current = true;
    };

    const onTouchMove = (event) => {
      if (!pullingRef.current || refreshingRef.current) return;
      const dy = event.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        reset();
        return;
      }
      if (window.scrollY > 0) {
        reset();
        return;
      }
      const damped = Math.min(MAX_PULL, Math.round(dy * 0.52));
      pullRef.current = damped;
      setPull(damped);
      if (damped > 10) event.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pullingRef.current || refreshingRef.current) return;
      if (pullRef.current >= THRESHOLD) refresh();
      else reset();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, []);

  const visible = refreshing || pull > 0;
  const armed = pull >= THRESHOLD;

  return (
    <div
      className={`pull-refresh ${visible ? "is-visible" : ""} ${armed || refreshing ? "is-armed" : ""}`}
      style={{ transform: `translate3d(-50%, ${visible ? Math.min(76, pull) : -72}px, 0)` }}
      aria-hidden={!visible}
    >
      <div className="pull-refresh-dot">
        <span />
      </div>
      <div className="pull-refresh-text">
        {refreshing ? "Refreshing" : armed ? "Release" : "Pull"}
      </div>
    </div>
  );
}
