/**
 * Utilities for secure, sanitized enterprise data exports in CSV, Excel XML, and Print HTML.
 */

export interface ExportColumn {
  header: string;
  key: string;
  type?: "string" | "number" | "date";
  width?: number;
}

/**
 * Mitigates spreadsheet formula injection by sanitizing dangerous prefixes (=, +, -, @, \t, \r).
 */
export function sanitizeForFormulaInjection(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);

  // If starts with dangerous spreadsheet formula character, prefix with single quote
  if (str.startsWith("\t") || str.startsWith("\r")) {
    return `'${str}`;
  }

  const dangerousPrefixes = ["=", "+", "-", "@"];
  const trimmed = str.trimStart();
  if (dangerousPrefixes.some((p) => trimmed.startsWith(p))) {
    return `'${str}`;
  }

  return str;
}

/**
 * Sanitizes and escapes a single CSV cell value according to RFC 4180 with injection defense.
 */
export function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";

  // 1. Defend against formula injection
  const safeStr = sanitizeForFormulaInjection(val);

  // 2. Escape quotes and wrap if commas, newlines, or quotes exist
  if (
    safeStr.includes(",") ||
    safeStr.includes('"') ||
    safeStr.includes("\n") ||
    safeStr.includes("\r")
  ) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }

  return safeStr;
}

/**
 * Builds a standard CSV string with Excel-compatible UTF-8 BOM (\uFEFF).
 */
export function buildCsvContent(
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
): string {
  const BOM = "\uFEFF";
  const headerLine = columns.map((col) => sanitizeCsvCell(col.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => sanitizeCsvCell(row[col.key])).join(",")
  );

  return BOM + [headerLine, ...dataLines].join("\r\n");
}

/**
 * Builds a universal XML Spreadsheet 2003 (SpreadsheetML) file.
 * Opens natively in Microsoft Excel, LibreOffice Calc, and Google Sheets with formatted headers and typed cells.
 */
