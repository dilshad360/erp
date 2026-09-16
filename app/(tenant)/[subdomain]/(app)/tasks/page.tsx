import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import Link from "next/link";
import { CheckSquare2, Clock, AlertTriangle, Minus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Tasks",
};

interface MyTask {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  status: { id: string; name: string; color: string | null } | null;
  project: { id: string; name: string } | null;
}

type FilterKey = "all" | "today" | "overdue" | "no_date";

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

export default async function MyTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ filter?: string }>;
}): Promise<React.JSX.Element> {
  const { subdomain } = await params;
  const { filter } = await searchParams;
  const activeFilter: FilterKey =
    (["all", "today", "overdue", "no_date"] as FilterKey[]).includes(filter as FilterKey)
      ? (filter as FilterKey)
      : "all";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${subdomain}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch tasks assigned to this user
  const { data: tasksData } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      priority,
      due_date,
      created_at,
      status:status_id (id, name, color),
      project:project_id (id, name)
    `)
    .eq("assignee_id", user.id)
    .eq("company_id", profile.company_id)
    .order("due_date", { ascending: true, nullsFirst: false });

  const allTasks = (tasksData ?? []) as unknown as MyTask[];

  const filteredTasks = allTasks.filter((t) => {
    if (activeFilter === "today") return isDueToday(t.due_date);
    if (activeFilter === "overdue") return isOverdue(t.due_date);
    if (activeFilter === "no_date") return !t.due_date;
    return true;
  });

  // Group by project
  const projectMap = new Map<string, { name: string; tasks: MyTask[] }>();
  for (const task of filteredTasks) {
    const pid = task.project?.id ?? "__none__";
    const pname = task.project?.name ?? "No Project";
    if (!projectMap.has(pid)) {
      projectMap.set(pid, { name: pname, tasks: [] });
    }
    projectMap.get(pid)!.tasks.push(task);
  }

  const filters: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
    { key: "all",     label: "All",          icon: <CheckSquare2 size={13} /> },
    { key: "today",   label: "Due Today",    icon: <Clock size={13} /> },
    { key: "overdue", label: "Overdue",      icon: <AlertTriangle size={13} /> },
    { key: "no_date", label: "No Due Date",  icon: <Minus size={13} /> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="My Tasks" description="Tasks assigned to you across all projects." />

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 md:px-8 space-y-5">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg w-fit flex-wrap">
          {filters.map(({ key, label, icon }) => (
            <Link
              key={key}
              href={`?filter=${key}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeFilter === key
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {icon}
              {label}
            </Link>
          ))}
        </div>

        {/* Task groups */}
        {projectMap.size === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
            <CheckSquare2 size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
              {activeFilter === "all" ? "No tasks assigned to you" : "No tasks in this filter"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {activeFilter === "all"
                ? "When someone assigns a task to you, it will appear here."
                : "Try switching to 'All' to see all your tasks."}
            </p>
          </div>
        ) : (
          Array.from(projectMap.entries()).map(([pid, { name, tasks }]) => (
            <div
              key={pid}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs"
            >
              {/* Project header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40">
                {pid !== "__none__" ? (
                  <Link
                    href={`/projects/${pid}`}
                    className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand)] transition-colors"
                  >
                    {name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-[var(--color-text-muted)]">{name}</span>
                )}
                <span className="text-xs text-[var(--color-text-muted)]">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Tasks */}
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {tasks.map((task) => {
                  const overdue = isOverdue(task.due_date);
                  const today = isDueToday(task.due_date);
                  return (
                    <Link
                      key={task.id}
                      href={`/projects/${task.project?.id}/tasks`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)]/50 transition-colors group"
                    >
                      {/* Priority dot */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === "urgent" ? "bg-red-400" :
                          task.priority === "high" ? "bg-amber-400" :
                          task.priority === "medium" ? "bg-sky-400" : "bg-[var(--color-text-muted)]"
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
                      <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize shrink-0 ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.low}`}>
                        {task.priority}
                      </span>

                      {/* Due date */}
                      {task.due_date && (
                        <span
                          className={`text-[11px] shrink-0 ${
                            overdue ? "text-red-400 font-medium" :
                            today ? "text-amber-400 font-medium" : "text-[var(--color-text-muted)]"
                          }`}
                        >
                          {overdue ? "Overdue · " : today ? "Today · " : ""}
                          {new Date(task.due_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
