import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";
import AdminAttendanceTable from "@/components/attendance/AdminAttendanceTable";

export const metadata: Metadata = {
  title: "Attendance — Admin View",
};

type AdminAttendancePageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ date?: string; department?: string }>;
};

export default async function AdminAttendancePage({
  params,
  searchParams,
}: AdminAttendancePageProps): Promise<React.JSX.Element> {
  await params;
  const { date: dateParam, department: departmentParam } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect(`/login`);

  // ── Role guard: admin or manager only ────────────────────────────────────
  if (profile.role !== "admin" && profile.role !== "manager") {
    redirect(`/attendance`);
  }

  // ── Selected date (defaults to today) ────────────────────────────────────
  const selectedDate = dateParam ?? new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const dayStart = `${selectedDate}T00:00:00.000Z`;
  const dayEnd = `${selectedDate}T23:59:59.999Z`;

  // ── Fetch all employees in company ────────────────────────────────────────
  const employeeQuery = supabase
    .from("profiles")
    .select("id, full_name, employee_id, department, avatar_url")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (departmentParam) {
    employeeQuery.eq("department", departmentParam);
  }

  const { data: employees } = await employeeQuery;

  // ── Fetch attendance logs for the selected date ───────────────────────────
  const { data: logs } = await supabase
    .from("attendance_logs")
    .select("id, user_id, check_in_at, check_out_at, check_in_range, check_out_range, status")
    .eq("company_id", profile.company_id)
    .gte("check_in_at", dayStart)
    .lte("check_in_at", dayEnd)
    .order("check_in_at", { ascending: true });

  // ── Fetch distinct departments for filter ────────────────────────────────
  const { data: deptRows } = await supabase
    .from("profiles")
    .select("department")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .not("department", "is", null);

  const departments = [
    ...new Set((deptRows ?? []).map((r) => r.department).filter(Boolean)),
  ] as string[];

  type LogRow = NonNullable<typeof logs>[number];
  const logsByUserId = new Map<string, LogRow[]>();
  for (const log of logs ?? []) {
    const existing = logsByUserId.get(log.user_id) ?? [];
    existing.push(log);
    logsByUserId.set(log.user_id, existing);
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Attendance — Admin View"
        description="View and export daily attendance for all employees."
        backHref="/attendance"
        backLabel="My attendance"
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        <AdminAttendanceTable
          employees={employees ?? []}
          logsByUserId={logsByUserId}
          departments={departments}
          selectedDate={selectedDate}
          selectedDepartment={departmentParam ?? ""}
        />
      </div>
    </div>
  );
}
