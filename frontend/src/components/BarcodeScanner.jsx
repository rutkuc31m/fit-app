import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Icon } from "./ui";

export default function BarcodeScanner({ onPhoto, onClose }) {
  const { t } = useTranslation();
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cbRef = useRef({ onPhoto, onClose });
  cbRef.current = { onPhoto, onClose };

  useEffect(() => {
    setErr(null);
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    }).then((s) => {
      if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}); }
    }).catch((e) => setErr(e.message || String(e)));
    return () => {
      cancelled = true;
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const snap = async () => {
    if (busy) return;
    const v = videoRef.current;
    if (!v || !v.videoWidth) return setErr("camera_not_ready");
    setBusy(true); setErr(null);
    try {
      const maxW = 1280;
      const scale = Math.min(1, maxW / v.videoWidth);
      const w = Math.round(v.videoWidth * scale);
      const h = Math.round(v.videoHeight * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(v, 0, 0, w, h);
      const dataUrl = c.toDataURL("image/jpeg", 0.82);
      const b64 = dataUrl.split(",")[1];
      const result = await api.post("/foods/analyze-photo", { image: b64 }, { timeoutMs: 60000 });
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      streamRef.current = null;
      setDone(true);
      try { cbRef.current.onPhoto(result); } catch {}
    } catch (e) {
      setErr(e.message || String(e));
    } finally { setBusy(false); }
  };

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-bg/95 backdrop-blur-lg flex flex-col pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div className="mono text-xs caps text-signal pulse-dot">{t("log.photo_analyze")}</div>
        <button className="btn-icon" onClick={onClose} aria-label="close"><Icon.close size={16} /></button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div onClick={snap} role="button" aria-label="capture"
             className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden border border-signald shadow-glow bg-bg2 cursor-pointer active:scale-[.98] transition">
          <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          <div className="absolute inset-4 border border-signal/40 rounded-lg pointer-events-none" />
          <span className="absolute top-2 left-2 w-3 h-3 border-t border-l border-signal" />
          <span className="absolute top-2 right-2 w-3 h-3 border-t border-r border-signal" />
          <span className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-signal" />
          <span className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-signal" />
          {busy && (
            <div className="absolute inset-0 bg-bg/70 grid place-items-center">
              <div className="mono text-xs caps text-signal pulse-dot">{t("log.analyzing")}</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col items-center gap-2">
        {err && <div className="mono text-sm text-warn text-center bg-warn/10 border border-warn/40 rounded-lg px-3 py-2 w-full break-all">ERR: {err}</div>}
        {!err && (
          <div className="mono text-[.66rem] text-mute uppercase tracking-[.14em] text-center">
            {busy ? t("log.analyzing") : t("log.photo_hint")}
          </div>
        )}
      </div>
    </div>
  );
}
