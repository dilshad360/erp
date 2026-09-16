import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";
import AttendanceCheckInPanel from "@/components/attendance/AttendanceCheckInPanel";
import AttendanceMonthCalendar from "@/components/attendance/AttendanceMonthCalendar";
import { Calendar, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Attendance",
};

type AttendancePageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ view?: string }>;
};

type AttendanceLog = {
  id: string;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_range: boolean | null;
  status: string | null;
};

export default async function AttendancePage({
  params,
  searchParams,
}: AttendancePageProps): Promise<React.JSX.Element> {
  await params;
  const { view = "today" } = await searchParams;

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

  // ── Fetch today's logs ───────────────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todayLogs } = await supabase
    .from("attendance_logs")
    .select("id, check_in_at, check_out_at, check_in_range, status")
    .eq("user_id", user.id)
    .gte("check_in_at", todayStart.toISOString())
    .lte("check_in_at", todayEnd.toISOString())
    .order("check_in_at", { ascending: true });

  // ── Fetch monthly logs if "month" view is active ──────────────────────────
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  let monthlyLogs: AttendanceLog[] = [];
  if (view === "month") {
    const { data } = await supabase
      .from("attendance_logs")
      .select("id, check_in_at, check_out_at, check_in_range, status")
      .eq("user_id", user.id)
      .gte("check_in_at", monthStart)
      .lte("check_in_at", monthEnd)
      .order("check_in_at", { ascending: true });

    monthlyLogs = data ?? [];
  }

  const isAdminOrManager = profile.role === "admin" || profile.role === "manager";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Track your daily attendance and view history."
        actions={
          isAdminOrManager ? (
            <a
              href={`/attendance/admin`}
              className="text-xs font-medium text-[var(--color-brand)] hover:underline"
            >
              Admin view →
            </a>
          ) : undefined
        }
      />

      <div className="px-4 md:px-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Tab toggle */}
        <div
          className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
          role="tablist"
        >
          <a
            href={`?view=today`}
            role="tab"
            aria-selected={view === "today"}
            className={[
              "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150",
              view === "today"
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
            ].join(" ")}
          >
            <Clock className="w-3.5 h-3.5" />
            Today
          </a>
          <a
            href={`?view=month`}
            role="tab"
            aria-selected={view === "month"}
            className={[
              "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150",
              view === "month"
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
            ].join(" ")}
          >
            <Calendar className="w-3.5 h-3.5" />
            This Month
          </a>
        </div>

        {/* Panel content */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          {view === "today" ? (
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <AttendanceCheckInPanel
                todayLogs={todayLogs ?? []}
              />
            </div>
          ) : (
            <AttendanceMonthCalendar logs={monthlyLogs} month={currentMonth} />
          )}
        </div>
      </div>
    </div>
  );
}
