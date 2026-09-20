"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import Avatar from "@/components/shared/Avatar";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import {
  ChevronRight,
  Eye,
  UserX,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  UserCheck,
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export type EmployeeProfile = {
  id: string;
  company_id: string;
  full_name: string | null;
  role: "admin" | "manager" | "employee";
  phone: string | null;
  email?: string | null;
  employee_id: string | null;
  department: string | null;
  designation: string | null;
  date_of_joining: string | null;
  reporting_manager_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  reporting_manager?: {
    id: string;
    full_name: string | null;
  } | null;
};

export type ManagerOption = {
  id: string;
  full_name: string | null;
  designation: string | null;
};

type EmployeeListClientProps = {
  initialEmployees: EmployeeProfile[];
  initialPendingEmployees?: EmployeeProfile[];
  managerOptions?: ManagerOption[];
  subdomain: string;
  currentUserRole: string;
};

export default function EmployeeListClient({
  initialEmployees,
  initialPendingEmployees = [],
  managerOptions = [],
  subdomain: _subdomain,
  currentUserRole,
}: EmployeeListClientProps): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
  const [employees, setEmployees] = useState<EmployeeProfile[]>(initialEmployees);
  const [pendingEmployees, setPendingEmployees] = useState<EmployeeProfile[]>(initialPendingEmployees);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");

  // Review & Activation Modal state
  const [reviewingEmployee, setReviewingEmployee] = useState<EmployeeProfile | null>(null);
  const [role, setRole] = useState<"admin" | "manager" | "employee">("employee");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split("T")[0]);
  const [reportingManagerId, setReportingManagerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Extract distinct departments for filter dropdown
  const departments = useMemo(() => {
    const deps = new Set<string>();
    employees.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        deps.add(emp.department.trim());
      }
    });
    return Array.from(deps).sort();
  }, [employees]);

  // Filter active employees by selected department
  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === "ALL") return employees;
    return employees.filter(
      (emp) => emp.department?.trim() === selectedDepartment
    );
  }, [employees, selectedDepartment]);

  // Open review modal for a pending user
  function handleOpenReview(emp: EmployeeProfile): void {
    setReviewingEmployee(emp);
    setRole(emp.role || "employee");
    setEmployeeId(emp.employee_id || "");
    setDepartment(emp.department || "");
    setDesignation(emp.designation || "");
    setDateOfJoining(emp.date_of_joining || new Date().toISOString().split("T")[0]);
    setReportingManagerId(emp.reporting_manager_id || "");
    setActionError(null);
  }

  // Handle Approve & Activate
  async function handleActivate(): Promise<void> {
    if (!reviewingEmployee) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/employees/${reviewingEmployee.id}/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          employeeId: employeeId.trim() || undefined,
          department: department.trim() || undefined,
          designation: designation.trim() || undefined,
          dateOfJoining: dateOfJoining || undefined,
          reportingManagerId: reportingManagerId || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setActionError(result.error || "Failed to activate employee account.");
        setIsSubmitting(false);
        return;
      }

      // Move from pending to active in local state
      const updatedProfile: EmployeeProfile = result.data;
      setPendingEmployees((prev) => prev.filter((e) => e.id !== reviewingEmployee.id));
      setEmployees((prev) => [updatedProfile, ...prev]);
      setReviewingEmployee(null);
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setActionError("Network error occurred during activation.");
      setIsSubmitting(false);
    }
  }

  // Handle Reject & Delete
  async function handleReject(empId: string): Promise<void> {
    const confirmed = window.confirm(
      "Are you sure you want to reject this registration? The account will be permanently deleted."
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/employees/${empId}/reject`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setActionError(result.error || "Failed to reject registration.");
        setIsSubmitting(false);
        return;
      }

      setPendingEmployees((prev) => prev.filter((e) => e.id !== empId));
      if (reviewingEmployee?.id === empId) {
        setReviewingEmployee(null);
      }
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setActionError("Network error occurred while rejecting registration.");
      setIsSubmitting(false);
    }
  }

  // Columns definition for Active Employees DataTable
  const activeColumns: ColumnDef<EmployeeProfile>[] = [
    {
      accessorKey: "full_name",
      header: "Employee",
      cell: ({ row }: CellContext<EmployeeProfile, unknown>) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar src={emp.avatar_url} name={emp.full_name || "Employee"} size="sm" />
            <div className="flex flex-col min-w-0">
              <Link
                href={`/employees/${emp.id}`}
                className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand)] transition-colors truncate"
              >
                {emp.full_name || "Unnamed Employee"}
              </Link>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">
                {emp.employee_id || "No ID"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }: CellContext<EmployeeProfile, unknown>) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {row.original.department || "—"}
        </span>
      ),
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }: CellContext<EmployeeProfile, unknown>) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {row.original.designation || "—"}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: CellContext<EmployeeProfile, unknown>) => {
        const roleVal = row.original.role;
        const roleBadgeStyles: Record<string, string> = {
          admin: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
          manager: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
          employee: "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]",
        };
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
              roleBadgeStyles[roleVal] || roleBadgeStyles.employee
            }`}
          >
            {roleVal === "admin" && <Shield size={12} />}
            {roleVal}
          </span>
        );
      },
    },
    {
      accessorKey: "date_of_joining",
      header: "Joining Date",
      cell: ({ row }: CellContext<EmployeeProfile, unknown>) => {
        const doj = row.original.date_of_joining;
        return (
          <span className="text-xs text-[var(--color-text-muted)]">
            {doj ? format(new Date(doj), "MMM d, yyyy") : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: CellContext<EmployeeProfile, unknown>) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/employees/${emp.id}`}
              className="p-1.5 rounded-md hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
              title="View & Edit Profile"
            >
              <Eye size={16} />
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Employees"
        description="Manage team members, roles, permissions, and registration approvals."
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Navigation Tabs (Active Employees vs Pending Approvals) */}
        {currentUserRole === "admin" && (
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 select-none">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              <UserCheck size={15} />
              <span>Active Employees</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                {employees.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === "pending"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-[var(--color-text-muted)] hover:text-amber-400"
              }`}
            >
              <Clock size={15} className={pendingEmployees.length > 0 ? "animate-pulse" : ""} />
              <span>Pending Approvals</span>
              {pendingEmployees.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black shadow-xs">
                  {pendingEmployees.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── Active Employees Tab ─────────────────────────────────────────── */}
        {activeTab === "active" ? (
          <DataTable
            columns={activeColumns}
            data={filteredEmployees}
            searchPlaceholder="Search by name or ID..."
            filterComponent={
              departments.length > 0 ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--color-text-secondary)] font-medium hidden sm:inline">
                    Department:
                  </span>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:border-[var(--color-brand)]"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              ) : undefined
            }
            mobileCardRender={(emp: EmployeeProfile) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={emp.avatar_url} name={emp.full_name || "Employee"} size="md" />
                    <div>
                      <Link
                        href={`/employees/${emp.id}`}
                        className="font-semibold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-brand)]"
                      >
                        {emp.full_name || "Unnamed"}
                      </Link>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">
                        {emp.employee_id || "No ID"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/employees/${emp.id}`}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[var(--color-border-subtle)]">
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Dept / Designation</span>
                    <span className="font-medium text-[var(--color-text-secondary)]">
                      {emp.department || "—"} {emp.designation ? `• ${emp.designation}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Role</span>
                    <span className="capitalize font-medium text-[var(--color-brand)]">
                      {emp.role}
                    </span>
                  </div>
                </div>
              </div>
            )}
            emptyState={
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-muted)]">
                  <UserX size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    No employees found
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {selectedDepartment !== "ALL"
                      ? "No employees match the selected department."
                      : "When team members sign up on your workspace login page, approve them under Pending Approvals to get started."}
                  </p>
                </div>
              </div>
            }
          />
        ) : (
          /* ── Pending Approvals Tab ─────────────────────────────────────────── */
          <div className="space-y-4">
            {pendingEmployees.length === 0 ? (
              <div className="p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    All caught up! No pending registrations
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
                    When new team members sign up on your workspace login page, their activation requests will appear here for role assignment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-5 rounded-2xl border border-amber-500/30 bg-[var(--color-surface)] hover:border-amber-500/50 space-y-4 shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={emp.avatar_url} name={emp.full_name || "Applicant"} size="md" />
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                              {emp.full_name || "Unnamed Applicant"}
                            </h4>
                            {emp.email && (
                              <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                                {emp.email}
                              </p>
                            )}
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                              <Clock size={11} />
                              <span>Pending Activation</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs pt-2 border-t border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--color-text-muted)]">Registered:</span>
                          <span>{format(new Date(emp.created_at), "MMM d, yyyy h:mm a")}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--color-text-muted)]">Requested Role:</span>
                          <span className="capitalize font-medium text-[var(--color-text-primary)]">
                            {emp.role || "Employee"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(emp)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <UserCheck size={14} />
                        <span>Review & Activate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(emp.id)}
                        disabled={isSubmitting}
                        className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                        title="Reject & Delete"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Review & Role Activation Modal ───────────────────────────────────── */}
      {reviewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Activate Employee Account
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Assign role and organization details for {reviewingEmployee.full_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewingEmployee(null)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Error Alert */}
            {actionError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Activation Form Fields */}
            <div className="space-y-4 text-xs">
              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Shield size={13} className="text-[var(--color-brand)]" />
                  <span>Assign Access Role *</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "manager" | "employee")}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-brand)]"
                >
                  <option value="employee">Employee (Standard Access)</option>
                  <option value="manager">Manager (Project & Attendance Approvals)</option>
                  <option value="admin">Admin (Full Workspace Management)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Employee ID */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[var(--color-text-primary)]">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-007"
                    className="w-full h-10 px-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono focus:outline-hidden focus:border-[var(--color-brand)]"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
                    <Building2 size={12} className="text-[var(--color-text-muted)]" />
                    <span>Department</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering, Sales"
                    className="w-full h-10 px-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-brand)]"
                  />
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
                    <Briefcase size={12} className="text-[var(--color-text-muted)]" />
                    <span>Designation</span>
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    className="w-full h-10 px-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-brand)]"
                  />
                </div>

                {/* Date of Joining */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
                    <Calendar size={12} className="text-[var(--color-text-muted)]" />
                    <span>Date of Joining</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-brand)]"
                  />
                </div>
              </div>

              {/* Reporting Manager */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--color-text-primary)]">Reporting Manager</label>
                <select
                  value={reportingManagerId}
                  onChange={(e) => setReportingManagerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-brand)]"
                >
                  <option value="">None (No manager)</option>
                  {managerOptions
                    .filter((m) => m.id !== reviewingEmployee.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name || "Unnamed"} {m.designation ? `(${m.designation})` : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleReject(reviewingEmployee.id)}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                Reject & Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingEmployee(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Activating…</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      <span>Approve & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
