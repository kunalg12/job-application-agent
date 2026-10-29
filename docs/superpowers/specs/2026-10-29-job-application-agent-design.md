# Job Application Agent & Interactive Dashboard - Design Specification

**Date:** 2026-10-29  
**Status:** In Review  
**Target User:** Kunal Gursal (AI Full Stack Developer) & general job seekers  
**Project Path:** `/home/kunal/workspace/job-application-agent`

---

## 1. Intent & The Why

Job hunting in today's market is a high-friction, repetitive, and time-consuming process. Candidates spend hours searching across disparate job boards, reading descriptions, tailoring resumes and cover letters for each position, finding recruiter contact details, and repeatedly filling out identical ATS application forms.

The **Job Application Agent & Interactive Dashboard** is an intelligent, autonomous job search and application copilot. It:
1. Automatically continuously discovers relevant tech and AI jobs matching the user's resume and target preferences.
2. Evaluates job fit using AI, scoring each job (0-100%) with detailed gap analysis and match justification.
3. Crafts hyper-tailored, professional cover letters and recruiter outreach emails for matched jobs.
4. Provides an elegant, responsive web dashboard for reviewing recommendations, tracking the job pipeline, and controlling agent automation.
5. Sends recruiter emails with attached resume and tailored cover letter PDFs via SMTP, and automatically fills ATS job applications (Greenhouse, Lever, etc.) using Playwright.
6. Gives the user total control: switch seamlessly between **Supervised Mode** (human reviews and clicks Send/Apply) and **Autonomous Mode** (auto-applies/emails if match score meets a configurable threshold like 85%+).

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
- **Automated Multi-Source Discovery:** Ingest jobs from RemoteOK, Arbeitnow, Jobicy APIs, plus manual job URL/text import (Greenhouse, Lever, LinkedIn, Indeed job links).
- **Intelligent Resume Parsing & Match Scoring:** Parse user resume (PDF/DOCX/text), extract core skills, experience, and projects; compute match scores (0-100%) against each job description using LLM reasoning.
- **Dynamic Tailoring:** Generate tailored, persuasive cover letters and cold outreach emails referencing specific user projects and job requirements.
- **Dual Application Modes:**
  - **Email Outreach:** Direct SMTP delivery to recruiters/HR with the candidate's actual resume PDF attached and generated cover letter.
  - **Web Application Automation:** Playwright-based ATS form autofiller and submitter for Greenhouse, Lever, and standard career portals.
- **Interactive Modern Dashboard:**
  - Pipeline Kanban/List view: Discovered → Matched → Review Queue → Applied/Sent → Interviewing → Rejected.
  - One-click actions: "Send Recruiter Email", "Auto-Fill Application", "Regenerate Cover Letter", "Archive".
  - Live configuration: Target job titles, min salary, remote filters, SMTP credentials, LLM API keys, automation mode toggle.
- **Safety & Deliverability:** Strict rate limiting, duplicate application prevention, preview before send in supervised mode, and transparent audit logging.

### 2.2 Non-Goals
- Attempting to bypass strict anti-bot captchas (e.g. Cloudflare Turnstile on heavily protected sites like Workday) in an aggressive way. When a site blocks automation or requires multi-factor auth, the agent gracefully degrades to "Ready for Manual Review" with all form answers pre-copied to clipboard.
- Acting as a bulk unsolicited spam engine. All emails are strictly single-recipient, highly tailored applications to designated job posts or hiring emails.

### 2.3 Anti-Goals
- Sending generic boilerplate spam emails that damage the candidate's professional reputation.
- Applying autonomously without user-configured guardrails or thresholds.
- Locking user credentials in proprietary cloud services. Everything runs locally on user's machine with local SQLite database and environment variables.

---

## 3. Architecture & Tech Stack

### 3.1 Tech Stack
- **Backend:** Python 3.14 + FastAPI + Uvicorn
  - Async REST API with background worker tasks.
  - Resume parser: `pypdf`, `pdfplumber`, regex text extractors.
  - Cover letter PDF generator: `reportlab` (generates clean, professional PDF cover letters on the fly).
  - Web scraping & job fetching: `httpx` (async HTTP client).
  - Browser Automation: `playwright` (async Python) for autofilling application forms.
  - Email Dispatcher: Python standard library `smtplib` + `email.mime` with TLS/SSL support (Gmail App Password, Outlook, custom SMTP).
  - Database: `sqlite3` / `aiosqlite` with lightweight ORM / schema.
  - LLM Integration: Google Gemini API (`google-genai` / REST) and OpenAI API compatible clients, with intelligent mock/heuristic fallback for offline/test mode.
- **Frontend Dashboard:**
  - React 18 / 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
  - Apple HIG & Linear-inspired clean, minimalist dark/light aesthetic.
  - Fast, responsive client-side UI talking to FastAPI backend on `http://127.0.0.1:8000`.

### 3.2 System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           Vite + React Dashboard (UI)                             |
|  [Job Feed & Match Scores]  [Review & Staging Queue]  [Profile]  [Agent Settings] |
+-----------------------------------------------------------------------------------+
                                         │  REST API (FastAPI)
                                         ▼
