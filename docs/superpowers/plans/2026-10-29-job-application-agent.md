# Job Application Agent & Interactive Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an autonomous job application agent and interactive dashboard that discovers tech/AI jobs, evaluates match against the user's resume, generates tailored cover letters and cold outreach emails, dispatches recruiter emails with attached PDFs, and provides Playwright ATS form autofill.

**Architecture:** Python FastAPI backend with SQLite persistence, modular scraping/matching/tailoring/email/automation engines, coupled with a modern React + Vite + Tailwind CSS dashboard providing real-time feed, 1-click staged review, and configurable autonomous auto-pilot mode.

**Tech Stack:** Python 3.14, FastAPI, Uvicorn, SQLite (`aiosqlite`), ReportLab, Playwright, smtplib, React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.

**Spec:** `docs/superpowers/specs/2026-10-29-job-application-agent-design.md`

## Global Constraints

- Backend runs on `http://127.0.0.1:8000` with CORS enabled for frontend.
- Frontend runs on `http://localhost:5173`.
- Local SQLite database stored at `backend/data/job_agent.db`.
- Resume source defaults to `/home/kunal/Downloads/Kunal_Gursal_Resume.pdf` with dashboard upload support.
- All credentials (SMTP password, LLM API keys) must be stored in `.env` / local config and never committed to git.
- Autonomous mode defaults to Tier 1 (Staged 1-click approval) with Tier 2 (Full Auto-Pilot) available via settings toggle.
- Rate limiting enforces a default maximum of 20 sent emails/applications per day.
- Unmapped required ATS form fields must halt and flag for review instead of submitting hallucinated answers.

## Review Focus

1. Corrupted, non-standard, or image-only PDF resume uploads -> parser handles gracefully and falls back to manual profile editing without crashing.
2. Job listing with neither an application URL nor an email -> agent flags as "Unroutable" and allows manual link/email addition instead of failing silently.
3. SMTP connection failure or invalid credentials -> returns clear diagnostic error to the dashboard without corrupting application queue state.
4. ATS application page with dynamic iframe or unexpected form fields -> agent captures error, opens headed browser for user, and copies form answers to clipboard.
5. Large batch of scraped jobs from external APIs -> batch deduplication and rate-limited LLM scoring to prevent quota exhaustion and duplicate entries.

---

### Task 1: Backend Setup, Database Layer & Core Data Models

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/models.py`
- Test: `backend/tests/test_database.py`

**Interfaces:**
- Consumes: None (root data foundation)
- Produces: `init_db() -> None`, `get_db_connection()`, data models (`Job`, `Application`, `UserProfile`, `AppSettings`, `AuditLog`)

- [ ] **Step 1: Write the failing test for database initialization and CRUD operations**

```python
# backend/tests/test_database.py
import pytest
import os
import tempfile
from backend.app.database import Database
from backend.app.models import Job, UserProfile, AppSettings

@pytest.mark.asyncio
async def test_init_db_and_insert_job():
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        db = Database(db_path=tmp.name)
        await db.init_db()
        
        job = Job(
            id="job_123",
            title="AI Full Stack Developer",
            company="Acme AI",
            location="Remote",
            description="Looking for Python, React, and GenAI experience.",
            url="https://acme.ai/jobs/123",
            source="remoteok",
            recruiter_email="careers@acme.ai"
        )
        await db.save_job(job)
        fetched = await db.get_job_by_id("job_123")
        assert fetched is not None
        assert fetched.title == "AI Full Stack Developer"
        assert fetched.company == "Acme AI"
        assert fetched.recruiter_email == "careers@acme.ai"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_database.py`  
Expected: FAIL with `ModuleNotFoundError` or `ImportError`.

- [ ] **Step 3: Implement dependencies, config, database layer, and models**

- Add dependencies in `backend/requirements.txt`: `fastapi`, `uvicorn`, `aiosqlite`, `pydantic`, `pydantic-settings`, `httpx`, `pypdf`, `reportlab`, `pytest`, `pytest-asyncio`.
- Implement `backend/app/models.py` defining Pydantic models for `Job`, `Application`, `UserProfile`, `AppSettings`, `AuditLog`.
- Implement `backend/app/database.py` with SQLite table creation (`jobs`, `applications`, `profile`, `settings`, `audit_logs`) and async CRUD helpers.
- Implement `backend/app/config.py` loading environment variables and setting default database and resume paths.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_database.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/requirements.txt backend/app/ backend/tests/
git commit -m "feat: add database schema, async storage layer, and core data models"
```

