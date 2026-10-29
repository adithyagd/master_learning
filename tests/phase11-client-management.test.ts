// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  createClient,
  updateClient,
  toggleClientStatus,
  getClients,
  getActiveClients,
  getClientDetails,
  getClientPerformance,
  createClientRequirement,
} from "@/actions/client";
import { submitDailyReportAction } from "@/actions/report";

describe("Phase 11: Admin Client Management & Client Master", () => {
  let adminUser: { id: string; email: string; role: string; name: string };
  let candidateUser: { id: string; profileId: string; email: string; isCertified: boolean; role: string };

  const TEST_CLIENT_CODE_1 = "P11-TEST-BOSCH";
  const TEST_CLIENT_CODE_2 = "P11-TEST-TATA";
  const TEST_CLIENT_CODE_3 = "P11-TEST-INFY";

  beforeAll(async () => {
    // 1. Clean up existing test records
    await prisma.dailyReportClientBreakdown.deleteMany({
      where: {
        clientName: {
          in: ["P11 Bosch India", "P11 Tata Motors", "P11 Infosys Tech", "P11 Conflict Corp"],
        },
      },
    });
    await prisma.scheduledInterview.deleteMany({
      where: {
        clientName: {
          in: ["P11 Bosch India", "P11 Tata Motors", "P11 Infosys Tech", "P11 Conflict Corp"],
        },
      },
    });
    await prisma.jobCandidate.deleteMany({
      where: {
        clientName: {
          in: ["P11 Bosch India", "P11 Tata Motors", "P11 Infosys Tech", "P11 Conflict Corp"],
        },
      },
    });
    await prisma.clientRequirement.deleteMany({
      where: {
        clientName: {
          in: ["P11 Bosch India", "P11 Tata Motors", "P11 Infosys Tech", "P11 Conflict Corp"],
        },
      },
    });
    await prisma.clientMaster.deleteMany({
      where: {
        code: {
          in: [
            TEST_CLIENT_CODE_1,
            TEST_CLIENT_CODE_2,
            TEST_CLIENT_CODE_3,
            "P11-DUP-01",
            "P11-CODE-CONFLICT",
            "P11-EDIT-CODE",
            "P11-TEMP-CODE",
          ],
        },
      },
    });

    await prisma.candidateProfile.deleteMany({
      where: { candidateId: "P11-REC-01" },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["p11_admin@e2epvtltd.com", "p11_cand@e2epvtltd.com"],
        },
      },
    });

    const passHash = await hashPassword("SecurePass123!");

    // 2. Provision Admin User
    const admin = await prisma.user.create({
      data: {
        email: "p11_admin@e2epvtltd.com",
        passwordHash: passHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: "ADMIN", name: "E2E Lead Admin" };

    // 3. Provision Certified Candidate
    const candUser = await prisma.user.create({
      data: {
        email: "p11_cand@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const candProf = await prisma.candidateProfile.create({
      data: {
        userId: candUser.id,
        candidateId: "P11-REC-01",
        fullName: "P11 Recruiter Candidate",
        isCertified: true,
        certificateStatus: "ISSUED",
        academyStatus: "COMPLETED",
        joiningDate: new Date(),
      },
    });
    candidateUser = {
      id: candUser.id,
      profileId: candProf.id,
      email: candUser.email,
      isCertified: true,
      role: "CANDIDATE",
    };
  });

  afterAll(async () => {
    // Clean up test records
    await prisma.dailyReportClientBreakdown.deleteMany({
      where: {
        clientName: {
          in: ["P11 Bosch India", "P11 Tata Motors", "P11 Infosys Tech", "P11 Conflict Corp"],
        },
      },
    });
    await prisma.scheduledInterview.deleteMany({
      where: {
        clientName: {
          in: ["P11 Bosch India", "P11 Tata Motors", "P11 Infosys Tech", "P11 Conflict Corp"],
        },
      },
    });
    await prisma.jobCandidate.deleteMany({
      where: {
        clientName: {
          in: ["P11 Bosch India", "P11 Tata Motors", "P11 Infosys Tech", "P11 Conflict Corp"],
        },
      },
    });
    await prisma.clientRequirement.deleteMany({
      where: {
        clientName: {
          in: ["P11 Bosch India", "P11 Tata Motors", "P11 Infosys Tech", "P11 Conflict Corp"],
        },
      },
    });
    await prisma.clientMaster.deleteMany({
      where: {
        code: {
          in: [
            TEST_CLIENT_CODE_1,
            TEST_CLIENT_CODE_2,
            TEST_CLIENT_CODE_3,
            "P11-DUP-01",
            "P11-CODE-CONFLICT",
            "P11-EDIT-CODE",
            "P11-TEMP-CODE",
          ],
        },
      },
    });
  });

  // =========================================================================
  // 1. Role-Based Access Control
  // =========================================================================
  describe("1. Access Control & Permission Enforcement", () => {
    it("strictly blocks unauthenticated / non-admin callers from creating clients", async () => {
      const res = await createClient(
        { name: "Unauthorized Corp", code: "P11-UNAUTH" },
        { id: "guest", email: "guest@anon.com", role: "CANDIDATE" }
      );
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Administrator privileges required/i);
    });

    it("strictly blocks candidates from editing client records", async () => {
      const res = await updateClient(
        "some-id",
        { name: "Tampered Corp" },
        { id: candidateUser.id, email: candidateUser.email, role: "CANDIDATE" }
      );
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Administrator privileges required/i);
    });

    it("strictly blocks candidates from deactivating clients", async () => {
      const res = await toggleClientStatus(
        "some-id",
        "INACTIVE",
        "Deactivation attempt",
        { id: candidateUser.id, email: candidateUser.email, role: "CANDIDATE" }
      );
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Administrator privileges required/i);
    });
  });

  // =========================================================================
  // 2. Field Validation & Client Creation
  // =========================================================================
  describe("2. Field Validation & Client Creation", () => {
    it("rejects client creation when name is missing or too short", async () => {
      const res = await createClient(
        { name: " ", code: "P11-SHORT" },
        adminUser
      );
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Client name is required/i);
    });

    it("rejects client creation when code is missing or contains invalid characters", async () => {
      const res = await createClient(
        { name: "Valid Client Name", code: "INVALID @ CODE" },
        adminUser
      );
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/only letters, numbers, hyphens/i);
    });

    it("successfully creates a client with normalized code, default ACTIVE status, and audit log", async () => {
      const res = await createClient(
        {
          name: "P11 Bosch India",
          code: "p11-test-bosch", // Lowercase - should be normalized to uppercase
          notes: "Primary engineering and mobility hiring mandate.",
        },
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.name).toBe("P11 Bosch India");
      expect(res.data?.code).toBe(TEST_CLIENT_CODE_1); // Upper-cased
      expect(res.data?.status).toBe("ACTIVE");

      // Verify in SQLite database
      const saved = await prisma.clientMaster.findUnique({
        where: { code: TEST_CLIENT_CODE_1 },
      });
      expect(saved).not.toBeNull();
      expect(saved?.notes).toBe("Primary engineering and mobility hiring mandate.");
      expect(saved?.createdAt).toBeDefined();

      // Verify Audit Log recorded
      const audit = await prisma.auditLog.findFirst({
        where: {
          targetType: "CLIENT",
          targetId: saved?.id,
          action: "CLIENT_CREATED",
        },
      });
      expect(audit).not.toBeNull();
      expect(audit?.userId).toBe(adminUser.id);
    });
  });

  // =========================================================================
  // 3. Duplicate Prevention & Conflict Handling
  // =========================================================================
  describe("3. Duplicate Prevention & Conflict Handling", () => {
    it("strictly prevents creating a client with a duplicate code (case-insensitive)", async () => {
      const res = await createClient(
        {
          name: "Another Bosch Entity",
          code: "P11-TEST-BOSCH", // Duplicate
          notes: "Duplicate attempt",
        },
        adminUser
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Client code 'P11-TEST-BOSCH' already exists/i);
    });

    it("handles name conflicts appropriately by rejecting identical client names", async () => {
      const res = await createClient(
        {
          name: "P11 Bosch India", // Exact duplicate name
          code: "P11-BOSCH-NEW",
        },
        adminUser
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/already exists with code/i);
    });
  });

  // =========================================================================
  // 4. Client Editing & Code Uniqueness
  // =========================================================================
  describe("4. Client Editing & Code Uniqueness", () => {
    let clientTataId: string;

    beforeAll(async () => {
      const res = await createClient(
        {
          name: "P11 Tata Motors",
          code: TEST_CLIENT_CODE_2,
          notes: "Automotive mandate.",
        },
        adminUser
      );
      clientTataId = res.data!.id;
    });

    it("successfully edits client name and notes", async () => {
      const res = await updateClient(
        clientTataId,
        {
          name: "P11 Tata Motors Commercial",
          notes: "Updated automotive & EV division notes.",
        },
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.name).toBe("P11 Tata Motors Commercial");

      // Verify database
      const updated = await prisma.clientMaster.findUnique({
        where: { id: clientTataId },
      });
      expect(updated?.name).toBe("P11 Tata Motors Commercial");
      expect(updated?.notes).toBe("Updated automotive & EV division notes.");

      // Verify Audit Log
      const audit = await prisma.auditLog.findFirst({
        where: {
          targetType: "CLIENT",
          targetId: clientTataId,
          action: "CLIENT_UPDATED",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(audit).not.toBeNull();
    });

    it("rejects updating code to another client's existing code", async () => {
      const res = await updateClient(
        clientTataId,
        { code: TEST_CLIENT_CODE_1 }, // Already used by Bosch
        adminUser
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/already exists/i);
    });
  });

  // =========================================================================
  // 5. Activation & Deactivation Workflow
  // =========================================================================
  describe("5. Activation & Deactivation Workflow", () => {
    let clientInfyId: string;

    beforeAll(async () => {
      const res = await createClient(
        {
          name: "P11 Infosys Tech",
          code: TEST_CLIENT_CODE_3,
          notes: "IT services and software engineering.",
        },
        adminUser
      );
      clientInfyId = res.data!.id;
    });

    it("successfully deactivates an active client and records audit log", async () => {
      const res = await toggleClientStatus(
        clientInfyId,
        "INACTIVE",
        "Mandate completed for FY2026",
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe("INACTIVE");

      const inDb = await prisma.clientMaster.findUnique({
        where: { id: clientInfyId },
      });
      expect(inDb?.status).toBe("INACTIVE");

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          targetType: "CLIENT",
          targetId: clientInfyId,
          action: "CLIENT_DEACTIVATED",
        },
      });
      expect(audit).not.toBeNull();
    });

    it("successfully reactivates a deactivated client and records audit log", async () => {
      const res = await toggleClientStatus(
        clientInfyId,
        "ACTIVE",
        "Reopened staffing partnership",
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe("ACTIVE");

      const inDb = await prisma.clientMaster.findUnique({
        where: { id: clientInfyId },
      });
      expect(inDb?.status).toBe("ACTIVE");

      const audit = await prisma.auditLog.findFirst({
        where: {
          targetType: "CLIENT",
          targetId: clientInfyId,
          action: "CLIENT_ACTIVATED",
        },
      });
      expect(audit).not.toBeNull();
    });
  });

  // =========================================================================
  // 6. Historical Data Integrity Preservation on Deactivation
  // =========================================================================
  describe("6. Historical Data Integrity Preservation on Deactivation", () => {
    let testClientId: string;
    let reqId: string;
    let candidateId: string;
    let reportId: string;

    beforeAll(async () => {
      // 1. Create client
      const clientRes = await createClient(
        {
          name: "P11 Conflict Corp",
          code: "P11-CODE-CONFLICT",
          notes: "Client for testing historical integrity.",
        },
        adminUser
      );
      testClientId = clientRes.data!.id;

      // 2. Link a requirement
      const req = await createClientRequirement(
        testClientId,
        {
          jobTitle: "Senior DevOps Engineer",
          location: "Bangalore",
          openPositions: 3,
          budgetRange: "18-24 LPA",
        },
        adminUser
      );
      reqId = req.data!.id;

      // 3. Link a candidate in pipeline
      const cand = await prisma.jobCandidate.create({
        data: {
          recruiterProfileId: candidateUser.profileId,
          fullName: "DevOps Candidate 1",
          email: "devops1@example.com",
          phone: "9876500001",
          clientId: testClientId,
          clientName: "P11 Conflict Corp",
          jobTitle: "Senior DevOps Engineer",
          pipelineStage: "INTERVIEW_SCHEDULED",
        },
      });
      candidateId = cand.id;

      // 4. Submit a daily report with client breakdown for this client
      const reportRes = await submitDailyReportAction(
        {
          reportDate: "2026-10-15",
          calls: 10,
          ownLeads: 2,
          internalLeads: 3,
          screened: 4,
          shortlisted: 2,
          interviewLineUp: 1,
          interviewAttended: 1,
          offered: 0,
          joined: 0,
          absconded: 0,
          rejected: 1,
          noResponse: 2,
          pendingFollowUps: 1,
          challenges: "JD specific skills required niche Kubernetes experience.",
          learnings: "Candidate expectations higher than budget.",
          planForTomorrow: "Target mid-sized firms.",
          clientBreakdowns: [
            {
              clientName: "P11 Conflict Corp",
              calls: 10,
              ownLeads: 2,
              internalLeads: 3,
              screened: 4,
              shortlisted: 2,
              lineUp: 1,
              offered: 0,
              joined: 0,
              absconded: 0,
            },
          ],
        },
        candidateUser
      );
      reportId = reportRes.data!.reportId;
    });

    it("preserves all requirements, candidates, and daily reports when client is deactivated", async () => {
      // Deactivate client
      const toggleRes = await toggleClientStatus(
        testClientId,
        "INACTIVE",
        "Mandate closed",
        adminUser
      );
      expect(toggleRes.success).toBe(true);

      // Verify requirement still exists and references client
      const reqInDb = await prisma.clientRequirement.findUnique({
        where: { id: reqId },
      });
      expect(reqInDb).not.toBeNull();
      expect(reqInDb?.clientName).toBe("P11 Conflict Corp");
      expect(reqInDb?.clientId).toBe(testClientId);

      // Verify candidate pipeline record still exists intact
      const candInDb = await prisma.jobCandidate.findUnique({
        where: { id: candidateId },
      });
      expect(candInDb).not.toBeNull();
      expect(candInDb?.clientName).toBe("P11 Conflict Corp");
      expect(candInDb?.pipelineStage).toBe("INTERVIEW_SCHEDULED");

      // Verify daily report client breakdown still exists intact
      const breakdownInDb = await prisma.dailyReportClientBreakdown.findFirst({
        where: { dailyReportId: reportId, clientName: "P11 Conflict Corp" },
      });
      expect(breakdownInDb).not.toBeNull();
      expect(breakdownInDb?.calls).toBe(10);
      expect(breakdownInDb?.screened).toBe(4);
    });
  });

  // =========================================================================
  // 7. Search, Filtering & Summary Stats
  // =========================================================================
  describe("7. Search, Filtering & Statistics", () => {
    it("filters clients by search term (matching name or code)", async () => {
      const res = await getClients(
        { search: "Bosch" },
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.clients.length).toBeGreaterThanOrEqual(1);
      expect(
        res.data?.clients.every(
          (c) =>
            c.name.toLowerCase().includes("bosch") ||
            c.code.toLowerCase().includes("bosch")
        )
      ).toBe(true);
    });

    it("filters clients by status (ACTIVE vs INACTIVE)", async () => {
      const activeRes = await getClients({ status: "ACTIVE" }, adminUser);
      expect(activeRes.success).toBe(true);
      expect(activeRes.data?.clients.every((c) => c.status === "ACTIVE")).toBe(true);

      const inactiveRes = await getClients({ status: "INACTIVE" }, adminUser);
      expect(inactiveRes.success).toBe(true);
      expect(inactiveRes.data?.clients.every((c) => c.status === "INACTIVE")).toBe(true);
    });

    it("getActiveClients returns only active clients for dropdowns and pickers", async () => {
      const activeList = await getActiveClients();
      expect(activeList.length).toBeGreaterThan(0);
      expect(activeList.every((c) => c.name && c.code)).toBe(true);

      // Deactivated client "P11 Conflict Corp" should NOT be in active list
      const conflictFound = activeList.find((c) => c.code === "P11-CODE-CONFLICT");
      expect(conflictFound).toBeUndefined();
    });
  });

  // =========================================================================
  // 8. Genuine Performance Calculations (Zero Fake Data)
  // =========================================================================
  describe("8. Genuine Performance Analytics", () => {
    let boschClientId: string;

    beforeAll(async () => {
      const client = await prisma.clientMaster.findUnique({
        where: { code: TEST_CLIENT_CODE_1 },
      });
      boschClientId = client!.id;

      // Add a requirement
      await createClientRequirement(
        boschClientId,
        {
          jobTitle: "Embedded Software Lead",
          location: "Bangalore",
          openPositions: 5,
          status: "ACTIVE",
        },
        adminUser
      );

      // Add recruiters in pipeline
      await prisma.jobCandidate.create({
        data: {
          recruiterProfileId: candidateUser.profileId,
          fullName: "Bosch Cand 1",
          email: "bosch1@example.com",
          phone: "9123450001",
          clientId: boschClientId,
          clientName: "P11 Bosch India",
          pipelineStage: "SHORTLISTED",
        },
      });

      await prisma.jobCandidate.create({
        data: {
          recruiterProfileId: candidateUser.profileId,
          fullName: "Bosch Cand 2",
          email: "bosch2@example.com",
          phone: "9123450002",
          clientId: boschClientId,
          clientName: "P11 Bosch India",
          pipelineStage: "JOINED",
        },
      });

      // Add an interview
      await prisma.scheduledInterview.create({
        data: {
          jobCandidateId: (await prisma.jobCandidate.findFirst({ where: { email: "bosch1@example.com" } }))!.id,
          recruiterProfileId: candidateUser.profileId,
          clientId: boschClientId,
          clientName: "P11 Bosch India",
          jobRole: "Embedded Software Lead",
          scheduledAt: new Date(),
          status: "ATTENDED",
        },
      });

      // Add report breakdown outreach
      const rep = await prisma.dailyReport.create({
        data: {
          recruiterProfileId: candidateUser.profileId,
          reportDate: new Date("2026-10-18T00:00:00.000Z"),
          status: "SUBMITTED",
          callsMade: 25,
          joinings: 1,
        },
      });

      await prisma.dailyReportClientBreakdown.create({
        data: {
          dailyReportId: rep.id,
          clientId: boschClientId,
          clientName: "P11 Bosch India",
          calls: 25,
          ownLeads: 5,
          internalLeads: 5,
          screened: 10,
          shortlisted: 4,
          lineUp: 2,
          offered: 1,
          joined: 1,
          absconded: 0,
        },
      });
    });

    it("accurately computes genuine performance metrics strictly from database records", async () => {
      const perfRes = await getClientPerformance(boschClientId, adminUser);

      expect(perfRes.success).toBe(true);
      const perf = perfRes.data!;

      // 1. Requirements metrics
      expect(perf.requirements.active).toBeGreaterThanOrEqual(1);
      expect(perf.requirements.openPositions).toBeGreaterThanOrEqual(5);

      // 2. Candidate Pipeline
      expect(perf.pipeline.totalCandidates).toBeGreaterThanOrEqual(2);
      expect(perf.pipeline.stages["SHORTLISTED"]).toBeGreaterThanOrEqual(1);
      expect(perf.pipeline.stages["JOINED"]).toBeGreaterThanOrEqual(1);

      // 3. Interviews
      expect(perf.interviews.attended).toBeGreaterThanOrEqual(1);

      // 4. Outreach Volume
      expect(perf.operationsOutreach.calls).toBeGreaterThanOrEqual(25);
      expect(perf.operationsOutreach.offered).toBeGreaterThanOrEqual(1);
      expect(perf.operationsOutreach.joined).toBeGreaterThanOrEqual(1);

      // 5. Conversion Rates
      expect(perf.conversionRates.offerToJoinPct).toBe(100); // 1 joined / 1 offered = 100%
    });

    it("returns client details with linked requirements, pipeline, and audit logs", async () => {
      const detailsRes = await getClientDetails(boschClientId, adminUser);

      expect(detailsRes.success).toBe(true);
      expect(detailsRes.data.client.name).toBe("P11 Bosch India");
      expect(detailsRes.data.client.requirements.length).toBeGreaterThanOrEqual(1);
      expect(detailsRes.data.client.jobCandidates.length).toBeGreaterThanOrEqual(2);
      expect(detailsRes.data.auditLogs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
