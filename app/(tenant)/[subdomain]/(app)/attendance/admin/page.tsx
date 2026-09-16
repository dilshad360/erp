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
    .lte("check_in_at", dayEnd);

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

  const logsByUserId = new Map((logs ?? []).map((l) => [l.user_id, l]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance — Admin View"
        description="View and export daily attendance for all employees."
        actions={
          <a
            href={`/attendance`}
            className="text-xs font-medium text-[var(--color-brand)] hover:underline"
          >
            ← My attendance
          </a>
        }
      />

      <div className="px-4 md:px-6">
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
