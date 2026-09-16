"use client";

import React, { useState, useTransition } from "react";
import { Plus, GripVertical, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// ── Types ─────────────────────────────────────────────────────

export interface TaskStatusRow {
  id: string;
  name: string;
  color: string | null;
  sort_order: number;
}

// ── Sortable Row ──────────────────────────────────────────────

function StatusRow({
  status,
  onUpdate,
  onDelete,
}: {
  status: TaskStatusRow;
  onUpdate: (id: string, name: string, color: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(status.name);
  const [editColor, setEditColor] = useState(status.color ?? "#6366f1");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    if (!editName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onUpdate(status.id, editName.trim(), editColor);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!confirm(`Delete "${status.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(status.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] cursor-grab active:cursor-grabbing shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      {/* Color swatch / picker */}
      <div className="relative shrink-0">
        <span
          className="block w-4 h-4 rounded-full border-2 border-white/20 cursor-pointer"
          style={{ background: editing ? editColor : (status.color ?? "#6366f1") }}
        />
        {editing && (
          <input
            type="color"
            value={editColor}
            onChange={(e) => setEditColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-4 h-4"
            title="Pick a color"
          />
        )}
      </div>

      {/* Name */}
      {editing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          className="flex-1 px-2 py-1 text-sm rounded bg-[var(--color-surface)] border border-[var(--color-brand)] text-[var(--color-text-primary)] focus:outline-none"
        />
      ) : (
        <span className="flex-1 text-sm text-[var(--color-text-primary)]">{status.name}</span>
      )}

      {/* Error */}
      {error && (
        <span className="text-xs text-red-400 max-w-[200px] truncate" title={error}>{error}</span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="p-1.5 rounded text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setEditName(status.name); setEditColor(status.color ?? "#6366f1"); }}
              className="p-1.5 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors opacity-0 group-hover:opacity-100"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

interface KanbanColumnManagerProps {
  initialStatuses: TaskStatusRow[];
}

export default function KanbanColumnManager({
  initialStatuses,
}: KanbanColumnManagerProps): React.JSX.Element {
  const [statuses, setStatuses] = useState<TaskStatusRow[]>(initialStatuses);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleAdd(): Promise<void> {
    if (!newName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/task-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      const json = await res.json() as { data?: TaskStatusRow; error?: string };
      if (!res.ok || json.error) {
        setAddError(json.error ?? "Failed to add");
        return;
      }
      if (json.data) {
        setStatuses((prev) => [...prev, json.data!]);
        setNewName("");
        setNewColor("#6366f1");
      }
    } catch {
      setAddError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdate(id: string, name: string, color: string | null): Promise<void> {
    const res = await fetch(`/api/task-statuses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const json = await res.json() as { data?: TaskStatusRow; error?: string };
    if (!res.ok || json.error) throw new Error(json.error ?? "Update failed");
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, name, color } : s)));
  }

  async function handleDelete(id: string): Promise<void> {
    const res = await fetch(`/api/task-statuses/${id}`, { method: "DELETE" });
    const json = await res.json() as { error?: string };
    if (!res.ok || json.error) throw new Error(json.error ?? "Delete failed");
    setStatuses((prev) => prev.filter((s) => s.id !== id));
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    startTransition(() => {
      const oldIndex = statuses.findIndex((s) => s.id === active.id);
      const newIndex = statuses.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...statuses];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const withOrder = reordered.map((s, i) => ({ ...s, sort_order: i + 1 }));
      setStatuses(withOrder);

      // Persist reorder
      void fetch("/api/task-statuses/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: withOrder.map((s) => s.id) }),
      });
    });
  }

  return (
    <div className="space-y-4">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={statuses.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {statuses.map((status) => (
              <StatusRow
                key={status.id}
                status={status}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add new column */}
      <div className="flex items-center gap-2 pt-2">
        <div className="relative shrink-0">
          <span
            className="block w-6 h-6 rounded-full border-2 border-[var(--color-border)] cursor-pointer"
            style={{ background: newColor }}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
            title="Pick column color"
          />
        </div>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); }}
          placeholder="New column name..."
          className="flex-1 px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={adding || !newName.trim()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </button>
      </div>

      {addError && (
        <p className="text-xs text-red-400">{addError}</p>
      )}
    </div>
  );
}
