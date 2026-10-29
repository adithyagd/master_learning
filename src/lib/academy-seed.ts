import { prisma } from "./prisma";

export const ACADEMY_CURRICULUM = [
  {
    moduleNumber: 1,
    slug: "recruitment-fundamentals",
    title: "Module 1 — Recruitment Fundamentals",
    description: "Core recruiting lifecycles, talent acquisition models, recruiter ethics, and SLA fundamentals.",
    passingScore: 70,
    lessons: [
      {
        lessonNumber: 1,
        slug: "recruitment-basics-purpose",
        title: "Recruitment Basics & Organizational Purpose",
        estimatedMinutes: 10,
        summary: "Understand what recruitment is, why it is strategic to enterprise success, and how recruiters drive organizational growth.",
        content: `### What is Recruitment?
Recruitment is the active process of identifying, attracting, screening, shortlisting, and hiring the right talent for specific organizational roles. It serves as the primary engine for business scalability.

#### Key Organizational Objectives of Recruitment:
1. **Talent Quality**: Bringing qualified, culture-aligned professionals who can execute business objectives.
2. **Speed to Hire (Turnaround Time - TAT)**: Filling critical vacancies before business operations suffer downtime or lost revenue.
3. **Cost Optimization**: Minimizing cost-per-hire by utilizing direct sourcing channels rather than expensive contingency agencies.
4. **Employer Branding**: Ensuring every candidate—whether selected or rejected—has a professional, respectful experience that enhances company reputation.

#### Practical Scenario:
> **Scenario:** A logistics client of E2E Procurement needs 15 operations executives in 10 days to handle festive surge demand.
> **Recruiter Action:** The recruiter cannot rely on passive job posts. They must activate targeted sourcing, pre-screen candidates on shifts and location immediately, and conduct daily batches to hit the SLA.

#### Key Takeaways:
- Recruitment is not just filling vacancies; it is strategic business enablement.
- A recruiter directly affects project delivery and client satisfaction.`,
      },
      {
        lessonNumber: 2,
        slug: "recruiter-roles-specializations",
        title: "Recruiter Roles & Specializations",
        estimatedMinutes: 10,
        summary: "Explore the different career paths, day-to-day responsibilities, and specializations across talent acquisition.",
        content: `### Specializations in Modern Talent Acquisition

Talent acquisition is diverse, with distinct specializations based on function and seniority:

1. **Talent Sourcer**:
   - Focuses on candidate discovery, pipeline generation, and initial outreach.
   - Masters boolean search, social profiling, and talent mapping.
2. **Full-Lifecycle Recruiter (360° Recruiter)**:
   - Manages the search from JD intake to offer rollout and onboarding.
   - Performs screening, interview coordination, salary negotiation, and candidate engagement.
3. **Technical Recruiter (IT Recruiter)**:
   - Specializes in software engineers, cloud architects, DevOps, QA, and data scientists.
   - Must evaluate technical skill stacks, frameworks, and architecture experience.
4. **Non-IT / Volume Recruiter**:
   - Specializes in manufacturing, retail, sales, logistics, customer support, and supply chain.
   - Focuses on high-velocity hiring, walk-in drives, and immediate availability.
5. **Account Manager / Client Partner**:
   - Manages client relationships, receives requisitions, calibrates requirements, and presents shortlist profiles.

#### Practical Example:
A full-lifecycle recruiter at E2E Procurement manages both candidate screening calls in the morning and client coordination meetings in the afternoon, maintaining pipeline velocity.`,
      },
      {
        lessonNumber: 3,
        slug: "it-vs-non-it-recruitment",
        title: "IT vs Non-IT Recruitment",
        estimatedMinutes: 12,
        summary: "Understand key differences between hiring technology professionals and domain/industrial talent.",
        content: `### Comparing IT and Non-IT Hiring

| Dimension | IT Recruitment | Non-IT Recruitment |
| :--- | :--- | :--- |
| **Target Roles** | Full-Stack Developers, DevOps, Cloud Engineers, QA, Data Engineers | Supply Chain, Sales, Manufacturing, Finance, HR, Logistics, Operations |
| **Candidate Motivation** | Tech stack modernness, remote flexibility, compensation, engineering culture | Career stability, incentives, shift timing, proximity to home |
| **Notice Period** | Typically 60–90 days (high buyout demand) | 0–30 days (frequently immediate joiners) |
| **Assessment Method** | Coding assessments, system design, technical panel interviews | Behavioral interviews, domain knowledge tests, past sales quota proof |
| **Sourcing Channels** | Specialized tech portals, developer communities, professional networks | Job boards, campus drives, local employment exchanges, social groups |

#### Common Mistake to Avoid:
Using an IT pitch for a non-IT candidate or vice versa. A non-IT warehouse supervisor prioritizes location, transport, and shift safety; a software engineer prioritizes modern frameworks and code ownership.`,
      },
      {
        lessonNumber: 4,
        slug: "recruitment-terminology",
        title: "Essential Recruitment Terminology",
        estimatedMinutes: 10,
        summary: "Master the key industry acronyms, metrics, and compensation terminology used daily in professional recruitment.",
        content: `### Critical Metrics & Definitions

1. **Turnaround Time (TAT)**:
   - The total calendar time from when a job requisition is assigned to when the selected candidate accepts the offer or joins.
2. **Requisition (Req)**:
   - An authorized, budgeted job opening with an approved job description.
3. **Pipeline**:
   - The pool of active candidates moving through consecutive stages of evaluation for a role.
4. **Cost-to-Company (CTC)**:
   - The complete annual compensation package spent by an employer on an employee.
   - **Fixed Component**: Base salary paid monthly, guaranteed regardless of performance.
   - **Variable Component**: Performance bonus, sales commission, or annual incentive.
5. **Notice Period Buyout**:
   - An agreement where the hiring employer pays the candidate's current company the equivalent salary for their notice days so the candidate can join immediately.
6. **Offer-to-Join Ratio (Joining Ratio)**:
   - Percentage of candidates who actually join out of those who were extended an offer: \`(Joined Candidates / Offered Candidates) * 100\`.`,
      },
      {
        lessonNumber: 5,
        slug: "recruitment-lifecycle-responsibilities",
        title: "Recruitment Lifecycle & Recruiter Responsibilities",
        estimatedMinutes: 12,
        summary: "A step-by-step walkthrough of the end-to-end recruitment lifecycle and professional standards of conduct.",
        content: `### The 6 Stages of the Recruitment Lifecycle

\`\`\`
1. Requirement Calibration -> 2. Multichannel Sourcing -> 3. Screening & Shortlisting -> 4. Interview Scheduling -> 5. Offer & Negotiation -> 6. Joining & Post-Offer Engagement
\`\`\`

#### Step-by-Step Execution:
1. **Calibration**: Review JD with hiring manager, clarify must-haves, establish compensation budget.
2. **Sourcing**: Mine databases, execute boolean strings, run referral campaigns.
3. **Screening**: Telephonic qualification, salary expectation check, notice period verification.
4. **Interview Scheduling**: Brief candidate on format, confirm panel availability, send calendar invites.
5. **Offer & Negotiation**: Present offer letter, clarify compensation breakdown, secure verbal acceptance.
6. **Post-Offer Engagement**: Regular touchpoints before day 1 to prevent offer dropouts.

#### Professional Ethics:
- **Zero Discrimination**: Evaluate strictly on competencies, never on personal backgrounds.
- **Data Confidentiality**: Protect candidate resumes, contact numbers, and compensation slips with strict privacy.
- **Candidate Dignity**: Provide transparent status updates to every candidate.`,
      },
    ],
  },
  {
    moduleNumber: 2,
    slug: "jd-decoding",
    title: "Module 2 — JD Decoding & Requirement Understanding",
    description: "Analyzing job descriptions, extracting mandatory vs preferred skills, boolean logic, and calibration.",
    passingScore: 70,
    lessons: [
      {
        lessonNumber: 1,
        slug: "anatomy-of-a-jd",
        title: "Anatomy of a Job Description",
        estimatedMinutes: 10,
        summary: "Deconstruct enterprise job descriptions into clear operational parameters for sourcing.",
        content: `### Key Sections of a Job Description

A comprehensive Job Description (JD) contains distinct sections that every recruiter must decode before searching for candidates:

1. **Job Title**: The official designation (e.g., *Senior Procurement Specialist*).
2. **Business Overview & Reporting Line**: Which team or department the role belongs to, and who the candidate reports to.
3. **Core Responsibilities**: The daily tasks and ongoing deliverables expected of the person.
4. **Required Qualifications & Experience**: Degrees, years of relevant experience, industry exposure.
5. **Compensation & Employment Type**: Full-time, contract, shift timings, CTC range, and workplace location.

#### Recruiter Tip:
Do not assume job titles are standardized across companies. A *Lead Buyer* in a mid-sized firm might perform the same duties as a *Senior Procurement Associate* in a multinational enterprise. Always analyze responsibilities, not just titles.`,
      },
      {
        lessonNumber: 2,
        slug: "must-have-vs-good-to-have",
        title: "Skills Classification — Must-Have vs Good-to-Have",
        estimatedMinutes: 12,
        summary: "Differentiate non-negotiable hard criteria from secondary preferences to avoid pipeline bottlenecks.",
        content: `### The Golden Rule of Sourcing Filters

Never reject a strong candidate over a secondary preference. Categorize criteria into two strict buckets:

#### Must-Have Criteria (Non-Negotiables):
- Absolute prerequisites without which the candidate cannot perform the role.
- *Examples:* Valid commercial driver's license for delivery roles, hands-on Python/FastAPI for a backend engineer, 3+ years SAP MM experience for an inventory lead.
- If a candidate lacks a Must-Have, they are disqualified.

#### Good-to-Have Criteria (Value Additions):
- Nice-to-have proficiencies that can be learned on the job or provide bonus value.
- *Examples:* Exposure to Docker, previous consulting experience, familiarity with a specific internal tool.
- A candidate who meets 100% of must-haves and 50% of good-to-haves is an excellent match.

#### Scenario:
> **Client Request:** "We need a Procurement Analyst with 3 years in vendor negotiations. Experience with Power BI is preferred."
> **Correct Approach:** Filter candidates with 3+ years in vendor negotiation. Treat Power BI as an advantage, but do not filter out candidates who use Excel advanced dashboards.`,
      },
      {
        lessonNumber: 3,
        slug: "experience-salary-location-shifts",
        title: "Experience, Salary, Location & Shift Calibration",
        estimatedMinutes: 12,
        summary: "Master the operational constraints of candidate matching: relevant experience, CTC brackets, location viability, and shifts.",
        content: `### Evaluating Practical Constraints

#### 1. Total Experience vs Relevant Experience:
- **Total Experience:** Total calendar years in the workforce.
- **Relevant Experience:** Years spent performing the exact duties required by the role.
- *Example:* A candidate with 6 years total work experience, but only 2 years in talent sourcing, has 2 years of relevant experience.

#### 2. Compensation (CTC) Mathematics:
- Standard hiring budget guidelines usually offer a 20% to 35% hike on a candidate's current verifiable fixed CTC.
- If a candidate earns 6 LPA and expects 12 LPA (100% hike), clarify whether their current salary is below market average or if their expectations are outside the client budget.

#### 3. Shift Timing Calibration:
- General Day Shift (9 AM – 6 PM)
- UK Shift (1 PM – 10 PM)
- US Night Shift (6 PM – 3 AM / 9 PM – 6 AM)
- Rotational Shifts (24/7 manufacturing or support operations)
- *Always verify transport feasibility and rotational willingness during the first screening call.*`,
      },
      {
        lessonNumber: 4,
        slug: "notice-periods-fitment-evaluation",
        title: "Notice Periods & Candidate Fitment Evaluation",
        estimatedMinutes: 10,
        summary: "Analyze candidate availability, notice period buyout risks, and organizational fitment indicators.",
        content: `### Notice Period Categories

1. **Immediate Joiners (Serving Notice / Currently Available)**:
   - Top priority for urgent client requirements.
   - Requires verification of last working day (LWD) via official resignation acceptance email.
2. **Short Notice (15 to 30 Days)**:
   - High joining predictability.
   - Ideal for most regular monthly requisitions.
3. **Long Notice (60 to 90 Days)**:
   - Common in large IT service companies.
   - Highest risk of counter-offers, shopping offers, and dropout.
   - Requires weekly engagement to keep candidate interested.

#### Buyout Evaluation:
If the client is willing to buy out the notice period, verify whether the candidate's current employer allows buyout. Many companies have policies prohibiting buyouts for mission-critical project resources.`,
      },
      {
        lessonNumber: 5,
        slug: "converting-jd-to-sourcing-requirement",
        title: "Converting a JD into a Tactical Sourcing Requirement",
        estimatedMinutes: 12,
        summary: "Synthesize decoded requirements into a clean sourcing cheat sheet and boolean search string.",
        content: `### Creating a Sourcing Matrix

Before opening candidate databases, build a **Sourcing Cheat Sheet**:

\`\`\`
Role Title: Warehouse Operations Supervisor
Client: E2E Logistics Client A
Location: Electronic City, Bangalore (On-site)
Experience: 3 to 5 years in warehousing / 3PL
Budget: 4.5 LPA to 5.5 LPA
Shift: Rotational (Day & Night)
Must-Haves: Inventory audit, team handling (10+ staff), ERP inventory module
Good-to-Haves: Six Sigma Green Belt, Forklift safety certification
\`\`\`

#### Deriving Search Keywords:
- **Core Title Keywords:** "Warehouse Supervisor" OR "Inventory Supervisor" OR "Warehouse Team Lead"
- **Must-Have Functional Skills:** "Inventory Management" OR "Stock Audit" OR "Cycle Count"
- **Industry Keywords:** "Logistics" OR "3PL" OR "Supply Chain" OR "FMCG" OR "E-commerce"`,
      },
    ],
  },
  {
    moduleNumber: 3,
    slug: "candidate-sourcing-preparation",
    title: "Module 3 — Candidate Sourcing & Recruitment Preparation",
    description: "Multichannel sourcing, active & passive talent mapping, talent pool curation, and pitch crafting.",
    passingScore: 70,
    lessons: [
      {
        lessonNumber: 1,
        slug: "sourcing-methods-active-passive",
        title: "Sourcing Methods: Active vs Passive Talent",
        estimatedMinutes: 10,
        summary: "Understand candidate psychology, the talent pyramid, and how to approach active vs passive job seekers.",
        content: `### The Talent Pyramid

1. **Active Job Seekers (approx. 20% of talent market)**:
   - Actively visiting job portals, applying to openings, updating resumes weekly.
   - Easy to contact and fast to schedule.
   - Often applying to multiple companies simultaneously; high competition among recruiters.
2. **Passive Candidates (approx. 80% of talent market)**:
   - Currently employed and not actively applying.
   - Open to hearing about compelling career advancements, better culture, or leadership growth.
   - Sourced through outbound headhunting, talent mapping, and direct messaging.
   - Lower dropout rate because they are not mass-interviewing.

#### Key Sourcing Rule:
High-performing recruiters do not wait for incoming applications. They proactively hunt both active and passive candidates to build robust pipelines.`,
      },
      {
        lessonNumber: 2,
        slug: "sourcing-channels-overview",
        title: "Multichannel Sourcing Ecosystem",
        estimatedMinutes: 12,
        summary: "Explore the primary channels for discovering top talent across industries.",
        content: `### Channels for Candidate Discovery

1. **Enterprise Database Mining**:
   - Searching internal historical databases for previous silver medalists, past applicants, and re-engagement pools.
2. **Commercial Job Portals**:
   - Resume database search (Naukri, Monster/Foundit, Indeed, Shine).
   - Saved search alerts and resume alerts.
3. **Professional & Social Networks**:
   - LinkedIn Recruiter, GitHub, Behance, Stack Overflow for technical talent.
4. **Employee Referral Programs**:
   - Highest offer-to-join ratio and lowest early attrition.
5. **Alumni Networks & Campus Hiring**:
   - Institutional placement cells, trade training centers, polytechnic colleges.`,
      },
      {
        lessonNumber: 3,
        slug: "niche-sourcing-iti-diploma-engineering",
        title: "Niche Sourcing: ITI, Diploma & Engineering Talent",
        estimatedMinutes: 12,
        summary: "Tactics for technical trades, industrial technicians, diploma engineers, and junior tech talent.",
        content: `### Specialized Industrial & Technical Sourcing

Recruiting for manufacturing, procurement, and industrial operations requires distinct channels compared to general office hiring:

#### 1. ITI (Industrial Training Institute) Candidates:
- **Trades:** Electrician, Fitter, Turner, Machinist, Welder, Wireman.
- **Sourcing Strategy:** Local employment exchanges, state apprenticeship portals (NAPS), industrial estate bulletin boards, and trade unions.

#### 2. Diploma Engineers (Polytechnic):
- **Streams:** Mechanical, Electrical, Automobile, Tool & Die Making.
- **Roles:** Production Supervisor, Quality Inspector, Maintenance Engineer.
- **Sourcing Strategy:** Direct outreach to polytechnic placement officers, regional telegram groups, campus drives.

#### 3. Graduate Engineers (B.E. / B.Tech):
- **Streams:** CS/IT for software; Mechanical/Civil/Electrical for core procurement.
- **Validation:** Check AICTE approval of college, aggregate percentage (e.g. &ge;60% without backlogs), and hands-on project exposure.`,
      },
      {
        lessonNumber: 4,
        slug: "boolean-search-mastery",
        title: "Boolean Search Mechanics & Syntax",
        estimatedMinutes: 15,
        summary: "Master AND, OR, NOT, quotation marks, and nested parentheses to build precision talent searches.",
        content: `### The 5 Fundamentals of Boolean Search

#### 1. OR Operator (Broadening):
- Connects synonyms or alternative acceptable terms.
- *Syntax:* \`Java OR J2EE OR Spring\`
- *Result:* Retrieves profiles containing at least one of these terms.

#### 2. AND Operator (Narrowing):
- Combines mandatory independent criteria.
- *Syntax:* \`Procurement AND Logistics\`
- *Result:* Retrieves profiles that have both terms.

#### 3. NOT Operator / Minus Sign (Exclusion):
- Eliminates irrelevant profiles.
- *Syntax:* \`Developer NOT PHP\` or \`Developer -PHP\`
- *Result:* Eliminates profiles mentioning PHP.

#### 4. Quotation Marks (Exact Phrase Matching):
- Binds words together in exact sequence.
- *Syntax:* \`"Supply Chain Management"\`
- *Without quotes:* Matches "Supply", "Chain", and "Management" anywhere on the page.

#### 5. Parentheses (Grouping & Precedence):
- Groups OR operators together before combining with AND.
- *Example Master String:*
  \`\`\`text
  ("Procurement Executive" OR "Buyer" OR "Purchasing Officer") AND ("Vendor Management" OR "Supplier Evaluation") AND (Bangalore OR Bengaluru)
  \`\`\``,
      },
      {
        lessonNumber: 5,
        slug: "social-sourcing-job-fairs-sprint-prep",
        title: "Social Sourcing, Job Fairs & Daily Sourcing Sprints",
        estimatedMinutes: 10,
        summary: "Organize daily outreach workflows, prepare job fair logistics, and maintain sourcing momentum.",
        content: `### Structuring a 90-Minute Sourcing Sprint

High-velocity recruiters structure their days into uninterrupted focused sprints:

1. **Sprint Setup (Minutes 0–10)**:
   - Review open positions and prioritize the day's critical submittals.
   - Prepare and refine boolean strings.
2. **Execution & Screening (Minutes 10–70)**:
   - Review 40–50 candidate profiles against must-haves.
   - Download or tag the top 15 matches.
   - Initiate cold calls and WhatsApp outreach.
3. **Pipeline Hygiene (Minutes 70–90)**:
   - Log all candidate notes in the recruitment operations tracker.
   - Schedule callbacks and send initial email briefs.

#### Organizing Job Fairs & Walk-In Drives:
- Ensure clear directional signage, candidate registration token system, printed assessment sheets, and dedicated waiting areas.`,
      },
    ],
  },
  {
    moduleNumber: 4,
    slug: "communication-screening-interview-management",
    title: "Module 4 — Communication, Screening & Interview Management",
    description: "Cold outreach, telephonic screening, behavioral assessment, interview scheduling, and coordination.",
    passingScore: 70,
    lessons: [
      {
        lessonNumber: 1,
        slug: "telephone-etiquette-introductions",
        title: "Telephone Etiquette & Professional Introductions",
        estimatedMinutes: 10,
        summary: "Create positive first impressions, introduce E2E Procurement professionally, and engage candidates.",
        content: `### The First 30 Seconds of a Screening Call

Candidates often answer recruitment calls while at work, commuting, or busy. Professionalism and courtesy are vital.

#### Standard Recruiter Introduction Script:
> *"Hello [Candidate Name], good morning! My name is [Recruiter Name] calling from E2E Procurement Private Limited, Bangalore. I came across your profile on [Platform/Referral] regarding your experience in [Core Skill, e.g. Warehouse Operations]. Am I speaking with you at a convenient time for a brief 2-minute conversation regarding an exciting career opportunity?"*

#### Core Telephone Rules:
1. **Always ask for permission to speak**: Never dive directly into an interrogation.
2. **Clear pronunciation & modulated volume**: Speak clearly without aggressive urgency.
3. **State the company name proudly**: Establish institutional legitimacy immediately.
4. **Reschedule politely if they are busy**: *"I understand you are in a meeting, [Name]. What would be a convenient time this afternoon for me to call you back?"*`,
      },
      {
        lessonNumber: 2,
        slug: "resume-screening-matching-matrix",
        title: "Active Listening & Resume Screening Techniques",
        estimatedMinutes: 12,
        summary: "Evaluate resumes against job descriptions, detect career inconsistencies, and calculate fitment.",
        content: `### How to Read a Resume in 45 Seconds

Experienced recruiters scan resumes systematically rather than reading every sentence:

1. **Top Header**: Contact info, current city, and headline summary.
2. **Employment Timeline & Stability**:
   - Check tenure at each company (e.g. 2+ years per company indicates stability; 3 jobs in 6 months indicates high flight risk).
   - Check for unexplained career gaps.
3. **Core Tech / Functional Skills**:
   - Are must-have skills mentioned in actual project responsibilities, or only listed in a generic keyword block at the top?
4. **Current Designation vs Scope**:
   - Does their daily scope match what the client needs?

#### The Red Flag Checklist:
- Vague dates (e.g., writing "2023 - 2024" without specifying months to conceal an 8-month gap).
- Overlapping full-time roles without explanation.
- Generic resumes with zero measurable achievements or client project details.`,
      },
      {
        lessonNumber: 3,
        slug: "telephonic-screening-questions",
        title: "Telephonic Screening Questions & STAR Framework",
        estimatedMinutes: 12,
        summary: "Ask probing qualification questions to evaluate technical foundation, soft skills, and motivation.",
        content: `### The STAR Screening Framework

Use the **STAR** method to elicit concrete behavioral and technical proof:

- **S - Situation**: What was the business context or challenge?
- **T - Task**: What was your specific responsibility?
- **A - Action**: What exact steps did you take?
- **R - Result**: What was the measurable business outcome?

#### Mandatory Telephonic Qualification Checklist:
1. **Current Employment**: Reason for looking for a change.
2. **Current CTC vs Expected CTC**: Breakdown of fixed vs variable.
3. **Official Notice Period**: Exact days, current resignation status, LWD.
4. **Location & Commute**: Distance from the client facility, willingness to relocate.
5. **Shift Willingness**: Rotational, day, or night shifts.`,
      },
      {
        lessonNumber: 4,
        slug: "handling-candidate-objections",
        title: "Handling Objections: Salary, Location & Shifts",
        estimatedMinutes: 12,
        summary: "Navigate candidate hesitation around compensation caps, travel distance, and working hours.",
        content: `### Handling Common Candidate Objections

#### 1. Salary Expectation Exceeds Budget:
- **Candidate:** *"I cannot consider anything below 8 LPA."* (Budget is 7 LPA).
- **Recruiter Response:** *"I completely respect your compensation goals, [Name]. Our approved budget is 7 LPA fixed, but it comes with performance bonuses, medical insurance, and clear appraisal milestones at 6 months. Considering this role offers leadership of a 10-person team which accelerates your career, would you be open to an interview to explore the full scope?"*

#### 2. Location & Travel Hesitation:
- **Candidate:** *"Electronic City is too far from my home in Hebbal."*
- **Recruiter Response:** *"The client provides designated point-to-point shuttle transportation from major metro stations, and the schedule includes hybrid options once probation is completed. Let us verify if the shuttle route covers your area."*

#### 3. Notice Period Concerns:
- Always negotiate early buyout options or leaves balance encashment with the candidate before submitting to the client.`,
      },
      {
        lessonNumber: 5,
        slug: "interview-coordination-mitigating-noshows",
        title: "Interview Lifecycle Coordination & Mitigating No-Shows",
        estimatedMinutes: 12,
        summary: "Coordinate calendars, prepare candidates, deliver reminder cadences, and minimize interview dropouts.",
        content: `### The 3-Touchpoint Interview Reminder System

Interview no-shows destroy recruiter credibility with hiring managers. Implement this strict protocol:

1. **Touchpoint 1 (Scheduling Day)**:
   - Send written calendar invite with date, time, interview format (Google Meet / In-person), panel details, and JD summary.
   - Require candidate to reply: *"Confirmed"*.
2. **Touchpoint 2 (Day Before Interview)**:
   - Call candidate in afternoon: *"Hi [Name], checking in regarding your interview tomorrow at 11 AM. Do you have any questions regarding the company or panel?"*
   - Share tips on company background and interview expectations.
3. **Touchpoint 3 (Morning of Interview - 2 Hours Prior)**:
   - WhatsApp message / quick SMS: *"Good morning [Name]! Your interview is at 11:00 AM. Please join the link / reach the reception 10 minutes early. Best wishes!"*

#### Immediate Action on Reschedules:
If a candidate flags an emergency, notify the client panel immediately with alternative available time slots. Never let the client wait in an empty meeting room.`,
      },
    ],
  },
  {
    moduleNumber: 5,
    slug: "recruitment-operations",
    title: "Module 5 — Recruitment Operations",
    description: "Pipeline management, database governance, tracker workflows, compliance, and client reporting.",
    passingScore: 70,
    lessons: [
      {
        lessonNumber: 1,
        slug: "principles-of-candidate-management",
        title: "Principles of Candidate Management",
        estimatedMinutes: 10,
        summary: "Learn candidate relationship management, transparent communication, and maintaining candidate dignity.",
        content: `### The Core Philosophy of Candidate Management

Candidate management is the systematic practice of engaging, tracking, and stewarding candidates throughout their evaluation journey.

#### Key Principles:
1. **Candidate Dignity & Respect**: Every candidate has invested time and emotional energy. Prompt, courteous communication is mandatory.
2. **Transparent Feedback**: Never leave a candidate hanging in limbo. If a candidate is rejected by a panel, inform them respectfully with actionable feedback.
3. **Data Accuracy**: Every phone call, screening note, expected salary figure, and interview outcome must be recorded accurately in operational systems.
4. **Talent Pool Nurturing**: A candidate who is not selected today may be the ideal hire for another client requisition next month.`,
      },
      {
        lessonNumber: 2,
        slug: "the-11-stage-recruitment-pipeline",
        title: "The 11-Stage Recruitment Pipeline",
        estimatedMinutes: 14,
        summary: "Deep dive into each of the 11 mandatory recruitment pipeline stages from Sourced to Joined.",
        content: `### The 11 Mandatory Stages of Candidate Progression

\`\`\`
1. Sourced -> 2. Contacted -> 3. Interested -> 4. Screened -> 5. Shortlisted -> 6. Interview Scheduled -> 7. Interview Attended -> 8. Selected -> 9. Offered -> 10. Offer Accepted -> 11. Joined
\`\`\`

#### Stage Definitions:
1. **Sourced**: Identified candidate profile saved into the requirement pool.
2. **Contacted**: Initial outbound email, phone call, or message initiated.
3. **Interested**: Candidate responds positively and confirms interest in learning more.
4. **Screened**: Telephonic qualification completed; must-haves, CTC, and notice verified.
5. **Shortlisted**: Profile vetted and approved for presentation to the client hiring manager.
6. **Interview Scheduled**: Client panel and candidate time confirmed; formal invite issued.
7. **Interview Attended**: Candidate verified as present and completed the interview rounds.
8. **Selected**: Client panel issues formal thumbs-up and requests offer rollout.
9. **Offered**: Official offer letter with salary breakdown and start date sent to candidate.
10. **Offer Accepted**: Candidate signs and returns formal offer acceptance.
11. **Joined**: Candidate reports on day 1, completes onboarding documentation, and joins payroll.`,
      },
      {
        lessonNumber: 3,
        slug: "pipeline-dispositions-dropoff-handling",
        title: "Pipeline Dispositions & Drop-off Management",
        estimatedMinutes: 10,
        summary: "Accurately document and manage non-selection outcomes: Rejected, Not Interested, No Response, On Hold, Dropout, and Absconded.",
        content: `### Outcome Dispositions

Candidates who do not complete the 11 progression stages must be categorized with standard operational outcomes:

1. **Rejected**: Failed technical panel, behavioral screening, or client evaluation criteria.
2. **Not Interested**: Candidate declined the opportunity after learning details (salary, shift, location).
3. **No Response**: Candidate did not answer 3 contact attempts across 48 hours.
4. **On Hold**: Client paused hiring for the role or requested candidate deferral.
5. **Dropout**: Candidate accepted an offer elsewhere or withdrew prior to joining date.
6. **Absconded**: Candidate confirmed joining, did not show up on day 1, and became unreachable.

#### Documentation Standard:
Always document the specific reason (e.g., *"Rejected - Lacked hands-on SAP MM inventory auditing"* or *"Dropout - Accepted counter-offer from current employer at 15% higher CTC"*).`,
      },
      {
        lessonNumber: 4,
        slug: "daily-recruitment-operations-hygiene",
        title: "Daily Operations & Tracker Hygiene",
        estimatedMinutes: 12,
        summary: "Master tracker maintenance, activity documentation, SLA compliance, and audit readiness.",
        content: `### Operational Discipline & Hygiene

A recruiter's tracker is the single source of operational truth. A messy tracker leads to lost candidates, duplicate calls, and client SLA failures.

#### Golden Rules of Tracker Hygiene:
1. **Real-Time Updates**: Update candidate status the moment an action happens. Never postpone updates to the end of the week.
2. **One Primary Record**: Never duplicate candidate entries. Link multiple interviews to the same master candidate profile.
3. **Mandatory Timestamps**: Record exact call dates, scheduled interview slots, and follow-up deadlines.
4. **Standard Nomenclature**: Use official company names, stage IDs, and verified phone numbers with country codes.
5. **Audit Preparedness**: Ensure all resume links, salary slips, and client feedback notes are attached to the candidate file.`,
      },
      {
        lessonNumber: 5,
        slug: "reporting-client-coordination-workflows",
        title: "Reporting & Client Coordination Workflows",
        estimatedMinutes: 12,
        summary: "Structure daily recruitment reports, format candidate submittal profiles, and manage client SLAs.",
        content: `### Delivering Enterprise Client Reports

Enterprise clients expect structured, predictable reporting:

#### 1. Daily Submission Report (End-of-Day EOD):
- Number of candidates sourced today.
- Number of screening calls conducted.
- Number of profiles submitted for shortlisting.
- Number of interviews scheduled for tomorrow.

#### 2. Candidate Submission Dossier:
When submitting a candidate to a client hiring manager, include:
- Candidate Name & Unique ID.
- Current Title & Organization.
- Total & Relevant Experience.
- Current CTC vs Expected CTC.
- Official Notice Period & Last Working Day.
- 3-Bullet Competency Summary highlighting must-have matches.

#### Dual-Control Report Approval:
At E2E Procurement, recruiters prepare their daily reports and submit them for Manager Review. Recruiters cannot approve their own reports; manager validation ensures audit accuracy and delivery excellence.`,
      },
    ],
  },
];

