"use client";

import { useTenant } from "./TenantProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps): React.JSX.Element {
  const { userName, userRole } = useTenant();
  const router = useRouter();

  async function handleSignOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="space-y-0.5 min-w-0">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {actions}
        
        {/* User profile & sign out pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-[var(--color-border)]">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-medium text-[var(--color-text-primary)] truncate max-w-[120px]">
              {userName}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] capitalize">
              {userRole}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] border border-[var(--color-border)] transition-colors duration-150 cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={14} />
            <span className="hidden xs:inline">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
