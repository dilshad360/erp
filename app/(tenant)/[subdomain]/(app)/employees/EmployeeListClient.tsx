"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import Avatar from "@/components/shared/Avatar";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { UserPlus, ChevronRight, Eye, UserX, Shield } from "lucide-react";
import { format } from "date-fns";

export type EmployeeProfile = {
  id: string;
  company_id: string;
  full_name: string | null;
  role: "admin" | "manager" | "employee";
  phone: string | null;
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

type EmployeeListClientProps = {
  initialEmployees: EmployeeProfile[];
  subdomain: string;
  currentUserRole: string;
};

export default function EmployeeListClient({
  initialEmployees,
  subdomain: _subdomain,
  currentUserRole,
}: EmployeeListClientProps): React.JSX.Element {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");

  // Extract distinct departments for filter dropdown
  const departments = useMemo(() => {
    const deps = new Set<string>();
    initialEmployees.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        deps.add(emp.department.trim());
      }
    });
    return Array.from(deps).sort();
  }, [initialEmployees]);

  // Filter employees by selected department
  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === "ALL") return initialEmployees;
    return initialEmployees.filter(
      (emp) => emp.department?.trim() === selectedDepartment
    );
  }, [initialEmployees, selectedDepartment]);

  // Columns definition for DataTable
  const columns: ColumnDef<EmployeeProfile>[] = [
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
        const role = row.original.role;
        const roleBadgeStyles: Record<string, string> = {
          admin: "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]",
          manager: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
          employee: "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]",
        };
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
              roleBadgeStyles[role] || roleBadgeStyles.employee
            }`}
          >
            {role === "admin" && <Shield size={12} />}
            {role}
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description="Manage your team members, departments, and roles."
        actions={
          currentUserRole === "admin" ? (
            <Link
              href="/employees/new"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors"
            >
              <UserPlus size={16} />
              <span>Invite Employee</span>
            </Link>
          ) : undefined
        }
      />

      <div className="px-4 md:px-6">
        <DataTable
          columns={columns}
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
                    : "Get started by inviting your first team member."}
                </p>
              </div>
              {currentUserRole === "admin" && (
                <Link
                  href="/employees/new"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors mt-2"
                >
                  <UserPlus size={14} />
                  <span>Invite Employee</span>
                </Link>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
