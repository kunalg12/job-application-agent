# AI Interview Notetaker & Application CRM SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-user Job Application Agent into a multi-tenant SaaS application that enables job seekers to track company interview rounds, record voice memos, forward recruiter emails, and receive AI-structured scorecards and round prep briefings.

**Architecture:** Multi-tenant FastAPI backend with SQLite/PostgreSQL WAL isolation, Gemini 1.5/2.0 / OpenAI multi-modal contextual parser (Audio transcription + Email Webhook + Text Scratchpad), React 19 Apple Design System frontend with macOS Split-View, visual audio recorder, and round timeline CRM.

**Tech Stack:** Python 3.12+, FastAPI, Pydantic v2, `aiosqlite`/`asyncpg`, Google Gemini API / OpenAI Whisper, ReportLab, React 19, TypeScript, Vite, Tailwind CSS, Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-10-29-ai-interview-notetaker-saas-design.md`

## Global Constraints

- Preserve all existing 24 unit/integration/adversarial tests while adding SaaS interview round schemas.
- All database queries must isolate records by `user_id` or session tenant token.
- Support multi-modal inputs: Inbound text, Email payload, and Audio files (`.webm`, `.mp3`, `.wav`, `.m4a`).
- Adhere strictly to the Apple Design System (HIG): SF Pro typography, 8pt grid, translucent frosted materials, Apple buttons, and native 51x31px toggle controls.

## Review Focus

1. **Audio File Size & Token Exhaustion**: Long voice recordings (>15 minutes) or invalid audio formats failing gracefully with clear feedback.
2. **Multi-Turn Email Parsing**: Recruiter email chains with multiple replies, signatures, and disclaimers extracted cleanly without hallucinating dates.
3. **Database Concurrency & Multi-Tenant Isolation**: Ensuring concurrent writes across different users do not lock SQLite or leak records between users.
4. **Idempotency on Email Webhook**: Inbound email delivery retries should update existing rounds rather than creating duplicate entries.
5. **Offline / Microphone Permissions Handling**: Gracefully handling microphone access rejection in the browser with immediate fallback to text scratchpad.

---

### Task 1: Multi-Tenant Data Schema & Migration Layer
Extend the database layer with multi-tenant tables: `users`, `interview_rounds`, and `interview_questions`, while preserving backwards compatibility with existing `jobs` and `applications`.

**Files:**
- Modify: `backend/app/models.py`
- Modify: `backend/app/database.py`
- Test: `backend/tests/test_saas_database.py`

**Steps:**
- [ ] 1. Write failing test `test_saas_database.py` testing creation of user tenant, interview rounds, and questions repository.
- [ ] 2. Run `pytest backend/tests/test_saas_database.py` to confirm failure.
- [ ] 3. Add `User`, `InterviewRound`, `InterviewQuestion`, `RoundType`, and `RoundSource` Pydantic models in `backend/app/models.py`.
- [ ] 4. Update `Database._run_init_tables()` in `backend/app/database.py` to create `users`, `interview_rounds`, and `interview_questions` tables with foreign keys and indexes.
- [ ] 5. Implement CRUD helper methods: `create_user`, `get_user_by_email`, `save_interview_round`, `list_interview_rounds_for_company`, and `save_interview_question`.
- [ ] 6. Run `pytest backend/tests/test_saas_database.py` to confirm tests pass.
- [ ] 7. Commit changes with message `"feat(db): implement multi-tenant interview round and question schemas"`.

---

### Task 2: Multi-Modal AI Contextual Parser Service
Build the reasoning service that accepts raw unstructured text (scratchpad, email text, or audio transcripts) and outputs a structured `InterviewRound` and list of `InterviewQuestion` objects using Gemini / OpenAI JSON schemas.

**Files:**
- Create: `backend/app/services/interview_parser_service.py`
- Test: `backend/tests/test_interview_parser_service.py`

**Steps:**
- [ ] 1. Write failing test `test_interview_parser_service.py` with mock recruiter emails and voice memo transcripts.
- [ ] 2. Run `pytest backend/tests/test_interview_parser_service.py` to verify failure.
- [ ] 3. Implement `parse_unstructured_interview_note(raw_text: str, source_type: str) -> ParsedInterviewContext` in `interview_parser_service.py`.
- [ ] 4. Add heuristic/LLM extraction for: company name, round number, round type, interviewer names, questions asked, candidate feedback, and next scheduled dates.
- [ ] 5. Implement prompt injection defenses and tag sanitization using `sanitize_untrusted_text`.
- [ ] 6. Run `pytest backend/tests/test_interview_parser_service.py` to confirm tests pass.
- [ ] 7. Commit changes with message `"feat(ai): build multi-modal interview context parser service"`.

---

### Task 3: Audio Transcription Engine & File Upload API
Build the audio upload endpoint and transcription pipeline using Gemini multi-modal audio or local Whisper fallback.

**Files:**
- Create: `backend/app/services/transcription_service.py`
- Create: `backend/app/routers/ingest.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_transcription_api.py`

**Steps:**
- [ ] 1. Write failing test `test_transcription_api.py` testing multipart audio file upload (`/api/ingest/voice`) and scratchpad text ingestion (`/api/ingest/text`).
- [ ] 2. Run `pytest backend/tests/test_transcription_api.py` to verify failure.
- [ ] 3. Implement `transcribe_audio_file(file_path: str) -> str` in `transcription_service.py`.
- [ ] 4. Build `/api/ingest/voice` and `/api/ingest/text` routes in `backend/app/routers/ingest.py`.
- [ ] 5. Register router in `backend/app/main.py`.
- [ ] 6. Run `pytest backend/tests/test_transcription_api.py` to confirm tests pass.
- [ ] 7. Commit changes with message `"feat(api): add audio voice memo upload and transcription routes"`.

---

### Task 4: Inbound Email Webhook & Calendar Invite Parser
Create an inbound email webhook endpoint (`/api/webhooks/inbound-email`) that parses recruiter invitations from SendGrid, Postmark, or Resend Inbound.

**Files:**
- Create: `backend/app/routers/webhooks.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_email_webhook.py`

**Steps:**
- [ ] 1. Write failing test `test_email_webhook.py` simulating inbound JSON email webhook payloads with `.ics` calendar attachments and email bodies.
- [ ] 2. Run `pytest backend/tests/test_email_webhook.py` to verify failure.
- [ ] 3. Implement webhook verification and email body cleaning in `backend/app/routers/webhooks.py`.
- [ ] 4. Connect inbound email to `interview_parser_service` and match by user's inbound email token and company name.
- [ ] 5. Register router in `backend/app/main.py`.
- [ ] 6. Run `pytest backend/tests/test_email_webhook.py` to confirm tests pass.
- [ ] 7. Commit changes with message `"feat(webhooks): build inbound recruiter email webhook parser"`.

---

### Task 5: AI Interview Prep Briefing & Predicted Questions Generator
Build the intelligence service that analyzes previous rounds, company history, and job specs to produce a pre-round briefing with predicted questions and key topics to review.

**Files:**
- Create: `backend/app/services/prep_service.py`
- Create: `backend/app/routers/interview_rounds.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_prep_service.py`

**Steps:**
- [ ] 1. Write failing test `test_prep_service.py` testing round cheat sheet generation and round listing/update API endpoints.
- [ ] 2. Run `pytest backend/tests/test_prep_service.py` to verify failure.
- [ ] 3. Implement `generate_round_prep_briefing(company_id: str, round_id: str) -> RoundPrepBriefing` in `prep_service.py`.
- [ ] 4. Implement CRUD endpoints in `backend/app/routers/interview_rounds.py`:
  - `GET /api/companies/{company_id}/rounds`
  - `POST /api/companies/{company_id}/rounds`
  - `GET /api/rounds/{round_id}/prep`
  - `POST /api/rounds/{round_id}/thank-you`
- [ ] 5. Register router in `backend/app/main.py`.
- [ ] 6. Run `pytest backend/tests/test_prep_service.py` to confirm tests pass.
- [ ] 7. Commit changes with message `"feat(prep): implement AI round prep briefing and thank-you generator"`.

---

### Task 6: Frontend Apple Audio Voice Note Visualizer & Recorder
Build an interactive Apple HIG voice memo widget that captures audio from the user's browser, visualizes the waveform, and streams the recording to the backend for instant round structuring.

**Files:**
- Create: `frontend/src/components/VoiceRecorderModal.tsx`
- Create: `frontend/src/services/audioRecorder.ts`
- Test: `frontend/src/tests/VoiceRecorderModal.test.tsx` (or build verification)

**Steps:**
- [ ] 1. Create `audioRecorder.ts` utility using the browser MediaRecorder API with audio chunk streaming.
- [ ] 2. Build `VoiceRecorderModal.tsx` styled to Apple Design System:
  - Frosted glass modal (`material-regular`, `rounded-[20px]`, `shadow-apple-5`)
  - Live animated audio visualizer waveform (red/blue Apple recording bar)
  - Timer and tactile record/pause/stop Apple buttons (`btn-apple-primary`, active spring)
  - Instant transcript preview and company assignment dropdown.
- [ ] 3. Integrate into application navigation and test build via `bun run build`.
- [ ] 4. Commit changes with message `"feat(ui): implement Apple HIG voice memo recorder with live audio visualizer"`.

---

### Task 7: Frontend Company Interview Rounds Timeline & Scorecard CRM
Design the multi-round timeline view for each company: displaying chronological rounds (Screen, Technical, System Design, Final), questions asked, feedback, and 1-click Prep Briefing.

**Files:**
- Create: `frontend/src/components/CompanyRoundsTimeline.tsx`
- Create: `frontend/src/components/RoundDetailModal.tsx`
- Modify: `frontend/src/components/ApplicationsTracker.tsx`
- Modify: `frontend/src/types/index.ts`

**Steps:**
- [ ] 1. Add TypeScript models for `InterviewRound`, `InterviewQuestion`, and `RoundPrepBriefing` in `frontend/src/types/index.ts`.
- [ ] 2. Build `CompanyRoundsTimeline.tsx` with vertical Apple timeline indicators, semantic status colors, and confidence rating chips.
- [ ] 3. Build `RoundDetailModal.tsx` with questions repository, candidate reflection notes, and 1-click "Generate Thank You Email" button.
- [ ] 4. Link company rows in `ApplicationsTracker.tsx` to open the timeline CRM.
- [ ] 5. Verify build with `bun run build`.
- [ ] 6. Commit changes with message `"feat(ui): build interview rounds timeline and drill-down CRM"`.

---

### Task 8: Full End-to-End Integration, Red-Teaming & SaaS Multi-User Stress
Verify the complete end-to-end multi-modal flow: Audio voice note ➔ Transcription ➔ AI contextual round extraction ➔ CRM timeline visualization ➔ AI prep briefing.

**Files:**
- Create: `backend/tests/test_saas_e2e_flow.py`
- Modify: `backend/tests/test_adversarial_break_app.py`

**Steps:**
- [ ] 1. Build `test_saas_e2e_flow.py` simulating multiple users independently recording voice notes and receiving structured rounds.
- [ ] 2. Run adversarial red-teaming tests: corrupted audio files, malformed email forwarding headers, and concurrent voice uploads.
- [ ] 3. Run full backend test suite (`pytest backend/tests/ -v`).
- [ ] 4. Run frontend production build (`bun run build`).
- [ ] 5. Commit changes with message `"test(saas): verify complete multi-tenant AI interview notetaker lifecycle"`.
- [ ] 6. Push to GitHub repository (`origin main`).
