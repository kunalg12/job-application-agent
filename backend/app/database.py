from contextlib import asynccontextmanager
import aiosqlite
import json
import os
from typing import Optional, List, Dict, Any
from pathlib import Path
from backend.app.models import Job, Application, UserProfile, AppSettings, AuditLog

class Database:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

    @asynccontextmanager
    async def get_connection(self):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            yield db

    async def init_db(self) -> None:
        async with self.get_connection() as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    company TEXT NOT NULL,
                    location TEXT,
                    description TEXT,
                    url TEXT UNIQUE,
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
            await db.commit()

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
