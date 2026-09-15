"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  FolderKanban,
  MoreHorizontal,
} from "lucide-react";

// Mobile bottom tab bar — max 5 items per design.md
const tabs = [
  { href: "/dashboard",  label: "Home",       icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
  { href: "/projects",   label: "Projects",   icon: FolderKanban },
  { href: "/clients",    label: "More",       icon: MoreHorizontal },
];

export default function BottomNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] safe-area-pb">
      <div className="flex items-center justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center gap-1 py-3 px-4
                min-w-[44px] min-h-[56px] transition-colors duration-150
                ${
                  isActive
                    ? "text-[var(--color-brand)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }
              `}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
