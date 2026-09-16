"use client";

import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

export const PRESET_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#eab308" },
  { name: "Slate", hex: "#0f172a" },
  { name: "Zinc", hex: "#27272a" },
];

type ColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  description?: string;
};

export default function ColorPicker({
  value,
  onChange,
  label,
  description,
}: ColorPickerProps): React.JSX.Element {
  const [hexInput, setHexInput] = useState(value || "#6366f1");

  useEffect(() => {
    setHexInput(value || "#6366f1");
  }, [value]);

  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  }

  function handleSelectPreset(hex: string) {
    setHexInput(hex);
    onChange(hex);
  }

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
          {description && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Preset Swatches */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
        {PRESET_COLORS.map((preset) => {
          const isSelected = value.toLowerCase() === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => handleSelectPreset(preset.hex)}
              title={preset.name}
              className={`group relative h-9 w-full rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "border-[var(--color-text-primary)] ring-2 ring-[var(--color-text-primary)]/20 scale-105"
                  : "border-black/10 hover:scale-105"
              }`}
              style={{ backgroundColor: preset.hex }}
            >
              {isSelected && (
                <Check
                  size={15}
                  className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] stroke-[2.5]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Color Input & Hex Field */}
      <div className="flex items-center gap-3 pt-1">
        <div className="relative flex items-center">
          <input
            type="color"
            value={value || "#6366f1"}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="h-9 w-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5 bg-[var(--color-surface)]"
            title="Choose custom color"
          />
        </div>

        <div className="flex-1 max-w-[200px] relative">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="#6366f1"
            maxLength={7}
            className="w-full px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
          />
        </div>

        <div className="text-xs text-[var(--color-text-muted)]">
          Live brand accent preview
        </div>
      </div>
    </div>
  );
}