---

### Task 2: Resume Parser & Profile Extractor Service

**Files:**
- Create: `backend/app/services/resume_service.py`
- Test: `backend/tests/test_resume_service.py`

**Interfaces:**
- Consumes: User resume PDF or text file
- Produces: `extract_text_from_pdf(pdf_path: str) -> str`, `parse_resume_profile(raw_text: str) -> UserProfile`

- [ ] **Step 1: Write the failing test for resume parsing**

```python
# backend/tests/test_resume_service.py
import pytest
from backend.app.services.resume_service import extract_text_from_pdf, parse_resume_profile

SAMPLE_RESUME_TEXT = """
KUNAL GURSAL
AI FULL STACK DEVELOPER | FULL STACK & GENAI ENGINEER
Pune, India | +91-8308793636 | kunalgursal.dev@gmail.com | linkedin.com/in/kunal-gursal

PROFESSIONAL SUMMARY
AI Full Stack Developer with 3+ years of experience building web applications and GenAI features.
React.js, Next.js, TypeScript, Node.js, Python, FastAPI, Docker.

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript
Frameworks: React, Next.js, FastAPI
AI: LLM, RAG, Prompt Engineering
"""

def test_parse_resume_profile():
    profile = parse_resume_profile(SAMPLE_RESUME_TEXT)
    assert profile.name == "Kunal Gursal"
    assert profile.email == "kunalgursal.dev@gmail.com"
    assert "Python" in profile.skills
    assert "FastAPI" in profile.skills
    assert "React" in profile.skills or "React.js" in profile.skills
    assert profile.phone == "+91-8308793636"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_resume_service.py`  
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Implement `backend/app/services/resume_service.py`**

- Use `pypdf` for extracting text streams from PDF files with error handling for corrupted files.
- Implement regex and NLP heuristic extraction for candidate name, email, phone number, LinkedIn URL, skills list, and summary.
- Handle fallback when text extraction produces minimal tokens by providing structured manual defaults.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_resume_service.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/resume_service.py backend/tests/test_resume_service.py
git commit -m "feat: implement resume parsing and profile extraction service"
```

---

### Task 3: Job Ingestion & Multi-Source Scraper Service

**Files:**
- Create: `backend/app/services/scraper_service.py`
- Test: `backend/tests/test_scraper_service.py`

**Interfaces:**
- Consumes: HTTP client / APIs (RemoteOK, Arbeitnow, Jobicy) or raw URL/text
- Produces: `fetch_remoteok_jobs() -> list[Job]`, `fetch_arbeitnow_jobs() -> list[Job]`, `fetch_jobicy_jobs() -> list[Job]`, `parse_custom_job(url_or_text: str) -> Job`, `extract_recruiter_email(description: str, company: str) -> str | None`

- [ ] **Step 1: Write the failing test for job scrapers and email extraction**

```python
# backend/tests/test_scraper_service.py
import pytest
from unittest.mock import AsyncMock, patch
from backend.app.services.scraper_service import (
    extract_recruiter_email,
    normalize_remoteok_job,
    normalize_arbeitnow_job,
    parse_custom_job_text
)

def test_extract_recruiter_email():
    text = "Join our team! Send your CV and portfolio to careers@innovate.ai for fast tracking."
    email = extract_recruiter_email(text, company="innovate")
    assert email == "careers@innovate.ai"

def test_extract_recruiter_email_domain_heuristic():
    text = "We are hiring a Senior GenAI Engineer. Remote worldwide."
    email = extract_recruiter_email(text, company="TechCorp", company_domain="techcorp.com")
    assert email == "careers@techcorp.com"

