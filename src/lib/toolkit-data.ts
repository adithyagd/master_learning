/**
 * E2E Procurement Pvt Ltd — Recruiter Toolkit Reference Library
 * Reusable enterprise reference materials, checklists, calling scripts, boolean strings, and templates.
 * Zero-ATS compliant.
 */

export interface ToolkitItem {
  id: string;
  category: "Checklists" | "Templates & Scripts" | "Boolean Searches" | "Glossary & Guides";
  title: string;
  description: string;
  tags: string[];
  copyableText?: string;
  content: string; // Markdown / formatted display
}

export const TOOLKIT_CATEGORIES = [
  "All",
  "Checklists",
  "Templates & Scripts",
  "Boolean Searches",
  "Glossary & Guides",
] as const;

export const TOOLKIT_ITEMS: ToolkitItem[] = [
  // 1. Recruitment Terminology
  {
    id: "recruitment-terminology",
    category: "Glossary & Guides",
    title: "Recruitment Terminology Glossary",
    description: "Standard definitions of core metrics, acronyms, and compensation terms used daily.",
    tags: ["Glossary", "TAT", "CTC", "Metrics", "Terminology"],
    content: `### Essential Industry Terminology

- **TAT (Turnaround Time)**: Total business days elapsed from requisition assignment to candidate offer acceptance or joining.
- **CTC (Cost to Company)**: The total annual financial outlay an organization spends on an employee, comprising Fixed Base + Variable Bonus + Statutory Benefits (PF, Gratuity, ESI, Medical Insurance).
- **Fixed CTC**: Guaranteed monthly base salary, not dependent on performance metrics.
- **Variable CTC**: Performance-linked incentive, annual bonus, or sales commissions paid quarterly or annually.
- **Notice Period Buyout**: Payment made by the hiring company to the candidate's current employer in lieu of unserved notice days.
- **LWD (Last Working Day)**: The formal contractual end date confirmed in an employer's official resignation acceptance letter.
- **Offer-to-Join Ratio**: \`(Joined Candidates / Offered Candidates) * 100\`. Measures joining drop-off rate.
- **Requisition (Req)**: An approved, budgeted job opening with defined headcount authorization.
- **Pipeline**: The active pool of prospective candidates currently undergoing evaluation across consecutive stages.
- **Silver Medalist**: High-performing candidates who reached final rounds and were deemed qualified, but not selected due to headcount limits. Primary target for re-engagement.`,
  },

  // 2. JD Decoding Checklist
  {
    id: "jd-decoding-checklist",
    category: "Checklists",
    title: "JD Decoding & Calibration Checklist",
    description: "6-step operational checklist to break down job descriptions before initiating candidate sourcing.",
    tags: ["JD Decoding", "Checklist", "Requirements", "Calibration"],
    copyableText: `[ ] 1. Core Designation & Hierarchy: Verified exact job title, team scope, and reporting manager.
[ ] 2. Must-Have Hard Skills: Isolated non-negotiable technologies, certifications, or licenses (zero-compromise).
[ ] 3. Good-to-Have Skills: Identified secondary skills that add value but can be trained on the job.
[ ] 4. Experience & Stability: Differentiated Total Work Experience from Relevant Domain Experience (minimum stability requirement: >=1.5 yrs per role).
[ ] 5. Compensation & Budget: Confirmed fixed vs variable limits, maximum hike cap (e.g. 25-30%), and client budget ceiling.
[ ] 6. Logistics & Shift Feasibility: Verified on-site address, shift timings (General/UK/US/Rotational), transport provision, and maximum acceptable notice period.`,
    content: `### JD Decoding & Calibration Checklist

Before launching any sourcing campaign, complete this 6-point verification:

1. **Core Designation & Hierarchy**:
   - What is the exact organizational role and whom does this position report to?
2. **Must-Have Hard Skills (Non-Negotiables)**:
   - Identify skills without which the candidate cannot function on Day 1.
3. **Good-to-Have Skills (Trainables)**:
   - Secondary proficiencies that provide bonus value but are not dealbreakers.
4. **Experience & Stability Calibration**:
   - Total Experience vs Relevant Domain Experience. Set acceptable job tenure stability thresholds.
5. **Compensation & Budget**:
   - Maximum budget cap, allowable hike percentages, and fixed/variable breakdown.
6. **Logistics & Shift Feasibility**:
   - Exact work location, transport facility availability, shift schedule, and maximum notice period.`,
  },

  // 3. Candidate Sourcing Checklist
  {
    id: "candidate-sourcing-checklist",
    category: "Checklists",
    title: "Candidate Sourcing & Pipeline Checklist",
    description: "Step-by-step procedure for conducting targeted multichannel candidate discovery sprints.",
    tags: ["Sourcing", "Checklist", "Outreach", "Workflow"],
    copyableText: `[ ] 1. Sourcing Matrix Created: Keyword synonyms, title variations, and Boolean search strings prepared.
[ ] 2. Channel Prioritization: Identified top 2 channels (e.g. Internal database mining + Commercial job boards).
[ ] 3. Initial Profile Scan (45s Rule): Evaluated headline, current location, recent stability, and must-have skill keywords.
[ ] 4. Target Batching: Shortlisted minimum 25-30 profiles matching non-negotiables for the day's outreach sprint.
[ ] 5. Contact Availability: Verified mobile number validity, active WhatsApp presence, and email address.
[ ] 6. Tracker Logging: Recorded candidate profiles in the recruitment pipeline tracker with source attribution.`,
    content: `### Candidate Sourcing Execution Checklist

Follow this workflow to maximize daily sourcing productivity:

1. **Sourcing Matrix**: Build boolean strings covering all title synonyms and functional competencies.
2. **Channel Mapping**: Identify whether the role is best served by direct database search, campus channels, or professional networks.
3. **45-Second Screening Scan**: Check tenure stability, must-have skills, and current location before downloading resumes.
4. **Batch Outreach**: Queue batches of 25–30 qualified prospects per sourcing sprint.
5. **Channel Verification**: Confirm valid contact details across mobile and email.
6. **Tracker Hygiene**: Log all sourced candidates into the pipeline tracker immediately with correct stage disposition.`,
  },

  // 4. Boolean Search Examples
  {
    id: "boolean-search-examples",
    category: "Boolean Searches",
    title: "Boolean Search Strings & Operator Library",
    description: "Production-tested boolean strings for Tech, Logistics, Procurement, and Industrial Engineering roles.",
    tags: ["Boolean", "Search", "Naukri", "LinkedIn", "Strings"],
    copyableText: `1. Warehouse & Logistics Supervisor:
("Warehouse Supervisor" OR "Warehouse Team Lead" OR "Inventory Supervisor" OR "Logistics Lead") AND ("Inventory Management" OR "Stock Audit" OR "Cycle Count") AND (Bangalore OR Bengaluru)

2. Procurement & Purchasing Executive:
("Procurement Executive" OR "Buyer" OR "Purchasing Officer" OR "Sourcing Specialist") AND ("Vendor Management" OR "Supplier Evaluation" OR "PO Creation" OR "Price Negotiation") AND (Bangalore OR "Electronic City")

3. Full-Stack Software Engineer (React + Node.js):
("Full Stack" OR "Fullstack") AND (React OR "React.js") AND ("Node.js" OR Node) AND (TypeScript OR "REST API") AND (NOT "WordPress")

4. ITI Technician (Electrical / Fitter):
(ITI OR "Industrial Training Institute" OR NCVT OR SCVT) AND (Electrician OR Fitter OR Maintenance OR Wireman) AND ("Preventive Maintenance" OR "Machine Maintenance" OR "Panel Wiring")

5. Polytechnic Diploma Engineer (Mechanical / Production):
(Diploma OR Polytechnic) AND (Mechanical OR Production OR Automobile) AND ("Quality Inspection" OR "Line Supervisor" OR "Assembly" OR "CNC")`,
    content: `### Production-Ready Boolean Search Strings

Copy and customize these strings for job portal database search:

#### 1. Warehouse & Logistics Supervisor:
\`\`\`text
("Warehouse Supervisor" OR "Warehouse Team Lead" OR "Inventory Supervisor" OR "Logistics Lead") AND ("Inventory Management" OR "Stock Audit" OR "Cycle Count") AND (Bangalore OR Bengaluru)
\`\`\`

#### 2. Procurement & Purchasing Executive:
\`\`\`text
("Procurement Executive" OR "Buyer" OR "Purchasing Officer" OR "Sourcing Specialist") AND ("Vendor Management" OR "Supplier Evaluation" OR "PO Creation" OR "Price Negotiation") AND (Bangalore OR "Electronic City")
\`\`\`

#### 3. Full-Stack Software Engineer:
\`\`\`text
("Full Stack" OR "Fullstack") AND (React OR "React.js") AND ("Node.js" OR Node) AND (TypeScript OR "REST API") AND (NOT "WordPress")
\`\`\`

#### 4. ITI Technician (Electrical / Fitter):
\`\`\`text
(ITI OR "Industrial Training Institute" OR NCVT OR SCVT) AND (Electrician OR Fitter OR Maintenance OR Wireman) AND ("Preventive Maintenance" OR "Machine Maintenance" OR "Panel Wiring")
\`\`\`

#### 5. Polytechnic Diploma Engineer:
\`\`\`text
(Diploma OR Polytechnic) AND (Mechanical OR Production OR Automobile) AND ("Quality Inspection" OR "Line Supervisor" OR "Assembly" OR "CNC")
\`\`\``,
  },

  // 5. Candidate Screening Questions
  {
    id: "candidate-screening-questions",
    category: "Templates & Scripts",
    title: "Telephonic Screening Questions (STAR Framework)",
    description: "Structured probing questions to qualify technical background, compensation, notice period, and motivation.",
    tags: ["Screening", "Interview", "Questions", "STAR", "Qualification"],
    copyableText: `1. Current Role & Reason for Change:
"Could you briefly walk me through your current day-to-day responsibilities at [Current Company]? What is motivating your exploration of a career change right now?"

2. Hands-on Must-Have Skill Probing (STAR):
"Our client requires hands-on experience in [Specific Competency, e.g. Vendor Cost Negotiations]. Can you share a recent specific project where you negotiated a supplier contract? What was your target, what action did you take, and what cost saving resulted?"

3. Compensation Verification:
"To ensure complete alignment with our client's budgeted band, what is your current annual CTC broken down into Fixed and Variable? What are your realistic compensation expectations?"

4. Notice Period & Availability:
"What is your official contractual notice period? Have you formally submitted your resignation, and if so, what is your confirmed Last Working Day (LWD)? If not, would your employer support a notice period buyout?"

5. Logistics, Shifts & Relocation:
"This role is located on-site at [Location, e.g. Electronic City, Bangalore] with [General/Rotational] shifts. Does this location and shift schedule suit your commute and lifestyle?"`,
    content: `### Telephonic Screening Question Framework

Structured questions to evaluate candidate suitability during the initial 10-minute screening call:

1. **Role Scope & Motivation**:
   - *"Could you briefly walk me through your current day-to-day responsibilities at [Current Company]? What is motivating your exploration of a career change right now?"*
2. **Competency Probing via STAR**:
   - *"Our client requires hands-on experience in [Specific Competency]. Can you share a recent specific project where you executed this? What was the situation, your specific task, your action, and the business result?"*
3. **Compensation Breakdown**:
   - *"To ensure alignment with the client's approved budget band, what is your current annual CTC broken down into Fixed base and Variable? What is your realistic target CTC?"*
4. **Notice Period & Last Working Day**:
   - *"What is your official contractual notice period? Have you formally submitted your resignation? What is your confirmed Last Working Day?"*
5. **Logistics & Shifts**:
   - *"This position is on-site at [Location] with [General/Rotational] shift hours. Does this commute and schedule work comfortably for you?"*`,
  },

  // 6. Professional Calling Scripts
  {
    id: "professional-calling-scripts",
    category: "Templates & Scripts",
    title: "Professional Cold Calling & Objection Scripts",
    description: "Word-for-word recruiter scripts for cold outreach, busy candidates, and overcoming salary/location objections.",
    tags: ["Calling Scripts", "Cold Call", "Objection Handling", "Phone Etiquette"],
    copyableText: `1. Initial 30-Second Introduction Script:
"Hello [Candidate Name], good morning! My name is [Recruiter Name] calling from E2E Procurement Private Limited, Bangalore. I came across your profile on [Platform] and was very impressed by your background in [Core Skill, e.g. Warehouse Operations]. Am I speaking with you at a convenient time for a brief 2-minute conversation regarding an exciting career opening?"

2. When the Candidate is Busy:
"I completely understand you are busy right now, [Candidate Name]. I would love to connect when you have a moment to talk freely. Would 4:30 PM this afternoon or 6:00 PM this evening be more convenient for a quick 5-minute call?"

3. Overcoming Salary Expectation Objection:
"I completely respect your target compensation of [Expected CTC]. Our client's approved budget cap is [Max Budget] fixed; however, it includes comprehensive medical insurance, performance bonuses, and semi-annual appraisal reviews based on merit. Given that this position offers team leadership and accelerated career growth, would you be open to an interview to explore the full leadership scope?"

4. Overcoming Location Distance Objection:
"I understand [Location] is a commute from your current residence. The client provides designated shuttle transportation from major metro nodes, and the facility has modern amenities and subsidized cafeteria services. Let us review the shuttle route to see if a pickup point is near you."`,
    content: `### Recruiter Calling Scripts & Objection Responses

#### 1. Initial 30-Second Introduction:
> *"Hello [Candidate Name], good morning! My name is [Recruiter Name] calling from E2E Procurement Private Limited, Bangalore. I came across your profile and was very impressed by your background in [Core Skill]. Am I speaking with you at a convenient time for a brief 2-minute conversation regarding an exciting career opening?"*

#### 2. Busy Candidate Response:
> *"I completely understand you are busy right now, [Candidate Name]. Would 4:30 PM this afternoon or 6:00 PM this evening be more convenient for a quick 5-minute callback?"*

#### 3. Salary Cap Objection:
> *"I completely respect your target compensation of [Expected CTC]. Our client's approved budget is [Max Budget] fixed; however, it includes comprehensive medical insurance, performance bonuses, and semi-annual appraisal reviews. Would you be open to an interview to explore the full scope?"*

#### 4. Location Distance Objection:
> *"I understand [Location] is a commute. The client provides designated shuttle transportation from major metro nodes. Let us review the shuttle route to see if a pickup point is convenient for you."*`,
  },

  // 7. Candidate Follow-up Messages
  {
    id: "candidate-followup-messages",
    category: "Templates & Scripts",
    title: "Candidate Follow-Up Messages (WhatsApp & SMS)",
    description: "Concise, professional messaging templates for document collection, availability checks, and status reminders.",
    tags: ["WhatsApp", "SMS", "Follow-up", "Communication"],
    copyableText: `1. Post-Screening Document Request (WhatsApp):
"Hi [Candidate Name], it was a pleasure speaking with you regarding the [Job Title] role at [Client Name] through E2E Procurement Pvt Ltd. To present your profile to the hiring committee, please share:
1. Updated Resume (PDF/Word)
2. Latest Salary Slip or Hike Letter
3. Resignation Acceptance / LWD Proof (if serving notice)
Please send these across by [Time/Day, e.g. 3:00 PM today]. Thank you! - [Recruiter Name], E2E Procurement"

2. Unresponsive Candidate Check-in (SMS/WhatsApp):
"Hello [Candidate Name], [Recruiter Name] here from E2E Procurement Pvt Ltd. I tried reaching you regarding your shortlisted profile for the [Job Title] position. Please let me know a convenient time to connect today, or confirm if you are still interested in proceeding. Best regards!"

3. Post-Interview Debrief Follow-up (WhatsApp):
"Hi [Candidate Name], hope your interview with [Panel Name/Client] went well today! When you have 5 minutes, please give me a quick call or message me your feedback so we can coordinate the next round. - [Recruiter Name]"`,
    content: `### Instant Messaging Templates (WhatsApp & SMS)

#### 1. Document Request After Qualification:
> *"Hi [Candidate Name], it was a pleasure speaking with you regarding the [Job Title] role at [Client Name] through E2E Procurement Pvt Ltd. To submit your profile to the hiring team, please share: (1) Updated Resume, (2) Recent Payslip, (3) Resignation proof if serving notice. Please share by [Time] today. Thank you!"*

#### 2. Unresponsive Candidate Check-in:
> *"Hello [Candidate Name], [Recruiter Name] here from E2E Procurement Pvt Ltd. I tried reaching you regarding your shortlisted profile for the [Job Title] position. Please confirm if you are still interested in proceeding. Best regards!"*

#### 3. Post-Interview Debrief:
> *"Hi [Candidate Name], hope your interview with [Client Name] went well! When you have 5 minutes, please message me your feedback so we can coordinate next steps with the client. Thank you!"*`,
  },

  // 8. Interview Confirmation & Reminder Templates
  {
    id: "interview-confirmation-templates",
    category: "Templates & Scripts",
    title: "Interview Confirmation & 3-Touchpoint Reminder Templates",
    description: "Email and SMS templates for formal interview invitations, 24-hour confirmations, and 2-hour alerts.",
    tags: ["Interview", "Scheduling", "Reminders", "No-Show Prevention"],
    copyableText: `1. Formal Interview Invitation Email:
Subject: Interview Confirmation: [Job Title] - [Candidate Name] with [Client Name] / E2E Procurement

Dear [Candidate Name],

Congratulations! Your profile has been shortlisted for an interview with [Client Name] for the [Job Title] position.

Interview Details:
- Date: [Date, e.g. Wednesday, October 22, 2025]
- Time: [Time, e.g. 11:30 AM IST]
- Mode: [Google Meet / Microsoft Teams / In-Person Facility]
- Meeting Link / Address: [URL or Physical Facility Address]
- Interview Panel: [Interviewer Name / Functional Role]
- Round: [Technical / Managerial / HR]

Preparation Guidelines:
1. Please join/arrive 10 minutes prior to the scheduled time.
2. For virtual interviews, ensure a quiet room, stable internet connection, and working webcam/microphone.
3. Keep an updated copy of your resume and portfolio handy.

Please reply to this email with "CONFIRMED" to secure your slot.

Warm regards,
[Recruiter Name]
Talent Acquisition Team | E2E Procurement Private Limited
Bangalore, Karnataka | www.e2epvtltd.com

2. 24-Hour Reminder Message:
"Hi [Candidate Name], this is a gentle reminder that your interview for [Job Title] with [Client Name] is scheduled for tomorrow at [Time]. Please confirm that you are ready. Best of luck! - [Recruiter Name], E2E Procurement"

3. 2-Hour Pre-Interview Alert:
"Good morning [Candidate Name]! Your interview with [Client Name] starts in 2 hours at [Time]. Please test your audio/video and join 5 minutes early at: [Meeting Link]. You have got this! - E2E Procurement"`,
    content: `### Interview Scheduling & Reminder Templates

#### 1. Formal Confirmation Email:
Use this comprehensive email to provide all logistic parameters, technical check instructions, and an explicit requirement to reply *"CONFIRMED"*.

#### 2. The 24-Hour Pre-Interview Reminder:
Send a quick reminder SMS or WhatsApp message the afternoon before the interview to detect any last-minute emergencies early.

#### 3. The 2-Hour Alert:
Send a quick link reminder 120 minutes prior to the meeting to ensure zero no-shows.`,
  },

  // 9. Job Fair Preparation Checklist
  {
    id: "job-fair-checklist",
    category: "Checklists",
    title: "Job Fair & Walk-In Drive Logistics Checklist",
    description: "Operational checklist for executing high-volume campus hiring drives and walk-in recruitment events.",
    tags: ["Job Fair", "Campus", "Walk-in", "Bulk Hiring", "Checklist"],
    copyableText: `[ ] 1. Venue & Signage: Directional banners placed at main gates, registration desk, assessment hall, and waiting area.
[ ] 2. Candidate Intake & Tokens: Physical token numbering system ready to manage queue order and avoid crowd crowding.
[ ] 3. Printed Collateral: 200+ copies of Candidate Information Sheets, assessment questionnaires, and feedback scorecards.
[ ] 4. Evaluation Stations: Allocated distinct interview desks for HR screening, technical evaluation, and document verification.
[ ] 5. Digital Tracker Station: Dedicated laptops connected to hotspot for real-time candidate registration and stage logging.
[ ] 6. Refreshment & Facilities: Drinking water, seating capacity verified for 50+ candidates, and first-aid provisions.`,
    content: `### Job Fair & Walk-In Drive Operational Checklist

Ensure complete operational readiness for high-volume hiring events:

1. **Venue Signage & Flow**: Directional markers from entrance to registration, interview rooms, and exit.
2. **Token Queue Management**: Sequential token dispensing to prevent crowded waiting halls.
3. **Evaluation Stationery**: Pre-printed scorecards, assessment sheets, and application forms.
4. **Dedicated Stations**: Separate desks for initial document vetting, technical panels, and final HR sign-offs.
5. **Real-time Digital Logging**: Continuous entry of candidate outcomes into recruitment operations trackers.
6. **Candidate Comfort**: Seating arrangements and hydration facilities to maintain positive employer brand reputation.`,
  },

  // 10. Interview Preparation Guide for Candidates
  {
    id: "interview-prep-guide",
    category: "Glossary & Guides",
    title: "Candidate Interview Preparation Guide",
    description: "Briefing document to share with candidates before their panel interview to maximize selection rate.",
    tags: ["Candidate Briefing", "Interview Prep", "Candidate Coaching"],
    copyableText: `Tips for Your Upcoming Interview with [Client Name]:

1. Research the Organization:
- Review the client's corporate website, core services, and leadership background.
- Understand how your role contributes to their business goals.

2. Structure Your Answers using STAR:
- Situation: Briefly describe the context.
- Task: State your specific responsibility.
- Action: Explain what steps you personally took.
- Result: Share the measurable positive business outcome.

3. Be Ready to Discuss:
- Specific past projects highlighting must-have skills from the JD.
- How you handled challenging deadlines or difficult stakeholders.
- Why you are interested in this specific client and career opportunity.

4. Professional Etiquette:
- Join 5-10 minutes early.
- Test your webcam and audio in advance.
- Dress in smart business formal attire.
- Have 2 thoughtful questions ready to ask the interviewer at the end.`,
    content: `### Candidate Interview Briefing Guide

Share these actionable tips with candidates during their pre-interview briefing call:

1. **Company Research**:
   - Instruct the candidate to review the client's website, products, and industry sector.
2. **STAR Method Answering**:
   - Coach the candidate to structure technical answers with Situation, Task, Action, and measurable Results.
3. **Competency Alignment**:
   - Review the key JD bullet points and prepare specific project examples.
4. **Professionalism**:
   - Punctuality (5–10 minutes early), neat dress code, quiet environment, and active listening.`,
  },

  // 11. Pipeline Stage Definitions
  {
    id: "pipeline-stage-definitions",
    category: "Glossary & Guides",
    title: "Recruitment Pipeline Stage Definitions",
    description: "Standard operating definitions for the 11 pipeline stages and 6 outcome dispositions.",
    tags: ["Pipeline", "Stages", "Operations", "Dispositions"],
    content: `### The 11 Mandatory Pipeline Stages

1. **Sourced**: Candidate profile identified and imported into requirement pool.
2. **Contacted**: Recruiter has initiated outreach via call, email, or message.
3. **Interested**: Candidate has confirmed willingness to evaluate the opportunity.
4. **Screened**: Telephonic qualification completed (fitment, notice, CTC, skills).
5. **Shortlisted**: Candidate cleared internal vetting and submitted to hiring manager.
6. **Interview Scheduled**: Client panel and time slot confirmed; invite dispatched.
7. **Interview Attended**: Candidate verified as present and completed evaluation.
8. **Selected**: Panel issues formal positive recommendation and clears hiring.
9. **Offered**: Official compensation letter with start date extended to candidate.
10. **Offer Accepted**: Candidate signs and returns formal offer acceptance document.
11. **Joined**: Candidate physically reports on Day 1 and joins company payroll.

### The 6 Standard Outcome Dispositions

- **Rejected**: Failed technical or behavioral criteria evaluated by panel.
- **Not Interested**: Candidate voluntarily withdrew after receiving role details.
- **No Response**: Candidate unreachable after 3 consecutive attempts over 48 hours.
- **On Hold**: Requisition paused by client or candidate deferred for future batch.
- **Dropout**: Candidate backed out after receiving or accepting an offer.
- **Absconded**: Candidate confirmed joining, failed to report on Day 1, and became unreachable.`,
  },

  // 12. Offer & Joining Follow-up Templates
  {
    id: "offer-joining-templates",
    category: "Templates & Scripts",
    title: "Offer Rollout & Pre-Joining Follow-up Templates",
    description: "Verbal offer script, offer transmittal email, and pre-joining touchpoints (Day -7, -3, -1) to prevent dropouts.",
    tags: ["Offer Letter", "Joining", "Counter-Offer", "Dropout Prevention"],
    copyableText: `1. Verbal Offer Discussion Script:
"Congratulations [Candidate Name]! The hiring panel at [Client Name] was extremely impressed by your technical depth and problem-solving during your interview rounds. On behalf of E2E Procurement and [Client Name], I am delighted to extend a formal offer of employment for the position of [Job Title]!
We are offering an annual Fixed CTC of [Fixed Amount], with [Variable/Bonus details], bringing your total CTC to [Total Amount].
Our agreed joining date is [Date]. I am sending the formal offer letter to your email right now. Let us review the compensation components together."

2. Pre-Joining Cadence (Day -7 Touchpoint):
"Hi [Candidate Name], just 1 week until your start date at [Client Name] on [Date]! I am checking in to verify that your exit clearance with your current employer is on track and that you have received your relieving documents. Let me know if you need any assistance!"

3. Pre-Joining Cadence (Day -3 Touchpoint):
"Hello [Candidate Name], we are all set for your onboarding on [Date] at 9:00 AM. Please ensure you have original copies of your ID proof, degree certificates, and relieving letter ready for Day 1 verification."

4. Day -1 Final Arrival Briefing (SMS/WhatsApp):
"Good afternoon [Candidate Name]! Tomorrow is the big day! Your reporting time is 9:00 AM at [Office Address]. Upon arrival at reception, please ask for [HR Coordinator Name] or mention you are joining [Team Name]. Best wishes for a fantastic first day! - [Recruiter Name], E2E Procurement"`,
    content: `### Offer Extension & Pre-Joining Touchpoints

#### 1. Verbal Offer Presentation:
Deliver the good news with energy, congratulate the candidate on their performance, clarify exact salary figures, and secure verbal acceptance before sending documents.

#### 2. The 3-Stage Pre-Joining Touchpoint System:
Preventing offer dropouts requires proactive engagement between offer acceptance and Day 1:
- **Day -7**: Verify resignation formalities, relieving letter status, and counter-offer resistance.
- **Day -3**: Document preparation checklist (ID, academic certificates, bank details).
- **Day -1**: Arrival time, reporting manager contact, dress code, and building access directions.`,
  },
];
