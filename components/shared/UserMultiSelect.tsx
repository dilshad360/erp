"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Search, User2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserOption {
  id: string;
  full_name: string | null;
  employee_id: string | null;
  avatar_url: string | null;
}

export interface UserMultiSelectProps {
  values?: string[];
  onChange: (values: string[]) => void;
  users?: UserOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function UserMultiSelect({
  values = [],
  onChange,
  users: initialUsers,
  placeholder = "Select assignees...",
  disabled = false,
  className,
  id,
}: UserMultiSelectProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userList, setUserList] = useState<UserOption[]>(initialUsers || []);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setUserList(initialUsers);
      return;
    }

    let isMounted = true;
    async function loadUsers(): Promise<void> {
      setLoading(true);
      try {
        const res = await fetch("/api/employees?active=true");
        if (res.ok) {
          const json = (await res.json()) as { data?: UserOption[] };
          if (isMounted && json.data) {
            setUserList(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load users for UserMultiSelect", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [initialUsers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = userList.filter((u) => {
    const name = u.full_name?.toLowerCase() ?? "";
    const empId = u.employee_id?.toLowerCase() ?? "";
    const q = search.toLowerCase();
    return name.includes(q) || empId.includes(q);
  });

  const selectedUsers = userList.filter((u) => values.includes(u.id));

  function toggleUser(userId: string): void {
    if (values.includes(userId)) {
      onChange(values.filter((id) => id !== userId));
    } else {
      onChange([...values, userId]);
    }
  }

  function removeUser(userId: string, e: React.MouseEvent): void {
    e.stopPropagation();
    onChange(values.filter((id) => id !== userId));
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-1.5 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed",
          open && "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/20"
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1 py-0.5">
          {selectedUsers.length > 0 ? (
            selectedUsers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] shadow-2xs"
              >
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.avatar_url}
                    alt={u.full_name ?? ""}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center text-[8px] font-bold shrink-0">
                    {u.full_name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="truncate max-w-[110px] text-[11px] font-medium">
                  {u.full_name ?? "Unnamed"}
                </span>
                <button
                  type="button"
                  onClick={(e) => removeUser(u.id, e)}
                  className="p-0.5 rounded-full hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  aria-label={`Remove ${u.full_name ?? "user"}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
              <User2 size={14} className="text-[var(--color-text-muted)] shrink-0" />
              {placeholder}
            </span>
          )}
        </div>

        <ChevronsUpDown size={15} className="text-[var(--color-text-muted)] shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search bar */}
          <div className="p-2 border-b border-[var(--color-border-subtle)] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              autoFocus
            />
          </div>

          {/* User list */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 text-xs">
            {values.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-left text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] transition-colors italic text-xs"
              >
                <span>Clear all selected</span>
                <span className="text-[10px] font-mono">({values.length})</span>
              </button>
            )}

            {loading ? (
              <div className="flex items-center justify-center p-4 text-[var(--color-text-muted)] gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading team...</span>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((u) => {
                const isSelected = values.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left",
                      isSelected
                        ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-medium"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar_url}
                          alt={u.full_name ?? ""}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center text-[9px] font-bold shrink-0">
                          {u.full_name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="truncate font-medium">{u.full_name ?? "Unnamed"}</p>
                        {u.employee_id && (
                          <p className="text-[10px] text-[var(--color-text-muted)]">
                            {u.employee_id}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-4 h-4 rounded bg-[var(--color-brand)] text-white flex items-center justify-center shrink-0">
                        <Check size={11} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-[var(--color-border)] shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-[var(--color-text-muted)]">
                No team members match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
