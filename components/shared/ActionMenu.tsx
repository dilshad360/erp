"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger";
  hidden?: boolean;
}

export interface ActionMenuGroup {
  items: ActionMenuItem[];
}

interface ActionMenuProps {
  groups?: ActionMenuGroup[];
  items?: ActionMenuItem[];
  align?: "end" | "start";
  menuWidthClass?: string;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  children?: React.ReactNode; // Optional custom dropdown content OR custom trigger
  renderContent?: (close: () => void) => React.ReactNode;
}

export function ActionMenu({
  groups,
  items,
  align = "end",
  menuWidthClass = "w-44",
  triggerAriaLabel = "Open options menu",
  triggerClassName = "p-1.5 rounded-md hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors",
  renderContent,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    right?: number;
    left?: number;
  }>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const estimatedMenuHeight = 220;

    const spaceBelow = viewportHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

    const newCoords: { top?: number; bottom?: number; right?: number; left?: number } = {};

    if (openUpward) {
      newCoords.bottom = viewportHeight - rect.top + 6;
    } else {
      newCoords.top = rect.bottom + 6;
    }

    if (align === "end") {
      newCoords.right = Math.max(12, viewportWidth - rect.right);
    } else {
      newCoords.left = Math.max(12, rect.left);
    }

    setCoords(newCoords);
  }, [align]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    updatePosition();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  // Normalize items to groups
  const normalizedGroups: ActionMenuGroup[] = groups
    ? groups
    : items
    ? [{ items }]
    : [];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={triggerClassName}
        aria-label={triggerAriaLabel}
        aria-expanded={isOpen}
      >
        <MoreVertical size={16} />
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <>
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 z-50 bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleClose();
              }}
            />

            {/* Menu Popover */}
            <div
              className={`fixed z-50 ${menuWidthClass} rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl py-1 text-xs divide-y divide-[var(--color-border-subtle)] animate-in fade-in zoom-in-95 duration-150 select-none`}
              style={{
                top: coords.top !== undefined ? `${coords.top}px` : "auto",
                bottom: coords.bottom !== undefined ? `${coords.bottom}px` : "auto",
                right: coords.right !== undefined ? `${coords.right}px` : "auto",
                left: coords.left !== undefined ? `${coords.left}px` : "auto",
                maxHeight: "calc(100vh - 32px)",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {renderContent ? (
                renderContent(handleClose)
              ) : (
                normalizedGroups.map((group, gIdx) => {
                  const visibleItems = group.items.filter((i) => !i.hidden);
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={gIdx} className="py-1">
                      {visibleItems.map((item, iIdx) => {
                        const isDanger = item.variant === "danger";
                        const baseClasses = `w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left ${
                          isDanger
                            ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
                            : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                        }`;

                        if (item.href) {
                          return (
                            <a
                              key={iIdx}
                              href={item.href}
                              onClick={() => {
                                handleClose();
                                item.onClick?.();
                              }}
                              className={baseClasses}
                            >
                              {item.icon && (
                                <span
                                  className={
                                    isDanger
                                      ? "text-[var(--color-danger)] shrink-0"
                                      : "text-[var(--color-text-muted)] shrink-0"
                                  }
                                >
                                  {item.icon}
                                </span>
                              )}
                              <span>{item.label}</span>
                            </a>
                          );
                        }

                        return (
                          <button
                            key={iIdx}
                            type="button"
                            onClick={() => {
                              handleClose();
                              item.onClick?.();
                            }}
                            className={baseClasses}
                          >
                            {item.icon && (
                              <span
                                className={
                                    isDanger
                                    ? "text-[var(--color-danger)] shrink-0"
                                    : "text-[var(--color-text-muted)] shrink-0"
                                }
                              >
                                {item.icon}
                              </span>
                            )}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
