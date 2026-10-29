// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  getAuthenticatedRecruiter,
  checkDuplicateCandidate,
  createJobCandidate,
  updateJobCandidate,
  updateCandidateStage,
  addRecruiterNote,
  scheduleInterview,
  getRecruiterCandidates,
  getJobCandidateDetails,
  getWorkspaceDailyOverview,
  submitDailyReport,
  toggleChecklistItem,
  updateTargetsToday,
  getRecruiterInsights,
} from "@/actions/workspace";
import { PIPELINE_STAGES, PIPELINE_OUTCOMES } from "@/lib/design-system";

describe("Phase 7: Recruitment Operations Workspace", () => {
  let uncertifiedRecruiter: { id: string; profileId: string; email: string; isCertified: boolean };
  let certifiedRecruiterA: { id: string; profileId: string; email: string; isCertified: boolean };
  let certifiedRecruiterB: { id: string; profileId: string; email: string; isCertified: boolean };

  beforeAll(async () => {
    // 1. Clean up test records
    await prisma.scheduledInterview.deleteMany();
    await prisma.candidateStageHistory.deleteMany();
    await prisma.recruiterNote.deleteMany();
    await prisma.jobCandidate.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.recruiterChecklist.deleteMany();
    await prisma.recruiterTarget.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P7-UNCERT-REC", "P7-CERT-REC-A", "P7-CERT-REC-B"],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p7_uncert@e2epvtltd.com",
            "p7_rec_a@e2epvtltd.com",
            "p7_rec_b@e2epvtltd.com",
          ],
        },
      },
    });

    const passHash = await hashPassword("SecurePass123!");

    // 2. Uncertified Candidate User (No Certificate, isCertified = false)
    const uUser = await prisma.user.create({
      data: {
        email: "p7_uncert@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P7-UNCERT-REC",
            fullName: "Uncertified Trainee",
            joiningDate: new Date(),
            currentModuleNumber: 3,
            isCertified: false,
            certificateStatus: "IN_PROGRESS",
          },
        },
      },
      include: { candidateProfile: true },
    });
    uncertifiedRecruiter = {
      id: uUser.id,
      profileId: uUser.candidateProfile!.id,
      email: uUser.email,
      isCertified: false,
    };

    // 3. Certified Recruiter A
    const aUser = await prisma.user.create({
      data: {
        email: "p7_rec_a@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P7-CERT-REC-A",
            fullName: "Certified Recruiter A",
            joiningDate: new Date(),
            currentModuleNumber: 6,
            isCertified: true,
            certificateStatus: "ISSUED",
          },
        },
      },
      include: { candidateProfile: true },
    });

    await prisma.certificate.create({
      data: {
        certificateNumber: "E2E-CERT-2025-P7RECA-001",
        candidateProfileId: aUser.candidateProfile!.id,
        finalScore: 88,
        approvedByAdminId: "admin-id",
        approvedByAdminName: "admin@e2epvtltd.com",
        status: "ISSUED",
        verificationCode: "RECA-VERI-CODE-1234",
      },
    });

    certifiedRecruiterA = {
      id: aUser.id,
      profileId: aUser.candidateProfile!.id,
      email: aUser.email,
      isCertified: true,
    };

    // 4. Certified Recruiter B
    const bUser = await prisma.user.create({
      data: {
        email: "p7_rec_b@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P7-CERT-REC-B",
            fullName: "Certified Recruiter B",
            joiningDate: new Date(),
            currentModuleNumber: 6,
            isCertified: true,
            certificateStatus: "ISSUED",
          },
        },
      },
      include: { candidateProfile: true },
    });

    await prisma.certificate.create({
      data: {
        certificateNumber: "E2E-CERT-2025-P7RECB-002",
        candidateProfileId: bUser.candidateProfile!.id,
        finalScore: 82,
        approvedByAdminId: "admin-id",
        approvedByAdminName: "admin@e2epvtltd.com",
        status: "ISSUED",
        verificationCode: "RECB-VERI-CODE-5678",
      },
    });

    certifiedRecruiterB = {
      id: bUser.id,
      profileId: bUser.candidateProfile!.id,
      email: bUser.email,
      isCertified: true,
    };
  });

  afterAll(async () => {
    await prisma.scheduledInterview.deleteMany();
    await prisma.candidateStageHistory.deleteMany();
    await prisma.recruiterNote.deleteMany();
    await prisma.jobCandidate.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.recruiterChecklist.deleteMany();
    await prisma.recruiterTarget.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P7-UNCERT-REC", "P7-CERT-REC-A", "P7-CERT-REC-B"],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p7_uncert@e2epvtltd.com",
            "p7_rec_a@e2epvtltd.com",
            "p7_rec_b@e2epvtltd.com",
          ],
        },
      },
    });
  });

  // =========================================================================
  // 1. CERTIFICATE GATING
  // =========================================================================
  describe("1. Certificate Gating & Workspace Authorization", () => {
    it("strictly blocks uncertified candidate from accessing workspace actions", async () => {
      const rec = await getAuthenticatedRecruiter(uncertifiedRecruiter);
      expect(rec).toBeNull();

      const createRes = await createJobCandidate(
        {
          fullName: "Blocked Candidate",
          email: "blocked@example.com",
          phone: "919999999999",
        },
        uncertifiedRecruiter
      );

      expect(createRes.success).toBe(false);
      expect(createRes.message).toMatch(/unauthorized/i);
    });

    it("allows certified recruiter with issued certificate to access workspace", async () => {
      const recA = await getAuthenticatedRecruiter(certifiedRecruiterA);
      expect(recA).not.toBeNull();
      expect(recA?.isCertified).toBe(true);
      expect(recA?.candidateId).toBe("P7-CERT-REC-A");
    });
  });

  // =========================================================================
  // 2. CANDIDATE MANAGEMENT & DUPLICATE DETECTION
  // =========================================================================
  describe("2. Candidate Creation & Duplicate Detection", () => {
    let createdCandidateAId: string;

    it("creates a new job candidate in SOURCED stage with stage history", async () => {
      const res = await createJobCandidate(
        {
          fullName: "Vikram Sharma",
          email: "vikram.sharma@example.com",
          phone: "+91 98765 11111",
          location: "Bangalore",
          currentCompany: "Precision Auto Tech",
          currentDesignation: "Quality Inspector",
          totalExperienceYears: 3.5,
          qualification: "Diploma in Mechanical Engg",
          keySkills: "Vernier Calipers, Micrometer, CMM, GD&T",
          currentCtcLakhs: 3.2,
          expectedCtcLakhs: 4.5,
          noticePeriodDays: 15,
          source: "Naukri",
          clientName: "Tata Motors",
          jobTitle: "Quality Inspector",
          initialNote: "Candidate confirmed 3.5 yrs mechanical inspection experience.",
        },
        certifiedRecruiterA
      );

      expect(res.success).toBe(true);
      expect(res.data?.candidateId).toBeDefined();
      createdCandidateAId = res.data!.candidateId;

      // Verify in DB
      const dbCand = await prisma.jobCandidate.findUnique({
        where: { id: createdCandidateAId },
        include: { stageHistory: true, notes: true },
      });

      expect(dbCand).toBeDefined();
      expect(dbCand?.recruiterProfileId).toBe(certifiedRecruiterA.profileId);
      expect(dbCand?.pipelineStage).toBe("SOURCED");
      expect(dbCand?.stageHistory.length).toBe(1);
      expect(dbCand?.stageHistory[0].toStage).toBe("SOURCED");
      expect(dbCand?.notes.length).toBe(1);
    });

    it("detects duplicate when same recruiter attempts to add existing email/phone", async () => {
      const dupCheck = await checkDuplicateCandidate(
        { email: "vikram.sharma@example.com" },
        certifiedRecruiterA
      );

      expect(dupCheck.isDuplicate).toBe(true);
      expect(dupCheck.isOwnCandidate).toBe(true);
      expect(dupCheck.message).toMatch(/already exists in your active pipeline/i);

      // Attempting to create should be rejected
      const res = await createJobCandidate(
        {
          fullName: "Vikram Duplicate",
          email: "vikram.sharma@example.com",
          phone: "+91 98765 22222",
        },
        certifiedRecruiterA
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/already exists in your active pipeline/i);
    });

    it("detects ownership conflict when different recruiter attempts to add same candidate", async () => {
      const dupCheck = await checkDuplicateCandidate(
        { phone: "+91 98765 11111" },
        certifiedRecruiterB
      );

      expect(dupCheck.isDuplicate).toBe(true);
      expect(dupCheck.isOwnCandidate).toBe(false);
      expect(dupCheck.message).toMatch(/already actively managed by another E2E Recruiter/i);

      const res = await createJobCandidate(
        {
          fullName: "Vikram Stolen",
          email: "different.email@example.com",
          phone: "+91 98765 11111", // matching phone
        },
        certifiedRecruiterB
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/already actively managed by another E2E Recruiter/i);
    });
  });

  // =========================================================================
  // 3. CANDIDATE OWNERSHIP ISOLATION
  // =========================================================================
  describe("3. Strict Candidate Ownership Isolation", () => {
    let candidateAId: string;

    beforeAll(async () => {
      const candA = await prisma.jobCandidate.findFirst({
        where: { recruiterProfileId: certifiedRecruiterA.profileId },
      });
      candidateAId = candA!.id;
    });

    it("blocks Recruiter B from updating Recruiter A's candidate profile", async () => {
      const res = await updateJobCandidate(
        candidateAId,
        { location: "Unauthorized Location Update" },
        certifiedRecruiterB
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/ownership permissions/i);
    });

    it("blocks Recruiter B from changing stage of Recruiter A's candidate", async () => {
      const res = await updateCandidateStage(
        candidateAId,
        "SCREENED",
        "Unauthorized transition",
        certifiedRecruiterB
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/ownership permissions/i);
    });

    it("blocks Recruiter B from adding notes or scheduling interviews for Recruiter A's candidate", async () => {
      const noteRes = await addRecruiterNote(
        candidateAId,
        { content: "Unauthorized note" },
        certifiedRecruiterB
      );
      expect(noteRes.success).toBe(false);
      expect(noteRes.message).toMatch(/ownership permissions/i);

      const itvRes = await scheduleInterview(
        candidateAId,
        {
          clientName: "Client",
          jobRole: "Role",
          scheduledAt: new Date(),
        },
        certifiedRecruiterB
      );
      expect(itvRes.success).toBe(false);
      expect(itvRes.message).toMatch(/ownership permissions/i);
    });

    it("excludes Recruiter A's candidates when Recruiter B queries pipeline list", async () => {
      const resB = await getRecruiterCandidates(undefined, certifiedRecruiterB);
      expect(resB.success).toBe(true);
      expect(resB.data?.some((c) => c.id === candidateAId)).toBe(false);

      const detailsB = await getJobCandidateDetails(candidateAId, certifiedRecruiterB);
      expect(detailsB).toBeNull();
    });
  });

  // =========================================================================
  // 4. RECRUITMENT PIPELINE STAGES & OUTCOMES
  // =========================================================================
  describe("4. Sequential Pipeline Progression (11 Stages + Outcomes)", () => {
    let candId: string;

    beforeAll(async () => {
      const res = await createJobCandidate(
        {
          fullName: "Ananya Iyer",
          email: "ananya.iyer@example.com",
          phone: "+91 98765 33333",
          jobTitle: "Embedded Systems Engineer",
          clientName: "Bosch India",
        },
        certifiedRecruiterA
      );
      candId = res.data!.candidateId;
    });

    it("progresses sequentially through all 11 stages and creates audit trail", async () => {
      const stagesToWalk = [
        "CONTACTED",
        "INTERESTED",
        "SCREENED",
        "SHORTLISTED",
        "INTERVIEW_SCHEDULED",
        "INTERVIEW_ATTENDED",
        "SELECTED",
        "OFFERED",
        "OFFER_ACCEPTED",
        "JOINED",
      ];

      for (const stage of stagesToWalk) {
        const res = await updateCandidateStage(
          candId,
          stage,
          `Advanced to ${stage}`,
          certifiedRecruiterA
        );
        expect(res.success).toBe(true);
        expect(res.data?.stage).toBe(stage);
      }

      // Verify DB stage and stage history count
      const updatedCand = await prisma.jobCandidate.findUnique({
        where: { id: candId },
        include: { stageHistory: { orderBy: { createdAt: "asc" } } },
      });

      expect(updatedCand?.pipelineStage).toBe("JOINED");
      // 1 initial (SOURCED) + 10 transitions = 11 history rows
      expect(updatedCand?.stageHistory.length).toBe(11);
      expect(updatedCand?.stageHistory[10].toStage).toBe("JOINED");
    });

    it("supports outcome and hold stages (REJECTED with reason, ON_HOLD, DROPOUT)", async () => {
      const resCreate = await createJobCandidate(
        {
          fullName: "Pooja Reddy",
          email: "pooja.reddy@example.com",
          phone: "+91 98765 44444",
        },
        certifiedRecruiterA
      );
      const testCandId = resCreate.data!.candidateId;

      // 1. Put On Hold
      const resHold = await updateCandidateStage(
        testCandId,
        "ON_HOLD",
        "Client position paused",
        certifiedRecruiterA
      );
      expect(resHold.success).toBe(true);
      expect(resHold.data?.stage).toBe("ON_HOLD");

      // 2. Reject with Reason
      const rejectionReason = "Candidate lacks requisite CMM programming skills.";
      const resReject = await updateCandidateStage(
        testCandId,
        "REJECTED",
        rejectionReason,
        certifiedRecruiterA
      );
      expect(resReject.success).toBe(true);
      expect(resReject.data?.stage).toBe("REJECTED");

      const dbCand = await prisma.jobCandidate.findUnique({
        where: { id: testCandId },
      });
      expect(dbCand?.pipelineStage).toBe("REJECTED");
      expect(dbCand?.rejectionReason).toBe(rejectionReason);
    });
  });

  // =========================================================================
  // 5. INTERVIEW COORDINATION & FOLLOW-UPS
  // =========================================================================
  describe("5. Interview Scheduling & Pending Follow-ups", () => {
    let candId: string;

    beforeAll(async () => {
      const res = await createJobCandidate(
        {
          fullName: "Sanjay Patel",
          email: "sanjay.patel@example.com",
          phone: "+91 98765 55555",
        },
        certifiedRecruiterA
      );
      candId = res.data!.candidateId;
    });

    it("schedules interview, automatically updates stage to INTERVIEW_SCHEDULED, and records details", async () => {
      const interviewTime = new Date();
      interviewTime.setHours(interviewTime.getHours() + 2); // 2 hours from now (today)

      const itvRes = await scheduleInterview(
        candId,
        {
          clientName: "Schneider Electric",
          jobRole: "Assembly Line Lead",
          roundName: "Technical Panel",
          scheduledAt: interviewTime,
          meetingType: "ONLINE",
          meetingLinkOrVenue: "https://meet.google.com/test-link",
          interviewerName: "Arun Nair",
        },
        certifiedRecruiterA
      );

      expect(itvRes.success).toBe(true);

      const dbCand = await prisma.jobCandidate.findUnique({
        where: { id: candId },
        include: { interviews: true },
      });

      expect(dbCand?.pipelineStage).toBe("INTERVIEW_SCHEDULED");
      expect(dbCand?.interviews.length).toBe(1);
      expect(dbCand?.interviews[0].clientName).toBe("Schneider Electric");
      expect(dbCand?.interviews[0].status).toBe("SCHEDULED");
    });

    it("adds follow-up note and includes it in getWorkspaceDailyOverview", async () => {
      const followUpTime = new Date(); // Due today
      await addRecruiterNote(
        candId,
        {
          noteType: "FOLLOW_UP",
          content: "Call candidate 1 hour before interview to test webcam and audio setup.",
          followUpDate: followUpTime,
        },
        certifiedRecruiterA
      );

      const overview = await getWorkspaceDailyOverview(certifiedRecruiterA);
      expect(overview).not.toBeNull();
      expect(overview?.pendingFollowUps.length).toBeGreaterThanOrEqual(1);

      const foundNote = overview?.pendingFollowUps.find(
        (n) => n.content.includes("test webcam")
      );
      expect(foundNote).toBeDefined();
      expect(foundNote?.jobCandidate.fullName).toBe("Sanjay Patel");
    });
  });

  // =========================================================================
  // 6. DAILY REPORTING, TARGETS & CHECKLIST
  // =========================================================================
  describe("6. Daily Report, Targets & SOP Checklist Operations", () => {
    it("toggles checklist items and updates progress", async () => {
      const toggleRes = await toggleChecklistItem(
        "review_open_requirements",
        true,
        "Review Open Requirements",
        certifiedRecruiterA
      );
      expect(toggleRes.success).toBe(true);
      expect(toggleRes.data?.isCompleted).toBe(true);

      const overview = await getWorkspaceDailyOverview(certifiedRecruiterA);
      const item = overview?.todayChecklist.find((c) => c.key === "review_open_requirements");
      expect(item?.isCompleted).toBe(true);
    });

    it("updates targets and reflects achievement metrics", async () => {
      const targetRes = await updateTargetsToday(
        {
          callsTarget: 40,
          callsAchieved: 15,
          submitsTarget: 6,
          submitsAchieved: 2,
        },
        certifiedRecruiterA
      );
      expect(targetRes.success).toBe(true);

      const overview = await getWorkspaceDailyOverview(certifiedRecruiterA);
      expect(overview?.todayTarget?.callsTarget).toBe(40);
      expect(overview?.todayTarget?.callsAchieved).toBe(15);
    });

    it("submits Daily Operations Report and auto-syncs targets and checklist", async () => {
      const reportRes = await submitDailyReport(
        {
          profilesSourced: 12,
          callsMade: 25,
          candidatesInterested: 10,
          candidatesScreened: 8,
          profilesSubmitted: 4,
          interviewsScheduled: 2,
          interviewsAttended: 1,
          selections: 1,
          offersExtended: 1,
          joinings: 0,
          highlights: "Strong turnout for assembly roles.",
          challenges: "Notice period negotiations.",
          planForTomorrow: "Target ITI graduates.",
        },
        certifiedRecruiterA
      );

      expect(reportRes.success).toBe(true);
      expect(reportRes.data?.reportId).toBeDefined();

      // Verify auto-sync of targets achieved
      const overview = await getWorkspaceDailyOverview(certifiedRecruiterA);
      expect(overview?.todayTarget?.callsAchieved).toBe(25);
      expect(overview?.todayTarget?.submitsAchieved).toBe(4);

      // Verify checklist submit_daily_report was marked completed
      const submitCheck = overview?.todayChecklist.find((c) => c.key === "submit_daily_report");
      expect(submitCheck?.isCompleted).toBe(true);
    });

    it("calculates real conversion funnel insights based on candidate records", async () => {
      const insights = await getRecruiterInsights(certifiedRecruiterA);
      expect(insights).not.toBeNull();
      expect(insights?.total).toBeGreaterThanOrEqual(2);
      expect(insights?.counts.sourced).toBeGreaterThanOrEqual(2);
      expect(insights?.counts.joined).toBeGreaterThanOrEqual(1);
    });
  });
});
