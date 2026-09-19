"use client";

import React, { useMemo } from "react";
import { CheckSquare, Square, ExternalLink, Copy, Check } from "lucide-react";

type RichTextViewerProps = {
  content?: string | null;
  placeholder?: string;
  className?: string;
  maxLines?: number;
};

// Safe sanitize URL helper (blocks javascript: and invalid schemes)
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|\/)/i.test(trimmed)) {
    return trimmed;
  }
  return "#";
}

// Basic markdown-to-React elements parser
export default function RichTextViewer({
  content,
  placeholder = "No content provided.",
  className = "",
  maxLines,
}: RichTextViewerProps): React.JSX.Element {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parsedElements = useMemo(() => {
    if (!content || !content.trim()) return null;

    const lines = content.replace(/\r\n/g, "\n").split("\n");
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = "";
    let codeBlockIndex = 0;

    let inList = false;
    let listType: "ul" | "ol" = "ul";
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        if (listType === "ol") {
          elements.push(
            <ol
              key={`list-${elements.length}`}
              className="list-decimal list-outside ml-5 my-2 space-y-1 text-sm text-[var(--color-text-primary)]"
            >
              {listItems}
            </ol>
          );
        } else {
          elements.push(
            <ul
              key={`list-${elements.length}`}
              className="list-disc list-outside ml-5 my-2 space-y-1 text-sm text-[var(--color-text-primary)]"
            >
              {listItems}
            </ul>
          );
        }
        listItems = [];
        inList = false;
      }
    };

    const parseInline = (text: string): React.ReactNode[] => {
      const tokens: React.ReactNode[] = [];
      let remaining = text;
      let keyCounter = 0;

      while (remaining.length > 0) {
        // 1. Inline code: `code`
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
          tokens.push(
            <code
              key={`inline-code-${keyCounter++}`}
              className="px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono bg-[var(--color-surface-raised)] text-[var(--color-brand)] border border-[var(--color-border)]"
            >
              {codeMatch[1]}
            </code>
          );
          remaining = remaining.slice(codeMatch[0].length);
          continue;
        }

        // 2. Bold + Italic: ***text*** or ___text___
        const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.*?)\1/);
        if (boldItalicMatch) {
          tokens.push(
            <strong key={`bi-${keyCounter++}`} className="font-bold italic">
              {boldItalicMatch[2]}
            </strong>
          );
          remaining = remaining.slice(boldItalicMatch[0].length);
          continue;
        }

        // 3. Bold: **text** or __text__
        const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
        if (boldMatch) {
          tokens.push(
            <strong key={`b-${keyCounter++}`} className="font-semibold text-[var(--color-text-primary)]">
              {boldMatch[2]}
            </strong>
          );
          remaining = remaining.slice(boldMatch[0].length);
          continue;
        }

        // 4. Strikethrough: ~~text~~
        const strikeMatch = remaining.match(/^~~(.*?)~~/);
        if (strikeMatch) {
          tokens.push(
            <s key={`strike-${keyCounter++}`} className="line-through text-[var(--color-text-muted)]">
              {strikeMatch[1]}
            </s>
          );
          remaining = remaining.slice(strikeMatch[0].length);
          continue;
        }

        // 5. Italic: *text* or _text_
        const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
        if (italicMatch && italicMatch[2].trim().length > 0) {
          tokens.push(
            <em key={`i-${keyCounter++}`} className="italic">
              {italicMatch[2]}
            </em>
          );
          remaining = remaining.slice(italicMatch[0].length);
          continue;
        }

        // 6. Link: [title](url)
        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const safeUrl = sanitizeUrl(linkMatch[2]);
          tokens.push(
            <a
              key={`link-${keyCounter++}`}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[var(--color-brand)] underline hover:text-[var(--color-brand-hover)] transition-colors"
            >
              <span>{linkMatch[1]}</span>
              <ExternalLink size={11} className="inline opacity-70" />
            </a>
          );
          remaining = remaining.slice(linkMatch[0].length);
          continue;
        }

        // Find next token position
        const nextSpecial = remaining.search(/[`*_~\[]/);
        if (nextSpecial === -1) {
          tokens.push(remaining);
          break;
        } else if (nextSpecial === 0) {
          tokens.push(remaining[0]);
          remaining = remaining.slice(1);
        } else {
          tokens.push(remaining.slice(0, nextSpecial));
          remaining = remaining.slice(nextSpecial);
        }
      }

      return tokens;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Code Block Boundary
      if (trimmedLine.startsWith("```")) {
        flushList();
        if (inCodeBlock) {
          const codeText = codeBlockContent.join("\n");
          const curIndex = codeBlockIndex++;
          elements.push(
            <div
              key={`codeblock-${index}`}
              className="my-3 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs relative group"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] font-mono">
                <span>{codeBlockLang || "code"}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeText, curIndex)}
                  className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedIndex === curIndex ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-xs font-mono text-[var(--color-text-primary)] overflow-x-auto whitespace-pre leading-relaxed">
                <code>{codeText}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLang = "";
        } else {
          inCodeBlock = true;
          codeBlockLang = trimmedLine.slice(3).trim();
          codeBlockContent = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Horizontal Rule
      if (/^(---|___|\*\*\*)$/.test(trimmedLine)) {
        flushList();
        elements.push(
          <hr
            key={`hr-${index}`}
            className="my-4 border-t border-[var(--color-border)]"
          />
        );
        return;
      }

      // Headings
      if (trimmedLine.startsWith("# ")) {
        flushList();
        elements.push(
          <h1
            key={`h1-${index}`}
            className="text-lg font-bold text-[var(--color-text-primary)] mt-4 mb-2 first:mt-0 tracking-tight"
          >
            {parseInline(trimmedLine.slice(2))}
          </h1>
        );
        return;
      }

      if (trimmedLine.startsWith("## ")) {
        flushList();
        elements.push(
          <h2
            key={`h2-${index}`}
            className="text-base font-bold text-[var(--color-text-primary)] mt-3 mb-1.5 first:mt-0"
          >
            {parseInline(trimmedLine.slice(3))}
          </h2>
        );
        return;
      }

      if (trimmedLine.startsWith("### ")) {
        flushList();
        elements.push(
          <h3
            key={`h3-${index}`}
            className="text-sm font-semibold text-[var(--color-text-primary)] mt-2.5 mb-1 first:mt-0"
          >
            {parseInline(trimmedLine.slice(4))}
          </h3>
        );
        return;
      }

      // Blockquotes
      if (trimmedLine.startsWith("> ")) {
        flushList();
        elements.push(
          <blockquote
            key={`quote-${index}`}
            className="border-l-2 border-[var(--color-brand)] pl-3 my-2 text-sm text-[var(--color-text-secondary)] italic bg-[var(--color-surface)]/50 py-1 rounded-r"
          >
            {parseInline(trimmedLine.slice(2))}
          </blockquote>
        );
        return;
      }

      // Checklist items: - [ ] or - [x]
      const checklistMatch = trimmedLine.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (checklistMatch) {
        flushList();
        const isChecked = checklistMatch[1].toLowerCase() === "x";
        elements.push(
          <div
            key={`check-${index}`}
            className="flex items-start gap-2 my-1 text-sm text-[var(--color-text-primary)]"
          >
            <span className="shrink-0 mt-0.5">
              {isChecked ? (
                <CheckSquare size={15} className="text-[var(--color-brand)]" />
              ) : (
                <Square size={15} className="text-[var(--color-text-muted)]" />
              )}
            </span>
            <span className={isChecked ? "line-through text-[var(--color-text-muted)]" : ""}>
              {parseInline(checklistMatch[2])}
            </span>
          </div>
        );
        return;
      }

      // Bullet List: - item or * item
      if (/^[-*]\s+/.test(trimmedLine)) {
        if (!inList || listType !== "ul") {
          flushList();
          inList = true;
          listType = "ul";
        }
        listItems.push(
          <li key={`li-${index}`} className="leading-relaxed">
            {parseInline(trimmedLine.replace(/^[-*]\s+/, ""))}
          </li>
        );
        return;
      }

      // Numbered List: 1. item
      const numListMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
      if (numListMatch) {
        if (!inList || listType !== "ol") {
          flushList();
          inList = true;
          listType = "ol";
        }
        listItems.push(
          <li key={`li-${index}`} className="leading-relaxed">
            {parseInline(numListMatch[2])}
          </li>
        );
        return;
      }

      // Empty line / paragraph break
      if (!trimmedLine) {
        flushList();
        elements.push(<div key={`empty-${index}`} className="h-2" />);
        return;
      }

      // Standard Paragraph
      flushList();
      elements.push(
        <p key={`p-${index}`} className="text-sm text-[var(--color-text-primary)] leading-relaxed my-1">
          {parseInline(trimmedLine)}
        </p>
      );
    });

    flushList();

    return elements;
  }, [content, copiedIndex]);

  if (!content || !content.trim()) {
    return (
      <div className={`text-sm text-[var(--color-text-muted)] italic ${className}`}>
        {placeholder}
      </div>
    );
  }

  const maxLinesStyle = maxLines
    ? {
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical" as const,
        overflow: "hidden",
      }
    : undefined;

  return (
    <div
      className={`prose prose-invert max-w-none text-sm text-[var(--color-text-primary)] space-y-0.5 ${className}`}
      style={maxLinesStyle}
    >
      {parsedElements}
    </div>
  );
}
