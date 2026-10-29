# 🛡️ Project Rules & Agent Execution Protocol

This document establishes the mandatory operating rules, pre-task checklists, testing standards, and adversarial "Break Your App" verification protocols for all AI agents working on this codebase.

---

## 📌 1. Core Operating Principles

1. **Zero-Assumption Rule (Keep Asking Questions)**:
   - Never guess business-critical logic, security boundaries, or edge-case handling.
   - If an edge case is unspecified (e.g., malformed PDF, duplicate job URL with different title, SMTP timeout, rate-limit collision), **ask clarifying questions** before implementing.
   - Discuss failure modes upfront: learn how systems get cracked, bypass defenses, or leak data.

2. **Security & Data Integrity First**:
   - Always sanitize input files (prevent directory traversal `../../`, null-byte injections, zip bombs).
   - Enforce database transaction safety (WAL mode, parameterized queries, unique URL integrity).
   - Keep secrets, tokens, and credentials outside of VCS. Never commit `.env` or plain text passwords.

3. **Evidence Before Assertions**:
   - Never claim a task, fix, or feature is complete without running verification commands and observing passing output.

---

## ✅ 2. Pre-Task Checklist (Must Complete Before Starting Any Task)

Before modifying or adding code, every agent must evaluate:

- [ ] **1. Requirements & Failure Analysis**:
  - What is the explicit goal of the task?
  - What are the potential failure modes? (e.g., network failure, malformed payload, race conditions, memory exhaustion).
- [ ] **2. Dependency & Impact Audit**:
  - Does this change require new libraries or schema migrations?
  - Which existing services, routers, or database tables are affected?
- [ ] **3. Clarification Check**:
  - Are there ambiguous requirements? If yes, pause and ask the user targeted questions with concrete trade-offs.
- [ ] **4. Test Planning**:
  - Define the specific Unit, Integration, and E2E test cases to be created *before* or alongside implementation.

---

## 🧪 3. Mandatory 3-Layer Testing Standards

Every feature or bugfix requires coverage across all three testing tiers:

### 1. Unit Tests (`backend/tests/unit/` or test modules)
- **Scope**: Pure logic in isolation without network or persistent DB dependency.
- **Coverage**:
  - Resume parser text extraction & regex keyword matching.
  - Heuristic & LLM fit scoring algorithms (boundary scores: 0%, 100%, negative inputs).
  - Data model validation, regex email parsers, payload sanitization.

### 2. Integration Tests (`backend/tests/integration/`)
- **Scope**: Multi-component interaction with an isolated test SQLite DB (`isolated_test_db`).
- **Coverage**:
  - Database CRUD operations, state transitions (`DISCOVERED` ➔ `STAGED` ➔ `SENT` / `UNROUTABLE`).
  - FastAPI router endpoints (request/response schemas, error status codes 400, 404, 422).
  - Background autonomous worker polling, rate-limit counters, and audit log generation.

### 3. End-to-End (E2E) Tests (`backend/tests/e2e/`)
- **Scope**: Complete end-to-end lifecycle verification.
- **Coverage**:
  - Job scraping/import ➔ Match scoring ➔ Profile tailoring ➔ PDF generation ➔ Staged review queue ➔ SMTP/Autofill dispatch.
  - Frontend production build check (`bun run build` / `npm run build` with TypeScript check).

---

## 💥 4. Mandatory Post-Task Adversarial Phase ("Break Your App")

After completing *every* task or feature, the agent must perform an adversarial testing pass ("Red-Teaming"):

1. **Input Fuzzing & Malicious Payloads**:
   - Test with empty strings, 50,000-character strings, null bytes, special characters (`<script>`, SQL injection strings, `../../path/traversal`).
   - Test with corrupt PDFs, password-protected PDFs, and non-PDF files masquerading as PDFs.

2. **Network & External Service Chaos**:
   - Simulate SMTP server disconnects, invalid TLS handshakes, bad credentials, and socket timeouts.
   - Simulate job board APIs returning `502 Bad Gateway`, invalid JSON, or empty HTML bodies.

3. **State Machine & Idempotency Violations**:
   - What happens if the same job is imported twice simultaneously?
   - What happens if a user clicks "Apply" three times in rapid succession?
   - What happens if an application is dispatched without a generated resume or cover letter?

---

## 👥 5. Multi-User & Concurrency Simulation (Optional / Load Stress)

When requested or when working on shared resources (database, rate limiters, background jobs):

1. **Concurrent Request Simulation**:
   - Use `asyncio.gather` or `httpx.AsyncClient` to fire 20–50 concurrent requests.
2. **Race Condition & Locking Checks**:
   - Verify SQLite does not produce `sqlite3.OperationalError: database is locked`.
   - Verify that daily email limits (`daily_application_limit`) are not breached during concurrent dispatch races.
3. **Worker Contention**:
   - Ensure the background autonomous worker does not re-process or duplicate jobs being actively edited in the review queue.

---

## ❓ 6. Agent Inquiry Protocol (Always Ask & Learn)

When in doubt, prompt the user with sharp, specific architectural questions:
- *"How should the app handle rate limits when multiple remote APIs fail simultaneously?"*
- *"Should candidate contact info be redacting when exporting application logs?"*
- *"If an ATS form has CAPTCHA or two-factor authentication, should the agent fail immediately or notify via webhook?"*
