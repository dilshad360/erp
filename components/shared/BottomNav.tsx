"use client";

import React, { useState, useEffect } from "react";
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
  const { userName, userRole, userAvatarUrl, brandColor } = useTenant();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";
  const activeBrandColor = brandColor || "#6366f1";

  // Reset pending loading state when pathname changes
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

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
        <div className="grid grid-cols-5 items-center w-full">
          {/* Primary Tabs */}
          {primaryTabs.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            const isPending = pendingHref === href;
            const isHighlighted = isActive || isPending;

            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  setMoreOpen(false);
                  if (pathname !== href) {
                    setPendingHref(href);
                  }
                }}
                className={`
                  relative flex flex-col items-center justify-center gap-1 py-2 px-1 my-0.5
                  w-full min-h-[52px] rounded-xl text-center
                  touch-manipulation cursor-pointer
                  transform transition-all duration-100 ease-out
                  active:scale-85 active:bg-[var(--color-surface-hover)] active:opacity-80
                  ${
                    isHighlighted
                      ? "text-[var(--color-brand)] font-semibold"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
              >
                {/* Active/Pending background highlight bubble */}
                {isHighlighted && (
                  <div
                    className="absolute inset-1 rounded-xl opacity-15 pointer-events-none transition-all duration-200"
                    style={{ backgroundColor: activeBrandColor }}
                  />
                )}

                <div className="relative flex items-center justify-center">
                  <Icon
                    size={20}
                    strokeWidth={isHighlighted ? 2.5 : 2}
                    className="transition-transform duration-150"
                  />
                </div>

                <span className="text-[10px] tracking-tight leading-none truncate max-w-full px-0.5">
                  {label}
                </span>

                {/* Subtle active indicator underline pill */}
                {isActive && !isPending && (
                  <div
                    className="w-4 h-0.5 rounded-full mt-0.5 transition-all duration-200"
                    style={{ backgroundColor: activeBrandColor }}
                  />
                )}
              </Link>
            );
          })}

          {/* More Action Button */}
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={`
              relative flex flex-col items-center justify-center gap-1 py-2 px-1 my-0.5
              w-full min-h-[52px] rounded-xl text-center
              touch-manipulation cursor-pointer
              transform transition-all duration-100 ease-out
              active:scale-85 active:bg-[var(--color-surface-hover)] active:opacity-80
              ${
                moreOpen || isMoreActive
                  ? "text-[var(--color-brand)] font-semibold"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }
            `}
            aria-label="More navigation options"
            aria-expanded={moreOpen}
          >
            {(moreOpen || isMoreActive) && (
              <div
                className="absolute inset-1 rounded-xl opacity-15 pointer-events-none transition-all duration-200"
                style={{ backgroundColor: activeBrandColor }}
              />
            )}
            <div className="relative flex items-center justify-center">
              <MoreHorizontal size={20} strokeWidth={moreOpen || isMoreActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] tracking-tight leading-none">More</span>
            {isMoreActive && !moreOpen && (
              <div
                className="w-4 h-0.5 rounded-full mt-0.5 transition-all duration-200"
                style={{ backgroundColor: activeBrandColor }}
              />
            )}
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
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border"
                    style={{
                      backgroundColor: `${activeBrandColor}18`,
                      color: activeBrandColor,
                      borderColor: `${activeBrandColor}40`,
                    }}
                  >
                    {userInitial}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {userName}
                  </p>
                  <span
                    className="inline-block text-[10px] uppercase font-mono tracking-wider font-semibold"
                    style={{ color: activeBrandColor }}
                  >
                    {userRole}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] active:scale-90 transition-all cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links List */}
            <div className="space-y-1.5">
              {moreLinks.map(({ href, label, description, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                const isPending = pendingHref === href;
                const isHighlighted = isActive || isPending;

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => {
                      setMoreOpen(false);
                      if (pathname !== href) {
                        setPendingHref(href);
                      }
                    }}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border
                      touch-manipulation transform transition-all duration-100 ease-out
                      active:scale-[0.97] active:opacity-85
                      ${
                        isHighlighted
                          ? "border-[var(--color-brand)]/40 text-[var(--color-brand)]"
                          : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-surface-hover)]"
                      }
                    `}
                    style={
                      isHighlighted
                        ? {
                            backgroundColor: `${activeBrandColor}12`,
                            borderColor: `${activeBrandColor}40`,
                            color: activeBrandColor,
                          }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg text-white transition-transform duration-150"
                        style={{
                          backgroundColor: isHighlighted ? activeBrandColor : "var(--color-surface-raised)",
                          color: isHighlighted ? "#ffffff" : "var(--color-text-secondary)",
                        }}
                      >
                        <Icon size={18} className={isPending ? "animate-pulse" : ""} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>{label}</span>
                          {isPending && (
                            <span className="text-[10px] font-normal opacity-75 animate-pulse">
                              (loading…)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">
                          {description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={isHighlighted ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]"}
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 active:scale-95 border border-red-500/20 transition-all cursor-pointer"
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