+-----------------------------------------------------------------------------------+
|                               FastAPI Backend Core                                |
|                                                                                   |
|  +-------------------+  +-----------------------+  +---------------------------+  |
|  | Ingestion Engine  |  | AI Match & Generator  |  | Application Engine        |  |
|  | - RemoteOK        |  | - Resume Parser       |  | - SMTP Email Dispatcher   |  |
|  | - Arbeitnow       |  | - Match Scorer        |  | - Playwright ATS Bot      |  |
|  | - Jobicy          |  | - Tailored Cover Ltr  |  | - PDF Generator           |  |
|  | - Manual URL/Text |  | - Cold Email Draft    |  | - Attachment Packager     |  |
|  +-------------------+  +-----------------------+  +---------------------------+  |
|                                         │                                         |
|                                         ▼                                         |
|                       SQLite Database (jobs, applications,                        |
|                               profile, config, logs)                              |
+-----------------------------------------------------------------------------------+
```

---

## 4. Key Workflows & Functional Specifications

### 4.1 Resume & Profile Management
- The system reads Kunal's default resume from `/home/kunal/Downloads/Kunal_Gursal_Resume.pdf` or accepts uploads via the dashboard.
- Extracts structured profile:
  - Personal info: Name, Email, Phone, Location, Portfolio, LinkedIn, GitHub.
  - Summary & Target Titles: e.g. "AI Full Stack Developer", "Full Stack Engineer", "GenAI Engineer".
  - Skills List: Languages, Frameworks, AI/ML tools, Cloud/DevOps.
  - Experience & Key Projects.
- User can edit target keywords, preferred locations (e.g. Remote, Worldwide, India), and excluded companies directly in Dashboard Settings.

### 4.2 Job Discovery & Ingestion
- Periodic or on-demand fetch from verified open job APIs:
  - RemoteOK API (`https://remoteok.com/api`)
  - Arbeitnow Job Board API (`https://www.arbeitnow.com/api/job-board-api`)
  - Jobicy Remote API (`https://jobicy.com/api/v2/remote-jobs`)
- Manual Job Import: User can paste a job post URL (or copy-paste raw job text); the backend extracts company, title, description, recruiter email, and application link.
- Deduplication: Normalized hash on (company + title + url) prevents duplicate records.

### 4.3 AI Fit Evaluation & Match Scoring
- Job descriptions are analyzed against user's resume.
- Output:
  - `match_score`: 0 to 100 percentage.
  - `verdict`: "High Match" (80-100), "Potential Match" (60-79), "Low Match" (<60).
  - `matched_skills`: e.g. `["React", "FastAPI", "Python", "LLM", "Docker"]`.
  - `missing_skills`: e.g. `["Kubernetes"]`.
  - `tailored_angle`: What specific accomplishment or experience Kunal should highlight for this job.

### 4.4 Tailored Document & Outreach Generation
- **Cold Email Pitch:** A punchy, 3-paragraph outreach email addressed to the hiring manager or recruiter.
- **Tailored Cover Letter:** A formal, beautifully formatted cover letter matching the job requirements to Kunal's background.
- **Cover Letter PDF Generation:** Backend converts the generated cover letter into an ATS-friendly, clean PDF styled consistently with modern typography.

### 4.5 Dispatch & Application Execution
1. **Recruiter Email Dispatch:**
   - Detects or allows input of recruiter/HR email address.
   - Attaches:
     - Resume PDF (`Kunal_Gursal_Resume.pdf`).
     - Generated Tailored Cover Letter PDF.
   - Sends via SMTP (with configured host, port, user, app password).
   - Marks status as `EMAIL_SENT` with timestamp and full email copy recorded in audit log.
2. **Automated ATS Application (Playwright):**
   - For supported ATS boards (Greenhouse, Lever, etc.):
   - Agent launches browser, loads application page, autofills:
     - First Name, Last Name, Email, Phone, LinkedIn, GitHub.
     - Uploads Resume PDF file.
     - Enters Cover Letter text into form.
   - If in **Supervised Mode**: Leaves browser open or pauses for user review before final click.
   - If in **Autonomous Mode**: Submits form and takes screenshot of confirmation page.

### 4.6 Dashboard Features & Layout
- **Header:** System status (Agent Active/Idle, Mode: Supervised/Autonomous), Quick "Find New Jobs" trigger, Settings button.
- **Metrics Bar:** Total Jobs Discovered | High Matches | Applied Today | Total Sent | Response Rate.
- **Navigation Tabs:**
  1. **Job Feed:** Filterable cards/table showing latest jobs with match score badges, company, tags, salary, and quick action buttons.
  2. **Review & Apply Queue:** Split-screen interface: left list of queued high-match jobs; right panel displaying job description, AI fit analysis, editable email draft, editable cover letter, and "Send Email" / "Auto-Apply" buttons.
  3. **Applications Tracker:** Kanban pipeline or table of all submitted applications with timestamps, status, notes, and direct job link.
  4. **Settings & Profile:** Resume preview & re-parse, email SMTP credentials test, target criteria, auto-apply thresholds.

---

## 5. Security, Privacy & Constraints

1. **Local-First Storage:** All data stored in a local SQLite database (`job_agent.db`). No user data sent to unauthorized third parties.
2. **Credential Safety:** Email passwords / app passwords stored in `.env` or local encrypted config, never committed to git.
3. **Email Rate Limiting:** Default maximum of 20 applications/emails per day to avoid spam flagging and preserve email domain reputation.
4. **Error Handling:** Resilient network timeouts, graceful fallbacks if an API is down, and clear error notifications in the UI.

---

## 6. What's Left to the Builder

- Exact component breakdown and folder structure (FastAPI `app/` and Vite `frontend/`).
- Specific prompt engineering templates for LLM match scoring and cover letter generation.
- Default configuration values (port 8000 for backend, port 5173 for frontend).
- Specific UI styling tokens (Tailwind classes).
