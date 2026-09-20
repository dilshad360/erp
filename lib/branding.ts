/**
 * Utility functions for tenant brand color processing and styling.
 */

export type BrandVariants = {
  brand: string;
  brandHover: string;
  brandSubtleDark: string;
  brandSubtleLight: string;
};

/**
 * Validates and normalizes a 6-character hex color code.
 * Defaults to '#6366f1' (indigo) if invalid.
 */
export function normalizeHex(color: string | null | undefined): string {
  if (!color) return "#6366f1";
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return "#6366f1";
}

/**
 * Converts a 6-digit hex color to RGB integers.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex);
  const num = parseInt(normalized.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Computes brand color variants (hover, dark subtle, light subtle) from a base hex color.
 */
export function getBrandColorVariants(brandHex: string | null | undefined): BrandVariants {
  const brand = normalizeHex(brandHex);
  const { r, g, b } = hexToRgb(brand);

  // Hover color: 15% darker in sRGB space
  const hoverR = Math.max(0, Math.floor(r * 0.85));
  const hoverG = Math.max(0, Math.floor(g * 0.85));
  const hoverB = Math.max(0, Math.floor(b * 0.85));
  const brandHover = `#${hoverR.toString(16).padStart(2, "0")}${hoverG
    .toString(16)
    .padStart(2, "0")}${hoverB.toString(16).padStart(2, "0")}`;

  // Subtle tints for backgrounds, badges, and active tabs
  const brandSubtleDark = `rgba(${r}, ${g}, ${b}, 0.18)`;
  const brandSubtleLight = `rgba(${r}, ${g}, ${b}, 0.12)`;

  return {
    brand,
    brandHover,
    brandSubtleDark,
    brandSubtleLight,
  };
}

/**
 * Generates high-specificity CSS rules to override theme variables across all states and page refreshes.
 */
export function generateBrandCss(brandHex: string | null | undefined): string {
  const { brand, brandHover, brandSubtleDark, brandSubtleLight } = getBrandColorVariants(brandHex);

  return `
    :root,
    html,
    html.dark,
    html.light,
    body {
      --color-brand: ${brand} !important;
      --color-brand-hover: ${brandHover} !important;
      --color-brand-subtle: ${brandSubtleDark} !important;
      --primary: ${brand} !important;
      --ring: ${brand} !important;
      --sidebar-primary: ${brand} !important;
      --sidebar-ring: ${brand} !important;
      --accent: ${brandSubtleDark} !important;
      --sidebar-accent: ${brandSubtleDark} !important;
    }

    html.light,
    html.light body {
      --color-brand-subtle: ${brandSubtleLight} !important;
      --accent: ${brandSubtleLight} !important;
      --sidebar-accent: ${brandSubtleLight} !important;
    }
  `.replace(/\s+/g, " ").trim();
}

/**
 * Applies brand color CSS variables directly to document.documentElement for live interactive updates.
 */
export function applyBrandToDocument(brandHex: string | null | undefined): void {
  if (typeof document === "undefined") return;

  const { brand, brandHover, brandSubtleDark, brandSubtleLight } = getBrandColorVariants(brandHex);
  const root = document.documentElement;
  const isLight = root.classList.contains("light");

  root.style.setProperty("--color-brand", brand);
  root.style.setProperty("--color-brand-hover", brandHover);
  root.style.setProperty("--color-brand-subtle", isLight ? brandSubtleLight : brandSubtleDark);
  root.style.setProperty("--primary", brand);
  root.style.setProperty("--ring", brand);
  root.style.setProperty("--sidebar-primary", brand);
  root.style.setProperty("--sidebar-ring", brand);
}
