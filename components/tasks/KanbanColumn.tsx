"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import KanbanCard from "./KanbanCard";
import type { Task } from "./TaskListView";
import type { TaskStatus } from "./TaskForm";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAddTask: (statusId: string) => void;
}

export default function KanbanColumn({
  status,
  tasks,
  onEdit,
  onAddTask,
}: KanbanColumnProps): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex flex-col w-[270px] min-w-[270px] max-h-full">
      {/* Column Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className="flex items-center gap-2 mb-2 px-1 group text-left"
      >
        {/* Color dot */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: status.color ?? "var(--color-text-muted)" }}
        />
        <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1">
          {status.name}
        </span>
        <span className="ml-auto text-[11px] font-mono text-[var(--color-text-muted)] bg-[var(--color-surface-raised)] px-1.5 py-0.5 rounded shrink-0">
          {tasks.length}
        </span>
      </button>

      {/* Drop zone */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`flex-1 flex flex-col gap-2 min-h-[120px] p-2 rounded-xl transition-colors ${
            isOver
              ? "bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/30"
              : "bg-[var(--color-surface-raised)]/50 border border-[var(--color-border-subtle)]"
          }`}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} />
          ))}

          {/* Add task button */}
          <button
            type="button"
            onClick={() => onAddTask(status.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)] transition-colors mt-auto border border-dashed border-[var(--color-border-subtle)]"
          >
            <Plus size={13} />
            Add task
          </button>
        </div>
      )}
    </div>
  );
}
