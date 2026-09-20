"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ColorPicker from "@/components/shared/ColorPicker";
import KanbanColumnManager, { type TaskStatusRow } from "@/components/tasks/KanbanColumnManager";
import LoadingButton from "@/components/shared/LoadingButton";
import { applyBrandToDocument } from "@/lib/branding";
import {
  Building2,
  Palette,
  Kanban,
  AlertTriangle,
  Upload,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  LocateFixed,
} from "lucide-react";
import Image from "next/image";

export type CompanyData = {
  id: string;
  name: string;
  slug: string;
  gst_number: string | null;
  office_lat: number | null;
  office_lng: number | null;
  geofence_radius_m: number;
  brand_color: string | null;
  logo_url: string | null;
};

type CompanySettingsClientProps = {
  company: CompanyData;
  statuses: TaskStatusRow[];
  isAdmin: boolean;
};

type TabType = "general" | "appearance" | "kanban" | "danger";

export default function CompanySettingsClient({
  company: initialCompany,
  statuses,
  isAdmin,
}: CompanySettingsClientProps): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [company, setCompany] = useState<CompanyData>(initialCompany);

  // General Form State
  const [name, setName] = useState(initialCompany.name || "");
  const [gstNumber, setGstNumber] = useState(initialCompany.gst_number || "");
  const [officeLat, setOfficeLat] = useState<string>(
    initialCompany.office_lat != null ? initialCompany.office_lat.toString() : ""
  );
  const [officeLng, setOfficeLng] = useState<string>(
    initialCompany.office_lng != null ? initialCompany.office_lng.toString() : ""
  );
  const [geofenceRadius, setGeofenceRadius] = useState<number>(
    initialCompany.geofence_radius_m || 200
  );
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Appearance Form State
  const [brandColor, setBrandColor] = useState(initialCompany.brand_color || "#6366f1");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialCompany.logo_url);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [appearanceLoading, setAppearanceLoading] = useState(false);
  const [appearanceSuccess, setAppearanceSuccess] = useState<string | null>(null);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live CSS variable update for instant feedback
  function handleBrandColorChange(color: string) {
    setBrandColor(color);
    applyBrandToDocument(color);
  }

  // Handle GPS location fetch
  function handleFetchLocation() {
    if (!navigator.geolocation) {
      setGeneralError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOfficeLat(pos.coords.latitude.toFixed(6));
        setOfficeLng(pos.coords.longitude.toFixed(6));
        setGeneralSuccess("Location updated from your current GPS coordinates.");
        setTimeout(() => setGeneralSuccess(null), 3000);
      },
      (err) => {
        setGeneralError(`Location permission denied: ${err.message}`);
        setTimeout(() => setGeneralError(null), 4000);
      },
      { enableHighAccuracy: true }
    );
  }

  // Handle General Settings Save
  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setGeneralLoading(true);
    setGeneralSuccess(null);
    setGeneralError(null);

    try {
      const payload = {
        name: name.trim(),
        gst_number: gstNumber.trim() || null,
        office_lat: officeLat ? parseFloat(officeLat) : null,
        office_lng: officeLng ? parseFloat(officeLng) : null,
        geofence_radius_m: geofenceRadius,
      };

      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to update general settings");
      }

      setCompany(json.data);
      setGeneralSuccess("Workspace details updated successfully.");
      setTimeout(() => setGeneralSuccess(null), 4000);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setGeneralLoading(false);
    }
  }

  // Handle Logo Upload
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setUploadingLogo(true);
    setAppearanceError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/company/upload-logo", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to upload logo");
      }

      setLogoUrl(json.data.logoUrl);
      setCompany((prev) => ({ ...prev, logo_url: json.data.logoUrl }));
      setAppearanceSuccess("Logo uploaded and updated successfully.");
      setTimeout(() => setAppearanceSuccess(null), 4000);
    } catch (err) {
      setAppearanceError(err instanceof Error ? err.message : "Error uploading logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  // Handle Appearance Settings Save
  async function handleSaveAppearance(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setAppearanceLoading(true);
    setAppearanceSuccess(null);
    setAppearanceError(null);

    try {
      const payload = {
        brand_color: brandColor,
        logo_url: logoUrl,
      };

      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to save branding appearance");
      }

      setCompany(json.data);
      if (json.data.brand_color) {
        applyBrandToDocument(json.data.brand_color);
      }
      router.refresh();
      setAppearanceSuccess("Brand styling saved successfully.");
      setTimeout(() => setAppearanceSuccess(null), 4000);
    } catch (err) {
      setAppearanceError(err instanceof Error ? err.message : "Error saving branding");
    } finally {
      setAppearanceLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-center space-y-3">
        <AlertCircle size={32} className="mx-auto text-amber-400" />
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Administrator Access Required
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
          Company workspace settings, branding, geofence, and Kanban configuration can only be managed by workspace administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex border-b border-[var(--color-border)] overflow-x-auto gap-2 pb-px">
        <button
          onClick={() => setActiveTab("general")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "general"
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Building2 size={15} />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab("appearance")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "appearance"
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Palette size={15} />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab("kanban")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "kanban"
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Kanban size={15} />
          <span>Kanban Columns</span>
        </button>

        <button
          onClick={() => setActiveTab("danger")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "danger"
              ? "border-red-500 text-red-500"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <AlertTriangle size={15} />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Company Details
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Manage your workspace identity and tax details.
              </p>
            </div>

            {generalSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
                <span>{generalSuccess}</span>
              </div>
            )}

            {generalError && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle size={16} />
                <span>{generalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Workspace Subdomain
                </label>
                <div className="flex items-center px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] cursor-not-allowed">
                  <span className="font-mono">{company.slug}</span>
                  <span className="text-[var(--color-text-muted)]/70">
                    .{process.env.NEXT_PUBLIC_APP_DOMAIN ?? "erp.dilshadcodes.com"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  GST Number
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 32AAAAA0000A1Z5"
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] font-mono disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Office Geofencing */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Office Location & Geofencing
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Set your office GPS coordinates to validate employee attendance check-ins.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleFetchLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors shrink-0"
                >
                  <LocateFixed size={14} className="text-[var(--color-brand)]" />
                  <span>Use Current GPS</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={officeLat}
                  onChange={(e) => setOfficeLat(e.target.value)}
                  placeholder="e.g. 9.931233"
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] font-mono disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={officeLng}
                  onChange={(e) => setOfficeLng(e.target.value)}
                  placeholder="e.g. 76.267303"
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] font-mono disabled:opacity-50"
                />
              </div>

              <div className="space-y-2 sm:col-span-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-[var(--color-text-primary)]">
                    Geofence Radius
                  </label>
                  <span className="font-mono font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded-md border border-[var(--color-brand)]/20">
                    {geofenceRadius} meters
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(parseInt(e.target.value, 10))}
                  disabled={!isAdmin}
                  className="w-full accent-[var(--color-brand)] cursor-pointer disabled:opacity-50"
                />
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Employees within this radius from office coordinates will be marked as in-office during check-in.
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <LoadingButton
                type="submit"
                isLoading={generalLoading}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-xs"
              >
                Save General Settings
              </LoadingButton>
            </div>
          )}
        </form>
      )}

      {/* Tab 2: Appearance & Branding */}
      {activeTab === "appearance" && (
        <form onSubmit={handleSaveAppearance} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Brand Appearance
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Customize your company logo and workspace accent color.
              </p>
            </div>

            {appearanceSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
                <span>{appearanceSuccess}</span>
              </div>
            )}

            {appearanceError && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle size={16} />
                <span>{appearanceError}</span>
              </div>
            )}

            {/* Logo Upload Section */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--color-text-primary)]">
                Company Logo
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative h-16 w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Company Logo"
                      width={64}
                      height={64}
                      className="h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <ImageIcon size={24} className="text-[var(--color-text-muted)]" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={!isAdmin || uploadingLogo}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isAdmin || uploadingLogo}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
                    >
                      <Upload size={14} />
                      <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                    </button>

                    {logoUrl && isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrl(null);
                          setCompany((prev) => ({ ...prev, logo_url: null }));
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Recommended size: 256×256 PNG or SVG. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Accent Color */}
            <div className="pt-2 border-t border-[var(--color-border-subtle)]">
              <ColorPicker
                value={brandColor}
                onChange={handleBrandColorChange}
                label="Workspace Brand Color"
                description="Select a curated theme swatch or enter a custom hex code. Updates UI accents live."
              />
            </div>

            {/* Live Component Preview */}
            <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
                Live UI Preview
              </h3>
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white shadow-xs"
                  style={{ backgroundColor: brandColor }}
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border"
                  style={{
                    borderColor: brandColor,
                    color: brandColor,
                    backgroundColor: `${brandColor}15`,
                  }}
                >
                  Secondary Accent
                </button>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${brandColor}20`,
                    color: brandColor,
                  }}
                >
                  Status Badge
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <LoadingButton
                type="submit"
                isLoading={appearanceLoading}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-xs"
              >
                Save Appearance Settings
              </LoadingButton>
            </div>
          )}
        </form>
      )}

      {/* Tab 3: Kanban Columns Manager */}
      {activeTab === "kanban" && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="pb-2 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Kanban Columns Configuration
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Customize the status columns on your projects' Kanban boards. Drag to reorder.
            </p>
          </div>

          {isAdmin ? (
            <KanbanColumnManager initialStatuses={statuses} />
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Only workspace admins and managers can manage Kanban columns.
            </p>
          )}
        </div>
      )}

      {/* Tab 4: Danger Zone */}
      {activeTab === "danger" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={18} />
            <h2 className="text-sm font-bold">Danger Zone</h2>
          </div>

          <div className="space-y-2 text-xs text-[var(--color-text-muted)]">
            <p>
              Workspace UUID: <span className="font-mono text-[var(--color-text-primary)]">{company.id}</span>
            </p>
            <p>
              Subdomain: <span className="font-mono text-[var(--color-text-primary)]">{company.slug}</span>
            </p>
          </div>

          <div className="pt-2 border-t border-red-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                Delete Workspace
              </h4>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Account deletion is irreversible. Contact support to request workspace deactivation.
              </p>
            </div>
            <a
              href="mailto:support@dilshadcodes.com?subject=Workspace%20Deletion%20Request"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
            >
              Contact Support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
