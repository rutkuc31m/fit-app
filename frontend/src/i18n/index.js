import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import de from "./de.json";

const saved = typeof localStorage !== "undefined" ? localStorage.getItem("fit.lang") : null;
const browser = typeof navigator !== "undefined" && navigator.language?.startsWith("de") ? "de" : "en";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } },
  lng: saved || browser,
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export const setLang = (lng) => {
  i18n.changeLanguage(lng);
  localStorage.setItem("fit.lang", lng);
};

export default i18n;
