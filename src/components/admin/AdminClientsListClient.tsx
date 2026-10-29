"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createClient,
  updateClient,
  toggleClientStatus,
} from "@/actions/client";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  Eye,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";

export interface ClientListItem {
  id: string;
  name: string;
  code: string;
  status: string;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: {
    requirements: number;
    jobCandidates: number;
    interviews: number;
  };
  openPositions: number;
}

interface AdminClientsListClientProps {
  initialClients: ClientListItem[];
  stats: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    totalOpenPositions: number;
  };
}

export function AdminClientsListClient({
  initialClients,
  stats,
}: AdminClientsListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Create Client Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Client Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Status Notification Banner
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Filter clients client-side for immediate responsiveness
  const filteredClients = initialClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError("Client name is required and must be at least 2 characters.");
      return;
    }

    if (!formCode.trim() || formCode.trim().length < 2) {
      setFormError("Client code is required and must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      const res = await createClient({
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        notes: formNotes.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.message || "Failed to create client.");
      } else {
        setIsAddModalOpen(false);
        setFormName("");
        setFormCode("");
        setFormNotes("");
        setStatusMessage({ type: "success", text: res.message || "Client created successfully." });
        router.refresh();
      }
    });
  };

  const openEditModal = (client: ClientListItem) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditCode(client.code);
    setEditNotes(client.notes || "");
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setEditError(null);

    startTransition(async () => {
      const res = await updateClient(editingClient.id, {
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        notes: editNotes.trim() || undefined,
      });

      if (!res.success) {
        setEditError(res.message || "Failed to update client.");
      } else {
        setIsEditModalOpen(false);
        setEditingClient(null);
        setStatusMessage({ type: "success", text: res.message || "Client updated successfully." });
        router.refresh();
      }
    });
  };

  const handleToggleStatus = (client: ClientListItem) => {
    const targetStatus = client.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const actionLabel = targetStatus === "ACTIVE" ? "activate" : "deactivate";

    if (
      !confirm(
        `Are you sure you want to ${actionLabel} client '${client.name}' (${client.code})? Historical records will remain intact.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await toggleClientStatus(client.id, targetStatus);
      if (!res.success) {
        setStatusMessage({ type: "error", text: res.message || `Failed to ${actionLabel} client.` });
      } else {
        setStatusMessage({
          type: "success",
          text: res.message || `Client ${actionLabel}d successfully.`,
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-navy-50 text-navy-800 rounded-lg">
              <Building2 className="w-5 h-5 text-navy-700" />
            </span>
            <h1 className="text-2xl font-bold text-navy-950">Client Master Management</h1>
          </div>
          <p className="text-sm text-navy-600 mt-1">
            Enterprise Client Master: Add, edit, activate, deactivate, and track real recruitment performance per client.
          </p>
        </div>

        <Button
          onClick={() => {
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Status Feedback Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-navy-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-navy-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Clients</span>
              <Building2 className="w-4 h-4 text-navy-600" />
            </div>
            <div className="text-2xl font-bold text-navy-950">{stats.totalClients}</div>
            <p className="text-xs text-navy-500 mt-1">Registered in master database</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm bg-emerald-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Clients</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-950">{stats.activeClients}</div>
            <p className="text-xs text-emerald-600 mt-1">Available for requirements & reports</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-slate-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Inactive Clients</span>
              <XCircle className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.inactiveClients}</div>
            <p className="text-xs text-slate-500 mt-1">Historical data preserved</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm bg-amber-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Open Positions</span>
              <Briefcase className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950">{stats.totalOpenPositions}</div>
            <p className="text-xs text-amber-700 mt-1">Across active client mandates</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-navy-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-navy-50/50 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === tab
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-navy-50 text-navy-600 hover:bg-navy-100"
              }`}
            >
              {tab === "ALL" ? "All Clients" : tab === "ACTIVE" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Data Table */}
      <Card className="border-navy-100 shadow-sm overflow-hidden">
        {filteredClients.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-8 h-8 text-navy-400" />}
            title={searchQuery ? "No matching clients found" : "No clients registered"}
            description={
              searchQuery
                ? `No clients match '${searchQuery}'. Try another search query or clear the filter.`
                : "Create your first corporate client to start tracking client requirements and recruiter performance."
            }
            actionLabel="Add Client"
            onAction={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-navy-50/70 border-b border-navy-100 text-navy-700 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Client Name & Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Active Mandates</th>
                  <th className="py-3 px-4">Open Positions</th>
                  <th className="py-3 px-4">Pipeline Candidates</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredClients.map((client) => {
                  const isActive = client.status === "ACTIVE";
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-navy-50/40 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-navy-950 flex items-center gap-2">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
                          >
                            {client.name}
                          </Link>
                          <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase">
                            {client.code}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={isActive ? "success" : "default"}
                          className="font-medium text-xs"
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-navy-800 font-medium">
                        {client._count.requirements} mandates
                      </td>
                      <td className="py-3 px-4 text-navy-800 font-medium">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold text-xs border border-amber-200">
                          {client.openPositions} open
                        </span>
                      </td>
                      <td className="py-3 px-4 text-navy-800">
                        <span className="flex items-center gap-1 text-xs">
                          <Users className="w-3.5 h-3.5 text-navy-400" />
                          {client._count.jobCandidates} candidates
                        </span>
                      </td>
                      <td className="py-3 px-4 text-navy-500 text-xs max-w-xs truncate">
                        {client.notes || <span className="italic text-navy-400">No notes</span>}
                      </td>
                      <td className="py-3 px-4 text-navy-500 text-xs">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="p-1.5 rounded-lg text-navy-600 hover:text-navy-900 hover:bg-navy-100 transition-colors"
                            title="View Client Details & Performance"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => openEditModal(client)}
                            className="p-1.5 rounded-lg text-navy-600 hover:text-navy-900 hover:bg-navy-100 transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(client)}
                            disabled={isPending}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isActive
                                ? "text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                                : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                            }`}
                            title={isActive ? "Deactivate Client (Preserves History)" : "Activate Client"}
                          >
                            {isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Client Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Client Master"
        description="Create a persistent corporate client record for tracking requirements and recruiter performance."
        size="md"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Bosch Global, Tata Motors, Infosys"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <p className="text-[11px] text-navy-500 mt-1">Official corporate or subsidiary name.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Client Code <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. BOSCH-IND, TATA-MOT, INF-01"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              required
              className="font-mono uppercase"
            />
            <p className="text-[11px] text-navy-500 mt-1">
              Unique identifier used in system references and reporting (letters, numbers, hyphens).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Notes & Contract Terms
            </label>
            <textarea
              rows={3}
              placeholder="Operational guidelines, billing terms, key contact details or service parameters..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all text-navy-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              {isPending ? "Creating Client..." : "Create Client"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingClient(null);
        }}
        title={`Edit Client: ${editingClient?.name || ""}`}
        description="Update client name, unique code, or operational notes. Historical links will be preserved."
        size="md"
      >
        <form onSubmit={handleUpdateClient} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Client Code <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              required
              className="font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all text-navy-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingClient(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              {isPending ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
