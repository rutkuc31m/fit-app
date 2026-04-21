import { useRegisterSW } from "virtual:pwa-register/react";
import { useTranslation } from "react-i18next";

export default function AppUpdatePrompt() {
  const { t } = useTranslation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({ immediate: true });

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="fixed left-0 right-0 bottom-[76px] z-[70] px-3 pointer-events-none">
      <div className="max-w-[680px] mx-auto card p-3 pointer-events-auto flex items-center gap-3 border-signal/50">
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
      </div>
    </div>
  );
}