export function buildExcelXmlContent(
  sheetName: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
): string {
  const escapeXml = (unsafe: unknown): string => {
    if (unsafe === null || unsafe === undefined) return "";
    const str = sanitizeForFormulaInjection(unsafe);
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const cleanSheetName = sheetName.replace(/[:\\/?*\[\]]/g, "_").slice(0, 31) || "Report";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\r\n`;
  xml += `<?mso-application progid="Excel.Sheet"?>\r\n`;
  xml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\r\n`;
  xml += ` xmlns:o="urn:schemas-microsoft-com:office:office"\r\n`;
  xml += ` xmlns:x="urn:schemas-microsoft-com:office:excel"\r\n`;
  xml += ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\r\n`;
  xml += ` xmlns:html="http://www.w3.org/TR/REC-html40">\r\n`;
  xml += `  <Styles>\r\n`;
  xml += `    <Style ss:ID="Default" ss:Name="Normal">\r\n`;
  xml += `      <Alignment ss:Vertical="Center"/>\r\n`;
  xml += `      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>\r\n`;
  xml += `    </Style>\r\n`;
  xml += `    <Style ss:ID="HeaderStyle">\r\n`;
  xml += `      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\r\n`;
  xml += `      <Borders>\r\n`;
  xml += `        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>\r\n`;
  xml += `      </Borders>\r\n`;
  xml += `      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>\r\n`;
  xml += `      <Interior ss:Color="#002D62" ss:Pattern="Solid"/>\r\n`;
  xml += `    </Style>\r\n`;
  xml += `    <Style ss:ID="NumberStyle">\r\n`;
  xml += `      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>\r\n`;
  xml += `      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>\r\n`;
  xml += `    </Style>\r\n`;
  xml += `    <Style ss:ID="DateStyle">\r\n`;
  xml += `      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\r\n`;
  xml += `      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#334155"/>\r\n`;
  xml += `    </Style>\r\n`;
  xml += `  </Styles>\r\n`;

  xml += `  <Worksheet ss:Name="${escapeXml(cleanSheetName)}">\r\n`;
  xml += `    <Table>\r\n`;

  // Column definitions
  columns.forEach((col) => {
    const width = col.width || (col.type === "number" ? 90 : col.type === "date" ? 110 : 140);
    xml += `      <Column ss:Width="${width}"/>\r\n`;
  });

  // Header row
  xml += `      <Row ss:Height="26" ss:StyleID="HeaderStyle">\r\n`;
  columns.forEach((col) => {
    xml += `        <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>\r\n`;
  });
  xml += `      </Row>\r\n`;

  // Data rows
  rows.forEach((row) => {
    xml += `      <Row ss:Height="20">\r\n`;
    columns.forEach((col) => {
      const val = row[col.key];
      const isNumber = col.type === "number" && typeof val === "number" && !isNaN(val);

      if (isNumber) {
        xml += `        <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${val}</Data></Cell>\r\n`;
      } else if (col.type === "date") {
        xml += `        <Cell ss:StyleID="DateStyle"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>\r\n`;
      } else {
        xml += `        <Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>\r\n`;
      }
    });
    xml += `      </Row>\r\n`;
  });

  xml += `    </Table>\r\n`;
  xml += `  </Worksheet>\r\n`;
  xml += `</Workbook>\r\n`;

  return xml;
}

/**
 * Builds an accessible, print-optimized HTML layout for PDF generation or print dialog.
 */
export function buildPrintHtmlContent(
  title: string,
  subtitle: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  metadata: {
    generatedBy: string;
    filterSummary?: string;
    totalRecords: number;
    organizationName?: string;
  }
): string {
  const genDate = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const escapeHtml = (unsafe: unknown): string => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - E2E Procurement</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 20px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #002D62;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 800;
      color: #002D62;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .report-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 6px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .filter-badge {
      display: inline-block;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      color: #334155;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    th {
      background: #002D62;
      color: #ffffff;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.5px;
      padding: 8px 6px;
      border: 1px solid #002D62;
      text-align: left;
    }
    th.number, td.number {
      text-align: right;
    }
    th.center, td.center {
      text-align: center;
    }
    td {
      padding: 6px;
      border: 1px solid #e2e8f0;
      font-size: 10px;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .footer-bar {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #64748b;
    }
    .no-print {
      margin-bottom: 15px;
      padding: 10px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .print-btn {
      background: #002D62;
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <span>Print preview mode. Click <strong>Print / Save as PDF</strong> to generate physical document or PDF.</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header-bar">
    <div>
      <div class="brand-title">E2E PROCUREMENT PVT LTD</div>
      <div class="brand-subtitle">CIN: U78300KA2025PTC204064 &bull; Enterprise Recruiter Platform</div>
      <div class="report-title">${escapeHtml(title)}</div>
      <div class="brand-subtitle">${escapeHtml(subtitle)}</div>
    </div>
    <div class="meta-box">
      <div>Generated: <strong>${escapeHtml(genDate)}</strong></div>
      <div>Generated By: <strong>${escapeHtml(metadata.generatedBy)}</strong></div>
      <div>Total Records: <strong>${metadata.totalRecords}</strong></div>
    </div>
  </div>

  ${
    metadata.filterSummary
      ? `<div class="filter-badge">Applied Scope / Filters: <strong>${escapeHtml(metadata.filterSummary)}</strong></div>`
      : ""
  }

  <table>
    <thead>
      <tr>
        ${columns
          .map(
            (col) =>
              `<th class="${col.type === "number" ? "number" : col.type === "date" ? "center" : ""}">${escapeHtml(col.header)}</th>`
          )
          .join("")}
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? `<tr><td colspan="${columns.length}" style="text-align: center; padding: 24px; color: #64748b;">No matching operational records found.</td></tr>`
          : rows
              .map(
                (row) =>
                  `<tr>${columns
                    .map((col) => {
                      const val = row[col.key];
                      const cls = col.type === "number" ? "number" : col.type === "date" ? "center" : "";
                      return `<td class="${cls}">${escapeHtml(val)}</td>`;
                    })
                    .join("")}</tr>`
              )
              .join("")
      }
    </tbody>
  </table>

  <div class="footer-bar">
    <div>Confidential &bull; E2E Procurement Private Limited &bull; Official Operational Record</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>`;
}

/**
 * Formats standard export filename with current timestamp.
 */
export function formatExportFilename(
  reportType: string,
  extension: "csv" | "xls" | "html" | "pdf",
  suffix?: string
): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanType = reportType.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const cleanSuffix = suffix ? `_${suffix.replace(/[^a-z0-9]/g, "_")}` : "";
  return `E2E_${cleanType}${cleanSuffix}_${dateStr}.${extension}`;
}
