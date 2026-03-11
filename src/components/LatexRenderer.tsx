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

const PURIFY_OPTIONS = {
  ADD_TAGS: ["figure", "figcaption", "u", "dl", "dt", "dd", "blockquote", "hr"],
  ADD_ATTR: ["class", "loading", "decoding", "style"],
};

// LaTeX math environments that MathJax should handle directly
const MATH_ENVS = [
  "equation", "equation\\*", "align", "align\\*", "alignat", "alignat\\*",
  "gather", "gather\\*", "multline", "multline\\*", "flalign", "flalign\\*",
  "split", "cases", "dcases", "rcases",
  "matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix",
  "smallmatrix", "array", "subequations",
];

const MATH_ENV_RE = new RegExp(
  `\\\\begin\\{(${MATH_ENVS.join("|")})\\}[\\s\\S]*?\\\\end\\{\\1\\}`,
  "g"
);

function convertItemize(body: string): string {
  const items = body.split(/\\item\s*/).filter((s) => s.trim());
  return `<ul class="list-disc pl-6 my-2 space-y-1">${items.map((it) => `<li>${it.trim()}</li>`).join("")}</ul>`;
}

function convertEnumerate(body: string): string {
  const items = body.split(/\\item\s*/).filter((s) => s.trim());
  return `<ol class="list-decimal pl-6 my-2 space-y-1">${items.map((it) => `<li>${it.trim()}</li>`).join("")}</ol>`;
}

function convertDescription(body: string): string {
  const items = body.split(/\\item/).filter((s) => s.trim());
  return `<dl class="my-2 space-y-1">${items.map((it) => {
    const labelMatch = it.match(/^\s*\[([^\]]*)\]\s*([\s\S]*)/);
    if (labelMatch) {
      return `<dt class="font-semibold">${labelMatch[1]}</dt><dd class="pl-4">${labelMatch[2].trim()}</dd>`;
    }
    return `<dd class="pl-4">${it.trim()}</dd>`;
  }).join("")}</dl>`;
}

