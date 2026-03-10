"use client";

import { useState } from "react";
import { parseMultiLang, getLanguages, getLangLabel } from "@/lib/multilang";
import LatexRenderer from "@/components/LatexRenderer";

interface MultiLangViewerProps {
  content: string;
}

export default function MultiLangViewer({ content }: MultiLangViewerProps) {
  const langs = parseMultiLang(content);
  const availableLangs = getLanguages(langs);
  const [activeLang, setActiveLang] = useState(availableLangs[0] || "ko");

  // Single language — render directly without tabs
  if (availableLangs.length <= 1) {
    const text = langs[availableLangs[0]] || content;
    return <LatexRenderer content={text} />;
  }

  // Ensure activeLang is valid
  const currentLang = availableLangs.includes(activeLang) ? activeLang : availableLangs[0];

  return (
    <div>
      {/* Language switcher */}
      <div className="flex items-center gap-0 mb-4 border-b border-neutral-200">
        {availableLangs.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              currentLang === lang
                ? "border-black text-black"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {getLangLabel(lang)}
          </button>
        ))}
      </div>

      <LatexRenderer content={langs[currentLang] || ""} />
    </div>
  );
}
