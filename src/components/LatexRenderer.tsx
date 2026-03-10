"use client";

import { useEffect, useRef, useState, memo, useMemo } from "react";

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

// Lazy-loaded DOMPurify — avoids loading the ~15KB library until first render
let purifyInstance: typeof import("dompurify").default | null = null;
let purifyPromise: Promise<typeof import("dompurify").default> | null = null;

function getPurify(): Promise<typeof import("dompurify").default> {
  if (purifyInstance) return Promise.resolve(purifyInstance);
  if (!purifyPromise) {
    purifyPromise = import("dompurify").then((mod) => {
      purifyInstance = mod.default;
      return purifyInstance;
    });
  }
  return purifyPromise;
}

const PURIFY_OPTIONS = { ADD_TAGS: ["figure", "figcaption", "u"], ADD_ATTR: ["class"] };

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

  // Images: ![alt](url) or ![alt](url "caption")
  html = html.replace(
    /!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src, caption) => {
      const captionHtml = caption
        ? `<figcaption class="text-xs text-neutral-400 mt-2 text-center">${caption}</figcaption>`
        : "";
      return `<figure class="my-4 flex flex-col items-center"><img src="${src}" alt="${alt}" class="max-w-full h-auto border border-neutral-200" loading="lazy" decoding="async" />${captionHtml}</figure>`;
    }
  );

  // LaTeX text commands (outside math mode)
  html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-lg font-bold mt-6 mb-2">$1</h2>');
  html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-base font-semibold mt-4 mb-1">$1</h3>');
  html = html.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  html = html.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");
  html = html.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');
  html = html.replace(/\\emph\{([^}]+)\}/g, "<em>$1</em>");

  // Markdown bold/italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
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
  const [sanitizedHtml, setSanitizedHtml] = useState<string | null>(null);

  const formattedHtml = useMemo(() => formatContent(content), [content]);

  // Load DOMPurify lazily and sanitize
  useEffect(() => {
    let cancelled = false;
    getPurify().then((purify) => {
      if (!cancelled) {
        setSanitizedHtml(purify.sanitize(formattedHtml, PURIFY_OPTIONS));
      }
    });
    return () => { cancelled = true; };
  }, [formattedHtml]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !window.MathJax || sanitizedHtml === null) return;

    const doTypeset = () => {
      window.MathJax?.typesetClear?.([el]);
      window.MathJax?.typesetPromise?.([el]).catch(console.error);
    };

    if (window.MathJax.startup?.promise) {
      window.MathJax.startup.promise.then(doTypeset);
    } else {
      doTypeset();
    }
  }, [sanitizedHtml]);

  if (sanitizedHtml === null) {
    return <div className="latex-content prose prose-sm max-w-none animate-pulse h-8 bg-neutral-100 rounded" />;
  }

  return (
    <div
      ref={containerRef}
      className="latex-content prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

const LatexRenderer = memo(LatexRendererInner);
export default LatexRenderer;
