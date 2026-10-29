# 🤖 AI Job Application Agent

An intelligent, autonomous job application agent and interactive command center built for engineers. It ingests your resume, aggregates tech/AI job postings from remote boards (RemoteOK, Arbeitnow, Jobicy) or custom listings, calculates match fit scores (0–100%), generates tailored cover letters and cold outreach emails with PDF generation, sends personalized emails via SMTP, and assists with ATS autofill via Playwright.

---

## ✨ Features

- **Resume Parsing & Skill Extraction**:
  - Automatically extracts profile details, contact information, and 30+ technical keywords from your PDF resume (`pypdf`).
- **Multi-Source Job Aggregator**:
  - Real-time job ingestion from RemoteOK, Arbeitnow, Jobicy APIs and custom URL/job text import.
  - Automatically identifies recruiter emails and hiring manager contact channels.
- **Match Fit Scorer (0–100%)**:
  - Heuristic & LLM-ready evaluation based on role alignment, skill overlap, location preferences, and experience fit.
  - Generates candidate strengths, selling angles, and missing skill gap analysis.
- **Tailored Outreach & PDF Cover Letters**:
  - Generates personalized cold outreach emails and professional PDF cover letters using ReportLab.
- **SMTP Outreach Engine**:
  - Direct 1-click or autonomous email dispatch with attachments (Resume PDF + generated Cover Letter PDF) using SSL/TLS.
  - Configurable daily rate limiting (default 20 emails/day) to protect sender domain reputation.
- **Playwright ATS Autofill Assist**:
  - Automated field detection and autofill for common ATS platforms (Greenhouse, Lever, Ashby, Workday).
  - Pauses for human review on unmapped or complex questions with clipboard fallback payload.
- **Two Operating Modes**:
  - **Tier 1 (Default - Supervised 1-Click)**: Staged review queue allowing live edits before sending outreach or launching browser autofill.
  - **Tier 2 (Autonomous Auto-Pilot)**: Background scheduler that periodically ingests jobs, auto-stages matches exceeding the threshold (e.g., ≥85%), and executes applications automatically within safety rate limits.
- **Modern Interactive Dashboard**:
  - Built with React 19, TypeScript, and Tailwind CSS.
  - Split-screen review queue, live metrics bar, profile & skill editor, and application tracker with filterable statuses (`STAGED`, `SENT`, `AUTOFILL_PENDING`, `UNROUTABLE`, `FAILED`).

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Python 3.12+ / 3.14, FastAPI, `aiosqlite`, Pydantic v2, `pypdf`, ReportLab, Playwright, `httpx`, `aiosmtplib`.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React icons, Axios.
- **Database**: SQLite (WAL mode enabled) with schema for jobs, applications, candidate profile, settings, and audit logs.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+ (tested on Python 3.12 / 3.14)
- Node.js 18+ or [Bun](https://bun.sh)
- Google Chrome or Chromium for Playwright browser automation

### 1. Clone & Set Up Backend

```bash
git clone https://github.com/kunalg12/job-application-agent.git
cd job-application-agent

# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install fastapi uvicorn aiosqlite pydantic pydantic-settings httpx aiosmtplib pypdf reportlab playwright pytest pytest-asyncio

# Install Playwright browser binaries
playwright install chromium
```

### 2. Set Up Frontend

```bash
cd frontend
bun install   # or: npm install
bun run build # or: npm run build
```

### 3. Run the Development Servers

**Start Backend (FastAPI):**
```bash
# From repository root with .venv active
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Start Frontend (Vite):**
```bash
cd frontend
bun run dev   # or: npm run dev
```

Open your browser at `http://127.0.0.1:5173`.

---

## ⚙️ Configuration

1. **Profile Setup**:
   - Open the **Profile** modal in the dashboard.
   - Upload your Resume PDF or customize your contact details, target job titles, and skills.
2. **SMTP Outreach Setup**:
   - Open **Settings** in the dashboard.
   - Enter your SMTP credentials (e.g., Gmail SMTP `smtp.gmail.com:587` with an App Password).
   - Configure your autonomous threshold (e.g., 85%) and daily limit.

---

## 🧪 Running Tests

The test suite covers database isolation, resume parsing, job scrapers, match scoring, PDF generation, email verification, and API endpoints:

```bash
source .venv/bin/activate
pytest backend/tests/ -v
```

---

## 📄 License

MIT License. Built for autonomous job search and career empowerment.
