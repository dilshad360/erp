"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  FolderKanban,
  Plus,
  LayoutGrid,
  List,
  Building2,
  Calendar,
  IndianRupee,
  MoreVertical,
  ExternalLink,
  Edit2,
  Archive,
  Search,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { formatINR, calculateTimelineProgress } from "@/lib/format";

export interface ProjectRecord {
  id: string;
  company_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: "active" | "on_hold" | "completed" | "cancelled";
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_by?: string | null;
  created_at: string;
  client?: {
    id: string;
    name: string;
    contact_person?: string | null;
  } | null;
  creator?: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface ClientOption {
  id: string;
  name: string;
}

interface ProjectListClientProps {
  initialProjects: ProjectRecord[];
  clients: ClientOption[];
  currentUserRole: string;
}

export default function ProjectListClient({
  initialProjects,
  clients,
  currentUserRole,
}: ProjectListClientProps): React.JSX.Element {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRecord[]>(initialProjects);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [projectToArchive, setProjectToArchive] = useState<ProjectRecord | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  const canManage = currentUserRole === "admin" || currentUserRole === "manager";

  // Load view mode preference from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("erp_projects_view_mode");
      if (savedMode === "card" || savedMode === "table") {
        setViewMode(savedMode);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  function handleViewModeChange(mode: "card" | "table") {
    setViewMode(mode);
    try {
      localStorage.setItem("erp_projects_view_mode", mode);
    } catch {
      // Ignore localStorage errors
    }
  }

  // Filter projects based on status, client, and search
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Status filter
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }
      // Client filter
      if (clientFilter !== "all" && project.client_id !== clientFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(query);
        const matchesClient = project.client?.name.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesClient) return false;
      }
      return true;
    });
  }, [projects, statusFilter, clientFilter, searchQuery]);

  async function handleArchiveProject(): Promise<void> {
    if (!projectToArchive) return;
    setIsArchiveLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectToArchive.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to archive project" }));
        alert(err.error || "Failed to archive project");
        return;
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === projectToArchive.id ? { ...p, status: "cancelled" } : p))
      );
      setProjectToArchive(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while archiving project.");
    } finally {
      setIsArchiveLoading(false);
    }
  }

  function getStatusBadge(status: ProjectRecord["status"]): React.JSX.Element {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]/20">
            Active
          </span>
        );
      case "on_hold":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning)]/20">
            On Hold
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)]/20">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
            Cancelled
          </span>
        );
    }
  }

  const columns = useMemo<ColumnDef<ProjectRecord>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Project",
        cell: ({ row }) => {
          const project = row.original;
          return (
            <Link
              href={`/projects/${project.id}`}
              className="flex items-center gap-3 group/link py-1"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center font-bold text-xs shrink-0 group-hover/link:bg-[var(--color-brand)] group-hover/link:text-white transition-colors">
                <FolderKanban size={16} />
              </div>
              <div className="min-w-0">
                <span className="font-semibold block truncate text-sm text-[var(--color-text-primary)] group-hover/link:text-[var(--color-brand)] transition-colors">
                  {project.name}
                </span>
                {project.client && (
                  <span className="text-[11px] text-[var(--color-text-muted)] truncate block">
                    {project.client.name}
                  </span>
                )}
              </div>
            </Link>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "timeline",
        header: "Timeline",
        cell: ({ row }) => {
          const { start_date, end_date } = row.original;
          if (!start_date && !end_date) {
            return <span className="text-xs text-[var(--color-text-muted)]">—</span>;
          }
          const progress = calculateTimelineProgress(start_date, end_date);
          return (
            <div className="space-y-1 w-36 text-xs">
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                <span>{start_date ?? "—"}</span>
                <span>{end_date ?? "—"}</span>
              </div>
              <div className="w-full bg-[var(--color-surface-raised)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border)]">
                <div
                  className={`h-full rounded-full ${
                    progress.isOverdue
                      ? "bg-[var(--color-danger)]"
                      : "bg-[var(--color-brand)]"
                  }`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "budget",
        header: "Budget",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
            {formatINR(row.original.budget)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const project = row.original;
          const isDropdownOpen = openDropdownId === project.id;

          return (
            <div className="relative flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownId(isDropdownOpen ? null : project.id);
                }}
                className="p-1.5 rounded-md hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Open project options"
              >
                <MoreVertical size={16} />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setOpenDropdownId(null)}
                  />
                  <div
                    className="absolute right-0 top-8 z-30 w-44 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xl py-1 text-xs divide-y divide-[var(--color-border-subtle)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <Link
                        href={`/projects/${project.id}`}
                        onClick={() => setOpenDropdownId(null)}
                        className="flex items-center gap-2 px-3 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                      >
                        <ExternalLink size={14} className="text-[var(--color-text-muted)]" />
                        View details
                      </Link>
                      {canManage && (
                        <Link
                          href={`/projects/${project.id}?edit=true`}
                          onClick={() => setOpenDropdownId(null)}
                          className="flex items-center gap-2 px-3 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                        >
                          <Edit2 size={14} className="text-[var(--color-text-muted)]" />
                          Edit project
                        </Link>
                      )}
                    </div>

                    {canManage && project.status !== "cancelled" && (
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenDropdownId(null);
                            setProjectToArchive(project);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors text-left"
                        >
                          <Archive size={14} />
                          Archive project
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [openDropdownId, canManage]
  );

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Projects"
        description="Track client deliverables, active timelines, budgets, and project progress."
        actions={
          canManage ? (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-all shadow-xs active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>New Project</span>
            </Link>
          ) : undefined
        }
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          heading="No projects yet"
          description="Create your first project to start organizing tasks, tracking budgets, and coordinating your team."
          action={
            canManage ? (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors"
              >
                <Plus size={16} />
                <span>Create First Project</span>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Controls Bar: Search, Status Tabs, Client Filter, View Switcher */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search + Client Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects or clients..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                />
              </div>

              {clients.length > 0 && (
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                >
                  <option value="all">All Clients</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Status Tabs + View Mode Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 text-xs font-medium">
                {["active", "on_hold", "completed", "all"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1.5 rounded-md capitalize transition-colors ${
                      statusFilter === status
                        ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-semibold shadow-xs"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {status === "all" ? "All" : status.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* View Switcher Button Group */}
              <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
                <button
                  type="button"
                  onClick={() => handleViewModeChange("card")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "card"
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}
                  title="Card View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange("table")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}
                  title="Table View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Main View: Card vs Table */}
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              heading="No matching projects"
              description="No projects found matching the current search, client, or status filter."
            />
          ) : viewMode === "card" ? (
            /* Card View Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const progress = calculateTimelineProgress(project.start_date, project.end_date);
                const isDropdownOpen = openDropdownId === project.id;

                return (
                  <div
                    key={project.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between hover:border-[var(--color-brand)]/50 transition-colors duration-150 space-y-4 shadow-xs"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Title, Status, Menu */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-base font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand)] transition-colors truncate block"
                          >
                            {project.name}
                          </Link>
                          {project.client && (
                            <Link
                              href={`/clients/${project.client.id}`}
                              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] transition-colors flex items-center gap-1.5 mt-0.5 truncate"
                            >
                              <Building2 size={12} className="shrink-0 text-[var(--color-text-muted)]" />
                              <span className="truncate">{project.client.name}</span>
                            </Link>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {getStatusBadge(project.status)}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenDropdownId(isDropdownOpen ? null : project.id)}
                              className="p-1 rounded hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {isDropdownOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenDropdownId(null)}
                                />
                                <div
                                  className="absolute right-0 top-6 z-30 w-40 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xl py-1 text-xs divide-y divide-[var(--color-border-subtle)]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    <Link
                                      href={`/projects/${project.id}`}
                                      onClick={() => setOpenDropdownId(null)}
                                      className="flex items-center gap-2 px-3 py-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                                    >
                                      <ExternalLink size={13} />
                                      View details
                                    </Link>
                                    {canManage && (
                                      <Link
                                        href={`/projects/${project.id}?edit=true`}
                                        onClick={() => setOpenDropdownId(null)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                                      >
                                        <Edit2 size={13} />
                                        Edit project
                                      </Link>
                                    )}
                                  </div>
                                  {canManage && project.status !== "cancelled" && (
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          setProjectToArchive(project);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] text-left"
                                      >
                                        <Archive size={13} />
                                        Archive
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {project.description && (
                        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metadata & Timeline */}
                    <div className="space-y-2.5 pt-3 border-t border-[var(--color-border-subtle)] text-xs">
                      {/* Timeline Bar */}
                      {(project.start_date || project.end_date) && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {progress.label}
                            </span>
                            <span>{progress.percentage}%</span>
                          </div>
                          <div className="w-full bg-[var(--color-surface-raised)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border)]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progress.isOverdue
                                  ? "bg-[var(--color-danger)]"
                                  : "bg-[var(--color-brand)]"
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Budget & Link */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
                          <IndianRupee size={13} className="text-[var(--color-text-muted)]" />
                          <span>{formatINR(project.budget).replace("₹", "")}</span>
                        </div>
                        <Link
                          href={`/projects/${project.id}`}
                          className="px-2.5 py-1 rounded-md bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors text-xs font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <DataTable
              columns={columns}
              data={filteredProjects}
              searchPlaceholder="Filter table rows..."
            />
          )}
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!projectToArchive}
        onClose={() => setProjectToArchive(null)}
        onConfirm={handleArchiveProject}
        isLoading={isArchiveLoading}
        title={`Archive ${projectToArchive?.name}?`}
        description="Archiving will change the project status to 'cancelled'. Linked tasks and time records will be kept intact."
        confirmLabel="Archive Project"
        variant="destructive"
      />
      </div>
    </div>
  );
}
