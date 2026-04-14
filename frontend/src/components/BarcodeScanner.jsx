import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTranslation } from "react-i18next";

export default function BarcodeScanner({ onDetected, onClose }) {
  const { t } = useTranslation();
  const regionId = "bc-region";
  const scannerRef = useRef(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(regionId, { verbose: false });
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 160 } },
      (text) => { onDetected(text); scanner.stop().catch(() => {}); },
      () => {}
    ).catch((e) => setErr(e.message || String(e)));
    return () => { scanner.stop().catch(() => {}).finally(() => scanner.clear()); };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div className="mono text-xs caps text-signal pulse-dot">{t("log.scan_barcode")}</div>
        <button className="btn" onClick={onClose}>{t("common.close")}</button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div id={regionId} className="w-full max-w-md rounded-xl overflow-hidden border border-signald shadow-glow" />
      </div>
      <div className="p-4 text-center mono text-xs text-mute uppercase tracking-[.14em]">
        {err ? <span className="text-warn">{err}</span> : t("log.scan_hint")}
      </div>
    </div>
  );
}
