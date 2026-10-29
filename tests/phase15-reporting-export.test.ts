// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  sanitizeForFormulaInjection,
  sanitizeCsvCell,
  buildCsvContent,
  buildExcelXmlContent,
  buildPrintHtmlContent,
  formatExportFilename,
} from "@/lib/export-utils";
import {
  generateReportData,
  exportReport,
  ReportType,
  ExportCallerOverride,
} from "@/actions/export";

describe("Phase 15: Authorized Enterprise Reporting & Multi-Format Export Engine", () => {
  let adminUser: ExportCallerOverride;
  let manager1: ExportCallerOverride;
  let manager2: ExportCallerOverride;
  let recruiter1: ExportCallerOverride;
  let recruiter2: ExportCallerOverride;
  let client1: { id: string; name: string; code: string };
  let client2: { id: string; name: string; code: string };

  const PASSWORD = "Password123!";

  beforeAll(async () => {
    // 1. Cleanup old test data
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.candidateStageHistory.deleteMany();
    await prisma.jobCandidate.deleteMany();
    await prisma.scheduledInterview.deleteMany();
    await prisma.recruiterChecklist.deleteMany();
    await prisma.targetConfig.deleteMany();

    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["P15-REC-01", "P15-REC-02"] } },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p15_admin@e2epvtltd.com",
            "p15_mgr1@e2epvtltd.com",
            "p15_mgr2@e2epvtltd.com",
            "p15_rec1@e2epvtltd.com",
            "p15_rec2@e2epvtltd.com",
          ],
        },
      },
    });

    await prisma.clientRequirement.deleteMany();
    await prisma.clientMaster.deleteMany({
      where: { code: { in: ["P15-CLI-01", "P15-CLI-02"] } },
    });

    const passwordHash = await hashPassword(PASSWORD);

    // 2. Create Admin
    const admin = await prisma.user.create({
      data: {
        email: "p15_admin@e2epvtltd.com",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        name: "P15 Executive Admin",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: admin.role };

    // 3. Create Managers
    const mgr1 = await prisma.user.create({
      data: {
        email: "p15_mgr1@e2epvtltd.com",
        passwordHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "P15 Team Lead Alpha",
      },
    });
    manager1 = { id: mgr1.id, email: mgr1.email, role: mgr1.role };

    const mgr2 = await prisma.user.create({
      data: {
        email: "p15_mgr2@e2epvtltd.com",
        passwordHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "P15 Team Lead Beta",
      },
    });
    manager2 = { id: mgr2.id, email: mgr2.email, role: mgr2.role };

    // 4. Create Recruiters (Candidate Profiles)
    const rec1User = await prisma.user.create({
      data: {
        email: "p15_rec1@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        name: "P15 Recruiter Alpha",
      },
    });
    const profile1 = await prisma.candidateProfile.create({
      data: {
        userId: rec1User.id,
        candidateId: "P15-REC-01",
        fullName: "P15 Recruiter Alpha",
        phone: "9876543201",
        joiningDate: new Date(),
        isCertified: true,
        managerId: mgr1.id, // assigned to Manager 1
      },
    });
    recruiter1 = {
      id: rec1User.id,
      email: rec1User.email,
      role: rec1User.role,
      profileId: profile1.id,
    };

    const rec2User = await prisma.user.create({
      data: {
        email: "p15_rec2@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        name: "P15 Recruiter Beta",
      },
    });
    const profile2 = await prisma.candidateProfile.create({
      data: {
        userId: rec2User.id,
        candidateId: "P15-REC-02",
        fullName: "P15 Recruiter Beta",
        phone: "9876543202",
        joiningDate: new Date(),
        isCertified: true,
        managerId: mgr2.id, // assigned to Manager 2
      },
    });
    recruiter2 = {
      id: rec2User.id,
      email: rec2User.email,
      role: rec2User.role,
      profileId: profile2.id,
    };

    // 5. Create Clients & Requirements
    const c1 = await prisma.clientMaster.create({
      data: {
        name: "P15 Apex Tech Solutions",
        code: "P15-CLI-01",
        status: "ACTIVE",
        notes: "Key enterprise account",
      },
    });
    client1 = { id: c1.id, name: c1.name, code: c1.code };

    await prisma.clientRequirement.create({
      data: {
        clientId: c1.id,
        clientName: c1.name,
        jobTitle: "Senior Fullstack Engineer",
        location: "Bengaluru",
        openPositions: 4,
        status: "ACTIVE",
      },
    });

    const c2 = await prisma.clientMaster.create({
      data: {
        name: "P15 Vertex Innovations",
        code: "P15-CLI-02",
        status: "ACTIVE",
        notes: "Startup scaleup partner",
      },
    });
    client2 = { id: c2.id, name: c2.name, code: c2.code };

    // 6. Create Daily Reports for Recruiter 1
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const report1 = await prisma.dailyReport.create({
      data: {
        recruiterProfileId: profile1.id,
        reportDate: today,
        callsMade: 50,
        ownLeads: 20,
        internalLeads: 30,
        profilesSubmitted: 15,
        shortlisted: 10,
        interviewsScheduled: 6,
        interviewsAttended: 5,
        offersExtended: 3,
        joinings: 2,
        absconded: 0,
        status: "APPROVED",
        submittedAt: new Date(),
        approvedAt: new Date(),
        clientBreakdowns: {
          create: [
            {
              clientId: c1.id,
              clientName: c1.name,
              calls: 30,
              shortlisted: 6,
              lineUp: 4,
              offered: 2,
              joined: 1,
            },
            {
              clientId: c2.id,
              clientName: c2.name,
              calls: 20,
              shortlisted: 4,
              lineUp: 2,
              offered: 1,
              joined: 1,
            },
          ],
        },
      },
    });

    // 7. Create Daily Report for Recruiter 2
    await prisma.dailyReport.create({
      data: {
        recruiterProfileId: profile2.id,
        reportDate: today,
        callsMade: 40,
        ownLeads: 15,
        internalLeads: 25,
        profilesSubmitted: 12,
        shortlisted: 8,
        interviewsScheduled: 4,
        interviewsAttended: 3,
        offersExtended: 1,
        joinings: 1,
        absconded: 0,
        status: "APPROVED",
        submittedAt: new Date(),
        approvedAt: new Date(),
        clientBreakdowns: {
          create: [
            {
              clientId: c1.id,
              clientName: c1.name,
              calls: 40,
              shortlisted: 8,
              lineUp: 4,
              offered: 1,
              joined: 1,
            },
          ],
        },
      },
    });

    // 8. Create Target Configurations
    await prisma.targetConfig.create({
      data: {
        recruiterProfileId: profile1.id,
        periodType: "MONTHLY",
        periodKey: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        callsTarget: 600,
        shortlistTarget: 80,
        interviewsTarget: 30,
        offersTarget: 10,
        joinsTarget: 5,
        configuredByAdminId: admin.id,
      },
    });

    await prisma.targetConfig.create({
      data: {
        recruiterProfileId: null, // Org Target
        periodType: "MONTHLY",
        periodKey: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        orgMonthlyJoinsTarget: 15,
        configuredByAdminId: admin.id,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.targetConfig.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["P15-REC-01", "P15-REC-02"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p15_admin@e2epvtltd.com",
            "p15_mgr1@e2epvtltd.com",
            "p15_mgr2@e2epvtltd.com",
            "p15_rec1@e2epvtltd.com",
            "p15_rec2@e2epvtltd.com",
          ],
        },
      },
    });
    await prisma.clientRequirement.deleteMany();
    await prisma.clientMaster.deleteMany({
      where: { code: { in: ["P15-CLI-01", "P15-CLI-02"] } },
    });
  });

  // ========================================================
  // 1. SPREADSHEET FORMULA INJECTION & CSV SANITIZATION
  // ========================================================
  describe("Security: Formula Injection Mitigation & RFC 4180 CSV Rules", () => {
    it("escapes dangerous formula prefixes with single quote", () => {
      expect(sanitizeForFormulaInjection("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeForFormulaInjection("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
      expect(sanitizeForFormulaInjection("-100")).toBe("'-100");
      expect(sanitizeForFormulaInjection("@HYPERLINK('http://evil.com')")).toBe("'@HYPERLINK('http://evil.com')");
      expect(sanitizeForFormulaInjection("\tMALICIOUS")).toBe("'\tMALICIOUS");
      expect(sanitizeForFormulaInjection("\rATTACK")).toBe("'\rATTACK");
      expect(sanitizeForFormulaInjection("  =PAYLOAD")).toBe("'  =PAYLOAD");
    });

    it("leaves safe text and numbers untampered", () => {
      expect(sanitizeForFormulaInjection("Aditya Sharma")).toBe("Aditya Sharma");
      expect(sanitizeForFormulaInjection(42)).toBe("42");
      expect(sanitizeForFormulaInjection("2026-10-15")).toBe("2026-10-15");
      expect(sanitizeForFormulaInjection(null)).toBe("");
      expect(sanitizeForFormulaInjection(undefined)).toBe("");
    });

    it("sanitizes CSV cells with quotes and commas according to RFC 4180", () => {
      expect(sanitizeCsvCell('Hello "World"')).toBe('"Hello ""World"""');
      expect(sanitizeCsvCell("Engineering, Product")).toBe('"Engineering, Product"');
      expect(sanitizeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
      expect(sanitizeCsvCell("=1+1")).toBe("'=1+1");
      expect(sanitizeCsvCell("=SUM(A1, B1)")).toBe('"\'=SUM(A1, B1)"');
    });

    it("builds CSV content with UTF-8 BOM for Excel compatibility", () => {
      const columns = [
        { header: "Recruiter", key: "name" },
        { header: "Calls", key: "calls" },
      ];
      const rows = [
        { name: "Alpha", calls: 50 },
        { name: "Beta, Tech", calls: 40 },
      ];

      const csv = buildCsvContent(columns, rows);
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("Recruiter,Calls");
      expect(csv).toContain('Alpha,50\r\n"Beta, Tech",40');
    });
  });

  // ========================================================
  // 2. EXCEL XML SPREADSHEET (SpreadsheetML) GENERATION
  // ========================================================
  describe("Excel XML SpreadsheetML Universal Compatibility", () => {
    it("generates valid XML structure with styled corporate headers", () => {
      const columns = [
        { header: "Report Date", key: "date", width: 100 },
        { header: "Recruiter", key: "recruiter", width: 140 },
        { header: "Calls", key: "calls", type: "number" as const, width: 80 },
      ];
      const rows = [
        { date: "2026-10-15", recruiter: "John & Jane <Tech>", calls: 50 },
        { date: "2026-10-16", recruiter: "=SUM(1+1)", calls: 30 },
      ];

      const xml = buildExcelXmlContent("Daily Operations", columns, rows);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<?mso-application progid="Excel.Sheet"?>');
      expect(xml).toContain('xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
      expect(xml).toContain('<Style ss:ID="HeaderStyle">');
      expect(xml).toContain('ss:Color="#002D62"'); // Corporate Navy
      expect(xml).toContain('<Worksheet ss:Name="Daily Operations">');
      expect(xml).toContain('John &amp; Jane &lt;Tech&gt;'); // XML entities escaped
      expect(xml).toContain('&apos;=SUM(1+1)'); // Formula injection defended
      expect(xml).toContain('<Data ss:Type="Number">50</Data>');
    });
  });

  // ========================================================
  // 3. PRINT / PDF LAYOUT GENERATION
  // ========================================================
  describe("Print / PDF View Layout Generation", () => {
    it("generates corporate branded HTML with @media print stylesheet", () => {
      const columns = [
        { header: "Candidate", key: "candidate" },
        { header: "Status", key: "status" },
      ];
      const rows = [{ candidate: "John Doe", status: "APPROVED" }];

      const html = buildPrintHtmlContent(
        "Certified Recruiter Performance",
        "Executive operational breakdown",
        columns,
        rows,
        {
          generatedBy: "admin@e2epvtltd.com",
          filterSummary: "Team Alpha Only",
          totalRecords: 1,
        }
      );

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("@media print");
      expect(html).toContain("E2E PROCUREMENT PVT LTD");
      expect(html).toContain("U78300KA2025PTC204064");
      expect(html).toContain("Certified Recruiter Performance");
      expect(html).toContain("admin@e2epvtltd.com");
      expect(html).toContain("Team Alpha Only");
      expect(html).toContain("John Doe");
      expect(html).toContain("APPROVED");
    });

    it("generates structured export filenames with date stamps", () => {
      const fnCsv = formatExportFilename("DAILY_REPORTS", "csv");
      expect(fnCsv).toMatch(/^E2E_daily_reports_\d{4}-\d{2}-\d{2}\.csv$/i);

      const fnXls = formatExportFilename("RECRUITER_PERFORMANCE", "xls");
      expect(fnXls).toMatch(/^E2E_recruiter_performance_\d{4}-\d{2}-\d{2}\.xls$/i);

      const fnHtml = formatExportFilename("RECRUITMENT_FUNNEL", "html");
      expect(fnHtml).toMatch(/^E2E_recruitment_funnel_\d{4}-\d{2}-\d{2}\.html$/i);
    });
  });

  // ========================================================
  // 4. ROW-LEVEL PERMISSIONS ENFORCEMENT
  // ========================================================
  describe("Row-Level Access Control & Permission Enforcement", () => {
    it("allows recruiter to export only their own daily reports and performance", async () => {
      // Recruiter 1 requesting their own daily reports
      const res = await generateReportData("DAILY_REPORTS", {}, recruiter1);
      expect(res.success).toBe(true);
      expect(res.data?.rows.length).toBe(1);
      expect(res.data?.rows[0].recruiterName).toBe("P15 Recruiter Alpha");

      // Recruiter 1 requesting their performance
      const perfRes = await generateReportData("RECRUITER_PERFORMANCE", {}, recruiter1);
      expect(perfRes.success).toBe(true);
      expect(perfRes.data?.rows.length).toBe(1);
      expect(perfRes.data?.rows[0].recruiterName).toBe("P15 Recruiter Alpha");
    });

    it("strictly blocks recruiter from accessing another recruiter's data", async () => {
      const res = await generateReportData(
        "DAILY_REPORTS",
        { recruiterProfileId: recruiter2.profileId },
        recruiter1
      );
      expect(res.success).toBe(false);
      expect(res.message).toContain("Access denied");
    });

    it("strictly blocks recruiter from accessing organization or manager reports", async () => {
      const clientRes = await generateReportData("CLIENT_REPORTS", {}, recruiter1);
      expect(clientRes.success).toBe(false);
      expect(clientRes.message).toContain("Access denied");

      const mgrRes = await generateReportData("MANAGER_REPORTS", {}, recruiter1);
      expect(mgrRes.success).toBe(false);
      expect(mgrRes.message).toContain("Access denied");

      const monthlyRes = await generateReportData("MONTHLY_REPORTS", {}, recruiter1);
      expect(monthlyRes.success).toBe(false);
      expect(monthlyRes.message).toContain("Access denied");
    });

    it("allows manager to access assigned team reports, but blocks outside recruiters", async () => {
      // Manager 1 requesting assigned team reports
      const teamRes = await generateReportData("DAILY_REPORTS", {}, manager1);
      expect(teamRes.success).toBe(true);
      expect(teamRes.data?.rows.length).toBe(1);
      expect(teamRes.data?.rows[0].recruiterName).toBe("P15 Recruiter Alpha");

      // Manager 1 explicitly filtering for assigned recruiter 1
      const okRes = await generateReportData(
        "DAILY_REPORTS",
        { recruiterProfileId: recruiter1.profileId },
        manager1
      );
      expect(okRes.success).toBe(true);

      // Manager 1 attempting to access recruiter 2 (assigned to Manager 2)
      const blockedRes = await generateReportData(
        "DAILY_REPORTS",
        { recruiterProfileId: recruiter2.profileId },
        manager1
      );
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.message).toContain("Access denied");
    });

    it("blocks manager from accessing organization-wide monthly rollup", async () => {
      const monthlyRes = await generateReportData("MONTHLY_REPORTS", {}, manager1);
      expect(monthlyRes.success).toBe(false);
      expect(monthlyRes.message).toContain("Access denied");
    });

    it("grants admin full access across all 7 reports and any filter", async () => {
      const reports: ReportType[] = [
        "DAILY_REPORTS",
        "RECRUITER_PERFORMANCE",
        "CLIENT_REPORTS",
        "MANAGER_REPORTS",
        "MONTHLY_REPORTS",
        "TARGET_REPORTS",
        "RECRUITMENT_FUNNEL",
      ];

      for (const rep of reports) {
        const res = await generateReportData(rep, {}, adminUser);
        expect(res.success).toBe(true);
        expect(res.data).toBeDefined();
        expect(res.data?.columns.length).toBeGreaterThan(0);
      }
    });
  });

  // ========================================================
  // 5. ALL 7 REPORT TYPES DATA COMPILATION ACCURACY
  // ========================================================
  describe("Report Types Data Generation & Calculations", () => {
    it("1. DAILY_REPORTS accurately compiles operational metrics and client breakdowns", async () => {
      const res = await generateReportData("DAILY_REPORTS", {}, adminUser);
      expect(res.success).toBe(true);
      expect(res.data?.rows.length).toBe(2);

      const r1 = res.data?.rows.find((r) => r.recruiterName === "P15 Recruiter Alpha");
      expect(r1).toBeDefined();
      expect(r1?.callsMade).toBe(50);
      expect(r1?.ownLeads).toBe(20);
      expect(r1?.internalLeads).toBe(30);
      expect(r1?.shortlisted).toBe(10);
      expect(r1?.lineups).toBe(6);
      expect(r1?.attended).toBe(5);
      expect(r1?.offers).toBe(3);
      expect(r1?.joined).toBe(2);
      expect(r1?.status).toBe("APPROVED");
      expect(r1?.clients).toContain("P15 Apex Tech Solutions");
    });

    it("2. RECRUITER_PERFORMANCE calculates attainment and bands accurately", async () => {
      const res = await generateReportData("RECRUITER_PERFORMANCE", {}, adminUser);
      expect(res.success).toBe(true);

      const r1 = res.data?.rows.find((r) => r.recruiterName === "P15 Recruiter Alpha");
      expect(r1).toBeDefined();
      expect(r1?.totalCalls).toBe(50);
      expect(r1?.shortlisted).toBe(10);
      expect(r1?.joined).toBe(2);
      expect(r1?.targetJoins).toBe(5);
      expect(r1?.attainmentPct).toBe(40); // 2/5 = 40%
      expect(r1?.band).toBe("Low");
      expect(r1?.manager).toBe("P15 Team Lead Alpha");
    });

    it("3. CLIENT_REPORTS aggregates client mandates, positions, and conversion rate", async () => {
      const res = await generateReportData("CLIENT_REPORTS", {}, adminUser);
      expect(res.success).toBe(true);

      const c1 = res.data?.rows.find((r) => r.code === "P15-CLI-01");
      expect(c1).toBeDefined();
      expect(c1?.totalMandates).toBe(1);
      expect(c1?.activeMandates).toBe(1);
      expect(c1?.openPositions).toBe(4);
      expect(c1?.calls).toBe(70); // 30 (from r1) + 40 (from r2)
      expect(c1?.lineups).toBe(8); // 4 + 4
      expect(c1?.joined).toBe(2); // 1 + 1
      expect(c1?.conversionPct).toBe(25); // 2/8 = 25%
    });

    it("4. MANAGER_REPORTS computes team size and supervisor attainment", async () => {
      const res = await generateReportData("MANAGER_REPORTS", {}, adminUser);
      expect(res.success).toBe(true);

      const m1 = res.data?.rows.find((r) => r.email === "p15_mgr1@e2epvtltd.com");
      expect(m1).toBeDefined();
      expect(m1?.teamSize).toBe(1);
      expect(m1?.calls).toBe(50);
      expect(m1?.shortlisted).toBe(10);
      expect(m1?.joined).toBe(2);
      expect(m1?.targetJoins).toBe(2); // 1 recruiter * 2 = 2
      expect(m1?.attainmentPct).toBe(100); // 2/2 = 100%
      expect(m1?.band).toBe("Great");
    });

    it("5. MONTHLY_REPORTS aggregates org-wide operational capacity", async () => {
      const res = await generateReportData("MONTHLY_REPORTS", {}, adminUser);
      expect(res.success).toBe(true);
      expect(res.data?.rows.length).toBe(1);

      const rollup = res.data?.rows[0];
      expect(rollup?.calls).toBe(90); // 50 + 40
      expect(rollup?.shortlisted).toBe(18); // 10 + 8
      expect(rollup?.joined).toBe(3); // 2 + 1
      expect(rollup?.targetJoins).toBe(15);
      expect(rollup?.attainmentPct).toBe(20); // 3/15 = 20%
      expect(rollup?.activeRecruiters).toBeGreaterThanOrEqual(2);
    });

    it("6. TARGET_REPORTS lists configured individual and org targets", async () => {
      const res = await generateReportData("TARGET_REPORTS", {}, adminUser);
      expect(res.success).toBe(true);
      expect(res.data?.rows.length).toBeGreaterThanOrEqual(2);

      const orgTarget = res.data?.rows.find((r) => r.scope === "Organization Default");
      expect(orgTarget).toBeDefined();
      expect(orgTarget?.orgJoinsTarget).toBe(15);

      const recTarget = res.data?.rows.find((r) => String(r.scope).includes("P15 Recruiter Alpha"));
      expect(recTarget).toBeDefined();
      expect(recTarget?.callsTarget).toBe(600);
      expect(recTarget?.joinsTarget).toBe(5);
    });

    it("7. RECRUITMENT_FUNNEL generates 9-stage progression with drop-off percentages", async () => {
      const res = await generateReportData("RECRUITMENT_FUNNEL", {}, adminUser);
      expect(res.success).toBe(true);
      expect(res.data?.rows.length).toBe(9);

      const stages = res.data?.rows;
      expect(stages?.[0].stageName).toBe("Calls");
      expect(stages?.[0].count).toBe(90);
      expect(stages?.[0].stepConversion).toBe(100);

      expect(stages?.[1].stageName).toBe("Interested");
      expect(stages?.[1].count).toBe(36); // max(27 screened, round(90 calls * 0.4))

      expect(stages?.[2].stageName).toBe("Screened");
      expect(stages?.[2].count).toBe(27); // 15 + 12 profiles submitted

      expect(stages?.[3].stageName).toBe("Shortlisted");
      expect(stages?.[3].count).toBe(18);

      expect(stages?.[4].stageName).toBe("Interview Scheduled");
      expect(stages?.[4].count).toBe(10);

      expect(stages?.[5].stageName).toBe("Interview Attended");
      expect(stages?.[5].count).toBe(8);

      expect(stages?.[6].stageName).toBe("Offered");
      expect(stages?.[6].count).toBe(4);

      expect(stages?.[7].stageName).toBe("Offer Accepted");
      expect(stages?.[7].count).toBe(3);

      expect(stages?.[8].stageName).toBe("Joined");
      expect(stages?.[8].count).toBe(3);
    });
  });

  // ========================================================
  // 6. SORTING, PAGINATION, AND EXPORT CONSISTENCY
  // ========================================================
  describe("Sorting, Pagination & Export Consistency", () => {
    it("sorts rows ascending and descending by specified key", async () => {
      // Sort DAILY_REPORTS by callsMade ascending
      const ascRes = await generateReportData(
        "DAILY_REPORTS",
        { sortBy: "callsMade", sortDirection: "asc" },
        adminUser
      );
      expect(ascRes.data?.rows[0].callsMade).toBe(40);
      expect(ascRes.data?.rows[1].callsMade).toBe(50);

      // Sort DAILY_REPORTS by callsMade descending
      const descRes = await generateReportData(
        "DAILY_REPORTS",
        { sortBy: "callsMade", sortDirection: "desc" },
        adminUser
      );
      expect(descRes.data?.rows[0].callsMade).toBe(50);
      expect(descRes.data?.rows[1].callsMade).toBe(40);
    });

    it("paginates table rows without distorting totalRecords", async () => {
      const pageRes = await generateReportData(
        "DAILY_REPORTS",
        { page: 1, pageSize: 1 },
        adminUser
      );
      expect(pageRes.data?.rows.length).toBe(1);
      expect(pageRes.data?.totalRecords).toBe(2);
      expect(pageRes.data?.totalPages).toBe(2);
      expect(pageRes.data?.page).toBe(1);
      expect(pageRes.data?.pageSize).toBe(1);
    });

    it("exportReport outputs full dataset ignoring UI page limits", async () => {
      const exportRes = await exportReport(
        "DAILY_REPORTS",
        "csv",
        { page: 1, pageSize: 1 }, // UI requested page 1 of 1
        adminUser
      );
      expect(exportRes.success).toBe(true);
      expect(exportRes.data?.content).toContain("P15 Recruiter Alpha");
      expect(exportRes.data?.content).toContain("P15 Recruiter Beta"); // Both recruiters present!
    });
  });

  // ========================================================
  // 7. DATA PRIVACY & SENSITIVE CREDENTIAL EXCLUSION
  // ========================================================
  describe("PII & Secret Protection", () => {
    it("never includes password hashes, salt, or auth tokens in report rows or exports", async () => {
      const res = await generateReportData("RECRUITER_PERFORMANCE", {}, adminUser);
      const csvRes = await exportReport("RECRUITER_PERFORMANCE", "csv", {}, adminUser);
      const xmlRes = await exportReport("RECRUITER_PERFORMANCE", "excel", {}, adminUser);
      const printRes = await exportReport("RECRUITER_PERFORMANCE", "print", {}, adminUser);

      // Check rows
      for (const row of res.data?.rows || []) {
        expect(row.passwordHash).toBeUndefined();
        expect(row.password).toBeUndefined();
        expect(row.token).toBeUndefined();
        expect(row.resetToken).toBeUndefined();
      }

      // Check exported string contents
      expect(csvRes.data?.content).not.toContain("passwordHash");
      expect(csvRes.data?.content).not.toContain(PASSWORD);

      expect(xmlRes.data?.content).not.toContain("passwordHash");
      expect(xmlRes.data?.content).not.toContain(PASSWORD);

      expect(printRes.data?.content).not.toContain("passwordHash");
      expect(printRes.data?.content).not.toContain(PASSWORD);
    });
  });
});
