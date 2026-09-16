"use client";

import { useRouter } from "next/navigation";
import { Download, Filter } from "lucide-react";

type Employee = {
  id: string;
  full_name: string | null;
  employee_id: string | null;
  department: string | null;
  avatar_url: string | null;
};

type AttendanceLog = {
  id: string;
  user_id: string;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_range: boolean | null;
  check_out_range: boolean | null;
  status: string | null;
};

interface AdminAttendanceTableProps {
  employees: Employee[];
  logsByUserId: Map<string, AttendanceLog>;
  departments: string[];
  selectedDate: string;
  selectedDepartment: string;
}

type RowStatus = "present" | "absent" | "out_of_range" | "half_day" | "no_location";

function getRowStatus(log: AttendanceLog | undefined): RowStatus {
  if (!log) return "absent";
  if (log.status === "half_day") return "half_day";
  if (log.check_in_range === null) return "no_location";
  if (log.check_in_range === false) return "out_of_range";
  return "present";
}

const STATUS_BADGE: Record<RowStatus, { label: string; className: string }> = {
  present: { label: "Present", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  absent: { label: "Absent", className: "bg-red-500/15 text-red-400 border-red-500/25" },
  out_of_range: { label: "Out of Range", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  half_day: { label: "Half Day", className: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  no_location: { label: "No Location", className: "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]" },
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function downloadCSV(
  employees: Employee[],
  logsByUserId: Map<string, AttendanceLog>,
  date: string
): void {
  const headers = [
    "Date",
    "Employee Name",
    "Employee ID",
    "Department",
    "Status",
    "Check-in",
    "Check-out",
    "In Range",
  ];

  const rows = employees.map((emp) => {
    const log = logsByUserId.get(emp.id);
    const status = getRowStatus(log);
    return [
      date,
      emp.full_name ?? "",
      emp.employee_id ?? "",
      emp.department ?? "",
      STATUS_BADGE[status].label,
      log?.check_in_at ? formatTime(log.check_in_at) : "",
      log?.check_out_at ? formatTime(log.check_out_at) : "",
      log?.check_in_range === null ? "N/A" : log?.check_in_range ? "Yes" : "No",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminAttendanceTable({
  employees,
  logsByUserId,
  departments,
  selectedDate,
  selectedDepartment,
}: AdminAttendanceTableProps): React.JSX.Element {
  const router = useRouter();

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const params = new URLSearchParams();
    if (e.target.value) params.set("date", e.target.value);
    if (selectedDepartment) params.set("department", selectedDepartment);
    router.push(`?${params.toString()}`);
  }

  function handleDepartmentChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const params = new URLSearchParams();
    params.set("date", selectedDate);
    if (e.target.value) params.set("department", e.target.value);
    router.push(`?${params.toString()}`);
  }

  const presentCount = employees.filter((e) => {
    const log = logsByUserId.get(e.id);
    return log && getRowStatus(log) !== "absent";
  }).length;

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date picker */}
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <label htmlFor="date-picker" className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
            Date
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={new Date().toISOString().split("T")[0]}
            className="flex-1 h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent [color-scheme:dark]"
          />
        </div>

        {/* Department filter */}
        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <select
              id="dept-filter"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Export CSV */}
        <button
          id="export-csv-btn"
          onClick={() => downloadCSV(employees, logsByUserId, selectedDate)}
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-brand)] text-white hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary pill */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">
          {presentCount} present
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] font-medium text-[var(--color-text-primary)]">
          {employees.length - presentCount} absent / not yet
        </span>
        <span className="ml-1 text-[var(--color-text-muted)]">
          — {employees.length} total
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                Employee
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide hidden sm:table-cell">
                Department
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide hidden md:table-cell">
                Check-in
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide hidden md:table-cell">
                Check-out
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide hidden lg:table-cell">
                In Range
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-muted)] text-sm">
                  No employees found.
                </td>
              </tr>
            )}
            {employees.map((emp, idx) => {
              const log = logsByUserId.get(emp.id);
              const status = getRowStatus(log);
              const badge = STATUS_BADGE[status];

              return (
                <tr
                  key={emp.id}
                  className={[
                    "border-b border-[var(--color-border)] last:border-0 transition-colors",
                    idx % 2 === 0
                      ? "bg-[var(--color-bg)]"
                      : "bg-[var(--color-surface)]/40",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {emp.full_name ?? "—"}
                      </span>
                      {emp.employee_id && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {emp.employee_id}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden sm:table-cell">
                    {emp.department ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden md:table-cell">
                    {formatTime(log?.check_in_at ?? null)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden md:table-cell">
                    {formatTime(log?.check_out_at ?? null)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden lg:table-cell">
                    {log?.check_in_range === null
                      ? "N/A"
                      : log?.check_in_range
                      ? "✓"
                      : "✗"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
