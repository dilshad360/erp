"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Search, User2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserOption {
  id: string;
  full_name: string | null;
  employee_id: string | null;
  avatar_url: string | null;
}

export interface UserSelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  users?: UserOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function UserSelect({
  value,
  onChange,
  users: initialUsers,
  placeholder = "Select assignee...",
  disabled = false,
  className,
  id,
}: UserSelectProps): React.JSX.Element {
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
          const json = await res.json() as { data?: UserOption[] };
          if (isMounted && json.data) {
            setUserList(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load users for UserSelect", err);
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

  const selected = userList.find((u) => u.id === value);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed",
          !selected && "text-[var(--color-text-muted)]"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selected?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.avatar_url}
              alt={selected.full_name ?? ""}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
          ) : (
            <User2 size={16} className="text-[var(--color-text-muted)] shrink-0" />
          )}
          <span className="truncate">
            {selected ? (selected.full_name ?? "Unnamed") : placeholder}
          </span>
        </div>
        <ChevronsUpDown size={16} className="text-[var(--color-text-muted)] shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search */}
          <div className="p-2 border-b border-[var(--color-border-subtle)] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 text-xs">
            {/* Unassign option */}
            {value && (
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); setSearch(""); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] transition-colors italic"
              >
                Unassign
              </button>
            )}

            {loading ? (
              <div className="flex items-center justify-center p-4 text-[var(--color-text-muted)] gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading team...</span>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((u) => {
                const isSelected = u.id === value;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { onChange(u.id); setOpen(false); setSearch(""); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left",
                      isSelected
                        ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-medium"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
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
                        <p className="truncate">{u.full_name ?? "Unnamed"}</p>
                        {u.employee_id && (
                          <p className="text-[10px] text-[var(--color-text-muted)]">
                            {u.employee_id}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="shrink-0 text-[var(--color-brand)]" />}
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
