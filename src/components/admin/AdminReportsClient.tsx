"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ReportType,
  ExportFormat,
  GeneratedReportResult,
  ReportFilterInput,
  generateReportData,
  exportReport,
} from "@/actions/export";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Building2,
  Target,
  TrendingUp,
  BarChart3,
  Layers,
  CalendarDays,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface AdminReportsClientProps {
  initialReportData: GeneratedReportResult;
  recruitersList: Array<{ id: string; fullName: string; candidateId: string }>;
  managersList: Array<{ id: string; name: string | null; email: string }>;
  clientsList: Array<{ id: string; name: string; code: string }>;
}

const REPORT_TABS: Array<{ type: ReportType; label: string; icon: React.ElementType }> = [
  { type: "DAILY_REPORTS", label: "Daily Operations", icon: FileText },
  { type: "RECRUITER_PERFORMANCE", label: "Recruiter Performance", icon: Users },
  { type: "CLIENT_REPORTS", label: "Client Mandates", icon: Building2 },
  { type: "MANAGER_REPORTS", label: "Manager & Team", icon: ShieldCheck },
  { type: "MONTHLY_REPORTS", label: "Monthly Rollup", icon: CalendarDays },
  { type: "TARGET_REPORTS", label: "Target Benchmarks", icon: Target },
  { type: "RECRUITMENT_FUNNEL", label: "Funnel Velocity", icon: TrendingUp },
];

