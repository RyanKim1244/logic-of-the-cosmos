/**
 * Multi-language content utilities.
 *
 * Content format:
 *  - Legacy (single-language): plain string  →  treated as a single unnamed language
 *  - Multi-language: JSON string  →  { "ko": "...", "en": "..." }
 *
 * Backward-compatible: all existing plain-string content continues to work.
 */

export const LANG_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
  de: "Deutsch",
  fr: "Français",
  ru: "Русский",
  es: "Español",
};

export type MultiLangContent = Record<string, string>;

/**
 * Parse stored content into a language→text map.
 * - If it's a valid JSON object with string values, return as-is.
 * - Otherwise treat the whole string as a single entry under the first detected language.
 */
export function parseMultiLang(raw: string): MultiLangContent {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      // Verify all values are strings
      const entries = Object.entries(parsed);
      if (entries.length > 0 && entries.every(([, v]) => typeof v === "string")) {
        return parsed as MultiLangContent;
      }
    }
  } catch {
    // Not JSON — treat as plain string
  }
  // Single-language fallback: detect language heuristically or default to "ko"
  return { ko: raw };
}

/**
 * Serialize a language map back to storage format.
 * - If only one language exists, store as plain string (backward compatible).
 * - If multiple languages, store as JSON.
 */
export function serializeMultiLang(langs: MultiLangContent): string {
  const entries = Object.entries(langs).filter(([, v]) => v.trim());
  if (entries.length === 0) return "";
  if (entries.length === 1) {
    // Single language with key "ko" → store as plain string for compatibility
    const [key, value] = entries[0];
    if (key === "ko") return value;
    // Non-Korean single language → store as JSON to preserve language info
    return JSON.stringify({ [key]: value });
  }
  return JSON.stringify(Object.fromEntries(entries));
}

/**
 * Get available languages from content, ordered with common languages first.
 */
export function getLanguages(content: MultiLangContent): string[] {
  const priority = ["ko", "en", "ja", "zh"];
  const keys = Object.keys(content).filter((k) => content[k].trim());
  return [
    ...priority.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !priority.includes(k)).sort(),
  ];
}

/**
 * Get a display label for a language code.
 */
export function getLangLabel(code: string): string {
  return LANG_LABELS[code] || code.toUpperCase();
}