export async function seedAcademyCurriculum() {
  console.log("Seeding Academy curriculum (5 Modules, 25 Lessons)...");

  for (const modData of ACADEMY_CURRICULUM) {
    const { lessons, ...moduleFields } = modData;

    const moduleRecord = await prisma.module.upsert({
      where: { moduleNumber: moduleFields.moduleNumber },
      update: {
        title: moduleFields.title,
        slug: moduleFields.slug,
        description: moduleFields.description,
        passingScore: moduleFields.passingScore,
        orderIndex: moduleFields.moduleNumber,
      },
      create: {
        moduleNumber: moduleFields.moduleNumber,
        title: moduleFields.title,
        slug: moduleFields.slug,
        description: moduleFields.description,
        passingScore: moduleFields.passingScore,
        orderIndex: moduleFields.moduleNumber,
      },
    });

    for (const lessonData of lessons) {
      await prisma.lesson.upsert({
        where: {
          moduleId_lessonNumber: {
            moduleId: moduleRecord.id,
            lessonNumber: lessonData.lessonNumber,
          },
        },
        update: {
          title: lessonData.title,
          slug: lessonData.slug,
          summary: lessonData.summary,
          content: lessonData.content,
          estimatedMinutes: lessonData.estimatedMinutes,
          orderIndex: lessonData.lessonNumber,
        },
        create: {
          moduleId: moduleRecord.id,
          lessonNumber: lessonData.lessonNumber,
          slug: lessonData.slug,
          title: lessonData.title,
          summary: lessonData.summary,
          content: lessonData.content,
          estimatedMinutes: lessonData.estimatedMinutes,
          orderIndex: lessonData.lessonNumber,
        },
      });
    }
  }

  console.log("Academy curriculum successfully seeded into SQLite database.");
}
