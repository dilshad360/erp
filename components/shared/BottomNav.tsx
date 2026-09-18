"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  FolderKanban,
  MoreHorizontal,
  Users,
  Briefcase,
  Settings,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";
import { useTenant } from "./TenantProvider";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

// Mobile bottom tab bar — 4 primary tabs + 1 interactive More button
const primaryTabs = [
  { href: "/dashboard",  label: "Home",       icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
  { href: "/projects",   label: "Projects",   icon: FolderKanban },
];

export default function BottomNav(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { userName, userRole, userAvatarUrl } = useTenant();
  const [moreOpen, setMoreOpen] = useState(false);

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  // Check if current route belongs to "More" categories
  const isMoreActive =
    pathname.startsWith("/employees") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/settings");

  async function handleSignOut(): Promise<void> {
    setMoreOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const moreLinks = [
    {
      href: "/employees",
      label: "Employees",
      description: "Team directory & employee profiles",
      icon: Users,
    },
    {
      href: "/clients",
      label: "Clients",
      description: "Customer directory & GST details",
      icon: Briefcase,
    },
    {
      href: "/settings",
      label: "Settings",
      description: "Profile, preferences & workspace",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] safe-area-pb select-none transition-colors duration-200">
        <div className="flex items-center justify-around">
          {/* Primary Tabs */}
          {primaryTabs.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={`
                  flex flex-col items-center justify-center gap-1 py-2.5 px-3
                  min-w-[48px] min-h-[56px] transition-colors duration-150
                  ${
                    isActive
                      ? "text-[var(--color-brand)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}

          {/* More Action Button */}
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={`
              flex flex-col items-center justify-center gap-1 py-2.5 px-3
              min-w-[48px] min-h-[56px] transition-colors duration-150 cursor-pointer
              ${
                moreOpen || isMoreActive
                  ? "text-[var(--color-brand)] font-semibold"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }
            `}
            aria-label="More navigation options"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={20} strokeWidth={moreOpen || isMoreActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </div>

      {/* Slide-Up Bottom Sheet Drawer */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in duration-150"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-t-3xl p-5 pb-8 space-y-4 shadow-2xl safe-area-pb animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto -mt-1" />

            {/* User Profile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                {userAvatarUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--color-border)] shrink-0">
                    <Image
                      src={userAvatarUrl}
                      alt={userName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/30 text-[var(--color-brand)] flex items-center justify-center font-bold text-sm shrink-0">
                    {userInitial}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {userName}
                  </p>
                  <span className="inline-block text-[10px] uppercase font-mono tracking-wider font-semibold text-[var(--color-brand)]">
                    {userRole}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links List */}
            <div className="space-y-1.5">
              {moreLinks.map(({ href, label, description, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-all duration-150
                      ${
                        isActive
                          ? "bg-[var(--color-brand-subtle)] border-[var(--color-brand)]/30 text-[var(--color-brand)]"
                          : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-surface-hover)]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? "bg-[var(--color-brand)] text-white"
                            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{label}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">
                          {description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={isActive ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]"}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Bottom Actions: Theme Toggle & Sign Out */}
            <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Theme:</span>
                <ThemeToggle showLabel />
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