export function AdminReportsClient({
  initialReportData,
  recruitersList,
  managersList,
  clientsList,
}: AdminReportsClientProps) {
  const [currentReportType, setCurrentReportType] = useState<ReportType>(
    initialReportData.reportType
  );
  const [reportData, setReportData] = useState<GeneratedReportResult>(initialReportData);

  // Filters State
  const [dateRange, setDateRange] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("");
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const [isPending, startTransition] = useTransition();
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to trigger report refresh
  const fetchReport = (
    nextType = currentReportType,
    nextFilters?: Partial<ReportFilterInput>
  ) => {
    setErrorMessage(null);
    startTransition(async () => {
      const activeFilters: ReportFilterInput = {
        dateRange: (nextFilters?.dateRange ?? dateRange) as any,
        startDate: (nextFilters?.startDate ?? startDate) || undefined,
        endDate: (nextFilters?.endDate ?? endDate) || undefined,
        recruiterProfileId: (nextFilters?.recruiterProfileId ?? selectedRecruiter) || undefined,
        managerId: (nextFilters?.managerId ?? selectedManager) || undefined,
        clientId: (nextFilters?.clientId ?? selectedClient) || undefined,
        status: (nextFilters?.status ?? selectedStatus) || undefined,
        sortBy: nextFilters?.sortBy ?? sortBy,
        sortDirection: nextFilters?.sortDirection ?? sortDirection,
        page: nextFilters?.page ?? page,
        pageSize: nextFilters?.pageSize ?? pageSize,
      };

      const res = await generateReportData(nextType, activeFilters);
      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        setErrorMessage(res.message || "Failed to load report data.");
      }
    });
  };

  // Tab switch
  const handleTabChange = (newType: ReportType) => {
    setCurrentReportType(newType);
    setPage(1);
    setSortBy(undefined);
    fetchReport(newType, { page: 1, sortBy: undefined });
  };

  // Sort click
  const handleSort = (columnKey: string) => {
    let nextDir: "asc" | "desc" = "asc";
    if (sortBy === columnKey) {
      nextDir = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortBy(columnKey);
    setSortDirection(nextDir);
    fetchReport(currentReportType, { sortBy: columnKey, sortDirection: nextDir, page: 1 });
  };

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchReport(currentReportType, { page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    fetchReport(currentReportType, { pageSize: newSize, page: 1 });
  };

  // Filter application
  const handleApplyFilter = () => {
    setPage(1);
    fetchReport(currentReportType, { page: 1 });
  };

  const handleResetFilters = () => {
    setDateRange("all");
    setStartDate("");
    setEndDate("");
    setSelectedRecruiter("");
    setSelectedManager("");
    setSelectedClient("");
    setSelectedStatus("ALL");
    setSortBy(undefined);
    setPage(1);
    fetchReport(currentReportType, {
      dateRange: "all",
      startDate: undefined,
      endDate: undefined,
      recruiterProfileId: undefined,
      managerId: undefined,
      clientId: undefined,
      status: "ALL",
      sortBy: undefined,
      page: 1,
    });
  };

  // Export File Handlers
  const handleExport = async (format: ExportFormat) => {
    if (format === "print") {
      // Open in print-friendly view
      const query = new URLSearchParams({
        reportType: currentReportType,
        format: "print",
        ...(dateRange !== "all" ? { dateRange } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(selectedRecruiter ? { recruiterProfileId: selectedRecruiter } : {}),
        ...(selectedManager ? { managerId: selectedManager } : {}),
        ...(selectedClient ? { clientId: selectedClient } : {}),
        ...(selectedStatus !== "ALL" ? { status: selectedStatus } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortDirection ? { sortDirection } : {}),
      });
      window.open(`/api/export?${query.toString()}`, "_blank");
      return;
    }

    try {
      setExportingFormat(format);
      const activeFilters: ReportFilterInput = {
        dateRange: dateRange as any,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        recruiterProfileId: selectedRecruiter || undefined,
        managerId: selectedManager || undefined,
        clientId: selectedClient || undefined,
        status: selectedStatus || undefined,
        sortBy,
        sortDirection,
      };

      const res = await exportReport(currentReportType, format, activeFilters);
      if (res.success && res.data) {
        const { filename, mimeType, content } = res.data;
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert(res.message || "Failed to generate export file.");
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("An unexpected error occurred during export.");
    } finally {
      setExportingFormat(null);
    }
  };

  const totalPages = reportData.totalPages || Math.ceil(reportData.totalRecords / pageSize) || 1;
  const startRecord = reportData.totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, reportData.totalRecords);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-navy-50 text-navy-800 rounded-lg">
              <BarChart3 className="w-5 h-5 text-navy-700" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-navy-950">Reporting & Export Center</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized operational exports, performance metrics, and compliance audits
              </p>
            </div>
          </div>
        </div>

        {/* Global Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={exportingFormat !== null || reportData.totalRecords === 0}
            className="text-xs font-semibold flex items-center gap-1.5 bg-white shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            {exportingFormat === "csv" ? "Exporting..." : "Export CSV"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={exportingFormat !== null || reportData.totalRecords === 0}
            className="text-xs font-semibold flex items-center gap-1.5 bg-white shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            {exportingFormat === "excel" ? "Exporting..." : "Export Excel"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport("print")}
            disabled={reportData.totalRecords === 0}
            className="text-xs font-semibold flex items-center gap-1.5 bg-white shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-navy-600" />
            Print / PDF
          </Button>

          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs ml-1"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentReportType === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => handleTabChange(tab.type)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-navy-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-navy-950 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-950">
            <Filter className="w-3.5 h-3.5 text-cyan-600" />
            <span>Filter Parameters</span>
            {isPending && (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-600 animate-spin ml-2" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
            <Button
              size="sm"
              onClick={handleApplyFilter}
              disabled={isPending}
              className="text-xs px-3 py-1 bg-cyan-700 hover:bg-cyan-800 text-white"
            >
              Apply
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Date Range Preset */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Date Preset
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
            >
              <option value="all">All Available Records</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateRange === "custom" ? (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
                />
              </div>
            </>
          ) : (
            <>
              {/* Recruiter Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Recruiter
                </label>
                <select
                  value={selectedRecruiter}
                  onChange={(e) => setSelectedRecruiter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white truncate"
                >
                  <option value="">All Recruiters</option>
                  {recruitersList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} ({r.candidateId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Manager Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Manager
                </label>
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white truncate"
                >
                  <option value="">All Managers</option>
                  {managersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.email}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Client Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Client Account
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white truncate"
            >
              <option value="">All Clients</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (where applicable) */}
          {currentReportType === "DAILY_REPORTS" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Report Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="RETURNED">Returned</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Current Report Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-navy-950">{reportData.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{reportData.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="text-[10px] bg-white font-mono">
            {reportData.filterSummary}
          </Badge>
          <Badge variant="default" className="text-[10px] bg-navy-900 text-white font-mono">
            {reportData.totalRecords} Records
          </Badge>
        </div>
      </div>

      {/* Data Table Card */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        {reportData.rows.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-slate-300" />}
            title="No Records Found"
            description="No data points match your filter criteria. Try adjusting date presets or clearing active filters."
          />
        ) : (
          <div className="relative">
            {isPending && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <RefreshCw className="w-6 h-6 text-navy-700 animate-spin" />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    {reportData.columns.map((col) => {
                      const isSorted = sortBy === col.key;
                      return (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors ${
                            col.type === "number" ? "text-right" : "text-left"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 ${
                              col.type === "number" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span>{col.header}</span>
                            {isSorted ? (
                              sortDirection === "asc" ? (
                                <ArrowUp className="w-3 h-3 text-cyan-600" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-cyan-600" />
                              )
                            ) : (
                              <ArrowUpDown className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      {reportData.columns.map((col) => {
                        const val = row[col.key];

                        // Status Badge
                        if (col.key === "status" && typeof val === "string") {
                          const badgeVariants: Record<string, "success" | "warning" | "danger" | "default"> = {
                            APPROVED: "success",
                            ACTIVE: "success",
                            SUBMITTED: "warning",
                            RETURNED: "danger",
                            INACTIVE: "danger",
                            DRAFT: "default",
                          };
                          return (
                            <td key={col.key} className="px-4 py-3">
                              <Badge
                                variant={badgeVariants[val] || "default"}
                                className="text-[10px] font-semibold"
                              >
                                {val}
                              </Badge>
                            </td>
                          );
                        }

                        // Achievement Band Badge
                        if (col.key === "band" && typeof val === "string") {
                          const color =
                            val === "EXCEEDED"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : val === "ACHIEVED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : val === "ON_TRACK"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : val === "NEEDS_IMPROVEMENT"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-red-100 text-red-800 border-red-200";

                          return (
                            <td key={col.key} className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}
                              >
                                {val.replace(/_/g, " ")}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={col.key}
                            className={`px-4 py-3 text-slate-700 ${
                              col.type === "number" ? "text-right font-mono" : "text-left"
                            }`}
                          >
                            {val !== null && val !== undefined ? String(val) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-navy-950">{startRecord}</strong> to{" "}
                  <strong className="text-navy-950">{endRecord}</strong> of{" "}
                  <strong className="text-navy-950">{reportData.totalRecords}</strong> entries
                </span>

                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] text-slate-400">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="rounded border border-slate-200 py-0.5 px-1.5 text-xs bg-white text-slate-800 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isPending}
                  className="px-2 py-1 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                  Prev
                </Button>

                <span className="px-2.5 py-1 text-xs font-semibold text-navy-900 bg-white border border-slate-200 rounded">
                  {page} / {totalPages}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isPending}
                  className="px-2 py-1 text-xs"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
