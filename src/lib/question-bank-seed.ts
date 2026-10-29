import { prisma } from "./prisma";

interface SeedQuestion {
  moduleNumber: number;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionText: string;
  explanation: string;
  options: Array<{
    optionText: string;
    isCorrect: boolean;
  }>;
}

export const QUESTION_BANK_DATA: SeedQuestion[] = [
  // ================= MODULE 1: RECRUITMENT FUNDAMENTALS =================
  {
    moduleNumber: 1,
    topic: "Recruitment Basics",
    difficulty: "EASY",
    questionText: "What is the primary organizational purpose of talent acquisition in enterprise operations?",
    explanation: "Talent acquisition strategically brings in qualified, culture-aligned professionals to execute business objectives, fill critical skill gaps, and minimize revenue downtime.",
    options: [
      { optionText: "Fulfilling headcount quotas regardless of candidate skill fit", isCorrect: false },
      { optionText: "Attracting, evaluating, and hiring qualified talent to drive business goals", isCorrect: true },
      { optionText: "Conducting administrative payroll and tax processing for staff", isCorrect: false },
      { optionText: "Managing company procurement of office hardware and supplies", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Metrics & TAT",
    difficulty: "MEDIUM",
    questionText: "In recruitment metrics, what does Turnaround Time (TAT) specifically measure?",
    explanation: "TAT measures the total calendar days from when an approved requisition is assigned to when the selected candidate accepts the offer or joins the company.",
    options: [
      { optionText: "The duration of an individual technical panel interview", isCorrect: false },
      { optionText: "Total calendar days from requisition assignment to offer acceptance or joining", isCorrect: true },
      { optionText: "The number of hours a candidate takes to submit their resume", isCorrect: false },
      { optionText: "The speed at which background verification agencies clear documents", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Compensation Structure",
    difficulty: "MEDIUM",
    questionText: "Which component of Cost to Company (CTC) is guaranteed to the employee on a monthly basis regardless of target achievements?",
    explanation: "Fixed CTC is the guaranteed monthly base pay that is not contingent upon quarterly or annual performance milestones.",
    options: [
      { optionText: "Variable performance bonus", isCorrect: false },
      { optionText: "Fixed base salary", isCorrect: true },
      { optionText: "Sales commission", isCorrect: false },
      { optionText: "Discretionary festive ex-gratia bonus", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "IT vs Non-IT Hiring",
    difficulty: "EASY",
    questionText: "Which of the following is a key operational characteristic often observed in Non-IT bulk recruitment compared to senior IT hiring?",
    explanation: "Non-IT recruitment frequently involves shorter notice periods (0-30 days), local commute feasibility, shift logistics, and high-velocity walk-in drives.",
    options: [
      { optionText: "Consistently longer 90-day contractual notice periods", isCorrect: false },
      { optionText: "Shorter notice periods, shift feasibility, and high-volume batch scheduling", isCorrect: true },
      { optionText: "Mandatory system architecture and algorithm design interview rounds", isCorrect: false },
      { optionText: "Exclusive reliance on GitHub code repositories for sourcing", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Recruiter Ethics",
    difficulty: "MEDIUM",
    questionText: "A recruiter receives a candidate's previous pay slips containing sensitive personal details. What is the recruiter's ethical responsibility?",
    explanation: "Candidate compensation data must be handled with strict confidentiality and used exclusively for authorized salary verification and offer modeling.",
    options: [
      { optionText: "Share the pay slips with other candidates to benchmark salaries", isCorrect: false },
      { optionText: "Maintain strict data confidentiality and share only with authorized compensation stakeholders", isCorrect: true },
      { optionText: "Post the compensation figures publicly on social professional groups", isCorrect: false },
      { optionText: "Discard the pay slips without verifying them with the compensation team", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Recruiter Roles",
    difficulty: "EASY",
    questionText: "What is the primary operational focus of a dedicated Talent Sourcer?",
    explanation: "A sourcer focuses on proactive candidate discovery, boolean search crafting, talent mapping, and initial pool generation.",
    options: [
      { optionText: "Issuing formal termination notices to departing employees", isCorrect: false },
      { optionText: "Conducting final executive compensation negotiation only", isCorrect: false },
      { optionText: "Candidate discovery, pipeline generation, and initial prospect outreach", isCorrect: true },
      { optionText: "Managing company payroll tax deductions and employee insurance", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Notice Buyout",
    difficulty: "HARD",
    questionText: "Under what condition can an employer execute a notice period buyout for a candidate?",
    explanation: "A buyout requires agreement between the hiring employer, the candidate, and the candidate's current employer permitting early release in lieu of notice pay.",
    options: [
      { optionText: "Whenever the candidate decides to leave without informing their employer", isCorrect: false },
      { optionText: "Only when the candidate's current employer officially allows buyout and agrees to early release", isCorrect: true },
      { optionText: "Notice buyout is strictly illegal across all Indian corporate enterprises", isCorrect: false },
      { optionText: "Only if the candidate has worked at the company for more than 5 years", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Joining Ratio",
    difficulty: "MEDIUM",
    questionText: "If an enterprise recruiter extends 20 formal offers and 16 candidates report on Day 1, what is the offer-to-join ratio?",
    explanation: "(Joined / Offered) * 100 = (16 / 20) * 100 = 80%.",
    options: [
      { optionText: "65%", isCorrect: false },
      { optionText: "75%", isCorrect: false },
      { optionText: "80%", isCorrect: true },
      { optionText: "90%", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Recruitment Lifecycle",
    difficulty: "EASY",
    questionText: "In the standard recruitment lifecycle, what stage immediately follows requirement calibration and intake?",
    explanation: "Once requirements are decoded and calibrated with the hiring team, the recruiter immediately initiates candidate sourcing.",
    options: [
      { optionText: "Offer letter rollout", isCorrect: false },
      { optionText: "Candidate sourcing and pipeline generation", isCorrect: true },
      { optionText: "Final salary disbursement", isCorrect: false },
      { optionText: "Post-joining background verification", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Talent Requisitions",
    difficulty: "EASY",
    questionText: "What does an approved 'Job Requisition' officially signify in an organization?",
    explanation: "An approved requisition confirms authorized budget and headcount allocation to hire for a specific job title.",
    options: [
      { optionText: "An informal verbal suggestion from a coworker", isCorrect: false },
      { optionText: "A formally authorized and budgeted opening with defined business requirements", isCorrect: true },
      { optionText: "An invoice submitted by a staffing vendor", isCorrect: false },
      { optionText: "A candidate's application submission confirmation", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Candidate Experience",
    difficulty: "EASY",
    questionText: "Why is prompt communication and transparent interview scheduling critical for employer branding?",
    explanation: "Transparent, respectful communication builds organizational trust, protects employer brand reputation, and reduces candidate dropouts.",
    options: [
      { optionText: "It satisfies mandatory legal filing requirements for tax audits", isCorrect: false },
      { optionText: "It builds organizational trust, protects employer reputation, and reduces candidate dropouts", isCorrect: true },
      { optionText: "It allows recruiters to artificially inflate their daily call volumes", isCorrect: false },
      { optionText: "It replaces the need for any technical evaluations", isCorrect: false },
    ],
  },
  {
    moduleNumber: 1,
    topic: "Cost Per Hire",
    difficulty: "MEDIUM",
    questionText: "What key expenses are factored into calculating the true Cost Per Hire (CPH) for an enterprise recruitment drive?",
    explanation: "Cost Per Hire accounts for recruiter payroll time, job portal advertising costs, assessment tooling fees, and candidate travel reimbursements.",
    options: [
      { optionText: "Only the candidate's first-month gross salary", isCorrect: false },
      { optionText: "Recruiter hours, job advertising subscriptions, assessment tools, and candidate interview expenses", isCorrect: true },
      { optionText: "The company's total annual facility rental expenditures", isCorrect: false },
      { optionText: "Only the lunch expenses incurred on the candidate's first day", isCorrect: false },
    ],
  },

  // ================= MODULE 2: JD DECODING =================
  {
    moduleNumber: 2,
    topic: "Must-Have vs Good-to-Have",
    difficulty: "EASY",
    questionText: "How should a recruiter treat a 'Good-to-Have' skill listed on a Job Description?",
    explanation: "Good-to-have skills represent value additions that can be trained on the job. Candidates meeting all must-haves should not be rejected over missing good-to-haves.",
    options: [
      { optionText: "As an absolute non-negotiable filter where any missing skill causes disqualification", isCorrect: false },
      { optionText: "As an advantageous secondary criterion that can be learned or trained on the job", isCorrect: true },
      { optionText: "As the only criterion that matters when calculating final salary", isCorrect: false },
      { optionText: "As a criterion to be completely ignored during client submittals", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Experience Evaluation",
    difficulty: "MEDIUM",
    questionText: "A candidate has 5 years total workforce experience, consisting of 2 years in customer support and 3 years in procurement buyer operations. What is their relevant experience for a Senior Buyer position?",
    explanation: "Relevant experience is strictly the duration spent performing the core duties required by the role (3 years in procurement).",
    options: [
      { optionText: "5 years", isCorrect: false },
      { optionText: "3 years", isCorrect: true },
      { optionText: "2 years", isCorrect: false },
      { optionText: "0 years", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Notice Period Verification",
    difficulty: "MEDIUM",
    questionText: "When a candidate claims to be an 'Immediate Joiner' because they have resigned, what official document should the recruiter verify?",
    explanation: "The official resignation acceptance email or letter from their current employer confirming their Last Working Day (LWD).",
    options: [
      { optionText: "Their college degree certificate", isCorrect: false },
      { optionText: "Official resignation acceptance email/letter confirming their Last Working Day (LWD)", isCorrect: true },
      { optionText: "Their bank account passbook", isCorrect: false },
      { optionText: "Their residential electricity bill", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Shift Calibration",
    difficulty: "EASY",
    questionText: "Why is it critical to calibrate shift timings (e.g. US night shifts or rotational schedules) during initial JD decoding?",
    explanation: "Shift timing directly influences candidate drop-off, transport logistics, safety compliance, and willingness to work unusual hours.",
    options: [
      { optionText: "To ensure candidates can schedule vacations easily", isCorrect: false },
      { optionText: "To assess transport feasibility, rotational willingness, and eliminate drop-offs early", isCorrect: true },
      { optionText: "To decrease the candidate's fixed base salary", isCorrect: false },
      { optionText: "Shifts have no operational impact on recruitment", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "JD Conversion",
    difficulty: "HARD",
    questionText: "What is the primary risk of creating overly restrictive sourcing filters with every single secondary keyword from a JD?",
    explanation: "Over-filtering creates an artificial talent shortage, shrinks the candidate pool to near zero, and stalls turnaround time.",
    options: [
      { optionText: "It results in too many qualified candidates applying at once", isCorrect: false },
      { optionText: "It causes artificial talent scarcity and excludes highly capable candidates who meet all core must-haves", isCorrect: true },
      { optionText: "It reduces the client's hiring budget automatically", isCorrect: false },
      { optionText: "It violates state labor recruitment guidelines", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Compensation Hike Calibration",
    difficulty: "MEDIUM",
    questionText: "A candidate earns 5 LPA fixed CTC and is demanding 11 LPA (120% hike) for a standard lateral move with an approved 7 LPA budget. What should the recruiter do?",
    explanation: "The recruiter should transparently share the approved client budget band (7 LPA) and assess whether the candidate is willing to align with realistic market hikes.",
    options: [
      { optionText: "Immediately promise the candidate 11 LPA without client approval", isCorrect: false },
      { optionText: "Explain the client budget ceiling (7 LPA) and evaluate if candidate will consider realistic market bands", isCorrect: true },
      { optionText: "Reject the candidate aggressively and report them to authorities", isCorrect: false },
      { optionText: "Fake the candidate's current CTC on the submission profile", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Job Title Calibration",
    difficulty: "EASY",
    questionText: "Why should recruiters evaluate functional responsibilities rather than relying solely on job titles across different companies?",
    explanation: "Job titles vary widely across organizations; a 'Team Lead' at a boutique firm may perform the duties of an 'Executive' at an enterprise.",
    options: [
      { optionText: "Job titles are legally binding and cannot be discussed", isCorrect: false },
      { optionText: "Titles lack cross-company standardization; responsibilities reflect actual hands-on capability", isCorrect: true },
      { optionText: "Candidates never put accurate job titles on their resumes", isCorrect: false },
      { optionText: "Client hiring managers only review salaries, never job titles", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Location Viability",
    difficulty: "MEDIUM",
    questionText: "What is an effective way to verify daily commute feasibility for an on-site role in Bangalore?",
    explanation: "Check candidate's exact residential area, distance in kilometers, travel time during peak traffic hours, and shuttle/metro accessibility.",
    options: [
      { optionText: "Assume any candidate living within 50 km can easily travel daily", isCorrect: false },
      { optionText: "Inquire about their exact locality, transit mode, and peak traffic commute time to the facility", isCorrect: true },
      { optionText: "Require candidates to move into company premises immediately", isCorrect: false },
      { optionText: "Only hire candidates who own private luxury vehicles", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Candidate Fitment",
    difficulty: "HARD",
    questionText: "A candidate has 4 job changes in the past 14 months with an average tenure of 3.5 months per job. How should a recruiter evaluate this fitment?",
    explanation: "Frequent short tenures without credible justification indicate high flight risk and instability, requiring rigorous probe before client submission.",
    options: [
      { optionText: "Immediately celebrate their ability to get hired quickly everywhere", isCorrect: false },
      { optionText: "Flag as a significant stability risk and probe the specific reasons for frequent transitions", isCorrect: true },
      { optionText: "Hide the previous companies from their resume before client review", isCorrect: false },
      { optionText: "Offer them a higher salary than stable candidates", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Sourcing Matrix Creation",
    difficulty: "MEDIUM",
    questionText: "What constitutes the core output of a successful JD decoding session?",
    explanation: "A clean sourcing matrix detailing role parameters, non-negotiable skills, keyword synonyms, and target boolean search strings.",
    options: [
      { optionText: "A printed contract ready for signature", isCorrect: false },
      { optionText: "A structured sourcing cheat sheet with verified criteria, synonyms, and search strings", isCorrect: true },
      { optionText: "A list of rejected past applicants", isCorrect: false },
      { optionText: "An invoice sent to the candidate for evaluation services", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Qualification Verification",
    difficulty: "EASY",
    questionText: "When a Job Description explicitly requires a mandatory 'Diploma in Mechanical Engineering', can a candidate with an unrelated qualification be shortlisted?",
    explanation: "Mandatory qualification criteria are non-negotiable compliance requirements unless an official waiver is documented in writing by the hiring manager.",
    options: [
      { optionText: "Yes, because all technical diplomas are interchangeable across engineering disciplines", isCorrect: false },
      { optionText: "No, mandatory qualifications are non-negotiable unless a formal waiver is documented", isCorrect: true },
      { optionText: "Yes, provided the candidate promises to study mechanical engineering in evening classes", isCorrect: false },
      { optionText: "Yes, if the candidate offers to accept a 50% salary reduction", isCorrect: false },
    ],
  },
  {
    moduleNumber: 2,
    topic: "Shift Calibration",
    difficulty: "MEDIUM",
    questionText: "Why must rotational shift readiness be validated during initial JD calibration before candidate screening begins?",
    explanation: "Validating shift logistics upfront prevents late-stage candidate dropouts after panel selection due to transportation or family constraints.",
    options: [
      { optionText: "Shift schedules are strictly secret and should never be discussed with candidates", isCorrect: false },
      { optionText: "Validating shift logistics upfront prevents late-stage dropouts due to transport or family constraints", isCorrect: true },
      { optionText: "To test whether candidates can memorize complex factory shift rosters during screening", isCorrect: false },
      { optionText: "Shift readiness has zero impact on manufacturing plant staffing", isCorrect: false },
    ],
  },

  // ================= MODULE 3: SOURCING & PREPARATION =================
  {
    moduleNumber: 3,
    topic: "Boolean Search Logic",
    difficulty: "EASY",
    questionText: "In a Boolean search string, which operator is used to broaden the search by including alternate terms and synonyms?",
    explanation: "The OR operator broadens results by matching profiles containing any of the connected synonyms (e.g., 'Buyer OR Procurement').",
    options: [
      { optionText: "AND", isCorrect: false },
      { optionText: "OR", isCorrect: true },
      { optionText: "NOT", isCorrect: false },
      { optionText: "NEAR", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Exact Phrase Matching",
    difficulty: "EASY",
    questionText: "What Boolean syntax must you apply to search for an exact multi-word phrase such as Supply Chain Management without splitting words?",
    explanation: "Double quotation marks (\"Supply Chain Management\") ensure the database matches the words in exact contiguous sequence.",
    options: [
      { optionText: "Parentheses: (Supply Chain Management)", isCorrect: false },
      { optionText: "Quotation marks: \"Supply Chain Management\"", isCorrect: true },
      { optionText: "Asterisks: *Supply Chain Management*", isCorrect: false },
      { optionText: "Hyphens: -Supply-Chain-Management-", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Active vs Passive Talent",
    difficulty: "MEDIUM",
    questionText: "Why do passive candidates generally exhibit lower interview drop-off and higher offer retention than active job board applicants?",
    explanation: "Passive candidates are not mass-applying to dozens of companies simultaneously; when they engage, they focus thoughtfully on the specific role.",
    options: [
      { optionText: "Passive candidates never negotiate compensation", isCorrect: false },
      { optionText: "They are selective, not actively competing across multiple simultaneous offer processes", isCorrect: true },
      { optionText: "Passive candidates are legally prohibited from declining offers", isCorrect: false },
      { optionText: "They have zero notice periods across all industries", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Exclusion Operator",
    difficulty: "MEDIUM",
    questionText: "You want to source software developers who know Python, but exclude developers who only have experience in WordPress. Which Boolean operator applies?",
    explanation: "The NOT operator (or minus symbol) excludes profiles containing the specified unwanted term (e.g., 'Python NOT WordPress').",
    options: [
      { optionText: "AND", isCorrect: false },
      { optionText: "OR", isCorrect: false },
      { optionText: "NOT (or minus sign)", isCorrect: true },
      { optionText: "XOR", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Technical Trades (ITI)",
    difficulty: "MEDIUM",
    questionText: "Which of the following trades is commonly sourced from Industrial Training Institutes (ITI) for manufacturing machine maintenance?",
    explanation: "Fitter, Electrician, Machinist, and Turner are core ITI trades specialized in industrial plant and machine maintenance.",
    options: [
      { optionText: "Full-Stack Web Development", isCorrect: false },
      { optionText: "Electrician / Fitter / Machinist", isCorrect: true },
      { optionText: "Certified Public Accountant", isCorrect: false },
      { optionText: "Investment Banker", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Parentheses in Boolean",
    difficulty: "HARD",
    questionText: "Why are parentheses ( ) mandatory when combining OR terms with AND terms in a search string?",
    explanation: "Parentheses establish mathematical precedence, ensuring the database groups all synonyms before combining them with mandatory AND criteria.",
    options: [
      { optionText: "They make the search string look visually appealing to hiring managers", isCorrect: false },
      { optionText: "They enforce order of operations so OR synonyms are grouped together before AND filtering", isCorrect: true },
      { optionText: "Search engines will crash if parentheses are omitted", isCorrect: false },
      { optionText: "Parentheses tell the engine to sort results alphabetically", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Sourcing Channels",
    difficulty: "EASY",
    questionText: "Which sourcing channel consistently yields the highest offer-to-join ratio and lowest 90-day employee attrition?",
    explanation: "Employee referrals provide built-in cultural validation, peer accountability, and high joining predictability.",
    options: [
      { optionText: "Cold unsolicited spam emails", isCorrect: false },
      { optionText: "Internal employee referral programs", isCorrect: true },
      { optionText: "Random social media comment scraping", isCorrect: false },
      { optionText: "Unverified third-party paper directories", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Sourcing Sprint Structure",
    difficulty: "MEDIUM",
    questionText: "In a dedicated 90-minute daily sourcing sprint, how should a recruiter allocate their focused time?",
    explanation: "Spend the initial 10 minutes setting up search strings, 60 minutes actively screening and contacting profiles, and 20 minutes logging pipeline data.",
    options: [
      { optionText: "Spend 90 minutes reading random articles online", isCorrect: false },
      { optionText: "10 mins string calibration, 60 mins focused screening & calling, 20 mins tracker hygiene", isCorrect: true },
      { optionText: "Only browse social profiles without logging any contact notes", isCorrect: false },
      { optionText: "Make 2 calls and stop for the rest of the day", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Diploma Engineering Sourcing",
    difficulty: "HARD",
    questionText: "When sourcing Polytechnic Diploma engineers for a production supervisor role, what key academic parameter must be verified?",
    explanation: "Verify state technical board / AICTE recognition of the polytechnic institute, branch specialization (Mechanical/Electrical), and standing backlogs.",
    options: [
      { optionText: "Their high school athletic trophies", isCorrect: false },
      { optionText: "AICTE/State Board recognition, branch relevance, and clearance of academic backlogs", isCorrect: true },
      { optionText: "Whether they own a laptop computer", isCorrect: false },
      { optionText: "Their overseas passport validity", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Social Sourcing Etiquette",
    difficulty: "EASY",
    questionText: "What is an important standard of conduct when messaging passive professionals on professional networking platforms?",
    explanation: "Personalize the outreach, mention specific achievements from their profile, explain the role clearly, and respect their response time.",
    options: [
      { optionText: "Send mass generic copy-paste messages to 500 people without customizing names", isCorrect: false },
      { optionText: "Personalize the outreach by referencing their specific domain background and value proposition", isCorrect: true },
      { optionText: "Demand their immediate phone number in the first sentence", isCorrect: false },
      { optionText: "Spam them repeatedly three times every hour", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Talent Mapping",
    difficulty: "HARD",
    questionText: "What is the strategic objective of conducting a competitor talent mapping exercise before opening a niche requisition?",
    explanation: "Talent mapping identifies organizational charts, title conventions, and talent densities across competitor firms to target passive talent directly.",
    options: [
      { optionText: "To file industrial espionage complaints against competitor companies", isCorrect: false },
      { optionText: "To identify org charts, title conventions, and talent densities across firms to target passive candidates", isCorrect: true },
      { optionText: "To copy competitors' internal employee payroll records without authorization", isCorrect: false },
      { optionText: "To eliminate the need for conducting candidate interviews", isCorrect: false },
    ],
  },
  {
    moduleNumber: 3,
    topic: "Direct Sourcing Channels",
    difficulty: "EASY",
    questionText: "Which sourcing channel typically yields candidates with higher cultural retention rates and faster time-to-hire in enterprise teams?",
    explanation: "Internal employee referral programs consistently demonstrate higher cultural alignment, faster joining rates, and higher 1-year retention.",
    options: [
      { optionText: "Unsolicited mass email campaigns to untargeted contacts", isCorrect: false },
      { optionText: "Internal employee referral networks and verified alumni channels", isCorrect: true },
      { optionText: "Purchasing unverified candidate phone lists from data brokers", isCorrect: false },
      { optionText: "Randomly messaging users on public photo sharing applications", isCorrect: false },
    ],
  },

  // ================= MODULE 4: COMMUNICATION & SCREENING =================
  {
    moduleNumber: 4,
    topic: "Phone Etiquette",
    difficulty: "EASY",
    questionText: "What is the very first thing a professional recruiter must do upon opening a cold screening call?",
    explanation: "Introduce themselves, state the company name, and politely verify if the candidate is in a convenient position to speak.",
    options: [
      { optionText: "Demand the candidate's current bank balance immediately", isCorrect: false },
      { optionText: "Introduce yourself, mention E2E Procurement, and ask if it is a convenient time to talk", isCorrect: true },
      { optionText: "Begin an aggressive technical interrogation without introducing yourself", isCorrect: false },
      { optionText: "Criticize the formatting of their uploaded resume", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "STAR Framework",
    difficulty: "MEDIUM",
    questionText: "In the STAR interview screening framework, what does the 'R' represent?",
    explanation: "R represents 'Result'—the measurable, quantifiable business outcome achieved from the candidate's specific actions.",
    options: [
      { optionText: "Requisition", isCorrect: false },
      { optionText: "Result (the measurable business outcome)", isCorrect: true },
      { optionText: "Recruiter", isCorrect: false },
      { optionText: "Resignation", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Handling No-Shows",
    difficulty: "MEDIUM",
    questionText: "What proactive scheduling cadence is proven to significantly minimize interview no-shows?",
    explanation: "A 3-touchpoint cadence: formal written invite on scheduling day, phone check-in 24 hours prior, and SMS/WhatsApp alert 2 hours before the interview.",
    options: [
      { optionText: "Send only one calendar invite and never contact the candidate again", isCorrect: false },
      { optionText: "A 3-touchpoint system: calendar invite, 24-hour reminder call, and 2-hour pre-interview alert", isCorrect: true },
      { optionText: "Threaten legal consequences if the candidate arrives 1 minute late", isCorrect: false },
      { optionText: "Call the candidate 50 times consecutively throughout the night", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Resume Red Flags",
    difficulty: "MEDIUM",
    questionText: "Which of the following is considered a potential resume discrepancy requiring deeper verification during screening?",
    explanation: "Vague year-only employment dates (e.g. '2023 - 2024') frequently conceal multi-month employment gaps or overlapping tenures.",
    options: [
      { optionText: "Listing professional certifications earned through accredited bodies", isCorrect: false },
      { optionText: "Vague year-only dates without months that obscure career gaps", isCorrect: true },
      { optionText: "Consistently having 3 to 4 years of tenure at previous employers", isCorrect: false },
      { optionText: "Including measurable percentage metrics in project descriptions", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Salary Objections",
    difficulty: "HARD",
    questionText: "A candidate refuses to proceed because the fixed budget is 50,000 INR below their target. What is an effective objection handling technique?",
    explanation: "Highlight total value: performance bonuses, health insurance, career leadership scope, and accelerated review milestones.",
    options: [
      { optionText: "Tell the candidate they do not deserve that much money", isCorrect: false },
      { optionText: "Present the total rewards package, career progression timeline, and performance incentives", isCorrect: true },
      { optionText: "Hang up the phone immediately without replying", isCorrect: false },
      { optionText: "Agree to pay the difference out of the recruiter's personal wallet", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Active Listening",
    difficulty: "EASY",
    questionText: "What does active listening entail during a telephonic candidate evaluation?",
    explanation: "Listening attentively without interrupting, noting specific keywords, paraphrasing to confirm understanding, and asking targeted follow-ups.",
    options: [
      { optionText: "Typing loud unrelated emails while the candidate is talking", isCorrect: false },
      { optionText: "Attentive focus, noting key claims, paraphrasing to verify, and asking structured follow-ups", isCorrect: true },
      { optionText: "Interrupting the candidate every 10 seconds to show authority", isCorrect: false },
      { optionText: "Allowing background television noise during the call", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Interview Rescheduling",
    difficulty: "MEDIUM",
    questionText: "If a candidate contacts you 3 hours before their interview citing a sudden medical emergency, what is your immediate operational action?",
    explanation: "Acknowledge courteously, notify the client panel immediately to preserve interviewer schedules, and secure alternative time slots.",
    options: [
      { optionText: "Block the candidate's phone number permanently", isCorrect: false },
      { optionText: "Inform the client panel promptly to respect their time and propose alternative rescheduled slots", isCorrect: true },
      { optionText: "Wait until the interview start time has passed before telling anyone", isCorrect: false },
      { optionText: "Blame the client for the candidate's medical emergency", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Candidate Debriefing",
    difficulty: "EASY",
    questionText: "Why must a recruiter conduct a debriefing call within 2 hours of a candidate completing an interview round?",
    explanation: "To capture candidate impressions while fresh, detect interest levels, address emerging doubts, and align on next steps with the client.",
    options: [
      { optionText: "To demand an immediate monetary tip from the candidate", isCorrect: false },
      { optionText: "To assess candidate interest while fresh, address concerns, and prepare client feedback", isCorrect: true },
      { optionText: "Debriefing calls are an unnecessary waste of recruiter time", isCorrect: false },
      { optionText: "To convince the candidate to withdraw from the process", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Notice Period Probe",
    difficulty: "HARD",
    questionText: "A candidate claims a 90-day notice period but promises they can 'manage release in 15 days'. What must the recruiter verify?",
    explanation: "Probe whether early release has been formally agreed by HR in writing, or if it is merely the candidate's wishful thinking.",
    options: [
      { optionText: "Accept their verbal promise without any formal documentation", isCorrect: false },
      { optionText: "Verify whether early release is formally confirmed in writing or just informal speculation", isCorrect: true },
      { optionText: "Advise the candidate to stop attending work tomorrow without notice", isCorrect: false },
      { optionText: "Report the candidate to state police authorities", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Candidate Preparation",
    difficulty: "MEDIUM",
    questionText: "What key briefing should a recruiter provide to a candidate before their final panel interview?",
    explanation: "Client background, panel format, expectations on must-have skills, advice to join 10 minutes early, and STAR answering tips.",
    options: [
      { optionText: "The home addresses and private phone numbers of the interviewers", isCorrect: false },
      { optionText: "Company context, panel expectations, format, STAR answering guidance, and punctuality tips", isCorrect: true },
      { optionText: "Encourage them to exaggerate their past management accomplishments", isCorrect: false },
      { optionText: "Tell them to avoid preparing so they sound completely spontaneous", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Active Listening",
    difficulty: "MEDIUM",
    questionText: "During an exploratory screening call, why should a recruiter practice active listening by allowing the candidate to speak the majority of the time?",
    explanation: "Allowing the candidate to speak reveals their authentic communication style, genuine motivations, and potential red flags.",
    options: [
      { optionText: "To finish administrative paperwork while the candidate is talking", isCorrect: false },
      { optionText: "To uncover authentic communication depth, genuine career motivations, and potential red flags", isCorrect: true },
      { optionText: "Because recruiters are prohibited from asking technical follow-up questions", isCorrect: false },
      { optionText: "To make the call take longer so daily call duration targets are met", isCorrect: false },
    ],
  },
  {
    moduleNumber: 4,
    topic: "Panel Feedback Calibration",
    difficulty: "HARD",
    questionText: "An interviewer submits a feedback scorecard stating simply 'Did not like candidate's vibe'. How should the recruiter address this evaluation?",
    explanation: "The recruiter must seek specific, objective, competency-based evidence from the interviewer rather than accepting subjective, unsubstantiated opinions.",
    options: [
      { optionText: "Immediately issue a rejection email citing bad vibes as the formal reason", isCorrect: false },
      { optionText: "Seek specific, objective, competency-based evidence and examples from the interviewer", isCorrect: true },
      { optionText: "Ignore the feedback completely and immediately roll out an employment offer", isCorrect: false },
      { optionText: "File a formal complaint against the candidate with local labor authorities", isCorrect: false },
    ],
  },

  // ================= MODULE 5: RECRUITMENT OPERATIONS =================
  // STRICT RULE: ZERO ATS TERMINOLOGY IN ANY OF THESE QUESTIONS OR EXPLANATIONS!
  {
    moduleNumber: 5,
    topic: "11-Stage Pipeline",
    difficulty: "EASY",
    questionText: "In the 11-stage recruitment pipeline, what stage immediately precedes 'Shortlisted'?",
    explanation: "Candidates must be evaluated through the 'Screened' stage to verify basic fitment before being shortlisted for the hiring manager.",
    options: [
      { optionText: "Offered", isCorrect: false },
      { optionText: "Screened", isCorrect: true },
      { optionText: "Joined", isCorrect: false },
      { optionText: "Interview Attended", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Candidate Management",
    difficulty: "EASY",
    questionText: "What is a foundational principle of professional Candidate Management throughout hiring operations?",
    explanation: "Maintaining candidate dignity, providing transparent feedback, and ensuring professional communication regardless of outcome.",
    options: [
      { optionText: "Ghosting candidates who fail technical evaluations without any update", isCorrect: false },
      { optionText: "Treating every candidate with dignity, prompt feedback, and professional respect", isCorrect: true },
      { optionText: "Selling candidate contact numbers to third-party marketing companies", isCorrect: false },
      { optionText: "Only replying to candidates who accept low compensation offers", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Pipeline Dispositions",
    difficulty: "MEDIUM",
    questionText: "A candidate confirmed offer acceptance but fails to report to the office on Day 1 and stops responding to calls. What is the standard operational disposition?",
    explanation: "When a confirmed candidate fails to show up on Day 1 and becomes completely unreachable, the disposition is recorded as 'Absconded'.",
    options: [
      { optionText: "Screened", isCorrect: false },
      { optionText: "Absconded", isCorrect: true },
      { optionText: "On Hold", isCorrect: false },
      { optionText: "Shortlisted", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Daily Operations Tracker Hygiene",
    difficulty: "MEDIUM",
    questionText: "Why is real-time candidate tracker updating considered mandatory operational hygiene for enterprise recruiters?",
    explanation: "Real-time updates prevent duplicate candidate calls, ensure reliable pipeline reporting, and maintain compliance with client SLAs.",
    options: [
      { optionText: "Trackers are only updated once a month for accounting purposes", isCorrect: false },
      { optionText: "It prevents duplicate candidate outreach, ensures accurate reporting, and upholds client SLAs", isCorrect: true },
      { optionText: "To make the computer monitor look busy during working hours", isCorrect: false },
      { optionText: "Trackers have zero operational value in recruitment workflows", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Manager Review & Approval",
    difficulty: "MEDIUM",
    questionText: "In E2E Procurement's governance framework, why are recruiters prohibited from approving their own daily reports?",
    explanation: "Dual-control validation by a manager ensures data integrity, verifies metric accuracy, and maintains audit compliance.",
    options: [
      { optionText: "Managers do not trust recruiters with basic typing", isCorrect: false },
      { optionText: "Dual-control manager approval ensures data integrity, audit compliance, and prevents falsification", isCorrect: true },
      { optionText: "To slow down daily reporting by several weeks", isCorrect: false },
      { optionText: "Recruiters are legally barred from writing reports", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Drop-off Disposition",
    difficulty: "EASY",
    questionText: "A candidate accepts an offer but informs the recruiter 5 days before joining that they have decided to stay with their current employer. What disposition applies?",
    explanation: "A candidate who backs out after accepting an offer is categorized as a 'Dropout'.",
    options: [
      { optionText: "Dropout", isCorrect: true },
      { optionText: "Joined", isCorrect: false },
      { optionText: "Interview Scheduled", isCorrect: false },
      { optionText: "Sourced", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Candidate Dossier Submittals",
    difficulty: "HARD",
    questionText: "When compiling a candidate submission dossier for a client hiring manager, what essential summary should be included?",
    explanation: "A concise 3-bullet summary highlighting how the candidate meets the non-negotiables, current vs expected CTC, and notice period.",
    options: [
      { optionText: "The candidate's full credit score history", isCorrect: false },
      { optionText: "A 3-bullet competency summary matching must-haves, CTC details, notice period, and stability", isCorrect: true },
      { optionText: "Personal political opinions of the candidate", isCorrect: false },
      { optionText: "A copy of the candidate's high school report cards", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Pipeline Sequencing",
    difficulty: "EASY",
    questionText: "Which stage comes immediately after 'Selected' in the 11-stage recruitment pipeline?",
    explanation: "Once a candidate is selected by the interview panel, the hiring team proceeds to the 'Offered' stage.",
    options: [
      { optionText: "Sourced", isCorrect: false },
      { optionText: "Offered", isCorrect: true },
      { optionText: "Contacted", isCorrect: false },
      { optionText: "Screened", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Outcome Documentation Standards",
    difficulty: "MEDIUM",
    questionText: "When logging a candidate disposition as 'Rejected', what documentation standard must the recruiter adhere to?",
    explanation: "Document specific, objective feedback from the panel (e.g. 'Lacked hands-on experience in vendor cost audits') rather than generic labels.",
    options: [
      { optionText: "Leave the notes field blank so no one asks questions", isCorrect: false },
      { optionText: "Record specific, objective reasons based on panel feedback to maintain audit integrity", isCorrect: true },
      { optionText: "Write subjective personal insults about the candidate", isCorrect: false },
      { optionText: "Delete the candidate's entire historical record from the database", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Client Coordination & SLA",
    difficulty: "HARD",
    questionText: "A client SLA requires candidate profiles to be submitted within 48 hours of requisition sign-off. What operational habit guarantees compliance?",
    explanation: "Initiating immediate sourcing sprints on day 1, calibrating must-haves upfront, and maintaining active pre-vetted talent pools.",
    options: [
      { optionText: "Waiting until the 47th hour before reading the job description", isCorrect: false },
      { optionText: "Immediate sourcing sprint execution, upfront calibration, and active pipeline pipelining", isCorrect: true },
      { optionText: "Asking the client to postpone their project deadlines indefinitely", isCorrect: false },
      { optionText: "Submitting unqualified profiles just to beat the 48-hour clock", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Offer Rollout Checklist",
    difficulty: "MEDIUM",
    questionText: "Before releasing a formal employment offer letter to a selected candidate, what critical approvals must be documented?",
    explanation: "Written approval of the compensation package from the business unit head and HR finance controller must be secured before offer release.",
    options: [
      { optionText: "Verbal consent from a coworker in the cafeteria", isCorrect: false },
      { optionText: "Documented written approvals of compensation and headcount from the business head and HR finance controller", isCorrect: true },
      { optionText: "Approval from the candidate's current employer", isCorrect: false },
      { optionText: "No internal approvals are required prior to sending formal offer contracts", isCorrect: false },
    ],
  },
  {
    moduleNumber: 5,
    topic: "Candidate Onboarding Preparation",
    difficulty: "EASY",
    questionText: "What proactive step should an enterprise recruiter execute 48 hours prior to a candidate's scheduled Day 1 joining date?",
    explanation: "Re-confirm reporting time, office address, required documentation, and workstation readiness to prevent Day 1 joining dropouts.",
    options: [
      { optionText: "Assume the candidate will show up and avoid contacting them until their first paycheck", isCorrect: false },
      { optionText: "Re-confirm reporting time, office address, required KYC documents, and workstation readiness", isCorrect: true },
      { optionText: "Request that the candidate cancel their health insurance immediately", isCorrect: false },
      { optionText: "Call the candidate every 30 minutes through the night before joining", isCorrect: false },
    ],
  },
];

export async function seedQuestionBank() {
  console.log("Seeding Assessment Engine & Question Bank...");

  // 1. Ensure Module Assessments exist for Modules 1 to 5
  for (let i = 1; i <= 5; i++) {
    const mod = await prisma.module.findUnique({
      where: { moduleNumber: i },
    });

    if (mod) {
      await prisma.assessment.upsert({
        where: { moduleId: mod.id },
        update: {
          title: `${mod.title} Assessment`,
          description: `Comprehensive evaluation for ${mod.title}. Minimum passing score is 70%.`,
          passingScore: 70,
          questionCount: 10,
          timeLimitMinutes: 15,
        },
        create: {
          moduleId: mod.id,
          type: "MODULE",
          slug: `assessment-module-${i}`,
          title: `${mod.title} Assessment`,
          description: `Comprehensive evaluation for ${mod.title}. Minimum passing score is 70%.`,
          passingScore: 70,
          questionCount: 10,
          timeLimitMinutes: 15,
        },
      });
    }
  }

  // 2. Ensure Final Assessment exists
  await prisma.assessment.upsert({
    where: { slug: "final-assessment" },
    update: {
      title: "Final Assessment",
      description: "Comprehensive 20-question capstone evaluation spanning all recruitment competencies. 20-minute timed evaluation, 70% passing benchmark.",
      passingScore: 70,
      questionCount: 20,
      timeLimitMinutes: 20,
    },
    create: {
      type: "FINAL",
      slug: "final-assessment",
      title: "Final Assessment",
      description: "Comprehensive 20-question capstone evaluation spanning all recruitment competencies. 20-minute timed evaluation, 70% passing benchmark.",
      passingScore: 70,
      questionCount: 20,
      timeLimitMinutes: 20,
    },
  });

  // 3. Seed Questions & Options
  for (const qData of QUESTION_BANK_DATA) {
    // Find matching assessment
    const targetModule = await prisma.module.findUnique({
      where: { moduleNumber: qData.moduleNumber },
      include: { assessment: true },
    });

    const assessmentId = targetModule?.assessment?.id || null;

    // Check if question exists by text
    const existingQ = await prisma.question.findFirst({
      where: { questionText: qData.questionText },
    });

    let questionId: string;

    if (!existingQ) {
      const createdQ = await prisma.question.create({
        data: {
          assessmentId,
          moduleNumber: qData.moduleNumber,
          topic: qData.topic,
          difficulty: qData.difficulty,
          questionText: qData.questionText,
          explanation: qData.explanation,
          isApproved: true,
          isActive: true,
        },
      });
      questionId = createdQ.id;

      // Create Options
      for (let idx = 0; idx < qData.options.length; idx++) {
        const opt = qData.options[idx];
        await prisma.questionOption.create({
          data: {
            questionId,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            orderIndex: idx + 1,
          },
        });
      }
    }
  }

  console.log(`Question Bank successfully seeded with ${QUESTION_BANK_DATA.length} approved questions.`);
}
