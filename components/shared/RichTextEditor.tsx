"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
  ChevronDown,
  X,
  Check,
} from "lucide-react";

export type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
};

interface ActiveStates {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
  heading: string; // 'p' | 'h1' | 'h2' | 'h3'
  isLink: boolean;
}

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Type your description here...",
  minHeight = "150px",
  disabled = false,
  error,
  className = "",
}: RichTextEditorProps): React.JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeStates, setActiveStates] = useState<ActiveStates>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    heading: "p",
    isLink: false,
  });

  const [isHeadingDropdownOpen, setIsHeadingDropdownOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value || value === "<p><br></p>" || value === "<p></p>");

  // Initialize and sync external value without resetting cursor on active typing
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentHtml = editor.innerHTML;
    const incomingHtml = value || "";

    // Check if truly empty
    const checkEmpty = (html: string) => {
      const stripped = html.replace(/<[^>]*>/g, "").trim();
      return !stripped && !html.includes("<img");
    };

    if (currentHtml !== incomingHtml && document.activeElement !== editor) {
      editor.innerHTML = incomingHtml;
      setIsEmpty(checkEmpty(incomingHtml));
    }
  }, [value]);

  // Query formatting states at current selection
  const updateActiveStates = useCallback(() => {
    if (!editorRef.current || typeof document === "undefined") return;

    try {
      const isBold = document.queryCommandState("bold");
      const isItalic = document.queryCommandState("italic");
      const isUnderline = document.queryCommandState("underline");
      const isStrike = document.queryCommandState("strikeThrough");
      const isUl = document.queryCommandState("insertUnorderedList");
      const isOl = document.queryCommandState("insertOrderedList");
      const isLeft = document.queryCommandState("justifyLeft");
      const isCenter = document.queryCommandState("justifyCenter");
      const isRight = document.queryCommandState("justifyRight");

      // Heading and Link detection from selection parent
      let currentHeading = "p";
      let insideLink = false;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = (node as HTMLElement).tagName.toLowerCase();
            if (["h1", "h2", "h3"].includes(tagName)) {
              currentHeading = tagName;
            }
            if (tagName === "a") {
              insideLink = true;
            }
          }
          node = node.parentNode;
        }
      }

      setActiveStates({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strikeThrough: isStrike,
        insertUnorderedList: isUl,
        insertOrderedList: isOl,
        justifyLeft: isLeft,
        justifyCenter: isCenter,
        justifyRight: isRight,
        heading: currentHeading,
        isLink: insideLink,
      });
    } catch {
      // Ignore queryCommandState errors in edge cases
    }
  }, []);

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.innerHTML;
    const textContent = editor.textContent?.trim() || "";
    const empty = textContent.length === 0 && !html.includes("<img");
    setIsEmpty(empty);

    const emittedValue = empty ? "" : html;
    onChange?.(emittedValue);
    updateActiveStates();
  }, [onChange, updateActiveStates]);

  const exec = (command: string, valueArg: string | undefined = undefined) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, valueArg);
    handleInput();
    updateActiveStates();
  };

  const handleHeadingChange = (tag: string) => {
    setIsHeadingDropdownOpen(false);
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    if (tag === "p") {
      document.execCommand("formatBlock", false, "<p>");
    } else {
      document.execCommand("formatBlock", false, `<${tag}>`);
    }
    handleInput();
    updateActiveStates();
  };

  const openLinkModal = () => {
    if (disabled) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedSelection(sel.getRangeAt(0).cloneRange());
    }

    // Check if cursor is on an existing link
    let currentUrl = "";
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === "a") {
          currentUrl = (node as HTMLAnchorElement).getAttribute("href") || "";
          break;
        }
        node = node.parentNode;
      }
    }

    setLinkUrl(currentUrl);
    setIsLinkModalOpen(true);
  };

  const applyLink = () => {
    setIsLinkModalOpen(false);
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (savedSelection) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelection);
      }
    }

    if (!linkUrl.trim()) {
      document.execCommand("unlink", false);
    } else {
      let url = linkUrl.trim();
      if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !url.startsWith("/")) {
        url = `https://${url}`;
      }
      document.execCommand("createLink", false, url);

      // Ensure link opens in new tab with security attributes
      const links = editorRef.current.querySelectorAll("a");
      links.forEach((a) => {
        if (a.getAttribute("href") === url) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
          a.className = "text-[var(--color-brand)] underline hover:text-[var(--color-brand-hover)]";
        }
      });
    }

    setLinkUrl("");
    setSavedSelection(null);
    handleInput();
    updateActiveStates();
  };

  const removeLink = () => {
    exec("unlink");
    setIsLinkModalOpen(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Clean up pasted content
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  };

  const headingLabels: Record<string, string> = {
    p: "Normal Text",
    h1: "Large Heading",
    h2: "Medium Heading",
    h3: "Small Heading",
  };

  return (
    <div
      className={`rounded-xl border transition-colors overflow-hidden bg-[var(--color-surface)] ${
        error
          ? "border-red-500/60 ring-1 ring-red-500/20"
          : "border-[var(--color-border)] focus-within:border-[var(--color-brand)] focus-within:ring-1 focus-within:ring-[var(--color-brand)]/20"
      } ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}
    >
      {/* WYSIWYG Toolbar */}
      <div className="flex items-center flex-wrap gap-1 p-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] select-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[var(--color-border)]">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={() => exec("undo")}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={() => exec("redo")}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <RotateCw size={15} />
          </button>
        </div>

        {/* Heading Dropdown */}
        <div className="relative pr-1 border-r border-[var(--color-border)]">
          <button
            type="button"
            title="Text Style"
            onClick={() => setIsHeadingDropdownOpen(!isHeadingDropdownOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] border border-transparent hover:border-[var(--color-border)] transition-colors"
          >
            <span>{headingLabels[activeStates.heading] || "Normal Text"}</span>
            <ChevronDown size={13} className="text-[var(--color-text-muted)]" />
          </button>

          {isHeadingDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsHeadingDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 z-30 min-w-[150px] py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleHeadingChange("p")}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-surface-raised)] ${
                    activeStates.heading === "p"
                      ? "text-[var(--color-brand)] font-semibold"
                      : "text-[var(--color-text-primary)]"
                  }`}
                >
                  Normal Text
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadingChange("h1")}
                  className={`w-full text-left px-3 py-1.5 text-sm font-bold transition-colors hover:bg-[var(--color-surface-raised)] ${
                    activeStates.heading === "h1"
                      ? "text-[var(--color-brand)] font-bold"
                      : "text-[var(--color-text-primary)]"
                  }`}
                >
                  Large Heading
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadingChange("h2")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--color-surface-raised)] ${
                    activeStates.heading === "h2"
                      ? "text-[var(--color-brand)] font-semibold"
                      : "text-[var(--color-text-primary)]"
                  }`}
                >
                  Medium Heading
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadingChange("h3")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-raised)] ${
                    activeStates.heading === "h3"
                      ? "text-[var(--color-brand)] font-semibold"
                      : "text-[var(--color-text-primary)]"
                  }`}
                >
                  Small Heading
                </button>
              </div>
            </>
          )}
        </div>

        {/* Basic Formatting: Bold, Italic, Underline, Strikethrough */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[var(--color-border)]">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onClick={() => exec("bold")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.bold
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)] font-bold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onClick={() => exec("italic")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.italic
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onClick={() => exec("underline")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.underline
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <Underline size={15} />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => exec("strikeThrough")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.strikeThrough
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <Strikethrough size={15} />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[var(--color-border)]">
          <button
            type="button"
            title="Bullet List"
            onClick={() => exec("insertUnorderedList")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.insertUnorderedList
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <List size={15} />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => exec("insertOrderedList")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.insertOrderedList
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            title="Quote Block"
            onClick={() => {
              if (disabled || !editorRef.current) return;
              editorRef.current.focus();
              document.execCommand("formatBlock", false, "<blockquote>");
              handleInput();
            }}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Quote size={15} />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[var(--color-border)]">
          <button
            type="button"
            title="Align Left"
            onClick={() => exec("justifyLeft")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.justifyLeft
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <AlignLeft size={15} />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => exec("justifyCenter")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.justifyCenter
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <AlignCenter size={15} />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => exec("justifyRight")}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.justifyRight
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <AlignRight size={15} />
          </button>
        </div>

        {/* Link & Clear Format */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title={activeStates.isLink ? "Edit Link" : "Insert Link"}
            onClick={openLinkModal}
            className={`p-1.5 rounded-md transition-colors ${
              activeStates.isLink
                ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <LinkIcon size={15} />
          </button>
          {activeStates.isLink && (
            <button
              type="button"
              title="Remove Link"
              onClick={removeLink}
              className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Unlink size={15} />
            </button>
          )}
          <button
            type="button"
            title="Clear Formatting"
            onClick={() => exec("removeFormat")}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <RemoveFormatting size={15} />
          </button>
        </div>
      </div>

      {/* Editable Canvas */}
      <div className="relative p-4">
        {isEmpty && (
          <div
            className="absolute top-4 left-4 text-sm text-[var(--color-text-muted)] pointer-events-none select-none"
            aria-hidden="true"
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyUp={updateActiveStates}
          onMouseUp={updateActiveStates}
          onSelect={updateActiveStates}
          onPaste={handlePaste}
          style={{ minHeight }}
          className="focus:outline-none text-sm text-[var(--color-text-primary)] leading-relaxed space-y-2 prose-editor"
        />
      </div>

      {/* Inline Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div
            className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <LinkIcon size={16} className="text-[var(--color-brand)]" />
                {activeStates.isLink ? "Edit Link" : "Insert Web Link"}
              </h4>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyLink();
                    }
                  }}
                  autoFocus
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyLink}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] flex items-center gap-1.5 shadow-sm"
              >
                <Check size={14} />
                Apply Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoped CSS for Rich Text Editor content styling */}
      <style jsx global>{`
        .prose-editor h1 {
          font-size: 1.35rem;
          font-weight: 700;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
          color: var(--color-text-primary);
        }
        .prose-editor h2 {
          font-size: 1.15rem;
          font-weight: 600;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
          color: var(--color-text-primary);
        }
        .prose-editor h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-top: 0.35rem;
          margin-bottom: 0.2rem;
          color: var(--color-text-primary);
        }
        .prose-editor ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin: 0.35rem 0;
        }
        .prose-editor ol {
          list-style-type: decimal;
          padding-left: 1.25rem;
          margin: 0.35rem 0;
        }
        .prose-editor li {
          margin: 0.15rem 0;
        }
        .prose-editor blockquote {
          border-left: 3px solid var(--color-brand);
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          font-style: italic;
          color: var(--color-text-secondary);
        }
        .prose-editor a {
          color: var(--color-brand);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