function formatContent(text: string): string {
  const protectedBlocks: string[] = [];

  function protect(content: string): string {
    protectedBlocks.push(content);
    return `%%BLOCK${protectedBlocks.length - 1}%%`;
  }

  let html = text;

  // 1. Protect display math $$...$$
  html = html.replace(/\$\$[\s\S]*?\$\$/g, (m) => protect(m));

  // 2. Protect \[...\] display math
  html = html.replace(/\\\[[\s\S]*?\\\]/g, (m) => protect(m));

  // 3. Protect \begin{mathenv}...\end{mathenv} — wrap with $$ for MathJax
  html = html.replace(MATH_ENV_RE, (m) => protect(`$$${m}$$`));

  // 4. Protect inline math $...$
  html = html.replace(/\$[^$\n]+?\$/g, (m) => protect(m));

  // 5. Protect \(...\) inline math
  html = html.replace(/\\\([\s\S]*?\\\)/g, (m) => protect(m));

  // 6. Convert text-level LaTeX environments to HTML
  // itemize
  html = html.replace(
    /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_, body) => convertItemize(body)
  );
  // enumerate
  html = html.replace(
    /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
    (_, body) => convertEnumerate(body)
  );
  // description
  html = html.replace(
    /\\begin\{description\}([\s\S]*?)\\end\{description\}/g,
    (_, body) => convertDescription(body)
  );
  // center
  html = html.replace(
    /\\begin\{center\}([\s\S]*?)\\end\{center\}/g,
    (_, body: string) => `<div class="text-center my-3">${body.trim()}</div>`
  );
  // quote / quotation
  html = html.replace(
    /\\begin\{(?:quote|quotation)\}([\s\S]*?)\\end\{(?:quote|quotation)\}/g,
    (_, body: string) => `<blockquote class="border-l-2 border-neutral-300 pl-4 my-3 text-neutral-600 italic">${body.trim()}</blockquote>`
  );
  // verbatim / lstlisting
  html = html.replace(
    /\\begin\{(?:verbatim|lstlisting)\}([\s\S]*?)\\end\{(?:verbatim|lstlisting)\}/g,
    (_, body: string) => `<pre class="bg-neutral-50 border border-neutral-200 p-3 my-3 text-xs font-mono overflow-x-auto whitespace-pre">${body}</pre>`
  );
  // figure (extract \includegraphics and \caption)
  html = html.replace(
    /\\begin\{figure\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{figure\}/g,
    (_, body: string) => {
      const imgMatch = body.match(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/);
      const capMatch = body.match(/\\caption\{([^}]+)\}/);
      const src = imgMatch ? imgMatch[1] : "";
      const caption = capMatch ? capMatch[1] : "";
      if (!src) return "";
      const captionHtml = caption
        ? `<figcaption class="text-xs text-neutral-400 mt-2 text-center">${caption}</figcaption>`
        : "";
      return `<figure class="my-4 flex flex-col items-center"><img src="${src}" alt="${caption || "figure"}" class="max-w-full h-auto border border-neutral-200" loading="lazy" decoding="async" />${captionHtml}</figure>`;
    }
  );
  // tabular → HTML table
  html = html.replace(
    /\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/g,
    (_, body: string) => {
      const rows = body.split(/\\\\/).filter((r: string) => r.trim() && !r.trim().startsWith("\\hline"));
      return `<table class="latex-table">${rows.map((row: string, i: number) => {
        const cells = row.split("&").map((c: string) => c.trim());
        const tag = i === 0 ? "th" : "td";
        return `<tr>${cells.map((c: string) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
      }).join("")}</table>`;
    }
  );

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

  // Section / subsection / subsubsection / paragraph
  html = html.replace(/\\section\*?\{([^}]+)\}/g, '<h2 class="text-base font-bold mt-6 mb-2">$1</h2>');
  html = html.replace(/\\subsection\*?\{([^}]+)\}/g, '<h3 class="text-sm font-semibold mt-4 mb-1">$1</h3>');
  html = html.replace(/\\subsubsection\*?\{([^}]+)\}/g, '<h4 class="text-sm font-medium mt-3 mb-1">$1</h4>');
  html = html.replace(/\\paragraph\{([^}]+)\}/g, '<strong class="block mt-3 mb-1">$1</strong>');

  // Text formatting
  html = html.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  html = html.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");
  html = html.replace(/\\texttt\{([^}]+)\}/g, '<code class="bg-neutral-100 px-1 py-0.5 text-xs font-mono">$1</code>');
  html = html.replace(/\\textsc\{([^}]+)\}/g, '<span style="font-variant:small-caps">$1</span>');
  html = html.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');
  html = html.replace(/\\emph\{([^}]+)\}/g, "<em>$1</em>");
  html = html.replace(/\\textrm\{([^}]+)\}/g, '$1');
  html = html.replace(/\\textsf\{([^}]+)\}/g, '<span class="font-sans">$1</span>');

  // Footnote (render inline)
  html = html.replace(/\\footnote\{([^}]+)\}/g, '<sup class="text-neutral-400 text-[10px]">[$1]</sup>');

  // Horizontal rule
  html = html.replace(/\\(hline|rule\{[^}]*\}\{[^}]*\}|noindent\s*\\rule\{[^}]*\}\{[^}]*\})/g, '<hr class="my-4 border-neutral-200" />');

  // Line breaks
  html = html.replace(/\\\\\s*(?:\[[\d.]+(?:em|pt|mm|cm|ex)\])?\s*(?=\n|$|%%BLOCK)/g, "<br/>");
  html = html.replace(/\\newline/g, "<br/>");
  html = html.replace(/\\\\(?=\s)/g, "<br/>");

  // Spacing commands
  html = html.replace(/\\(?:vspace|vskip)\{[^}]*\}/g, '<div class="my-3"></div>');
  html = html.replace(/\\(?:hspace|hskip)\{[^}]*\}/g, '&nbsp;');
  html = html.replace(/\\(?:bigskip|medskip|smallskip)/g, '<div class="my-2"></div>');
  html = html.replace(/\\noindent\s*/g, '');
  html = html.replace(/\\(?:quad|qquad)/g, '&emsp;');
  html = html.replace(/\\,/g, '&thinsp;');
  html = html.replace(/\\;/g, '&ensp;');
  html = html.replace(/\\~/g, '&nbsp;');
  html = html.replace(/~/g, '&nbsp;');

  // Special characters
  html = html.replace(/\\&/g, '&amp;');
  html = html.replace(/\\%/g, '%');
  html = html.replace(/\\#/g, '#');
  html = html.replace(/\\\$/g, '$');
  html = html.replace(/\\textbackslash(?:\{\})?/g, '\\');
  html = html.replace(/\\ldots|\\dots/g, '&hellip;');
  html = html.replace(/---/g, '&mdash;');
  html = html.replace(/--/g, '&ndash;');
  html = html.replace(/``/g, '&ldquo;');
  html = html.replace(/''/g, '&rdquo;');
  html = html.replace(/`/g, '&lsquo;');
  html = html.replace(/'/g, '&rsquo;');

  // Remove other no-op LaTeX commands
  html = html.replace(/\\(?:clearpage|newpage|pagebreak|maketitle|tableofcontents)\s*/g, '');
  html = html.replace(/\\(?:label|ref|eqref|cite)\{[^}]*\}/g, '');
  html = html.replace(/\\(?:usepackage|documentclass|input|include)(?:\[[^\]]*\])?\{[^}]*\}/g, '');
  html = html.replace(/\\begin\{document\}|\\end\{document\}/g, '');

  // Markdown bold/italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  // Markdown tables
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
  html = html.replace(/\n\n+/g, "</p><p>");
  // Single newline = <br/>
  html = html.replace(/\n/g, "<br/>");

  // Restore protected blocks and clean adjacent <br/>
  html = html.replace(/%%BLOCK(\d+)%%/g, (_, idx) => {
    return protectedBlocks[parseInt(idx)];
  });

  // Clean up <br/> directly adjacent to display math
  html = html.replace(/<br\/>\s*(\$\$)/g, "$1");
  html = html.replace(/(\$\$)\s*<br\/>/g, "$1");
  html = html.replace(/<br\/>\s*(\\\[)/g, "$1");
  html = html.replace(/(\\\])\s*<br\/>/g, "$1");

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

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
      className="latex-content prose prose-sm max-w-none text-[13px]"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

const LatexRenderer = memo(LatexRendererInner);
export default LatexRenderer;
