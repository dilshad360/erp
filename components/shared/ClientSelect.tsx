"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus, Search, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClientOption {
  id: string;
  name: string;
  contact_person?: string | null;
  status?: string;
}

export interface ClientSelectProps {
  value?: string;
  onChange: (value: string) => void;
  clients?: ClientOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function ClientSelect({
  value,
  onChange,
  clients: initialClients,
  placeholder = "Select client...",
  disabled = false,
  className,
  id,
}: ClientSelectProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clientList, setClientList] = useState<ClientOption[]>(initialClients || []);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync or fetch client list if not provided
  useEffect(() => {
    if (initialClients && initialClients.length > 0) {
      setClientList(initialClients);
      return;
    }

    let isMounted = true;
    async function loadClients() {
      setLoading(true);
      try {
        const res = await fetch("/api/clients?status=active");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setClientList(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load clients for ClientSelect", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadClients();
    return () => {
      isMounted = false;
    };
  }, [initialClients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filteredClients = clientList.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    (client.contact_person && client.contact_person.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedClient = clientList.find((c) => c.id === value);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed",
          !selectedClient && "text-[var(--color-text-muted)]"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 size={16} className="text-[var(--color-text-muted)] shrink-0" />
          <span className="truncate">
            {selectedClient ? selectedClient.name : placeholder}
          </span>
        </div>
        <ChevronsUpDown size={16} className="text-[var(--color-text-muted)] shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search box */}
          <div className="p-2 border-b border-[var(--color-border-subtle)] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 text-xs">
            {loading ? (
              <div className="flex items-center justify-center p-4 text-[var(--color-text-muted)] gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading clients...</span>
              </div>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const isSelected = client.id === value;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      onChange(client.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left",
                      isSelected
                        ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-medium"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                    )}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate">{client.name}</p>
                      {client.contact_person && (
                        <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                          {client.contact_person}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="shrink-0 text-[var(--color-brand)]" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-[var(--color-text-muted)]">
                No clients match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>

          {/* Add New Client Action */}
          <div className="p-1.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/50">
            <Link
              href="/clients/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-[var(--color-brand)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <Plus size={14} />
              <span>Add new client</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
