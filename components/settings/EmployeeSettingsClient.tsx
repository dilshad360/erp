"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import LoadingButton from "@/components/shared/LoadingButton";
import {
  User,
  ShieldCheck,
  Sliders,
  MapPin,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Sparkles,
  Info,
} from "lucide-react";

export type EmployeeProfileData = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  dateOfJoining: string | null;
  avatarUrl: string | null;
  companyId: string;
};

export type CompanySummaryData = {
  name: string;
  geofenceRadiusM: number;
  officeLat: number | null;
  officeLng: number | null;
  brandColor: string | null;
  logoUrl: string | null;
};

type EmployeeSettingsClientProps = {
  profile: EmployeeProfileData;
  company: CompanySummaryData;
};

type TabType = "profile" | "security" | "preferences" | "workplace";

export default function EmployeeSettingsClient({
  profile: initialProfile,
  company,
}: EmployeeSettingsClientProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [profile, setProfile] = useState<EmployeeProfileData>(initialProfile);

  // Profile Form State
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Preferences State
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Avatar Upload
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Image size must be under 2MB.");
      return;
    }

    setUploadingAvatar(true);
    setProfileError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", profile.id);

      const res = await fetch("/api/employees/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to upload avatar");
      }

      setAvatarUrl(json.data.avatarUrl);
      setProfile((prev) => ({ ...prev, avatarUrl: json.data.avatarUrl }));
      setProfileSuccess("Avatar uploaded successfully.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error uploading avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // Handle Profile Update (Phone)
  async function handleSaveProfile(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch(`/api/employees/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim() || null,
          avatarUrl: avatarUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update profile");
      }

      setProfile((prev) => ({
        ...prev,
        phone: phone.trim() || null,
      }));
      setProfileSuccess("Profile updated successfully.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setProfileLoading(false);
    }
  }

  // Handle Password Update
  async function handleSavePassword(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setPasswordLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      setPasswordSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  }

  // Save Preferences
  function handleSavePreferences(e: React.FormEvent): void {
    e.preventDefault();
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 3000);
  }

  const roleBadgeStyle =
    profile.role === "manager"
      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
      : "bg-blue-500/10 text-blue-400 border-blue-500/20";

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex border-b border-[var(--color-border)] overflow-x-auto gap-2 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "profile"
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <User size={15} />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "security"
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <ShieldCheck size={15} />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "preferences"
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Sliders size={15} />
          <span>Preferences & Display</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workplace")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "workplace"
              ? "border-[var(--color-brand)] text-[var(--color-brand)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <MapPin size={15} />
          <span>Workplace & Policy</span>
        </button>
      </div>

      {/* Tab 1: My Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Section */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Profile Photo
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Update your personal photo shown across check-ins and tasks.
                </p>
              </div>

              {profileSuccess && (
                <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={16} />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle size={16} />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative w-20 h-20 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface-hover)] overflow-hidden shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-[var(--color-text-muted)] uppercase">
                      {profile.fullName ? profile.fullName.charAt(0) : "U"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>{uploadingAvatar ? "Uploading..." : "Upload New Photo"}</span>
                  </button>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    JPG, PNG, or WebP. Max size 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Details Section */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Personal Information
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Your contact details and official employee record.
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${roleBadgeStyle}`}
                >
                  {profile.role}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <User size={13} className="text-[var(--color-text-muted)]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.fullName || ""}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] cursor-not-allowed"
                  />
                </div>

                {/* Email (Read-Only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Mail size={13} className="text-[var(--color-text-muted)]" />
                    <span>Work Email</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email || "No email assigned"}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] cursor-not-allowed"
                  />
                </div>

                {/* Phone (Editable) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Phone size={13} className="text-[var(--color-text-muted)]" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>

                {/* Employee ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Briefcase size={13} className="text-[var(--color-text-muted)]" />
                    <span>Employee ID</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.employeeId || "—"}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] cursor-not-allowed"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.department || "—"}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] cursor-not-allowed"
                  />
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Designation
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.designation || "—"}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] cursor-not-allowed"
                  />
                </div>

                {/* Date of Joining */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--color-text-muted)]" />
                    <span>Date of Joining</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      profile.dateOfJoining
                        ? new Date(profile.dateOfJoining).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Only phone number and photo can be modified directly.
                </p>
                <LoadingButton
                  type="submit"
                  isLoading={profileLoading}
                  className="px-4 py-2 bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] rounded-lg text-xs font-semibold transition-colors"
                >
                  Save Profile
                </LoadingButton>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <form onSubmit={handleSavePassword} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Change Account Password
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Ensure your account is protected with a secure password.
              </p>
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <KeyRound size={13} className="text-[var(--color-text-muted)]" />
                  <span>New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2 pr-9 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-brand)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-brand)] transition-colors"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
              <LoadingButton
                type="submit"
                isLoading={passwordLoading}
                className="px-4 py-2 bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] rounded-lg text-xs font-semibold transition-colors"
              >
                Update Password
              </LoadingButton>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Preferences & Display */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Display & Accessibility
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Customize your individual workstation experience.
              </p>
            </div>

            {preferencesSaved && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
                <span>Preferences updated.</span>
              </div>
            )}

            <div className="divide-y divide-[var(--color-border)]">
              {/* Motion toggle */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[var(--color-brand)]" />
                    <span>Reduce Interface Animations</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Minimizes transitions for improved performance and accessibility.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-brand)] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Compact Mode toggle */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Compact Table Density
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Compress rows in Attendance and Task lists for high-density screens.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={compactMode}
                  onChange={(e) => setCompactMode(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-brand)] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Email notifications */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Bell size={14} className="text-[var(--color-text-muted)]" />
                    <span>Task Assignment Alerts</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Receive email notifications when tasks or project milestones are assigned to you.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-brand)] focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] rounded-lg text-xs font-semibold transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Workplace & Policy */}
      {activeTab === "workplace" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Workplace Information
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Official company workspace and attendance policy configuration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-1">
                <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Building2 size={13} />
                  <span>Company Workspace</span>
                </div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {company.name}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-1">
                <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <MapPin size={13} />
                  <span>Geofence Radius</span>
                </div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {company.geofenceRadiusM} meters
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-1 sm:col-span-2">
                <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <MapPin size={13} />
                  <span>Office GPS Coordinates</span>
                </div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  {company.officeLat != null && company.officeLng != null
                    ? `${company.officeLat.toFixed(6)}, ${company.officeLng.toFixed(6)}`
                    : "Coordinates not yet configured by Workspace Admin."}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
              <Info size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold">How Attendance Geofencing Works</div>
                <div className="text-[11px] leading-relaxed text-blue-300/90">
                  When you check in from your mobile device or computer, the system calculates the haversine distance between your GPS location and the office coordinates. Punches within {company.geofenceRadiusM}m are verified as on-site.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Company branding, office GPS location, tax details, and Kanban status columns can only be modified by a Workspace Administrator.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
