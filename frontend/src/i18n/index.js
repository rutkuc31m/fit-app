import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import de from "./de.json";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } },
  lng: "de",
  fallbackLng: "de",
  interpolation: { escapeValue: false }
});

if (typeof localStorage !== "undefined") localStorage.setItem("fit.lang", "de");

export const setLang = () => {
  i18n.changeLanguage("de");
  localStorage.setItem("fit.lang", "de");
};

export default i18n;
