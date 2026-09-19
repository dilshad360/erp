"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Link as LinkIcon,
  Minus,
  FileCode,
  Eye,
  Edit3,
  X,
  Check,
} from "lucide-react";
import RichTextViewer from "./RichTextViewer";

export type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
};

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write something with rich formatting...",
  minHeight = "140px",
  disabled = false,
  error,
  className = "",
}: RichTextEditorProps): React.JSX.Element {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [internalValue, setInternalValue] = useState(value);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInternalValue(value ?? "");
  }, [value]);

  const updateValue = useCallback(
    (newValue: string) => {
      setInternalValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  // Helper to wrap or insert text at current selection
  const applyWrap = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selectedText = current.substring(start, end);

    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultPlaceholder || "text"}${suffix}`;

    const nextValue = current.substring(0, start) + replacement + current.substring(end);
    updateValue(nextValue);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + replacement.length
        : start + prefix.length + (defaultPlaceholder || "text").length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Helper to insert prefix at start of lines (for lists, headings, quotes)
  const applyLinePrefix = (linePrefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;

    const lineStart = current.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = current.indexOf("\n", end);
    const effectiveLineEnd = lineEnd === -1 ? current.length : lineEnd;

    const selectedBlock = current.substring(lineStart, effectiveLineEnd);
    const lines = selectedBlock.split("\n");

    const modifiedLines = lines.map((line) => {
      if (line.startsWith(linePrefix)) {
        return line.slice(linePrefix.length);
      }
      return `${linePrefix}${line}`;
    });

    const replacement = modifiedLines.join("\n");
    const nextValue = current.substring(0, lineStart) + replacement + current.substring(effectiveLineEnd);
    updateValue(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + replacement.length, lineStart + replacement.length);
    }, 0);
  };

  // Link Insertion
  const handleOpenLinkModal = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      setLinkText(selected);
    }
    setLinkUrl("");
    setIsLinkModalOpen(true);
  };

  const handleConfirmLink = () => {
    if (!linkUrl.trim()) {
      setIsLinkModalOpen(false);
      return;
    }

    const title = linkText.trim() || linkUrl.trim();
    const formattedUrl = /^https?:\/\//i.test(linkUrl.trim())
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    applyWrap(`[${title}](`, `)`, formattedUrl);
    setIsLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Handle Keyboard shortcuts & smart Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    // Shortcuts: Ctrl/Cmd + B, I, K
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        applyWrap("**", "**", "bold text");
        return;
      }
      if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        applyWrap("*", "*", "italic text");
        return;
      }
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleOpenLinkModal();
        return;
      }
    }

    // Auto list continuation on Enter
    if (e.key === "Enter" && !e.shiftKey) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursor = textarea.selectionStart;
      const current = textarea.value;
      const lineStart = current.lastIndexOf("\n", cursor - 1) + 1;
      const currentLine = current.substring(lineStart, cursor);

      // Check for bullet list, checklist, or numbered list
      const bulletMatch = currentLine.match(/^([-*])\s+(.*)$/);
      const checklistMatch = currentLine.match(/^([-*]\s+\[[ xX]?\])\s+(.*)$/);
      const numMatch = currentLine.match(/^(\d+)\.\s+(.*)$/);

      if (checklistMatch) {
        if (!checklistMatch[2].trim()) {
          // Empty checklist item -> clear prefix
          e.preventDefault();
          const nextValue = current.substring(0, lineStart) + current.substring(cursor);
          updateValue(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          e.preventDefault();
          const nextPrefix = "\n- [ ] ";
          const nextValue = current.substring(0, cursor) + nextPrefix + current.substring(cursor);
          updateValue(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(cursor + nextPrefix.length, cursor + nextPrefix.length);
          }, 0);
        }
        return;
      }

      if (bulletMatch) {
        if (!bulletMatch[2].trim()) {
          // Empty bullet item -> clear line
          e.preventDefault();
          const nextValue = current.substring(0, lineStart) + current.substring(cursor);
          updateValue(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          e.preventDefault();
          const nextPrefix = `\n${bulletMatch[1]} `;
          const nextValue = current.substring(0, cursor) + nextPrefix + current.substring(cursor);
          updateValue(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(cursor + nextPrefix.length, cursor + nextPrefix.length);
          }, 0);
        }
        return;
      }

      if (numMatch) {
        if (!numMatch[2].trim()) {
          // Empty number item -> clear line
          e.preventDefault();
          const nextValue = current.substring(0, lineStart) + current.substring(cursor);
          updateValue(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          e.preventDefault();
          const nextNum = parseInt(numMatch[1], 10) + 1;
          const nextPrefix = `\n${nextNum}. `;
          const nextValue = current.substring(0, cursor) + nextPrefix + current.substring(cursor);
          updateValue(nextValue);
          setTimeout(() => {
            textarea.setSelectionRange(cursor + nextPrefix.length, cursor + nextPrefix.length);
          }, 0);
        }
        return;
      }
    }
  };

  return (
    <div
      className={`flex flex-col rounded-xl border transition-all ${
        error
          ? "border-[var(--color-danger)] focus-within:ring-2 focus-within:ring-[var(--color-danger)]/20"
          : "border-[var(--color-border)] focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand-subtle)]"
      } bg-[var(--color-surface)] overflow-hidden ${className}`}
    >
      {/* Top Header & Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] select-none">
        {/* Formatting Actions (Active in Write Mode) */}
        <div className="flex items-center gap-0.5 overflow-x-auto touch-pan-x py-0.5 max-w-full">
          {mode === "write" ? (
            <>
              {/* Text formatting */}
              <button
                type="button"
                onClick={() => applyWrap("**", "**", "bold text")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Bold (Ctrl+B)"
                aria-label="Bold"
              >
                <Bold size={15} />
              </button>

              <button
                type="button"
                onClick={() => applyWrap("*", "*", "italic text")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Italic (Ctrl+I)"
                aria-label="Italic"
              >
                <Italic size={15} />
              </button>

              <button
                type="button"
                onClick={() => applyWrap("~~", "~~", "strikethrough")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Strikethrough"
                aria-label="Strikethrough"
              >
                <Strikethrough size={15} />
              </button>

              <button
                type="button"
                onClick={() => applyWrap("`", "`", "code")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Inline Code"
                aria-label="Inline Code"
              >
                <Code size={15} />
              </button>

              <div className="h-4 w-px bg-[var(--color-border)] mx-1" />

              {/* Headings */}
              <button
                type="button"
                onClick={() => applyLinePrefix("## ")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Heading 2"
                aria-label="Heading 2"
              >
                <Heading2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => applyLinePrefix("### ")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Heading 3"
                aria-label="Heading 3"
              >
                <Heading3 size={15} />
              </button>

              <div className="h-4 w-px bg-[var(--color-border)] mx-1" />

              {/* Lists */}
              <button
                type="button"
                onClick={() => applyLinePrefix("- ")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Bullet List"
                aria-label="Bullet List"
              >
                <List size={15} />
              </button>

              <button
                type="button"
                onClick={() => applyLinePrefix("1. ")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Numbered List"
                aria-label="Numbered List"
              >
                <ListOrdered size={15} />
              </button>

              <button
                type="button"
                onClick={() => applyLinePrefix("- [ ] ")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Task Checklist"
                aria-label="Task Checklist"
              >
                <ListTodo size={15} />
              </button>

              <div className="h-4 w-px bg-[var(--color-border)] mx-1" />

              {/* Blocks & Extras */}
              <button
                type="button"
                onClick={() => applyLinePrefix("> ")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Quote"
                aria-label="Quote"
              >
                <Quote size={15} />
              </button>

              <button
                type="button"
                onClick={() => applyWrap("```\n", "\n```", "code block")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Code Block"
                aria-label="Code Block"
              >
                <FileCode size={15} />
              </button>

              <button
                type="button"
                onClick={handleOpenLinkModal}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Add Link (Ctrl+K)"
                aria-label="Add Link"
              >
                <LinkIcon size={15} />
              </button>

              <button
                type="button"
                onClick={() => applyWrap("\n---\n", "", "")}
                disabled={disabled}
                className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 cursor-pointer"
                title="Horizontal Divider"
                aria-label="Horizontal Divider"
              >
                <Minus size={15} />
              </button>
            </>
          ) : (
            <span className="text-xs font-medium text-[var(--color-text-muted)] px-2">
              Viewing formatted live preview
            </span>
          )}
        </div>

        {/* Mode Toggle (Write vs Preview) */}
        <div className="flex items-center gap-1 bg-[var(--color-surface)] p-0.5 rounded-lg border border-[var(--color-border)] ml-auto shrink-0">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              mode === "write"
                ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-xs"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <Edit3 size={13} />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              mode === "preview"
                ? "bg-[var(--color-surface-raised)] text-[var(--color-brand)] shadow-xs"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {mode === "write" ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={internalValue}
            onChange={(e) => updateValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full p-3.5 text-sm bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none resize-y leading-relaxed font-sans"
          />

          {/* Character counter / hint */}
          <div className="flex items-center justify-between px-3 py-1 bg-[var(--color-surface-raised)]/40 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] select-none">
            <span>Markdown supported (Ctrl+B, Ctrl+I, Ctrl+K)</span>
            <span>{internalValue.length} chars</span>
          </div>
        </div>
      ) : (
        <div
          style={{ minHeight }}
          className="p-4 overflow-y-auto bg-[var(--color-surface)]/60"
        >
          <RichTextViewer
            content={internalValue}
            placeholder="Nothing to preview yet. Switch to Write tab to add formatted content."
          />
        </div>
      )}

      {/* Inline Link Modal */}
      {isLinkModalOpen && (
        <div className="p-3 bg-[var(--color-surface-raised)] border-t border-[var(--color-border)] flex flex-wrap items-center gap-2 animate-in fade-in">
          <div className="flex-1 min-w-[140px]">
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Link display text"
              className="w-full px-2.5 py-1 text-xs rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)]"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmLink();
                }
              }}
              autoFocus
              className="w-full px-2.5 py-1 text-xs rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)]"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={handleConfirmLink}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors cursor-pointer"
            >
              <Check size={12} />
              <span>Insert</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(false)}
              className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
