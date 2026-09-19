"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckSquare2,
  Clock,
  AlertTriangle,
  Minus,
  Plus,
  Search,
  Filter,
  Users,
  UserCheck,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import AssigneeAvatarGroup, { type AssigneeInfo } from "@/components/shared/AssigneeAvatarGroup";
import TaskSheet from "@/components/tasks/TaskSheet";
import type { TaskStatus, TaskFormData } from "@/components/tasks/TaskForm";

export interface GlobalTask {
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

export interface ProjectOption {
  id: string;
  name: string;
}

interface GlobalTasksClientProps {
  initialTasks: GlobalTask[];
  statuses: TaskStatus[];
  projects: ProjectOption[];
  currentUserId: string;
  currentUserRole: string;
}

type DateFilterKey = "all" | "today" | "overdue" | "no_date";
type ViewModeKey = "my" | "all";

function isOverdue(d: string | null): boolean {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
}

function isDueToday(d: string | null): boolean {
  if (!d) return false;
  return new Date(d).toDateString() === new Date().toDateString();
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/20",
  high:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
  medium: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  low:    "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]",
};

export default function GlobalTasksClient({
  initialTasks,
  statuses,
  projects,
  currentUserId,
}: GlobalTasksClientProps): React.JSX.Element {
  const router = useRouter();
  const [tasks, setTasks] = useState<GlobalTask[]>(initialTasks);
  const [viewMode, setViewMode] = useState<ViewModeKey>("my");
  const [dateFilter, setDateFilter] = useState<DateFilterKey>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sheet & Create Modal state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTask, setEditTask] = useState<GlobalTask | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>(projects[0]?.id || "");

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. View filter ("my" vs "all")
      if (viewMode === "my") {
        const isAssigned =
          (t.assignees && t.assignees.some((a) => a.id === currentUserId)) ||
          t.assignee?.id === currentUserId;
        if (!isAssigned) return false;
      }

      // 2. Project filter
      if (selectedProjectId !== "all" && t.project?.id !== selectedProjectId) {
        return false;
      }

      // 3. Status filter
      if (selectedStatusId !== "all" && t.status?.id !== selectedStatusId) {
        return false;
      }

      // 4. Priority filter
      if (selectedPriority !== "all" && t.priority !== selectedPriority) {
        return false;
      }

      // 5. Date filter
      if (dateFilter === "today" && !isDueToday(t.due_date)) return false;
      if (dateFilter === "overdue" && !isOverdue(t.due_date)) return false;
      if (dateFilter === "no_date" && t.due_date) return false;

