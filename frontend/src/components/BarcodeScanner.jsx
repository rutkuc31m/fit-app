import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Icon } from "./ui";

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE
];

export default function BarcodeScanner({ onDetected, onPhoto, onClose }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("barcode"); // barcode | photo
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const regionId = "bc-region";
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cbRef = useRef({ onDetected, onPhoto, onClose });
  cbRef.current = { onDetected, onPhoto, onClose };
  const detectedRef = useRef(false);

  /* ───── Barcode mode ───── */
  useEffect(() => {
    if (mode !== "barcode") return;
    setErr(null);
    detectedRef.current = false;
    const scanner = new Html5Qrcode(regionId, {
      verbose: false,
      formatsToSupport: BARCODE_FORMATS
    });
    scannerRef.current = scanner;
    const box = (w, h) => {
      const min = Math.min(w, h);
      return { width: Math.round(min * 0.85), height: Math.round(min * 0.45) };
    };
    scanner.start(
      { facingMode: "environment" },
      { fps: 15, qrbox: box, aspectRatio: 1.4, disableFlip: false,
        videoConstraints: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
      (text) => {
        if (detectedRef.current) return;
        detectedRef.current = true;
        // Hide UI right now so iOS shows progress even if parent re-render lags.
        setDone(true);
        // Tear down the camera stream synchronously — html5-qrcode's stop() is slow on iOS.
        try {
          const ve = document.querySelector(`#${regionId} video`);
          if (ve?.srcObject) ve.srcObject.getTracks().forEach((t) => t.stop());
        } catch {}
        scanner.stop().catch(() => {});
        try { cbRef.current.onDetected(text); } catch {}
      },
      () => {}
    ).catch((e) => setErr(e.message || String(e)));
    return () => {
      const s = scannerRef.current;
      if (s) s.stop().catch(() => {}).finally(() => s.clear().catch(() => {}));
    };
  }, [mode]);

  /* ───── Photo mode ───── */
  useEffect(() => {
    if (mode !== "photo") return;
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
  }, [mode]);

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
      const result = await api.post("/foods/analyze-photo", { image: b64 });
      onPhoto(result);
    } catch (e) {
      setErr(e.message || String(e));
    } finally { setBusy(false); }
  };

  if (done) return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div className="mono text-xs caps text-signal pulse-dot">
          {mode === "barcode" ? t("log.scan_barcode") : t("log.photo_analyze")}
        </div>
        <button className="btn-icon" onClick={onClose} aria-label="close"><Icon.close size={16} /></button>
      </div>

      <div className="flex justify-center gap-1 p-2 border-b border-line">
        {[
          { k: "barcode", icon: <Icon.scan size={14} />, label: t("log.mode_barcode") },
          { k: "photo",   icon: <Icon.zap  size={14} />, label: t("log.mode_photo") }
        ].map((m) => (
          <button key={m.k} onClick={() => setMode(m.k)}
            className={`mono text-[.66rem] caps px-3 py-2 rounded-lg flex items-center gap-2 transition ${
              mode === m.k ? "bg-signal/10 text-signal border border-signal/40" : "text-mute hover:text-ink2 border border-transparent"
            }`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {mode === "barcode" ? (
          <div id={regionId} className="w-full max-w-md rounded-xl overflow-hidden border border-signald shadow-glow" />
        ) : (
          <div className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden border border-signald shadow-glow bg-bg2">
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-4 border border-signal/40 rounded-lg pointer-events-none" />
            <span className="bk tl absolute top-2 left-2 w-3 h-3 border-t border-l border-signal" />
            <span className="bk tr absolute top-2 right-2 w-3 h-3 border-t border-r border-signal" />
            <span className="bk bl absolute bottom-2 left-2 w-3 h-3 border-b border-l border-signal" />
            <span className="bk br absolute bottom-2 right-2 w-3 h-3 border-b border-r border-signal" />
            {busy && (
              <div className="absolute inset-0 bg-bg/70 grid place-items-center">
                <div className="mono text-xs caps text-signal pulse-dot">{t("log.analyzing")}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col items-center gap-3">
        {err && <div className="mono text-xs text-warn text-center">{err}</div>}
        {!err && (
          <div className="mono text-[.66rem] text-mute uppercase tracking-[.14em] text-center">
            {mode === "barcode" ? t("log.scan_hint") : t("log.photo_hint")}
          </div>
        )}
        {mode === "photo" && (
          <button className="btn-primary px-6 py-3" onClick={snap} disabled={busy}>
            {busy ? "…" : t("log.capture")}
          </button>
        )}
      </div>
    </div>
  );
}
