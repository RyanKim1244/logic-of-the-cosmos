import ko from "./ko.json";
import en from "./en.json";

export type Locale = "ko" | "en";
export type TranslationKeys = typeof ko;

const translations: Record<Locale, TranslationKeys> = { ko, en };

export default translations;