      // 6. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchProject = t.project?.name.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchProject) return false;
      }

      return true;
    });
  }, [
    tasks,
    viewMode,
    currentUserId,
    selectedProjectId,
    selectedStatusId,
    selectedPriority,
    dateFilter,
    searchQuery,
  ]);

  // Group by project
  const projectMap = useMemo(() => {
    const map = new Map<string, { name: string; tasks: GlobalTask[] }>();
    for (const task of filteredTasks) {
      const pid = task.project?.id ?? "__none__";
      const pname = task.project?.name ?? "No Project";
      if (!map.has(pid)) {
        map.set(pid, { name: pname, tasks: [] });
      }
      map.get(pid)!.tasks.push(task);
    }
    return map;
  }, [filteredTasks]);

  // Sync state if initialTasks prop updates
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  function handleTaskSuccess(taskData: TaskFormData): void {
    const taskStatus =
      taskData.status ??
      statuses.find((s) => s.id === (taskData.status_id || taskData.statusId)) ??
      null;

    const projectId = taskData.project_id || taskData.projectId || targetProjectId;
    const taskProject =
      taskData.project ??
      (projects.find((p) => p.id === projectId)
        ? { id: projectId, name: projects.find((p) => p.id === projectId)!.name }
        : null);

    const formattedTask: GlobalTask = {
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
      project: taskProject,
    };

    if (editTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === formattedTask.id ? { ...t, ...formattedTask } : t))
      );
    } else {
      setTasks((prev) => [formattedTask, ...prev.filter((t) => t.id !== formattedTask.id)]);
    }
    router.refresh();
    setSheetOpen(false);
    setEditTask(null);
  }

  async function handleDeleteTask(taskId: string): Promise<void> {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  }

  const dateFilters: { key: DateFilterKey; label: string; icon: React.ReactNode }[] = [
    { key: "all",     label: "All",          icon: <CheckSquare2 size={13} /> },
    { key: "today",   label: "Due Today",    icon: <Clock size={13} /> },
    { key: "overdue", label: "Overdue",      icon: <AlertTriangle size={13} /> },
    { key: "no_date", label: "No Due Date",  icon: <Minus size={13} /> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title={viewMode === "my" ? "My Tasks" : "All Company Tasks"}
        description={
          viewMode === "my"
            ? "Tasks assigned to you across all company projects."
            : "Company-wide task visibility across all active projects and team members."
        }
        actions={
          projects.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setEditTask(null);
                setTargetProjectId(projects[0]?.id || "");
                setSheetOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-all shadow-xs active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>New Task</span>
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 md:px-8 space-y-5">
        {/* Top Control Bar: View Mode Switcher + Search + Filter Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* View Mode Toggle: My Tasks vs All Tasks */}
          <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 text-xs font-medium w-fit">
            <button
              type="button"
              onClick={() => setViewMode("my")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "my"
                  ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-semibold shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <UserCheck size={14} />
              <span>My Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "all"
                  ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-semibold shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <Users size={14} />
              <span>All Tasks</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or projects..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            />
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg w-fit flex-wrap">
            {dateFilters.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDateFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  dateFilter === key
                    ? "bg-[var(--color-brand)] text-white shadow-2xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Dropdown Filters: Project, Status, Priority */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Filter size={13} className="text-[var(--color-text-muted)] shrink-0" />

            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedStatusId}
              onChange={(e) => setSelectedStatusId(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            >
              <option value="all">All Statuses</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Task Groups by Project */}
        {projectMap.size === 0 ? (
          <EmptyState
            icon={CheckSquare2}
            heading={viewMode === "my" ? "No tasks assigned to you" : "No tasks found"}
            description={
              viewMode === "my"
                ? "You currently have no tasks assigned matching this filter. Switch to 'All Tasks' to browse team deliverables."
                : "No tasks found matching your active search and filter criteria."
            }
            action={
              projects.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditTask(null);
                    setTargetProjectId(projects[0]?.id || "");
                    setSheetOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors"
                >
                  <Plus size={16} />
                  <span>Create Task</span>
                </button>
              ) : undefined
            }
          />
        ) : (
          Array.from(projectMap.entries()).map(([pid, { name, tasks: projectTasks }]) => (
            <div
              key={pid}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs"
            >
              {/* Project header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40">
                {pid !== "__none__" ? (
                  <Link
                    href={`/projects/${pid}/tasks`}
                    className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand)] transition-colors flex items-center gap-2"
                  >
                    <span>{name}</span>
                    <span className="text-[11px] font-normal text-[var(--color-text-muted)] hover:underline">
                      (Board)
                    </span>
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-[var(--color-text-muted)]">
                    {name}
                  </span>
                )}
                <span className="text-xs text-[var(--color-text-muted)]">
                  {projectTasks.length} task{projectTasks.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Tasks List */}
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {projectTasks.map((task) => {
                  const overdue = isOverdue(task.due_date);
                  const today = isDueToday(task.due_date);
                  const assigneesList: AssigneeInfo[] =
                    task.assignees && task.assignees.length > 0
                      ? task.assignees
                      : task.assignee
                      ? [task.assignee]
                      : [];

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setEditTask(task);
                        setTargetProjectId(task.project?.id || projects[0]?.id || "");
                        setSheetOpen(true);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)]/50 transition-colors group cursor-pointer"
                    >
                      {/* Priority dot */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === "urgent"
                            ? "bg-red-400"
                            : task.priority === "high"
                            ? "bg-amber-400"
                            : task.priority === "medium"
                            ? "bg-sky-400"
                            : "bg-[var(--color-text-muted)]"
                        }`}
                      />

                      {/* Title */}
                      <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand)] transition-colors">
                        {task.title}
                      </span>

                      {/* Status */}
                      {task.status && (
                        <span
                          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-[var(--color-border)] shrink-0"
                          style={{ color: task.status.color ?? "var(--color-text-secondary)" }}
                        >
                          {task.status.name}
                        </span>
                      )}

                      {/* Priority badge */}
                      <span
                        className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize shrink-0 ${
                          PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.low
                        }`}
                      >
                        {task.priority}
                      </span>

                      {/* Assignee Avatar Group */}
                      <div className="shrink-0 min-w-[60px]">
                        <AssigneeAvatarGroup
                          assignees={assigneesList}
                          size="xs"
                          max={2}
                          showNameIfSingle={false}
                        />
                      </div>

                      {/* Due date */}
                      {task.due_date && (
                        <span
                          className={`text-[11px] shrink-0 font-medium ${
                            overdue
                              ? "text-red-400"
                              : today
                              ? "text-amber-400"
                              : "text-[var(--color-text-muted)]"
                          }`}
                        >
                          {overdue ? "Overdue · " : today ? "Today · " : ""}
                          {new Date(task.due_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Drawer / Modal Sheet */}
      {sheetOpen && (
        <div className="relative">
          {/* If creating cross-project task without preset, show project selector inside form */}
          {!editTask && projects.length > 1 && (
            <div className="fixed z-55 top-4 right-4 md:top-5 md:right-5 hidden">
              {/* Optional project switch */}
            </div>
          )}

          <TaskSheet
            open={sheetOpen}
            onClose={() => {
              setSheetOpen(false);
              setEditTask(null);
            }}
            projectId={editTask?.project?.id || targetProjectId}
            statuses={statuses}
            projects={projects}
            mode={editTask ? "edit" : "create"}
            taskId={editTask?.id}
            title={editTask ? `Edit Task: ${editTask.title}` : "Create New Task"}
            defaultValues={
              editTask
                ? {
                    id: editTask.id,
                    title: editTask.title,
                    description: editTask.description ?? null,
                    statusId: editTask.status?.id ?? null,
                    priority: editTask.priority as TaskFormData["priority"],
                    assigneeIds:
                      editTask.assignees?.map((a) => a.id) ??
                      (editTask.assignee ? [editTask.assignee.id] : []),
                    dueDate: editTask.due_date,
                    projectId: editTask.project?.id || targetProjectId,
                  }
                : {
                    projectId: targetProjectId,
                  }
            }
            onSuccess={handleTaskSuccess}
            onDelete={handleDeleteTask}
          />
        </div>
      )}
    </div>
  );
}
