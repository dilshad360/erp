"use client";

import React, { useState, useCallback } from "react";
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import KanbanColumn from "./KanbanColumn";
import { KanbanCardOverlay } from "./KanbanCard";
import TaskSheet from "./TaskSheet";
import type { Task } from "./TaskListView";
import type { TaskStatus, TaskFormData } from "./TaskForm";

interface KanbanBoardProps {
  initialTasks: Task[];
  statuses: TaskStatus[];
  projectId: string;
}

export default function KanbanBoard({
  initialTasks,
  statuses,
  projectId,
}: KanbanBoardProps): React.JSX.Element {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [defaultStatusId, setDefaultStatusId] = useState<string | null>(null);

  // Configure sensors for both mouse/touch with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent): void => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent): Promise<void> => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatusId = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status?.id === newStatusId) return;

    const newStatus = statuses.find((s) => s.id === newStatusId) ?? null;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus }
          : t
      )
    );

    // Persist to server
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: newStatusId }),
      });

      if (!res.ok) {
        // Revert on failure
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: task.status }
              : t
          )
        );
      }
    } catch {
      // Revert on network error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: task.status }
            : t
        )
      );
    }
  }, [tasks, statuses]);

  const handleEdit = useCallback((task: Task): void => {
    setEditTask(task);
    setDefaultStatusId(null);
    setSheetOpen(true);
  }, []);

  const handleAddTask = useCallback((statusId: string): void => {
    setEditTask(null);
    setDefaultStatusId(statusId);
    setSheetOpen(true);
  }, []);

  const handleTaskSuccess = useCallback(
    (task: TaskFormData): void => {
      if (editTask) {
        // Update in-place
        const newStatus = statuses.find((s) => s.id === task.statusId) ?? null;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, title: task.title, priority: task.priority, due_date: task.dueDate ?? null, status: newStatus }
              : t
          )
        );
      } else {
        // Refresh for new tasks (need full joined data)
        router.refresh();
      }
      setSheetOpen(false);
      setEditTask(null);
    },
    [editTask, statuses, router]
  );

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Horizontal scroll container — important for mobile */}
        <div
          className="flex gap-4 overflow-x-auto pb-4 h-full"
          style={{ minHeight: "400px" }}
        >
          {statuses.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={tasks.filter((t) => t.status?.id === status.id)}
              onEdit={handleEdit}
              onAddTask={handleAddTask}
            />
          ))}

          {/* Unstaused column for tasks with no status */}
          {tasks.some((t) => !t.status) && (
            <div className="flex flex-col w-[270px] min-w-[270px]">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-text-muted)] shrink-0" />
                <span className="text-sm font-semibold text-[var(--color-text-muted)]">No Status</span>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)] ml-auto">
                  {tasks.filter((t) => !t.status).length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-2 rounded-xl bg-[var(--color-surface-raised)]/50 border border-[var(--color-border-subtle)]">
                {tasks
                  .filter((t) => !t.status)
                  .map((task) => (
                    <div key={task.id} onClick={() => handleEdit(task)} className="cursor-pointer">
                      <span className="text-sm text-[var(--color-text-secondary)] px-2">{task.title}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <DragOverlay>
          <KanbanCardOverlay task={activeTask} />
        </DragOverlay>
      </DndContext>

      {/* Task Sheet */}
      <TaskSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditTask(null); setDefaultStatusId(null); }}
        projectId={projectId}
        statuses={statuses}
        mode={editTask ? "edit" : "create"}
        taskId={editTask?.id}
        defaultStatusId={defaultStatusId}
        defaultValues={
          editTask
            ? {
                id: editTask.id,
                title: editTask.title,
                description: null,
                statusId: editTask.status?.id ?? null,
                priority: editTask.priority as TaskFormData["priority"],
                assigneeId: editTask.assignee?.id ?? null,
                dueDate: editTask.due_date,
                projectId,
              }
            : undefined
        }
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
}
