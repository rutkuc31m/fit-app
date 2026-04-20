import { useState } from "react";
import { useTranslation } from "react-i18next";

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
  );
}

export default function ExerciseGifPreview({ gifPath }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!gifPath) return null;

  return (
    <>
      <button
        className="btn-icon"
        onClick={() => setOpen(true)}
        aria-label={t("training.show_exercise")}
        title={t("training.show_exercise")}
      >
        <EyeIcon />
      </button>

      {open && (
        <div
          className="gif-modal-backdrop"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="gif-modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={gifPath}
              alt={t("training.exercise_preview")}
              loading="lazy"
              style={{ maxWidth: "100%", maxHeight: "70vh", display: "block", borderRadius: "8px" }}
            />
            <button className="btn mt-2 w-full" onClick={() => setOpen(false)}>
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
