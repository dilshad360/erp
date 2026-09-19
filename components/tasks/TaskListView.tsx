"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter, Search, Trash2, Edit2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import AssigneeAvatarGroup, { type AssigneeInfo } from "@/components/shared/AssigneeAvatarGroup";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ActionMenu } from "@/components/shared/ActionMenu";
import TaskSheet from "./TaskSheet";
import type { TaskFormData, TaskStatus } from "./TaskForm";

// ── Types ─────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  due_date: string | null;
  created_at: string;
  created_by?: string | null;
  status: { id: string; name: string; color: string | null } | null;
  assignee: { id: string; full_name: string | null; avatar_url: string | null; employee_id?: string | null } | null;
  assignees?: { id: string; full_name: string | null; avatar_url: string | null; employee_id?: string | null }[];
  project: { id: string; name: string } | null;
}

interface TaskListViewProps {
  initialTasks: Task[];
  statuses: TaskStatus[];
  projectId: string;
}

// ── Helpers ───────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/20",
  high:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
  medium: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  low:    "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]",
};

function PriorityBadge({ priority }: { priority: string }): React.JSX.Element {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.low}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: Task["status"] }): React.JSX.Element {
  if (!status) return <span className="text-xs text-[var(--color-text-muted)]">—</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-[var(--color-border)]"
      style={{ color: status.color ?? "var(--color-text-secondary)" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: status.color ?? "var(--color-text-muted)" }}
      />
      {status.name}
    </span>
  );
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

// ── Component ─────────────────────────────────────────────────

export default function TaskListView({
  initialTasks,
  statuses,
  projectId,
}: TaskListViewProps): React.JSX.Element {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state if initialTasks prop updates
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [search, setSearch] = useState("");

  const handleTaskSuccess = useCallback(
    (taskData: TaskFormData) => {
      const taskStatus =
        taskData.status ??
        statuses.find((s) => s.id === (taskData.status_id || taskData.statusId)) ??
        null;

      const formattedTask: Task = {
        id: taskData.id ?? String(Date.now()),
        title: taskData.title,
        description: taskData.description ?? null,
        priority: taskData.priority,
        due_date: taskData.due_date ?? taskData.dueDate ?? null,
        created_at: taskData.created_at ?? new Date().toISOString(),
        created_by: taskData.created_by,
        status: taskStatus,
        assignee: taskData.assignee ?? (taskData.assignees?.[0] ?? null),
        assignees: taskData.assignees ?? (taskData.assignee ? [taskData.assignee] : []),
        project: taskData.project ?? null,
      };

      if (editTask) {
        // Update in-place
        setTasks((prev) =>
          prev.map((t) => (t.id === formattedTask.id ? { ...t, ...formattedTask } : t))
        );
      } else {
        // Prepend new task immediately to list
        setTasks((prev) => [formattedTask, ...prev.filter((t) => t.id !== formattedTask.id)]);
      }
      router.refresh();
      setSheetOpen(false);
      setEditTask(null);
    },
    [editTask, statuses, router]
  );

  const handleDeleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  }, []);

  async function handleConfirmDelete(): Promise<void> {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await handleDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  // Unique assignees for filter (considering multi-assignees)
  const allAssigneesMap = new Map<string, AssigneeInfo>();
  tasks.forEach((t) => {
    if (t.assignees && t.assignees.length > 0) {
      t.assignees.forEach((a) => allAssigneesMap.set(a.id, a));
    } else if (t.assignee) {
      allAssigneesMap.set(t.assignee.id, t.assignee);
    }
  });
  const assigneeOptions = Array.from(allAssigneesMap.values());

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus && t.status?.id !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee) {
      const hasAssignee =
        (t.assignees && t.assignees.some((a) => a.id === filterAssignee)) ||
        t.assignee?.id === filterAssignee;
      if (!hasAssignee) return false;
    }
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-[var(--color-text-muted)] shrink-0" />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {assigneeOptions.length > 0 && (
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            >
              <option value="">All Assignees</option>
              {assigneeOptions.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name ?? "Unnamed"}</option>
              ))}
            </select>
          )}
        </div>

        {/* New Task */}
        <button
          onClick={() => { setEditTask(null); setSheetOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors shrink-0"
        >
          <Plus size={15} />
          New Task
        </button>
      </div>

      {/* Table */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          heading="No tasks yet"
          description="Add the first task to get this project moving."
          action={
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors"
            >
              <Plus size={14} />
              New Task
            </button>
          }
        />
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs relative">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide items-center rounded-t-xl">
            <span>Title</span>
            <span className="hidden sm:block">Status</span>
            <span>Priority</span>
            <span className="hidden md:block">Assignees</span>
            <span className="hidden sm:block">Due Date</span>
            <span className="w-6"></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {filteredTasks.map((task, idx) => {
              const overdue = isOverdue(task.due_date);
              const isLastRow = idx === filteredTasks.length - 1;
              const assigneesList = task.assignees && task.assignees.length > 0
                ? task.assignees
                : task.assignee
                ? [task.assignee]
                : [];

              return (
                <div
                  key={task.id}
                  className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-4 py-3 text-left hover:bg-[var(--color-surface-raised)] transition-colors group ${
                    isLastRow ? "rounded-b-xl" : ""
                  }`}
                >
                  {/* Title */}
                  <button
                    type="button"
                    onClick={() => { setEditTask(task); setSheetOpen(true); }}
                    className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand)] transition-colors truncate text-left"
                  >
                    {task.title}
                  </button>

                  {/* Status */}
                  <span className="hidden sm:block">
                    <StatusBadge status={task.status} />
                  </span>

                  {/* Priority */}
                  <PriorityBadge priority={task.priority} />

                  {/* Assignees */}
                  <span className="hidden md:flex items-center min-w-[120px]">
                    <AssigneeAvatarGroup assignees={assigneesList} size="xs" max={3} showNameIfSingle={true} />
                  </span>

                  {/* Due date */}
                  <span className="hidden sm:block">
                    {task.due_date ? (
                      <span className={`text-xs ${overdue ? "text-red-400 font-medium" : "text-[var(--color-text-secondary)]"}`}>
                        {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
                  </span>

                  {/* Options Menu */}
                  <div className="flex justify-end">
                    <ActionMenu
                      triggerAriaLabel="Task options"
                      triggerClassName="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
                      menuWidthClass="w-36"
                      items={[
                        {
                          label: "Edit",
                          icon: <Edit2 size={13} />,
                          onClick: () => {
                            setEditTask(task);
                            setSheetOpen(true);
                          },
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 size={13} />,
                          variant: "danger",
                          onClick: () => setTaskToDelete(task),
                        },
                      ]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sheet */}
      <TaskSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditTask(null); }}
        projectId={projectId}
        statuses={statuses}
        mode={editTask ? "edit" : "create"}
        taskId={editTask?.id}
        defaultValues={
          editTask
            ? {
                id: editTask.id,
                title: editTask.title,
                description: editTask.description ?? null,
                statusId: editTask.status?.id ?? null,
                priority: editTask.priority as TaskFormData["priority"],
                assigneeIds: editTask.assignees?.map((a) => a.id) ?? (editTask.assignee ? [editTask.assignee.id] : []),
                dueDate: editTask.due_date,
                projectId,
              }
            : undefined
        }
        onSuccess={handleTaskSuccess}
        onDelete={handleDeleteTask}
      />

      {/* Row Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Task?"
        description={`Are you sure you want to delete "${taskToDelete?.title}"?`}
        confirmLabel="Delete Task"
        variant="destructive"
      />
    </div>
  );
}
