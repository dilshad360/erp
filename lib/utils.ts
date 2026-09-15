import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names safely.
 * Combines clsx (conditional classes) + tailwind-merge (dedup conflicting classes).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
