import pytest
import os
import tempfile
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.config import settings
from backend.app.database import Database
from backend.app.models import Job, UserProfile, SMTPSettings

@pytest.mark.asyncio
async def test_job_duplicate_url_and_unroutable():
    db = Database(settings.db_path)
    await db.init_db()

    # Job 1 with url
    job1 = Job(
        id="job_a",
        title="Title A",
        company="Company A",
        url="https://common.url/job",
        description="desc A"
    )
    await db.save_job(job1)

    # Job 2 with different id but same url should not crash SQLite
    job2 = Job(
        id="job_b",
        title="Title B",
        company="Company B",
        url="https://common.url/job",
        description="desc B"
    )
    await db.save_job(job2)
    
    # Staging an unroutable job (no email, no url)
    job_unroutable = Job(
        id="job_nourl",
        title="Offline Gig",
        company="Local Shop",
        url="",
        recruiter_email=None,
        description="Word of mouth only."
    )
    await db.save_job(job_unroutable)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        stage_res = await client.post("/api/applications/stage/job_nourl")
        assert stage_res.status_code == 200
        assert stage_res.json()["status"] == "UNROUTABLE"

@pytest.mark.asyncio
async def test_resume_upload_path_traversal_sanitized(tmp_path):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("../../etc/malicious.txt", b"Name: Safe User\nSkills: Python, FastAPI", "text/plain")}
        res = await client.post("/api/profile/upload-resume", files=files)
        assert res.status_code == 200
        data = res.json()
        assert data["resume_file_path"] is not None
        assert ".." not in data["resume_file_path"]

@pytest.mark.asyncio
async def test_send_email_validates_resume_existence():
    db = Database(settings.db_path)
    await db.init_db()

    profile = UserProfile(
        name="Kunal Gursal",
        email="kunalgursal.dev@gmail.com",
        resume_file_path="/nonexistent/missing_resume.pdf"
    )
    await db.save_profile(profile)

    app_settings = await db.get_settings()
    app_settings.smtp = SMTPSettings(username="user@test.com", password="pwd")
    await db.save_settings(app_settings)

    job = Job(
        id="job_with_email",
        title="Engineer",
        company="Acme",
        url="https://acme.com",
        recruiter_email="hiring@acme.com",
        description="Python"
    )
    await db.save_job(job)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/applications/stage/job_with_email")
        
        # Trying to send email when resume file does not exist should raise 400 with helpful message
        res = await client.post("/api/applications/app_job_with_email/email", json={"to_email": "hiring@acme.com"})
        assert res.status_code == 400
        assert "resume" in res.json()["detail"].lower()
