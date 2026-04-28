import { useEffect, useState } from "react";
import { pushSupported, getPushStatus, subscribeToPush } from "../lib/notify";
import { AccentCard } from "./ui";

const FLAG = "fit.push_asked";

export default function PushPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    if (localStorage.getItem(FLAG)) return;
    getPushStatus().then((s) => {
      if (s === "default") setShow(true);
      else localStorage.setItem(FLAG, "1");
    });
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(FLAG, "1");
    setShow(false);
  };

  const enable = async () => {
    setBusy(true);
    try { await subscribeToPush(); } catch {}
    finally { setBusy(false); dismiss(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <AccentCard accent="#30d158" className="p-4 max-w-sm w-full border-signal/30" contentClassName="pl-2 flex flex-col gap-3">
        <div>
          <div className="mono text-[.58rem] text-signal uppercase tracking-[.22em] font-bold">
            coach mode
          </div>
          <div className="font-display text-[1.25rem] text-ink leading-tight mt-1">
            Smart schedule reminders
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <button className="btn flex-1" onClick={dismiss} disabled={busy}>later</button>
          <button className="btn-primary flex-1" onClick={enable} disabled={busy}>
            {busy ? "..." : "enable"}
          </button>
        </div>
      </AccentCard>
    </div>
  );
}
