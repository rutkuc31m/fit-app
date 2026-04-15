import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useTranslation } from "react-i18next";
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

export default function BarcodeScanner({ onDetected, onClose }) {
  const { t } = useTranslation();
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);
  const regionId = "bc-region";
  const scannerRef = useRef(null);
  const cbRef = useRef({ onDetected, onClose });
  cbRef.current = { onDetected, onClose };
  const detectedRef = useRef(false);

  useEffect(() => {
    setErr(null);
    detectedRef.current = false;
    const scanner = new Html5Qrcode(regionId, { verbose: false, formatsToSupport: BARCODE_FORMATS });
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
        try {
          const ve = document.querySelector(`#${regionId} video`);
          if (ve?.srcObject) ve.srcObject.getTracks().forEach((t) => t.stop());
        } catch {}
        scanner.stop().catch(() => {});
        // Defer state updates into main event loop — html5-qrcode callback
        // can fire from inside rAF where React 18 batching misbehaves on iOS.
        setTimeout(() => {
          setDone(true);
          try { cbRef.current.onDetected(text); } catch (e) { alert("onDetected err: " + (e.message || e)); }
        }, 0);
      },
      () => {}
    ).catch((e) => setErr(e.message || String(e)));
    return () => {
      const s = scannerRef.current;
      if (s) s.stop().catch(() => {}).finally(() => s.clear().catch(() => {}));
    };
  }, []);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-bg/95 backdrop-blur-lg flex flex-col pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div className="mono text-xs caps text-signal pulse-dot">{t("log.scan_barcode")}</div>
        <button className="btn-icon" onClick={onClose} aria-label="close"><Icon.close size={16} /></button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div id={regionId} className="w-full max-w-md min-h-[60vh] rounded-xl overflow-hidden border border-signald shadow-glow bg-bg2" />
      </div>

      <div className="p-4 flex flex-col items-center gap-2">
        {err && <div className="mono text-sm text-warn text-center bg-warn/10 border border-warn/40 rounded-lg px-3 py-2 w-full break-all">ERR: {err}</div>}
        {!err && (
          <div className="mono text-[.66rem] text-mute uppercase tracking-[.14em] text-center">{t("log.scan_hint")}</div>
        )}
      </div>
    </div>
  );
}
