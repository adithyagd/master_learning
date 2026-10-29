/**
 * E2E Procurement Pvt Ltd — Design System & Platform Constants
 * Company: E2E Procurement Private Limited
 * CIN: U78300KA2025PTC204064 | Bangalore, Karnataka, India
 * Website: https://www.e2epvtltd.com/
 */

export const COMPANY_INFO = {
  name: "E2E Procurement Private Limited",
  shortName: "E2E Procurement",
  cin: "U78300KA2025PTC204064",
  incorporationDate: "June 13, 2025",
  roc: "ROC Bangalore",
  location: "Bangalore, Karnataka, India",
  website: "https://www.e2epvtltd.com/",
  tagline: "Recruiter Academy & Enterprise Recruitment Operations Platform",
  portalSubtitle: "Excellence in Talent Acquisition, Staffing & Procurement",
};

export const ROLES = {
  ADMIN: "ADMIN",
  CANDIDATE: "CANDIDATE",
  MANAGER: "MANAGER",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const CERTIFICATE_STATUS = {
  NOT_ELIGIBLE: "NOT_ELIGIBLE",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ISSUED: "ISSUED",
} as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUS)[keyof typeof CERTIFICATE_STATUS];

export const CERTIFICATE_STATUS_CONFIG: Record<
  CertificateStatus,
  { label: string; badgeVariant: "default" | "warning" | "success" | "danger" | "info" }
> = {
  NOT_ELIGIBLE: { label: "Not Eligible", badgeVariant: "default" },
  PENDING_APPROVAL: { label: "Pending Approval", badgeVariant: "warning" },
  APPROVED: { label: "Approved (Pending Issue)", badgeVariant: "info" },
  REJECTED: { label: "Rejected", badgeVariant: "danger" },
  ISSUED: { label: "Issued & Certified", badgeVariant: "success" },
};

/**
 * Mandatory 5 Academy Modules + Final Assessment
 * Note: Module 5 title, lessons, and questions strictly avoid the acronym 'ATS'.
 */
export const ACADEMY_MODULES = [
  {
    number: 1,
    id: "module-1",
    title: "Module 1 — Recruitment Fundamentals",
    description: "Core recruiting lifecycles, talent acquisition models, recruiter ethics, and SLA fundamentals.",
    passingScore: 70,
  },
  {
    number: 2,
    id: "module-2",
    title: "Module 2 — JD Decoding & Requirement Understanding",
    description: "Analyzing job descriptions, extracting mandatory vs preferred skills, boolean logic, and calibration.",
    passingScore: 70,
  },
  {
    number: 3,
    id: "module-3",
    title: "Module 3 — Candidate Sourcing & Recruitment Preparation",
    description: "Multichannel sourcing, active & passive talent mapping, talent pool curation, and pitch crafting.",
    passingScore: 70,
  },
  {
    number: 4,
    id: "module-4",
    title: "Module 4 — Communication, Screening & Interview Management",
    description: "Cold outreach, telephonic screening, behavioral assessment, interview scheduling, and coordination.",
    passingScore: 70,
  },
  {
    number: 5,
    id: "module-5",
    title: "Module 5 — Recruitment Operations",
    description: "Pipeline management, database governance, tracker workflows, compliance, and client reporting.",
    passingScore: 70,
  },
] as const;

export const FINAL_ASSESSMENT_CONFIG = {
  title: "Final Assessment",
  description: "Comprehensive 20-question evaluation spanning all recruitment competencies.",
  totalQuestions: 20,
  durationMinutes: 20,
  passingScore: 70,
  unlimitedRetries: true,
};

/**
 * 11 Mandatory Recruitment Pipeline Stages + 6 Outcome Statuses
 */
