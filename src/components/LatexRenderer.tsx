"use client";

import { useEffect, useRef, memo } from "react";

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

function formatContent(text: string): string {
  const mathBlocks: string[] = [];

  // Protect display math $$...$$
  let html = text.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    mathBlocks.push(match);
    return `%%MATHBLOCK${mathBlocks.length - 1}%%`;
  });

  // Protect inline math $...$
  html = html.replace(/\$[^$\n]+?\$/g, (match) => {
    mathBlocks.push(match);
    return `%%MATHBLOCK${mathBlocks.length - 1}%%`;
  });

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
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

  // Double newline = paragraph break
  html = html.replace(/\n\n/g, "</p><p>");
  // Single newline = <br/>
  html = html.replace(/\n/g, "<br/>");

  // Restore math blocks — remove <br/> directly before/after display math
  html = html.replace(/%%MATHBLOCK(\d+)%%/g, (_, idx) => {
    const block = mathBlocks[parseInt(idx)];
    if (block.startsWith("$$")) {
      return block;
    }
    return block;
  });

  // Clean up <br/> directly adjacent to display math
  html = html.replace(/<br\/>\s*(\$\$)/g, "$1");
  html = html.replace(/(\$\$)\s*<br\/>/g, "$1");

  return `<p>${html}</p>`;
}

function LatexRendererInner({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !window.MathJax) return;

    const doTypeset = () => {
      window.MathJax?.typesetClear?.([el]);
      window.MathJax?.typesetPromise?.([el]).catch(console.error);
    };

    if (window.MathJax.startup?.promise) {
      window.MathJax.startup.promise.then(doTypeset);
    } else {
      doTypeset();
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="latex-content prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}

const LatexRenderer = memo(LatexRendererInner);
export default LatexRenderer;
