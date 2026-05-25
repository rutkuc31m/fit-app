import { useEffect, useState } from "react";
import { api, assetUrl } from "../lib/api";
import { todayStr, getWeekNum } from "../lib/plan";
import { AccentCard, Icon, PageCommand } from "../components/ui";

const MAX_PHOTO_EDGE = 1600;
const PHOTO_QUALITY = 0.82;

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const imageToCompressedDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file?.type?.startsWith("image/")) {
    reject(new Error("invalid_image"));
    return;
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
      const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error("image_compress_failed"));
          return;
        }
        blobToDataUrl(blob).then(resolve).catch(reject);
      }, "image/jpeg", PHOTO_QUALITY);
    } catch (e) {
      URL.revokeObjectURL(url);
      reject(e);
    }
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error("image_load_failed"));
  };
  img.src = url;
});

const shortDate = (date) => {
  if (!date) return "--";
  const [, month, day] = String(date).split("-");
  return `${day}.${month}`;
};

export default function Checkin() {
  const date = todayStr();
  const week = getWeekNum(date);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const rows = await api.get("/checkins/photos?limit=36").catch(() => []);
    setPhotos(rows || []);
  };

  useEffect(() => { load(); }, []);

  const onPhoto = async (files) => {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const dataUrl = await imageToCompressedDataUrl(file);
        await api.post(`/checkins/${week}/photo`, { angle: "general", data_url: dataUrl, date });
      }
      await load();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page page-checkin">
      <PageCommand
        accent="#9a9a9a"
        kicker="progress photos"
        title="Photos"
        metrics={[
          { label: "week", value: `W${String(week).padStart(2, "0")}`, className: "text-cyan" },
          { label: "saved", value: photos.length, className: "text-amber" }
        ]}
      />

      <AccentCard accent="#9a9a9a" className={uploading ? "border-amber/60" : ""}>
        <div className="flex justify-between items-center gap-2">
          <div>
            <div className="card-title">Progress photos</div>
            <div className="mono text-[.56rem] text-mute uppercase tracking-[.14em] mt-[2px]">upload + timeline</div>
          </div>
          <span className={`chip ${uploading ? "chip-energy" : photos.length ? "chip-hydro" : "chip-mute"}`}>
            {uploading ? "uploading" : `${photos.length} saved`}
          </span>
        </div>
        <label className={`btn-ghost mt-3 inline-flex items-center justify-center gap-2 cursor-pointer w-full ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          <Icon.camera size={14} />
          <span>{uploading ? "Uploading" : "Add photo"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              void onPhoto(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </AccentCard>

      <div className="section-label">Timeline</div>
      {photos.length === 0 ? (
        <AccentCard accent="#9a9a9a" className="p-4">
          <div className="mono text-xs text-mute text-center">—</div>
        </AccentCard>
      ) : (
        <div className="grid grid-cols-2 min-[520px]:grid-cols-3 gap-2">
          {photos.map((photo) => (
            <AccentCard key={photo.id} accent="#9a9a9a" className="overflow-hidden p-0" contentClassName="p-0">
              <div className="aspect-[3/4] bg-bg2 overflow-hidden">
                <img src={assetUrl(photo.path)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="px-2 py-2 flex items-center justify-between gap-2">
                <span className="mono text-[.62rem] text-ink tabular-nums">{shortDate(photo.date)}</span>
                <span className="mono text-[.52rem] text-mute uppercase tracking-[.12em]">{photo.angle || "general"}</span>
              </div>
            </AccentCard>
          ))}
        </div>
      )}
    </div>
  );
}
