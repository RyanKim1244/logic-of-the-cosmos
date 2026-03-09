"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      typesetClear?: (elements?: HTMLElement[]) => void;
      startup?: {
        promise: Promise<void>;
      };
    };
  }
}

export default function LatexRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const typeset = useCallback(() => {
    const el = containerRef.current;
    if (!el || !window.MathJax) return;

    const doTypeset = () => {
      if (window.MathJax?.typesetClear) {
        window.MathJax.typesetClear([el]);
      }
      window.MathJax?.typesetPromise?.([el]).catch(console.error);
    };

    if (window.MathJax.startup?.promise) {
      window.MathJax.startup.promise.then(doTypeset);
    } else {
      doTypeset();
    }
  }, []);

  useEffect(() => {
    typeset();
  }, [content, typeset]);

  const formatContent = (text: string): string => {
    // Protect math blocks from formatting by replacing them with placeholders
    const mathBlocks: string[] = [];

    // Protect display math $$...$$
    let html = text.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      mathBlocks.push(match);
      return `%%MATH_BLOCK_${mathBlocks.length - 1}%%`;
    });

    // Protect inline math $...$
    html = html.replace(/\$[^$\n]+?\$/g, (match) => {
      mathBlocks.push(match);
      return `%%MATH_BLOCK_${mathBlocks.length - 1}%%`;
    });

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic (single *)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

    // Tables
    if (html.includes("|")) {
      const lines = html.split("\n");
      let inTable = false;
      const processed: string[] = [];
      for (const line of lines) {
        if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
          if (!inTable) {
            processed.push('<table class="latex-table">');
            inTable = true;
          }
          if (line.includes("---")) continue;
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
      html = processed.join("\n");
    }

    // Paragraphs: double newline = new paragraph
    html = html.replace(/\n\n/g, "</p><p>");
    // Single newline = <br/> only outside math
    html = html.replace(/\n/g, "<br/>");

    // Restore math blocks
    html = html.replace(/%%MATH_BLOCK_(\d+)%%/g, (_, idx) => mathBlocks[parseInt(idx)]);

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