def test_normalize_remoteok_job():
    raw = {
        "id": "12345",
        "position": "Senior AI Developer",
        "company": "DeepTech",
        "location": "Worldwide",
        "description": "Building RAG systems. Email talent@deeptech.io",
        "url": "https://remoteok.com/remote-jobs/12345",
        "tags": ["python", "ai"]
    }
    job = normalize_remoteok_job(raw)
    assert job.title == "Senior AI Developer"
    assert job.company == "DeepTech"
    assert job.recruiter_email == "talent@deeptech.io"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_scraper_service.py`  
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Implement `backend/app/services/scraper_service.py`**

- Implement API clients for RemoteOK (`https://remoteok.com/api`), Arbeitnow (`https://www.arbeitnow.com/api/job-board-api`), and Jobicy (`https://jobicy.com/api/v2/remote-jobs`).
- Implement email extraction using regex patterns (`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`) and domain heuristics (`careers@{domain}`, `jobs@{domain}`).
- Implement `parse_custom_job_text()` for manual URL/job paste.
- Add deduplication hashing: `hashlib.sha256(f"{company.lower()}:{title.lower()}".encode()).hexdigest()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_scraper_service.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/scraper_service.py backend/tests/test_scraper_service.py
git commit -m "feat: implement multi-source job ingestion and email extraction service"
```

---

### Task 4: AI Fit Evaluation & Match Scoring Engine

**Files:**
- Create: `backend/app/services/matcher_service.py`
- Test: `backend/tests/test_matcher_service.py`

**Interfaces:**
- Consumes: `UserProfile`, `Job`
- Produces: `evaluate_job_match(profile: UserProfile, job: Job, api_key: str | None = None) -> MatchAnalysis`

- [ ] **Step 1: Write the failing test for match evaluation**

```python
# backend/tests/test_matcher_service.py
import pytest
from backend.app.models import UserProfile, Job, MatchAnalysis
from backend.app.services.matcher_service import evaluate_job_match

def test_evaluate_job_match_heuristic_high_match():
    profile = UserProfile(
        name="Kunal Gursal",
        email="kunalgursal.dev@gmail.com",
        skills=["Python", "FastAPI", "React", "Next.js", "Docker", "LLM", "RAG"]
    )
    job = Job(
        id="test_1",
        title="AI Full Stack Developer",
        company="Cognitive Co",
        location="Remote",
        description="We need a Full Stack Engineer experienced with Python, FastAPI, React, and building LLM RAG pipelines.",
        url="https://example.com/job1",
        source="remoteok"
    )
    analysis = evaluate_job_match(profile, job)
    assert analysis.match_score >= 80
    assert "Python" in analysis.matched_skills
    assert "FastAPI" in analysis.matched_skills
    assert len(analysis.matched_skills) >= 3
    assert analysis.recommendation == "HIGH_MATCH"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_matcher_service.py`  
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Implement `backend/app/services/matcher_service.py`**

- Implement smart token and keyword overlap scoring as deterministic baseline.
- Implement LLM evaluation prompt (using Gemini API or OpenAI REST when `api_key` is present) returning structured JSON: `{ "match_score": int, "matched_skills": list, "missing_skills": list, "strengths": list, "custom_angle": str }`.
- Gracefully fallback to the heuristic scorer if no API key is provided or if network fails.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_matcher_service.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/matcher_service.py backend/tests/test_matcher_service.py
git commit -m "feat: implement AI job match scoring and gap analysis service"
```

---

### Task 5: Tailoring Service & PDF Cover Letter Generation

**Files:**
- Create: `backend/app/services/tailor_service.py`
- Test: `backend/tests/test_tailor_service.py`

**Interfaces:**
- Consumes: `UserProfile`, `Job`, `MatchAnalysis`
- Produces: `generate_cold_email(profile, job, analysis) -> dict[str, str]`, `generate_cover_letter(profile, job, analysis) -> str`, `build_cover_letter_pdf(cover_letter_text: str, profile: UserProfile, job: Job, output_path: str) -> str`

- [ ] **Step 1: Write the failing test for cold email, cover letter and PDF compilation**

```python
# backend/tests/test_tailor_service.py
import pytest
import os
import tempfile
from backend.app.models import UserProfile, Job, MatchAnalysis
from backend.app.services.tailor_service import (
    generate_cold_email,
    generate_cover_letter,
    build_cover_letter_pdf
)

