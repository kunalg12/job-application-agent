from contextlib import asynccontextmanager
import aiosqlite
import json
import os
from typing import Optional, List, Dict, Any
from pathlib import Path
from backend.app.models import (
    Job, Application, UserProfile, AppSettings, AuditLog,
    User, InterviewRound, InterviewQuestion
)

class Database:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._initialized = False
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

    @asynccontextmanager
    async def get_connection(self):
        if not self._initialized:
            await self._run_init_tables()
            self._initialized = True
        async with aiosqlite.connect(self.db_path, timeout=30.0) as db:
            await db.execute("PRAGMA busy_timeout = 30000;")
            db.row_factory = aiosqlite.Row
            yield db

    async def _run_init_tables(self) -> None:
        async with aiosqlite.connect(self.db_path, timeout=30.0) as db:
            await db.execute("PRAGMA journal_mode=WAL;")
            await db.execute("PRAGMA busy_timeout = 30000;")
            await db.execute("PRAGMA synchronous = NORMAL;")
            await db.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    company TEXT NOT NULL,
                    location TEXT,
                    description TEXT,
                    url TEXT,
                    source TEXT,
                    recruiter_email TEXT,
                    salary TEXT,
                    tags TEXT,
                    created_at TEXT
                )
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS applications (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    job_title TEXT NOT NULL,
                    company TEXT NOT NULL,
                    match_score INTEGER DEFAULT 0,
                    recruiter_email TEXT,
                    application_url TEXT,
                    status TEXT DEFAULT 'DISCOVERED',
                    email_subject TEXT,
                    email_body TEXT,
                    cover_letter TEXT,
                    cover_letter_pdf_path TEXT,
                    matched_skills TEXT,
                    missing_skills TEXT,
                    notes TEXT,
                    applied_at TEXT,
                    created_at TEXT,
                    FOREIGN KEY (job_id) REFERENCES jobs (id)
                )
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS profile (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    data TEXT NOT NULL
                )
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    data TEXT NOT NULL
                )
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    event_type TEXT,
                    details TEXT,
                    status TEXT
                )
            """)

            # --- SaaS Multi-Tenant Tables ---
            await db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    inbound_email_token TEXT UNIQUE NOT NULL,
                    subscription_tier TEXT DEFAULT 'FREE',
                    created_at TEXT NOT NULL
                )
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS interview_rounds (
                    id TEXT PRIMARY KEY,
                    company_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    round_number INTEGER DEFAULT 1,
                    round_title TEXT NOT NULL,
                    round_type TEXT NOT NULL,
                    scheduled_at TEXT,
                    duration_minutes INTEGER DEFAULT 45,
                    meeting_link TEXT,
                    interviewer_info TEXT,
                    raw_input_source TEXT NOT NULL,
                    raw_input_text TEXT,
                    audio_url TEXT,
                    summary TEXT,
                    candidate_feeling TEXT,
                    feedback_received TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS interview_questions (
                    id TEXT PRIMARY KEY,
                    round_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    question_text TEXT NOT NULL,
                    question_category TEXT DEFAULT 'GENERAL',
                    candidate_answer_notes TEXT,
                    areas_to_improve TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (round_id) REFERENCES interview_rounds(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)

            # Auto-migrate meeting_link on interview_rounds if missing
            try:
                await db.execute("ALTER TABLE interview_rounds ADD COLUMN meeting_link TEXT;")
            except Exception:
                pass

            await db.execute("CREATE INDEX IF NOT EXISTS idx_rounds_user_company ON interview_rounds(user_id, company_id);")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_questions_round ON interview_questions(user_id, round_id);")
            await db.commit()

    async def init_db(self) -> None:
        await self._run_init_tables()
        self._initialized = True

    async def save_job(self, job: Job) -> None:
        async with self.get_connection() as db:
            await db.execute("""
                INSERT INTO jobs (id, title, company, location, description, url, source, recruiter_email, salary, tags, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    company=excluded.company,
                    location=excluded.location,
                    description=excluded.description,
                    recruiter_email=excluded.recruiter_email,
                    salary=excluded.salary,
                    tags=excluded.tags
            """, (
                job.id, job.title, job.company, job.location, job.description,
                job.url, job.source, job.recruiter_email, job.salary,
                json.dumps(job.tags), job.created_at
            ))
            await db.commit()

    async def get_job_by_id(self, job_id: str) -> Optional[Job]:
        async with self.get_connection() as db:
            async with db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)) as cursor:
                row = await cursor.fetchone()
                if not row:
                    return None
                data = dict(row)
                data["tags"] = json.loads(data["tags"]) if data.get("tags") else []
                return Job(**data)

    async def list_jobs(self, limit: int = 100, offset: int = 0) -> List[Job]:
        async with self.get_connection() as db:
            async with db.execute("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset)) as cursor:
                rows = await cursor.fetchall()
                jobs = []
                for row in rows:
                    data = dict(row)
                    data["tags"] = json.loads(data["tags"]) if data.get("tags") else []
                    jobs.append(Job(**data))
                return jobs

    async def save_application(self, app: Application) -> None:
        async with self.get_connection() as db:
            await db.execute("""
                INSERT INTO applications (
                    id, job_id, job_title, company, match_score, recruiter_email, application_url,
                    status, email_subject, email_body, cover_letter, cover_letter_pdf_path,
                    matched_skills, missing_skills, notes, applied_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    status=excluded.status,
                    match_score=excluded.match_score,
                    recruiter_email=excluded.recruiter_email,
                    email_subject=excluded.email_subject,
                    email_body=excluded.email_body,
                    cover_letter=excluded.cover_letter,
                    cover_letter_pdf_path=excluded.cover_letter_pdf_path,
                    matched_skills=excluded.matched_skills,
                    missing_skills=excluded.missing_skills,
                    notes=excluded.notes,
                    applied_at=excluded.applied_at
            """, (
                app.id, app.job_id, app.job_title, app.company, app.match_score,
                app.recruiter_email, app.application_url, app.status,
                app.email_subject, app.email_body, app.cover_letter, app.cover_letter_pdf_path,
                json.dumps(app.matched_skills), json.dumps(app.missing_skills),
                app.notes, app.applied_at, app.created_at
            ))
            await db.commit()

    async def update_application_status(self, app_id: str, status: str, notes: Optional[str] = None) -> None:
        async with self.get_connection() as db:
            if notes is not None:
                await db.execute("UPDATE applications SET status = ?, notes = ? WHERE id = ?", (status, notes, app_id))
            else:
                await db.execute("UPDATE applications SET status = ? WHERE id = ?", (status, app_id))
            await db.commit()

    async def get_application_by_id(self, app_id: str) -> Optional[Application]:
        async with self.get_connection() as db:
            async with db.execute("SELECT * FROM applications WHERE id = ?", (app_id,)) as cursor:
                row = await cursor.fetchone()
                if not row:
                    return None
                data = dict(row)
                data["matched_skills"] = json.loads(data["matched_skills"]) if data.get("matched_skills") else []
                data["missing_skills"] = json.loads(data["missing_skills"]) if data.get("missing_skills") else []
                return Application(**data)

    async def list_applications(self, limit: int = 100) -> List[Application]:
        async with self.get_connection() as db:
            async with db.execute("SELECT * FROM applications ORDER BY created_at DESC LIMIT ?", (limit,)) as cursor:
                rows = await cursor.fetchall()
                apps = []
                for row in rows:
                    data = dict(row)
                    data["matched_skills"] = json.loads(data["matched_skills"]) if data.get("matched_skills") else []
                    data["missing_skills"] = json.loads(data["missing_skills"]) if data.get("missing_skills") else []
                    apps.append(Application(**data))
                return apps

    async def get_profile(self) -> UserProfile:
        async with self.get_connection() as db:
            async with db.execute("SELECT data FROM profile WHERE id = 1") as cursor:
                row = await cursor.fetchone()
                if row:
                    return UserProfile(**json.loads(row["data"]))
                profile = UserProfile()
                await self.save_profile(profile)
                return profile

    async def save_profile(self, profile: UserProfile) -> None:
        async with self.get_connection() as db:
            await db.execute("""
                INSERT INTO profile (id, data) VALUES (1, ?)
                ON CONFLICT(id) DO UPDATE SET data=excluded.data
            """, (profile.model_dump_json(),))
            await db.commit()

    async def get_settings(self) -> AppSettings:
        async with self.get_connection() as db:
            async with db.execute("SELECT data FROM settings WHERE id = 1") as cursor:
                row = await cursor.fetchone()
                if row:
                    return AppSettings(**json.loads(row["data"]))
                cfg = AppSettings()
                await self.save_settings(cfg)
                return cfg

    async def save_settings(self, settings_obj: AppSettings) -> None:
        async with self.get_connection() as db:
            await db.execute("""
                INSERT INTO settings (id, data) VALUES (1, ?)
                ON CONFLICT(id) DO UPDATE SET data=excluded.data
            """, (settings_obj.model_dump_json(),))
            await db.commit()

    async def log_audit(self, event_type: str, details: str, status: str = "SUCCESS") -> None:
        async with self.get_connection() as db:
            await db.execute("""
                INSERT INTO audit_logs (timestamp, event_type, details, status)
                VALUES (datetime('now'), ?, ?, ?)
            """, (event_type, details, status))
            await db.commit()

    async def count_sent_today(self) -> int:
        async with self.get_connection() as db:
            async with db.execute("""
                SELECT COUNT(*) as count FROM audit_logs
                WHERE event_type IN ('EMAIL_SENT', 'FORM_SUBMITTED')
                AND date(timestamp) = date('now')
                AND status = 'SUCCESS'
            """) as cursor:
                row = await cursor.fetchone()
                return row["count"] if row else 0

    # --- SaaS Multi-Tenant & Interview CRM Methods ---

    async def create_user(self, user: User) -> None:
        async with self.get_connection() as db:
            await db.execute("""
                INSERT INTO users (id, email, name, inbound_email_token, subscription_tier, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name,
                    subscription_tier=excluded.subscription_tier
            """, (user.id, user.email, user.name, user.inbound_email_token, user.subscription_tier, user.created_at))
            await db.commit()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        async with self.get_connection() as db:
            async with db.execute("SELECT * FROM users WHERE email = ?", (email,)) as cursor:
                row = await cursor.fetchone()
                return User(**dict(row)) if row else None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        async with self.get_connection() as db:
            async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cursor:
                row = await cursor.fetchone()
                return User(**dict(row)) if row else None

    async def get_user_by_inbound_token(self, token: str) -> Optional[User]:
        async with self.get_connection() as db:
            async with db.execute("SELECT * FROM users WHERE inbound_email_token = ?", (token,)) as cursor:
                row = await cursor.fetchone()
                return User(**dict(row)) if row else None

    async def save_interview_round(self, round_obj: InterviewRound) -> None:
        async with self.get_connection() as db:
            await db.execute("""
                INSERT INTO interview_rounds (
                    id, company_id, user_id, round_number, round_title, round_type,
                    scheduled_at, duration_minutes, meeting_link, interviewer_info, raw_input_source,
                    raw_input_text, audio_url, summary, candidate_feeling, feedback_received, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    round_title=excluded.round_title,
                    round_type=excluded.round_type,
                    scheduled_at=excluded.scheduled_at,
                    duration_minutes=excluded.duration_minutes,
                    meeting_link=excluded.meeting_link,
                    interviewer_info=excluded.interviewer_info,
                    raw_input_source=excluded.raw_input_source,
                    raw_input_text=excluded.raw_input_text,
                    audio_url=excluded.audio_url,
                    summary=excluded.summary,
                    candidate_feeling=excluded.candidate_feeling,
                    feedback_received=excluded.feedback_received
                WHERE interview_rounds.user_id = excluded.user_id
            """, (
                round_obj.id, round_obj.company_id, round_obj.user_id, round_obj.round_number,
                round_obj.round_title, round_obj.round_type.value if hasattr(round_obj.round_type, 'value') else round_obj.round_type,
                round_obj.scheduled_at, round_obj.duration_minutes, round_obj.meeting_link, json.dumps(round_obj.interviewer_info),
                round_obj.raw_input_source.value if hasattr(round_obj.raw_input_source, 'value') else round_obj.raw_input_source,
                round_obj.raw_input_text, round_obj.audio_url, round_obj.summary, round_obj.candidate_feeling,
                round_obj.feedback_received, round_obj.created_at
            ))
            await db.commit()

    async def list_interview_rounds_for_user(self, user_id: str) -> List[InterviewRound]:
        async with self.get_connection() as db:
            async with db.execute(
                "SELECT * FROM interview_rounds WHERE user_id = ? ORDER BY round_number ASC, created_at ASC",
                (user_id,)
            ) as cursor:
                rows = await cursor.fetchall()
                rounds = []
                for row in rows:
                    data = dict(row)
                    data["interviewer_info"] = json.loads(data["interviewer_info"]) if data.get("interviewer_info") else []
                    rounds.append(InterviewRound(**data))
                return rounds

    async def list_interview_rounds_for_company(self, user_id: str, company_id: str) -> List[InterviewRound]:
        async with self.get_connection() as db:
            async with db.execute(
                "SELECT * FROM interview_rounds WHERE user_id = ? AND company_id = ? COLLATE NOCASE ORDER BY round_number ASC, created_at ASC",
                (user_id, company_id)
            ) as cursor:
                rows = await cursor.fetchall()
                rounds = []
                for row in rows:
                    data = dict(row)
                    data["interviewer_info"] = json.loads(data["interviewer_info"]) if data.get("interviewer_info") else []
                    rounds.append(InterviewRound(**data))
                return rounds

    async def get_interview_round_by_id(self, user_id: str, round_id: str) -> Optional[InterviewRound]:
        async with self.get_connection() as db:
            async with db.execute(
                "SELECT * FROM interview_rounds WHERE user_id = ? AND id = ?",
                (user_id, round_id)
            ) as cursor:
                row = await cursor.fetchone()
                if not row:
                    return None
                data = dict(row)
                data["interviewer_info"] = json.loads(data["interviewer_info"]) if data.get("interviewer_info") else []
                return InterviewRound(**data)

    async def save_interview_question(self, question: InterviewQuestion) -> None:
        async with self.get_connection() as db:
            await db.execute("""
                INSERT INTO interview_questions (
                    id, round_id, user_id, question_text, question_category, candidate_answer_notes, areas_to_improve, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    question_text=excluded.question_text,
                    question_category=excluded.question_category,
                    candidate_answer_notes=excluded.candidate_answer_notes,
                    areas_to_improve=excluded.areas_to_improve
            """, (
                question.id, question.round_id, question.user_id, question.question_text,
                question.question_category, question.candidate_answer_notes, question.areas_to_improve, question.created_at
            ))
            await db.commit()

    async def list_questions_for_round(self, user_id: str, round_id: str) -> List[InterviewQuestion]:
        async with self.get_connection() as db:
            async with db.execute(
                "SELECT * FROM interview_questions WHERE user_id = ? AND round_id = ? ORDER BY created_at ASC",
                (user_id, round_id)
            ) as cursor:
                rows = await cursor.fetchall()
                return [InterviewQuestion(**dict(row)) for row in rows]
