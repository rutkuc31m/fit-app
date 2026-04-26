import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useTranslation } from "react-i18next";
import { AccentCard } from "./ui";

export default function AppUpdatePrompt() {
  const { t } = useTranslation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      registration?.update?.();
    }
  });

  useEffect(() => {
    if (needRefresh) updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="fixed left-0 right-0 bottom-[76px] z-[70] px-3 pointer-events-none">
      <AccentCard accent="#30d158" className="max-w-[680px] mx-auto pointer-events-auto border-signal/50" contentClassName="pl-2 flex items-center gap-3 w-full">
        <div className="flex-1 min-w-0">
          <div className="mono text-[.58rem] text-signal uppercase tracking-[.2em]">
            {needRefresh ? t("app_update.ready") : t("app_update.offline")}
          </div>
          <div className="mono text-[.66rem] text-ink2 mt-[2px]">
            {needRefresh ? t("app_update.ready_hint") : t("app_update.offline_hint")}
          </div>
        </div>
        {needRefresh ? (
          <button className="btn-primary shrink-0" onClick={() => updateServiceWorker(true)}>
            {t("app_update.reload")}
          </button>
        ) : (
          <button className="btn shrink-0" onClick={close}>
            {t("common.close")}
          </button>
        )}
      </AccentCard>
    </div>
  );
}
