"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  Briefcase,
  Plus,
  ExternalLink,
  Edit2,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ActionMenu } from "@/components/shared/ActionMenu";

export interface ClientRecord {
  id: string;
  company_id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gst_number: string | null;
  notes: string | null;
  status: "active" | "inactive";
  created_at: string;
  project_count?: number;
}

interface ClientListClientProps {
  initialClients: ClientRecord[];
  subdomain?: string;
  currentUserRole: string;
}

export default function ClientListClient({
  initialClients,
  currentUserRole,
}: ClientListClientProps): React.JSX.Element {

  const router = useRouter();
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);

  // Sync state if initialClients prop updates
  React.useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const [statusTab, setStatusTab] = useState<"active" | "all">("active");
  const [selectedClientForAction, setSelectedClientForAction] = useState<{
    client: ClientRecord;
    action: "deactivate" | "activate";
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const canManage = currentUserRole === "admin" || currentUserRole === "manager";

  // Filter clients based on status tab
  const filteredData = useMemo(() => {
    if (statusTab === "active") {
      return clients.filter((c) => c.status === "active");
    }
    return clients;
  }, [clients, statusTab]);

  async function handleToggleStatus(): Promise<void> {
    if (!selectedClientForAction) return;
    const { client, action } = selectedClientForAction;
    const newStatus = action === "deactivate" ? "inactive" : "active";

    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: action === "deactivate" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: action === "activate" ? JSON.stringify({ status: "active" }) : undefined,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to update client" }));
        alert(errorData.error || "Failed to update client");
        return;
      }

      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, status: newStatus } : c))
      );
      setSelectedClientForAction(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setIsActionLoading(false);
    }
  }

  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  async function handleDeleteClient(): Promise<void> {
    if (!clientToDelete) return;
    setIsDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}?hard=true`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to delete client" }));
        alert(errorData.error || "Failed to delete client");
        return;
      }

      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setClientToDelete(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while deleting client.");
    } finally {
      setIsDeleteLoading(false);
    }
  }

  const columns = useMemo<ColumnDef<ClientRecord>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Client Name",
        cell: ({ row }) => {
          const client = row.original;
          const isInactive = client.status === "inactive";
          return (
            <Link
              href={`/clients/${client.id}`}
              className="flex items-center gap-3 group/link py-1"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                  isInactive
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]"
                    : "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] group-hover/link:bg-[var(--color-brand)] group-hover/link:text-white"
                }`}
              >
                <Building2 size={16} />
              </div>
              <div className="min-w-0">
                <span
                  className={`font-medium block truncate text-sm transition-colors ${
                    isInactive
                      ? "text-[var(--color-text-muted)] line-through"
                      : "text-[var(--color-text-primary)] group-hover/link:text-[var(--color-brand)]"
                  }`}
                >
                  {client.name}
                </span>
                {client.gst_number && (
                  <span className="text-[11px] font-mono text-[var(--color-text-muted)] uppercase">
                    GST: {client.gst_number}
                  </span>
                )}
              </div>
            </Link>
          );
        },
      },
      {
        accessorKey: "contact_person",
        header: "Contact Person",
        cell: ({ row }) => (
          <span className="text-sm text-[var(--color-text-secondary)]">
            {row.original.contact_person || "—"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email & Phone",
        cell: ({ row }) => {
          const { email, phone } = row.original;
          if (!email && !phone) {
            return <span className="text-[var(--color-text-muted)] text-xs">—</span>;
          }
          return (
            <div className="space-y-0.5 text-xs">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail size={12} className="text-[var(--color-text-muted)] shrink-0" />
                  <span className="truncate">{email}</span>
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone size={12} className="text-[var(--color-text-muted)] shrink-0" />
                  <span>{phone}</span>
                </a>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.status === "active";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                isActive
                  ? "bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[var(--color-success)]/20"
                  : "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        accessorKey: "project_count",
        header: "Projects",
        cell: ({ row }) => {
          const count = row.original.project_count ?? 0;
          return (
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
              {count} {count === 1 ? "project" : "projects"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const client = row.original;
          const groups = [
            {
              items: [
                {
                  label: "View details",
                  icon: <ExternalLink size={14} />,
                  href: `/clients/${client.id}`,
                },
                {
                  label: "Edit client",
                  icon: <Edit2 size={14} />,
                  href: `/clients/${client.id}?edit=true`,
                  hidden: !canManage,
                },
              ],
            },
            ...(canManage
              ? [
                  {
                    items: [
                      client.status === "active"
                        ? {
                            label: "Deactivate client",
                            icon: <UserX size={14} />,
                            onClick: () =>
                              setSelectedClientForAction({ client, action: "deactivate" }),
                          }
                        : {
                            label: "Reactivate client",
                            icon: <UserCheck size={14} />,
                            onClick: () =>
                              setSelectedClientForAction({ client, action: "activate" }),
                          },
                      {
                        label: "Delete client",
                        icon: <Trash2 size={14} />,
                        variant: "danger" as const,
                        onClick: () => setClientToDelete(client),
                      },
                    ],
                  },
                ]
              : []),
          ];

          return (
            <div className="flex justify-end">
              <ActionMenu groups={groups} triggerAriaLabel="Open client options" />
            </div>
          );
        },
      },
    ],
    [canManage]
  );

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Clients"
        description="Manage clients, key contacts, and linked project engagements."
        actions={
          canManage ? (
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-all shadow-xs active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>Add Client</span>
            </Link>
          ) : undefined
        }
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {clients.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            heading="No clients yet"
            description="Add your first client to start organizing projects, managing contacts, and tracking deliverables."
            action={
              canManage ? (
                <Link
                  href="/clients/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors"
                >
                  <Plus size={16} />
                  <span>Add First Client</span>
                </Link>
              ) : undefined
            }
          />
        ) : (

        <DataTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search clients by name, contact, or GST..."
          filterComponent={
            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
              <button
                type="button"
                onClick={() => setStatusTab("active")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusTab === "active"
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] shadow-xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                Active ({clients.filter((c) => c.status === "active").length})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusTab === "all"
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] shadow-xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                All ({clients.length})
              </button>
            </div>
          }
          emptyState={
            <EmptyState
              icon={Briefcase}
              heading="No matching clients"
              description="No clients found matching the current search query or active filter."
            />
          }
          mobileCardRender={(client) => {
            const isActive = client.status === "active";
            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    <div className="w-8 h-8 rounded-md bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center shrink-0">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {client.name}
                      </h4>
                      {client.contact_person && (
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {client.contact_person}
                        </p>
                      )}
                    </div>
                  </Link>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                      isActive
                        ? "bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[var(--color-success)]/20"
                        : "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-[var(--color-text-secondary)] border-t border-[var(--color-border-subtle)] pt-2">
                  {client.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-[var(--color-text-muted)] shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-[var(--color-text-muted)] shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[var(--color-text-muted)]">
                    {client.project_count ?? 0} linked projects
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="px-2.5 py-1 rounded bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          }}
        />
      )}

      {/* Confirm Deactivate / Activate Dialog */}
      <ConfirmDialog
        isOpen={!!selectedClientForAction}
        onClose={() => setSelectedClientForAction(null)}
        onConfirm={handleToggleStatus}
        isLoading={isActionLoading}
        title={
          selectedClientForAction?.action === "deactivate"
            ? `Deactivate ${selectedClientForAction.client.name}?`
            : `Reactivate ${selectedClientForAction?.client.name}?`
        }
        description={
          selectedClientForAction?.action === "deactivate"
            ? "Deactivating this client will mark their status as inactive. Existing projects and records will be preserved."
            : "Reactivating this client will restore them to the active client directory."
        }
        confirmLabel={
          selectedClientForAction?.action === "deactivate"
            ? "Deactivate Client"
            : "Reactivate Client"
        }
        variant={selectedClientForAction?.action === "deactivate" ? "destructive" : "default"}
      />

      {/* Permanently Delete Dialog */}
      <ConfirmDialog
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteClient}
        isLoading={isDeleteLoading}
        title={`Permanently Delete ${clientToDelete?.name}?`}
        description={`Permanently deleting this client will delete all associated projects and tasks across your organization. This action cannot be undone.`}
        confirmLabel="Permanently Delete"
        variant="destructive"
      />
      </div>
    </div>
  );
}