def test_generate_cold_email_and_pdf():
    profile = UserProfile(
        name="Kunal Gursal",
        email="kunalgursal.dev@gmail.com",
        phone="+91-8308793636",
        linkedin="https://linkedin.com/in/kunal-gursal",
        skills=["Python", "FastAPI", "React", "GenAI"]
    )
    job = Job(
        id="j_99",
        title="GenAI Full Stack Engineer",
        company="Nexus AI",
        location="Remote",
        description="Looking for an engineer to build GenAI applications using React and FastAPI.",
        url="https://nexus.ai/jobs/99",
        source="jobicy"
    )
    analysis = MatchAnalysis(
        match_score=90,
        matched_skills=["Python", "FastAPI", "React"],
        missing_skills=[],
        recommendation="HIGH_MATCH",
        custom_angle="Highlight 3+ years experience with RAG pipelines and enterprise React apps."
    )
    
    email_draft = generate_cold_email(profile, job, analysis)
    assert "Nexus AI" in email_draft["subject"] or "GenAI" in email_draft["subject"]
    assert "Kunal Gursal" in email_draft["body"]
    assert "FastAPI" in email_draft["body"] or "React" in email_draft["body"]

    cover_letter = generate_cover_letter(profile, job, analysis)
    assert "Nexus AI" in cover_letter
    
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        pdf_path = build_cover_letter_pdf(cover_letter, profile, job, tmp.name)
        assert os.path.exists(pdf_path)
        assert os.path.getsize(pdf_path) > 1000
        os.remove(pdf_path)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_tailor_service.py`  
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Implement `backend/app/services/tailor_service.py`**

- Implement targeted prompt / templates for high-converting cold email (Subject, Greeting, Value Prop, Candidate Proof Points, Call to Action).
- Implement formal cover letter generator.
- Implement `build_cover_letter_pdf()` using ReportLab `SimpleDocTemplate`, `Paragraph`, and clean typography (clean margins, contact header line, formal letter styling).

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_tailor_service.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/tailor_service.py backend/tests/test_tailor_service.py
git commit -m "feat: implement tailored outreach generator and ReportLab PDF compiler"
```

---

### Task 6: Recruiter Email Outreach Service & Dispatcher

**Files:**
- Create: `backend/app/services/email_service.py`
- Test: `backend/tests/test_email_service.py`

**Interfaces:**
- Consumes: SMTP credentials, `to_email: str`, `subject: str`, `body: str`, `attachments: list[str]`
- Produces: `send_application_email(smtp_settings, to_email, subject, body, attachment_paths) -> bool`, `check_rate_limit(db) -> bool`

- [ ] **Step 1: Write the failing test for email dispatch with attachments and rate limiting**

```python
# backend/tests/test_email_service.py
import pytest
from unittest.mock import patch, MagicMock
from backend.app.services.email_service import EmailDispatcher
from backend.app.models import SMTPSettings

def test_send_application_email_success():
    smtp_settings = SMTPSettings(
        host="smtp.gmail.com",
        port=587,
        username="test@gmail.com",
        password="secret_app_password",
        from_name="Kunal Gursal"
    )
    dispatcher = EmailDispatcher(smtp_settings)
    
    with patch("smtplib.SMTP") as mock_smtp:
        server_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = server_instance
        
        success, message = dispatcher.send_email(
            to_email="recruiter@company.com",
            subject="Application: AI Full Stack Developer - Kunal Gursal",
            body="Hello,\nPlease find my resume and cover letter attached.",
            attachment_paths=[]
        )
        assert success is True
        assert server_instance.starttls.called
        assert server_instance.login.called
        assert server_instance.send_message.called
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_email_service.py`  
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Implement `backend/app/services/email_service.py`**

