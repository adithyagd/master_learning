/**
 * E2E Procurement Pvt Ltd — Standard Recruiter Daily SOP Checklist
 * 22 structured tasks organized strictly into 3 operational sections:
 * Morning (8 items), During the Day (8 items), and End of Day (6 items).
 */

export interface MasterChecklistItem {
  key: string;
  section: "MORNING" | "DURING_DAY" | "END_OF_DAY";
  sectionTitle: string;
  order: number;
  title: string;
  description: string;
}

export const CHECKLIST_SECTIONS = [
  { id: "MORNING", label: "Morning Operations", count: 8 },
  { id: "DURING_DAY", label: "During the Day Operations", count: 8 },
  { id: "END_OF_DAY", label: "End of Day Operations", count: 6 },
] as const;

export const MASTER_CHECKLIST_ITEMS: MasterChecklistItem[] = [
  // ==========================================
  // SECTION 1: MORNING (8 Items)
  // ==========================================
  {
    key: "morning_login",
    section: "MORNING",
    sectionTitle: "Morning Operations",
    order: 1,
    title: "Log in",
    description: "Access the E2E platform, verify authentication, and establish active recruiter session.",
  },
  {
    key: "morning_review_requirements",
    section: "MORNING",
    sectionTitle: "Morning Operations",
    order: 2,
    title: "Review requirements",
    description: "Inspect active client requisitions, open mandates, skill criteria, and priority hiring quotas.",
  },
  {
    key: "morning_review_pending_follow_ups",
    section: "MORNING",
    sectionTitle: "Morning Operations",
    order: 3,
    title: "Review pending follow-ups",
    description: "Scan queued callback reminders, candidate notes, and open queries scheduled for this morning.",
  },
  {
    key: "morning_complete_follow_ups",
    section: "MORNING",
    sectionTitle: "Morning Operations",
    order: 4,
    title: "Complete morning follow-ups",
    description: "Execute scheduled morning follow-up calls and resolve early priority candidate actions.",
  },
  {
    key: "morning_send_lineup_reminders",
    section: "MORNING",
    sectionTitle: "Morning Operations",
    order: 5,
    title: "Send line-up reminders",
    description: "Notify shortlisted candidates with interview line-up timings, facility details, or meeting links.",
  },
  {
    key: "morning_send_whatsapp_reminders",
    section: "MORNING",
    sectionTitle: "Morning Operations",
    order: 6,
    title: "Send WhatsApp reminders where applicable",
    description: "Dispatch instant messaging reminders, location pins, and interview checklists for field/plant roles.",
  },
  {
    key: "morning_confirm_interviews",
    section: "MORNING",
    sectionTitle: "Morning Operations",
    order: 7,
    title: "Confirm interviews",
    description: "Re-confirm candidate presence and readiness with client hiring managers and interview panels.",
  },
  {
    key: "morning_review_daily_targets",
    section: "MORNING",
    sectionTitle: "Morning Operations",
    order: 8,
    title: "Review daily targets",
    description: "Calibrate daily KPIs across outreach calls (30), submissions (5), and interview lineups (2).",
  },

  // ==========================================
  // SECTION 2: DURING THE DAY (8 Items)
  // ==========================================
  {
    key: "day_source_candidates",
    section: "DURING_DAY",
    sectionTitle: "During the Day Operations",
    order: 9,
    title: "Source candidates",
    description: "Search talent portals (Naukri, LinkedIn, Job Fairs, Referrals) using calibrated boolean operators.",
  },
  {
    key: "day_make_calls",
    section: "DURING_DAY",
    sectionTitle: "During the Day Operations",
    order: 10,
    title: "Make calls",
    description: "Execute telephonic cold outreach and pitch requirements using professional phone scripts.",
  },
  {
    key: "day_screen_candidates",
    section: "DURING_DAY",
    sectionTitle: "During the Day Operations",
    order: 11,
    title: "Screen candidates",
    description: "Evaluate experience, technical competency, notice period, compensation, and cultural fitment.",
  },
  {
    key: "day_update_candidate_info",
    section: "DURING_DAY",
    sectionTitle: "During the Day Operations",
    order: 12,
    title: "Update candidate information",
    description: "Persist latest CTC, notice period, contact data, resumes, and screening notes in the pipeline.",
  },
  {
    key: "day_schedule_interviews",
    section: "DURING_DAY",
    sectionTitle: "During the Day Operations",
    order: 13,
    title: "Schedule interviews",
    description: "Coordinate interview slots between screened candidates and client evaluation panels.",
  },
  {
    key: "day_followup_shortlisted",
    section: "DURING_DAY",
    sectionTitle: "During the Day Operations",
    order: 14,
    title: "Follow up with shortlisted candidates",
    description: "Brief shortlisted candidates on panel expectations, technical topics, and preparation guidelines.",
  },
  {
    key: "day_followup_offers",
    section: "DURING_DAY",
    sectionTitle: "During the Day Operations",
    order: 15,
    title: "Follow up on offers",
    description: "Facilitate compensation negotiation, verify offer letter receipt, and secure offer acceptance.",
  },
  {
    key: "day_followup_joining",
    section: "DURING_DAY",
    sectionTitle: "During the Day Operations",
    order: 16,
    title: "Follow up on joining",
    description: "Maintain pre-joining touchpoints, track resignation acceptance, and mitigate dropout risk.",
  },

  // ==========================================
  // SECTION 3: END OF DAY (6 Items)
  // ==========================================
  {
    key: "eod_update_reports_statuses",
    section: "END_OF_DAY",
    sectionTitle: "End of Day Operations",
    order: 17,
    title: "Update reports and statuses",
    description: "Align candidate pipeline stages, interview outcomes, and rejection/hold reasons across trackers.",
  },
  {
    key: "eod_complete_pending_followups",
    section: "END_OF_DAY",
    sectionTitle: "End of Day Operations",
    order: 18,
    title: "Complete pending follow-ups",
    description: "Resolve remaining evening callbacks and log recruiter notes for all outstanding interactions.",
  },
  {
    key: "eod_prepare_tomorrow_plan",
    section: "END_OF_DAY",
    sectionTitle: "End of Day Operations",
    order: 19,
    title: "Prepare tomorrow's plan",
    description: "Identify sourcing channels, map candidate pools, and list high-priority mandates for next morning.",
  },
  {
    key: "eod_update_manager",
    section: "END_OF_DAY",
    sectionTitle: "End of Day Operations",
    order: 20,
    title: "Update the manager",
    description: "Brief team lead / operations manager on daily achievements, bottlenecks, and interview line-ups.",
  },
  {
    key: "eod_submit_daily_report",
    section: "END_OF_DAY",
    sectionTitle: "End of Day Operations",
    order: 21,
    title: "Submit the daily report",
    description: "Submit end-of-day operations numbers and narrative summary via the Daily Report portal.",
  },
  {
    key: "eod_mark_day_completed",
    section: "END_OF_DAY",
    sectionTitle: "End of Day Operations",
    order: 22,
    title: "Mark the day completed when applicable",
    description: "Formally close out the working day once all mandatory operational milestones are achieved.",
  },
];
