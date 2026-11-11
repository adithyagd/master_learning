-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "certificateStatus" TEXT NOT NULL DEFAULT 'NOT_ELIGIBLE',
    "academyStatus" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "academyCompletedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByAdminId" TEXT,
    "currentModuleNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 10,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT,
    "type" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "timeLimitMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT,
    "moduleNumber" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestions" INTEGER NOT NULL DEFAULT 10,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "scorePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptQuestion" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByAdminId" TEXT NOT NULL,
    "approvedByAdminName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "verificationCode" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCandidate" (
    "id" TEXT NOT NULL,
    "recruiterProfileId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "location" TEXT,
    "currentCompany" TEXT,
    "currentDesignation" TEXT,
    "totalExperienceYears" DOUBLE PRECISION,
    "relevantExperienceYears" DOUBLE PRECISION,
    "qualification" TEXT,
    "keySkills" TEXT,
    "currentCtcLakhs" DOUBLE PRECISION,
    "expectedCtcLakhs" DOUBLE PRECISION,
    "noticePeriodDays" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'Other',
    "resumeUrl" TEXT,
    "documentNotes" TEXT,
    "pipelineStage" TEXT NOT NULL DEFAULT 'SOURCED',
    "rejectionReason" TEXT,
    "clientId" TEXT,
    "clientName" TEXT,
    "jobTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterNote" (
    "id" TEXT NOT NULL,
    "jobCandidateId" TEXT NOT NULL,
    "recruiterProfileId" TEXT NOT NULL,
    "noteType" TEXT NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "followUpDate" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateStageHistory" (
    "id" TEXT NOT NULL,
    "jobCandidateId" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT NOT NULL,
    "reason" TEXT,
    "changedByRecruiterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledInterview" (
    "id" TEXT NOT NULL,
    "jobCandidateId" TEXT NOT NULL,
    "recruiterProfileId" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "roundName" TEXT NOT NULL DEFAULT 'Interview Round 1',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "meetingType" TEXT NOT NULL DEFAULT 'ONLINE',
    "meetingLinkOrVenue" TEXT,
    "interviewerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRequirement" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "openPositions" INTEGER NOT NULL DEFAULT 1,
    "experienceRange" TEXT,
    "budgetRange" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "recruiterProfileId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "profilesSourced" INTEGER NOT NULL DEFAULT 0,
    "callsMade" INTEGER NOT NULL DEFAULT 0,
    "candidatesInterested" INTEGER NOT NULL DEFAULT 0,
    "candidatesScreened" INTEGER NOT NULL DEFAULT 0,
    "profilesSubmitted" INTEGER NOT NULL DEFAULT 0,
    "interviewsScheduled" INTEGER NOT NULL DEFAULT 0,
    "interviewsAttended" INTEGER NOT NULL DEFAULT 0,
    "selections" INTEGER NOT NULL DEFAULT 0,
    "offersExtended" INTEGER NOT NULL DEFAULT 0,
    "joinings" INTEGER NOT NULL DEFAULT 0,
    "ownLeads" INTEGER NOT NULL DEFAULT 0,
    "internalLeads" INTEGER NOT NULL DEFAULT 0,
    "shortlisted" INTEGER NOT NULL DEFAULT 0,
    "absconded" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,
    "noResponse" INTEGER NOT NULL DEFAULT 0,
    "pendingFollowUps" INTEGER NOT NULL DEFAULT 0,
    "highlights" TEXT,
    "challenges" TEXT,
    "learnings" TEXT,
    "pendingFollowUpsDesc" TEXT,
    "planForTomorrow" TEXT,
    "managerNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReportClientBreakdown" (
    "id" TEXT NOT NULL,
    "dailyReportId" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "ownLeads" INTEGER NOT NULL DEFAULT 0,
    "internalLeads" INTEGER NOT NULL DEFAULT 0,
    "screened" INTEGER NOT NULL DEFAULT 0,
    "shortlisted" INTEGER NOT NULL DEFAULT 0,
    "lineUp" INTEGER NOT NULL DEFAULT 0,
    "offered" INTEGER NOT NULL DEFAULT 0,
    "joined" INTEGER NOT NULL DEFAULT 0,
    "absconded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReportClientBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReportRevision" (
    "id" TEXT NOT NULL,
    "dailyReportId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL,
    "metricsSnapshot" TEXT NOT NULL,
    "managerNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReportRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterChecklist" (
    "id" TEXT NOT NULL,
    "recruiterProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "itemKey" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'MORNING',
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterTarget" (
    "id" TEXT NOT NULL,
    "recruiterProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "callsTarget" INTEGER NOT NULL DEFAULT 30,
    "callsAchieved" INTEGER NOT NULL DEFAULT 0,
    "submitsTarget" INTEGER NOT NULL DEFAULT 5,
    "submitsAchieved" INTEGER NOT NULL DEFAULT 0,
    "interviewsTarget" INTEGER NOT NULL DEFAULT 2,
    "interviewsAchieved" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetConfig" (
    "id" TEXT NOT NULL,
    "recruiterProfileId" TEXT,
    "periodType" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "callsTarget" INTEGER NOT NULL DEFAULT 30,
    "shortlistTarget" INTEGER NOT NULL DEFAULT 5,
    "interviewsTarget" INTEGER NOT NULL DEFAULT 2,
    "offersTarget" INTEGER NOT NULL DEFAULT 1,
    "joinsTarget" INTEGER NOT NULL DEFAULT 1,
    "ownLeadsTarget" INTEGER NOT NULL DEFAULT 5,
    "internalLeadsTarget" INTEGER NOT NULL DEFAULT 5,
    "orgMonthlyJoinsTarget" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "configuredByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetChangeHistory" (
    "id" TEXT NOT NULL,
    "targetConfigId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "previousValues" TEXT NOT NULL,
    "newValues" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "TargetChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerClientAssignment" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagerClientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "dedupKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_candidateId_key" ON "CandidateProfile"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateProfile_managerId_idx" ON "CandidateProfile"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_moduleNumber_key" ON "Module"("moduleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_lessonNumber_key" ON "Lesson"("moduleId", "lessonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_candidateProfileId_lessonId_key" ON "LessonProgress"("candidateProfileId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_moduleId_key" ON "Assessment"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_slug_key" ON "Assessment"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptQuestion_attemptId_questionId_key" ON "AttemptQuestion"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptQuestion_attemptId_displayOrder_key" ON "AttemptQuestion"("attemptId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_token_key" ON "AuthToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_candidateProfileId_key" ON "Certificate"("candidateProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verificationCode_key" ON "Certificate"("verificationCode");

-- CreateIndex
CREATE INDEX "JobCandidate_recruiterProfileId_idx" ON "JobCandidate"("recruiterProfileId");

-- CreateIndex
CREATE INDEX "JobCandidate_clientId_idx" ON "JobCandidate"("clientId");

-- CreateIndex
CREATE INDEX "JobCandidate_email_idx" ON "JobCandidate"("email");

-- CreateIndex
CREATE INDEX "JobCandidate_phone_idx" ON "JobCandidate"("phone");

-- CreateIndex
CREATE INDEX "JobCandidate_pipelineStage_idx" ON "JobCandidate"("pipelineStage");

-- CreateIndex
CREATE INDEX "RecruiterNote_jobCandidateId_idx" ON "RecruiterNote"("jobCandidateId");

-- CreateIndex
CREATE INDEX "RecruiterNote_recruiterProfileId_idx" ON "RecruiterNote"("recruiterProfileId");

-- CreateIndex
CREATE INDEX "CandidateStageHistory_jobCandidateId_idx" ON "CandidateStageHistory"("jobCandidateId");

-- CreateIndex
CREATE INDEX "CandidateStageHistory_changedByRecruiterId_idx" ON "CandidateStageHistory"("changedByRecruiterId");

-- CreateIndex
CREATE INDEX "ScheduledInterview_jobCandidateId_idx" ON "ScheduledInterview"("jobCandidateId");

-- CreateIndex
CREATE INDEX "ScheduledInterview_recruiterProfileId_idx" ON "ScheduledInterview"("recruiterProfileId");

-- CreateIndex
CREATE INDEX "ScheduledInterview_clientId_idx" ON "ScheduledInterview"("clientId");

-- CreateIndex
CREATE INDEX "ScheduledInterview_scheduledAt_idx" ON "ScheduledInterview"("scheduledAt");

-- CreateIndex
CREATE INDEX "ClientRequirement_clientId_idx" ON "ClientRequirement"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_recruiterProfileId_reportDate_key" ON "DailyReport"("recruiterProfileId", "reportDate");

-- CreateIndex
CREATE INDEX "DailyReportClientBreakdown_dailyReportId_idx" ON "DailyReportClientBreakdown"("dailyReportId");

-- CreateIndex
CREATE INDEX "DailyReportClientBreakdown_clientId_idx" ON "DailyReportClientBreakdown"("clientId");

-- CreateIndex
CREATE INDEX "DailyReportRevision_dailyReportId_idx" ON "DailyReportRevision"("dailyReportId");

-- CreateIndex
CREATE INDEX "RecruiterChecklist_recruiterProfileId_date_idx" ON "RecruiterChecklist"("recruiterProfileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterChecklist_recruiterProfileId_date_itemKey_key" ON "RecruiterChecklist"("recruiterProfileId", "date", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterTarget_recruiterProfileId_date_key" ON "RecruiterTarget"("recruiterProfileId", "date");

-- CreateIndex
CREATE INDEX "TargetConfig_periodType_periodKey_idx" ON "TargetConfig"("periodType", "periodKey");

-- CreateIndex
CREATE INDEX "TargetConfig_startDate_endDate_idx" ON "TargetConfig"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "TargetConfig_recruiterProfileId_periodType_periodKey_key" ON "TargetConfig"("recruiterProfileId", "periodType", "periodKey");

-- CreateIndex
CREATE INDEX "TargetChangeHistory_targetConfigId_idx" ON "TargetChangeHistory"("targetConfigId");

-- CreateIndex
CREATE INDEX "TargetChangeHistory_changedAt_idx" ON "TargetChangeHistory"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientMaster_code_key" ON "ClientMaster"("code");

-- CreateIndex
CREATE INDEX "ClientMaster_status_idx" ON "ClientMaster"("status");

-- CreateIndex
CREATE INDEX "ClientMaster_name_idx" ON "ClientMaster"("name");

-- CreateIndex
CREATE INDEX "ManagerClientAssignment_managerId_idx" ON "ManagerClientAssignment"("managerId");

-- CreateIndex
CREATE INDEX "ManagerClientAssignment_clientId_idx" ON "ManagerClientAssignment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagerClientAssignment_managerId_clientId_key" ON "ManagerClientAssignment"("managerId", "clientId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_dedupKey_idx" ON "Notification"("dedupKey");

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptQuestion" ADD CONSTRAINT "AttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptQuestion" ADD CONSTRAINT "AttemptQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCandidate" ADD CONSTRAINT "JobCandidate_recruiterProfileId_fkey" FOREIGN KEY ("recruiterProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCandidate" ADD CONSTRAINT "JobCandidate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterNote" ADD CONSTRAINT "RecruiterNote_jobCandidateId_fkey" FOREIGN KEY ("jobCandidateId") REFERENCES "JobCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterNote" ADD CONSTRAINT "RecruiterNote_recruiterProfileId_fkey" FOREIGN KEY ("recruiterProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateStageHistory" ADD CONSTRAINT "CandidateStageHistory_jobCandidateId_fkey" FOREIGN KEY ("jobCandidateId") REFERENCES "JobCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateStageHistory" ADD CONSTRAINT "CandidateStageHistory_changedByRecruiterId_fkey" FOREIGN KEY ("changedByRecruiterId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledInterview" ADD CONSTRAINT "ScheduledInterview_jobCandidateId_fkey" FOREIGN KEY ("jobCandidateId") REFERENCES "JobCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledInterview" ADD CONSTRAINT "ScheduledInterview_recruiterProfileId_fkey" FOREIGN KEY ("recruiterProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledInterview" ADD CONSTRAINT "ScheduledInterview_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRequirement" ADD CONSTRAINT "ClientRequirement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_recruiterProfileId_fkey" FOREIGN KEY ("recruiterProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportClientBreakdown" ADD CONSTRAINT "DailyReportClientBreakdown_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportClientBreakdown" ADD CONSTRAINT "DailyReportClientBreakdown_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportRevision" ADD CONSTRAINT "DailyReportRevision_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterChecklist" ADD CONSTRAINT "RecruiterChecklist_recruiterProfileId_fkey" FOREIGN KEY ("recruiterProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterTarget" ADD CONSTRAINT "RecruiterTarget_recruiterProfileId_fkey" FOREIGN KEY ("recruiterProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetConfig" ADD CONSTRAINT "TargetConfig_recruiterProfileId_fkey" FOREIGN KEY ("recruiterProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetChangeHistory" ADD CONSTRAINT "TargetChangeHistory_targetConfigId_fkey" FOREIGN KEY ("targetConfigId") REFERENCES "TargetConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerClientAssignment" ADD CONSTRAINT "ManagerClientAssignment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerClientAssignment" ADD CONSTRAINT "ManagerClientAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
