import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportReport, ReportType, ExportFormat, ReportFilterInput } from "@/actions/export";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = (searchParams.get("reportType") || "DAILY_REPORTS") as ReportType;
    const format = (searchParams.get("format") || "csv") as ExportFormat;

    const filters: ReportFilterInput = {
      dateRange: (searchParams.get("dateRange") as any) || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      recruiterProfileId: searchParams.get("recruiterProfileId") || undefined,
      managerId: searchParams.get("managerId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      status: searchParams.get("status") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortDirection: (searchParams.get("sortDirection") as "asc" | "desc") || undefined,
    };

    const result = await exportReport(reportType, format, filters);

    if (!result.success || !result.data) {
      const status = result.message?.includes("Access denied") ? 403 : 400;
      return NextResponse.json({ error: result.message || "Export failed" }, { status });
    }

    const { filename, mimeType, content } = result.data;

    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    };

    if (format === "print") {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
    } else {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new Response(content, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("API /api/export error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while processing export." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reportType = (body.reportType || "DAILY_REPORTS") as ReportType;
    const format = (body.format || "csv") as ExportFormat;
    const filters: ReportFilterInput = body.filters || {};

    const result = await exportReport(reportType, format, filters);

    if (!result.success || !result.data) {
      const status = result.message?.includes("Access denied") ? 403 : 400;
      return NextResponse.json({ error: result.message || "Export failed" }, { status });
    }

    const { filename, mimeType, content } = result.data;

    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    };

    if (format === "print") {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
    } else {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new Response(content, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("API /api/export POST error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while processing export." },
      { status: 500 }
    );
  }
}
