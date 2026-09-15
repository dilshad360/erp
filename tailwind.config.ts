import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        border: "var(--color-border)",
        "border-subtle": "var(--color-border-subtle)",

        // Text
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",

        // Brand (overridable per tenant)
        brand: "var(--color-brand)",
        "brand-hover": "var(--color-brand-hover)",
        "brand-subtle": "var(--color-brand-subtle)",

        // Semantic
        success: "var(--color-success)",
        "success-subtle": "var(--color-success-subtle)",
        warning: "var(--color-warning)",
        "warning-subtle": "var(--color-warning-subtle)",
        danger: "var(--color-danger)",
        "danger-subtle": "var(--color-danger-subtle)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        display: ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        h1: ["1.5rem", { lineHeight: "1.2", fontWeight: "600" }],
        h2: ["1.25rem", { lineHeight: "1.2", fontWeight: "600" }],
        h3: ["1rem", { lineHeight: "1.2", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        small: ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        "level-1":
          "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "level-2":
          "0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)",
        "level-3": "0 20px 40px rgba(0,0,0,0.6)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};

export default config;