export const PIPELINE_STAGES = [
  { id: "SOURCED", label: "Sourced", step: 1, color: "text-slate-600 bg-slate-100" },
  { id: "CONTACTED", label: "Contacted", step: 2, color: "text-blue-700 bg-blue-50" },
  { id: "INTERESTED", label: "Interested", step: 3, color: "text-cyan-700 bg-cyan-50" },
  { id: "SCREENED", label: "Screened", step: 4, color: "text-indigo-700 bg-indigo-50" },
  { id: "SHORTLISTED", label: "Shortlisted", step: 5, color: "text-purple-700 bg-purple-50" },
  { id: "INTERVIEW_SCHEDULED", label: "Interview Scheduled", step: 6, color: "text-amber-700 bg-amber-50" },
  { id: "INTERVIEW_ATTENDED", label: "Interview Attended", step: 7, color: "text-orange-700 bg-orange-50" },
  { id: "SELECTED", label: "Selected", step: 8, color: "text-emerald-700 bg-emerald-50" },
  { id: "OFFERED", label: "Offered", step: 9, color: "text-teal-700 bg-teal-50" },
  { id: "OFFER_ACCEPTED", label: "Offer Accepted", step: 10, color: "text-emerald-800 bg-emerald-100" },
  { id: "JOINED", label: "Joined", step: 11, color: "text-green-800 bg-green-100" },
] as const;

export const PIPELINE_OUTCOMES = [
  { id: "REJECTED", label: "Rejected", color: "text-rose-700 bg-rose-50" },
  { id: "NOT_INTERESTED", label: "Not Interested", color: "text-slate-700 bg-slate-100" },
  { id: "NO_RESPONSE", label: "No Response", color: "text-slate-500 bg-slate-50" },
  { id: "ON_HOLD", label: "On Hold", color: "text-amber-700 bg-amber-50" },
  { id: "DROPOUT", label: "Dropout", color: "text-red-700 bg-red-50" },
  { id: "ABSCONDED", label: "Absconded", color: "text-red-900 bg-red-100" },
] as const;

/**
 * Operations Workspace Navigation Items
 */
export const WORKSPACE_NAV_ITEMS = [
  { id: "today", label: "Today", path: "/workspace/today", icon: "CalendarCheck" },
  { id: "daily-report", label: "Daily Report", path: "/workspace/report", icon: "FileText" },
  { id: "checklist", label: "Checklist", path: "/workspace/checklist", icon: "CheckSquare" },
  { id: "targets", label: "Targets", path: "/workspace/targets", icon: "Target" },
  { id: "pipeline", label: "Pipeline", path: "/workspace/pipeline", icon: "Users" },
  { id: "history", label: "History", path: "/workspace/history", icon: "Clock" },
  { id: "insights", label: "Insights", path: "/workspace/insights", icon: "BarChart3" },
  { id: "toolkit", label: "Toolkit", path: "/workspace/toolkit", icon: "Briefcase" },
  { id: "profile", label: "Profile", path: "/workspace/profile", icon: "User" },
] as const;

/**
 * Admin Center Navigation Items
 */
export const ADMIN_NAV_ITEMS = [
  { id: "dashboard", label: "Admin Dashboard", path: "/admin/dashboard", icon: "LayoutDashboard" },
  { id: "candidates", label: "Candidate Management", path: "/admin/candidates", icon: "UserPlus" },
  { id: "certificates", label: "Certificate Approvals", path: "/admin/certificates", icon: "Award" },
  { id: "academy", label: "Academy & Question Bank", path: "/admin/academy", icon: "GraduationCap" },
  { id: "reports-review", label: "Reports & Review", path: "/admin/reports", icon: "CheckCircle2" },
  { id: "analytics", label: "Funnel & Analytics", path: "/admin/analytics", icon: "PieChart" },
  { id: "audit", label: "Audit History", path: "/admin/audit", icon: "ShieldCheck" },
] as const;

/**
 * Manager Portal Navigation Items (Phase 12)
 */
export const MANAGER_NAV_ITEMS = [
  { id: "dashboard", label: "Team Dashboard", path: "/manager", icon: "LayoutDashboard" },
  { id: "team", label: "My Team", path: "/manager/team", icon: "Users" },
  { id: "reports", label: "Team Reports", path: "/manager/reports", icon: "FileText" },
  { id: "approvals", label: "Approval Queue", path: "/manager/approvals", icon: "CheckSquare" },
  { id: "targets", label: "Team Targets", path: "/manager/targets", icon: "Target" },
  { id: "insights", label: "Team Insights", path: "/manager/insights", icon: "TrendingUp" },
] as const;