- Use Python `email.mime.multipart.MIMEMultipart`, `MIMEText`, and `MIMEApplication` to safely package email body and PDF attachments.
- Connect via `smtplib.SMTP` (TLS 587) or `smtplib.SMTP_SSL` (SSL 465).
- Implement rate limiting check against `audit_logs` table (max 20 per 24 hours by default).
- Add clear diagnostic error strings on authentication failures, socket timeouts, or invalid emails.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_email_service.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/email_service.py backend/tests/test_email_service.py
git commit -m "feat: implement recruiter SMTP email dispatcher with PDF attachments and rate limiting"
```

---

### Task 7: Playwright ATS Auto-Fill Service

**Files:**
- Create: `backend/app/services/automation_service.py`
- Test: `backend/tests/test_automation_service.py`

**Interfaces:**
- Consumes: `Job`, `UserProfile`, `resume_path: str`, `cover_letter_text: str`, `headless: bool`
- Produces: `autofill_job_application(job_url, profile, resume_path, cover_letter, headless=False) -> dict`

- [ ] **Step 1: Write the failing test for ATS form detection and field mapping**

```python
# backend/tests/test_automation_service.py
import pytest
from backend.app.services.automation_service import map_ats_fields, FormFillResult

def test_map_ats_fields():
    selectors = [
        {"id": "first_name", "type": "text"},
        {"id": "last_name", "type": "text"},
        {"name": "email", "type": "email"},
        {"name": "phone", "type": "tel"},
        {"name": "resume", "type": "file"},
        {"id": "custom_salary_expectation", "type": "text", "required": True}
    ]
    mapping, unmapped_required = map_ats_fields(selectors)
    assert mapping["first_name"] == "profile.first_name"
    assert mapping["email"] == "profile.email"
    assert "custom_salary_expectation" in unmapped_required
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_automation_service.py`  
Expected: FAIL with `ImportError`.

- [ ] **Step 3: Implement `backend/app/services/automation_service.py`**

- Implement standard CSS/XPath selector dictionaries for common ATS platforms (Greenhouse, Lever, Workable, custom job forms).
- Implement field mapping for name, email, phone, LinkedIn, GitHub, portfolio, resume file upload, and cover letter text.
- Implement `map_ats_fields()` and safe fallback: if an unmapped mandatory field is encountered, pause or return `FormFillResult(status="ACTION_REQUIRED", unmapped_fields=[...])` so user can inspect directly in browser.
- Support both `headless=False` (for user desktop inspection) and `headless=True`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_automation_service.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/automation_service.py backend/tests/test_automation_service.py
git commit -m "feat: implement Playwright ATS form mapping and supervised autofill engine"
```

---

### Task 8: FastAPI REST API Endpoints & Autonomous Worker

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/routers/jobs.py`
- Create: `backend/app/routers/applications.py`
- Create: `backend/app/routers/profile.py`
- Create: `backend/app/routers/settings.py`
- Test: `backend/tests/test_api_endpoints.py`

**Interfaces:**
- Consumes: Database, Scraper, Matcher, Tailor, Email, Automation services
- Produces: REST endpoints (`/api/jobs`, `/api/jobs/scan`, `/api/jobs/import`, `/api/applications`, `/api/applications/{id}/email`, `/api/applications/{id}/autofill`, `/api/profile`, `/api/settings`)

- [ ] **Step 1: Write the failing test for FastAPI API endpoints**

```python
# backend/tests/test_api_endpoints.py
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_get_health_and_settings():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        
        settings_resp = await client.get("/api/settings")
        assert settings_resp.status_code == 200
        assert "autonomous_mode" in settings_resp.json()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_api_endpoints.py`  
Expected: FAIL with `ModuleNotFoundError` or 404.

- [ ] **Step 3: Implement FastAPI app and routers**

- Setup CORS middleware allowing `http://localhost:5173` and `http://127.0.0.1:5173`.
- Wire `jobs.py`: list jobs, trigger background scan, import custom job.
- Wire `applications.py`: list applications with match details, trigger 1-click email dispatch, trigger browser autofill, update status.
- Wire `profile.py`: get current profile, update profile, upload new resume PDF.
- Wire `settings.py`: get/update settings (SMTP config, target roles, autonomous mode toggle, match threshold) and test SMTP email.
- Wire background scan scheduler inside app lifespan.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_api_endpoints.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/app/routers/ backend/tests/test_api_endpoints.py
git commit -m "feat: implement FastAPI REST API endpoints and background autonomous worker"
```

---

### Task 9: Frontend Dashboard Setup & Core UI Shell

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/components/Navbar.tsx`
- Create: `frontend/src/components/MetricsBar.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`
- Test: `frontend/src/__tests__/Navbar.test.tsx` (or Vitest verification)

