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

        # Test Profile
        profile = await db.get_profile()
        assert profile.name == "Kunal Gursal"
        profile.name = "Kunal G."
        await db.save_profile(profile)
        updated_profile = await db.get_profile()
        assert updated_profile.name == "Kunal G."

        # Test Settings
        settings = await db.get_settings()
        assert settings.autonomous_mode is False
        settings.autonomous_mode = True
        await db.save_settings(settings)
        updated_settings = await db.get_settings()
        assert updated_settings.autonomous_mode is True

        # Test Audit Log
        await db.log_audit("EMAIL_SENT", "Test email sent to careers@acme.ai", "SUCCESS")
        count = await db.count_sent_today()
        assert count == 1
