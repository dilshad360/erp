"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  Users,
  Briefcase,
  FolderKanban,
  Settings,
  LogOut,
} from "lucide-react";
import { useTenant } from "./TenantProvider";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance",  icon: Clock },
  { href: "/tasks",      label: "My Tasks",    icon: CheckSquare },
  { href: "/clients",    label: "Clients",     icon: Briefcase },
  { href: "/projects",   label: "Projects",    icon: FolderKanban },
  { href: "/employees",  label: "Employees",   icon: Users },
  { href: "/settings",   label: "Settings",    icon: Settings },
];

export default function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const { companyName, logoUrl, userName, userRole, userAvatarUrl } = useTenant();
  const router = useRouter();

  async function handleSignOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] select-none">
      {/* Company Branding */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] h-16">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={companyName}
            width={32}
            height={32}
            className="rounded-lg object-contain"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/20 flex items-center justify-center text-[var(--color-brand)] font-bold text-sm shrink-0">
            {companyName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-sm text-[var(--color-text-primary)] block truncate">
            {companyName}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)] font-mono block truncate">
            ERP Workspace
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group
                ${
                  isActive
                    ? "bg-[var(--color-brand)] text-white shadow-xs font-semibold"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={18}
                className={
                  isActive
                    ? "text-white"
                    : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors"
                }
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logged in User Profile Footer */}
      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/40">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            {userAvatarUrl ? (
              <Image
                src={userAvatarUrl}
                alt={userName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-[var(--color-border)] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/30 text-[var(--color-brand)] flex items-center justify-center font-bold text-xs shrink-0">
                {userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                {userName}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] capitalize truncate font-mono">
                {userRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