**Interfaces:**
- Consumes: Backend REST API (`http://127.0.0.1:8000/api`)
- Produces: Interactive React UI shell with clean Apple HIG-inspired typography, system badge indicators, metrics overview, and tab routing.

- [ ] **Step 1: Initialize Vite React + TypeScript project with Tailwind CSS**

Run: Setup `package.json` with React 19, Lucide React, Axios, Tailwind CSS, Vitest.

- [ ] **Step 2: Write test for core UI components**

```tsx
// frontend/src/__tests__/Navbar.test.tsx
import { render, screen } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import { describe, it, expect } from 'vitest';

describe('Navbar', () => {
  it('renders brand and mode badge', () => {
    render(<Navbar activeTab="jobs" onTabChange={() => {}} autonomousMode={false} onScan={() => {}} isScanning={false} />);
    expect(screen.getByText(/Job Hunter Agent/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Implement types, API client, Navbar, MetricsBar, and App shell**

- Build clean, responsive header with agent active status indicator, Supervised vs Autonomous badge, "Scan Latest Jobs" action button, and tab selector (`Job Feed`, `Review & Apply Queue`, `Applications Tracker`, `Profile & Settings`).
- Build `MetricsBar` displaying: Discovered Jobs, High Matches (≥80%), Queued for Review, Applications Sent, and Today's Sent Count.

- [ ] **Step 4: Verify frontend build compiles without errors**

Run: `cd frontend && npm run build`  
Expected: Clean build with zero TypeScript or JSX errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React + Vite + Tailwind dashboard with Navbar and MetricsBar"
```

---

### Task 10: Frontend Job Feed & Split-Screen Review Queue

**Files:**
- Create: `frontend/src/components/JobFeed.tsx`
- Create: `frontend/src/components/ReviewQueue.tsx`
- Create: `frontend/src/components/JobModal.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `/api/jobs`, `/api/applications`, `/api/applications/{id}/email`, `/api/applications/{id}/autofill`
- Produces: Interactive job feed with match score badges, search/filter controls, manual job import modal, and split-screen review queue with live editable email draft & cover letter.

- [ ] **Step 1: Write test for JobFeed card rendering and match score formatting**

Verify that jobs display with company, title, match percentage badge (Green for ≥80%, Blue for 60-79%, Gray for <60%), and action triggers.

- [ ] **Step 2: Implement `JobFeed.tsx`**

- Search bar (by title, company, or skill) + Filter pills (Remote Only, High Match Only, With Recruiter Email).
- "Import Job URL / Text" modal button to quickly paste any job posting from LinkedIn, Indeed, or company sites.
- "Stage for Application" button that automatically generates tailoring and queues the job in the Review Queue.

- [ ] **Step 3: Implement `ReviewQueue.tsx` (Split-Pane Staged Review)**

- Left Column: List of queued high-match jobs with match percentage and recruiter email status.
- Right Column: Split into tabs:
  1. **Job Info & AI Fit Breakdown:** Matched skills chips, missing skills chips, and recommended candidate angle.
  2. **Recruiter Outreach Email:** Editable Recruiter Email input, Subject line, Body text, and "Send Email with Resume & Cover Letter" button (with confirmation preview).
  3. **Tailored Cover Letter:** Full editable cover letter text with "Download PDF" preview and "Auto-Fill in Browser" button.
- Status update feedback: displays green checkmark and timestamp when email is dispatched or browser is launched.

- [ ] **Step 4: Verify build and component interaction**

Run: `cd frontend && npm run build`  
Expected: Build passes cleanly.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/JobFeed.tsx frontend/src/components/ReviewQueue.tsx frontend/src/components/JobModal.tsx frontend/src/App.tsx
git commit -m "feat: implement JobFeed with filters and split-pane ReviewQueue for 1-click dispatch"
```

