"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps): React.JSX.Element {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check saved theme or system preference
    const saved = localStorage.getItem("erp_theme") as "dark" | "light" | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(saved);
    } else {
      // Default is dark mode
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleTheme(): void {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("erp_theme", nextTheme);

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextTheme);
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className={`p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] opacity-50 ${className}`}
        aria-label="Toggle theme"
      >
        <Moon size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-surface-hover)] transition-all duration-150 select-none shadow-xs ${className}`}
      aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
    >
      {theme === "dark" ? (
        <Sun size={16} className="text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon size={16} className="text-indigo-500 transition-transform duration-200 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
