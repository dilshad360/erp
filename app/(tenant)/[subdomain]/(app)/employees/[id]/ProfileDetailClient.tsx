"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import Avatar from "@/components/shared/Avatar";
import { type EmployeeProfile } from "../EmployeeListClient";
import {
  ArrowLeft,
  Camera,
  Edit2,
  Shield,
  Trash2,
  User,
  Phone,
  Building,
  Calendar,
  Briefcase,
  UserCheck,
  Loader2,
  AlertCircle,
  Save,
  X,
  Send,
  UserX,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

type ProfileDetailClientProps = {
  employee: EmployeeProfile;
  managers: { id: string; full_name: string | null; designation: string | null }[];
  currentUserId: string;
  currentUserRole: string;
  subdomain: string;
  isConfirmed?: boolean;
};

export default function ProfileDetailClient({
  employee,
  managers,
  currentUserId,
  currentUserRole,
  subdomain: _subdomain,
  isConfirmed = false,
}: ProfileDetailClientProps): React.JSX.Element {
  const router = useRouter();
  const isAdmin = currentUserRole === "admin";
  const isSelf = currentUserId === employee.id;

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResendingInvite, setIsResendingInvite] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState(employee.full_name || "");
  const [phone, setPhone] = useState(employee.phone || "");
  const [employeeId, setEmployeeId] = useState(employee.employee_id || "");
  const [department, setDepartment] = useState(employee.department || "");
  const [designation, setDesignation] = useState(employee.designation || "");
  const [dateOfJoining, setDateOfJoining] = useState(
    employee.date_of_joining ? employee.date_of_joining.split("T")[0] : ""
  );
  const [reportingManagerId, setReportingManagerId] = useState<string | null>(
    employee.reporting_manager_id
  );
  const [role, setRole] = useState<"admin" | "manager" | "employee">(
    employee.role || "employee"
  );
  const [avatarUrl, setAvatarUrl] = useState(employee.avatar_url);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Avatar file size must be less than 2MB.");
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeId", employee.id);

    try {
      const res = await fetch("/api/employees/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to upload avatar");
      } else {
        setAvatarUrl(data.data.avatarUrl);
        setSuccessMsg("Profile photo updated successfully!");
        router.refresh();
      }
    } catch {
      setErrorMsg("Error uploading avatar file.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatePayload = isAdmin
      ? {
          fullName,
          phone,
          employeeId,
          department,
          designation,
          dateOfJoining: dateOfJoining || null,
          reportingManagerId: reportingManagerId || null,
          role,
        }
      : {
          phone,
        };

    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to update profile");
        setIsSubmitting(false);
        return;
      }

      setIsEditing(false);
      setIsSubmitting(false);
      setSuccessMsg("Employee details saved successfully!");
      router.refresh();
    } catch {
      setErrorMsg("Failed to update profile.");
      setIsSubmitting(false);
    }
  };

  // Handle Resend Invite
  const handleResendInvite = async () => {
    setIsResendingInvite(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/employees/${employee.id}/resend-invite`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to resend invitation email");
      } else {
        setSuccessMsg(`Invitation email resent to ${data.data.email || "employee"}!`);
      }
    } catch {
      setErrorMsg("Error resending invitation email.");
    } finally {
      setIsResendingInvite(false);
    }
  };

  // Handle Deactivate
  const handleDeactivate = async () => {
    if (
      !confirm(
        `Are you sure you want to deactivate ${employee.full_name || "this employee"}? They will no longer be able to log in.`
      )
    ) {
      return;
    }

    setIsDeactivating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/employees/${employee.id}?action=deactivate`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to deactivate employee");
        setIsDeactivating(false);
        return;
      }

      setSuccessMsg("Employee deactivated successfully.");
      setIsDeactivating(false);
      router.refresh();
    } catch {
      setErrorMsg("Error deactivating employee.");
      setIsDeactivating(false);
    }
  };

  // Handle Reactivate
  const handleReactivate = async () => {
    setIsReactivating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to reactivate employee");
        setIsReactivating(false);
        return;
      }

      setSuccessMsg("Employee reactivated successfully.");
      setIsReactivating(false);
      router.refresh();
    } catch {
      setErrorMsg("Error reactivating employee.");
      setIsReactivating(false);
    }
  };

  // Handle Hard Delete
  const handleDeletePermanent = async () => {
    const confirmation = prompt(
      `WARNING: Permanently deleting ${employee.full_name || "this employee"} will erase their profile and account. This action CANNOT be undone.\n\nTo confirm, type "DELETE":`
    );

    if (confirmation !== "DELETE") {
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/employees/${employee.id}?action=delete`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to delete employee permanently");
        setIsDeleting(false);
        return;
      }

      router.push(`/employees`);
      router.refresh();
    } catch {
      setErrorMsg("Error deleting employee.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={employee.full_name || "Employee Profile"}
        description="View and update employee details, invite status, and roles."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/employees"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to list</span>
            </Link>

            {isAdmin && !isSelf && employee.is_active && !isConfirmed && (
              <button
                onClick={handleResendInvite}
                disabled={isResendingInvite}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-colors disabled:opacity-50 cursor-pointer"
                title="Resend invitation email"
              >
                {isResendingInvite ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} className="text-[var(--color-brand)]" />
                )}
                <span>Resend Invite</span>
              </button>
            )}

            {(isAdmin || isSelf) && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors cursor-pointer"
              >
                <Edit2 size={14} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        }
      />

      <div className="px-4 md:px-6 max-w-4xl space-y-6">
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-md bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-md bg-[var(--color-success-subtle)] border border-[var(--color-success)]/30 text-[var(--color-success)] text-xs font-medium">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col md:flex-row items-center md:items-start gap-6 relative">
          {/* Avatar Upload Container */}
          <div className="relative group">
            <Avatar
              src={avatarUrl}
              name={fullName || employee.full_name}
              size="xl"
            />
            {(isAdmin || isSelf) && (
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] cursor-pointer shadow-md transition-transform group-hover:scale-105"
                title="Change Avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                />
              </label>
            )}
          </div>

          {/* Details Header */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {fullName || "Unnamed Employee"}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {designation || "No Designation"} {department ? `• ${department}` : ""}
                </p>
              </div>

              <div className="flex items-center justify-center md:justify-end gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                  <Shield size={12} />
                  {role}
                </span>

                {!employee.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-danger-subtle)] text-[var(--color-danger)]">
                    Deactivated
                  </span>
                ) : !isConfirmed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Pending Invite
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-success-subtle)] text-[var(--color-success)]">
                    Active
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-[var(--color-text-muted)] font-mono">
              <span>ID: {employeeId || "N/A"}</span>
              {employee.date_of_joining && (
                <span>Joined: {format(new Date(employee.date_of_joining), "MMM d, yyyy")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content / Edit Form */}
        <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isEditing ? "Edit Profile Details" : "Employee Details"}
            </h3>

            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  <X size={14} className="inline mr-1" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            /* Inline Edit Form */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isAdmin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
                />
              </div>

              {isAdmin && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--color-brand)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                      Date of Joining
                    </label>
                    <input
                      type="date"
                      value={dateOfJoining}
                      onChange={(e) => setDateOfJoining(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                      Reporting Manager
                    </label>
                    <select
                      value={reportingManagerId || ""}
                      onChange={(e) => setReportingManagerId(e.target.value || null)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
                    >
                      <option value="">None (No Manager)</option>
                      {managers
                        .filter((m) => m.id !== employee.id)
                        .map((mgr) => (
                          <option key={mgr.id} value={mgr.id}>
                            {mgr.full_name || "Unnamed"} {mgr.designation ? `(${mgr.designation})` : ""}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                      Role Assignment
                    </label>
                    <select
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value as "admin" | "manager" | "employee")
                      }
                      className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Read-Only Details Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] block">Full Name</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {employee.full_name || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] block">Phone Number</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {employee.phone || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] block">Department</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {employee.department || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] block">Designation</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {employee.designation || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] block">Date of Joining</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {employee.date_of_joining
                        ? format(new Date(employee.date_of_joining), "MMMM d, yyyy")
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] block">
                      Reporting Manager
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {employee.reporting_manager?.full_name || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-[var(--color-text-muted)] block">Role</span>
                    <span className="capitalize font-semibold text-[var(--color-brand)]">
                      {employee.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Danger & Account Actions Zone */}
        {isAdmin && !isSelf && (
          <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Shield size={16} className="text-[var(--color-brand)]" />
              Account Management
            </h3>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Resend Invite — only shown for pending invite status */}
              {!isConfirmed && employee.is_active && (
                <button
                  onClick={handleResendInvite}
                  disabled={isResendingInvite}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isResendingInvite ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} className="text-[var(--color-brand)]" />
                  )}
                  <span>Resend Invite Link</span>
                </button>
              )}

              {/* Deactivate or Reactivate */}
              {employee.is_active ? (
                <button
                  onClick={handleDeactivate}
                  disabled={isDeactivating}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-[var(--color-warning)] bg-[var(--color-warning-subtle)]/40 border border-[var(--color-warning)]/30 hover:bg-[var(--color-warning-subtle)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeactivating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserX size={14} />
                  )}
                  <span>Deactivate Employee</span>
                </button>
              ) : (
                <button
                  onClick={handleReactivate}
                  disabled={isReactivating}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-[var(--color-success)] bg-[var(--color-success-subtle)]/40 border border-[var(--color-success)]/30 hover:bg-[var(--color-success-subtle)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isReactivating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  <span>Reactivate Employee</span>
                </button>
              )}

              {/* Delete Employee */}
              <button
                onClick={handleDeletePermanent}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 transition-colors disabled:opacity-50 cursor-pointer ml-auto"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>Delete Employee</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
