"use client";

import { useState } from "react";
import { type MultiLangContent, LANG_LABELS, getLangLabel } from "@/lib/multilang";

interface MultiLangEditorProps {
  label: string;
  value: MultiLangContent;
  onChange: (value: MultiLangContent) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}

const AVAILABLE_LANGS = Object.keys(LANG_LABELS);

export default function MultiLangEditor({ label, value, onChange, rows = 10, placeholder, required }: MultiLangEditorProps) {
  const langs = Object.keys(value).length > 0 ? Object.keys(value) : ["ko"];
  const [activeLang, setActiveLang] = useState(langs[0]);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Ensure activeLang exists in value
  if (!langs.includes(activeLang) && langs.length > 0) {
    setActiveLang(langs[0]);
  }

  const addLanguage = (code: string) => {
    if (!value[code]) {
      onChange({ ...value, [code]: "" });
      setActiveLang(code);
    }
    setShowLangMenu(false);
  };

  const removeLanguage = (code: string) => {
    if (langs.length <= 1) return; // Keep at least one
    const next = { ...value };
    delete next[code];
    onChange(next);
    if (activeLang === code) {
      setActiveLang(Object.keys(next)[0]);
    }
  };

  const unusedLangs = AVAILABLE_LANGS.filter((l) => !langs.includes(l));

  const inputClass = "w-full px-4 py-2.5 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-colors font-mono resize-none";
  const labelClass = "block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider";

  return (
    <div>
      <label className={labelClass}>{label}</label>

      {/* Language tabs */}
      <div className="flex items-center gap-0 mb-0 border border-neutral-300 border-b-0 bg-neutral-50 overflow-x-auto">
        {langs.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeLang === lang
                ? "border-black text-black bg-white"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {getLangLabel(lang)}
            {langs.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); removeLanguage(lang); }}
                className="ml-1 text-neutral-300 hover:text-red-500 transition-colors cursor-pointer"
                title={`${getLangLabel(lang)} 삭제`}
              >
                &times;
              </span>
            )}
          </button>
        ))}

        {/* Add language button */}
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="px-3 py-2 text-xs text-neutral-400 hover:text-black transition-colors"
            title="언어 추가"
          >
            + 언어
          </button>
          {showLangMenu && unusedLangs.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 shadow-lg z-20 min-w-[140px]">
                {unusedLangs.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => addLanguage(code)}
                    className="block w-full text-left px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors"
                  >
                    {getLangLabel(code)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Textarea for active language */}
      <textarea
        required={required && !Object.values(value).some((v) => v.trim())}
        value={value[activeLang] || ""}
        onChange={(e) => onChange({ ...value, [activeLang]: e.target.value })}
        className={inputClass}
        rows={rows}
        placeholder={placeholder ? `[${getLangLabel(activeLang)}] ${placeholder}` : `${getLangLabel(activeLang)}로 작성...`}
      />

      {langs.length > 1 && (
        <p className="text-[10px] text-neutral-400 mt-1">
          {langs.length}개 언어 · 모든 언어에 내용을 입력하지 않아도 됩니다
        </p>
      )}
    </div>
  );
}
