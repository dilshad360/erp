"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const { companyName, logoUrl } = useTenant();
  const router = useRouter();

  async function handleSignOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)]">
      {/* Company Logo / Name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={companyName}
            width={32}
            height={32}
            className="rounded-md object-contain"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-[var(--color-brand-subtle)] flex items-center justify-center text-[var(--color-brand)] font-bold text-sm">
            {companyName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
          {companyName}
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                transition-colors duration-150 group
                ${
                  isActive
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={18}
                className={
                  isActive
                    ? "text-[var(--color-brand)]"
                    : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
                }
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-[var(--color-border)]">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors duration-150"
          aria-label="Sign out"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );
}
