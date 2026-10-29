# E2E Recruiter Academy & Management Platform

A full-stack, enterprise-grade learning and workflow platform built for **E2E Procurement Pvt Ltd**. It empowers talent acquisition teams with interactive training modules, automated assessments, certification issuance, daily recruiter productivity tools, client management, and real-time manager/admin analytics.

---

## 🚀 Key Features

### 🎓 1. Recruiter Academy & Assessments
- **Curriculum Progression**: Interactive lessons, modules, and role-based training pipelines.
- **Dynamic Assessment Engine**: Timed evaluations with randomised question pools and auto-scoring.
- **Certificate Verification & Issuance**: Automated generation, approval workflows, and public verification tokens.
- **Recruiter Toolkit**: Centralized access to industry templates, pitch decks, job description frameworks, and screening guides.

### 💼 2. Recruiter Daily Workspace
- **Daily Checklist**: Interactive daily habit tracker tailored for executive search and procurement recruitment.
- **Pipeline Tracker**: Candidate stage tracking from initial outreach to offer acceptance.
- **Target Tracking & Metrics**: Real-time progress monitoring against monthly and quarterly placement goals.
- **Daily Work Reports**: Submit structured end-of-day accomplishment logs with manager visibility.

### 👥 3. Manager & Leadership Suite
- **Team Overview**: Real-time visibility into recruiter productivity, active submissions, and quota progress.
- **Approval Queue**: Review and approve certificates, high-value candidates, and target modifications.
- **Manager Insights**: Actionable signals highlighting pipeline bottlenecks and coaching opportunities.

### 🛡️ 4. Administration & Governance
- **Role-Based Access Control (RBAC)**: Secure multi-tier authentication (`ADMIN`, `MANAGER`, `CANDIDATE`) powered by signed JWTs in HTTP-only cookies.
- **Client & Role Management**: Manage client companies, active mandates, and recruiter assignments.
- **Audit Logs**: Tamper-evident logging of administrative actions, score modifications, and certification approvals.
- **Reports & Data Export**: Export team performance, audit logs, and candidate metrics to CSV.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with [SQLite](https://sqlite.org/) (zero external database configuration needed for local development)
- **Authentication**: Stateless, edge-compatible JWT authentication via `jose` and `bcryptjs`
- **Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/)

---

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.18.0 or newer, v20+ recommended)
- `npm` or `bun`

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adithyagd/master_learning.git
   cd master_learning
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

4. **Initialize and Seed the Database**:
   Push the schema to your local SQLite database and populate default users, academy curriculum, and question bank:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials (Development)

After seeding the database, you can log in with the following default accounts:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@e2epvtltd.com` | `Admin@E2E2025!Secure` |

*(Additional candidate accounts can be registered through the signup flow or seeded directly.)*

---

## 🧪 Testing

The repository includes a comprehensive Vitest test suite covering authentication, RBAC, academy progression, daily checklists, reporting, and management workflows:

```bash
# Run all unit and integration tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 📁 Project Structure

```text
├── docs/                # Architecture, deployment, and backup recovery documentation
├── prisma/
│   └── schema.prisma    # Complete database schema definition
├── scripts/
│   └── seed.ts          # Master seed script for curriculum, questions, & admin
├── src/
│   ├── actions/         # Server Actions for data mutations and business logic
│   ├── app/             # Next.js 15 App Router pages and API routes
│   │   ├── (auth)/      # Login, registration, password recovery
│   │   ├── academy/     # Academy modules, lessons, and assessment engine
│   │   ├── admin/       # Protected administrator dashboard & tools
│   │   ├── manager/     # Manager team view, approvals, and insights
│   │   └── workspace/   # Recruiter daily workspace, checklist, and pipeline
│   ├── components/      # Modular UI components, layout, and client widgets
│   ├── lib/             # Shared utilities, auth, database client, and seeds
│   └── middleware.ts    # Edge route protection and RBAC enforcement
└── tests/               # End-to-end integration and unit tests
```

---

## 📄 License

Proprietary software for E2E Procurement Pvt Ltd. All rights reserved.
