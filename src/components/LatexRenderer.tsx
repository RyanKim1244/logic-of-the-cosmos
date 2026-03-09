"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup?: {
        promise: Promise<void>;
      };
    };
  }
}

export default function LatexRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([containerRef.current]).catch(console.error);
    }
  }, [content]);

  // Convert markdown-like formatting to HTML
  const formatContent = (text: string): string => {
    let html = text;
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic (single *)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
    // Line breaks
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br/>");
    // Tables
    if (html.includes("|")) {
      const lines = html.split("<br/>");
      let inTable = false;
      const processed: string[] = [];
      for (const line of lines) {
        if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
          if (!inTable) {
            processed.push('<table class="latex-table">');
            inTable = true;
          }
          if (line.includes("---")) continue; // separator row
          const cells = line.split("|").filter((c) => c.trim());
          const tag = processed.filter((p) => p.includes("<tr>")).length === 0 ? "th" : "td";
          processed.push(
            "<tr>" + cells.map((c) => `<${tag}>${c.trim()}</${tag}>`).join("") + "</tr>"
          );
        } else {
          if (inTable) {
            processed.push("</table>");
            inTable = false;
          }
          processed.push(line);
        }
      }
      if (inTable) processed.push("</table>");
      html = processed.join("<br/>");
    }
    return `<p>${html}</p>`;
  };

  return (
    <div
      ref={containerRef}
      className="latex-content prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}