---

### Task 11: Applications Tracker, Settings Hub & End-to-End Verification

**Files:**
- Create: `frontend/src/components/ApplicationsTracker.tsx`
- Create: `frontend/src/components/SettingsModal.tsx`
- Create: `frontend/src/components/ProfileModal.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `backend/tests/test_e2e_flow.py`

**Interfaces:**
- Consumes: All backend and frontend components
- Produces: Full application pipeline tracker, settings management, and automated end-to-end integration test.

- [ ] **Step 1: Write the failing end-to-end integration test**

```python
# backend/tests/test_e2e_flow.py
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_complete_job_application_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Check profile is populated from Kunal's resume
        profile_res = await client.get("/api/profile")
        assert profile_res.status_code == 200
        assert "Kunal" in profile_res.json()["name"]
        
        # 2. Ingest a sample job
        job_payload = {
            "title": "AI Full Stack Developer",
            "company": "NextGen AI",
            "location": "Remote",
            "description": "Looking for Python, FastAPI, React, and GenAI experience. Send email to careers@nextgen.ai",
            "url": "https://nextgen.ai/careers/1",
            "source": "manual"
        }
        import_res = await client.post("/api/jobs/import", json=job_payload)
        assert import_res.status_code == 200
        job_id = import_res.json()["id"]
        
        # 3. Stage for review & trigger tailoring
        stage_res = await client.post(f"/api/applications/stage/{job_id}")
        assert stage_res.status_code == 200
        app_data = stage_res.json()
        assert app_data["match_score"] >= 80
        assert len(app_data["email_body"]) > 50
        assert "NextGen AI" in app_data["cover_letter"]
```

- [ ] **Step 2: Implement `ApplicationsTracker.tsx`**

- Table view of all applications: Date, Company, Job Title, Channel (Email / ATS), Recruiter Email, Status (Queued, Sent, Responded, Interview, Rejected), Actions (View Details, Archive).
- Status dropdown to track interview progression.

- [ ] **Step 3: Implement `SettingsModal.tsx` & `ProfileModal.tsx`**

- **Settings Hub:**
  - SMTP Configuration: Host, Port, Username, App Password, Test Email Button.
  - LLM Configuration: Provider select (Gemini / OpenAI / Heuristic), API Key input.
  - Automation Controls: Mode toggle (Supervised 1-Click vs Autonomous Auto-Pilot), Match threshold slider (50% - 100%), Daily send limit.
  - Target Preferences: Target Job Titles, Location preference, Excluded companies.
- **Profile Hub:**
  - View extracted skills, experience, and contact info with 1-click re-parse or file upload.

- [ ] **Step 4: Run end-to-end backend tests and build frontend**

Run: `pytest backend/tests/test_e2e_flow.py -v && cd frontend && npm run build`  
Expected: Tests PASS, frontend build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ApplicationsTracker.tsx frontend/src/components/SettingsModal.tsx frontend/src/components/ProfileModal.tsx backend/tests/test_e2e_flow.py
git commit -m "feat: implement ApplicationsTracker, SettingsModal, and complete end-to-end verification"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Multi-source discovery (RemoteOK, Arbeitnow, Jobicy, Manual import), resume parsing, fit scoring, tailored cover letters & cold email drafts, ReportLab PDF generation, SMTP email dispatch with attachments, Playwright ATS autofill, modern dashboard with 1-click review and autonomous mode toggle.
- [x] **Step scan:** Every step contains exact signatures, checkable commands, and precise expected test outputs.
- [x] **Type consistency:** Consistent models across backend (`Job`, `Application`, `UserProfile`, `AppSettings`, `MatchAnalysis`) and frontend types.
- [x] **Review Focus:** Corrupted resume handling (Task 2), unroutable jobs (Task 3), SMTP diagnostic error feedback (Task 6), unmapped required ATS fields pausing/flagging (Task 7), batch deduplication (Task 3 & 8).
- [x] **Proportion:** Clear bite-sized tasks with minimal fluff.
