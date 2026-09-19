"use client";

import React, { useMemo } from "react";

type RichTextViewerProps = {
  content?: string | null;
  placeholder?: string;
  className?: string;
  maxLines?: number;
};

// Safe sanitize URL helper (blocks javascript:, data:, and vbscript:)
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(trimmed)) {
    return true;
  }
  return false;
}

// Client-side HTML sanitizer to prevent XSS without heavy dependencies
function sanitizeHtml(dirtyHtml: string): string {
  if (typeof window === "undefined") {
    // Basic SSR sanitize via regex stripping script, iframe, onerror, onclick, etc.
    return dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "")
      .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml, "text/html");

    // Remove any forbidden elements
    const forbiddenTags = ["script", "iframe", "object", "embed", "link", "style", "form", "input", "button", "meta"];
    forbiddenTags.forEach((tag) => {
      const elements = doc.body.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    });

    // Walk all elements and strip dangerous attributes and event listeners
    const allElements = doc.body.querySelectorAll("*");
    allElements.forEach((el) => {
      const attributes = Array.from(el.attributes);
      for (const attr of attributes) {
        const name = attr.name.toLowerCase();
        const val = attr.value;

        // Strip any event handler attributes (onclick, onerror, onload, onmouseover, etc.)
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
          continue;
        }

        // Validate links
        if (name === "href") {
          if (!isSafeUrl(val)) {
            el.setAttribute("href", "#");
          } else {
            el.setAttribute("target", "_blank");
            el.setAttribute("rel", "noopener noreferrer");
          }
        }
      }
    });

    return doc.body.innerHTML;
  } catch {
    return dirtyHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
}

// Detect if string looks like HTML or markdown/plain text
function isHtmlContent(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export default function RichTextViewer({
  content,
  placeholder = "No content provided.",
  className = "",
  maxLines,
}: RichTextViewerProps): React.JSX.Element {
  const sanitizedContent = useMemo(() => {
    if (!content || !content.trim()) return null;

    const trimmed = content.trim();

    // If it's already HTML (from WYSIWYG)
    if (isHtmlContent(trimmed)) {
      return sanitizeHtml(trimmed);
    }

    // Otherwise, convert plain text / simple markdown newlines to HTML paragraphs
    const paragraphs = trimmed
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");

    return sanitizeHtml(paragraphs);
  }, [content]);

  if (!sanitizedContent) {
    return (
      <p className={`text-sm text-[var(--color-text-muted)] italic ${className}`}>
        {placeholder}
      </p>
    );
  }

  return (
    <div
      style={
        maxLines
          ? {
              display: "-webkit-box",
              WebkitLineClamp: maxLines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }
          : undefined
      }
      className={`prose-viewer text-sm text-[var(--color-text-secondary)] leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
